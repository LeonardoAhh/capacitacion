'use client';

import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    IconArrowLeft, IconX, IconMenu,
    IconTarget, IconFileText, IconGraduationCap,
    IconCheckSquare, IconGrid, IconColumns, IconBookOpen, IconList,
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

// ── Tipos de slide para el modal ─────────────────────────────────────────────
const SLIDE_TYPES = [
    { type: 'title',      label: 'Portada',      icon: IconTarget,       iconColor: 'var(--purple-500)',               desc: 'Título principal del curso' },
    { type: 'content',    label: 'Contenido',     icon: IconFileText,     iconColor: 'var(--cyan-500)',                 desc: 'Texto e imagen' },
    { type: 'objective',  label: 'Objetivo',      icon: IconGraduationCap,iconColor: 'var(--amber-500)',               desc: 'Objetivo de aprendizaje' },
    { type: 'benefits',   label: 'Beneficios',    icon: IconCheckSquare,  iconColor: 'var(--green-500)',                desc: 'Lista de beneficios' },
    { type: 'icon_grid',  label: 'Íconos',        icon: IconGrid,         iconColor: 'var(--color-accent)',             desc: 'Cuadrícula de íconos' },
    { type: 'comparison', label: 'Comparación',   icon: IconColumns,      iconColor: 'var(--color-warning)',            desc: 'Dos columnas comparativas' },
    { type: 'steps',      label: 'Paso a Paso',   icon: IconList,         iconColor: 'var(--teal-500, #14b8a6)',        desc: 'Secuencia numerada de pasos' },
    { type: 'quiz',       label: 'Quiz',          icon: IconBookOpen,     iconColor: 'var(--color-danger)',             desc: 'Pregunta con opciones' },
    { type: 'definition', label: 'Definición',    icon: IconBookOpen,     iconColor: 'var(--blue-500)',                 desc: 'Término y definición' },
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
                    <span className={styles.shortcutsHint} title="Alt+↑/↓ · Alt+D duplicar · Alt+N nuevo · Alt+Supr eliminar">
                        Alt+↑↓ · Alt+D · Alt+N
                    </span>
                </div>
            </header>

            {/* ── Workspace ── */}
            <div className={styles.workspace}>
                {/* Sidebar */}
                <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                    <div className={styles.sidebarHeader}>
                        <span>Slides ({slides.length})</span>
                        <button
                            className={styles.sidebarCloseBtn}
                            onClick={() => setSidebarOpen(false)}
                            aria-label="Cerrar"
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

                {/* Editor + Preview */}
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
                    <div className={styles.previewPanel}>
                        <span className={styles.previewLabel}>Vista Previa en Vivo</span>
                        <div className={styles.previewWrapper}>
                            {/* Overlay transparente para prevenir interacción con el preview */}
                            <div className={styles.previewOverlay} />
                            {livePreviewSlide ? (
                                <CoursePlayer
                                    course={course}
                                    slides={[livePreviewSlide]}
                                    onClose={() => {}}
                                    inline={true}
                                />
                            ) : (
                                <div className={styles.previewEmpty}>
                                    <span style={{ fontSize: '2rem' }}>👁</span>
                                    <span>Selecciona un slide para previsualizar</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modal: Elegir tipo de slide ── */}
            {showSlideModal && (
                <div
                    className={styles.slideModalBackdrop}
                    onClick={() => dispatch({ type: 'TOGGLE_MODAL', open: false })}
                >
                    <div className={styles.slideModalBox} onClick={e => e.stopPropagation()}>
                        <div className={styles.slideModalHeader}>
                            <div>
                                <h2 className={styles.slideModalTitle}>Nuevo Slide</h2>
                                <p className={styles.slideModalSubtitle}>Elige el tipo de contenido</p>
                            </div>
                            <button
                                className={styles.slideModalCloseBtn}
                                onClick={() => dispatch({ type: 'TOGGLE_MODAL', open: false })}
                                aria-label="Cerrar modal"
                            >
                                <IconX size={16} />
                            </button>
                        </div>

                        <div className={styles.slideTypesGrid}>
                            {SLIDE_TYPES.map(({ type, label, icon: IconAsset, iconColor, desc }) => (
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
                </div>
            )}
        </div>
    );
}
