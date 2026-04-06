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
                    <label htmlFor="promo-search">BUSCAR</label>
                    <input
                        id="promo-search"
                        type="text"
                        placeholder="Nombre, ID o puesto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.filterGroup} style={{ minWidth: '180px' }}>
                    <label htmlFor="promo-dept">DEPARTAMENTO</label>
                    <Select
                        id="promo-dept"
                        value={deptFilter}
                        onChange={(value) => setDeptFilter(value)}
                        options={[
                            { value: 'Todos', label: 'TODOS' },
                            ...departments.map(d => ({ value: d, label: d })),
                        ]}
                    />
                </div>
                <div className={styles.filterGroup} style={{ minWidth: '190px' }}>
                    <label htmlFor="promo-status">ESTADO</label>
                    <Select
                        id="promo-status"
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
                <div className={styles.filterGroup} style={{ minWidth: '110px' }}>
                    <label htmlFor="promo-shift">TURNO</label>
                    <Select
                        id="promo-shift"
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
                <div className={styles.filterGroup} style={{ minWidth: '175px' }}>
                    <label htmlFor="promo-sort">ORDENAR POR</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Select
                            id="promo-sort"
                            value={sortBy}
                            onChange={(value) => setSortBy(value)}
                            options={[
                                { value: 'employeeId', label: 'NO. EMPLEADO' },
                                { value: 'name', label: 'NOMBRE' },
                                { value: 'department', label: 'DEPARTAMENTO' },
                                { value: 'criteria', label: '% CRITERIOS' },
                                { value: 'startDate', label: 'FECHA INICIO' },
                            ]}
                        />
                        <button
                            className={styles.sortToggle}
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            aria-label={sortOrder === 'asc' ? 'Orden ascendente — cambiar a descendente' : 'Orden descendente — cambiar a ascendente'}
                            title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>

                {/* Vista: tarjetas / tabla */}
                <div className={styles.filterGroup}>
                    <span className={styles.filterGroup && styles.filterGroup} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-serif)' }}>VISTA</span>
                    <div className={styles.viewToggle} role="group" aria-label="Modo de vista">
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'cards' ? styles.active : ''}`}
                            onClick={() => setViewMode('cards')}
                            aria-label="Vista de tarjetas"
                            aria-pressed={viewMode === 'cards'}
                            title="Tarjetas"
                        >
                            ⊞
                        </button>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'table' ? styles.active : ''}`}
                            onClick={() => setViewMode('table')}
                            aria-label="Vista de tabla"
                            aria-pressed={viewMode === 'table'}
                            title="Tabla"
                        >
                            ☰
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.filterActions}>
                <button className={styles.actionBtn} onClick={onExport} aria-label="Exportar reporte Excel">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    REPORTE
                </button>
                <button className={styles.actionBtn} onClick={onOpenRules} aria-label={`Gestionar reglas de promoción (${rulesCount} activas)`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="21" y1="4" x2="14" y2="4"></line><line x1="10" y1="4" x2="3" y2="4"></line><line x1="21" y1="12" x2="12" y2="12"></line><line x1="8" y1="12" x2="3" y2="12"></line><line x1="21" y1="20" x2="16" y2="20"></line><line x1="12" y1="20" x2="3" y2="20"></line><line x1="14" y1="2" x2="14" y2="6"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="16" y1="18" x2="16" y2="22"></line></svg>
                    REGLAS {rulesCount > 0 && <span style={{ opacity: 0.6, fontSize: '0.8em' }}>({rulesCount})</span>}
                </button>
            </div>
        </div>
    );
}
