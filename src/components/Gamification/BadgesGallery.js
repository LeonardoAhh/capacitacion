
'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import styles from './BadgesGallery.module.css';

export default function BadgesGallery({ badges }) {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Medallas y Logros</h3>
                <span className={styles.subtitle}>Colección Premium</span>
            </div>

            <div className={styles.grid}>
                {badges.map((badge) => (
                    <div
                        key={badge.id}
                        className={`${styles.badgeCard} ${badge.unlocked ? styles.unlocked : styles.locked}`}
                    >
                        <div className={`${styles.iconWrapper} ${badge.unlocked ? `bg-gradient-to-br ${badge.color}` : ''}`}>
                            {badge.unlocked ? (
                                badge.icon
                            ) : (
                                <Lock size={20} className={styles.lockIcon} />
                            )}
                        </div>

                        <div className={styles.tooltip}>
                            <h4 className={styles.badgeTitle}>{badge.title}</h4>
                            <p className={styles.badgeDesc}>{badge.description}</p>
                            {!badge.unlocked && <span className={styles.statusLabel}>Bloqueado</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
