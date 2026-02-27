'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconX } from '@/lib/icons';
import { getCourseWithSlides, updateSlide, addSlide, deleteSlide, updateSlidesOrder } from '@/lib/courseService';
import { useToast } from '@/components/ui/Toast/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import SlideList from '@/components/features/Courses/Editor/SlideList';
import SlideEditorPanel from '@/components/features/Courses/Editor/SlideEditorPanel';
import CoursePlayer from '@/components/features/Courses/CoursePlayer';
import styles from './editor.module.css';

const SLIDE_TYPES = [
    { type: 'title', label: 'Portada', emoji: '🎯', desc: 'Título principal del curso' },
    { type: 'content', label: 'Contenido', emoji: '📄', desc: 'Texto e imagen' },
    { type: 'objective', label: 'Objetivo', emoji: '🎓', desc: 'Objetivo de aprendizaje' },
    { type: 'benefits', label: 'Beneficios', emoji: '✅', desc: 'Lista de beneficios' },
    { type: 'icon_grid', label: 'Íconos', emoji: '🔲', desc: 'Cuadrícula de íconos' },
    { type: 'comparison', label: 'Comparación', emoji: '⚖️', desc: 'Dos columnas comparativas' },
    { type: 'quiz', label: 'Quiz', emoji: '❓', desc: 'Pregunta con opciones' },
    { type: 'definition', label: 'Definición', emoji: '📖', desc: 'Término y definición' },
];

export default function EditorPage({ params }) {
    const { id: courseId } = params;
    const router = useRouter();
    const { toast } = useToast();
    const confirm = useConfirm();

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
        const isConfirmed = await confirm({
            title: '¿Eliminar Slide?',
            message: 'Esta acción no se puede deshacer. ¿Deseas eliminar este slide permanente?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            variant: 'danger'
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

    // Crear nuevo slide desde el modal
    const handleConfirmSlideType = async (type) => {
        setShowSlideModal(false);
        setSaving(true);
        const result = await addSlide(courseId, {
            type,
            data: { heading: 'Nuevo Slide', body: 'Contenido inicial...', title: 'Nuevo Slide' },
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
                <div
                    onClick={() => setShowSlideModal(false)}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 9999, padding: '20px',
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-primary)',
                            borderRadius: 18,
                            padding: '28px 24px',
                            width: '100%',
                            maxWidth: 500,
                            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
                            border: '1px solid var(--border-color)',
                        }}
                    >
                        {/* Cabecera del modal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    Nuevo Slide
                                </h2>
                                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                    Elige el tipo de contenido
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSlideModal(false)}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 8,
                                    width: 30, height: 30,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', color: 'var(--text-secondary)',
                                }}
                            >
                                <IconX size={14} />
                            </button>
                        </div>

                        {/* Grid de tipos de slide */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                            {SLIDE_TYPES.map(({ type, label, emoji, desc }) => (
                                <button
                                    key={type}
                                    onClick={() => handleConfirmSlideType(type)}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 10,
                                        padding: '12px 14px',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 12, cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'border-color 0.15s, background 0.15s',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.borderColor = 'rgba(232,116,42,0.45)';
                                        e.currentTarget.style.background = 'rgba(232,116,42,0.06)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.borderColor = 'var(--border-color)';
                                        e.currentTarget.style.background = 'var(--bg-secondary)';
                                    }}
                                >
                                    <span style={{ fontSize: '1.4rem', lineHeight: 1, flexShrink: 0, marginTop: 1 }}>
                                        {emoji}
                                    </span>
                                    <div>
                                        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {label}
                                        </p>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
                                            {desc}
                                        </p>
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
