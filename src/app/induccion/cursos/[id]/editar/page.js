'use client';

import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import QRCode from 'qrcode';
import {
    IconArrowLeft, IconX, IconMenu,
    IconTarget, IconFileText, IconGraduationCap,
    IconCheckSquare, IconGrid, IconColumns, IconBookOpen, IconList,
    IconPlay, IconCopy, IconEdit, IconLink, IconUploadCloud, IconEye, IconActivity,
} from '@/lib/icons';
import {
    getCourseWithSlides, updateSlide, addSlide, deleteSlide,
    updateSlidesOrder, duplicateSlide, updateCourseFields,
} from '@/lib/courseService';
import { useToast } from '@/components/ui/Toast/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import SlideList from '@/components/features/Courses/Editor/SlideList';
import SlideEditorPanel from '@/components/features/Courses/Editor/SlideEditorPanel';
import SlideEditorErrorBoundary from '@/components/features/Courses/Editor/SlideEditorErrorBoundary';
import CoursePlayer from '@/components/features/Courses/CoursePlayer';
import { SLIDE_TYPE_LABELS, getDefaultSlideData } from '@/components/features/Courses/Editor/slideConstants';
import styles from './editor.module.css';

const FS_STEPS = [
    { key: 'sm', label: 'A', size: '0.75rem', title: 'Letra pequeña' },
    { key: 'md', label: 'A', size: '0.875rem', title: 'Letra mediana' },
    { key: 'lg', label: 'A', size: '1rem',    title: 'Letra grande' },
    { key: 'xl', label: 'A', size: '1.15rem', title: 'Letra extra grande' },
];
const FS_STORAGE_KEY = 'course_font_scale';
const FS_CSS_CLASS = { sm: 'fsSm', md: null, lg: 'fsLg', xl: 'fsXl' };

// ── Tipos de slide para el modal (agrupados por sección) ─────────────────────
const SLIDE_SECTIONS = [
    {
        label: 'General',
        types: [
            { type: 'title',      label: 'Portada',      icon: IconTarget,        iconColor: 'var(--purple-500)',        desc: 'Título principal del curso' },
            { type: 'content',    label: 'Contenido',     icon: IconFileText,      iconColor: 'var(--cyan-500)',          desc: 'Texto e imagen' },
            { type: 'objective',  label: 'Objetivo',      icon: IconGraduationCap, iconColor: 'var(--amber-500)',         desc: 'Objetivo de aprendizaje' },
            { type: 'benefits',   label: 'Beneficios',    icon: IconCheckSquare,   iconColor: 'var(--green-500)',         desc: 'Lista de beneficios' },
            { type: 'icon_grid',  label: 'Íconos',        icon: IconGrid,          iconColor: 'var(--color-accent)',      desc: 'Cuadrícula de íconos' },
            { type: 'comparison', label: 'Comparación',   icon: IconColumns,       iconColor: 'var(--color-warning)',     desc: 'Dos columnas comparativas' },
            { type: 'steps',      label: 'Paso a Paso',   icon: IconList,          iconColor: 'var(--teal-500, #14b8a6)',desc: 'Secuencia numerada de pasos' },
            { type: 'quiz',       label: 'Quiz',          icon: IconBookOpen,      iconColor: 'var(--color-danger)',      desc: 'Pregunta con opciones' },
            { type: 'definition', label: 'Definición',    icon: IconBookOpen,      iconColor: 'var(--blue-500)',          desc: 'Término y definición' },
            { type: 'video',      label: 'Video',         icon: IconPlay,          iconColor: 'var(--color-danger)',      desc: 'YouTube o video MP4' },
            { type: 'flashcard',  label: 'Tarjetas',      icon: IconCopy,          iconColor: '#8b5cf6',                  desc: 'Mazo de tarjetas con flip' },
            { type: 'fill_blank', label: 'Completa',      icon: IconEdit,          iconColor: '#0ea5e9',                  desc: 'Rellena el espacio en blanco' },
            { type: 'checklist',  label: 'Checklist',     icon: IconCheckSquare,   iconColor: '#16a34a',                  desc: 'Lista de verificación' },
        ],
    },
    {
        label: 'Simuladores',
        types: [
            { type: 'thermal_sim', label: 'Simulador Térmico LOTO', icon: IconActivity, iconColor: '#f97316', desc: 'Disipación térmica interactiva NOM-004' },
            { type: 'env_sim',     label: 'Simulador Ambiental',    icon: IconActivity, iconColor: '#16a34a', desc: 'Matriz Causa-Efecto Ambiental ISO 14001' },
        ],
    },
];

