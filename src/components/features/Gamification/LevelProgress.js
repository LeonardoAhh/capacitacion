'use client';

import { Trophy } from 'lucide-react';
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
    const flooredXP = useMemo(() => Math.floor(xp), [xp]);
    const clampedProgress = useMemo(() => Math.min(Math.max(progress, 0), 100), [progress]);
    const nextRankTitle = useMemo(() => nextRank?.title || 'Máximo Rango', [nextRank]);

    if (!rank) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.rankInfo}>
                    <span className={styles.label}>Tu Rango Actual</span>
                    <h2
                        className={styles.rankTitle}
                        style={{ color: rank.color }}
                    >
                        {rank.title}
                    </h2>
                </div>

                <div className={styles.levelBadge}>
                    <div className={styles.levelNumber}>{level}</div>
                    <span className={styles.levelLabel}>Nivel</span>
                </div>
            </div>

            <div className={styles.progressSection}>
                <div
                    className={styles.progressBarBg}
                    role="progressbar"
                    aria-valuenow={clampedProgress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-label={`Progreso: ${clampedProgress}%`}
                >
                    <div
                        className={styles.progressBarFill}
                        style={{ width: `${clampedProgress}%`, backgroundColor: rank.color }}
                    />
                </div>

                <div className={styles.progressStats}>
                    <span>{flooredXP.toLocaleString('es-MX')} XP</span>
                    <span>Siguiente: {nextRankTitle}</span>
                </div>
            </div>

            <div className={styles.badgesSummary}>
                <div className={styles.badgeCount}>
                    <Trophy size={14} className={styles.icon} />
                    <span>
                        {earnedBadges} / {totalBadges} Medallas
                    </span>
                </div>
            </div>
        </div>
    );
}
