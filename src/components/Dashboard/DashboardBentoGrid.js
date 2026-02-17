"use client";

import styles from './DashboardBentoGrid.module.css';
import HeroStatsRow from './HeroStatsRow';
import AlertsRow from './AlertsRow';
import QuickActionsGrid from './QuickActionsGrid';

/**
 * Dashboard Bento Grid — Orquestador de las 3 secciones principales.
 * Componentes extraídos: HeroStatsRow, AlertsRow, QuickActionsGrid.
 */
export default function DashboardBentoGrid({ stats, evaluations }) {
    return (
        <div className={styles.dashboard}>
            <HeroStatsRow stats={stats} />
            <AlertsRow stats={stats} evaluations={evaluations} />
            <QuickActionsGrid />
        </div>
    );
}