// ── Reducer ──────────────────────────────────────────────────────────────────
const initialState = {
    course:           null,
    slides:           [],
    loading:          true,
    selectedSlide:    null,
    livePreviewSlide: null,
    saving:           false,
    showSlideModal:   false,
};

function editorReducer(state, action) {
    switch (action.type) {
        case 'LOAD_SUCCESS':
            return {
                ...state,
                loading:          false,
                course:           action.course,
                slides:           action.slides,
                selectedSlide:    action.slides[0] ?? null,
                livePreviewSlide: action.slides[0] ?? null,
            };

        case 'LOAD_ERROR':
            return { ...state, loading: false };

        case 'SELECT_SLIDE':
            return {
                ...state,
                selectedSlide:    action.slide,
                livePreviewSlide: action.slide,
            };

        case 'SLIDE_SAVED': {
            const slides = state.slides.map(s =>
                s.id === action.slideId ? { ...s, data: action.newData } : s
            );
            const selectedSlide = state.selectedSlide?.id === action.slideId
                ? { ...state.selectedSlide, data: action.newData }
                : state.selectedSlide;
            // No toca livePreviewSlide — puede tener cambios no guardados aún
            return { ...state, slides, selectedSlide };
        }

        case 'SLIDE_DELETED': {
            const idx = state.slides.findIndex(s => s.id === action.slideId);
            const remaining = state.slides.filter(s => s.id !== action.slideId);
            // Renumerar localmente (Firestore se actualiza en el handler)
            const renumbered = remaining.map((s, i) => ({ ...s, order: i + 1 }));
            // Preferir el slide en la misma posición; si se eliminó el último, retroceder
            const next = renumbered[idx] ?? renumbered[idx - 1] ?? null;
            return { ...state, slides: renumbered, selectedSlide: next, livePreviewSlide: next };
        }

        case 'SLIDE_ADDED': {
            const slides = [...state.slides, action.slide];
            return { ...state, slides, selectedSlide: action.slide, livePreviewSlide: action.slide };
        }

        case 'SLIDE_DUPLICATED': {
            // Insertar el nuevo slide y desplazar los que tienen order >= insertAt
            const insertAt = action.newSlide.order;
            const shifted = state.slides.map(s =>
                s.id !== action.originalId && s.order >= insertAt
                    ? { ...s, order: s.order + 1 }
                    : s
            );
            const sorted = [...shifted, action.newSlide].sort((a, b) => a.order - b.order);
            return { ...state, slides: sorted, selectedSlide: action.newSlide, livePreviewSlide: action.newSlide };
        }

        case 'SLIDES_REORDERED':
            return { ...state, slides: action.slides };

        case 'FORM_CHANGED':
            return {
                ...state,
                livePreviewSlide: state.livePreviewSlide
                    ? { ...state.livePreviewSlide, data: action.data }
                    : null,
            };

        case 'SAVE_START':
            return { ...state, saving: true };

        case 'SAVE_END':
            return { ...state, saving: false };

        case 'TOGGLE_MODAL':
            return { ...state, showSlideModal: action.open };

        default:
            return state;
    }
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function EditorPage({ params }) {
    const { id: courseId } = params;
    const router = useRouter();
    const { toast } = useToast();
    const { showConfirm, confirmDialog } = useConfirm();

    const [state, dispatch] = useReducer(editorReducer, initialState);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [quizImporting, setQuizImporting] = useState(false);
    const [publicQuizUrl, setPublicQuizUrl] = useState('');
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [qrGenerating, setQrGenerating] = useState(false);
    const [qrError, setQrError] = useState('');
    const [publicCourseUrl, setPublicCourseUrl] = useState('');
    const [courseQrDataUrl, setCourseQrDataUrl] = useState('');
    const [courseQrGenerating, setCourseQrGenerating] = useState(false);
    const [courseQrError, setCourseQrError] = useState('');
    const fileInputRef = useRef(null);
    const [previewFontSize, setPreviewFontSize] = useState(() => {
        if (typeof window === 'undefined') return 'md';
        return localStorage.getItem(FS_STORAGE_KEY) || 'md';
    });
    const handlePreviewFontSize = useCallback((key) => {
        setPreviewFontSize(key);
        try { localStorage.setItem(FS_STORAGE_KEY, key); } catch {}
    }, []);

    // Ref para acceder al estado actual sin añadirlo como dependencia en callbacks
    const stateRef = useRef(state);
    useEffect(() => { stateRef.current = state; }, [state]);

    // ── Carga inicial ────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const loadData = async () => {
            const result = await getCourseWithSlides(courseId);
            if (cancelled) return;
            if (result.success) {
                dispatch({ type: 'LOAD_SUCCESS', course: result.data.course, slides: result.data.slides });
            } else {
                dispatch({ type: 'LOAD_ERROR' });
                toast.error('Error', 'No se pudo cargar el curso');
                router.push('/induccion');
            }
        };
        loadData();
        return () => { cancelled = true; };
    }, [courseId, router, toast]);

    // ── Sync metadatos ───────────────────────────────────────────────────────
    const syncCourseMetadata = useCallback((count) => {
        const estMins = Math.max(5, Math.ceil((count * 3) / 5) * 5);
        updateCourseFields(courseId, {
            slideCount: count,
            duration: `${estMins} min`,
        }).catch(err => console.error('[Editor] Error sincronizando metadatos:', err));
    }, [courseId]);

    // ── Guardar slide ────────────────────────────────────────────────────────
    const handleSaveSlide = useCallback(async (slideId, newData) => {
        const result = await updateSlide(courseId, slideId, { data: newData });
        if (result.success) {
            dispatch({ type: 'SLIDE_SAVED', slideId, newData });
        } else {
            toast.error('Error', 'No se pudo guardar el slide');
        }
    }, [courseId, toast]);
    const extractQuizSlidesFromJSON = useCallback((payload) => {
        if (!payload || typeof payload !== 'object') return null;

        if (Array.isArray(payload.slides)) {
            const slides = payload.slides
                .filter(item => item && typeof item === 'object' && ['quiz', 'group_quiz'].includes(item.type))
                .map(item => ({
                    type: item.type,
                    data: item.data || item.quiz || item,
                }));

            if (slides.length > 0) return slides;
        }

        if (payload.type === 'quiz' || payload.type === 'group_quiz') {
            return [{ type: payload.type, data: payload.data || payload.quiz || payload }];
        }

        if (payload.quiz && typeof payload.quiz === 'object') {
            return [{ type: 'quiz', data: payload.quiz }];
        }

        if (Array.isArray(payload.questions)) {
            return [{ type: 'quiz', data: payload }];
        }

        return null;
    }, []);

    const handleImportQuizJson = useCallback(async (file) => {
        if (!file) return;
        setQuizImporting(true);
        setQrError('');

        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const slidesToAdd = extractQuizSlidesFromJSON(parsed);

            if (!slidesToAdd || slidesToAdd.length === 0) {
                throw new Error('JSON inválido o no contiene un quiz compatible.');
            }

            let nextOrder = stateRef.current.slides.length + 1;
            for (const slide of slidesToAdd) {
                const result = await addSlide(courseId, {
                    type: slide.type,
                    data: slide.data,
                    order: nextOrder,
                });

                if (!result.success) {
                    throw new Error(result.error || 'No se pudo agregar el slide de quiz.');
                }

                dispatch({
                    type: 'SLIDE_ADDED',
                    slide: {
                        id: result.id,
                        type: slide.type,
                        data: slide.data,
                        order: result.order,
                    },
                });
                nextOrder += 1;
            }

            syncCourseMetadata(stateRef.current.slides.length + slidesToAdd.length);
            toast.success('Quiz importado', `Se agregaron ${slidesToAdd.length} slide(s) de quiz al curso.`);
        } catch (error) {
            console.error('[Editor] Importar quiz:', error);
            toast.error('Error', error?.message || 'No se pudo importar el quiz');
        } finally {
            setQuizImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [courseId, extractQuizSlidesFromJSON, syncCourseMetadata, toast]);

    const handleImportClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileInputChange = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (file) await handleImportQuizJson(file);
    }, [handleImportQuizJson]);

    const handleCopyQuizLink = useCallback(async () => {
        if (!publicQuizUrl) return;
        try {
            await navigator.clipboard.writeText(publicQuizUrl);
            toast.success('Copiado', 'Enlace del quiz copiado al portapapeles');
        } catch (error) {
            console.error('[Editor] Copiar enlace quiz:', error);
            toast.error('Error', 'No se pudo copiar el enlace');
        }
    }, [publicQuizUrl, toast]);

    const handleGenerateQuizQr = useCallback(async () => {
        setQrError('');
        setQrDataUrl('');
        setQrGenerating(true);

        try {
            const quizSlides = stateRef.current.slides.filter((slide) =>
                ['quiz', 'group_quiz'].includes(slide.type)
            );

            if (quizSlides.length === 0) {
                setQrError('Este curso no tiene slides de quiz. Importa un quiz antes de generar el QR.');
                return;
            }

            const url = `${window.location.origin}/quiz/${courseId}`;
            setPublicQuizUrl(url);

            const qr = await QRCode.toDataURL(url, {
                errorCorrectionLevel: 'H',
                margin: 1,
                color: {
                    dark: '#0f172a',
                    light: '#ffffff',
                },
            });

            setQrDataUrl(qr);
        } catch (error) {
            console.error('[Editor] Generar QR del quiz:', error);
            setQrError('No se pudo generar el código QR. Intenta de nuevo.');
        } finally {
            setQrGenerating(false);
        }
    }, [courseId]);
    const handleCopyCourseLink = useCallback(async () => {
        if (!publicCourseUrl) return;
        try {
            await navigator.clipboard.writeText(publicCourseUrl);
            toast.success('Copiado', 'Enlace del curso copiado al portapapeles');
        } catch (error) {
            console.error('[Editor] Copiar enlace curso:', error);
            toast.error('Error', 'No se pudo copiar el enlace');
        }
    }, [publicCourseUrl, toast]);

    const handleGenerateCourseQr = useCallback(async () => {
        setCourseQrError('');
        setCourseQrDataUrl('');
        setCourseQrGenerating(true);

        try {
            const url = `${window.location.origin}/presentacion/${courseId}`;
            setPublicCourseUrl(url);

            const qr = await QRCode.toDataURL(url, {
                errorCorrectionLevel: 'H',
                margin: 1,
                color: {
                    dark: '#0f172a',
                    light: '#ffffff',
                },
            });

            setCourseQrDataUrl(qr);
        } catch (error) {
            console.error('[Editor] Generar QR del curso:', error);
            setCourseQrError('No se pudo generar el código QR. Intenta de nuevo.');
        } finally {
            setCourseQrGenerating(false);
        }
    }, [courseId]);

    // ── Eliminar slide ───────────────────────────────────────────────────────
    const handleDeleteSlide = useCallback(async (slideId) => {
        const confirmed = await showConfirm(
            'Esta acción no se puede deshacer. ¿Deseas eliminar este slide permanentemente?',
            { title: '¿Eliminar Slide?', danger: true, confirmLabel: 'Eliminar', cancelLabel: 'Cancelar' }
        );
        if (!confirmed) return;

        dispatch({ type: 'SAVE_START' });
        const result = await deleteSlide(courseId, slideId);

        if (result.success) {
            dispatch({ type: 'SLIDE_DELETED', slideId });
            toast.success('Eliminado', 'Slide eliminado del curso');

            // Persistir nuevos orders en Firestore (los slides que quedan renumerados)
            const remaining = stateRef.current.slides.filter(s => s.id !== slideId);
            const renumbered = remaining.map((s, i) => ({ ...s, order: i + 1 }));
            if (renumbered.length > 0) {
                updateSlidesOrder(courseId, renumbered)
                    .catch(err => console.error('[Editor] Error renumerando slides:', err));
            }
            syncCourseMetadata(remaining.length);
        } else {
            toast.error('Error', result.error || 'No se pudo eliminar el slide');
        }
        dispatch({ type: 'SAVE_END' });
    }, [courseId, toast, showConfirm, syncCourseMetadata]);

    // ── Preview en vivo ──────────────────────────────────────────────────────
    const handleFormChange = useCallback((data) => {
        dispatch({ type: 'FORM_CHANGED', data });
    }, []);

    // ── Seleccionar slide ────────────────────────────────────────────────────
    const handleSelectSlide = useCallback((slide) => {
        dispatch({ type: 'SELECT_SLIDE', slide });
        setSidebarOpen(false); // cerrar sidebar en mobile al seleccionar
    }, []);

    // ── Reordenar slides (DnD) ───────────────────────────────────────────────
    const handleReorderSlides = useCallback(async (newOrderedSlides) => {
        dispatch({ type: 'SLIDES_REORDERED', slides: newOrderedSlides });
        await updateSlidesOrder(courseId, newOrderedSlides);
    }, [courseId]);

    // ── Duplicar slide ───────────────────────────────────────────────────────
    const handleDuplicateSlide = useCallback(async (slide) => {
        dispatch({ type: 'SAVE_START' });
        const result = await duplicateSlide(courseId, slide, stateRef.current.slides);
        if (result.success) {
            dispatch({ type: 'SLIDE_DUPLICATED', newSlide: result.newSlide, originalId: slide.id });
            toast.success('Duplicado', 'Slide duplicado correctamente');
            syncCourseMetadata(stateRef.current.slides.length + 1);
        } else {
            toast.error('Error', result.error || 'No se pudo duplicar el slide');
        }
        dispatch({ type: 'SAVE_END' });
    }, [courseId, toast, syncCourseMetadata]);

    // ── Crear nuevo slide ────────────────────────────────────────────────────
    const handleConfirmSlideType = useCallback(async (type) => {
        dispatch({ type: 'TOGGLE_MODAL', open: false });
        dispatch({ type: 'SAVE_START' });

        const defaultData = getDefaultSlideData(type);
        const result = await addSlide(courseId, {
            type,
            data: defaultData,
            order: stateRef.current.slides.length + 1,
        });

        if (result.success) {
            const newSlide = { id: result.id, type, data: defaultData, order: result.order };
            dispatch({ type: 'SLIDE_ADDED', slide: newSlide });
            toast.success('Slide agregado', 'Se ha creado el nuevo slide');
            syncCourseMetadata(stateRef.current.slides.length + 1);
        } else {
            toast.error('Error', result.error || 'No se pudo crear el slide');
        }
        dispatch({ type: 'SAVE_END' });
    }, [courseId, toast, syncCourseMetadata]);

    // ── Restaurar slide corrupto ─────────────────────────────────────────────
    const handleRestoreSlide = useCallback(async () => {
        const { selectedSlide } = stateRef.current;
        if (!selectedSlide) return;
        const defaultData = getDefaultSlideData(selectedSlide.type);
        await handleSaveSlide(selectedSlide.id, defaultData);
    }, [handleSaveSlide]);

    // ── Atajos de teclado ────────────────────────────────────────────────────
    useEffect(() => {
        const INTERACTIVE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

        const handleKeyDown = (e) => {
            // No interceptar cuando el foco está en un campo de texto
            if (INTERACTIVE_TAGS.has(e.target.tagName) || e.target.isContentEditable) return;

            const { slides, selectedSlide, saving, showSlideModal } = stateRef.current;

            // Cerrar modal con Escape
            if (e.key === 'Escape' && showSlideModal) {
                e.preventDefault();
                dispatch({ type: 'TOGGLE_MODAL', open: false });
                return;
            }

            if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;

            const idx = slides.findIndex(s => s.id === selectedSlide?.id);

            switch (e.key) {
                case 'ArrowDown': {
                    e.preventDefault();
                    const next = slides[idx + 1];
                    if (next) dispatch({ type: 'SELECT_SLIDE', slide: next });
                    break;
                }
                case 'ArrowUp': {
                    e.preventDefault();
                    const prev = slides[idx - 1];
                    if (prev) dispatch({ type: 'SELECT_SLIDE', slide: prev });
                    break;
                }
                case 'd':
                case 'D':
                    e.preventDefault();
                    if (selectedSlide && !saving) handleDuplicateSlide(selectedSlide);
                    break;
                case 'n':
                case 'N':
                    e.preventDefault();
                    dispatch({ type: 'TOGGLE_MODAL', open: true });
                    break;
                case 'Delete':
                    e.preventDefault();
                    if (selectedSlide && !saving) handleDeleteSlide(selectedSlide.id);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleDuplicateSlide, handleDeleteSlide]);

    // ── Render ───────────────────────────────────────────────────────────────
    if (state.loading) {
        return (
            <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <p>Cargando editor...</p>
            </div>
        );
    }

    const { course, slides, selectedSlide, livePreviewSlide, saving, showSlideModal } = state;

    return (
        <div className={styles.container}>
            {confirmDialog}

            {/* Overlay para cerrar sidebar en mobile */}
            {sidebarOpen && (
                <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Header ── */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    {/* Menú hamburguesa (solo mobile) */}
                    <button
                        className={`${styles.backBtn} ${styles.menuBtn}`}
                        onClick={() => setSidebarOpen(v => !v)}
                        title="Slides"
                        aria-label="Abrir lista de slides"
                    >
                        <IconMenu size={18} />
                    </button>

                    <button
                        className={styles.backBtn}
                        onClick={() => router.push('/induccion')}
                        title="Volver a Inducción"
                        aria-label="Volver"
                    >
                        <IconArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={styles.courseTitle}>{course?.title}</h1>
                        <span className={styles.courseSubtitle}>Editando contenido</span>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={`${styles.actionBtn} ${styles.primaryBtn} ${styles.iconBtn}`}
                        type="button"
                        onClick={handleImportClick}
                        disabled={saving || quizImporting}
                        aria-label={quizImporting ? 'Importando quiz...' : 'Importar quiz'}
                        title={quizImporting ? 'Importando quiz...' : 'Importar quiz'}
                    >
                        <IconUploadCloud size={18} />
                    </button>
                    <button
                        className={`${styles.actionBtn} ${styles.iconBtn}`}
                        type="button"
                        onClick={handleGenerateQuizQr}
                        disabled={qrGenerating}
                        aria-label={qrGenerating ? 'Generando QR...' : 'Generar QR del quiz'}
                        title={qrGenerating ? 'Generando QR...' : 'Generar QR del quiz'}
                    >
                        <IconLink size={18} />
                    </button>
                    <button
                        className={`${styles.actionBtn} ${styles.iconBtn}`}
                        type="button"
                        onClick={handleGenerateCourseQr}
                        disabled={courseQrGenerating}
                        aria-label={courseQrGenerating ? 'Generando QR...' : 'Generar QR del curso completo'}
                        title={courseQrGenerating ? 'Generando QR...' : 'Generar QR del curso completo'}
                    >
                        <IconEye size={18} />
                    </button>
                    <span className={styles.shortcutsHint} title="Alt+↑/↓ · Alt+D duplicar · Alt+N nuevo · Alt+Supr eliminar">
                        Alt+↑↓ · Alt+D · Alt+N
                    </span>
                </div>
            </header>

            <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className={styles.hiddenFileInput}
                onChange={handleFileInputChange}
                aria-hidden="true"
                tabIndex={-1}
            />

            {(publicQuizUrl || qrError) && (
                <div className={styles.shareCard} role="region" aria-label="Quiz público">
                    <div className={styles.shareCardIcon} aria-hidden="true">
                        <IconActivity size={18} />
                    </div>
                    <div className={styles.shareCardBody}>
                        <div className={styles.shareCardHeader}>
                            <p className={styles.shareCardTitle}>Quiz público</p>
                            <span className={styles.shareCardBadge}>Sin sesión</span>
                            <button
                                className={styles.shareCardClose}
                                type="button"
                                onClick={() => { setPublicQuizUrl(''); setQrError(''); setQrDataUrl(''); }}
                                aria-label="Cerrar panel de Quiz público"
                            >
                                <IconX size={14} />
                            </button>
                        </div>
                        <p className={styles.shareCardDesc}>
                            Comparte este QR para que tus empleados respondan sin iniciar sesión.
                        </p>
                        {publicQuizUrl && (
                            <div className={styles.shareCardRow}>
                                <a
                                    href={publicQuizUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.shareCardUrl}
                                >
                                    {publicQuizUrl}
                                </a>
                                <button
                                    className={styles.shareCardCopyBtn}
                                    type="button"
                                    onClick={handleCopyQuizLink}
                                >
                                    Copiar enlace
                                </button>
                            </div>
                        )}
                        {qrDataUrl && (
                            <Image
                                src={qrDataUrl}
                                alt="QR público para el quiz"
                                className={styles.shareCardQr}
                                width={112}
                                height={112}
                                unoptimized
                            />
                        )}
                        {qrError && (
                            <p className={styles.shareCardError}>{qrError}</p>
                        )}
                    </div>
                </div>
            )}

            {(publicCourseUrl || courseQrError) && (
                <div className={styles.shareCard} role="region" aria-label="Curso completo, vista pública">
                    <div className={`${styles.shareCardIcon} ${styles.shareCardIconCourse}`} aria-hidden="true">
                        <IconEye size={18} />
                    </div>
                    <div className={styles.shareCardBody}>
                        <div className={styles.shareCardHeader}>
                            <p className={styles.shareCardTitle}>Curso completo — vista pública</p>
                            <span className={styles.shareCardBadge}>Público</span>
                            <button
                                className={styles.shareCardClose}
                                type="button"
                                onClick={() => { setPublicCourseUrl(''); setCourseQrError(''); setCourseQrDataUrl(''); }}
                                aria-label="Cerrar panel de Curso completo"
                            >
                                <IconX size={14} />
                            </button>
                        </div>
                        <p className={styles.shareCardDesc}>
                            Comparte este QR para que cualquiera pueda ver el curso sin iniciar sesión.
                        </p>
                        {publicCourseUrl && (
                            <div className={styles.shareCardRow}>
                                <a
                                    href={publicCourseUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={styles.shareCardUrl}
                                >
                                    {publicCourseUrl}
                                </a>
                                <button
                                    className={styles.shareCardCopyBtn}
                                    type="button"
                                    onClick={handleCopyCourseLink}
                                >
                                    Copiar enlace
                                </button>
                            </div>
                        )}
                        {courseQrDataUrl && (
                            <Image
                                src={courseQrDataUrl}
                                alt="QR público para ver el curso completo"
                                className={styles.shareCardQr}
                                width={112}
                                height={112}
                                unoptimized
                            />
                        )}
                        {courseQrError && (
                            <p className={styles.shareCardError}>{courseQrError}</p>
                        )}
                    </div>
                </div>
            )}

            {/* ── Workspace ── */}
            <div className={`${styles.workspace} ${sidebarOpen ? '' : styles.workspaceSidebarClosed}`}>
                {/* Sidebar */}
                <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
                    <div className={styles.sidebarHeader}>
                        <span>Slides ({slides.length})</span>
                        <button
                            className={styles.sidebarCloseBtn}
                            onClick={() => setSidebarOpen(false)}
                            aria-label="Ocultar panel de slides"
                        >
                            <IconX size={14} />
                        </button>
                    </div>
                    <SlideList
                        slides={slides}
                        currentSlide={selectedSlide}
                        onSelect={handleSelectSlide}
                        onAdd={() => dispatch({ type: 'TOGGLE_MODAL', open: true })}
                        onReorder={handleReorderSlides}
                        onDuplicate={handleDuplicateSlide}
                        disabled={saving}
                    />
                </aside>

                {/* Botón para reabrir sidebar cuando está cerrado */}
                {!sidebarOpen && (
                    <button
                        className={styles.sidebarReopenBtn}
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Mostrar panel de slides"
                        title="Mostrar slides"
                    >
                        <IconMenu size={15} />
                        <span className={styles.sidebarReopenCount}>{slides.length} slides</span>
                    </button>
                )}

                {/* Editor */}
                <div className={styles.mainContent}>
                    <div className={styles.mainPanel}>
                        <SlideEditorErrorBoundary onRestoreDefault={handleRestoreSlide}>
                            <SlideEditorPanel
                                key={selectedSlide?.id}
                                slide={selectedSlide}
                                onSave={handleSaveSlide}
                                onDelete={handleDeleteSlide}
                                onFormChange={handleFormChange}
                                isSaving={saving}
                            />
                        </SlideEditorErrorBoundary>
                    </div>
                </div>
            </div>
            {showSlideModal && (
                <div
                    className={styles.slideModalBackdrop}
                    onClick={(e) => { if (e.target === e.currentTarget) dispatch({ type: 'TOGGLE_MODAL', open: false }); }}
                >
                    <div className={styles.slideModalBox}>
                        <div className={styles.slideModalHeader}>
                            <div>
                                <h2 className={styles.slideModalTitle}>Agregar Slide</h2>
                                <p className={styles.slideModalSubtitle}>Selecciona el tipo de slide</p>
                            </div>
                            <button
                                className={styles.slideModalCloseBtn}
                                onClick={() => dispatch({ type: 'TOGGLE_MODAL', open: false })}
                                aria-label="Cerrar"
                            >
                                <IconX size={16} />
                            </button>
                        </div>
                        <div className={styles.slideModalBody}>
                            {SLIDE_SECTIONS.map((section) => (
                                <div key={section.label} className={styles.slideSection}>
                                    <p className={styles.slideSectionLabel}>{section.label}</p>
                                    <div className={styles.slideTypesGrid}>
                                        {section.types.map(({ type, label, icon: IconAsset, iconColor, desc }) => (
                                            <button
                                                key={type}
                                                onClick={() => handleConfirmSlideType(type)}
                                                className={styles.slideTypeCard}
                                                disabled={saving}
                                            >
                                                <div className={styles.slideTypeIcon} style={{ color: iconColor }}>
                                                    <IconAsset />
                                                </div>
                                                <div className={styles.slideTypeInfo}>
                                                    <h3 className={styles.slideTypeName}>{label}</h3>
                                                    <p className={styles.slideTypeDesc}>{desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
