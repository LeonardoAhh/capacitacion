'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, RefreshCw, Check } from 'lucide-react';
import styles from './AvatarSelector.module.css';

const AVATAR_STYLES = [
    { id: 'bottts', name: 'Robots' },
    { id: 'fun-emoji', name: 'Emojis' },
    { id: 'notionists', name: 'Notion' },
    { id: 'pixel-art', name: 'Pixel Art' }
];

export default function AvatarSelector({ isOpen, onClose, onSave, userName }) {
    const [selectedStyle, setSelectedStyle] = useState('bottts');
    const [seed, setSeed] = useState(userName || 'seed');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        setSeed(userName || 'seed');
    }, [userName]);

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

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3>Cambiar Avatar</h3>
                    <button onClick={onClose} className={styles.closeBtn} aria-label="Cerrar">
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.previewSection}>
                    <div className={styles.avatarPreview}>
                        <Image
                            src={generateAvatarUrl(selectedStyle, seed)}
                            alt="Avatar Preview"
                            fill
                            sizes="120px"
                            style={{ objectFit: 'contain' }}
                            unoptimized
                        />
                    </div>
                    <button onClick={handleRandomize} className={styles.randomizeBtn}>
                        <RefreshCw size={14} />
                        Generar otro
                    </button>
                </div>

                <div className={styles.stylesGrid}>
                    {AVATAR_STYLES.map((style) => (
                        <button
                            key={style.id}
                            className={`${styles.styleOption} ${selectedStyle === style.id ? styles.selected : ''}`}
                            onClick={() => setSelectedStyle(style.id)}
                        >
                            {style.name}
                        </button>
                    ))}
                </div>

                <div className={styles.footer}>
                    <button onClick={onClose} className={styles.cancelBtn}>
                        Cancelar
                    </button>
                    <button onClick={handleSave} className={styles.saveBtn}>
                        <Check size={16} />
                        Guardar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
