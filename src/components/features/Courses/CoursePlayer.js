'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import SlideRenderer from './SlideRenderer';
import styles from './CoursePlayer.module.css';

export default function CoursePlayer({ course, slides, onClose }) {
    const [current, setCurrent] = useState(0);

    const filteredSlides = (slides || []).filter(s => s.type !== 'quiz');
    const total = filteredSlides.length;
    const isFirst = current === 0;
    const isLast = current === total - 1;
    const progress = total > 0 ? ((current + 1) / total) * 100 : 0;

    const currentSlide = filteredSlides[current];

    const goNext = useCallback(() => {
        if (!isLast) setCurrent((c) => c + 1);
    }, [isLast]);

    const goPrev = useCallback(() => {
        if (!isFirst) setCurrent((c) => c - 1);
    }, [isFirst]);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') { 
                e.preventDefault(); 
                goNext(); 
            }
            else if (e.key === 'ArrowLeft') { 
                e.preventDefault(); 
                goPrev(); 
            }
            else if (e.key === 'Escape') { 
                onClose(); 
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [goNext, goPrev, onClose]);

    if (!filteredSlides || total === 0) {
        return (
            <div 
                className={styles.overlay}
                role="dialog"
                aria-modal="true"
                aria-label="Reproductor de curso"
            >
                <div className={styles.emptyMsg}>Sin slides para mostrar.</div>
            </div>
        );
    }

    return (
        <div 
            className={styles.overlay}
            role="dialog"
            aria-modal="true"
            aria-label={`Reproductor de curso: ${course?.title || 'Curso'}`}
        >
            <header className={styles.header}>
                <button 
                    className={styles.exitBtn} 
                    onClick={onClose}
                    aria-label="Cerrar curso y volver"
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span>Salir</span>
                </button>

                <span className={styles.headerTitle}>{course?.title || 'Curso'}</span>

                <div className={styles.headerRight}>
                    <span className={styles.counter} aria-label={`Slide ${current + 1} de ${total}`}>
                        {current + 1} / {total}
                    </span>
                    <div 
                        className={styles.progressTrack}
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progreso: ${Math.round(progress)}%`}
                    >
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </header>

            <main className={styles.content} aria-live="polite">
                <SlideRenderer slide={currentSlide} />
            </main>

            <nav className={styles.nav} aria-label="Navegación de slides">
                <button 
                    className={styles.navBtn} 
                    onClick={goPrev} 
                    disabled={isFirst}
                    aria-label="Slide anterior"
                    aria-disabled={isFirst}
                >
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span>Anterior</span>
                </button>

                <div className={styles.dots} role="tablist" aria-label="Slides del curso">
                    {filteredSlides.map((slide, i) => (
                        <button
                            key={i}
                            className={`${styles.dot} ${i === current ? styles.dotActive : ''} ${i < current ? styles.dotVisited : ''}`}
                            onClick={() => setCurrent(i)}
                            role="tab"
                            aria-selected={i === current}
                            aria-label={`Ir a slide ${i + 1}: ${slide.data?.heading || slide.type}`}
                            tabIndex={i === current ? 0 : -1}
                        />
                    ))}
                </div>

                <button
                    className={`${styles.navBtn} ${styles.navBtnPrimary}`}
                    onClick={isLast ? onClose : goNext}
                    aria-label={isLast ? 'Finalizar curso' : 'Siguiente slide'}
                >
                    <span>{isLast ? 'Finalizar' : 'Siguiente'}</span>
                    <ArrowRight size={16} aria-hidden="true" />
                </button>
            </nav>
        </div>
    );
}
