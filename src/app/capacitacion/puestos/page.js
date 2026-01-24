'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import styles from './page.module.css'; // We'll reuse analisis styles or create similar

export default function PuestosPage() {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedPos, setExpandedPos] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch all training records to aggregate
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

            // Individual Analysis
            const missingList = rec.matrix?.missingCourses || [];
            const history = rec.history || [];

            // "Failed" = In missing list AND exists in history with < 70 (or just present in history implying fail if logic holds)
            // But wait, seedHistorial only puts 'approved' in approved count. 
            // Let's look for missing items in history.
            let failedCount = 0;
            let pendingCount = 0;

            missingList.forEach(course => {
                const hasTaken = history.some(h => h.courseName === course); // Fuzzy match might be needed if case differs, but seed normalized it.
                if (hasTaken) {
                    failedCount++;
                } else {
                    pendingCount++;
                }
            });

            const approvedCount = rec.matrix?.completedCount || 0;
            const compliance = rec.matrix?.compliancePercentage || 0;

            // Add to Group Stats
            groups[posName].stats.approved += approvedCount;
            groups[posName].stats.failed += failedCount;
            groups[posName].stats.pending += pendingCount;
            groups[posName].stats.complianceSum += compliance;

            // Add Employee to list
            groups[posName].employees.push({
                id: rec.employeeId,
                name: rec.name,
                compliance,
                approved: approvedCount,
                failed: failedCount,
                pending: pendingCount
            });
        });

        // Finalize Averages
        const posArray = Object.values(groups).map(g => ({
            ...g,
            avgCompliance: (g.stats.complianceSum / g.employees.length).toFixed(1),
            headcount: g.employees.length
        })).sort((a, b) => a.avgCompliance - b.avgCompliance); // Ascending compliance (worst first)

        setPositions(posArray);
    };

    const toggleExpand = (posName) => {
        setExpandedPos(expandedPos === posName ? null : posName);
    };

    const getScoreColorClass = (score) => {
        if (score >= 90) return 'text-green-600';
        if (score >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.header}>
                    <div>
                        <Link href="/capacitacion" className={styles.backBtn}>
                            ← Volver
                        </Link>
                        <h1>Gestión de Puestos</h1>
                        <p style={{ color: '#666' }}>Desempeño y brechas de capacitación por perfil de puesto.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="spinner"></div>
                ) : (
                    <Card>
                        <CardContent style={{ padding: 0 }}>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Puesto</th>
                                            <th style={{ textAlign: 'center' }}>Personal</th>
                                            <th style={{ textAlign: 'center' }}>% Cumplimiento</th>
                                            <th style={{ textAlign: 'center', color: '#16a34a' }}>Aprobados</th>
                                            <th style={{ textAlign: 'center', color: '#dc2626' }}>Reprobados</th>
                                            <th style={{ textAlign: 'center', color: '#f59e0b' }}>Pendientes</th>
                                            <th style={{ textAlign: 'center' }}>Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {positions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((pos) => (
                                            <>
                                                <tr key={pos.name}>
                                                    <td className={styles.posName}>
                                                        {pos.name}
                                                        <div className={styles.posDept}>{pos.dept}</div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>{pos.headcount}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={getScoreColorClass(pos.avgCompliance)}>
                                                            {pos.avgCompliance}%
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>{pos.stats.approved}</td>
                                                    <td style={{ textAlign: 'center' }}>{pos.stats.failed}</td>
                                                    <td style={{ textAlign: 'center' }}>{pos.stats.pending}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => toggleExpand(pos.name)}
                                                            className={styles.expandBtn}
                                                        >
                                                            {expandedPos === pos.name ? 'Ocultar' : 'Ver'}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedPos === pos.name && (
                                                    <tr className={styles.expandedRow}>
                                                        <td colSpan={7} style={{ padding: '1rem' }}>
                                                            <div className={styles.employeeGrid}>
                                                                {pos.employees.map(emp => (
                                                                    <div key={emp.id} className={styles.employeeCard}>
                                                                        <div className={styles.empName}>{emp.name}</div>
                                                                        <div className={styles.empStats}>
                                                                            <span className={getScoreColorClass(emp.compliance)}>
                                                                                {emp.compliance}% Cumpl.
                                                                            </span>
                                                                            <span style={{ color: '#666' }}>
                                                                                ❌ {emp.failed} | ⏳ {emp.pending}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className={styles.paginationControls}>
                                <span className={styles.pageInfo}>
                                    Página {currentPage} de {Math.ceil(positions.length / itemsPerPage)} ({positions.length} puestos)
                                </span>
                                <div className={styles.pageButtons}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                    >
                                        Anterior
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage >= Math.ceil(positions.length / itemsPerPage)}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>
        </>
    );
}
