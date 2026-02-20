'use client';

import { useState, useEffect } from 'react';
import styles from './TriviaGame.module.css';

const GRADIENTS = [
    'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)', // Apple Blue
    'linear-gradient(135deg, #5856D6 0%, #AF52DE 100%)', // Purple
    'linear-gradient(135deg, #FF2D55 0%, #FF375F 100%)', // Pink Red
    'linear-gradient(135deg, #FF9500 0%, #FFCC00 100%)', // Orange
    'linear-gradient(135deg, #34C759 0%, #30B0C7 100%)', // Green
];

export default function TriviaGame({ data }) {
    const [cards, setCards] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [direction, setDirection] = useState(0); // 1 = next, -1 = prev

    useEffect(() => {
        const generatedCards = [];
        const cleanText = (text) => {
            if (typeof text !== 'string') return '';
            return text.replace(/\[cite_start\]/g, '').replace(/\[cite:.*?\]/g, '').trim();
        };

        const traverse = (obj, category = '') => {
            for (const key in obj) {
                const value = obj[key];
                const cleanKey = key.replace(/_/g, ' ').toUpperCase();

                if (typeof value === 'string') {
                    generatedCards.push({ category: category || 'General', title: cleanKey, content: cleanText(value) });
                } else if (Array.isArray(value)) {
                    value.forEach(item => {
                        if (typeof item === 'string') {
                            generatedCards.push({ category: category || cleanKey, title: cleanKey, content: cleanText(item) });
                        } else if (typeof item === 'object') {
                            const title = item.turno || item.nombre || cleanKey;
                            const content = item.horario || item.puesto || JSON.stringify(item);
                            generatedCards.push({ category: category || cleanKey, title: title, content: cleanText(content) });
                        }
                    });
                } else if (typeof value === 'object') {
                    traverse(value, cleanKey);
                }
            }
        };

        if (data) {
            traverse(data);
            setCards(generatedCards.sort(() => Math.random() - 0.5));
        }
    }, [data]);

    const handleNext = (e) => {
        e?.stopPropagation();
        setIsFlipped(false);
        setDirection(1);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % cards.length);
            setDirection(0);
        }, 300);
    };

    const handlePrev = (e) => {
        e?.stopPropagation();
        setIsFlipped(false);
        setDirection(-1);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
            setDirection(0);
        }, 300);
    };

    if (cards.length === 0) return null;

    const currentCard = cards[currentIndex];
    // Elegir gradiente basado en el índice para variedad visual
    const currentGradient = GRADIENTS[currentIndex % GRADIENTS.length];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h3>🧠 Sabías que...</h3>
                    <p>Descubre datos curiosos sobre Viñoplastic</p>
                </div>
                <div className={styles.progressBadge}>
                    {currentIndex + 1} / {cards.length}
                </div>
            </div>

            <div className={styles.gameArea}>
                {/* Botón Prev */}
                <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={handlePrev}>‹</button>

                <div className={styles.cardScene} onClick={() => setIsFlipped(!isFlipped)}>
                    <div className={`${styles.card} ${isFlipped ? styles.flipped : ''} ${direction !== 0 ? styles.exiting : ''}`}>

                        {/* FRENTE */}
                        <div className={`${styles.cardFace} ${styles.cardFront}`} style={{ background: currentGradient }}>
                            <span className={styles.categoryBadge}>{currentCard.category}</span>
                            <div className={styles.cardContentFront}>
                                <h2>{currentCard.title}</h2>
                                <div className={styles.touchHint}>
                                    <span>Toca para revelar</span>
                                </div>
                            </div>
                        </div>

                        {/* REVERSO */}
                        <div className={`${styles.cardFace} ${styles.cardBack}`}>
                            <div className={styles.backContent}>
                                <p>{currentCard.content}</p>
                            </div>
                            <span className={styles.flipBackHint}>Toca para volver</span>
                        </div>
                    </div>

                    {/* Efecto de "Stack" detrás */}
                    <div className={styles.cardStackEffect}></div>
                </div>

                {/* Botón Next */}
                <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={handleNext}>›</button>
            </div>

            {/* Barra de Progreso Inferior */}
            <div className={styles.progressBarContainer}>
                <div
                    className={styles.progressBarFill}
                    style={{ width: `${((currentIndex + 1) / cards.length) * 100}%`, background: currentGradient }}
                ></div>
            </div>
        </div>
    );
}
