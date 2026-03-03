'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './ThemeSelector.module.css';

export default function ThemeSelector({ onThemeChange }) {
    const { theme, setTheme, availableThemes } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentThemeName = availableThemes[theme]?.name || 'Tema';

    const handleSelect = (key) => {
        setTheme(key);
        setIsOpen(false);
        if (onThemeChange) {
            onThemeChange(key);
        }
    };

    return (
        <div className={styles.container} ref={containerRef}>
            <button
                className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Seleccionar tema"
                aria-expanded={isOpen}
            >
                <div className={styles.iconWrapper}>
                    <Palette size={16} />
                </div>
                <span className={styles.label}>{currentThemeName}</span>
                <ChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.rotate : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.dropdown}
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className={styles.dropdownHeader}>
                            <span>Personalización</span>
                        </div>
                        <div className={styles.grid}>
                            {Object.entries(availableThemes).map(([key, value]) => (
                                <button
                                    key={key}
                                    className={`${styles.option} ${theme === key ? styles.selected : ''}`}
                                    onClick={() => handleSelect(key)}
                                >
                                    <div
                                        className={styles.colorPreview}
                                        style={{ backgroundColor: value.color }}
                                    >
                                        {theme === key && <Check size={12} strokeWidth={3} color={key === 'dark' ? '#fff' : '#000'} />}
                                    </div>
                                    <span className={styles.optionLabel}>{value.name}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
