'use client';

/**
 * @adapted from: @dorianbaffier - DynamicText component
 * @description: Dynamic Credits for Hero section
 * @version: 1.0.0
 */

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import styles from './DynamicCredits.module.css';

const creditVariations = [
    { text: 'Hecho con ❤️ por', author: 'Leonardo Hernández' },
    { text: 'Para el crecimiento de nuestros', author: 'Colaboradores' },
    { text: 'Construyendo el futuro de', author: 'Viñoplastic' },
    { text: 'Impulsando el desarrollo de nuestro', author: 'Equipo' },
];

const DynamicCredits = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                // Loop back to 0 when reaching the end
                return (prevIndex + 1) % creditVariations.length;
            });
        }, 1500); // 1.5 seconds per variation

        return () => clearInterval(interval);
    }, []);

    // Animation variants for the text
    const textVariants = {
        hidden: { y: 10, opacity: 0 },
        visible: { y: 0, opacity: 1 },
        exit: { y: -10, opacity: 0 },
    };

    return (
        <div className={styles.creditsContainer}>
            <div className={styles.creditsWrapper}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={textVariants}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                        className={styles.creditText}
                    >
                        <span className={styles.label}>
                            {creditVariations[currentIndex].text}
                        </span>
                        {' '}
                        <strong className={styles.author}>
                            {creditVariations[currentIndex].author}
                        </strong>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DynamicCredits;
