'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore';
import Navbar from '@/components/Navbar/Navbar';
import { Search, Plus, Calendar, Users, BookOpen, Filter, CheckCircle, ChevronLeft, Edit2, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';
import EditEmployeeModal from '@/components/Training/EditEmployeeModal';
import EmployeeAssignmentsModal from '@/components/Training/EmployeeAssignmentsModal';
import EmployeeSearchBar from '@/components/EmployeeSearchBar/EmployeeSearchBar';
import MonitoringTable from '@/components/Training/MonitoringTable';
import styles from './page.module.css';

export default function ProgramacionPage() {
    const router = useRouter();
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
    const [activeTab, setActiveTab] = useState('assignment'); // assignment | monitoring
    const [todayCount, setTodayCount] = useState(0);

    // Modal states
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [historyEmployee, setHistoryEmployee] = useState(null);

    const handleUpdateEmployee = (updatedEmp) => {
        setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));
        showToast('Empleado actualizado', 'success');
    };

    const handleDeleteEmployee = (deletedId) => {
        setEmployees(prev => prev.filter(e => e.id !== deletedId));
        setSelectedEmployees(prev => prev.filter(id => id !== deletedId));
        showToast('Empleado eliminado', 'success');
    };

    useEffect(() => {
        fetchData();
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTimestamp = Timestamp.fromDate(today);

            const q = query(
                collection(db, 'programacion'),
                where('assignedAt', '>=', todayTimestamp)
            );
            const snapshot = await getDocs(q);
            setTodayCount(snapshot.size);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

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
            fetchStats(); // Update stats
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

    // Filters - Memoized to avoid unnecessary recalculations
    const filteredEmployees = useMemo(() =>
        employees.filter(emp => {
            const matchesSearch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesArea = selectedArea === 'all' || emp.area === selectedArea;
            return matchesSearch && matchesArea;
        }),
        [employees, searchTerm, selectedArea]
    );

    // Unique Areas for filter - Memoized to avoid recalculation
    const areas = useMemo(() =>
        ['all', ...new Set(employees.map(e => e.area).filter(Boolean))],
        [employees]
    );

    return (
        <div className={styles.container}>
            <Navbar />

            <main className={styles.main}>
                {/* Back button */}
                <Link href="/dashboard" className={styles.backLink}>
                    <ChevronLeft size={20} />
                    <span>Volver al Dashboard</span>
                </Link>

                <div className={styles.controls}>
                    <EmployeeSearchBar
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onAddEmployee={() => router.push('/dashboard/training/registro')}
                        canWrite={true}
                    />
                </div>

                {/* Tabs de Navegación */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1px' }}>
                    <button
                        onClick={() => setActiveTab('assignment')}
                        style={{
                            padding: '0.75rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer',
                            borderBottom: activeTab === 'assignment' ? '2px solid #6366f1' : '2px solid transparent',
                            color: activeTab === 'assignment' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: 600, fontSize: '1rem'
                        }}
                    >
                        Asignación
                    </button>
                    <button
                        onClick={() => setActiveTab('monitoring')}
                        style={{
                            padding: '0.75rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer',
                            borderBottom: activeTab === 'monitoring' ? '2px solid #6366f1' : '2px solid transparent',
                            color: activeTab === 'monitoring' ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: 600, fontSize: '1rem'
                        }}
                    >
                        Monitoreo
                    </button>
                </div>

                {activeTab === 'assignment' ? (
                    <div className={styles.grid}>
                        {/* Left Column: Employee Selection */}
                        <div className={styles.column}>
                            <div className={styles.card}>
                                <h2 className={styles.cardTitle}><Users size={20} /> Seleccionar Empleados</h2>

                                <div className={styles.filters}>
                                    {/* Search is handled globally at the top */}

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
                                        <span></span> {/* Checkbox column */}
                                        <span>Empleado</span>
                                        <span>Puesto</span>
                                        <span>Acciones</span>
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

                                                <div className={styles.itemActions} onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={() => setHistoryEmployee(emp)}
                                                        title="Ver Asignaciones"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={() => setEditingEmployee(emp)}
                                                        title="Editar Empleado"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </div>
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
                                    <strong>{todayCount}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <MonitoringTable />
                )}
            </main>

            {toast && (
                <div className={`${styles.toast} ${styles[toast.type]}`}>
                    {toast.message}
                </div>
            )}

            {editingEmployee && (
                <EditEmployeeModal
                    employee={editingEmployee}
                    onClose={() => setEditingEmployee(null)}
                    onUpdate={handleUpdateEmployee}
                    onDelete={handleDeleteEmployee}
                />
            )}

            {historyEmployee && (
                <EmployeeAssignmentsModal
                    employee={historyEmployee}
                    onClose={() => setHistoryEmployee(null)}
                />
            )}
        </div>
    );
}
