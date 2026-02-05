'use client';

import { useState, useMemo } from 'react';
import analysisData from '@/data/induction_analysis_result.json';
import styles from './page.module.css';

export default function AnalysisResultsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const { stats, details, meta } = analysisData;

    // Filter employees based on search
    const filteredEmployees = useMemo(() => {
        return details.filter(emp =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.position.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [details, searchTerm]);

    // Color helpers
    const getComplianceColor = (percent) => {
        if (percent >= 90) return '#48bb78'; // Green
        if (percent >= 60) return '#ecc94b'; // Yellow
        return '#f56565'; // Red
    };

    const getBadgeClass = (percent) => {
        if (percent >= 90) return styles.badgeSuccess;
        if (percent >= 60) return styles.badgeWarning;
        return styles.badgeDanger;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Resultados de Análisis de Inducción</h1>
                <p className={styles.subtitle}>
                    Reporte de cumplimiento de cursos obligatorios de inducción.
                    <br />
                    <small>Generado el: {new Date(meta.date).toLocaleString('es-MX')}</small>
                </p>
            </header>

            {/* KPI Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.card}>
                    <div className={styles.cardValue} style={{ color: getComplianceColor(parseFloat(stats.globalCompliance)) }}>
                        {stats.globalCompliance}%
                    </div>
                    <div className={styles.cardLabel}>Cumplimiento Global</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardValue}>
                        {stats.employeesAnalyzed}
                    </div>
                    <div className={styles.cardLabel}>Personal Analizado</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardValue}>
                        {stats.employeesWithRequirements}
                    </div>
                    <div className={styles.cardLabel}>Personal con Requisitos</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardValue} style={{ color: '#eb5e5e' }}>
                        {details.filter(d => d.complianceInternal < 100).length}
                    </div>
                    <div className={styles.cardLabel}>Con Brechas Detectadas</div>
                </div>
            </div>

            {/* Data Table */}
            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h2 className={styles.tableTitle}>Detalle por Empleado</h2>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o puesto..."
                        className={styles.search}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Puesto</th>
                                <th>Progreso</th>
                                <th>Cumplimiento</th>
                                <th>Faltantes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((emp) => (
                                <tr key={emp.id} className={styles.row}>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{emp.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#718096' }}>ID: {emp.id}</div>
                                    </td>
                                    <td>
                                        <span style={{ fontSize: '0.9rem' }}>{emp.position}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div className={styles.progressContainer}>
                                                <div
                                                    className={styles.progressBar}
                                                    style={{
                                                        width: `${emp.complianceInternal}%`,
                                                        backgroundColor: getComplianceColor(emp.complianceInternal)
                                                    }}
                                                />
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: '#718096' }}>
                                                {emp.completedCount}/{emp.requiredCount}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${getBadgeClass(emp.complianceInternal)}`}>
                                            {emp.complianceStr}
                                        </span>
                                    </td>
                                    <td>
                                        {emp.missingCourses.length > 0 ? (
                                            <div className={styles.missingList} title={emp.missingCourses.join('\n')}>
                                                {emp.missingCourses.slice(0, 2).join(', ')}
                                                {emp.missingCourses.length > 2 && '...'}
                                            </div>
                                        ) : (
                                            <span style={{ color: '#48bb78', fontSize: '1.2rem' }}>✓</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filteredEmployees.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                                        No se encontraron resultados para "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
