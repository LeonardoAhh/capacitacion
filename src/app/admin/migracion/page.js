'use client';

import { useState, useRef } from 'react';
import {
  collection, getDocs, query, orderBy,
  doc, getDoc, updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import styles from './migracion.module.css';

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
function isDriveUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('firebasestorage.googleapis.com')) return false;
  return (
    url.includes('drive.google.com') ||
    url.includes('lh3.googleusercontent.com') ||
    url.includes('/api/drive-image')
  );
}

function extractFileId(url) {
  if (!url) return null;
  let m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  m = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  return null;
}

function extractImageFields(slide) {
  const fields = [];
  const d = slide.data || {};
  if (isDriveUrl(d.image)) fields.push({ fieldPath: 'data.image', url: d.image });
  if (isDriveUrl(d.background)) fields.push({ fieldPath: 'data.background', url: d.background });
  if (Array.isArray(d.images)) d.images.forEach((url, i) => { if (isDriveUrl(url)) fields.push({ fieldPath: `data.images.${i}`, url }); });
  if (Array.isArray(d.steps)) d.steps.forEach((s, i) => { if (isDriveUrl(s?.image)) fields.push({ fieldPath: `data.steps.${i}.image`, url: s.image }); });
  if (Array.isArray(d.items)) d.items.forEach((it, i) => { if (isDriveUrl(it?.image)) fields.push({ fieldPath: `data.items.${i}.image`, url: it.image }); });
  if (Array.isArray(d.elements)) d.elements.forEach((el, i) => { if (el?.kind === 'image' && isDriveUrl(el?.src)) fields.push({ fieldPath: `data.elements.${i}.src`, url: el.src }); });
  if (isDriveUrl(d.bgMedia?.url)) fields.push({ fieldPath: 'data.bgMedia.url', url: d.bgMedia.url });
  return fields;
}

async function tryFetch(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return null;
    const blob = await res.blob();
    if (blob.size < 100) return null;
    return { blob, contentType: ct };
  } catch { return null; }
}

