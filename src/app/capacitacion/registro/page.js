'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, arrayUnion, addDoc } from 'firebase/firestore';
import styles from './page.module.css';

export default function RegistroPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data Sources
    const [employees, setEmployees] = useState([]);
    const [courses, setCourses] = useState([]);

    // Form State
    const [selectedEmp, setSelectedEmp] = useState(null); // {id, name}
    const [empSearch, setEmpSearch] = useState('');
    const [filteredEmps, setFilteredEmps] = useState([]);

    const [selectedCourse, setSelectedCourse] = useState('');
    const [isNewCourse, setIsNewCourse] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');

    const [qualification, setQualification] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!empSearch) {
            setFilteredEmps([]);
            return;
        }
        if (selectedEmp && empSearch === selectedEmp.name) {
            setFilteredEmps([]); // Don't show dropdown if selected
            return;
        }

        const term = empSearch.toLowerCase();
        const matches = employees
            .filter(e => e.name.toLowerCase().includes(term))
            .slice(0, 5); // Limit suggestions
        setFilteredEmps(matches);
    }, [empSearch, employees, selectedEmp]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load Employees
            const empSnap = await getDocs(query(collection(db, 'training_records'), orderBy('name')));
            setEmployees(empSnap.docs.map(d => ({ id: d.id, name: d.data().name })));

            // Load Courses
            const courseSnap = await getDocs(query(collection(db, 'courses'), orderBy('name')));
            setCourses(courseSnap.docs.map(d => d.data().name));
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Error", "No se pudieron cargar los catálogos.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectEmp = (emp) => {
        setSelectedEmp(emp);
        setEmpSearch(emp.name);
        setFilteredEmps([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEmp) {
            toast.error("Error", "Selecciona un empleado válido.");
            return;
        }
        if (!isNewCourse && !selectedCourse) {
            toast.error("Error", "Selecciona un curso.");
            return;
        }
        if (isNewCourse && !newCourseName.trim()) {
            toast.error("Error", "Escribe el nombre del nuevo curso.");
            return;
        }
        if (!qualification || !date) {
            toast.error("Error", "Completa calificación y fecha.");
            return;
        }

        setSubmitting(true);
        try {
            const courseName = isNewCourse ? newCourseName.trim().toUpperCase() : selectedCourse;

            // 1. If new course, add to catalog
            if (isNewCourse) {
                // Check if exists first to avoid dupes? 
                // Simple logic for now
                if (!courses.includes(courseName)) {
                    await addDoc(collection(db, 'courses'), {
                        name: courseName,
                        category: 'GENERAL', // Default
                        createdAt: new Date()
                    });
                    setCourses(prev => [...prev, courseName].sort());
                }
            }

            // 2. Add to Employee History
            const recordRef = doc(db, 'training_records', selectedEmp.id);
            const score = parseFloat(qualification);
            const status = score >= 70 ? 'approved' : 'failed';

            // Format Date as DD/MM/YYYY for consistency with JSON if needed, or stick to ISO?
            // Existing data uses DD/MM/YYYY. Let's try to match or use ISO.
            // Component uses YYYY-MM-DD. Let's convert to DD/MM/YYYY for consistency.
            const [y, m, d] = date.split('-');
            const formattedDate = `${d}/${m}/${y}`;

            await updateDoc(recordRef, {
                history: arrayUnion({
                    courseName: courseName,
                    date: formattedDate,
                    score: score,
                    status: status
                }),
                updatedAt: new Date().toISOString()
            });

            toast.success("Registrado", `Curso "${courseName}" agregado a ${selectedEmp.name}.`);

            // Reset Form (keep date?)
            setSelectedCourse('');
            setIsNewCourse(false);
            setNewCourseName('');
            setQualification('');
            // Optional: clear employee or keep? Usually nicer to keep if bulk entry.
            // Let's keep employee.

        } catch (error) {
            console.error("Error saving record:", error);
            toast.error("Error", "Falló el guardado.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <Link href="/capacitacion" className={styles.backBtn}>← Volver</Link>
                        <h1>Registro Individual de Capacitación</h1>
                    </div>

                    <Card>
                        <CardContent>
                            {loading ? (
                                <div className="spinner"></div>
                            ) : (
                                <form onSubmit={handleSubmit} className={styles.form}>
                                    {/* 1. Employee Selection */}
                                    <div className={styles.formGroup}>
                                        <label>Empleado</label>
                                        <div className={styles.autocompleteWrapper}>
                                            <input
                                                type="text"
                                                placeholder="Buscar por nombre..."
                                                value={empSearch}
                                                onChange={(e) => {
                                                    setEmpSearch(e.target.value);
                                                    if (selectedEmp && e.target.value !== selectedEmp.name) {
                                                        setSelectedEmp(null); // Clear selection if user types
                                                    }
                                                }}
                                                className={styles.input}
                                            />
                                            {filteredEmps.length > 0 && (
                                                <ul className={styles.suggestions}>
                                                    {filteredEmps.map(emp => (
                                                        <li key={emp.id} onClick={() => handleSelectEmp(emp)}>
                                                            {emp.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Course Selection */}
                                    <div className={styles.formGroup}>
                                        <label>Curso</label>
                                        <div className={styles.courseRow}>
                                            {!isNewCourse ? (
                                                <select
                                                    value={selectedCourse}
                                                    onChange={(e) => setSelectedCourse(e.target.value)}
                                                    className={styles.select}
                                                >
                                                    <option value="">-- Seleccionar Curso --</option>
                                                    {courses.map((c, i) => (
                                                        <option key={i} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    placeholder="Nombre del Nuevo Curso"
                                                    value={newCourseName}
                                                    onChange={(e) => setNewCourseName(e.target.value)}
                                                    className={styles.input}
                                                    autoFocus
                                                />
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setIsNewCourse(!isNewCourse)}
                                                className={styles.toggleBtn}
                                            >
                                                {isNewCourse ? 'Seleccionar existente' : 'Crear nuevo'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 3. Qualification & Date */}
                                    <div className={styles.row}>
                                        <div className={styles.formGroup}>
                                            <label>Calificación (0-100)</label>
                                            <input
                                                type="number"
                                                min="0" max="100"
                                                value={qualification}
                                                onChange={(e) => setQualification(e.target.value)}
                                                className={styles.input}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Fecha de Aplicación</label>
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className={styles.input}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.actions}>
                                        <Button type="submit" disabled={submitting}>
                                            {submitting ? 'Guardando...' : 'Registrar Capacitación'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
