'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    IconArrowLeft, IconX,
    IconTarget, IconFileText, IconGraduationCap,
    IconCheckSquare, IconGrid, IconColumns, IconBookOpen, IconList
} from '@/lib/icons';
import { getCourseWithSlides, updateSlide, addSlide, deleteSlide, updateSlidesOrder, duplicateSlide } from '@/lib/courseService';
import { useToast } from '@/components/ui/Toast/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import SlideList from '@/components/features/Courses/Editor/SlideList';
import SlideEditorPanel from '@/components/features/Courses/Editor/SlideEditorPanel';
import CoursePlayer from '@/components/features/Courses/CoursePlayer';
import styles from './editor.module.css';

const SLIDE_TYPES = [
    { type: 'title', label: 'Portada', icon: IconTarget, iconColor: 'var(--purple-500)', desc: 'Título principal del curso' },
    { type: 'content', label: 'Contenido', icon: IconFileText, iconColor: 'var(--cyan-500)', desc: 'Texto e imagen' },
    { type: 'objective', label: 'Objetivo', icon: IconGraduationCap, iconColor: 'var(--amber-500)', desc: 'Objetivo de aprendizaje' },
    { type: 'benefits', label: 'Beneficios', icon: IconCheckSquare, iconColor: 'var(--green-500)', desc: 'Lista de beneficios' },
    { type: 'icon_grid', label: 'Íconos', icon: IconGrid, iconColor: 'var(--color-accent)', desc: 'Cuadrícula de íconos' },
    { type: 'comparison', label: 'Comparación', icon: IconColumns, iconColor: 'var(--color-warning)', desc: 'Dos columnas comparativas' },
    { type: 'steps', label: 'Paso a Paso', icon: IconList, iconColor: 'var(--teal-500, #14b8a6)', desc: 'Secuencia numerada de pasos' },
    { type: 'quiz', label: 'Quiz', icon: IconBookOpen, iconColor: 'var(--color-danger)', desc: 'Pregunta con opciones' },
    { type: 'definition', label: 'Definición', icon: IconBookOpen, iconColor: 'var(--blue-500)', desc: 'Término y definición' },
];

