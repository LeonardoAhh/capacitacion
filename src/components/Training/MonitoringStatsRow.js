"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Clock, Eye, CheckCircle } from "lucide-react";
import styles from "./MonitoringTable.module.css";

const STAT_ITEMS = [
    { key: "pending", label: "Pendientes", icon: Clock, color: "#64748b", iconClass: "statIconPending" },
    { key: "viewed", label: "En Progreso", icon: Eye, color: "#f97316", iconClass: "statIconViewed" },
    { key: "completed", label: "Completados", icon: CheckCircle, color: "#22c55e", iconClass: "statIconCompleted" },
];

/**
 * Fila de stats del MonitoringTable con clickable filter cards.
 */
const MonitoringStatsRow = memo(function MonitoringStatsRow({ stats, filter, onFilterClick }) {
    return (
        <div className={styles.statsRow}>
            {STAT_ITEMS.map(({ key, label, icon: Icon, color, iconClass }) => (
                <motion.div
                    key={key}
                    className={`${styles.statCard} ${filter === key ? styles.statCardActive : ""}`}
                    onClick={() => onFilterClick(key)}
                    whileTap={{ scale: 0.97 }}
                    style={{ color }}
                >
                    <div className={`${styles.statIconWrap} ${styles[iconClass]}`}>
                        <Icon size={18} />
                    </div>
                    <div className={styles.statInfo}>
                        <motion.span
                            className={styles.statNumber}
                            key={stats[key]}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        >
                            {stats[key]}
                        </motion.span>
                        <span className={styles.statLabel}>{label}</span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
});

export default MonitoringStatsRow;
