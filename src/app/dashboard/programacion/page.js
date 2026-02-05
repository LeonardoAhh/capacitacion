'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore';
import Navbar from '@/components/Navbar/Navbar';
import { Search, Plus, Calendar, Users, BookOpen, Filter, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function ProgramacionPage() {
    const [employees, setEmployees] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArea, setSelectedArea] = useState('all');

    // States for assignment
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch Employees
            // Mock data for now if collection is empty or problematic, but trying real fetch
            const empSnapshot = await getDocs(collection(db, 'employees_programacion'));
            const empList = empSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmployees(empList);

            // Fetch Courses (cursos_induccion)
            // Assuming this collection exists as per user prompt
            const coursesSnapshot = await getDocs(collection(db, 'cursos_induccion'));
            const coursesList = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Si no hay cursos reales, poner unos mock para probar la UI
            if (coursesList.length === 0) {
                setCourses([
                    { id: 'mock1', title: 'Seguridad Industrial Básica', duration: '1h' },
                    { id: 'mock2', title: 'Código de Ética', duration: '30m' },
                    { id: 'mock3', title: '5S en Oficina', duration: '45m' }
                ]);
            } else {
                setCourses(coursesList);
            }

            setLoading(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (selectedEmployees.length === 0 || !selectedCourse) {
            showToast('Selecciona empleados y un curso', 'error');
            return;
        }

        setAssigning(true);
        try {
            const batch = [];
            const programacionRef = collection(db, 'programacion');

            // Crear promesas de asignación
            const promises = selectedEmployees.map(empId => {
                return addDoc(programacionRef, {
                    employeeId: empId,
                    courseId: selectedCourse,
                    assignedAt: Timestamp.now(),
                    status: 'pending' // pending, viewed, downloaded, completed
                });
            });

            await Promise.all(promises);

            showToast(`Curso asignado a ${selectedEmployees.length} empleados correctamente`, 'success');
            setSelectedEmployees([]);
            setSelectedCourse('');
            setAssigning(false);
        } catch (error) {
            console.error("Error signing:", error);
            showToast('Error al asignar curso', 'error');
            setAssigning(false);
        }
    };

    const toggleEmployeeSelection = (id) => {
        if (selectedEmployees.includes(id)) {
            setSelectedEmployees(prev => prev.filter(empId => empId !== id));
        } else {
            setSelectedEmployees(prev => [...prev, id]);
        }
    };

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Filters
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesArea = selectedArea === 'all' || emp.area === selectedArea;
        return matchesSearch && matchesArea;
    });

    // Unique Areas for filter
    const areas = ['all', ...new Set(employees.map(e => e.area).filter(Boolean))];

    return (
        <div className={styles.container}>
            <Navbar />

            <main className={styles.main}>
                <div className={styles.pageHeader}>
                    <div>
                        <h1 className={styles.title}>Programación de Capacitación</h1>
                        <p className={styles.subtitle}>Asigna cursos y gestiona el plan de formación.</p>
                    </div>
                    <Link href="/dashboard/training/registro" className={styles.newEmployeeBtn}>
                        <Plus size={20} />
                        Nuevo Empleado
                    </Link>
                </div>

                <div className={styles.grid}>
                    {/* Left Column: Employee Selection */}
                    <div className={styles.column}>
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}><Users size={20} /> Seleccionar Empleados</h2>

                            <div className={styles.filters}>
                                <div className={styles.searchBox}>
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre o ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={styles.input}
                                    />
                                </div>

                                <select
                                    className={styles.select}
                                    value={selectedArea}
                                    onChange={(e) => setSelectedArea(e.target.value)}
                                >
                                    <option value="all">Todas las Áreas</option>
                                    {areas.filter(a => a !== 'all').map(area => (
                                        <option key={area} value={area}>{area}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.employeeList}>
                                <div className={styles.listHeader}>
                                    <span>Empleado</span>
                                    <span>Puesto</span>
                                </div>
                                {loading ? (
                                    <div className={styles.loading}>Cargando...</div>
                                ) : (
                                    filteredEmployees.map(emp => (
                                        <div
                                            key={emp.id}
                                            className={`${styles.employeeItem} ${selectedEmployees.includes(emp.id) ? styles.selected : ''}`}
                                            onClick={() => toggleEmployeeSelection(emp.id)}
                                        >
                                            <div className={styles.checkbox}>
                                                {selectedEmployees.includes(emp.id) && <CheckCircle size={14} />}
                                            </div>
                                            <div>
                                                <div className={styles.empName}>{emp.name || 'Sin Nombre'}</div>
                                                <div className={styles.empId}>{emp.employeeId}</div>
                                            </div>
                                            <div className={styles.empRole}>{emp.position || emp.puesto || '-'}</div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className={styles.selectionCount}>
                                {selectedEmployees.length} empleados seleccionados
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Course Selection & Action */}
                    <div className={styles.column}>
                        <div className={styles.card}>
                            <h2 className={styles.cardTitle}><BookOpen size={20} /> Seleccionar Curso</h2>

                            <div className={styles.courseList}>
                                {courses.map(course => (
                                    <div
                                        key={course.id}
                                        className={`${styles.courseItem} ${selectedCourse === course.id ? styles.selectedCourse : ''}`}
                                        onClick={() => setSelectedCourse(course.id)}
                                    >
                                        <div className={styles.courseIcon}>
                                            <BookOpen size={24} />
                                        </div>
                                        <div>
                                            <div className={styles.courseName}>{course.title || course.nombre}</div>
                                            <div className={styles.courseInfo}>{course.duration || 'Sin duración'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className={styles.actions}>
                                <button
                                    className={styles.assignBtn}
                                    disabled={assigning || selectedEmployees.length === 0 || !selectedCourse}
                                    onClick={handleAssign}
                                >
                                    {assigning ? 'Asignando...' : 'Asignar Curso Seleccionado'}
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity or Quick Stats could go here */}
                        <div className={`${styles.card} ${styles.statsCard}`}>
                            <h3 className={styles.statsTitle}>Resumen de Asignaciones</h3>
                            <div className={styles.statRow}>
                                <span>Total Asignados Hoy:</span>
                                <strong>0</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {toast && (
                <div className={`${styles.toast} ${styles[toast.type]}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