export default function EditorPage({ params }) {
    const { id: courseId } = params;
    const router = useRouter();
    const { toast } = useToast();
    const { showConfirm, confirmDialog } = useConfirm();

    const [course, setCourse] = useState(null);
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlide, setSelectedSlide] = useState(null);
    const [livePreviewSlide, setLivePreviewSlide] = useState(null); // data en tiempo real para preview
    const [saving, setSaving] = useState(false);
    const [showSlideModal, setShowSlideModal] = useState(false);

    // Cargar datos del curso
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const result = await getCourseWithSlides(courseId);
            if (result.success) {
                setCourse(result.data.course);
                setSlides(result.data.slides);
                if (result.data.slides.length > 0) {
                    setSelectedSlide(result.data.slides[0]);
                }
            } else {
                toast.error('Error', 'No se pudo cargar el curso');
                router.push('/induccion');
            }
            setLoading(false);
        };
        loadData();
    }, [courseId, router, toast]);

    // Guardar cambios en un slide
    const handleSaveSlide = useCallback(async (slideId, newData) => {
        setSaving(true);
        const result = await updateSlide(courseId, slideId, { data: newData });
        if (result.success) {
            setSlides(prev => prev.map(s => s.id === slideId ? { ...s, data: newData } : s));
            setSelectedSlide(prev => prev?.id === slideId ? { ...prev, data: newData } : prev);
        } else {
            toast.error('Error', 'No se pudo guardar el slide');
        }
        setSaving(false);
    }, [courseId, toast]);

    // Eliminar un slide
    const handleDeleteSlide = async (slideId) => {
        const isConfirmed = await showConfirm('Esta acción no se puede deshacer. ¿Deseas eliminar este slide permanentemente?', {
            title: '¿Eliminar Slide?',
            danger: true,
            confirmLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
        });

        if (!isConfirmed) return;

        setSaving(true);
        const result = await deleteSlide(courseId, slideId);

        if (result.success) {
            toast.success('Eliminado', 'Slide eliminado del curso');
            const updatedSlides = slides.filter(s => s.id !== slideId);
            setSlides(updatedSlides);
            const nextSelected = updatedSlides.length > 0 ? updatedSlides[0] : null;
            setSelectedSlide(nextSelected);
            setLivePreviewSlide(nextSelected);
        } else {
            toast.error('Error', result.error || 'No se pudo eliminar el slide');
        }
        setSaving(false);
    };

    // Callback en tiempo real del formulario del editor → actualizar preview
    const handleFormChange = useCallback((newFormData) => {
        setLivePreviewSlide(prev => prev ? { ...prev, data: newFormData } : null);
    }, []);

    // Cambiar slide activo — resetear también el live preview
    const handleSelectSlide = useCallback((slide) => {
        setSelectedSlide(slide);
        setLivePreviewSlide(slide); // inicia preview con data guardada
    }, []);

    // Reordenar slides (Drag & Drop)
    const handleReorderSlides = useCallback(async (newOrderedSlides) => {
        setSlides(newOrderedSlides);
        await updateSlidesOrder(courseId, newOrderedSlides);
    }, [courseId]);

    // Duplicar slide — crea una copia inmediatamente después del original
    const handleDuplicateSlide = useCallback(async (slide) => {
        setSaving(true);
        const result = await duplicateSlide(courseId, slide, slides);
        if (result.success) {
            toast.success('Duplicado', 'Slide duplicado correctamente');
            // Recargar desde Firebase para reflejar el nuevo orden
            const refreshed = await getCourseWithSlides(courseId);
            if (refreshed.success) {
                setSlides(refreshed.data.slides);
                handleSelectSlide(result.newSlide);
            }
        } else {
            toast.error('Error', result.error || 'No se pudo duplicar el slide');
        }
        setSaving(false);
    }, [courseId, slides, toast, handleSelectSlide]);

    // Crear nuevo slide desde el modal
    const handleConfirmSlideType = async (type) => {
        setShowSlideModal(false);
        setSaving(true);

        let defaultData = { heading: 'Nuevo Slide' };

        if (type === 'quiz') {
            defaultData = {
                heading: 'Evaluación Final',
                questions: [
                    { q: 'Escribe tu pregunta aquí...', options: ['Opción 1', 'Opción 2', 'Opción 3'], correct: 0, explanation: '' }
                ],
                passingScore: 70
            };
        } else if (type === 'objective') {
            defaultData = { heading: 'Objetivo del Curso', body: 'Al finalizar, el usuario será capaz de...' };
        } else if (type === 'icon_grid') {
            defaultData = { heading: 'Puntos Clave', items: [{ icon: 'IconStar', text: 'Punto 1', desc: '' }] };
        } else if (type === 'benefits') {
            defaultData = { heading: 'Beneficios', items: ['Beneficio 1', 'Beneficio 2'] };
        } else if (type === 'comparison') {
            defaultData = { heading: 'Comparativa', col1Title: 'Antes', col1Items: ['Item A'], col2Title: 'Después', col2Items: ['Item B'] };
        } else if (type === 'definition') {
            defaultData = { heading: 'Concepto Clave', term: 'Término', definition: 'Su definición breve aquí' };
        } else if (type === 'steps') {
            defaultData = {
                heading: 'Cómo hacerlo',
                steps: [
                    { title: 'Paso 1', desc: 'Describe el primer paso aquí...', image: '' },
                    { title: 'Paso 2', desc: 'Describe el segundo paso aquí...', image: '' },
                ],
            };
        } else {
            defaultData = { heading: 'Nuevo Slide', body: 'Contenido inicial...' }; // Title & Content
        }

        const result = await addSlide(courseId, {
            type,
            data: defaultData,
            order: slides.length + 1,
        });
        if (result.success) {
            toast.success('Slide agregado', 'Se ha creado el nuevo slide');
            const newSlide = { id: result.id, ...result };
            setSlides(prev => [...prev, newSlide]);
            handleSelectSlide(newSlide);
        } else {
            toast.error('Error', result.error || 'No se pudo crear el slide');
        }
        setSaving(false);
    };

    // Sincronizar livePreviewSlide cuando arranque (primer slide)
    useEffect(() => {
        if (!livePreviewSlide && slides.length > 0) {
            setLivePreviewSlide(slides[0]);
        }
    }, [slides, livePreviewSlide]);

    if (loading) {
        return (
            <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <p>Cargando editor...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {confirmDialog}
            {/* Header / Toolbar */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <button
                        className={styles.backBtn}
                        onClick={() => router.push('/induccion')}
                        title="Volver a Inducción"
                    >
                        <IconArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={styles.courseTitle}>{course?.title}</h1>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                            Editando contenido
                        </span>
                    </div>
                </div>
                <div className={styles.headerActions} />
            </header>

            {/* Workspace */}
            <div className={styles.workspace}>
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <span>Slides ({slides.length})</span>
                    </div>
                    <SlideList
                        slides={slides}
                        currentSlide={selectedSlide}
                        onSelect={handleSelectSlide}
                        onAdd={() => setShowSlideModal(true)}
                        onReorder={handleReorderSlides}
                        onDuplicate={handleDuplicateSlide}
                    />
                </aside>

                <div className={styles.mainContent}>
                    <div className={styles.mainPanel}>
                        <SlideEditorPanel
                            slide={selectedSlide}
                            onSave={handleSaveSlide}
                            onDelete={handleDeleteSlide}
                            onFormChange={handleFormChange}
                        />
                    </div>
                    <div className={styles.previewPanel}>
                        <span className={styles.previewLabel}>Vista Previa en Vivo</span>
                        <div className={styles.previewWrapper}>
                            {/* Overlay transparente para prevenir interacción con el preview */}
                            <div style={{ position: 'absolute', inset: 0, zIndex: 100, cursor: 'default' }} />
                            {livePreviewSlide ? (
                                <CoursePlayer
                                    course={course}
                                    slides={[livePreviewSlide]}
                                    onClose={() => { }}
                                    inline={true}
                                />
                            ) : (
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    height: '100%', flexDirection: 'column', gap: 12,
                                    color: 'var(--text-tertiary)', background: 'var(--bg-secondary)'
                                }}>
                                    <span style={{ fontSize: '2rem' }}>👁</span>
                                    <span style={{ fontSize: '0.85rem' }}>Selecciona un slide para previsualizar</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modal: Elegir tipo de slide ── */}
            {showSlideModal && (
                <div className={styles.slideModalBackdrop} onClick={() => setShowSlideModal(false)}>
                    <div className={styles.slideModalBox} onClick={e => e.stopPropagation()}>

                        <div className={styles.slideModalHeader}>
                            <div>
                                <h2 className={styles.slideModalTitle}>Nuevo Slide</h2>
                                <p className={styles.slideModalSubtitle}>Elige el tipo de contenido</p>
                            </div>
                            <button className={styles.slideModalCloseBtn} onClick={() => setShowSlideModal(false)}>
                                <IconX size={16} />
                            </button>
                        </div>

                        <div className={styles.slideTypesGrid}>
                            {SLIDE_TYPES.map(({ type, label, icon: IconAsset, iconColor, desc }) => (
                                <button
                                    key={type}
                                    onClick={() => handleConfirmSlideType(type)}
                                    className={styles.slideTypeCard}
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
