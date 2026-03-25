'use client';

import { Select } from '@/components/ui/Select/Select';
import styles from './FiltersBar.module.css';

export default function FiltersBar({
    searchTerm,
    setSearchTerm,
    deptFilter,
    setDeptFilter,
    statusFilter,
    setStatusFilter,
    shiftFilter,
    setShiftFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    viewMode,
    setViewMode,
    departments,
    filteredCount,
    onExport,
    onOpenRules,
    rulesCount
}) {
    return (
        <div className={styles.filterCard}>
            <div className={styles.filterContent}>
                <div className={styles.filterGroup}>
                    <label>BUSCAR</label>
                    <input
                        type="text"
                        placeholder="BUSCAR..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label>DEPARTAMENTO</label>
                    <Select
                        value={deptFilter}
                        onChange={(value) => setDeptFilter(value)}
                        options={[
                            { value: 'Todos', label: 'TODOS' },
                            ...departments.map(d => ({ value: d, label: d })),
                        ]}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label>ESTADO</label>
                    <Select
                        value={statusFilter}
                        onChange={(value) => setStatusFilter(value)}
                        options={[
                            { value: 'all', label: 'TODOS' },
                            { value: 'eligible', label: 'APTOS' },
                            { value: 'nearEligible', label: 'PRÓXIMOS' },
                            { value: 'blocked', label: 'NO APTOS' },
                            { value: 'scheduledExam', label: 'POR APLICAR EXAMEN' },
                        ]}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label>TURNO</label>
                    <Select
                        value={shiftFilter}
                        onChange={(value) => setShiftFilter(value)}
                        options={[
                            { value: 'Todos', label: 'TODOS' },
                            { value: '1', label: '1' },
                            { value: '2', label: '2' },
                            { value: '3', label: '3' },
                            { value: '4', label: '4' },
                            { value: '5', label: 'MIXTO' },
                        ]}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label>ORDENAR POR</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Select
                            value={sortBy}
                            onChange={(value) => setSortBy(value)}
                            options={[
                                { value: 'name', label: 'NOMBRE' },
                                { value: 'department', label: 'DEPARTAMENTO' },
                                { value: 'criteria', label: '% CRITERIOS' },
                                { value: 'startDate', label: 'FECHA INICIO' },
                            ]}
                        />
                        <button
                            className={styles.sortToggle}
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
            </div>
            <div className={styles.filterActions}>
                <button className={styles.actionBtn} onClick={onExport}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    REPORTE
                </button>
                <button className={styles.actionBtn} onClick={onOpenRules}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="4" x2="14" y2="4"></line><line x1="10" y1="4" x2="3" y2="4"></line><line x1="21" y1="12" x2="12" y2="12"></line><line x1="8" y1="12" x2="3" y2="12"></line><line x1="21" y1="20" x2="16" y2="20"></line><line x1="12" y1="20" x2="3" y2="20"></line><line x1="14" y1="2" x2="14" y2="6"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="16" y1="18" x2="16" y2="22"></line></svg>
                    REGLAS
                </button>
            </div>
        </div>
    );
}
