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
    filteredCount
}) {
    return (
        <div className={styles.filterCard}>
            <div className={styles.filterContent}>
                <div className={styles.filterGroup}>
                    <label>BUSCAR</label>
                    <input
                        type="text"
                        placeholder="Nombre, ID o puesto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <label>DEPARTAMENTO</label>
                    <select
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                        className={styles.select}
                    >
                        <option value="Todos">Todos</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>ESTADO</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={styles.select}
                    >
                        <option value="all">Todos</option>
                        <option value="eligible">Aptos</option>
                        <option value="nearEligible">Próximos (3/4)</option>
                        <option value="blocked">No Aptos</option>
                        <option value="scheduledExam">Por Aplicar Examen</option>
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>TURNO</label>
                    <select
                        value={shiftFilter}
                        onChange={(e) => setShiftFilter(e.target.value)}
                        className={styles.select}
                        style={{ minWidth: '100px' }}
                    >
                        <option value="Todos">Todos</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <label>ORDENAR POR</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={styles.select}
                        >
                            <option value="name">Nombre</option>
                            <option value="department">Departamento</option>
                            <option value="criteria">% Criterios</option>
                            <option value="startDate">Fecha Inicio</option>
                        </select>
                        <button
                            className={styles.sortToggle}
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
                <div className={styles.filterGroup}>
                    <label>VISTA</label>
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'cards' ? styles.active : ''}`}
                            onClick={() => setViewMode('cards')}
                            title="Vista tarjetas"
                        >
                            ▦
                        </button>
                        <button
                            className={`${styles.viewBtn} ${viewMode === 'table' ? styles.active : ''}`}
                            onClick={() => setViewMode('table')}
                            title="Vista tabla"
                        >
                            ≡
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
