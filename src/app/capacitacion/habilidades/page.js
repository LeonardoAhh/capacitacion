'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card/Card';
import styles from './page.module.css';

// Data imports
import infoData from '@/data/info.json';
import matrizData from '@/data/matriz.json';

export default function HabilidadesPage() {
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [loading, setLoading] = useState(false);

    // Get unique departments from info.json
    const departments = useMemo(() => {
        const depts = new Set(infoData.map(item => item.department));
        return Array.from(depts).sort();
    }, []);

    // Build position-courses map from matriz.json
    const positionCoursesMap = useMemo(() => {
        const map = new Map();
        matrizData.forEach(item => {
            if (!map.has(item.position)) {
                map.set(item.position, new Set());
            }
            map.get(item.position).add(item.requiredCourses);
        });
        return map;
    }, []);

    // Get positions for selected department
    const filteredPositions = useMemo(() => {
        if (!selectedDepartment) return [];
        return infoData
            .filter(item => item.department === selectedDepartment)
            .map(item => item.position)
            .sort();
    }, [selectedDepartment]);

    // Get all unique courses for the selected department's positions
    const allCourses = useMemo(() => {
        if (filteredPositions.length === 0) return [];
        const coursesSet = new Set();
        filteredPositions.forEach(position => {
            const courses = positionCoursesMap.get(position);
            if (courses) {
                courses.forEach(course => coursesSet.add(course));
            }
        });
        return Array.from(coursesSet).sort();
    }, [filteredPositions, positionCoursesMap]);

    // Check if a course is required for a position
    const isCourseRequired = (position, course) => {
        const courses = positionCoursesMap.get(position);
        return courses ? courses.has(course) : false;
    };

    return (
        <>
            <Navbar />
            <main className={styles.main} id="main-content">
                <div className={styles.container}>
                    {/* Header */}
                    <div className={styles.header}>
                        <Link href="/capacitacion" className={styles.backBtn}>
                            ← Capacitación
                        </Link>
                        <h1 className={styles.title}>Matriz de Habilidades</h1>
                        <p className={styles.subtitle}>
                            Visualiza los cursos requeridos por puesto en cada departamento
                        </p>
                    </div>

                    {/* Department Selector */}
                    <div className={styles.selectorSection}>
                        <label className={styles.selectorLabel}>Selecciona un Departamento:</label>
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
                    </div>

                    {/* Matrix Table */}
                    {selectedDepartment && (
                        <Card className={styles.matrixCard}>
                            <CardContent className={styles.matrixContent}>
                                <div className={styles.matrixHeader}>
                                    <h2>MATRIZ DE HABILIDADES DE {selectedDepartment}</h2>
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
                                                    <th className={styles.courseHeader}>PUESTO</th>
                                                    {filteredPositions.map(position => (
                                                        <th key={position} className={styles.positionHeader}>
                                                            <div className={styles.positionName}>
                                                                {position}
                                                            </div>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {allCourses.map(course => (
                                                    <tr key={course}>
                                                        <td className={styles.courseName}>{course}</td>
                                                        {filteredPositions.map(position => (
                                                            <td
                                                                key={`${course}-${position}`}
                                                                className={`${styles.cell} ${isCourseRequired(position, course) ? styles.required : styles.notRequired}`}
                                                            >
                                                                {isCourseRequired(position, course) && (
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
                    {!selectedDepartment && (
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
