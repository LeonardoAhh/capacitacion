'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, RefreshCw, Check } from 'lucide-react';
import styles from './AvatarSelector.module.css';

const AVATAR_STYLES = [
    { id: 'bottts', name: 'Robots' },
    { id: 'fun-emoji', name: 'Emojis' },
    { id: 'notionists', name: 'Notion' },
    { id: 'pixel-art', name: 'Pixel Art' }
];

export default function AvatarSelector({ isOpen, onClose, currentAvatar, onSave, userName }) {
    const [selectedStyle, setSelectedStyle] = useState('bottts');
    const [seed, setSeed] = useState(userName || 'seed');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const generateAvatarUrl = (style, seedStr) => {
        return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seedStr)}`;
    };

    const handleRandomize = () => {
        setSeed(Math.random().toString(36).substring(7));
    };

    const handleSave = () => {
        const url = generateAvatarUrl(selectedStyle, seed);
        onSave(url);
        onClose();
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
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
                            <h3>Personaliza tu Avatar</h3>
                            <button onClick={onClose} className={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.previewSection}>
                            <div className={styles.avatarPreview} style={{ position: 'relative', width: '150px', height: '150px' }}>
                                <Image
                                    src={generateAvatarUrl(selectedStyle, seed)}
                                    alt="Avatar Preview"
                                    fill
                                    sizes="150px"
                                    style={{ objectFit: 'contain' }}
                                    unoptimized
                                />
                            </div>
                            <button onClick={handleRandomize} className={styles.randomizeBtn}>
                                <RefreshCw size={16} />
                                Generar Aleatorio
                            </button>
                            <p style={{
                                fontSize: '16px',
                                color: 'var(--text-tertiary, #8e8e93)',
                                marginTop: '6px',
                                textAlign: 'center',
                                fontWeight: 400,
                                letterSpacing: '0.01em'
                            }}>
                                Haz clic arriba para probar diferentes estilos
                            </p>
                        </div>

                        <div className={styles.stylesGrid}>
                            {AVATAR_STYLES.map((style) => (
                                <button
                                    key={style.id}
                                    className={`${styles.styleOption} ${selectedStyle === style.id ? styles.selected : ''}`}
                                    onClick={() => setSelectedStyle(style.id)}
                                >
                                    <span className={styles.styleName}>{style.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className={styles.footer}>
                            <button onClick={onClose} className={styles.cancelBtn}>
                                Cancelar
                            </button>
                            <button onClick={handleSave} className={styles.saveBtn}>
                                <Check size={18} />
                                Guardar Avatar
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
