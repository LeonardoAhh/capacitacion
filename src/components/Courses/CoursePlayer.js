'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import SlideRenderer from './SlideRenderer';
import styles from './CoursePlayer.module.css';

/** Tipos de slide que usan fondo oscuro */
const DARK_SLIDE_TYPES = ['title', 'icon_grid'];

/**
 * Reproductor premium fullscreen de slides.
 */
export default function CoursePlayer({ course, slides, onClose }) {
    const [current, setCurrent] = useState(0);

    // Excluir slides de tipo quiz (exámenes en papel)
    const filteredSlides = (slides || []).filter(s => s.type !== 'quiz');
    const total = filteredSlides.length;
    const isFirst = current === 0;
    const isLast = current === total - 1;
    const progress = total > 0 ? ((current + 1) / total) * 100 : 0;

    const currentSlide = filteredSlides[current];
    const isDark = currentSlide && DARK_SLIDE_TYPES.includes(currentSlide.type);

    const goNext = useCallback(() => {
        if (!isLast) setCurrent((c) => c + 1);
    }, [isLast]);

    const goPrev = useCallback(() => {
        if (!isFirst) setCurrent((c) => c - 1);
    }, [isFirst]);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
            else if (e.key === 'Escape') { onClose(); }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [goNext, goPrev, onClose]);

    if (!filteredSlides || total === 0) {
        return (
            <div className={styles.overlay}>
                <div className={styles.emptyMsg}>Sin slides para mostrar.</div>
            </div>
        );
    }

    return (
        <div className={`${styles.overlay} ${isDark ? styles.overlayDark : styles.overlayLight}`}>
            {/* ── Header ── */}
            <header className={styles.header}>
                <button className={styles.exitBtn} onClick={onClose}>
                    <ArrowLeft size={16} />
                    <span>Salir</span>
                </button>

                <span className={styles.headerTitle}>{course?.title || 'Curso'}</span>

                <div className={styles.headerRight}>
                    <span className={styles.counter}>{current + 1} / {total}</span>
                    <div className={styles.progressTrack}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </header>

            {/* ── Slide Content ── */}
            <main className={styles.content}>
                <SlideRenderer slide={currentSlide} isDark={isDark} />
            </main>

            {/* ── Navigation ── */}
            <nav className={styles.nav}>
                <button className={styles.navBtn} onClick={goPrev} disabled={isFirst}>
                    <ArrowLeft size={16} />
                    <span>Anterior</span>
                </button>

                {/* Dots */}
                <div className={styles.dots}>
                    {filteredSlides.map((_, i) => (
                        <button
                            key={i}
                            className={`${styles.dot} ${i === current ? styles.dotActive : ''} ${i < current ? styles.dotVisited : ''}`}
                            onClick={() => setCurrent(i)}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>

                <button
                    className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                    onClick={isLast ? onClose : goNext}
                >
                    <span>{isLast ? 'Finalizar' : 'Siguiente'}</span>
                    <ArrowRight size={16} />
                </button>
            </nav>
        </div>
    );
}
