'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    User, Moon, Sun, Monitor, Check, ArrowRight, X,
    Palette, Smile, GraduationCap
} from 'lucide-react';
import styles from './SetupWizard.module.css';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDisplayName } from '@/utils/nameUtils';

const AVATAR_STYLES = [
    { id: 'initials', name: 'Iniciales' },
    { id: 'adventurer', name: 'Aventurero' },
    { id: 'avataaars', name: 'Caricatura' },
    { id: 'bottts', name: 'Robots' },
    { id: 'fun-emoji', name: 'Emojis' },
    { id: 'lorelei', name: 'Lorelei' }
];

export default function SetupWizard({ isOpen, onClose, user, onUpdateAvatar, onUpdateTheme, onUpdateNickname }) {
    const { availableThemes, setTheme } = useTheme();
    const [step, setStep] = useState(1);

    // Avatar state
    const [selectedAvatarStyle, setSelectedAvatarStyle] = useState('initials');
    const [avatarSeed, setAvatarSeed] = useState(user?.name || 'seed');

    // Theme state
    const [selectedTheme, setSelectedTheme] = useState(user?.theme || 'light');

    // Nickname state
    const [nickname, setNickname] = useState(user?.nickname || '');

    useEffect(() => {
        if (!isOpen) {
            setStep(1);
        }
    }, [isOpen]);

    const generateAvatarUrl = (style, seedStr) => {
        return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seedStr)}`;
    };

    const handleNext = () => {
        setStep(prev => prev + 1);
    };

    const handleRandomizeAvatar = () => {
        setAvatarSeed(Math.random().toString(36).substring(7));
    };

    const handleThemeSelect = (themeKey) => {
        setSelectedTheme(themeKey);
        setTheme(themeKey); // Preview immediately
    };

    const handleFinish = async () => {
        const finalAvatarUrl = generateAvatarUrl(selectedAvatarStyle, avatarSeed);

        // Save all
        if (onUpdateNickname && nickname.trim()) {
            await onUpdateNickname(nickname.trim());
        }
        await onUpdateAvatar(finalAvatarUrl);
        await onUpdateTheme(selectedTheme);

        onClose();
    };

    if (!isOpen) return null;

    const formattedName = formatDisplayName(user?.name);
    const displayName = nickname.trim() || formattedName;

    return (
        <AnimatePresence>
            <motion.div
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className={styles.container}>
                    <div className={styles.progressContainer}>
                        <div className={styles.progressBar} style={{ width: `${(step / 4) * 100}%` }} />
                    </div>

                    <div className={styles.content}>
                        <AnimatePresence mode="wait">
                            {/* STEP 1: WELCOME */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    className={styles.step}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                >
                                    <div className={styles.iconCircle}>
                                        <GraduationCap size={48} />
                                    </div>
                                    <h2 className={styles.title}>¡Bienvenido/a!</h2>
                                    <p className={styles.description}>
                                        Hola <strong>{formattedName}</strong>, nos alegra tenerte aquí.
                                        Configuremos tu perfil en unos segundos.
                                    </p>
                                    <button className={styles.primaryBtn} onClick={handleNext}>
                                        Comenzar <ArrowRight size={20} />
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 2: NICKNAME */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    className={styles.step}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                >
                                    <div className={styles.headerRow}>
                                        <Smile size={24} className={styles.stepIcon} />
                                        <h3>¿Cómo te llamamos?</h3>
                                    </div>

                                    <div className={styles.inputContainer}>
                                        <p className={styles.inputLabel}>
                                            Tu nombre oficial es <strong>{formattedName}</strong>, pero si prefieres un apodo, escríbelo abajo:
                                        </p>
                                        <input
                                            type="text"
                                            className={styles.textInput}
                                            placeholder="Ej. Leo, Dani, Mike..."
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            maxLength={20}
                                        />
                                    </div>

                                    <button className={styles.primaryBtn} onClick={handleNext}>
                                        {nickname ? `Continuar como "${nickname}"` : 'Mantener nombre real'} <ArrowRight size={20} />
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 3: AVATAR */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    className={styles.step}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                >
                                    <div className={styles.headerRow}>
                                        <User size={24} className={styles.stepIcon} />
                                        <h3>Elige tu Avatar</h3>
                                    </div>

                                    <div className={styles.avatarPreviewContainer}>
                                        <div className={styles.avatarPreview}>
                                            <Image
                                                src={generateAvatarUrl(selectedAvatarStyle, avatarSeed)}
                                                alt="Preview"
                                                fill
                                                sizes="140px"
                                                style={{ objectFit: 'contain' }}
                                                unoptimized
                                            />
                                        </div>
                                        <button onClick={handleRandomizeAvatar} className={styles.randomBtn}>
                                            Generar otro
                                        </button>
                                    </div>

                                    <div className={styles.gridOptions}>
                                        {AVATAR_STYLES.map(style => (
                                            <button
                                                key={style.id}
                                                className={`${styles.optionBtn} ${selectedAvatarStyle === style.id ? styles.selected : ''}`}
                                                onClick={() => setSelectedAvatarStyle(style.id)}
                                            >
                                                {style.name}
                                            </button>
                                        ))}
                                    </div>

                                    <button className={styles.primaryBtn} onClick={handleNext}>
                                        Siguiente <ArrowRight size={20} />
                                    </button>
                                </motion.div>
                            )}

                            {/* STEP 4: THEME */}
                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    className={styles.step}
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                >
                                    <div className={styles.headerRow}>
                                        <Palette size={24} className={styles.stepIcon} />
                                        <h3>Personaliza tu Tema</h3>
                                    </div>

                                    <div className={styles.themesGrid}>
                                        {Object.entries(availableThemes).map(([key, theme]) => (
                                            <button
                                                key={key}
                                                className={`${styles.themeOption} ${selectedTheme === key ? styles.selectedTheme : ''}`}
                                                onClick={() => handleThemeSelect(key)}
                                                style={{
                                                    backgroundColor: theme.color,
                                                    color: key === 'dark' ? 'white' : 'black',
                                                    border: key === 'light' ? '1px solid #e2e8f0' : 'none'
                                                }}
                                            >
                                                <div className={styles.checkCircle}>
                                                    {selectedTheme === key && <Check size={14} />}
                                                </div>
                                                <span className={styles.themeName}>{theme.name}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className={styles.actions}>
                                        <button className={styles.primaryBtn} onClick={handleFinish}>
                                            Terminar y Entrar <Check size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
