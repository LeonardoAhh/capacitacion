'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, arrayUnion, addDoc, getDoc, where, limit } from 'firebase/firestore';
import styles from './page.module.css';
import multiStyles from './multi-styles.module.css';

export default function RegistroPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data Sources
    const [employees, setEmployees] = useState([]); // {id, name}
    const [courses, setCourses] = useState([]); // names array

    // Selection State
    const [selectedEmps, setSelectedEmps] = useState([]); // Array of IDs
    const [selectedCourses, setSelectedCourses] = useState([]); // Array of Course Names

    // Filters
    const [empSearch, setEmpSearch] = useState('');
    const [courseSearch, setCourseSearch] = useState('');

    // New Course
    const [isNewCourse, setIsNewCourse] = useState(false);
    const [newCourseName, setNewCourseName] = useState('');

    // Common Data
    const [qualification, setQualification] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const empSnap = await getDocs(query(collection(db, 'training_records'), orderBy('name')));
            setEmployees(empSnap.docs.map(d => ({
                id: d.id,
                name: d.data().name,
                employeeId: d.data().employeeId || d.id // Handle cases where employeeId might be missing
            })));

            const courseSnap = await getDocs(query(collection(db, 'courses'), orderBy('name')));
            setCourses(courseSnap.docs.map(d => d.data().name));
        } catch (error) {
            console.error(error);
            toast.error("Error", "No se pudieron cargar los datos.");
        } finally {
            setLoading(false);
        }
    };

    const toggleEmp = (id) => {
        setSelectedEmps(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const toggleCourse = (name) => {
        setSelectedCourses(prev =>
            prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
        );
    };

    const selectAllFilteredEmps = () => {
        const filteredIds = filteredEmployees.map(e => e.id);

        // Add only ones not already selected
        const newSelection = [...new Set([...selectedEmps, ...filteredIds])];
        setSelectedEmps(newSelection);
    };

    const selectAllFilteredCourses = () => {
        const filteredNames = filteredCourses;
        const newSelection = [...new Set([...selectedCourses, ...filteredNames])];
        setSelectedCourses(newSelection);
    };

    const clearCourseSelection = () => {
        setSelectedCourses([]);
    };

    const clearSelection = () => {
        setSelectedEmps([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (selectedEmps.length === 0) {
            toast.error("Atención", "Selecciona al menos un empleado.");
            return;
        }

        let finalCourses = [...selectedCourses];

        // Handle New Course
        if (isNewCourse) {
            if (!newCourseName.trim()) {
                toast.error("Error", "Ingresa el nombre del nuevo curso.");
                return;
            }
            finalCourses = [newCourseName.trim().toUpperCase()];
        } else if (finalCourses.length === 0) {
            toast.error("Atención", "Selecciona al menos un curso.");
            return;
        }

        if (!qualification || !date) {
            toast.error("Atención", "Faltan datos de calificación o fecha.");
            return;
        }

        // Validación de calificación
        const score = parseFloat(qualification);
        if (isNaN(score) || score < 0 || score > 100) {
            toast.error("Error", "La calificación debe ser un número entre 0 y 100.");
            return;
        }

        setSubmitting(true);
        try {
            // 1. Create New Course if needed
            if (isNewCourse) {
                const cName = finalCourses[0];
                if (!courses.includes(cName)) {
                    await addDoc(collection(db, 'courses'), {
                        name: cName,
                        category: 'GENERAL',
                        createdAt: new Date()
                    });
                    setCourses(prev => [...prev, cName].sort());
                }
            }

            // 2. Prepare common data
            const status = score >= 70 ? 'approved' : 'failed';
            const [y, m, d] = date.split('-');
            const formattedDate = `${d}/${m}/${y}`; // DD/MM/YYYY

            // 3. Process employees in parallel
            const processEmployee = async (empId) => {
                const empRef = doc(db, 'training_records', empId);
                const empSnap = await getDoc(empRef);
                if (!empSnap.exists()) return null;

                const empData = empSnap.data();
                let currentMatrix = empData.matrix || { requiredCount: 0, completedCount: 0, requiredCourses: [] };
                let currentHistory = [...(empData.history || [])]; // Clone for modification

                // Self-Healing: If matrix is empty, try to fetch it
                if ((!currentMatrix.requiredCourses || currentMatrix.requiredCourses.length === 0) && empData.position) {
                    try {
                        const posName = empData.position;
                        const posColl = collection(db, 'positions');
                        let matrixDoc = null;

                        // 1. Exact Match
                        let q = query(posColl, where('name', '==', posName), limit(1));
                        let snap = await getDocs(q);

                        if (!snap.empty) {
                            matrixDoc = snap.docs[0].data();
                        } else {
                            // 2. Normalized Match (No Accents) & Client Scan
                            const allPosSnap = await getDocs(query(posColl));
                            const targetNorm = posName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

                            const found = allPosSnap.docs.find(d => {
                                const dName = d.data().name.toUpperCase().trim();
                                const dNorm = dName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                return dName === posName.toUpperCase().trim() || dNorm === targetNorm;
                            });

                            if (found) {
                                matrixDoc = found.data();
                            }
                        }

                        if (matrixDoc) {
                            currentMatrix.requiredCourses = matrixDoc.requiredCourses || [];
                            currentMatrix.requiredCount = currentMatrix.requiredCourses.length;
                        }
                    } catch (err) {
                        console.error("Error healing matrix:", err);
                    }
                }

                // Updates container
                let updates = {};

                // For each course selected
                for (const cName of finalCourses) {
                    // Check if course already exists in history
                    const existingIndex = currentHistory.findIndex(h => h.courseName === cName);

                    if (existingIndex >= 0) {
                        // UPDATE existing entry (only date and score)
                        currentHistory[existingIndex] = {
                            ...currentHistory[existingIndex],
                            date: formattedDate,
                            score: score,
                            status: status
                        };
                    } else {
                        // ADD new entry
                        currentHistory.push({
                            courseName: cName,
                            date: formattedDate,
                            score: score,
                            status: status
                        });
                    }
                }

                // Set entire history array
                updates.history = currentHistory;

                // Recalculate matrix if we have required courses
                if (currentMatrix.requiredCount > 0) {
                    const completed = currentMatrix.requiredCourses.filter(req =>
                        currentHistory.some(h => h.courseName === req && h.status === 'approved')
                    );

                    updates.matrix = {
                        requiredCount: currentMatrix.requiredCount,
                        requiredCourses: currentMatrix.requiredCourses,
                        completedCount: completed.length,
                        compliancePercentage: currentMatrix.requiredCount > 0
                            ? Math.round((completed.length / currentMatrix.requiredCount) * 100)
                            : 0
                    };
                }

                updates.updatedAt = new Date().toISOString();
                return updateDoc(empRef, updates);
            };

            // Execute all updates in parallel
            await Promise.all(selectedEmps.map(processEmployee));

            const totalRecs = selectedEmps.length * finalCourses.length;
            toast.success("Éxito", `Se registraron ${totalRecs} capacitaciones.`);

            // Reset partial
            setSelectedEmps([]);
            if (isNewCourse) {
                setIsNewCourse(false);
                setNewCourseName('');
                setSelectedCourses([]); // Clear selection as we used new course
            } else {
                setSelectedCourses([]);
            }
            setQualification('');

        } catch (error) {
            console.error(error);
            toast.error("Error", "Falló la carga masiva.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredEmployees = employees.filter(e => {
        const term = empSearch.toLowerCase();
        return e.name.toLowerCase().includes(term) ||
            (e.employeeId && e.employeeId.toLowerCase().includes(term));
    });

    const filteredCourses = courses.filter(c =>
        c.toLowerCase().includes(courseSearch.toLowerCase())
    );

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <Link href="/capacitacion" className={styles.backBtn}>← Volver</Link>
                        <h1>Carga Masiva de Capacitación</h1>
                        <p>Registra uno o varios cursos para múltiples empleados simultáneamente.</p>
                    </div>

                    <Card>
                        <CardContent>
                            {loading ? <div className="spinner"></div> : (
                                <form onSubmit={handleSubmit} className={styles.form}>

                                    <div className={styles.gridTwoCols}>
                                        {/* Col 1: Empleados */}
                                        <div className={styles.formGroup}>
                                            <label>1. Seleccionar Empleados ({selectedEmps.length})</label>
                                            <div className={multiStyles.multiSelectContainer}>
                                                <div className={multiStyles.searchHeader}>
                                                    <input
                                                        type="text"
                                                        placeholder="Buscar por Nombre o ID..."
                                                        className={multiStyles.searchInput}
                                                        value={empSearch}
                                                        onChange={(e) => setEmpSearch(e.target.value)}
                                                    />
                                                </div>
                                                <div className={multiStyles.listBody}>
                                                    {filteredEmployees.map(emp => (
                                                        <label key={emp.id} className={multiStyles.checkboxItem}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedEmps.includes(emp.id)}
                                                                onChange={() => toggleEmp(emp.id)}
                                                            />
                                                            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                                                                <span>{emp.name}</span>
                                                                <small style={{ opacity: 0.7, fontSize: '0.75em' }}>{emp.employeeId}</small>
                                                            </div>
                                                        </label>
                                                    ))}
                                                    {filteredEmployees.length === 0 && <p className="text-muted p-2">Sin resultados.</p>}
                                                </div>
                                                <div className={multiStyles.selectionSummary}>
                                                    <span>{selectedEmps.length} seleccionados</span>
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <button type="button" onClick={selectAllFilteredEmps} className={multiStyles.selectAllBtn}>Todo Visible</button>
                                                        <button type="button" onClick={clearSelection} className={multiStyles.selectAllBtn}>Limpiar</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Col 2: Cursos */}
                                        <div className={styles.formGroup}>
                                            <label>2. Seleccionar Cursos ({isNewCourse ? '1 Nuevo' : selectedCourses.length})</label>

                                            <div style={{ marginBottom: '0.5rem' }}>
                                                <button type="button" className={styles.toggleBtn} onClick={() => setIsNewCourse(!isNewCourse)}>
                                                    {isNewCourse ? '← Volver a Lista' : '+ Crear Nuevo Curso'}
                                                </button>
                                            </div>

                                            {isNewCourse ? (
                                                <input
                                                    type="text"
                                                    placeholder="Nombre del Nuevo Curso"
                                                    className={styles.input}
                                                    value={newCourseName}
                                                    onChange={e => setNewCourseName(e.target.value)}
                                                />
                                            ) : (
                                                <div className={multiStyles.multiSelectContainer}>
                                                    <div className={multiStyles.searchHeader}>
                                                        <input
                                                            type="text"
                                                            placeholder="Buscar curso..."
                                                            className={multiStyles.searchInput}
                                                            value={courseSearch}
                                                            onChange={(e) => setCourseSearch(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className={multiStyles.listBody}>
                                                        {filteredCourses.map(c => (
                                                            <label key={c} className={multiStyles.checkboxItem}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedCourses.includes(c)}
                                                                    onChange={() => toggleCourse(c)}
                                                                />
                                                                {c}
                                                            </label>
                                                        ))}
                                                        {filteredCourses.length === 0 && <p className="text-muted p-2">Sin resultados.</p>}
                                                    </div>
                                                    <div className={multiStyles.selectionSummary}>
                                                        <span>{selectedCourses.length} seleccionados</span>
                                                        <div style={{ display: 'flex', gap: '10px' }}>
                                                            <button type="button" onClick={selectAllFilteredCourses} className={multiStyles.selectAllBtn}>Todo Visible</button>
                                                            <button type="button" onClick={clearCourseSelection} className={multiStyles.selectAllBtn}>Limpiar</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Datos Comunes */}
                                    <div className={styles.row}>
                                        <div className={styles.formGroup}>
                                            <label>Calificación (0-100)</label>
                                            <input
                                                type="number"
                                                min="0" max="100"
                                                value={qualification}
                                                onChange={(e) => setQualification(e.target.value)}
                                                className={styles.input}
                                                required
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Fecha de Aplicación</label>
                                            <input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                className={styles.input}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.infoBox}>
                                        <p>Se crearán <strong>{selectedEmps.length * (isNewCourse ? 1 : selectedCourses.length)}</strong> registros en total.</p>
                                    </div>

                                    <div className={styles.actions}>
                                        <Button type="submit" disabled={submitting || selectedEmps.length === 0}>
                                            {submitting ? 'Procesando...' : 'Confirmar Carga Masiva'}
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
