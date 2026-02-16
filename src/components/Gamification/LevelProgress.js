'use client';

import { motion } from 'framer-motion';
import { Trophy, Star, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import styles from './LevelProgress.module.css';

export default function LevelProgress({
    level = 1,
    rank,
    nextRank,
    xp = 0,
    progress = 0,
    earnedBadges = 0,
    totalBadges = 0
}) {
    // Memoizar valores calculados
    const flooredXP = useMemo(() => Math.floor(xp), [xp]);
    const clampedProgress = useMemo(() => Math.min(Math.max(progress, 0), 100), [progress]);
    const nextRankTitle = useMemo(() => nextRank?.title || 'Máximo Rango', [nextRank]);

    // Configuración de animación memoizada
    const progressAnimation = useMemo(() => ({
        initial: { width: 0 },
        animate: { width: `${clampedProgress}%` },
        transition: { duration: 1, ease: 'easeOut' }
    }), [clampedProgress]);

    // Early return si no hay rank
    if (!rank) return null;

    return (
        <div className={styles.container}>
            {/* Header Section */}
            <div className={styles.header}>
                <div className={styles.rankInfo}>
                    <span className={styles.label}>TU RANGO ACTUAL</span>
                    <h2
                        className={styles.rankTitle}
                        style={{ color: rank.color }}
                        aria-label={`Rango actual: ${rank.title}`}
                    >
                        {rank.title}
                    </h2>
                </div>

                <div
                    className={styles.levelBadge}
                    role="status"
                    aria-label={`Nivel ${level}`}
                >
                    <div className={styles.levelNumber}>{level}</div>
                    <span className={styles.levelLabel}>NIVEL</span>
                </div>
            </div>

            {/* Progress Section */}
            <div className={styles.progressSection}>
                <div
                    className={styles.progressBarBg}
                    role="progressbar"
                    aria-valuenow={clampedProgress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label={`Progreso: ${clampedProgress}%`}
                >
                    <motion.div
                        className={styles.progressBarFill}
                        {...progressAnimation}
                        style={{ backgroundColor: rank.color }}
                    />
                </div>

                <div className={styles.progressStats}>
                    <span>{flooredXP.toLocaleString('es-MX')} XP</span>
                    <span>Siguiente: {nextRankTitle}</span>
                </div>
            </div>

            {/* Badges Summary */}
            <div className={styles.badgesSummary}>
                <div className={styles.badgeCount}>
                    <Trophy size={16} className={styles.icon} aria-hidden="true" />
                    <span>
                        {earnedBadges} / {totalBadges} Medalla{totalBadges !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>
        </div>
    );
}