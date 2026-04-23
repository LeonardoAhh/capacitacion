'use client';
import React from 'react';
import styles from './freeformSlide.module.css';
import FreeformElement from './FreeformElement';

// ── Slide completo ────────────────────────────────────────────────────────────
/**
 * @param {{ data?: import('./freeformTypes').SlideData | null }} props
 */
const FreeformSlide = React.memo(function FreeformSlide({ data }) {
    const { background, elements = [] } = data ?? {};

    return (
        <div
            className={styles.freeformSlide}
            style={background ? { background } : undefined}
            role="region"
            aria-label="Slide de lienzo libre"
        >
            {elements.map(el => {
                // Guard: elemento sin id omitido — key=undefined rompe React
                if (!el.id) {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('[FreeformSlide] Elemento sin id ignorado:', el);
                    }
                    return null;
                }
                return <FreeformElement key={el.id} el={el} />;
            })}
        </div>
    );
});

export default FreeformSlide;
