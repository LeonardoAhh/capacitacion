'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './ThemeToggle.module.css';

const MoonIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const SunIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={styles.togglePlaceholder} aria-hidden="true" />;
    }

    const isLight = theme === 'light';

    return (
        <motion.button
            onClick={toggleTheme}
            className={styles.toggle}
            aria-label={isLight ? 'Activar modo oscuro' : 'Activar modo claro'}
            title={isLight ? 'Activar modo oscuro' : 'Activar modo claro'}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
            <AnimatePresence mode="wait">
                <motion.span
                    key={theme}
                    className={styles.iconWrapper}
                    initial={{ rotate: -45, scale: 0.5, opacity: 0, filter: 'blur(4px)' }}
                    animate={{ rotate: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ rotate: 45, scale: 0.5, opacity: 0, filter: 'blur(4px)' }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                    {isLight ? <MoonIcon /> : <SunIcon />}
                </motion.span>
            </AnimatePresence>
        </motion.button>
    );
}