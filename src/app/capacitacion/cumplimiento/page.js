'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import styles from './page.module.css';

// Normalize string for comparison
const normalize = (str) => str?.trim().toUpperCase() || '';

export default function CumplimientoPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [positions, setPositions] = useState([]); // Position -> requiredCourses map
    const [selectedCourse, setSelectedCourse] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Load courses
            const coursesSnap = await getDocs(query(collection(db, 'courses'), orderBy('name')));
            const coursesData = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCourses(coursesData);

            // Load positions (to know which positions require which courses)
            const posSnap = await getDocs(collection(db, 'positions'));
            const posData = posSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setPositions(posData);

            // Load employees with training records
            const empSnap = await getDocs(query(collection(db, 'training_records'), orderBy('name')));
            const empData = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setEmployees(empData);

            // Auto-select first course if available
            if (coursesData.length > 0) {
                setSelectedCourse(coursesData[0].name);
            }
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Error", "No se pudieron cargar los datos");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Calculate statistics and filtered employees for selected course
    const { stats, courseEmployees } = useMemo(() => {
        if (!selectedCourse || positions.length === 0) {
            return { stats: { assigned: 0, approved: 0, pending: 0, percentage: 0 }, courseEmployees: [] };
        }

        const normalizedCourse = normalize(selectedCourse);

        // Step 1: Find all positions that require this course
        const positionsRequiringCourse = new Set();
        positions.forEach(pos => {
            const requiredCourses = pos.requiredCourses || [];
            if (requiredCourses.some(c => normalize(c) === normalizedCourse)) {
                positionsRequiringCourse.add(normalize(pos.name));
            }
        });

        // Step 2: Find all employees whose position requires this course
        const assignedEmployees = employees.filter(emp => {
            const empPosition = normalize(emp.position);
            return positionsRequiringCourse.has(empPosition);
        });

        // Calculate stats
        let approved = 0;
        let failed = 0;
        let notTaken = 0;

        const courseEmployees = assignedEmployees.map(emp => {
            // Find history entry for this course (use normalized comparison)
            const historyEntry = emp.history?.find(h =>
                normalize(h.courseName) === normalizedCourse
            );

            let status = 'no_tomado';
            let date = '-';
            let score = '-';

            if (historyEntry) {
                date = historyEntry.date || '-';
                score = historyEntry.score !== undefined ? historyEntry.score : '-';

                if (historyEntry.status === 'approved') {
                    status = 'approved';
                    approved++;
                } else {
                    status = 'failed';
                    failed++;
                }
            } else {
                // Assigned but not taken
                notTaken++;
            }

            return {
                id: emp.employeeId || emp.id,
                name: emp.name,
                department: emp.department || '-',
                position: emp.position || '-',
                date,
                score,
                status
            };
        });

        const assigned = assignedEmployees.length;
        const pending = failed + notTaken; // Pendientes = reprobados + no tomados
        const percentage = assigned > 0 ? Math.round((approved / assigned) * 100) : 0;

        return {
            stats: { assigned, approved, pending, percentage },
            courseEmployees
        };
    }, [selectedCourse, employees, positions]);

    // Filter by search term
    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return courseEmployees;
        const term = searchTerm.toLowerCase();
        return courseEmployees.filter(emp =>
            emp.name.toLowerCase().includes(term) ||
            emp.id.toLowerCase().includes(term) ||
            emp.department.toLowerCase().includes(term)
        );
    }, [courseEmployees, searchTerm]);

    // Pagination
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginatedEmployees = filteredEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className={`${styles.badge} ${styles.badgeSuccess}`}>Aprobado</span>;
            case 'failed':
                return <span className={`${styles.badge} ${styles.badgeDanger}`}>Reprobado</span>;
            default:
                return <span className={`${styles.badge} ${styles.badgeWarning}`}>Pendiente</span>;
        }
    };

    const downloadReport = () => {
        if (!selectedCourse || courseEmployees.length === 0) {
            toast.error("Error", "No hay datos para descargar");
            return;
        }

        // Create CSV content
        const headers = ['ID Empleado', 'Nombre Curso', 'Fecha', 'Calificación'];
        const rows = courseEmployees.map(emp => [
            emp.id,
            selectedCourse,
            emp.date,
            emp.score
        ]);

        // Build CSV string
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Create and download file
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Reporte_${selectedCourse.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Éxito", `Reporte de ${courseEmployees.length} empleados descargado`);
    };

    return (
        <>
            <Navbar />
            <main className={styles.main} id="main-content">
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
                            <h1>Cumplimiento por Curso</h1>
                            <p className={styles.subtitle}>Visualiza el progreso de capacitación por cada curso</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="spinner"></div>
                    ) : (
                        <>
                            {/* Course Selector */}
                            <Card className={styles.selectorCard}>
                                <CardContent>
                                    <div className={styles.selectorRow}>
                                        <div className={styles.formGroup}>
                                            <label>Seleccionar Curso</label>
                                            <select
                                                value={selectedCourse}
                                                onChange={(e) => {
                                                    setSelectedCourse(e.target.value);
                                                    setCurrentPage(1);
                                                }}
                                                className={styles.select}
                                            >
                                                <option value="">-- Selecciona un curso --</option>
                                                {courses.map(c => (
                                                    <option key={c.id} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        {selectedCourse && courseEmployees.length > 0 && (
                                            <Button
                                                variant="outline"
                                                onClick={downloadReport}
                                                style={{ marginTop: 'auto' }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                Xlxs
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {selectedCourse && (
                                <>
                                    {/* Stats Cards */}
                                    <div className={styles.statsGrid}>
                                        <div className={`${styles.statCard} ${styles.statPrimary}`}>
                                            <div className={styles.statIcon}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                </svg>
                                            </div>
                                            <div className={styles.statContent}>
                                                <span className={styles.statValue}>{stats.assigned}</span>
                                                <span className={styles.statLabel}>Empleados Asignados</span>
                                            </div>
                                        </div>

                                        <div className={`${styles.statCard} ${styles.statSuccess}`}>
                                            <div className={styles.statIcon}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                            </div>
                                            <div className={styles.statContent}>
                                                <span className={styles.statValue}>{stats.approved}</span>
                                                <span className={styles.statLabel}>Empleados Aprobados</span>
                                            </div>
                                        </div>

                                        <div className={`${styles.statCard} ${styles.statWarning}`}>
                                            <div className={styles.statIcon}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                            </div>
                                            <div className={styles.statContent}>
                                                <span className={styles.statValue}>{stats.pending}</span>
                                                <span className={styles.statLabel}>Empleados Pendientes</span>
                                            </div>
                                        </div>

                                        <div className={`${styles.statCard} ${styles.statInfo}`}>
                                            <div className={styles.statIcon}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                                                    <path d="M22 12A10 10 0 0 0 12 2v10z" />
                                                </svg>
                                            </div>
                                            <div className={styles.statContent}>
                                                <span className={styles.statValue}>{stats.percentage}%</span>
                                                <span className={styles.statLabel}>Cumplimiento</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Search and Table */}
                                    <Card>
                                        <CardContent>
                                            <div className={styles.tableHeader}>
                                                <h3>Listado de Personal</h3>
                                                <div className={styles.searchBox}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="11" cy="11" r="8" />
                                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                                    </svg>
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar por nombre, ID o departamento..."
                                                        value={searchTerm}
                                                        onChange={(e) => {
                                                            setSearchTerm(e.target.value);
                                                            setCurrentPage(1);
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.tableWrapper}>
                                                <table className={styles.table}>
                                                    <thead>
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>Nombre</th>
                                                            <th>Departamento</th>
                                                            <th>Puesto</th>
                                                            <th>Fecha</th>
                                                            <th className="text-center">Calificación</th>
                                                            <th className="text-center">Estado</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {paginatedEmployees.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={7} className={styles.emptyState}>
                                                                    No se encontraron empleados para este curso.
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            paginatedEmployees.map(emp => (
                                                                <tr key={emp.id}>
                                                                    <td className={styles.idCell}>{emp.id}</td>
                                                                    <td className={styles.nameCell}>{emp.name}</td>
                                                                    <td>{emp.department}</td>
                                                                    <td>{emp.position}</td>
                                                                    <td>{emp.date}</td>
                                                                    <td className="text-center">
                                                                        {emp.score !== '-' ? (
                                                                            <span className={`${styles.scoreBadge} ${emp.score >= 70 ? styles.scorePass : styles.scoreFail}`}>
                                                                                {emp.score}
                                                                            </span>
                                                                        ) : '-'}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        {getStatusBadge(emp.status)}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination */}
                                            {totalPages > 1 && (
                                                <div className={styles.pagination}>
                                                    <span className={styles.pageInfo}>
                                                        Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} de {filteredEmployees.length}
                                                    </span>
                                                    <div className={styles.pageButtons}>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={currentPage === 1}
                                                            onClick={() => setCurrentPage(p => p - 1)}
                                                        >
                                                            Anterior
                                                        </Button>
                                                        <span className={styles.pageNum}>Página {currentPage} de {totalPages}</span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={currentPage >= totalPages}
                                                            onClick={() => setCurrentPage(p => p + 1)}
                                                        >
                                                            Siguiente
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
