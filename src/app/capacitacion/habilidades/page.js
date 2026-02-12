'use client';

import { useState, useEffect, useMemo } from 'react';
import ProfileDropdown from '@/components/ProfileDropdown/ProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import styles from './page.module.css';

export default function HabilidadesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [loading, setLoading] = useState(true);
    const [positions, setPositions] = useState([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            const fetchPositions = async () => {
                setLoading(true);
                try {
                    const q = query(collection(db, 'positions'), orderBy('name'));
                    const snapshot = await getDocs(q);
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setPositions(data);
                } catch (error) {
                    console.error("Error fetching positions:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchPositions();
        }
    }, [user, authLoading, router]);



    // Get unique departments from positions
    const departments = useMemo(() => {
        const depts = new Set(positions.map(p => p.department).filter(Boolean));
        return Array.from(depts).sort();
    }, [positions]);

    // Build position-courses map
    const positionCoursesMap = useMemo(() => {
        const map = new Map();
        positions.forEach(p => {
            const requiredData = new Set(p.requiredCourses || []);
            map.set(p.name, requiredData);
        });
        return map;
    }, [positions]);

    // Get positions for selected department
    const filteredPositions = useMemo(() => {
        if (!selectedDepartment) return [];
        return positions
            .filter(p => p.department === selectedDepartment)
            .map(p => p.name)
            .sort();
    }, [selectedDepartment, positions]);

    // Get all unique courses for the selected department's positions
    const allCourses = useMemo(() => {
        if (filteredPositions.length === 0) return [];
        const coursesSet = new Set();
        filteredPositions.forEach(posName => {
            const courses = positionCoursesMap.get(posName);
            if (courses) {
                courses.forEach(course => coursesSet.add(course));
            }
        });
        return Array.from(coursesSet).sort();
    }, [filteredPositions, positionCoursesMap]);

    // Check if a course is required for a position
    const isCourseRequired = (posName, course) => {
        const courses = positionCoursesMap.get(posName);
        return courses ? courses.has(course) : false;
    };

    if (authLoading || !user) {
        return (
            <div className={styles.main}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={styles.profileContainer}>
                <ProfileDropdown />
            </div>
            <main className={styles.main} id="main-content">
                <div className={styles.container}>
                    {/* Header */}
                    <div className={styles.header}>
                        <Link href="/capacitacion" className={styles.backBtn}>
                            ← Capacitación
                        </Link>
                        <h1 className={styles.title}>Matriz de Habilidades</h1>
                        <p className={styles.subtitle}>
                            Visualiza los cursos requeridos por puesto en cada departamento (Fuente: Base de Datos)
                        </p>
                    </div>

                    {/* Department Selector */}
                    <div className={styles.selectorSection}>
                        <label className={styles.selectorLabel}>Selecciona un Departamento:</label>
                        {loading ? (
                            <Skeleton className="h-10 w-full max-w-md" />
                        ) : (
                            <select
                                className={styles.selector}
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                            >
                                <option value="">-- Seleccionar Departamento --</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Loading State */}
                    {loading && selectedDepartment && (
                        <Card className={styles.matrixCard}>
                            <CardContent className={styles.matrixContent}>
                                <div className="space-y-4 p-4">
                                    <Skeleton className="h-8 w-1/3 mb-4" />
                                    <Skeleton className="h-64 w-full" />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Matrix Table */}
                    {!loading && selectedDepartment && (
                        <Card className={styles.matrixCard}>
                            <CardContent className={styles.matrixContent}>
                                <div className={styles.matrixHeader}>
                                    <h2>MATRIZ DE HABILIDADES DE {selectedDepartment.toUpperCase()}</h2>
                                    <span className={styles.stats}>
                                        {filteredPositions.length} puestos • {allCourses.length} cursos
                                    </span>
                                </div>

                                {filteredPositions.length === 0 ? (
                                    <div className={styles.empty}>
                                        No hay puestos registrados para este departamento.
                                    </div>
                                ) : allCourses.length === 0 ? (
                                    <div className={styles.empty}>
                                        No hay cursos asignados a los puestos de este departamento.
                                    </div>
                                ) : (
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.matrixTable}>
                                            <thead>
                                                <tr>
                                                    <th className={styles.courseHeader}>CURSO / PUESTO</th>
                                                    {filteredPositions.map(posName => (
                                                        <th key={posName} className={styles.positionHeader}>
                                                            <div className={styles.positionName}>
                                                                {posName}
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allCourses.map(course => (
                                                    <tr key={course}>
                                                        <td className={styles.courseName}>{course}</td>
                                                        {filteredPositions.map(posName => (
                                                            <td
                                                                key={`${course}-${posName}`}
                                                                className={`${styles.cell} ${isCourseRequired(posName, course) ? styles.required : styles.notRequired}`}
                                                            >
                                                                {isCourseRequired(posName, course) && (
                                                                    <span className={styles.checkmark}>✓</span>
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Legend */}
                                <div className={styles.legend}>
                                    <div className={styles.legendItem}>
                                        <span className={`${styles.legendBox} ${styles.required}`}></span>
                                        <span>Curso requerido</span>
                                    </div>
                                    <div className={styles.legendItem}>
                                        <span className={`${styles.legendBox} ${styles.notRequired}`}></span>
                                        <span>No aplica</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty State */}
                    {!loading && !selectedDepartment && (
                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📊</span>
                            <p>Selecciona un departamento para ver la matriz de habilidades</p>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