async function downloadImage(driveUrl) {
  const fileId = extractFileId(driveUrl);
  if (fileId) {
    const r1 = await tryFetch(`/api/drive-image?id=${fileId}&sz=w1200`);
    if (r1) return r1;
    const r2 = await tryFetch(`https://lh3.googleusercontent.com/d/${fileId}=w1200`);
    if (r2) return r2;
    const r3 = await tryFetch(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`);
    if (r3) return r3;
    throw new Error(`Archivo no accesible en Drive (puede haber sido eliminado)`);
  }
  const r = await tryFetch(driveUrl);
  if (r) return r;
  throw new Error(`No se pudo descargar: ${driveUrl.slice(0, 60)}`);
}

async function uploadImage(blob, contentType, courseId, slideId) {
  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg').replace('svg+xml', 'svg') || 'jpg';
  const storageRef = ref(storage, `course_assets/${courseId}/${slideId}_${Date.now()}.${ext}`);
  const snap = await uploadBytes(storageRef, blob, { contentType, cacheControl: 'public, max-age=31536000, immutable' });
  return await getDownloadURL(snap.ref);
}

async function updateField(courseId, slideId, fieldPath, newUrl) {
  const slideRef = doc(db, 'cursos', courseId, 'slides', slideId);
  const hasIndex = fieldPath.split('.').some(s => /^\d+$/.test(s));
  if (!hasIndex) {
    await updateDoc(slideRef, { [fieldPath]: newUrl });
    return;
  }
  const snap = await getDoc(slideRef);
  if (!snap.exists()) throw new Error('Slide no encontrado');
  const data = snap.data();
  const segs = fieldPath.split('.');
  const topKey = segs[0];
  const target = data[topKey];
  let cursor = target;
  for (let i = 1; i < segs.length - 1; i++) {
    const k = /^\d+$/.test(segs[i]) ? Number(segs[i]) : segs[i];
    cursor = cursor[k];
  }
  const last = segs[segs.length - 1];
  cursor[/^\d+$/.test(last) ? Number(last) : last] = newUrl;
  await updateDoc(slideRef, { [topKey]: target });
}

/* ─────────────────────────────────────────────────────────────
   Componente
───────────────────────────────────────────────────────────── */
export default function MigracionPage() {
  const [phase, setPhase] = useState('idle');
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, errors: 0 });
  const [errorMsg, setErrorMsg] = useState(null);
  const abortRef = useRef(false);

  /* ── Escanear ── */
  async function handleScan() {
    setPhase('scanning');
    abortRef.current = false;
    setCourses([]);
    setTasks([]);
    setErrorMsg(null);
    setProgress({ done: 0, total: 0, errors: 0 });

    try {
      const snap = await getDocs(query(collection(db, 'cursos'), orderBy('createdAt', 'desc')));
      const allTasks = [];
      const courseList = [];

      for (const cDoc of snap.docs) {
        const courseId = cDoc.id;
        const courseTitle = cDoc.data()?.title || courseId;
        const sSnap = await getDocs(query(collection(db, 'cursos', courseId, 'slides'), orderBy('order', 'asc')));
        const slides = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        courseList.push({ id: courseId, title: courseTitle, slideCount: slides.length });
        for (const slide of slides) {
          for (const { fieldPath, url } of extractImageFields(slide)) {
            allTasks.push({ courseId, courseTitle, slideId: slide.id, slideOrder: slide.order, slideType: slide.type, fieldPath, url, status: 'pending', newUrl: null, error: null });
          }
        }
      }

      setCourses(courseList);
      setTasks(allTasks);
      setProgress({ done: 0, total: allTasks.length, errors: 0 });
      setPhase('scanned');
    } catch (err) {
      setErrorMsg(err.message);
      setPhase('error');
    }
  }

  /* ── Migrar ── */
  async function handleMigrate(taskList) {
    setPhase('migrating');
    abortRef.current = false;
    setErrorMsg(null);

    let done = 0, errors = 0;

    for (const task of taskList) {
      if (abortRef.current) break;

      try {
        const { blob, contentType } = await downloadImage(task.url);
        const newUrl = await uploadImage(blob, contentType, task.courseId, task.slideId);
        await updateField(task.courseId, task.slideId, task.fieldPath, newUrl);

        task.status = 'ok';
        task.newUrl = newUrl;
        done++;
      } catch (err) {
        const msg = err?.message || String(err);
        task.status = 'error';
        task.error = msg;
        if (!errorMsg && !errors) setErrorMsg(msg);
        errors++;
        done++;
      }

      // Actualizar estado de la tarea en React (forzar re-render con copia del array)
      setTasks(prev => [...prev]);
      setProgress({ done, total: taskList.length, errors });
      await new Promise(r => setTimeout(r, 60));
    }

    setPhase('done');
  }

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const okCount = tasks.filter(t => t.status === 'ok').length;
  const errorCount = tasks.filter(t => t.status === 'error').length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Migración de imágenes</h1>
        <p className={styles.subtitle}>
          Mueve todas las imágenes de Google Drive a Firebase Storage para que sean permanentes y no dependan de tokens de acceso.
        </p>
      </div>

      {/* Acciones */}
      <div className={styles.actions}>
        {(phase === 'idle' || phase === 'error' || phase === 'scanned') && (
          <button className={styles.btnSecondary} onClick={handleScan}>
            🔍 {phase === 'idle' ? 'Escanear cursos' : 'Re-escanear'}
          </button>
        )}

        {phase === 'scanned' && tasks.length > 0 && (
          <button className={styles.btnPrimary} onClick={() => handleMigrate(tasks.filter(t => t.status === 'pending'))}>
            🚀 Migrar {pendingCount} imagen{pendingCount !== 1 ? 'es' : ''}
          </button>
        )}

        {phase === 'scanned' && tasks.length === 0 && (
          <p className={styles.allGood}>✅ No hay imágenes de Drive. ¡Todo está en Firebase!</p>
        )}

        {phase === 'scanning' && (
          <button className={styles.btnDisabled} disabled>Escaneando…</button>
        )}

        {phase === 'migrating' && (
          <button className={styles.btnDanger} onClick={() => { abortRef.current = true; }}>⏹ Detener</button>
        )}

        {phase === 'done' && (
          <>
            {errorCount > 0 && (
              <button className={styles.btnPrimary} onClick={() => {
                const errTasks = tasks.filter(t => t.status === 'error');
                errTasks.forEach(t => { t.status = 'pending'; t.error = null; });
                setTasks(prev => [...prev]);
                handleMigrate(errTasks);
              }}>
                🔄 Reintentar {errorCount} error{errorCount !== 1 ? 'es' : ''}
              </button>
            )}
            <button className={styles.btnSecondary} onClick={handleScan}>🔍 Re-escanear</button>
          </>
        )}
      </div>

      {/* Error */}
      {errorMsg && (
        <div className={styles.errorBox}><strong>Error:</strong> {errorMsg}</div>
      )}

      {/* Progreso */}
      {(phase === 'migrating' || phase === 'done') && progress.total > 0 && (
        <div className={styles.progressWrap}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <div className={styles.progressStats}>
            <span>{progress.done} / {progress.total}</span>
            <span className={styles.statOk}>✓ {okCount}</span>
            {errorCount > 0 && <span className={styles.statErr}>✗ {errorCount}</span>}
          </div>
        </div>
      )}

      {/* Cursos */}
      {courses.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Cursos escaneados ({courses.length})</h2>
          <div className={styles.courseGrid}>
            {courses.map(c => {
              const ct = tasks.filter(t => t.courseId === c.id);
              const co = ct.filter(t => t.status === 'ok').length;
              const ce = ct.filter(t => t.status === 'error').length;
              return (
                <div key={c.id} className={styles.courseCard}>
                  <span className={styles.courseTitle}>{c.title}</span>
                  <span className={styles.courseMeta}>{c.slideCount} slides · {ct.length} imagen{ct.length !== 1 ? 'es' : ''} en Drive</span>
                  {co > 0 && <span className={styles.badgeOk}>✓ {co} migradas</span>}
                  {ce > 0 && <span className={styles.badgeErr}>✗ {ce} errores</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista */}
      {tasks.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Imágenes {pendingCount > 0 && <span className={styles.badge}>{pendingCount} pendientes</span>}
          </h2>
          <div className={styles.taskList}>
            {tasks.map((task, i) => (
              <div key={i} className={`${styles.taskRow} ${styles[`taskRow_${task.status}`]}`}>
                <div className={styles.taskStatus}>
                  {task.status === 'pending' && <span className={styles.dot} />}
                  {task.status === 'ok' && <span className={styles.iconOk}>✓</span>}
                  {task.status === 'error' && <span className={styles.iconErr}>✗</span>}
                </div>
                <div className={styles.taskInfo}>
                  <span className={styles.taskCourse}>{task.courseTitle}</span>
                  <span className={styles.taskSlide}>Slide {task.slideOrder} · {task.slideType} · <code>{task.fieldPath}</code></span>
                  <span className={styles.taskUrl} title={task.url}>{task.url.slice(0, 80)}{task.url.length > 80 ? '…' : ''}</span>
                  {task.status === 'ok' && <span className={styles.taskNewUrl}>→ {task.newUrl?.slice(0, 80)}…</span>}
                  {task.status === 'error' && <span className={styles.taskError}>{task.error}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className={styles.doneMsg}>
          {errorCount === 0
            ? '🎉 ¡Migración completada sin errores!'
            : `⚠️ Completada con ${errorCount} error${errorCount !== 1 ? 'es' : ''}. Esos archivos ya no están en Drive.`}
        </div>
      )}
    </div>
  );
}
