'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useMemo } from 'react';
import styles from './BadgesGallery.module.css';

export default function BadgesGallery({ badges = [] }) {
    // Calcular estadísticas de medallas
    const badgeStats = useMemo(() => {
        const unlocked = badges.filter(b => b.unlocked).length;
        const total = badges.length;
        const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;
        return { unlocked, total, percentage };
    }, [badges]);

    // Animaciones para las medallas
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.8 },
        show: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 20
            }
        }
    };

    if (!badges || badges.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3>Medallas y Logros</h3>
                    <span className={styles.subtitle}>Colección Premium</span>
                </div>
                <div className={styles.emptyState}>
                    <Lock size={32} className={styles.emptyIcon} />
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
                    <span className={styles.subtitle}>Colección Premium</span>
                </div>
                <div className={styles.stats}>
                    <span className={styles.statsNumber}>
                        {badgeStats.unlocked}/{badgeStats.total}
                    </span>
                    <span className={styles.statsLabel}>Desbloqueadas</span>
                </div>
            </div>

            {/* Barra de progreso */}
            {badgeStats.total > 0 && (
                <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                        <motion.div
                            className={styles.progressFill}
                            initial={{ width: 0 }}
                            animate={{ width: `${badgeStats.percentage}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </div>
                    <span className={styles.progressText}>{badgeStats.percentage}%</span>
                </div>
            )}

            <motion.div
                className={styles.grid}
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {badges.map((badge) => (
                    <motion.div
                        key={badge.id}
                        variants={itemVariants}
                        className={`${styles.badgeCard} ${badge.unlocked ? styles.unlocked : styles.locked}`}
                        whileHover={{
                            scale: 1.05,
                            transition: { type: "spring", stiffness: 400, damping: 10 }
                        }}
                        whileTap={{ scale: 0.95 }}
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
                                    size={20}
                                    className={styles.lockIcon}
                                    aria-label="Medalla bloqueada"
                                />
                            )}
                        </div>

                        {badge.unlocked && (
                            <div className={styles.unlockIndicator} aria-hidden="true" />
                        )}

                        <div
                            className={styles.tooltip}
                            role="tooltip"
                            aria-hidden="true"
                        >
                            <h4 className={styles.badgeTitle}>{badge.title}</h4>
                            <p className={styles.badgeDesc}>{badge.description}</p>
                            {!badge.unlocked && (
                                <span className={styles.statusLabel}>
                                    🔒 Bloqueada
                                </span>
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
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}