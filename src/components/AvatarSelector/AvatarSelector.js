'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, RefreshCw, Check } from 'lucide-react';
import styles from './AvatarSelector.module.css';

const AVATAR_STYLES = [
    { id: 'initials', name: 'Iniciales' },
    { id: 'adventurer', name: 'Aventurero' },
    { id: 'avataaars', name: 'Caricatura' },
    { id: 'bottts', name: 'Robots' },
    { id: 'fun-emoji', name: 'Emojis' },
    { id: 'lorelei', name: 'Lorelei' },
    { id: 'notionists', name: 'Notion' },
    { id: 'open-peeps', name: 'Open Peeps' },
    { id: 'micah', name: 'Micah' },
    { id: 'personas', name: 'Personas' },
    { id: 'pixel-art', name: 'Pixel Art' },
    { id: 'miniavs', name: 'Miniavs' },
    { id: 'identicon', name: 'Patrones' }
];

export default function AvatarSelector({ isOpen, onClose, currentAvatar, onSave, userName }) {
    const [selectedStyle, setSelectedStyle] = useState('initials');
    const [seed, setSeed] = useState(userName || 'seed');
    const [loading, setLoading] = useState(false);

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
                                unoptimized // DiceBear returns SVGs, often better unoptimized or handled directly
                            />
                        </div>
                        <button onClick={handleRandomize} className={styles.randomizeBtn}>
                            <RefreshCw size={16} />
                            Generar Aleatorio
                        </button>
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
        </AnimatePresence>
    );
}
