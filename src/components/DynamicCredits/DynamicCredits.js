'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import styles from './DynamicCredits.module.css';

const creditVariations = [
    { text: 'Entwickelt von', author: 'Leonardo Hernández' },
    { text: 'Para el crecimiento de nuestros', author: 'Colaboradores' },
    { text: 'Construyendo el futuro de', author: 'Viñoplastic' },
    { text: 'Impulsando el desarrollo de nuestro', author: 'Equipo' },
];

const DynamicCredits = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                (prevIndex + 1) % creditVariations.length
            );
        }, 3500);

        return () => clearInterval(interval);
    }, []);

    const current = creditVariations[currentIndex];

    return (
        <div className={styles.credits} aria-live="polite" aria-atomic="true">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={styles.text}
                >
                    <span className={styles.label}>{current.text}</span>
                    <span className={styles.author}>{current.author}</span>
                </motion.div>
            </AnimatePresence>

            <div className={styles.dots} aria-hidden="true">
                {creditVariations.map((_, i) => (
                    <button
                        key={i}
                        className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ''}`}
                        onClick={() => setCurrentIndex(i)}
                        aria-label={`Ver crédito ${i + 1}`}
                        type="button"
                    />
                ))}
            </div>
        </div>
    );
};

export default DynamicCredits;
