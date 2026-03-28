'use client';
import React, { useState, useCallback } from 'react';
import styles from './slides.module.css';

/**
 * FlashcardSlide — Mazo de tarjetas con animación flip 3D.
 * @param {{ heading, cards: Array<{id, front, back}> }} props.data
 */
const FlashcardSlide = React.memo(function FlashcardSlide({ data, hasBgMedia }) {
    const { heading, cards = [] } = data;
    const [current, setCurrent] = useState(0);
    const [flipped, setFlipped] = useState(false);

    const goTo = useCallback((idx) => {
        setCurrent(idx);
        setFlipped(false);
    }, []);

    const prev = useCallback(
        () => goTo((current - 1 + cards.length) % cards.length),
        [current, cards.length, goTo]
    );
    const next = useCallback(
        () => goTo((current + 1) % cards.length),
        [current, cards.length, goTo]
    );

    if (cards.length === 0) {
        return (
            <article className={`${styles.slide} ${styles.flashcardSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}>
                <p style={{ color: 'var(--c-muted)', textAlign: 'center' }}>Sin tarjetas configuradas</p>
            </article>
        );
    }

    const card = cards[current];

    return (
        <article
            className={`${styles.slide} ${styles.flashcardSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}
            role="region"
            aria-label={heading || 'Tarjetas de memoria'}
        >
            <span className={styles.slideLabel}>Tarjetas</span>
            {heading && <h2 className={styles.flashcardHeading}>{heading}</h2>}

            {/* Contador */}
            <p className={styles.flashcardCounter} aria-live="polite" aria-atomic="true">
                {current + 1} de {cards.length}
            </p>

            {/* Escena con flip 3D */}
            <div
                className={styles.flashcardScene}
                onClick={() => setFlipped(f => !f)}
                role="button"
                tabIndex={0}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setFlipped(f => !f)}
                aria-pressed={flipped}
                aria-label={
                    flipped
                        ? `Reverso: ${card.back}. Presiona Enter para voltear`
                        : `Anverso: ${card.front}. Presiona Enter para ver la definición`
                }
            >
                <div className={`${styles.flashcard} ${flipped ? styles.flashcardFlipped : ''}`}>
                    {/* Anverso */}
                    <div className={`${styles.flashcardFace} ${styles.flashcardFront}`} aria-hidden={flipped}>
                        <span className={styles.flashcardSideLabel}>Término</span>
                        <p className={styles.flashcardText}>{card.front}</p>
                        <span className={styles.flashcardHint} aria-hidden="true">Toca para ver la definición ↩</span>
                    </div>
                    {/* Reverso */}
                    <div className={`${styles.flashcardFace} ${styles.flashcardBack}`} aria-hidden={!flipped}>
                        <span className={styles.flashcardSideLabel}>Definición</span>
                        <p className={styles.flashcardText}>{card.back}</p>
                        <span className={styles.flashcardHint} aria-hidden="true">Toca para voltear ↩</span>
                    </div>
                </div>
            </div>

            {/* Navegación entre tarjetas */}
            {cards.length > 1 && (
                <div className={styles.flashcardNav}>
                    <button
                        className={styles.flashcardNavBtn}
                        onClick={e => { e.stopPropagation(); prev(); }}
                        aria-label="Tarjeta anterior"
                    >‹</button>

                    <div className={styles.flashcardDots} role="tablist" aria-label="Navegación de tarjetas">
                        {cards.map((_, i) => (
                            <button
                                key={i}
                                role="tab"
                                aria-selected={i === current}
                                className={`${styles.flashcardDot} ${i === current ? styles.flashcardDotActive : ''}`}
                                onClick={e => { e.stopPropagation(); goTo(i); }}
                                aria-label={`Tarjeta ${i + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        className={styles.flashcardNavBtn}
                        onClick={e => { e.stopPropagation(); next(); }}
                        aria-label="Siguiente tarjeta"
                    >›</button>
                </div>
            )}
        </article>
    );
});

export default FlashcardSlide;
