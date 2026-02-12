'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Palette } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './ThemeSelectorModal.module.css';

export default function ThemeSelectorModal({ isOpen, onClose, currentTheme, onSelectTheme }) {
    const { availableThemes } = useTheme();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className={styles.modal}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.header}>
                        <div className={styles.titleRow}>
                            <Palette size={20} className={styles.icon} />
                            <h3>Personalizar Tema</h3>
                        </div>
                        <button onClick={onClose} className={styles.closeBtn}>
                            <X size={20} />
                        </button>
                    </div>

                    <div className={styles.content}>
                        <p className={styles.description}>
                            Selecciona un esquema de colores para personalizar tu experiencia.
                        </p>

                        <div className={styles.themesGrid}>
                            {Object.entries(availableThemes).map(([key, theme]) => (
                                <button
                                    key={key}
                                    className={`${styles.themeOption} ${currentTheme === key ? styles.selected : ''}`}
                                    onClick={() => {
                                        onSelectTheme(key);
                                        onClose();
                                    }}
                                    style={{
                                        '--theme-color': theme.color,
                                        '--text-color': key === 'dark' ? '#fff' : '#1c1c1e'
                                    }}
                                >
                                    <div className={styles.colorPreview} style={{ background: theme.color }}>
                                        {currentTheme === key && (
                                            <div className={styles.checkBadge}>
                                                <Check size={12} color={key === 'dark' || key.includes('gradient') ? '#fff' : '#fff'} />
                                            </div>
                                        )}
                                    </div>
                                    <span className={styles.themeName}>{theme.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
