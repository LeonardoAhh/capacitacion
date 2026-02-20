"use client";

import { memo } from "react";
import { Search, RefreshCw } from "lucide-react";
import styles from "./MonitoringTable.module.css";

const FILTER_ITEMS = [
    { key: 'all', label: 'Todos' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'assigned', label: 'Asignados' },
    { key: 'viewed', label: 'En Progreso' },
    { key: 'completed', label: 'Completados' },
];

/**
 * Barra de controles: búsqueda, filtros pill, y botón de refresh.
 */
const MonitoringControls = memo(function MonitoringControls({
    searchTerm,
    onSearchChange,
    filter,
    onFilterChange,
    refreshing,
    onRefresh,
}) {
    return (
        <div className={styles.controlsRow}>
            <div className={styles.searchWrap}>
                <Search size={16} className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder="Buscar empleado o curso..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.filterPills}>
                {FILTER_ITEMS.map(({ key, label }) => (
                    <button
                        key={key}
                        className={`${styles.pill} ${filter === key ? styles.pillActive : ""}`}
                        onClick={() => onFilterChange(key)}
                        type="button"
                    >
                        {label}
                    </button>
                ))}
            </div>

            <button
                className={styles.refreshBtn}
                onClick={onRefresh}
                disabled={refreshing}
                type="button"
                title="Actualizar datos"
            >
                <RefreshCw size={15} className={refreshing ? styles.refreshSpin : ""} />
                <span>Actualizar</span>
            </button>
        </div>
    );
});

export default MonitoringControls;
