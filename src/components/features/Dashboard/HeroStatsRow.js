"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, FileText, TrendingUp, CheckCircle2, Award, ArrowUpRight } from "lucide-react";
import CounterAnimation from "./CounterAnimation";
import styles from "./DashboardBentoGrid.module.css";

/**
 * Fila principal del dashboard con la tarjeta feature y tarjetas de stats.
 */
export default function HeroStatsRow({ stats }) {
    return (
        <div className={styles.heroRow}>
            {/* Large Feature Card */}
            <motion.div
                className={styles.featureCard}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className={styles.featureContent}>
                    <div className={styles.featureBadge}>
                        <Award className={styles.badgeIcon} />
                        <span>Sistema Vertx</span>
                    </div>
                    <h2 className={styles.featureTitle}>
                        Gestión de Capacitación
                    </h2>
                    <p className={styles.featureDescription}>
                        Plataforma completa para administrar empleados, contratos, capacitación y evaluaciones con tecnología moderna.
                    </p>
                    <div className={styles.featureStats}>
                        <div className={styles.featureStat}>
                            <Users className={styles.featureStatIcon} />
                            <div className={styles.featureStatText}>
                                <div className={styles.featureStatValue}>
                                    <CounterAnimation start={0} end={stats?.totalEmployees || 0} />
                                </div>
                                <div className={styles.featureStatLabel}>Empleados</div>
                            </div>
                        </div>
                        <div className={styles.featureStat}>
                            <FileText className={styles.featureStatIcon} />
                            <div className={styles.featureStatText}>
                                <div className={styles.featureStatValue}>
                                    <CounterAnimation start={0} end={stats?.activeContracts || 0} />
                                </div>
                                <div className={styles.featureStatLabel}>Contratos</div>
                            </div>
                        </div>
                        <div className={styles.featureStat}>
                            <TrendingUp className={styles.featureStatIcon} />
                            <div className={styles.featureStatText}>
                                <div className={styles.featureStatValue}>+30%</div>
                                <div className={styles.featureStatLabel}>Objetivo Cumplimiento</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.featureGradient}></div>
            </motion.div>

            {/* Quick Stats Cards */}
            <div className={styles.quickStats}>
                <div className={styles.statCard}>
                    <motion.div
                        className={styles.statCardInner}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        whileHover={{ y: -4 }}
                    >
                        <div className={`${styles.statIconWrapper} ${styles.statIconBlue}`}>
                            <Users className={styles.statIcon} />
                        </div>
                        <div className={styles.statContent}>
                            <div className={styles.statLabel}>Empleados Activos</div>
                            <div className={styles.statValue}>
                                <CounterAnimation start={0} end={stats?.totalEmployees || 0} />
                            </div>
                            <div className={styles.statChange}>
                                <TrendingUp className={styles.statChangeIcon} />
                                <span>Ver detalles</span>
                            </div>
                        </div>
                        <ArrowUpRight className={styles.statArrow} />
                    </motion.div>
                </div>

                <div className={styles.statCard}>
                    <motion.div
                        className={styles.statCardInner}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        whileHover={{ y: -4 }}
                    >
                        <div className={`${styles.statIconWrapper} ${styles.statIconGreen}`}>
                            <CheckCircle2 className={styles.statIcon} />
                        </div>
                        <div className={styles.statContent}>
                            <div className={styles.statLabel}>Contratos Vigentes</div>
                            <div className={styles.statValue}>
                                <CounterAnimation start={0} end={stats?.activeContracts || 0} />
                            </div>
                            <div className={styles.statChange}>
                                <span className={styles.statChangePositive}>Todos al día</span>
                            </div>
                        </div>
                        <ArrowUpRight className={styles.statArrow} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
