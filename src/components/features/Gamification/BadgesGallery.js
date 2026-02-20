'use client';

import { Lock } from 'lucide-react';
import { useMemo } from 'react';
import styles from './BadgesGallery.module.css';

export default function BadgesGallery({ badges = [] }) {
    const badgeStats = useMemo(() => {
        const unlocked = badges.filter(b => b.unlocked).length;
        const total = badges.length;
        const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
        return { unlocked, total, percentage };
    }, [badges]);

    if (!badges || badges.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3>Medallas y Logros</h3>
                    <span className={styles.subtitle}>Colección</span>
                </div>
                <div className={styles.emptyState}>
                    <Lock size={28} className={styles.emptyIcon} />
                    <p className={styles.emptyText}>Aún no hay medallas disponibles</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h3>Medallas y Logros</h3>
                    <span className={styles.subtitle}>Colección</span>
                </div>
                <div className={styles.stats}>
                    <span className={styles.statsNumber}>
                        {badgeStats.unlocked}/{badgeStats.total}
                    </span>
                    <span className={styles.statsLabel}>Desbloqueadas</span>
                </div>
            </div>

            {badgeStats.total > 0 && (
                <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${badgeStats.percentage}%` }}
                        />
                    </div>
                    <span className={styles.progressText}>{badgeStats.percentage}%</span>
                </div>
            )}

            <div className={styles.grid}>
                {badges.map((badge) => (
                    <div
                        key={badge.id}
                        className={`${styles.badgeCard} ${badge.unlocked ? styles.unlocked : styles.locked}`}
                    >
                        <div
                            className={styles.iconWrapper}
                            style={badge.unlocked && badge.color ? {
                                background: `linear-gradient(135deg, ${badge.color})`
                            } : undefined}
                        >
                            {badge.unlocked ? (
                                <span className={styles.iconContent} aria-label={badge.title}>
                                    {badge.icon}
                                </span>
                            ) : (
                                <Lock
                                    size={16}
                                    className={styles.lockIcon}
                                    aria-label="Medalla bloqueada"
                                />
                            )}
                        </div>

                        {badge.unlocked && <div className={styles.unlockIndicator} />}

                        <div className={styles.tooltip} role="tooltip">
                            <h4 className={styles.badgeTitle}>{badge.title}</h4>
                            <p className={styles.badgeDesc}>{badge.description}</p>
                            {!badge.unlocked && (
                                <span className={styles.statusLabel}>Bloqueada</span>
                            )}
                            {badge.unlocked && badge.unlockedDate && (
                                <span className={styles.dateLabel}>
                                    Desbloqueada: {new Date(badge.unlockedDate).toLocaleDateString('es-MX', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
