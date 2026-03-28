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

// Un solo punto de importación: @/lib/icons
import {
    IconHolder, IconCopy, IconPlus, IconSearch,
    IconLayout, IconFontSize, IconFileText, IconCheckSquare,
    IconListBullets, IconGrid, IconDiff, IconZap,
} from '@/lib/icons';

import { SLIDE_TYPE_LABELS } from './slideConstants';
import styles from '@/app/induccion/cursos/[id]/editar/editor.module.css';

// ── Ícono por tipo de slide ───────────────────────────────────────────────────
const SLIDE_TYPE_ICONS = {
    title:         <IconFontSize size={14} />,
    objective:     <IconZap size={14} />,
    definition:    <IconFileText size={14} />,
    content:       <IconLayout size={14} />,
    benefits:      <IconListBullets size={14} />,
    icon_grid:     <IconGrid size={14} />,
    comparison:    <IconDiff size={14} />,
    quiz:          <IconCheckSquare size={14} />,
    group_quiz:    <IconCheckSquare size={14} />,
};

const getSlideIcon = (type) => SLIDE_TYPE_ICONS[type] ?? <IconFileText size={14} />;

const getSlideLabel = (slide) =>
    slide.data?.title || slide.data?.heading || slide.data?.question || 'Sin título';

// ── Ítem sortable individual ──────────────────────────────────────────────────
function SortableSlideItem({ slide, index, isActive, onSelect, onDuplicate, disabled }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: slide.id, disabled });

    const itemStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 10 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={itemStyle}
            className={`${styles.slideItem} ${isActive ? styles.active : ''} ${isDragging ? styles.dragging : ''}`}
            onClick={() => !disabled && onSelect(slide)}
        >
            {/* Handle de arrastre */}
            <span
                {...attributes}
                {...listeners}
                className={styles.dragHandle}
                title="Arrastrar para reordenar"
                onClick={e => e.stopPropagation()}
                aria-label="Arrastrar slide"
                style={{ cursor: disabled ? 'default' : undefined }}
            >
                <IconHolder size={14} />
            </span>

            <span className={styles.slideNumber}>{index + 1}</span>

            <div className={styles.slideInfo}>
                <span className={styles.slideType}>
                    {SLIDE_TYPE_LABELS[slide.type] || slide.type}
                </span>
                <span className={styles.slidePreview}>{getSlideLabel(slide)}</span>
            </div>

            <div className={styles.slideItemActions}>
                <button
                    className={styles.slideActionBtn}
                    onClick={e => { e.stopPropagation(); onDuplicate(slide); }}
                    disabled={disabled}
                    title="Duplicar slide"
                    aria-label={`Duplicar slide ${index + 1}`}
                    tabIndex={-1}
                >
                    <IconCopy size={13} />
                </button>
                <span style={{ color: isActive ? 'var(--c-primary)' : 'var(--c-muted)', flexShrink: 0 }}>
                    {getSlideIcon(slide.type)}
                </span>
            </div>
        </div>
    );
}

// ── Lista principal ───────────────────────────────────────────────────────────
/**
 * SlideList — Lista reordenable de slides con búsqueda y acción duplicar.
 *
 * @param {Array}    slides        - Array de slides
 * @param {Object}   currentSlide  - Slide actualmente seleccionado
 * @param {Function} onSelect      - Callback al seleccionar un slide
 * @param {Function} onAdd         - Callback para abrir el modal de tipo de slide
 * @param {Function} onReorder     - Callback al reordenar (recibe el array nuevo)
 * @param {Function} onDuplicate   - Callback al duplicar un slide
 * @param {boolean}  disabled      - Deshabilita DnD y botones durante operaciones
 */
export default function SlideList({ slides, currentSlide, onSelect, onAdd, onReorder, onDuplicate, disabled }) {
    const [activeId, setActiveId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

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

        if (!over || active.id === over.id || disabled) return;

        const oldIndex = slides.findIndex(s => s.id === active.id);
        const newIndex = slides.findIndex(s => s.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const reordered = arrayMove(slides, oldIndex, newIndex).map((slide, i) => ({
            ...slide,
            order: i + 1,
        }));

        onReorder?.(reordered);
    }, [slides, onReorder, disabled]);

    const handleDuplicate = useCallback((slide) => {
        onDuplicate?.(slide);
    }, [onDuplicate]);

    const activeSlide = activeId ? slides.find(s => s.id === activeId) : null;
    const activeIndex = activeSlide ? slides.indexOf(activeSlide) : -1;

    return (
        <div className={styles.slidesList}>
            {/* Búsqueda (visible con 5+ slides) */}
            {slides.length > 5 && (
                <div className={styles.slidesSearch}>
                    <IconSearch size={13} className={styles.slidesSearchIcon} aria-hidden="true" />
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
                        <div className={styles.slidesItemList}>
                            {filteredSlides.map(slide => (
                                <SortableSlideItem
                                    key={slide.id}
                                    slide={slide}
                                    index={slides.indexOf(slide)} // índice real, no del filtrado
                                    isActive={currentSlide?.id === slide.id}
                                    onSelect={onSelect}
                                    onDuplicate={handleDuplicate}
                                    disabled={disabled}
                                />
                            ))}
                        </div>
                    )}
                </SortableContext>

                {/* Fantasma del drag overlay */}
                <DragOverlay>
                    {activeSlide ? (
                        <div className={`${styles.slideItem} ${styles.dragOverlay}`}>
                            <span className={styles.dragHandle}><IconHolder size={14} /></span>
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

            <button className={styles.addSlideBtn} onClick={onAdd} disabled={disabled}>
                <IconPlus size={16} aria-hidden="true" /> Nuevo Slide
            </button>
        </div>
    );
}
