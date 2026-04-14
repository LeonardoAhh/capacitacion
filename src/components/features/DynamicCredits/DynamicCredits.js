'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import styles from './DynamicCredits.module.css';

/* ─── Datos ─────────────────────────────────────────────── */

const CREDITS = [
    { label: 'Entwickelt von', author: 'Leonardo Hernández' },
    { label: 'Para el crecimiento de', author: 'Nuestros Colaboradores' },
    { label: 'Impulsando el desarrollo de', author: 'Nuestro Equipo' },
];

const INTERVAL_MS = 3500;

const SLIDE_VARIANTS = {
    initial: { opacity: 0, y: 8, filter: 'blur(5px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -8, filter: 'blur(5px)' },
};

const TRANSITION = { duration: 0.32, ease: [0.16, 1, 0.3, 1] };

/* ─── Sub-componente dots (memoizado) ───────────────────── */

const CreditDots = memo(function CreditDots({ total, current, onSelect }) {
    return (
        <div className={styles.dots} role="tablist" aria-label="Navegación de créditos">
            {Array.from({ length: total }, (_, i) => (
                <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === current}
                    aria-label={`Crédito ${i + 1}`}
                    className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                    onClick={() => onSelect(i)}
                />
            ))}
        </div>
    );
});

/* ─── Componente principal ──────────────────────────────── */

function DynamicCreditsComponent() {
    const [index, setIndex] = useState(0);
    const intervalRef = useRef(null);

    const startInterval = useCallback(() => {
        intervalRef.current = setInterval(() => {
            setIndex((prev) => (prev + 1) % CREDITS.length);
        }, INTERVAL_MS);
    }, []);

    const resetInterval = useCallback(() => {
        clearInterval(intervalRef.current);
        startInterval();
    }, [startInterval]);

    useEffect(() => {
        startInterval();
        return () => clearInterval(intervalRef.current);
    }, [startInterval]);

    const handleSelect = useCallback((i) => {
        setIndex(i);
        resetInterval();
    }, [resetInterval]);

    const current = CREDITS[index];

    return (
        <div className={styles.credits} aria-live="polite" aria-atomic="true">
            <div className={styles.pill}>
                <span className={styles.bar} aria-hidden="true" />
                <AnimatePresence mode="wait">
                    <motion.div
                        key={index}
                        variants={SLIDE_VARIANTS}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={TRANSITION}
                        className={styles.text}
                    >
                        <span className={styles.label}>{current.label}</span>
                        <span className={styles.author}>{current.author}</span>
                    </motion.div>
                </AnimatePresence>
            </div>
            <CreditDots
                total={CREDITS.length}
                current={index}
                onSelect={handleSelect}
            />
        </div>
    );
}

const DynamicCredits = memo(DynamicCreditsComponent);
export default DynamicCredits;