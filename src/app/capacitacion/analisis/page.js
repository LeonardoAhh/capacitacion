'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { seedHistoryData } from '@/lib/seedHistorial';
import styles from './page.module.css';
import { generateDC3 } from '@/utils/dc3Generator';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';

export default function AnalisisPage() {
    const { toast } = useToast();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    // Filter State
    const [filterName, setFilterName] = useState('');
    const [filterDept, setFilterDept] = useState('Todos');
    const [filterStatus, setFilterStatus] = useState('Todos'); // 'Todos' | 'Crítico' | 'Regular' | 'Excelente'
    const [departments, setDepartments] = useState([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;
    const [coursesMap, setCoursesMap] = useState({}); // name -> data

    // KPI State
    const [kpiData, setKpiData] = useState({
        globalScore: 0,
        deptScores: [], // { name, score, count }
        topMissing: [] // { name, count }
    });
    const [inconsistencies, setInconsistencies] = useState([]);
    const [showInconsistencyModal, setShowInconsistencyModal] = useState(false);

    // Detail View State
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'training_records'), orderBy('name'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecords(data);

            // Extract Departments
            const depts = new Set(data.map(r => r.department || '').filter(Boolean));
            // Note: need to ensure 'department' is in record, or derived from position? 
            // Current seedHistorial doesn't save department in training_records, only position.
            // We might need to fetch positions to map position -> department OR update seed.
            // For now, let's try to infer or just list positions if depts missing.
            // actually, let's fetch positions to build a map if needed, 
            // BUT for speed, let's assume we might need to update seed later.
            // For this step, I'll extract from data if available, or update the seed script next.

            // Extract Unique Departments
            const infoDepts = new Set(data.map(r => r.department || 'Sin Asignar'));
            setDepartments(['Todos', ...Array.from(infoDepts).sort()]);

            // Fetch Courses for Metadata (Validity, Duration, Instructor)
            const courseSnap = await getDocs(collection(db, 'courses'));
            const cMap = {};
            courseSnap.forEach(doc => {
                cMap[doc.data().name] = doc.data();
            });
            setCoursesMap(cMap);

            calculateKPIs(data);

        } catch (error) {
            console.error("Error loading analysis:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateKPIs = (data) => {
        if (!data.length) return;

        // 1. Global Score
        const totalScore = data.reduce((acc, curr) => acc + (curr.matrix?.compliancePercentage || 0), 0);
        const globalScore = (totalScore / data.length).toFixed(1);

        // 2. Top Missing Courses
        const missingCounts = {};
        data.forEach(r => {
            r.matrix?.missingCourses?.forEach(course => {
                missingCounts[course] = (missingCounts[course] || 0) + 1;
            });
        });

        const topMissing = Object.entries(missingCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // 3. Dept Scores
        const deptGroups = {};
        data.forEach(r => {
            const d = r.department || 'Sin Asignar';
            if (!deptGroups[d]) deptGroups[d] = { sum: 0, count: 0 };
            deptGroups[d].sum += (r.matrix?.compliancePercentage || 0);
            deptGroups[d].count += 1;
        });

        const deptScores = Object.entries(deptGroups)
            .map(([name, { sum, count }]) => ({
                name,
                score: (sum / count).toFixed(1),
                count
            }))
            .sort((a, b) => b.score - a.score); // Best first

        setKpiData({
            globalScore,
            topMissing,
            deptScores
        });
    };

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const result = await seedHistoryData();
            if (result.success) {
                toast.success('Éxito', `Procesados ${result.processed} empleados.`);
                if (result.inconsistencies?.length > 0) {
                    setInconsistencies(result.inconsistencies);
                    setShowInconsistencyModal(true);
                }
                loadData();
            } else {
                toast.error('Error', result.error);
            }
        } catch (e) {
            toast.error('Error', 'Error inesperado al procesar.');
        } finally {
            setSeeding(false);
        }
    };

    // Advanced Filter Logic
    const filteredRecords = records.filter(r => {
        const matchesName = r.name.toLowerCase().includes(filterName.toLowerCase()) ||
            r.position.toLowerCase().includes(filterName.toLowerCase());

        const matchesDept = filterDept === 'Todos' || r.department === filterDept;

        // Compliance Status Filter
        const score = r.matrix?.compliancePercentage || 0;
        let statusMatch = true;
        if (filterStatus === 'Crítico' || filterStatus === 'Reprobado') statusMatch = score < 70;
        else if (filterStatus === 'Regular') statusMatch = score >= 70 && score < 90;
        else if (filterStatus === 'Excelente') statusMatch = score >= 90;

        return matchesName && matchesDept && statusMatch;
    });

    const getComplianceColor = (pct) => {
        if (pct >= 90) return styles.complianceHigh;
        if (pct >= 70) return styles.complianceMedium;
        return styles.complianceLow;
    };

    const getScoreColorClass = (score) => {
        if (score >= 90) return styles.scoreGreen;
        if (score >= 70) return styles.scoreYellow;
        return styles.scoreRed;
    };

    const openDetail = (record) => {
        setSelectedEmployee(record);
        setShowDetailModal(true);
    };

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <Link href="/capacitacion" className={styles.backBtn}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                Volver
                            </Link>
                            <h1>Análisis de Cumplimiento</h1>
                        </div>

                    </div>

                    {/* KPI Dashboard - Only Show if Data Exists */}
                    {records.length > 0 && (
                        <div className={styles.dashboardGrid}>
                            {/* Global Score Card */}
                            <Card className={styles.kpiCard}>
                                <CardHeader>
                                    <CardTitle>Cumplimiento Global</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={`${styles.bigScore} ${getScoreColorClass(kpiData.globalScore)}`}>
                                        {kpiData.globalScore}%
                                    </div>
                                    <span className={styles.metaLabel}>Promedio Planta</span>
                                </CardContent>
                            </Card>

                            {/* Top Missing Courses */}
                            <Card className={styles.kpiCard}>
                                <CardHeader>
                                    <CardTitle>Top Cursos Faltantes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className={styles.topList}>
                                        {kpiData.topMissing.map((item, idx) => (
                                            <li key={idx}>
                                                <span className={styles.topName}>{item.name}</span>
                                                <span className={styles.topCount}>{item.count} pers.</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            {/* Departments Overview */}
                            <Card className={styles.kpiCard}>
                                <CardHeader>
                                    <CardTitle>Por Departamento (Top 3)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className={styles.deptList}>
                                        {kpiData.deptScores.slice(0, 3).map((d, idx) => (
                                            <li key={idx}>
                                                <div className={styles.deptRowHeader}>
                                                    <span>{d.name}</span>
                                                    <span className={getScoreColorClass(d.score)}>{d.score}%</span>
                                                </div>
                                                <div className={styles.progressBar}>
                                                    <div
                                                        className={styles.progressFill}
                                                        style={{ width: `${d.score}%`, backgroundColor: d.score >= 90 ? '#10b981' : d.score >= 70 ? '#f59e0b' : '#ef4444' }}
                                                    ></div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Controls Bar */}
                    <div className={styles.controlsBar}>
                        <div className={styles.searchBar}>
                            <input
                                type="text"
                                placeholder="Buscar empleado..."
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
                            />
                        </div>

                        <div className={styles.filters}>
                            <select
                                value={filterDept}
                                onChange={(e) => setFilterDept(e.target.value)}
                                className={styles.selectFilter}
                            >
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>

                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className={styles.selectFilter}
                            >
                                <option value="Todos">Todos los Estados</option>
                                <option value="Crítico">Crítico (&lt;70%)</option>
                                <option value="Regular">Regular (70-90%)</option>
                                <option value="Excelente">Excelente (&gt;90%)</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="spinner"></div>
                    ) : filteredRecords.length === 0 ? (
                        <div className={styles.emptyState}>No hay registros de análisis.</div>
                    ) : (
                        <>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Empleado</th>
                                            <th>Departamento</th>
                                            <th>Puesto</th>
                                            <th className="text-center">Cumplimiento</th>
                                            <th>Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(rec => (
                                            <tr key={rec.id}>
                                                <td className={styles.fwBold}>{rec.name}</td>
                                                <td><span className={styles.deptBadge}>{rec.department || 'N/A'}</span></td>
                                                <td className={styles.textSm}>{rec.position}</td>
                                                <td className="text-center">
                                                    <span className={getComplianceColor(rec.matrix?.compliancePercentage || 0)}>
                                                        {rec.matrix?.compliancePercentage || 0}%
                                                    </span>
                                                </td>
                                                <td>
                                                    <Button variant="ghost" size="sm" onClick={() => openDetail(rec)}>Ver</Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className={styles.paginationControls}>
                                <span className={styles.pageInfo}>
                                    Página {currentPage} de {Math.ceil(filteredRecords.length / itemsPerPage)} ({filteredRecords.length} registros)
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
                                        disabled={currentPage >= Math.ceil(filteredRecords.length / itemsPerPage)}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Detail Modal */}
            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogHeader>
                    <DialogTitle>{selectedEmployee?.name}</DialogTitle>
                    <DialogClose onClose={() => setShowDetailModal(false)} />
                </DialogHeader>
                <DialogBody>
                    {selectedEmployee && (
                        <div className={styles.detailContainer}>
                            <div className={styles.detailHeader}>
                                <div className={styles.statBox}>
                                    <label>Puesto</label>
                                    <span>{selectedEmployee.position}</span>
                                </div>
                                <div className={styles.statBox}>
                                    <label>Cumplimiento Global</label>
                                    <span className={getComplianceColor(selectedEmployee.matrix.compliancePercentage)}>
                                        {selectedEmployee.matrix.compliancePercentage}%
                                    </span>
                                </div>
                            </div>

                            <div className={styles.missingList}>
                                {selectedEmployee.matrix.failedCourses?.length > 0 && (
                                    <div className={styles.subSection}>
                                        <h4>❌ Reprobados (Requieren Recrusar)</h4>
                                        {selectedEmployee.matrix.failedCourses.map((c, i) => (
                                            <div key={i} className={styles.missingItem} style={{ borderLeft: '3px solid #ef4444' }}>
                                                {c}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedEmployee.matrix.pendingCourses?.length > 0 && (
                                    <div className={styles.subSection}>
                                        <h4>⏳ Pendientes (Nunca Tomados)</h4>
                                        {selectedEmployee.matrix.pendingCourses.map((c, i) => (
                                            <div key={i} className={styles.missingItem} style={{ borderLeft: '3px solid #f59e0b' }}>
                                                {c}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(!selectedEmployee.matrix.failedCourses?.length && !selectedEmployee.matrix.pendingCourses?.length) && (
                                    <div className={styles.successMessage}>¡Todo al día! 🎉</div>
                                )}
                            </div>

                            <h3>Historial Completo</h3>
                            <div className={styles.historyList}>
                                {selectedEmployee.history?.sort((a, b) => new Date(b.date) - new Date(a.date)).map((h, i) => (
                                    <div key={i} className={styles.historyItem}>
                                        <div className={styles.historyName}>{h.courseName}</div>
                                        <div className={styles.historyMeta}>
                                            <span>{h.date}</span>
                                            <span className={h.status === 'approved' ? styles.tagSuccess : styles.tagFail}>
                                                {h.score} ({h.status === 'approved' ? 'Aprobado' : 'Reprobado'})
                                            </span>
                                            {h.status === 'approved' && (
                                                <Button
                                                    size="xs"
                                                    variant="ghost"
                                                    onClick={() => generateDC3(selectedEmployee, coursesMap[h.courseName] || { name: h.courseName }, { date: h.date })}
                                                    title="Descargar DC-3"
                                                >
                                                    📄
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DialogBody>
            </Dialog>

            {/* Inconsistency Report Modal */}
            <Dialog open={showInconsistencyModal} onOpenChange={setShowInconsistencyModal}>
                <DialogHeader>
                    <DialogTitle>⚠️ Inconsistencias Detectadas</DialogTitle>
                    <DialogClose onClose={() => setShowInconsistencyModal(false)} />
                </DialogHeader>
                <DialogBody>
                    <p className="mb-4">Los siguientes cursos del historial no coinciden exactamente con el catálogo oficial (Matriz). Esto puede afectar el cálculo de cumplimiento.</p>
                    <div className={styles.inconsistencyList}>
                        {inconsistencies.map((inc, i) => (
                            <div key={i} className={styles.inconsistencyItem}>{inc}</div>
                        ))}
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button onClick={() => setShowInconsistencyModal(false)}>Entendido</Button>
                </DialogFooter>
            </Dialog>
        </>
    );
}
