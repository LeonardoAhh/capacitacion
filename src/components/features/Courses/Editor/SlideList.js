'use client';

import { useState, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    LayoutTemplate, Type, FileText, CheckSquare,
    List, Grid, Columns, Zap, Plus, GripVertical
} from 'lucide-react';
import styles from '@/app/induccion/cursos/[id]/editar/editor.module.css';

const getSlideIcon = (type) => {
    switch (type) {
        case 'title': return <Type size={14} />;
        case 'objective': return <Zap size={14} />;
        case 'definition': return <FileText size={14} />;
        case 'content': return <LayoutTemplate size={14} />;
        case 'benefits': return <List size={14} />;
        case 'icon_grid': return <Grid size={14} />;
        case 'comparison': return <Columns size={14} />;
        case 'quiz': return <CheckSquare size={14} />;
        default: return <FileText size={14} />;
    }
};

const getSlideLabel = (slide) => {
    if (slide.data?.title) return slide.data.title;
    if (slide.data?.heading) return slide.data.heading;
    if (slide.data?.question) return slide.data.question;
    return 'Sin título';
};

// ── Ítem Sortable individual ──
function SortableSlideItem({ slide, index, isActive, onSelect }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: slide.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${styles.slideItem} ${isActive ? styles.active : ''} ${isDragging ? styles.dragging : ''}`}
            onClick={() => onSelect(slide)}
        >
            {/* Handle de arrastre */}
            <span
                {...attributes}
                {...listeners}
                className={styles.dragHandle}
                title="Arrastrar para reordenar"
                onClick={(e) => e.stopPropagation()}
                aria-label="Arrastrar slide"
            >
                <GripVertical size={14} />
            </span>

            <span className={styles.slideNumber}>{index + 1}</span>
            <div className={styles.slideInfo}>
                <span className={styles.slideType}>{slide.type}</span>
                <span className={styles.slidePreview}>
                    {getSlideLabel(slide)}
                </span>
            </div>
            <div style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-tertiary)', flexShrink: 0 }}>
                {getSlideIcon(slide.type)}
            </div>
        </div>
    );
}

// ── Lista principal ──
export default function SlideList({ slides, currentSlide, onSelect, onAdd, onReorder }) {
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 }, // Pequeño threshold para no interferir con el click
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = useCallback((event) => {
        setActiveId(event.active.id);
    }, []);

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const oldIndex = slides.findIndex(s => s.id === active.id);
        const newIndex = slides.findIndex(s => s.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(slides, oldIndex, newIndex).map((slide, i) => ({
            ...slide,
            order: i + 1,
        }));

        if (onReorder) onReorder(reordered);
    }, [slides, onReorder]);

    const activeSlide = activeId ? slides.find(s => s.id === activeId) : null;
    const activeIndex = activeSlide ? slides.indexOf(activeSlide) : -1;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className={styles.slidesList}>
                <SortableContext
                    items={slides.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {slides.map((slide, index) => (
                        <SortableSlideItem
                            key={slide.id}
                            slide={slide}
                            index={index}
                            isActive={currentSlide?.id === slide.id}
                            onSelect={onSelect}
                        />
                    ))}
                </SortableContext>

                {/* Fantasma del drag overlay */}
                <DragOverlay>
                    {activeSlide ? (
                        <div className={`${styles.slideItem} ${styles.dragOverlay}`}>
                            <span className={styles.dragHandle}><GripVertical size={14} /></span>
                            <span className={styles.slideNumber}>{activeIndex + 1}</span>
                            <div className={styles.slideInfo}>
                                <span className={styles.slideType}>{activeSlide.type}</span>
                                <span className={styles.slidePreview}>{getSlideLabel(activeSlide)}</span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>

                <button className={styles.addSlideBtn} onClick={onAdd}>
                    <Plus size={16} /> Nuevo Slide
                </button>
            </div>
        </DndContext>
    );
}
