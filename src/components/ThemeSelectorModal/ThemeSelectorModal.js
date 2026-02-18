import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Palette } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './ThemeSelectorModal.module.css';

const container = {
    hidden: {},
    show: {
        transition: { staggerChildren: 0.045, delayChildren: 0.15 },
    },
};

const item = {
    hidden: { opacity: 0, scale: 0.88, y: 6 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function ThemeSelectorModal({ isOpen, onClose, currentTheme, onSelectTheme }) {
    const { availableThemes } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Selector de tema"
                >
                    <motion.div
                        className={styles.modal}
                        initial={{ scale: 0.94, opacity: 0, y: 16 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.94, opacity: 0, y: 16 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={styles.header}>
                            <div className={styles.titleRow}>
                                <div className={styles.iconWrap}>
                                    <Palette size={16} />
                                </div>
                                <h3>Personalizar Tema</h3>
                            </div>
                            <button onClick={onClose} className={styles.closeBtn} aria-label="Cerrar">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Divider */}
                        <div className={styles.divider} />

                        {/* Content */}
                        <div className={styles.content}>
                            <p className={styles.description}>
                                Selecciona un esquema de colores para personalizar tu experiencia.
                            </p>

                            <motion.div
                                className={styles.themesGrid}
                                variants={container}
                                initial="hidden"
                                animate="show"
                            >
                                {Object.entries(availableThemes).map(([key, theme]) => (
                                    <motion.button
                                        key={key}
                                        variants={item}
                                        className={`${styles.themeOption} ${currentTheme === key ? styles.selected : ''}`}
                                        onClick={() => {
                                            onSelectTheme(key);
                                            onClose();
                                        }}
                                        style={{ '--theme-color': theme.color }}
                                        whileTap={{ scale: 0.93 }}
                                    >
                                        <div className={styles.colorPreview}>
                                            <AnimatePresence>
                                                {currentTheme === key && (
                                                    <motion.div
                                                        className={styles.checkBadge}
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                                    >
                                                        <Check size={11} color="#fff" strokeWidth={3} />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <span className={styles.themeName}>{theme.name}</span>
                                    </motion.button>
                                ))}
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}