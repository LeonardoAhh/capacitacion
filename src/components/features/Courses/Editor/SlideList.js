'use client';

import { useState, useCallback, useMemo } from 'react';
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
    AiOutlineLayout, AiOutlineFontSize, AiOutlineFileText, AiOutlineCheckSquare,
    AiOutlineUnorderedList, AiOutlineAppstore, AiOutlineDiff, AiOutlineThunderbolt,
    AiOutlinePlus, AiOutlineHolder, AiOutlineSearch, AiOutlineCopy,
} from 'react-icons/ai';
import styles from '@/app/induccion/cursos/[id]/editar/editor.module.css';

/** Mapa de tipo de slide → ícono de react-icons/ai */
const getSlideIcon = (type) => {
    switch (type) {
        case 'title': return <AiOutlineFontSize size={14} />;
        case 'objective': return <AiOutlineThunderbolt size={14} />;
        case 'definition': return <AiOutlineFileText size={14} />;
        case 'content': return <AiOutlineLayout size={14} />;
        case 'benefits': return <AiOutlineUnorderedList size={14} />;
        case 'icon_grid': return <AiOutlineAppstore size={14} />;
        case 'comparison': return <AiOutlineDiff size={14} />;
        case 'quiz':
        case 'group_quiz': return <AiOutlineCheckSquare size={14} />;
        default: return <AiOutlineFileText size={14} />;
    }
};

/** Etiqueta legible para el tipo de slide */
const SLIDE_TYPE_LABELS = {
    title: 'Portada', objective: 'Objetivo', definition: 'Definición',
    content: 'Contenido', benefits: 'Beneficios', icon_grid: 'Íconos',
    comparison: 'Comparación', quiz: 'Quiz', group_quiz: 'Quiz',
    dynamic: 'Dinámica', group_dynamic: 'Dinámica',
};

const getSlideLabel = (slide) => {
    if (slide.data?.title) return slide.data.title;
    if (slide.data?.heading) return slide.data.heading;
    if (slide.data?.question) return slide.data.question;
    return 'Sin título';
};

// ── Ítem Sortable individual ──────────────────────────────────────────────────
function SortableSlideItem({ slide, index, isActive, onSelect, onDuplicate }) {
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
                <AiOutlineHolder size={14} />
            </span>

            <span className={styles.slideNumber}>{index + 1}</span>
            <div className={styles.slideInfo}>
                <span className={styles.slideType}>
                    {SLIDE_TYPE_LABELS[slide.type] || slide.type}
                </span>
                <span className={styles.slidePreview}>
                    {getSlideLabel(slide)}
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {/* Botón duplicar */}
                <button
                    className={styles.slideActionBtn}
                    onClick={(e) => { e.stopPropagation(); onDuplicate(slide); }}
                    title="Duplicar slide"
                    aria-label={`Duplicar slide ${index + 1}`}
                    tabIndex={-1}
                >
                    <AiOutlineCopy size={13} />
                </button>
                <span style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-tertiary)' }}>
                    {getSlideIcon(slide.type)}
                </span>
            </div>
        </div>
    );
}

// ── Lista principal ───────────────────────────────────────────────────────────
/**
 * SlideList — Lista reordenable de slides con búsqueda y acción duplicar
 *
 * @param {Object}   props
 * @param {Array}    props.slides        - Array de slides
 * @param {Object}   props.currentSlide  - Slide actualmente seleccionado
 * @param {Function} props.onSelect      - Callback al seleccionar un slide
 * @param {Function} props.onAdd         - Callback para abrir el modal de tipo de slide
 * @param {Function} props.onReorder     - Callback al reordenar (recibe el array nuevo)
 * @param {Function} [props.onDuplicate] - Callback al duplicar un slide
 */
export default function SlideList({ slides, currentSlide, onSelect, onAdd, onReorder, onDuplicate }) {
    const [activeId, setActiveId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Filtrar slides por búsqueda
    const filteredSlides = useMemo(() => {
        if (!searchQuery.trim()) return slides;
        const q = searchQuery.toLowerCase();
        return slides.filter(s =>
            getSlideLabel(s).toLowerCase().includes(q) ||
            (SLIDE_TYPE_LABELS[s.type] || s.type).toLowerCase().includes(q)
        );
    }, [slides, searchQuery]);

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

    const handleDuplicate = useCallback((slide) => {
        if (onDuplicate) onDuplicate(slide);
    }, [onDuplicate]);

    return (
        <div className={styles.slidesList}>
            {/* Búsqueda (visible cuando hay más de 5 slides) */}
            {slides.length > 5 && (
                <div className={styles.slidesSearch}>
                    <AiOutlineSearch size={13} className={styles.slidesSearchIcon} aria-hidden="true" />
                    <input
                        type="text"
                        placeholder="Buscar slide..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className={styles.slidesSearchInput}
                        aria-label="Buscar entre slides"
                    />
                </div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={filteredSlides.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {filteredSlides.length === 0 ? (
                        <p className={styles.slidesEmpty}>
                            Sin resultados para &quot;{searchQuery}&quot;
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {filteredSlides.map((slide, index) => (
                                <SortableSlideItem
                                    key={slide.id}
                                    slide={slide}
                                    index={slides.indexOf(slide)} // índice real, no del filtrado
                                    isActive={currentSlide?.id === slide.id}
                                    onSelect={onSelect}
                                    onDuplicate={handleDuplicate}
                                />
                            ))}
                        </div>
                    )}
                </SortableContext>

                {/* Fantasma del drag overlay */}
                <DragOverlay>
                    {activeSlide ? (
                        <div className={`${styles.slideItem} ${styles.dragOverlay}`}>
                            <span className={styles.dragHandle}><AiOutlineHolder size={14} /></span>
                            <span className={styles.slideNumber}>{activeIndex + 1}</span>
                            <div className={styles.slideInfo}>
                                <span className={styles.slideType}>
                                    {SLIDE_TYPE_LABELS[activeSlide.type] || activeSlide.type}
                                </span>
                                <span className={styles.slidePreview}>{getSlideLabel(activeSlide)}</span>
                            </div>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            <button className={styles.addSlideBtn} onClick={onAdd}>
                <AiOutlinePlus size={16} aria-hidden="true" /> Nuevo Slide
            </button>
        </div>
    );
}
