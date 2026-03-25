'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { recalculateComplianceFromFirestore } from '@/lib/seedHistorial';
import styles from './page.module.css';
import { generateDC3 } from '@/utils/dc3Generator';
import { exportToExcel, exportPDFCompliance } from '@/utils/exportUtils';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';

import YearlyCardStack from '@/components/ui/CardStack/YearlyCardStack';

export default function AnalisisPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
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
    const itemsPerPage = 10;
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

    // Yearly Details Modal State
    const [selectedYear, setSelectedYear] = useState(null);
    const [showYearlyModal, setShowYearlyModal] = useState(false);
    const [yearlyDetails, setYearlyDetails] = useState([]);



    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user?.rol === 'demo' || user?.email?.includes('demo')) {
            router.push('/induccion');
        } else if (user) {
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, authLoading, router]);



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

        // 4. Yearly Statistics — Opción A:
        //    coursesCompleted = total de completaciones aprobadas en ese año específico
        //    compliance       = % de empleados con 100% de su matriz cumplida
        //                       usando historial ACUMULADO hasta el cierre de ese año
        const yearlyStats = {};
        const years = [2024, 2025, 2026];

        const _norm = (str) => (str || '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toUpperCase().trim();

        years.forEach(year => {
            yearlyStats[year] = {
                coursesCompleted: 0,
                compliantEmployees: 0,
                totalWithReqs: 0,
                compliance: 0,
                totalRequiredCourses: 0, // Option B: denominator
                avancePlan: 0 // Option B: percentage
            };
        });

        data.forEach(employee => {
            const history = employee.history || [];
            const requiredCourses = employee.matrix?.requiredCourses || [];
            const requiredCount = employee.matrix?.requiredCount || 0;

            years.forEach(year => {
                // Option B Denominator: sumamos los cursos requeridos de todos
                yearlyStats[year].totalRequiredCourses += requiredCount;
                // Cursos completados: aprobados con fecha exacta en ese año
                const completedInYear = history.filter(h => {
                    const yr = parseInt(h.date?.split('/')[2]);
                    return yr === year && h.status === 'approved';
                }).length;
                yearlyStats[year].coursesCompleted += completedInYear;

                // Opción A: empleados con 100% al cierre del año
                // Solo aplica empleados con cursos requeridos definidos
                if (requiredCourses.length === 0) return;

                yearlyStats[year].totalWithReqs++;

                // Historia acumulada hasta fin de ese año (año <= year)
                const cumulativeApproved = new Set(
                    history
                        .filter(h => {
                            const yr = parseInt(h.date?.split('/')[2]);
                            return yr <= year && h.status === 'approved';
                        })
                        .map(h => _norm(h.courseName))
                );

                const allMet = requiredCourses.every(req => cumulativeApproved.has(_norm(req)));
                if (allMet) yearlyStats[year].compliantEmployees++;
            });
        });

        // Calcular % de cumplimiento por año
        years.forEach(year => {
            const { compliantEmployees, totalWithReqs, coursesCompleted, totalRequiredCourses } = yearlyStats[year];

            // Opción A
            yearlyStats[year].compliance = totalWithReqs > 0
                ? ((compliantEmployees / totalWithReqs) * 100).toFixed(1)
                : 0;

            // Opción B
            yearlyStats[year].avancePlan = totalRequiredCourses > 0
                ? ((coursesCompleted / totalRequiredCourses) * 100).toFixed(1)
                : 0;
        });

        // 5. Unique Courses Per Month Per Year (for 2D chart)
        const monthlyData = {};
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        months.forEach(month => {
            monthlyData[month] = {};
            years.forEach(year => {
                monthlyData[month][year] = new Set(); // Use Set to track unique courses
            });
        });

        data.forEach(employee => {
            const history = employee.history || [];

            history.forEach(h => {
                if (h.status === 'approved' && h.date) {
                    const [day, monthNum, yr] = h.date.split('/');
                    const courseYear = parseInt(yr);

                    if (years.includes(courseYear)) {
                        const monthIndex = parseInt(monthNum) - 1;
                        const monthName = months[monthIndex];
                        if (monthName && monthlyData[monthName] && monthlyData[monthName][courseYear]) {
                            monthlyData[monthName][courseYear].add(h.courseName);
                        }
                    }
                }
            });
        });

        // Convert Sets to counts
        const monthlyDataCounts = {};
        months.forEach(month => {
            monthlyDataCounts[month] = {};
            years.forEach(year => {
                monthlyDataCounts[month][year] = monthlyData[month][year].size;
            });
        });

        setKpiData({
            globalScore,
            topMissing,
            deptScores,
            yearlyStats,
            monthlyData: monthlyDataCounts
        });
    };

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const result = await recalculateComplianceFromFirestore();
            if (result.success) {
                toast.success('Éxito', `Recalculado cumplimiento de ${result.processed} empleados.`);
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
        const searchTerm = filterName.toLowerCase().trim();
        const matchesSearch =
            r.name?.toLowerCase().includes(searchTerm) ||
            r.position?.toLowerCase().includes(searchTerm) ||
            r.employeeId?.toLowerCase().includes(searchTerm) ||
            r.id?.toLowerCase().includes(searchTerm);

        const matchesDept = filterDept === 'Todos' || r.department === filterDept;

        // Compliance Status Filter
        const score = r.matrix?.compliancePercentage || 0;
        let statusMatch = true;
        if (filterStatus === 'Crítico' || filterStatus === 'Reprobado') statusMatch = score < 70;
        else if (filterStatus === 'Regular') statusMatch = score >= 70 && score < 90;
        else if (filterStatus === 'Excelente') statusMatch = score >= 90;

        return matchesSearch && matchesDept && statusMatch;
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

    const getMissingCourses = (record) => {
        // Get all required courses for the position
        const required = record.matrix?.requiredCourses || [];

        // Get all approved courses from history
        const approved = record.history
            ?.filter(h => h.status === 'approved')
            .map(h => h.courseName) || [];

        // Find courses that are required but not approved
        const missing = required.filter(course => !approved.includes(course));

        return missing;
    };

    const getYearlyDetails = (year) => {
        // Map to store course details: courseName -> { months: { monthName: attendees[] } }
        const courseDetails = {};

        records.forEach(employee => {
            const history = employee.history || [];

            history.forEach(h => {
                const courseYear = parseInt(h.date?.split('/')[2]);
                if (courseYear === year && h.status === 'approved') {
                    const [day, month, yr] = h.date.split('/');
                    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                    const monthName = monthNames[parseInt(month) - 1];

                    if (!courseDetails[h.courseName]) {
                        courseDetails[h.courseName] = {};
                    }

                    if (!courseDetails[h.courseName][monthName]) {
                        courseDetails[h.courseName][monthName] = [];
                    }

                    courseDetails[h.courseName][monthName].push({
                        employeeId: employee.employeeId,
                        employeeName: employee.name,
                        date: h.date
                    });
                }
            });
        });

        // Convert to array format
        const detailsArray = Object.entries(courseDetails).map(([courseName, months]) => ({
            courseName,
            months: Object.entries(months).map(([month, attendees]) => ({
                month,
                attendees: attendees.length,
                attendeesList: attendees
            })).sort((a, b) => {
                const monthOrder = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
            })
        })).sort((a, b) => a.courseName.localeCompare(b.courseName));

        return detailsArray;
    };

    const openYearlyDetails = (year) => {
        const details = getYearlyDetails(year);
        setYearlyDetails(details);
        setSelectedYear(year);
        setShowYearlyModal(true);
    };

    const openDetail = (record) => {
        setSelectedEmployee(record);
        setShowDetailModal(true);
    };

    // State for expanded cards
    const [expandedId, setExpandedId] = useState(null);
    const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    };

    if (authLoading || !user) {
        return (
            <AdminLayout title="Módulo">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Análisis de Capacitación">
            <div className={styles.pageWrapper}>
                <main className={styles.main} id="main-content">


                    <div className={styles.container}>
                        <div className={styles.header}>
                            <div className={styles.headerRight}>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleSeed}
                                    disabled={seeding}
                                    title="Recalcula el % de cumplimiento de todos los empleados usando las matrices de posición actuales"
                                >
                                    {seeding ? (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                            </svg>
                                            Recalculando...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="1 4 1 10 7 10" />
                                                <path d="M3.51 15a9 9 0 1 0 .49-4" />
                                            </svg>
                                            Recalcular
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        exportToExcel(filteredRecords, 'empleados_capacitacion', { includeHistory: true });
                                        toast.success('Éxito', 'Archivo Excel generado');
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="12" y1="18" x2="12" y2="12" />
                                        <line x1="9" y1="15" x2="15" y2="15" />
                                    </svg>
                                    Excel
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        exportPDFCompliance(filteredRecords, { department: filterDept });
                                        toast.success('Éxito', 'Reporte PDF generado');
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                    PDF
                                </Button>
                            </div>
                        </div>

                        {/* KPI Dashboard - Only Show if Data Exists */}
                        {records.length > 0 && (
                            <>
                                <div className={styles.kpiGrid}>
                                    {/* Global Score Card */}
                                    <div className={styles.kpiCardMain}>
                                        <div className={styles.kpiLabel}>Cumplimiento Global</div>
                                        <div className={`${styles.kpiScore} ${getScoreColorClass(kpiData.globalScore)}`}>
                                            {kpiData.globalScore}%
                                        </div>
                                        <div className="text-sm text-gray-500 font-medium">Promedio Planta</div>
                                    </div>

                                    {/* Top Missing Courses */}
                                    <div className={styles.kpiCardMain}>
                                        <div className={styles.kpiLabel}>Cursos más Requeridos (Faltantes)</div>
                                        {kpiData.topMissing?.length > 0 ? (
                                            <div className={styles.kpiList}>
                                                {kpiData.topMissing.map((item, idx) => (
                                                    <div key={idx} className={styles.topMissingItem}>
                                                        <span>{item.name}</span>
                                                        <span className={styles.missingCount}>{item.count}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-400 mt-4">Todos los cursos están cubiertos</div>
                                        )}
                                    </div>

                                    {/* Top Departments */}
                                    <div className={styles.kpiCardMain}>
                                        <div className={styles.kpiLabel}>Desempeño por Departamento</div>
                                        {kpiData.deptScores?.length > 0 ? (
                                            <div className={styles.kpiList}>
                                                {kpiData.deptScores.slice(0, 4).map((dept, idx) => (
                                                    <div key={idx} className={styles.deptScoreItem}>
                                                        <div className={styles.deptScoreHeader}>
                                                            <span>{dept.name}</span>
                                                            <span className={getScoreColorClass(dept.score)}>{dept.score}%</span>
                                                        </div>
                                                        <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                                                            <div 
                                                                style={{ 
                                                                    height: '100%', 
                                                                    width: `${dept.score}%`, 
                                                                    background: dept.score >= 90 ? 'var(--c-success, #10b981)' : (dept.score >= 70 ? 'var(--c-primary, #f59e0b)' : 'var(--c-danger, #ef4444)') 
                                                                }} 
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-400 mt-4">Sin datos de departamentos</div>
                                        )}
                                    </div>
                                </div>

                                {/* Yearly Statistics Cards */}
                                {kpiData.yearlyStats && (
                                    <div className={styles.yearlyStatsGrid}>
                                        {[2024, 2025, 2026].map(year => (
                                            <YearlyCardStack
                                                key={year}
                                                stats={kpiData.yearlyStats[year]}
                                                yearNumber={year}
                                                openDetails={openYearlyDetails}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Monthly Unique Courses Chart */}
                        {records.length > 0 && kpiData.monthlyData && (() => {
                            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                            const maxValue = Math.max(
                                ...Object.values(kpiData.monthlyData).flatMap(m => [m[2024] || 0, m[2025] || 0, m[2026] || 0]),
                                1
                            );
                            const chartWidth = 800;
                            const chartHeight = 300;
                            const padding = 40;
                            const graphWidth = chartWidth - padding * 2;
                            const graphHeight = chartHeight - padding * 2;

                            const getPoints = (year) => {
                                return months.map((month, idx) => {
                                    const value = kpiData.monthlyData[month]?.[year] || 0;
                                    const x = padding + (idx * graphWidth / 11);
                                    const y = chartHeight - padding - (value / maxValue) * graphHeight;
                                    return `${x},${y}`;
                                }).join(' ');
                            };

                            const yearColors = {
                                2024: '#f59e0b',
                                2025: '#ef4444',
                                2026: '#3b82f6'
                            };

                            // Calculate trend line (linear regression)
                            // Solo incluye meses con datos reales (excluye ceros al final del año sin datos)
                            const getTrendLine = (year) => {
                                const allValues = months.map((month, idx) => ({
                                    x: idx,
                                    y: kpiData.monthlyData[month]?.[year] || 0
                                }));

                                // Encontrar el último índice con valor > 0
                                let lastDataIdx = -1;
                                for (let i = allValues.length - 1; i >= 0; i--) {
                                    if (allValues[i].y > 0) { lastDataIdx = i; break; }
                                }

                                // Si no hay datos, no dibujamos tendencia
                                if (lastDataIdx < 1) return null;

                                // Solo regresión sobre los meses con datos (hasta el último mes con valor)
                                const values = allValues.slice(0, lastDataIdx + 1);
                                const n = values.length;
                                const sumX = values.reduce((sum, v) => sum + v.x, 0);
                                const sumY = values.reduce((sum, v) => sum + v.y, 0);
                                const sumXY = values.reduce((sum, v) => sum + v.x * v.y, 0);
                                const sumX2 = values.reduce((sum, v) => sum + v.x * v.x, 0);

                                const denom = (n * sumX2 - sumX * sumX);
                                if (denom === 0) return null;

                                const slope = (n * sumXY - sumX * sumY) / denom;
                                const intercept = (sumY - slope * sumX) / n;

                                // La línea va desde el primer mes hasta el último mes con datos
                                const startX = values[0].x;
                                const endX = values[values.length - 1].x;

                                const startYVal = slope * startX + intercept;
                                const endYVal = slope * endX + intercept;

                                const x1 = padding + (startX * graphWidth / 11);
                                const y1 = chartHeight - padding - (startYVal / maxValue) * graphHeight;
                                const x2 = padding + (endX * graphWidth / 11);
                                const y2 = chartHeight - padding - (endYVal / maxValue) * graphHeight;

                                return { x1, y1, x2, y2 };
                            };

                            return (
                                <Card className={styles.chartCard}>
                                    <CardHeader>
                                        <CardTitle>Comparación Anual de Cursos Impartidos</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={styles.chart2D}>
                                            {/* Legend */}
                                            <div className={styles.chartLegend}>
                                                <div className={styles.legendItem}>
                                                    <span className={`${styles.legendColor} ${styles.year2024}`}></span>
                                                    <span>2024</span>
                                                </div>
                                                <div className={styles.legendItem}>
                                                    <span className={`${styles.legendColor} ${styles.year2025}`}></span>
                                                    <span>2025</span>
                                                </div>
                                                <div className={styles.legendItem}>
                                                    <span className={`${styles.legendColor} ${styles.year2026}`}></span>
                                                    <span>2026</span>
                                                </div>
                                                <div className={styles.legendDivider}></div>
                                                <div className={styles.legendItem}>
                                                    <span className={styles.legendTrendLine}></span>
                                                    <span>Tendencia</span>
                                                </div>
                                            </div>

                                            {/* SVG Line Chart */}
                                            <div className={styles.lineChartContainer}>
                                                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className={styles.lineChart}>
                                                    {/* Grid lines */}
                                                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                                                        <g key={idx}>
                                                            <line
                                                                x1={padding}
                                                                y1={chartHeight - padding - ratio * graphHeight}
                                                                x2={chartWidth - padding}
                                                                y2={chartHeight - padding - ratio * graphHeight}
                                                                stroke="var(--border-color)"
                                                                strokeDasharray="4"
                                                                opacity="0.5"
                                                            />
                                                            <text
                                                                x={padding - 10}
                                                                y={chartHeight - padding - ratio * graphHeight + 4}
                                                                textAnchor="end"
                                                                fontSize="12"
                                                                fill="var(--text-tertiary)"
                                                            >
                                                                {Math.round(maxValue * ratio)}
                                                            </text>
                                                        </g>
                                                    ))}

                                                    {/* Lines for each year */}
                                                    {[2024, 2025, 2026].map(year => (
                                                        <polyline
                                                            key={year}
                                                            points={getPoints(year)}
                                                            fill="none"
                                                            stroke={yearColors[year]}
                                                            strokeWidth="3"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    ))}

                                                    {/* Trend lines */}
                                                    {[2024, 2025, 2026].map(year => {
                                                        const trend = getTrendLine(year);
                                                        if (!trend) return null;
                                                        return (
                                                            <line
                                                                key={`trend-${year}`}
                                                                x1={trend.x1}
                                                                y1={trend.y1}
                                                                x2={trend.x2}
                                                                y2={trend.y2}
                                                                stroke={yearColors[year]}
                                                                strokeWidth="2"
                                                                strokeDasharray="8,4"
                                                                opacity="0.6"
                                                            />
                                                        );
                                                    })}

                                                    {/* Data points */}
                                                    {[2024, 2025, 2026].map(year => (
                                                        months.map((month, idx) => {
                                                            const value = kpiData.monthlyData[month]?.[year] || 0;
                                                            const x = padding + (idx * graphWidth / 11);
                                                            const y = chartHeight - padding - (value / maxValue) * graphHeight;
                                                            return (
                                                                <g key={`${year}-${month}`}>
                                                                    <circle
                                                                        cx={x}
                                                                        cy={y}
                                                                        r="5"
                                                                        fill={yearColors[year]}
                                                                        className={styles.dataPoint}
                                                                    />
                                                                    <title>{`${month} ${year}: ${value} cursos`}</title>
                                                                </g>
                                                            );
                                                        })
                                                    ))}

                                                    {/* X-axis labels */}
                                                    {months.map((month, idx) => (
                                                        <text
                                                            key={month}
                                                            x={padding + (idx * graphWidth / 11)}
                                                            y={chartHeight - 10}
                                                            textAnchor="middle"
                                                            fontSize="12"
                                                            fill="var(--text-secondary)"
                                                        >
                                                            {month}
                                                        </text>
                                                    ))}
                                                </svg>
                                            </div>
                                        </div>
                                        <div className={styles.chartNote}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="16" x2="12" y2="12" />
                                                <line x1="12" y1="8" x2="12.01" y2="8" />
                                            </svg>
                                            Solo se cuentan cursos únicos por mes (un curso solo se cuenta una vez por mes aunque se haya impartido varias veces)
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })()}


                        {/* Loading State */}
                        {loading && (
                            <div className={styles.emptyState}>
                                <div className="spinner"></div>
                                <p style={{ marginTop: '16px' }}>Cargando datos de análisis...</p>
                            </div>
                        )}
                    </div>
                </main>

                {/* Yearly Details Modal */}
                <Dialog open={showYearlyModal} onOpenChange={setShowYearlyModal}>
                    <DialogHeader>
                        <DialogTitle>Detalles de Cursos - {selectedYear}</DialogTitle>
                        <DialogClose onClose={() => setShowYearlyModal(false)} />
                    </DialogHeader>
                    <DialogBody>
                        <div className={styles.yearlyDetailsContainer}>
                            {yearlyDetails.length > 0 ? (
                                <div className={styles.coursesList}>
                                    {yearlyDetails.map((course, idx) => (
                                        <div key={idx} className={styles.courseDetailCard}>
                                            <div className={styles.courseDetailHeader}>
                                                <h4>{course.courseName}</h4>
                                                <span className={styles.totalAttendees}>
                                                    {course.months.reduce((sum, m) => sum + m.attendees, 0)} asistentes
                                                </span>
                                            </div>
                                            <div className={styles.monthsList}>
                                                {course.months.map((monthData, midx) => (
                                                    <div key={midx} className={styles.monthItem}>
                                                        <div className={styles.monthName}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                                <line x1="3" y1="10" x2="21" y2="10" />
                                                            </svg>
                                                            {monthData.month}
                                                        </div>
                                                        <div className={styles.monthAttendees}>
                                                            {monthData.attendees} {monthData.attendees === 1 ? 'asistente' : 'asistentes'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    No se encontraron cursos para este año
                                </div>
                            )}
                        </div>
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
            </div>
        </AdminLayout>
    );
}
