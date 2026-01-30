'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import styles from './page.module.css';

export default function PuestosPage() {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPos, setExpandedPos] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'training_records'), orderBy('position'));
            const snapshot = await getDocs(q);
            const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            aggregatePositions(records);
        } catch (error) {
            console.error("Error loading positions:", error);
        } finally {
            setLoading(false);
        }
    };

    const aggregatePositions = (records) => {
        const groups = {};

        records.forEach(rec => {
            const posName = rec.position || 'Sin Puesto';
            if (!groups[posName]) {
                groups[posName] = {
                    name: posName,
                    dept: rec.department || 'N/A',
                    employees: [],
                    stats: {
                        approved: 0,
                        failed: 0,
                        pending: 0,
                        complianceSum: 0
                    }
                };
            }

            const missingList = rec.matrix?.missingCourses || [];
            const history = rec.history || [];

            let failedCount = 0;
            let pendingCount = 0;

            missingList.forEach(course => {
                const hasTaken = history.some(h => h.courseName === course);
                if (hasTaken) {
                    failedCount++;
                } else {
                    pendingCount++;
                }
            });

            const approvedCount = rec.matrix?.completedCount || 0;
            const compliance = rec.matrix?.compliancePercentage || 0;

            groups[posName].stats.approved += approvedCount;
            groups[posName].stats.failed += failedCount;
            groups[posName].stats.pending += pendingCount;
            groups[posName].stats.complianceSum += compliance;

            groups[posName].employees.push({
                id: rec.employeeId,
                name: rec.name,
                compliance,
                approved: approvedCount,
                failed: failedCount,
                pending: pendingCount
            });
        });

        const posArray = Object.values(groups).map(g => ({
            ...g,
            avgCompliance: (g.stats.complianceSum / g.employees.length).toFixed(1),
            headcount: g.employees.length
        })).sort((a, b) => a.avgCompliance - b.avgCompliance);

        setPositions(posArray);
    };

    const toggleExpand = (posName) => {
        setExpandedPos(expandedPos === posName ? null : posName);
    };

    const getComplianceClass = (score) => {
        if (score >= 90) return styles.high;
        if (score >= 70) return styles.medium;
        return styles.low;
    };

    const getScoreColorClass = (score) => {
        if (score >= 90) return styles.scoreGreen;
        if (score >= 70) return styles.scoreYellow;
        return styles.scoreRed;
    };

    // Filter positions by search
    const filteredPositions = positions.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.dept.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Paginated positions
    const paginatedPositions = filteredPositions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Calculate summary stats
    const totalPositions = positions.length;
    const totalEmployees = positions.reduce((sum, p) => sum + p.headcount, 0);
    const avgCompliance = positions.length > 0
        ? (positions.reduce((sum, p) => sum + parseFloat(p.avgCompliance), 0) / positions.length).toFixed(1)
        : 0;
    const lowComplianceCount = positions.filter(p => parseFloat(p.avgCompliance) < 70).length;

    return (
        <>
            <Navbar />
            <main className={styles.main} id="main-content">
                {/* Background Effects */}
                <div className={styles.bgDecoration}>
                    <div className={`${styles.blob} ${styles.blob1}`}></div>
                    <div className={`${styles.blob} ${styles.blob2}`}></div>
                </div>

                <div className={styles.container}>
                    {/* Header */}
                    <div className={styles.header}>
                        <Link href="/capacitacion" className={styles.backBtn}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
                            </svg>
                            Volver
                        </Link>
                        <div className={styles.headerContent}>
                            <h1>Gestión de Puestos</h1>
                            <p>Desempeño y brechas de capacitación por puesto</p>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    {!loading && (
                        <div className={styles.statsSummary}>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.statIconPurple}`}>📋</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{totalPositions}</span>
                                    <span className={styles.statLabel}>Puestos</span>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.statIconBlue}`}>👥</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{totalEmployees}</span>
                                    <span className={styles.statLabel}>Empleados</span>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.statIconGreen}`}>📊</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{avgCompliance}%</span>
                                    <span className={styles.statLabel}>Promedio</span>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={`${styles.statIcon} ${styles.statIconOrange}`}>⚠️</div>
                                <div className={styles.statInfo}>
                                    <span className={styles.statValue}>{lowComplianceCount}</span>
                                    <span className={styles.statLabel}>Críticos</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search */}
                    {!loading && (
                        <div className={styles.searchBar}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar puesto o departamento..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            />
                        </div>
                    )}

                    {/* Position List */}
                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <div className={styles.positionsList}>
                            {paginatedPositions.map((pos) => (
                                <div key={pos.name} className={styles.positionCard}>
                                    {/* Main Row - Always Visible */}
                                    <div
                                        className={styles.positionRow}
                                        onClick={() => toggleExpand(pos.name)}
                                    >
                                        <div className={styles.positionInfo}>
                                            <span className={styles.posName}>{pos.name}</span>
                                            <span className={styles.posDept}>{pos.dept} • {pos.headcount} personas</span>
                                        </div>
                                        <div className={styles.positionActions}>
                                            <span className={`${styles.complianceBadge} ${getComplianceClass(pos.avgCompliance)}`}>
                                                {pos.avgCompliance}%
                                            </span>
                                            <button className={`${styles.expandBtn} ${expandedPos === pos.name ? styles.expanded : ''}`}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {expandedPos === pos.name && (
                                        <div className={styles.expandedContent}>
                                            {/* Quick Stats */}
                                            <div className={styles.quickStats}>
                                                <div className={styles.quickStat}>
                                                    <span className={styles.scoreGreen}>{pos.stats.approved}</span>
                                                    <span>Aprobados</span>
                                                </div>
                                                <div className={styles.quickStat}>
                                                    <span className={styles.scoreRed}>{pos.stats.failed}</span>
                                                    <span>Reprobados</span>
                                                </div>
                                                <div className={styles.quickStat}>
                                                    <span className={styles.scoreYellow}>{pos.stats.pending}</span>
                                                    <span>Pendientes</span>
                                                </div>
                                            </div>

                                            {/* Employee Grid */}
                                            <div className={styles.employeeGrid}>
                                                {pos.employees.map(emp => (
                                                    <div key={emp.id} className={styles.employeeCard}>
                                                        <div className={styles.empName}>{emp.name}</div>
                                                        <div className={styles.empStats}>
                                                            <span className={getScoreColorClass(emp.compliance)}>
                                                                {emp.compliance}%
                                                            </span>
                                                            <span>
                                                                ✓{emp.approved} ✗{emp.failed} ⏳{emp.pending}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {filteredPositions.length === 0 && (
                                <div className={styles.emptyState}>
                                    <p>No se encontraron puestos</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filteredPositions.length > itemsPerPage && (
                        <div className={styles.pagination}>
                            <span className={styles.pageInfo}>
                                {currentPage} / {Math.ceil(filteredPositions.length / itemsPerPage)}
                            </span>
                            <div className={styles.pageButtons}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => prev - 1)}
                                >
                                    ←
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage >= Math.ceil(filteredPositions.length / itemsPerPage)}
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                >
                                    →
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
