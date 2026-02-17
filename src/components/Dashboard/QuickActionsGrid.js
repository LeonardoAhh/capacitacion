"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Users, FileText, Award, TrendingUp, GitCompareArrows, ScrollText } from "lucide-react";
import styles from "./DashboardBentoGrid.module.css";

const QUICK_ACTIONS = [
    { href: "/dashboard/candidates", title: "Candidatos", icon: Users, colorClass: "actionIconOrange" },
    { href: "/dashboard/programacion", title: "Programación", icon: FileText, colorClass: "actionIconBlue" },
    { href: "/capacitacion", title: "Capacitación", icon: Award, colorClass: "actionIconPurple" },
    { href: "/reports", title: "Reportes", icon: TrendingUp, colorClass: "actionIconGreen" },
    { href: "/capacitacion/comparacion", title: "Comparación", icon: GitCompareArrows, colorClass: "actionIconCyan" },
    { href: "/capacitacion/examen", title: "Generador de Exámenes", icon: ScrollText, colorClass: "actionIconOrange" },
];

/**
 * Grid de accesos rápidos del dashboard.
 */
export default function QuickActionsGrid() {
    return (
        <motion.div
            className={styles.actionsGrid}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
        >
            <h3 className={styles.sectionTitle}>Accesos Rápidos</h3>
            <div className={styles.actionsContainer}>
                {QUICK_ACTIONS.map(({ href, title, icon: Icon, colorClass }) => (
                    <Link key={href} href={href} className={styles.actionCard} title={title}>
                        <div className={`${styles.actionIcon} ${styles[colorClass]}`}>
                            <Icon className={styles.actionIconSvg} />
                        </div>
                    </Link>
                ))}
            </div>
        </motion.div>
    );
}
