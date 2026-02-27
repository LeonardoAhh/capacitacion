'use client';

import { useEffect, useRef } from 'react';
import { IconX } from '@/lib/icons';
import styles from './TableOfContents.module.css';

/** Mapeo de tipo de slide → badge abreviado */
const TYPE_LABELS = {
    title: { label: 'Intro', color: '#6366f1' },
    objective: { label: 'Obj.', color: '#0ea5e9' },
    definition: { label: 'Def.', color: '#14b8a6' },
    content: { label: 'Cont.', color: '#64748b' },
    icon_grid: { label: 'Grid', color: '#8b5cf6' },
    benefits: { label: 'Ben.', color: '#22c55e' },
    comparison: { label: 'Comp.', color: '#f97316' },
    quiz: { label: 'Quiz', color: '#ef4444' },
    group_quiz: { label: 'Quiz', color: '#ef4444' },
    group_dynamic: { label: 'Dinámica', color: '#f59e0b' },
    dynamic: { label: 'Dinámica', color: '#f59e0b' },
};

/**
 * Tabla de Contenidos del Curso — Drawer lateral
 * @param {Object}   props
 * @param {boolean}  props.isOpen   - Controla si el drawer está abierto
 * @param {Function} props.onClose  - Callback para cerrar el drawer
 * @param {Array}    props.slides   - Array de slides filtrados (sin quiz si aplica)
 * @param {number}   props.current  - Índice del slide actual
 * @param {Function} props.onSelect - Callback al seleccionar un slide (recibe index)
 */
export default function TableOfContents({ isOpen, onClose, slides = [], current, onSelect }) {
    const drawerRef = useRef(null);

    // Cerrar con Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Scroll al item activo cuando se abre
    useEffect(() => {
        if (!isOpen) return;
        const activeItem = drawerRef.current?.querySelector('[data-active="true"]');
        activeItem?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, [isOpen, current]);

    const getSlideTitle = (slide) => {
        const d = slide?.data || {};
        return d.title || d.heading || d.question || slide?.type || '';
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`${styles.backdrop} ${isOpen ? styles.backdropVisible : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer */}
            <aside
                ref={drawerRef}
                className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}
                aria-label="Índice del curso"
                aria-hidden={!isOpen}
                role="navigation"
            >
                <div className={styles.drawerHeader}>
                    <div>
                        <h2 className={styles.drawerTitle}>Contenido del Curso</h2>
                        <span className={styles.drawerMeta}>{slides.length} slides</span>
                    </div>
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Cerrar índice"
                    >
                        <IconX size={16} />
                    </button>
                </div>

                <ul className={styles.list} role="list">
                    {slides.map((slide, i) => {
                        const typeInfo = TYPE_LABELS[slide.type] || { label: slide.type, color: '#64748b' };
                        const title = getSlideTitle(slide);
                        const isActive = i === current;
                        const isVisited = i < current;

                        return (
                            <li key={slide.id || i}>
                                <button
                                    className={`${styles.item} ${isActive ? styles.itemActive : ''} ${isVisited ? styles.itemVisited : ''}`}
                                    onClick={() => { onSelect(i); onClose(); }}
                                    data-active={isActive}
                                    aria-current={isActive ? 'true' : undefined}
                                    aria-label={`Slide ${i + 1}: ${title}`}
                                >
                                    {/* Número */}
                                    <span className={`${styles.itemNum} ${isActive ? styles.itemNumActive : ''}`}>
                                        {isVisited && !isActive ? '✓' : i + 1}
                                    </span>

                                    {/* Contenido */}
                                    <div className={styles.itemContent}>
                                        <span
                                            className={styles.itemBadge}
                                            style={{ '--badge-color': typeInfo.color }}
                                        >
                                            {typeInfo.label}
                                        </span>
                                        <span className={styles.itemTitle}>{title || `Slide ${i + 1}`}</span>
                                    </div>

                                    {/* Indicador activo */}
                                    {isActive && <span className={styles.activeIndicator} aria-hidden="true" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </aside>
        </>
    );
}
