
'use client';

import { motion } from 'framer-motion';
import { Trophy, Star, ChevronRight } from 'lucide-react';
import styles from './LevelProgress.module.css';

export default function LevelProgress({ level, rank, nextRank, xp, progress, earnedBadges, totalBadges }) {
    if (!rank) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.rankInfo}>
                    <span className={styles.label}>TU RANGO ACTUAL</span>
                    <h2 className={styles.rankTitle} style={{ color: rank.color }}>
                        {rank.title}
                    </h2>
                </div>
                <div className={styles.levelBadge}>
                    <div className={styles.levelNumber}>{level}</div>
                    <span className={styles.levelLabel}>NIVEL</span>
                </div>
            </div>

            <div className={styles.progressSection}>
                <div className={styles.progressBarBg}>
                    <motion.div
                        className={styles.progressBarFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ backgroundColor: rank.color }}
                    />
                </div>
                <div className={styles.progressStats}>
                    <span>{Math.floor(xp)} XP</span>
                    <span>Siguiente: {nextRank ? nextRank.title : 'Máximo Rango'}</span>
                </div>
            </div>

            <div className={styles.badgesSummary}>
                <div className={styles.badgeCount}>
                    <Trophy size={16} className={styles.icon} />
                    <span>{earnedBadges} / {totalBadges} Medallas</span>
                </div>
            </div>
        </div>
    );
}
