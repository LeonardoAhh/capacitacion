'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { Button } from '@/components/ui/Button/Button';
import { Select } from '@/components/ui/Select/Select';
import { useToast } from '@/components/ui/Toast/Toast';
import { ShieldAlert, AlertTriangle, Printer, User, FileText, Upload } from 'lucide-react';
import styles from './page.module.css';

export default function ConstanciasPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const printRef = useRef(null);

    // Tab
    const [activeTab, setActiveTab] = useState('constancia');

    // ─── Constancia state ───
    const [employeeIdInput, setEmployeeIdInput] = useState('');
    const [employeeData, setEmployeeData] = useState(null);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [loadingEmp, setLoadingEmp] = useState(false);
    const [folio, setFolio] = useState('');

    // ─── LOTO state ───
    const [lotoIdInput, setLotoIdInput] = useState('');
    const [loadingLoto, setLoadingLoto] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [lotoData, setLotoData] = useState({
        name: '',
        id: '',
        department: '',
        position: '',
        photoUrl: '',
    });
    const photoInputRef = useRef(null);

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [authLoading, user, router]);

    // ─── Constancia handlers ───
    const handleSearch = useCallback(async () => {
        const id = employeeIdInput.trim();
        if (!id) return;
        setLoadingEmp(true);
        setEmployeeData(null);
        setCourses([]);
        setSelectedCourse(null);
        try {
            const snap = await getDoc(doc(db, 'training_records', id));
            if (!snap.exists()) {
                toast.error('No encontrado', `No existe registro para el empleado ${id}.`);
                setLoadingEmp(false);
                return;
            }
            const data = snap.data();
            const history = data.history || [];

            const approved = history
                .filter(h => h.status === 'approved' || (!h.status && parseFloat(h.score || h.qualification || 0) >= 70))
                .map(h => ({
                    name: h.courseName || h.course || '(Sin nombre)',
                    date: h.date || '',
                    score: parseFloat(h.score || h.qualification || 0),
                }))
                .reduce((acc, cur) => {
                    const existing = acc.find(a => a.name === cur.name);
                    if (!existing) acc.push(cur);
                    else if (cur.date > existing.date) Object.assign(existing, cur);
                    return acc;
                }, []);

            setEmployeeData({
                name: data.name || '',
                employeeId: data.employeeId || id,
                department: data.department || '',
                position: data.position || '',
            });
            setCourses(approved);
            if (approved.length === 1) setSelectedCourse(approved[0]);
            setFolio(`VTX-${id}-${Date.now().toString(36).toUpperCase()}`);
        } catch (err) {
            console.error(err);
            toast.error('Error', 'No se pudo consultar el registro del empleado.');
        } finally {
            setLoadingEmp(false);
        }
    }, [employeeIdInput, toast]);

    const handlePrint = useCallback(() => {
        const el = printRef.current;
        if (!el) return;
        const todayStr = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
        const printWindow = window.open('', '_blank', 'width=900,height=650');
        printWindow.document.write(`<!DOCTYPE html><html lang="es"><head>
<meta charset="utf-8"/>
<title>Constancia — ${employeeData?.name || ''}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Roboto:wght@400;500;600&display=swap');
  @page { size: letter portrait; margin: 2cm 2.5cm; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Roboto', sans-serif; background: #fff; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cert { display: flex; flex-direction: column; width: 100%; min-height: 100vh; background: #fff; }
  .accent { height: 6px; background: #1d4ed8; }
  .accent-bot { height: 3px; background: #1d4ed8; opacity: 0.35; margin-top: auto; }
  .cert-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem 1rem; border-bottom: 1px solid #e5e7eb; }
  .cert-logo { display: flex; align-items: center; gap: 0.6rem; }
  .cert-company { font-family: 'Montserrat', sans-serif; font-size: 1rem; font-weight: 800; letter-spacing: 0.06em; color: #111; }
  .cert-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem; font-size: 0.75rem; color: #6b7280; }
  .cert-body { padding: 2rem 2.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.85rem; text-align: center; }
  .cert-intro { font-family: 'Montserrat', sans-serif; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.18em; color: #1d4ed8; text-transform: uppercase; }
  .cert-text { font-size: 0.9rem; line-height: 1.6; color: #111; }
  .cert-employee { font-family: 'Montserrat', sans-serif; font-size: 1.75rem; font-weight: 700; color: #111; letter-spacing: -0.02em; margin: 0.25rem 0; }
  .cert-course { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; color: #1d4ed8; padding: 0.5rem 1.5rem; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; width: 100%; margin: 0.25rem 0; }
  .cert-sigs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; padding: 1.5rem 2.5rem 2rem; border-top: 1px solid #e5e7eb; margin-top: 4rem; }
  .sig-block { display: flex; flex-direction: column; align-items: center; gap: 0.3rem; }
  .sig-line { width: 100%; height: 1px; background: #111; margin-bottom: 0.4rem; }
  .sig-label { font-size: 0.7rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; text-align: center; }
  .sig-name { font-size: 0.75rem; font-weight: 600; color: #111; text-align: center; }
  img.logo { width: 44px; height: 44px; object-fit: contain; }
</style></head><body>
<div class="cert">
  <div class="accent"></div>
  <div class="cert-header">
    <div class="cert-logo">
      <img class="logo" src="${window.location.origin}/logo-vino-plastic.png" alt="Viñoplastic"/>
      <span class="cert-company">VIÑOPLASTIC</span>
    </div>
    <div class="cert-meta">
      <span>Folio: ${folio}</span>
      <span>${todayStr}</span>
    </div>
  </div>
  <div class="cert-body">
    <p class="cert-intro">Constancia de Capacitación</p>
    <p class="cert-text">La empresa <strong>Viñoplastic S.A. de C.V.</strong> hace constar que:</p>
    <p class="cert-employee">${employeeData?.name || ''}</p>
    <p class="cert-text">Con número de empleado <strong>${employeeData?.employeeId || ''}</strong>, adscrito al área de <strong>${employeeData?.department || ''}</strong>${employeeData?.position ? `, en el puesto de ${employeeData.position}` : ''}, ha concluido satisfactoriamente el curso:</p>
    <p class="cert-course">${selectedCourse?.name || ''}</p>
    ${selectedCourse?.date ? `<p class="cert-text">Completado el día <strong>${selectedCourse.date}</strong>.</p>` : ''}
    ${selectedCourse?.score > 0 ? `<p class="cert-text">Calificación obtenida: <strong>${selectedCourse.score}%</strong></p>` : ''}
  </div>
  <div class="cert-sigs">
    <div class="sig-block"><div class="sig-line"></div><p class="sig-label">Firma del Participante</p><p class="sig-name">${employeeData?.name || ''}</p></div>
    <div class="sig-block"><div class="sig-line"></div><p class="sig-label">Instructor / Evaluador</p><p class="sig-name">&nbsp;</p></div>
    <div class="sig-block"><div class="sig-line"></div><p class="sig-label">Recursos Humanos</p><p class="sig-name">&nbsp;</p></div>
  </div>
  <div class="accent-bot"></div>
</div>
<script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
</body></html>`);
        printWindow.document.close();
    }, [employeeData, selectedCourse, folio]);

    // ─── LOTO handlers ───
    const handleLotoSearch = useCallback(async () => {
        const id = lotoIdInput.trim();
        if (!id) return;
        setLoadingLoto(true);
        setLotoData({ name: '', id: '', department: '', position: '', photoUrl: '' });
        try {
            const snap = await getDoc(doc(db, 'training_records', id));
            if (!snap.exists()) {
                toast.error('No encontrado', `No existe registro para el empleado ${id}.`);
                return;
            }
            const data = snap.data();
            setLotoData({
                name: data.name || '',
                id: data.employeeId || id,
                department: data.area || data.department || '',
                position: data.position || '',
                photoUrl: '',
            });
        } catch (err) {
            console.error(err);
            toast.error('Error', 'No se pudo consultar el empleado.');
        } finally {
            setLoadingLoto(false);
        }
    }, [lotoIdInput, toast]);

    const handlePhotoUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file || !lotoData.id) return;
        setUploadingPhoto(true);
        try {
            const ext = file.name.split('.').pop();
            const storageRef = ref(storage, `loto_photos/${lotoData.id}.${ext}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);
            setLotoData(prev => ({ ...prev, photoUrl: downloadURL }));
            toast.success('Foto actualizada', 'La fotografía se cargó correctamente.');
        } catch (err) {
            console.error(err);
            toast.error('Error', 'No se pudo subir la fotografía.');
        } finally {
            setUploadingPhoto(false);
            if (photoInputRef.current) photoInputRef.current.value = '';
        }
    }, [lotoData.id, toast]);

    const handlePrintLoto = useCallback(() => {
        const printWindow = window.open('', '_blank', 'width=1000,height=750');
        const { name, id, department, photoUrl } = lotoData;
        const photoHtml = photoUrl
            ? `<img src="${photoUrl}" alt="Empleado" style="width:100%;height:100%;object-fit:cover;"/>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
        const stripe = 'repeating-linear-gradient(45deg,#ef4444,#ef4444 10px,#ffffff 10px,#ffffff 20px)';

        printWindow.document.write(`<!DOCTYPE html><html lang="es"><head>
<meta charset="utf-8"/>
<title>Tarjeta LOTO — ${name || 'Empleado'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=Roboto:wght@400;600;700&display=swap');
  @page { size: auto; margin: 8mm; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Roboto', sans-serif; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; display: flex; gap: 24px; padding: 16px; justify-content: center; align-items: flex-start; }
  .card { width: 290px; height: 540px; background: #fff; border: 1.5px solid #374151; display: flex; flex-direction: column; overflow: hidden; position: relative; }
  .stripe { height: 15px; flex-shrink: 0; background: ${stripe}; }
  .stripe-top { border-bottom: 1px solid #374151; }
  .stripe-bot { border-top: 1px solid #374151; margin-top: auto; }
  .hole { position: absolute; top: 22px; left: 50%; transform: translateX(-50%); width: 30px; height: 30px; border-radius: 50%; border: 4px solid #9ca3af; background: #fff; display: flex; align-items: center; justify-content: center; z-index: 2; }
  .hole-inner { width: 18px; height: 18px; border-radius: 50%; background: #e5e7eb; border: 1px solid #9ca3af; }
  .danger-red { margin: 44px 14px 0; background: #dc2626; color: #fff; text-align: center; padding: 8px 6px; border-radius: 10px 10px 0 0; border: 3px solid #b91c1c; }
  .danger-red h2 { font-family: 'Montserrat', sans-serif; font-size: 28px; font-weight: 900; letter-spacing: 6px; text-transform: uppercase; }
  .danger-black { margin: 0 14px 14px; background: #111; color: #fff; text-align: center; padding: 6px; border-radius: 0 0 10px 10px; }
  .danger-black h3 { font-family: 'Montserrat', sans-serif; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
  .danger-black p { font-size: 13px; font-weight: 600; color: #f87171; margin-top: 2px; }
  .card-body { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 0 20px; }
  .photo { width: 120px; height: 120px; border-radius: 8px; border: 4px solid #dc2626; overflow: hidden; background: #f3f4f6; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; }
  .data-lbl { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
  .data-val { font-family: 'Montserrat', sans-serif; font-size: 15px; font-weight: 700; color: #111; margin: 1px 0 0; line-height: 1.2; }
  .data-row { width: 100%; border-bottom: 2px solid #d1d5db; padding-bottom: 4px; }
  .data-row-split { width: 100%; display: flex; justify-content: space-between; gap: 8px; border-bottom: 2px solid #d1d5db; padding-bottom: 4px; }
  .card-footer { margin-top: auto; padding: 10px 14px; background: #fef2f2; border-top: 2px solid #fecaca; }
  .card-footer p { font-size: 9px; color: #991b1b; line-height: 1.4; text-align: justify; }
  .card-footer strong { font-weight: 700; color: #b91c1c; }
  .danger-red-round { margin: 44px 14px 20px; background: #dc2626; color: #fff; text-align: center; padding: 8px 6px; border-radius: 10px; border: 3px solid #b91c1c; }
  .danger-red-round h2 { font-family: 'Montserrat', sans-serif; font-size: 22px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; }
  .back-body { flex: 1; padding: 0 20px; display: flex; flex-direction: column; gap: 12px; }
  .field-lbl { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 3px; }
  .field-line { border-bottom: 2px solid #111; height: 22px; }
  .check-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .check-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #1f2937; }
  .check-box { width: 14px; height: 14px; border: 2px solid #111; flex-shrink: 0; }
  .date-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .sig-area { flex: 1; display: flex; flex-direction: column; }
  .sig-line { border-bottom: 2px solid #111; height: 56px; width: 100%; margin-top: auto; margin-bottom: 6px; }
  .stps-note { text-align: center; padding-bottom: 6px; font-size: 8px; color: #9ca3af; }
</style>
</head><body>
  <div class="card">
    <div class="stripe stripe-top"></div>
    <div class="hole"><div class="hole-inner"></div></div>
    <div class="danger-red"><h2>Peligro</h2></div>
    <div class="danger-black"><h3>Equipo Bloqueado</h3><p>NO OPERAR</p></div>
    <div class="card-body">
      <div class="photo">${photoHtml}</div>
      <div style="width:100%;display:flex;flex-direction:column;gap:8px;">
        <div class="data-row">
          <p class="data-lbl">Nombre</p>
          <p class="data-val" style="font-size:13px;">${name || '&nbsp;'}</p>
        </div>
        <div class="data-row-split">
          <div>
            <p class="data-lbl">Nómina</p>
            <p class="data-val" style="font-size:14px;">${id || '&nbsp;'}</p>
          </div>
          <div style="text-align:right;max-width:130px;">
            <p class="data-lbl">Depto.</p>
            <p class="data-val" style="font-size:11px;line-height:1.2;">${department || '&nbsp;'}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="card-footer">
      <p><strong>ADVERTENCIA LEGAL (NOM-004-STPS):</strong> Esta tarjeta y candado protegen mi vida. Removerlos sin autorización es una violación grave a las normas de seguridad.</p>
    </div>
    <div class="stripe stripe-bot"></div>
  </div>
  <div class="card">
    <div class="stripe stripe-top"></div>
    <div class="hole"><div class="hole-inner"></div></div>
    <div class="danger-red-round"><h2>Peligro</h2></div>
    <div class="back-body">
      <div>
        <p class="field-lbl">Equipo / Máquina:</p>
        <div class="field-line"></div>
      </div>
      <div>
        <p class="field-lbl" style="margin-bottom:6px;">Motivo del Bloqueo:</p>
        <div class="check-grid">
          <div class="check-item"><div class="check-box"></div> Mantenimiento</div>
          <div class="check-item"><div class="check-box"></div> Cambio Molde</div>
          <div class="check-item"><div class="check-box"></div> Limpieza</div>
          <div class="check-item"><div class="check-box"></div> Ajuste</div>
        </div>
      </div>
      <div class="date-row">
        <div><p class="field-lbl">Fecha:</p><div class="field-line"></div></div>
        <div><p class="field-lbl">Hora:</p><div class="field-line"></div></div>
      </div>
      <div class="sig-area">
        <p class="field-lbl" style="text-align:center;">Firma del Titular:</p>
        <div class="sig-line"></div>
      </div>
      <div class="stps-note">Cumplimiento NOM-004-STPS-1999</div>
    </div>
    <div class="stripe stripe-bot"></div>
  </div>
<script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
</body></html>`);
        printWindow.document.close();
    }, [lotoData]);

    const today = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    const courseOptions = courses.map(c => ({ value: c.name, label: c.name }));
    const preview = employeeData && selectedCourse;
    const hazardStripe = 'repeating-linear-gradient(45deg, #ef4444, #ef4444 10px, #ffffff 10px, #ffffff 20px)';
    const lotoReady = lotoData.name || lotoData.id;

    return (
        <AdminLayout title="Constancias">
            <div className={styles.page}>

                {/* ─── Pestañas ─── */}
                <div className={styles.tabBar}>
                    <button
                        className={`${styles.tab} ${activeTab === 'constancia' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('constancia')}
                    >
                        <FileText size={15} />
                        Constancias
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'loto' ? styles.tabActiveLoto : ''}`}
                        onClick={() => setActiveTab('loto')}
                    >
                        <ShieldAlert size={15} />
                        Tarjetas LOTO
                    </button>
                </div>

                {/* ══════════════ CONSTANCIAS ══════════════ */}
                {activeTab === 'constancia' && (
                    <>
                        <section className={styles.searchPanel}>
                            <h2 className={styles.panelTitle}>Generar Constancia</h2>
                            <p className={styles.panelDesc}>
                                Ingresa el número de empleado para consultar sus cursos aprobados.
                            </p>
                            <div className={styles.searchRow}>
                                <input
                                    className={styles.input}
                                    placeholder="No. Empleado"
                                    value={employeeIdInput}
                                    onChange={e => setEmployeeIdInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                />
                                <Button onClick={handleSearch} disabled={loadingEmp || !employeeIdInput.trim()}>
                                    {loadingEmp ? 'Buscando...' : 'Buscar'}
                                </Button>
                            </div>

                            {employeeData && (
                                <div className={styles.employeeCard}>
                                    <div className={styles.empInfo}>
                                        <span className={styles.empName}>{employeeData.name}</span>
                                        <span className={styles.empMeta}>
                                            #{employeeData.employeeId} &bull; {employeeData.department} &bull; {employeeData.position}
                                        </span>
                                    </div>
                                    <div className={styles.courseSelector}>
                                        <label className={styles.label}>Curso a certificar</label>
                                        {courses.length === 0 ? (
                                            <p className={styles.noCoursesMsg}>Sin cursos aprobados registrados.</p>
                                        ) : (
                                            <Select
                                                value={selectedCourse?.name || ''}
                                                onChange={value => setSelectedCourse(courses.find(c => c.name === value) || null)}
                                                options={courseOptions}
                                                placeholder="Seleccionar curso..."
                                            />
                                        )}
                                    </div>
                                    <div className={styles.folioRow}>
                                        <label className={styles.label}>Folio</label>
                                        <input
                                            className={styles.input}
                                            value={folio}
                                            onChange={e => setFolio(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {preview && (
                                <div className={styles.actions}>
                                    <Button onClick={handlePrint} variant="primary">
                                        Imprimir / Guardar PDF
                                    </Button>
                                </div>
                            )}
                        </section>

                        {preview && (
                            <section className={styles.previewSection} aria-label="Vista previa de constancia">
                                <h2 className={styles.panelTitle}>Vista previa</h2>
                                <div className={styles.previewWrapper}>
                                    <div className={styles.certificate} ref={printRef} id="certificate">
                                        <div className={styles.accentBar} />
                                        <div className={styles.certHeader}>
                                            <div className={styles.certLogo}>
                                                <Image src="/logo-vino-plastic.png" alt="Viñoplastic" width={44} height={44} style={{ objectFit: 'contain' }} />
                                                <span className={styles.certCompany}>VIÑOPLASTIC</span>
                                            </div>
                                            <div className={styles.certMeta}>
                                                <span className={styles.certFolio}>Folio: {folio}</span>
                                                <span className={styles.certDate}>{today}</span>
                                            </div>
                                        </div>
                                        <div className={styles.certBody}>
                                            <p className={styles.certIntro}>CONSTANCIA DE CAPACITACIÓN</p>
                                            <p className={styles.certText}>
                                                La empresa <strong>Viñoplastic S.A. de C.V.</strong> hace constar que:
                                            </p>
                                            <p className={styles.certEmployeeName}>{employeeData.name}</p>
                                            <p className={styles.certText}>
                                                Con número de empleado <strong>{employeeData.employeeId}</strong>,
                                                adscrito al área de <strong>{employeeData.department}</strong>{employeeData.position ? `, en el puesto de ${employeeData.position}` : ''},
                                                ha concluido satisfactoriamente el curso:
                                            </p>
                                            <p className={styles.certCourseName}>{selectedCourse.name}</p>
                                            {selectedCourse.date && (
                                                <p className={styles.certText}>
                                                    Completado el día <strong>{selectedCourse.date}</strong>.
                                                </p>
                                            )}
                                            {selectedCourse.score > 0 && (
                                                <p className={styles.certText}>
                                                    Calificación obtenida: <strong>{selectedCourse.score}%</strong>
                                                </p>
                                            )}
                                        </div>
                                        <div className={styles.certSignatures}>
                                            <div className={styles.sigBlock}>
                                                <div className={styles.sigLine} />
                                                <p className={styles.sigLabel}>Firma del Participante</p>
                                                <p className={styles.sigName}>{employeeData.name}</p>
                                            </div>
                                            <div className={styles.sigBlock}>
                                                <div className={styles.sigLine} />
                                                <p className={styles.sigLabel}>Instructor / Evaluador</p>
                                                <p className={styles.sigName}>&nbsp;</p>
                                            </div>
                                            <div className={styles.sigBlock}>
                                                <div className={styles.sigLine} />
                                                <p className={styles.sigLabel}>Recursos Humanos</p>
                                                <p className={styles.sigName}>&nbsp;</p>
                                            </div>
                                        </div>
                                        <div className={styles.accentBarBottom} />
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* ══════════════ TARJETAS LOTO ══════════════ */}
                {activeTab === 'loto' && (
                    <div className={styles.lotoSection}>

                        {/* ─── Formulario ─── */}
                        <aside className={styles.lotoForm}>
                            <h2 className={styles.panelTitle}>Datos del Empleado</h2>

                            {/* Búsqueda por número */}
                            <div className={styles.formField}>
                                <label className={styles.label}>Número de Empleado</label>
                                <div className={styles.searchRow}>
                                    <input
                                        className={styles.input}
                                        placeholder="Ej. 4092"
                                        value={lotoIdInput}
                                        onChange={e => setLotoIdInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleLotoSearch()}
                                    />
                                    <Button
                                        onClick={handleLotoSearch}
                                        disabled={loadingLoto || !lotoIdInput.trim()}
                                    >
                                        {loadingLoto ? '...' : 'Buscar'}
                                    </Button>
                                </div>
                            </div>

                            {/* Campos auto-rellenados */}
                            <div className={styles.formField}>
                                <label className={styles.label}>Nombre</label>
                                <input
                                    className={styles.input}
                                    placeholder="Se cargará al buscar"
                                    value={lotoData.name}
                                    onChange={e => setLotoData(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>

                            <div className={styles.formField}>
                                <label className={styles.label}>Departamento</label>
                                <input
                                    className={styles.input}
                                    placeholder="Se cargará al buscar"
                                    value={lotoData.department}
                                    onChange={e => setLotoData(p => ({ ...p, department: e.target.value }))}
                                />
                            </div>

                            {/* Fotografía */}
                            <div className={styles.formField}>
                                <label className={styles.label}>Fotografía</label>
                                <div className={styles.photoUploadArea}>
                                    {lotoData.photoUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={lotoData.photoUrl}
                                            alt="Foto empleado"
                                            className={styles.photoThumb}
                                        />
                                    )}
                                    <label className={`${styles.photoUploadBtn} ${(!lotoData.id || uploadingPhoto) ? styles.photoUploadBtnDisabled : ''}`}>
                                        <Upload size={14} />
                                        {uploadingPhoto ? 'Subiendo...' : lotoData.photoUrl ? 'Cambiar foto' : 'Cargar foto'}
                                        <input
                                            ref={photoInputRef}
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={handlePhotoUpload}
                                            disabled={!lotoData.id || uploadingPhoto}
                                        />
                                    </label>
                                    {!lotoData.id && (
                                        <p className={styles.photoHint}>Busca un empleado primero</p>
                                    )}
                                </div>
                            </div>

                            {/* Imprimir */}
                            <button
                                className={styles.lotoPrintBtn}
                                onClick={handlePrintLoto}
                                disabled={!lotoReady}
                            >
                                <Printer size={16} />
                                Imprimir Tarjetas
                            </button>

                            <div className={styles.lotoNormNote}>
                                <p className={styles.lotoNormNoteTitle}>
                                    <AlertTriangle size={14} />
                                    Requisito Normativo
                                </p>
                                <p className={styles.lotoNormNoteText}>
                                    La NOM-004-STPS-1999 exige que el dispositivo de etiquetado sea duradero,
                                    estandarizado y sustancial. Imprima en material resistente a fluidos e instale
                                    un ojal de latón en la perforación superior.
                                </p>
                            </div>
                        </aside>

                        {/* ─── Vista previa de tarjetas ─── */}
                        <div className={styles.lotoPreviewArea}>
                            <h2 className={styles.panelTitle}>Vista previa</h2>
                            <div className={styles.lotoCardsRow}>

                                {/* CARA FRONTAL */}
                                <div className={styles.lotoCard}>
                                    <div className={styles.lotoHazardStripe} style={{ background: hazardStripe }} />
                                    <div className={styles.lotoHolePunch}>
                                        <div className={styles.lotoHolePunchInner} />
                                    </div>
                                    <div className={styles.lotoDangerBadge}>
                                        <p className={styles.lotoDangerTitle}>Peligro</p>
                                    </div>
                                    <div className={styles.lotoBlockedBadge}>
                                        <p className={styles.lotoBlockedTitle}>Equipo Bloqueado</p>
                                        <p className={styles.lotoNoOperate}>NO OPERAR</p>
                                    </div>
                                    <div className={styles.lotoCardBody}>
                                        <div className={styles.lotoPhotoBox}>
                                            {lotoData.photoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={lotoData.photoUrl} alt="Empleado" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <User size={48} color="#9ca3af" />
                                            )}
                                        </div>
                                        <div className={styles.lotoDataArea}>
                                            <div className={styles.lotoDataRow}>
                                                <p className={styles.lotoDataLabel}>Nombre</p>
                                                <p className={styles.lotoDataValue}>
                                                    {lotoData.name || <span style={{ color: '#d1d5db' }}>—</span>}
                                                </p>
                                            </div>
                                            <div className={styles.lotoDataRowSplit}>
                                                <div>
                                                    <p className={styles.lotoDataLabel}>Nómina</p>
                                                    <p className={styles.lotoDataValue}>
                                                        {lotoData.id || <span style={{ color: '#d1d5db' }}>—</span>}
                                                    </p>
                                                </div>
                                                <div style={{ textAlign: 'right', maxWidth: 110 }}>
                                                    <p className={styles.lotoDataLabel}>Depto.</p>
                                                    <p className={`${styles.lotoDataValue} ${styles.lotoDataValueSm}`}>
                                                        {lotoData.department || <span style={{ color: '#d1d5db' }}>—</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.lotoCardFooter}>
                                        <p className={styles.lotoCardFooterText}>
                                            <strong>ADVERTENCIA LEGAL (NOM-004-STPS):</strong> Esta tarjeta y candado
                                            protegen mi vida. Removerlos sin autorización es una violación grave a las
                                            normas de seguridad.
                                        </p>
                                    </div>
                                    <div className={styles.lotoHazardStripe} style={{ background: hazardStripe, borderTop: '1px solid #d1d5db', borderBottom: 'none', marginTop: 'auto' }} />
                                </div>

                                {/* CARA POSTERIOR */}
                                <div className={styles.lotoCard}>
                                    <div className={styles.lotoHazardStripe} style={{ background: hazardStripe }} />
                                    <div className={styles.lotoHolePunch}>
                                        <div className={styles.lotoHolePunchInner} />
                                    </div>
                                    <div className={styles.lotoBackDangerBadge}>
                                        <p className={styles.lotoDangerTitle} style={{ fontSize: '1.35rem' }}>Peligro</p>
                                    </div>
                                    <div className={styles.lotoBackBody}>
                                        <div>
                                            <p className={styles.lotoFieldLabel}>Equipo / Máquina:</p>
                                            <div className={styles.lotoFieldLine} />
                                        </div>
                                        <div>
                                            <p className={styles.lotoFieldLabel} style={{ marginBottom: 8 }}>Motivo del Bloqueo:</p>
                                            <div className={styles.lotoCheckGrid}>
                                                {['Mantenimiento', 'Cambio Molde', 'Limpieza', 'Ajuste'].map(m => (
                                                    <div key={m} className={styles.lotoCheckItem}>
                                                        <div className={styles.lotoCheckBox} />
                                                        {m}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={styles.lotoDateRow}>
                                            <div>
                                                <p className={styles.lotoFieldLabel}>Fecha:</p>
                                                <div className={styles.lotoFieldLine} />
                                            </div>
                                            <div>
                                                <p className={styles.lotoFieldLabel}>Hora:</p>
                                                <div className={styles.lotoFieldLine} />
                                            </div>
                                        </div>
                                        <div className={styles.lotoSignatureArea}>
                                            <p className={styles.lotoFieldLabel} style={{ textAlign: 'center' }}>Firma del Titular:</p>
                                            <div className={styles.lotoSignatureLine} />
                                        </div>
                                        <p className={styles.lotoStpsNote}>Cumplimiento NOM-004-STPS-1999</p>
                                    </div>
                                    <div className={styles.lotoHazardStripe} style={{ background: hazardStripe, borderTop: '1px solid #d1d5db', borderBottom: 'none', marginTop: 'auto' }} />
                                </div>

                            </div>
                        </div>
                    </div>
                )}

            </div>
        </AdminLayout>
    );
}
