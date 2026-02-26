'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { logInduccionAction } from '@/lib/induccionAudit';
import { useConfirm } from '@/hooks/useConfirm';
import { useToast } from '@/components/ui/Toast/Toast';
import {
    Image, Video, UploadCloud, Upload, Check, Trash2,
    Play, X, ChevronLeft, ChevronRight, Download,
    LayoutGrid, List, Eye,
} from 'lucide-react';
import SkeletonCard from '@/components/ui/SkeletonCard/SkeletonCard';
import styles from './GallerySection.module.css';

/* ── Categorías predefinidas (se pueden ampliar) ── */
const CATEGORIAS = ['General', 'Eventos', 'Instalaciones', 'Capacitación', 'Equipo'];

/**
 * GallerySection — Componente completo de galería extraído de page.js.
 * Props:
 *   items: array de items de galería (desde Firestore, real-time en page.js)
 *   canEdit: boolean
 *   userId, userName: para logs de auditoría
 */
export default function GallerySection({ items = [], canEdit = false, userId, userName }) {
    const { toast } = useToast();
    const { showConfirm, confirmDialog } = useConfirm();

    // ── Modal de subida ──
    const [showModal, setShowModal] = useState(false);
    const [galleryType, setGalleryType] = useState('imagen');
    const [galleryFile, setGalleryFile] = useState(null);
    const [galleryName, setGalleryName] = useState('');
    const [categoriaModal, setCategoriaModal] = useState('General');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // ── Filtros y visualización ──
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('fecha_desc');
    const [catFilter, setCatFilter] = useState('Todas');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // ── Lightbox / Slideshow ──
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [slideshowIdx, setSlideshowIdx] = useState(null);

    // ── Galería filtrada y ordenada ──
    const displayed = (() => {
        let list = items;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(i => i.nombre?.toLowerCase().includes(q));
        }
        if (catFilter !== 'Todas') {
            list = list.filter(i => (i.categoria || 'General') === catFilter);
        }
        switch (sort) {
            case 'fecha_asc': return [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'nombre_asc': return [...list].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            case 'tipo': return [...list].sort((a, b) => (a.tipo || '').localeCompare(b.tipo || ''));
            default: return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    })();

    // ── Categorías disponibles en los items actuales ──
    const availableCategories = ['Todas', ...new Set(items.map(i => i.categoria || 'General'))];

    // ── Seleccionar archivo con preview ──
    const handleFileSelect = useCallback((file) => {
        if (!file) return;
        setGalleryFile(file);
        if (!galleryName) setGalleryName(file.name.replace(/\.[^.]+$/, ''));
        if (file.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            setPreviewUrl(null);
        }
    }, [galleryName]);

    // ── Drag & Drop ──
    const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
    const handleDragLeave = useCallback(() => setDragOver(false), []);
    const handleDrop = useCallback((e) => {
        e.preventDefault(); setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFileSelect(f);
    }, [handleFileSelect]);

    // Limpiar preview al cerrar modal
    useEffect(() => {
        if (!showModal && previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
    }, [showModal, previewUrl]);

    // ── Subir archivo ──
    const handleUpload = useCallback(async () => {
        if (!galleryFile) return toast.warning('Atención', 'Selecciona un archivo.');
        if (!galleryName.trim()) return toast.warning('Atención', 'Escribe un nombre.');

        setUploading(true);
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', galleryFile);
            formData.append('nombre', galleryName.trim());

            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/gallery-upload');
                xhr.withCredentials = true;

                const currentUser = auth.currentUser;
                if (!currentUser) { reject(new Error('Usuario no autenticado')); return; }

                currentUser.getIdToken().then(token => {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 90));
                    };
                    xhr.onload = async () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            const result = JSON.parse(xhr.responseText);
                            if (result.success) {
                                await addDoc(collection(db, 'induccion_galeria'), {
                                    nombre: galleryName.trim(),
                                    tipo: result.data.tipo,
                                    mimeType: result.data.mimeType,
                                    viewLink: result.data.viewLink,
                                    downloadLink: result.data.downloadLink,
                                    driveId: result.data.id,
                                    categoria: categoriaModal,
                                    views: 0,
                                    creadoPor: userId || 'unknown',
                                    createdAt: new Date().toISOString(),
                                });
                                setProgress(100);
                                logInduccionAction({ userId, userName: userName || 'Desconocido', action: 'gallery_upload', target: galleryName.trim() });
                                toast.success('Subido', `"${galleryName}" agregado a la galería.`);
                                setShowModal(false);
                                setGalleryFile(null);
                                setGalleryName('');
                                setCategoriaModal('General');
                                setProgress(0);
                                if (fileInputRef.current) fileInputRef.current.value = '';
                                resolve();
                            } else {
                                reject(new Error(result.error || 'Error al subir'));
                            }
                        } else {
                            try { reject(new Error(JSON.parse(xhr.responseText).error || `HTTP ${xhr.status}`)); }
                            catch { reject(new Error(`HTTP ${xhr.status}`)); }
                        }
                    };
                    xhr.onerror = () => reject(new Error('Error de red'));
                    xhr.send(formData);
                }).catch(err => reject(new Error('Token: ' + err.message)));
            });
        } catch (err) {
            toast.error('Error', err.message || 'No se pudo subir.');
            setProgress(0);
        } finally {
            setUploading(false);
        }
    }, [galleryFile, galleryName, categoriaModal, userId, userName, toast]);

    // ── Eliminar ──
    const handleDelete = useCallback(async (e, item) => {
        e.stopPropagation();
        if (!await showConfirm('¿Eliminar este elemento?', { title: 'Eliminar', confirmLabel: 'Eliminar' })) return;
        await deleteDoc(doc(db, 'induccion_galeria', item.id));
        logInduccionAction({ userId, userName: userName || 'Desconocido', action: 'gallery_delete', target: item.nombre || item.id });
        toast.success('Eliminado', 'Elemento eliminado de la galería.');
    }, [showConfirm, toast, userId, userName]);

    // ── Abrir Lightbox + incrementar views ──
    const handleOpen = useCallback(async (item) => {
        setSelectedMedia(item);
        const idx = displayed.findIndex(i => i.id === item.id);
        setSlideshowIdx(idx >= 0 ? idx : null);
        // Incrementar contador de vistas en Firestore
        try {
            await updateDoc(doc(db, 'induccion_galeria', item.id), { views: increment(1) });
        } catch (_) { /* silencioso */ }
    }, [displayed]);

    // ── Slideshow ──
    const handlePrev = useCallback(() => {
        setSlideshowIdx(prev => {
            if (prev === null) return prev;
            const next = prev > 0 ? prev - 1 : displayed.length - 1;
            setSelectedMedia(displayed[next]);
            return next;
        });
    }, [displayed]);

    const handleNext = useCallback(() => {
        setSlideshowIdx(prev => {
            if (prev === null) return prev;
            const next = prev < displayed.length - 1 ? prev + 1 : 0;
            setSelectedMedia(displayed[next]);
            return next;
        });
    }, [displayed]);

    // Navegación con teclado
    useEffect(() => {
        if (!selectedMedia) return;
        const onKey = (e) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') setSelectedMedia(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedMedia, handleNext, handlePrev]);

    return (
        <>
            {/* ── Controles: búsqueda, ordenamiento, vista ── */}
            <div className={styles.controls}>
                <input
                    className={styles.searchInput}
                    type="search"
                    placeholder="Buscar..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select className={styles.sortSelect} value={sort} onChange={e => setSort(e.target.value)}>
                    <option value="fecha_desc">Más recientes</option>
                    <option value="fecha_asc">Más antiguos</option>
                    <option value="nombre_asc">Nombre A-Z</option>
                    <option value="tipo">Por tipo</option>
                </select>
                <div className={styles.viewToggle}>
                    <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('grid')} title="Vista grilla">
                        <LayoutGrid size={14} />
                    </button>
                    <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('list')} title="Vista lista">
                        <List size={14} />
                    </button>
                </div>
                {canEdit && (
                    <button
                        className={styles.btnPrimary}
                        style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                        onClick={() => { setGalleryFile(null); setGalleryName(''); setProgress(0); setGalleryType('imagen'); setCategoriaModal('General'); setShowModal(true); }}
                    >
                        <UploadCloud size={13} /> Subir
                    </button>
                )}
            </div>

            {/* ── Filtro por categoría ── */}
            {availableCategories.length > 2 && (
                <div className={styles.categoryFilter}>
                    {availableCategories.map(cat => (
                        <button
                            key={cat}
                            className={`${styles.categoryChip} ${catFilter === cat ? styles.categoryChipActive : ''}`}
                            onClick={() => setCatFilter(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Grid / Lista ── */}
            {displayed.length === 0 ? (
                <div className={styles.empty}>
                    {search || catFilter !== 'Todas'
                        ? 'Sin resultados para los filtros aplicados.'
                        : 'No hay elementos en la galería. Sube imágenes o videos.'}
                </div>
            ) : viewMode === 'grid' ? (
                <div className={styles.grid}>
                    {displayed.map(item => (
                        <div key={item.id} className={styles.card} onClick={() => handleOpen(item)}>
                            <div className={styles.thumbWrap}>
                                {item.tipo === 'imagen' ? (
                                    <img src={item.viewLink} alt={item.nombre} className={styles.thumb}
                                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                ) : null}
                                <div className={styles.videoPlaceholder} style={{ display: item.tipo === 'video' ? 'flex' : 'none' }}>
                                    <Video size={32} style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
                                </div>
                                {item.tipo === 'video' && <div className={styles.playOverlay}><Play size={16} /></div>}
                                {(item.views > 0) && (
                                    <div className={styles.viewsOverlay}><Eye size={10} />{item.views}</div>
                                )}
                                {item.categoria && item.categoria !== 'General' && (
                                    <div className={styles.categoryBadge}>{item.categoria}</div>
                                )}
                            </div>
                            <div className={styles.footer}>
                                <span className={styles.itemName}>
                                    {item.tipo === 'imagen'
                                        ? <Image size={11} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                                        : <Video size={11} style={{ color: '#6366f1', flexShrink: 0 }} />}
                                    {item.nombre}
                                </span>
                                {canEdit && (
                                    <button className={styles.deleteBtn} onClick={e => handleDelete(e, item)} title="Eliminar">
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.gridList}>
                    {displayed.map(item => (
                        <div key={item.id} className={styles.listCard} onClick={() => handleOpen(item)}>
                            {item.tipo === 'imagen'
                                ? <img src={item.viewLink} alt={item.nombre} className={styles.listThumb} onError={e => { e.target.style.background = 'var(--bg-secondary)'; }} />
                                : <div className={styles.listThumb} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Video size={20} style={{ color: 'var(--color-primary)' }} /></div>
                            }
                            <div className={styles.listInfo}>
                                <div className={styles.listName}>{item.nombre}</div>
                                <div className={styles.listMeta}>
                                    <span>{item.categoria || 'General'}</span>
                                    {item.views > 0 && <span><Eye size={9} style={{ display: 'inline' }} /> {item.views} vistas</span>}
                                </div>
                            </div>
                            {canEdit && (
                                <button className={styles.deleteBtn} onClick={e => handleDelete(e, item)} title="Eliminar">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modal de subida ── */}
            {showModal && (
                <div className={styles.modalBackdrop} onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
                    <div className={styles.modalBox}>
                        <button className={styles.closeModalBtn} onClick={() => setShowModal(false)}>
                            <X size={14} />
                        </button>
                        <div className={styles.modalHeader}>
                            <UploadCloud size={22} style={{ color: 'var(--color-primary)' }} />
                            <h2>Subir a Galería</h2>
                            <p>Sube una imagen o video y asígnale un nombre.</p>
                        </div>

                        {/* Tipo */}
                        <div className={styles.typeSelector}>
                            {['imagen', 'video'].map(t => (
                                <button
                                    key={t}
                                    className={`${styles.typeBtn} ${galleryType === t ? styles.typeBtnActive : ''}`}
                                    onClick={() => { setGalleryType(t); setGalleryFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                    disabled={uploading}
                                >
                                    {t === 'imagen' ? <Image size={14} /> : <Video size={14} />}
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Nombre */}
                        <div className={styles.inputGroup}>
                            <label>Nombre <span style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>(máx. 60)</span></label>
                            <input className={styles.input} value={galleryName} onChange={e => setGalleryName(e.target.value)} maxLength={60} disabled={uploading} placeholder="Ej. Logo empresa" />
                        </div>

                        {/* Categoría */}
                        <div className={styles.inputGroup}>
                            <label>Categoría</label>
                            <select className={styles.input} value={categoriaModal} onChange={e => setCategoriaModal(e.target.value)} disabled={uploading}>
                                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Zona drag & drop */}
                        <label
                            className={`${styles.fileLabel} ${galleryFile ? styles.fileLabelActive : ''} ${dragOver ? styles.fileLabelDrag : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={galleryType === 'imagen' ? 'image/jpeg,image/png,image/webp,image/gif' : 'video/mp4,video/webm,video/quicktime'}
                                style={{ display: 'none' }}
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                                disabled={uploading}
                            />
                            {galleryFile ? <><Check size={14} /> {galleryFile.name}</> : <><Upload size={14} /> Seleccionar o arrastrar {galleryType}</>}
                        </label>

                        {/* Preview */}
                        {previewUrl && (
                            <div className={styles.previewWrap}>
                                <img src={previewUrl} alt="Preview" className={styles.previewImg} />
                            </div>
                        )}

                        {/* Progreso */}
                        {uploading && (
                            <div className={styles.progressWrap}>
                                <div className={styles.progressBar} style={{ width: `${progress}%` }} />
                            </div>
                        )}
                        {uploading && <div className={styles.progressText}>{progress}%</div>}

                        <div className={styles.modalActions}>
                            <button className={styles.btnSecondary} onClick={() => setShowModal(false)} disabled={uploading}>Cancelar</button>
                            <button className={styles.btnPrimary} onClick={handleUpload} disabled={uploading || !galleryFile || !galleryName.trim()}>
                                <UploadCloud size={13} />{uploading ? 'Subiendo...' : 'Subir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Lightbox con Slideshow ── */}
            {selectedMedia && (
                <div className={styles.lightboxBackdrop} onClick={() => setSelectedMedia(null)}>
                    <button className={styles.lightboxCloseBtn} onClick={() => setSelectedMedia(null)}>
                        <X size={22} />
                    </button>
                    {displayed.length > 1 && (
                        <button className={styles.lightboxNavBtn} style={{ left: '16px' }}
                            onClick={e => { e.stopPropagation(); handlePrev(); }} aria-label="Anterior">
                            <ChevronLeft size={28} />
                        </button>
                    )}
                    <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
                        {selectedMedia.tipo === 'imagen'
                            ? <img src={selectedMedia.viewLink} alt={selectedMedia.nombre} className={styles.lightboxImg} />
                            : <video src={selectedMedia.viewLink} controls autoPlay className={styles.lightboxVideo} />}
                        <div className={styles.lightboxCaption}>
                            <span>{selectedMedia.nombre}</span>
                            {selectedMedia.downloadLink && (
                                <a href={selectedMedia.downloadLink} target="_blank" rel="noopener noreferrer"
                                    className={styles.lightboxDownloadBtn} onClick={e => e.stopPropagation()} title="Descargar">
                                    <Download size={15} />
                                </a>
                            )}
                        </div>
                        {displayed.length > 1 && slideshowIdx !== null && (
                            <div className={styles.lightboxCounter}>{slideshowIdx + 1} / {displayed.length}</div>
                        )}
                    </div>
                    {displayed.length > 1 && (
                        <button className={styles.lightboxNavBtn} style={{ right: '16px' }}
                            onClick={e => { e.stopPropagation(); handleNext(); }} aria-label="Siguiente">
                            <ChevronRight size={28} />
                        </button>
                    )}
                </div>
            )}

            {confirmDialog}
        </>
    );
}
