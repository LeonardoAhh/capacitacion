'use client';

/**
 * @adapted from: @dorianbaffier - DynamicText component
 * @description: Dynamic Credits for Hero section
 * @version: 2.0.0
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import styles from './DynamicCredits.module.css';

const creditVariations = [
    { text: 'Entworfen von', author: 'Leonardo Hernández' },
    { text: 'Para el crecimiento de nuestros', author: 'Colaboradores' },
    { text: 'Construyendo el futuro de', author: 'Viñoplastic' },
    { text: 'Impulsando el desarrollo de nuestro', author: 'Equipo' },
];

// Split text into word tokens for staggered animation
const WordSpan = ({ word, index, variants }) => (
    <motion.span
        className={styles.word}
        variants={variants}
        custom={index}
        style={{ display: 'inline-block' }}
    >
        {word}
    </motion.span>
);

const DynamicCredits = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                (prevIndex + 1) % creditVariations.length
            );
        }, 2800);

        return () => clearInterval(interval);
    }, [isPaused]);

    // Container: orchestrates stagger children
    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.06,
                delayChildren: 0.05,
            },
        },
        exit: {
            transition: {
                staggerChildren: 0.04,
                staggerDirection: -1,
            },
        },
    };

    // Each word animates with blur + vertical slide
    const wordVariants = {
        hidden: (i) => ({
            y: 8,
            opacity: 0,
            filter: 'blur(4px)',
        }),
        visible: (i) => ({
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            transition: {
                duration: 0.35,
                ease: [0.25, 0.46, 0.45, 0.94],
            },
        }),
        exit: (i) => ({
            y: -6,
            opacity: 0,
            filter: 'blur(3px)',
            transition: {
                duration: 0.22,
                ease: 'easeIn',
            },
        }),
    };

    const current = creditVariations[currentIndex];
    const labelWords = current.text.split(' ');

    return (
        <div
            className={styles.creditsContainer}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Subtle ambient glow behind text */}
            <div className={styles.ambientGlow} aria-hidden="true" />

            <div className={styles.creditsWrapper}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={containerVariants}
                        className={styles.creditText}
                    >
                        {/* Label words — staggered individually */}
                        {labelWords.map((word, i) => (
                            <WordSpan
                                key={`label-${i}`}
                                word={word}
                                index={i}
                                variants={wordVariants}
                            />
                        ))}

                        {/* Thin separator dot */}
                        <motion.span
                            className={styles.separator}
                            variants={wordVariants}
                            custom={labelWords.length}
                            style={{ display: 'inline-block' }}
                        >
                            ·
                        </motion.span>

                        {/* Author — always last, slightly delayed */}
                        <motion.strong
                            className={styles.author}
                            variants={wordVariants}
                            custom={labelWords.length + 1}
                            style={{ display: 'inline-block' }}
                        >
                            {current.author}
                        </motion.strong>
                    </motion.div>
                </AnimatePresence>

                {/* Progress dots */}
                <div className={styles.progressDots} aria-hidden="true">
                    {creditVariations.map((_, i) => (
                        <button
                            key={i}
                            className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ''}`}
                            onClick={() => setCurrentIndex(i)}
                            aria-label={`Ir al crédito ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DynamicCredits;