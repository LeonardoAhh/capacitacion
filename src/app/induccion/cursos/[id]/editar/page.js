'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Save } from 'lucide-react';
import { getCourseWithSlides, updateSlide, addSlide } from '@/lib/courseService';
import { useToast } from '@/components/ui/Toast/Toast';
import SlideList from '@/components/features/Courses/Editor/SlideList';
import SlideEditorPanel from '@/components/features/Courses/Editor/SlideEditorPanel';
import styles from './editor.module.css';

export default function EditorPage({ params }) {
    const { id: courseId } = params;
    const router = useRouter();
    const { toast } = useToast();

    const [course, setCourse] = useState(null);
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlide, setSelectedSlide] = useState(null);
    const [saving, setSaving] = useState(false);

    // Cargar datos del curso
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const result = await getCourseWithSlides(courseId);
            if (result.success) {
                setCourse(result.data.course);
                setSlides(result.data.slides);
                // Seleccionar el primer slide por defecto
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
    const handleSaveSlide = async (slideId, newData) => {
        setSaving(true);
        const result = await updateSlide(courseId, slideId, { data: newData });

        if (result.success) {
            toast.success('Guardado', 'Slide actualizado correctamente');

            // Actualizar estado local
            setSlides(prev => prev.map(s =>
                s.id === slideId ? { ...s, data: newData } : s
            ));

            // Actualizar slide seleccionado si es el mismo
            if (selectedSlide?.id === slideId) {
                setSelectedSlide(prev => ({ ...prev, data: newData }));
            }
        } else {
            toast.error('Error', 'No se pudo guardar el slide');
        }
        setSaving(false);
    };

    // Agregar nuevo slide
    const handleAddSlide = async () => {
        const type = window.prompt(
            'Tipo de slide (title, content, icon_grid, comparison, quiz, benefits, objective, definition):',
            'content'
        );
        if (!type || type.trim() === '') return;

        setSaving(true);
        const result = await addSlide(courseId, {
            type: type.toLowerCase().trim(),
            data: {
                heading: 'Nuevo Slide',
                body: 'Contenido inicial...',
                title: 'Nuevo Slide'
            },
            order: slides.length + 1
        });

        if (result.success) {
            toast.success('Slide agregado', 'Se ha creado el nuevo slide');
            const newSlide = { id: result.id, ...result };

            setSlides(prev => [...prev, newSlide]);
            setSelectedSlide(newSlide);
        } else {
            toast.error('Error', result.error || 'No se pudo crear el slide');
        }
        setSaving(false);
    };

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
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className={styles.courseTitle}>{course?.title}</h1>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                            Editando contenido
                        </span>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    {/* Futuro: Botón para previsualizar curso completo */}
                </div>
            </header>

            {/* Workspace */}
            <div className={styles.workspace}>
                {/* Sidebar Izquierda */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <span>Slides ({slides.length})</span>
                    </div>
                    <SlideList
                        slides={slides}
                        currentSlide={selectedSlide}
                        onSelect={setSelectedSlide}
                        onAdd={handleAddSlide}
                    />
                </aside>

                {/* Panel Principal */}
                <main className={styles.mainPanel}>
                    <SlideEditorPanel
                        slide={selectedSlide}
                        onSave={handleSaveSlide}
                    />
                </main>
            </div>
        </div>
    );
}
