'use client';

import { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './WelcomeScreen.module.css';
import { BackgroundLines } from '@/components/ui/BackgroundLines/BackgroundLines';
import { extractFirstName, getCandidatePhotoUrl } from '../utils/helpers';

// ─── Animation variants ───────────────────────────────────────────────────────

// Outer stagger: sequences every child section
const PAGE_STAGGER = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.11, delayChildren: 0.1 },
    },
};

// Card itself fades + rises first
const CARD_VARIANTS = {
    hidden: { opacity: 0, y: 32, filter: 'blur(8px)' },
    visible: {
        opacity: 1, y: 0, filter: 'blur(0px)',
        transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    },
};

// Generic section reveal (title, message, grid, button)
const SECTION_VARIANTS = {
    hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
    visible: {
        opacity: 1, y: 0, filter: 'blur(0px)',
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
};

// Avatar: scale + blur pop-in
const AVATAR_VARIANTS = {
    hidden: { opacity: 0, scale: 0.6, filter: 'blur(6px)' },
    visible: {
        opacity: 1, scale: 1, filter: 'blur(0px)',
        transition: { type: 'spring', stiffness: 280, damping: 20, delay: 0.05 },
    },
};

// Info grid items stagger left→right
const GRID_STAGGER = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
};

const GRID_ITEM_VARIANTS = {
    hidden: { opacity: 0, y: 10 },
    visible: {
        opacity: 1, y: 0,
        transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
    },
};

// ─── WelcomeScreen ────────────────────────────────────────────────────────────

export default function WelcomeScreen({ candidate, onStart }) {
    const [imgError, setImgError] = useState(false);

    const firstName = candidate?.nickname?.trim() || extractFirstName(candidate?.name || candidate?.nombre);
    const photoUrl = getCandidatePhotoUrl(candidate);
    const position = candidate?.position || candidate?.puesto || 'Por asignar';
    const area = candidate?.area || 'Por asignar';

    return (
        <div
            className={styles.welcomeOverlay}
            role="main"
            aria-labelledby="welcome-title"
        >
            {/* Background gradient — decorative */}
            <div className={styles.backgroundGradient} aria-hidden="true" />

            {/* Background lines */}
            <div className={styles.shapesContainer} aria-hidden="true">
                <BackgroundLines />
            </div>

            {/* ── Card ── */}
            <motion.article
                className={styles.welcomeCard}
                variants={PAGE_STAGGER}
                initial="hidden"
                animate="visible"
            >
                {/* Avatar */}
                <motion.header
                    className={styles.welcomeHeader}
                    variants={AVATAR_VARIANTS}
                >
                    <div
                        className={styles.welcomeAvatar}
                        role="img"
                        aria-label={photoUrl ? `Foto de perfil de ${firstName}` : 'Ícono de usuario'}
                    >
                        {photoUrl && !imgError ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={photoUrl}
                                alt={`Foto de perfil de ${firstName}`}
                                className={styles.avatarImg}
                                loading="eager"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <User size={56} aria-hidden="true" />
                        )}
                    </div>
                </motion.header>

                {/* Title + subtitle */}
                <motion.div variants={SECTION_VARIANTS} className={styles.titleBlock}>
                    <h1 id="welcome-title" className={styles.welcomeTitle}>
                        ¡Bienvenido a <span className={styles.brand}>ViñoPlastic</span>!
                    </h1>
                    <p className={styles.welcomeSubtitle} aria-label={`Hola ${firstName}`}>
                        {firstName}
                    </p>
                </motion.div>

                {/* Message */}
                <motion.div className={styles.welcomeMessage} variants={SECTION_VARIANTS}>
                    <p>
                        Nos da mucho gusto que formes parte de nuestra familia.
                        A partir de hoy inicias un nuevo capítulo en tu carrera profesional.
                    </p>
                    <p>
                        En <strong>ViñoPlastic Inyección S.A. de C.V.</strong> valoramos tu talento
                        y estamos comprometidos con tu desarrollo.
                    </p>
                    <p>
                        A continuación encontrarás los cursos de inducción que deberás completar
                        para conocer nuestra empresa, políticas y tu puesto de trabajo.
                    </p>
                </motion.div>

                {/* Info grid */}
                <motion.div
                    className={styles.infoGrid}
                    role="list"
                    aria-label="Información del candidato"
                    variants={GRID_STAGGER}
                >
                    <motion.div className={styles.infoItem} role="listitem" variants={GRID_ITEM_VARIANTS}>
                        <span className={styles.infoLabel}>Puesto</span>
                        <span className={styles.infoValue}>{position}</span>
                    </motion.div>
                    <motion.div className={styles.infoItem} role="listitem" variants={GRID_ITEM_VARIANTS}>
                        <span className={styles.infoLabel}>Área</span>
                        <span className={styles.infoValue}>{area}</span>
                    </motion.div>
                </motion.div>

                {/* CTA button */}
                <motion.button
                    className={styles.welcomeButton}
                    onClick={onStart}
                    aria-label="Iniciar sesión de inducción"
                    type="button"
                    variants={SECTION_VARIANTS}
                    whileHover={{ y: -3, boxShadow: '0 14px 36px rgba(0, 122, 255, 0.48)' }}
                    whileTap={{ scale: 0.97, y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                    <span>Iniciar</span>
                    <ArrowRight size={20} aria-hidden="true" />
                </motion.button>
            </motion.article>
        </div>
    );
}