'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore';
import ProfileDropdown from '@/components/ProfileDropdown/ProfileDropdown';
import { Users, BookOpen, CheckCircle, ChevronLeft, Edit2, FileText, LayoutGrid, Activity } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import EditEmployeeModal from '@/components/Training/EditEmployeeModal';
import EmployeeAssignmentsModal from '@/components/Training/EmployeeAssignmentsModal';
import EmployeeSearchBar from '@/components/EmployeeSearchBar/EmployeeSearchBar';
import MonitoringTable from '@/components/Training/MonitoringTable';
import styles from './page.module.css';

// ─── Animation variants ───────────────────────────────────────────────────────

const FADE_UP = {
    hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
    visible: (i = 0) => ({
        opacity: 1, y: 0, filter: 'blur(0px)',
        transition: { duration: 0.4, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
    }),
};

const LIST_ITEM = {
    hidden: { opacity: 0, x: -8 },
    visible: (i = 0) => ({
        opacity: 1, x: 0,
        transition: { duration: 0.28, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] },
    }),
};

const TAB_CONTENT = {
    hidden: { opacity: 0, y: 10, filter: 'blur(3px)' },
    visible: {
        opacity: 1, y: 0, filter: 'blur(0px)',
        transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
    },
    exit: {
        opacity: 0, y: -6, filter: 'blur(3px)',
        transition: { duration: 0.18, ease: 'easeIn' }
    },
};

// ─── ProgramacionPage ─────────────────────────────────────────────────────────

export default function ProgramacionPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArea, setSelectedArea] = useState('all');
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('assignment');
    const [todayCount, setTodayCount] = useState(0);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [historyEmployee, setHistoryEmployee] = useState(null);

    // ── Handlers (unchanged) ──────────────────────────────────────────────────

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
            const q = query(collection(db, 'programacion'), where('assignedAt', '>=', todayTimestamp));
            const snapshot = await getDocs(q);
            setTodayCount(snapshot.size);
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchData = async () => {
        try {
            const empSnapshot = await getDocs(collection(db, 'employees_programacion'));
            const empList = empSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmployees(empList);

            const coursesSnapshot = await getDocs(collection(db, 'cursos_induccion'));
            const coursesList = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            if (coursesList.length === 0) {
                setCourses([
                    { id: 'mock1', title: 'Seguridad Industrial Básica', duration: '1h' },
                    { id: 'mock2', title: 'Código de Ética', duration: '30m' },
                    { id: 'mock3', title: '5S en Oficina', duration: '45m' },
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
            const programacionRef = collection(db, 'programacion');
            const promises = selectedEmployees.map(empId =>
                addDoc(programacionRef, {
                    employeeId: empId,
                    courseId: selectedCourse,
                    assignedAt: Timestamp.now(),
                    status: 'pending',
                })
            );
            await Promise.all(promises);
            showToast(`Curso asignado a ${selectedEmployees.length} empleados correctamente`, 'success');
            setSelectedEmployees([]);
            setSelectedCourse('');
            setAssigning(false);
            fetchStats();
        } catch (error) {
            console.error("Error signing:", error);
            showToast('Error al asignar curso', 'error');
            setAssigning(false);
        }
    };

    const toggleEmployeeSelection = (id) => {
        setSelectedEmployees(prev =>
            prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id]
        );
    };

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filteredEmployees = useMemo(() =>
        employees.filter(emp => {
            const matchesSearch =
                emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesArea = selectedArea === 'all' || emp.area === selectedArea;
            return matchesSearch && matchesArea;
        }),
        [employees, searchTerm, selectedArea]
    );

    const areas = useMemo(() =>
        ['all', ...new Set(employees.map(e => e.area).filter(Boolean))],
        [employees]
    );

    const canAssign = !assigning && selectedEmployees.length > 0 && !!selectedCourse;

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className={styles.container}>
            <div className={styles.profileContainer}>
                <ProfileDropdown />
            </div>

            <main className={styles.main}>

                {/* Back link */}
                <Link href="/dashboard" className={styles.backLink}>
                    <ChevronLeft size={18} aria-hidden="true" />
                    <span>Volver al Dashboard</span>
                </Link>

                {/* Search / controls */}
                <motion.div
                    className={styles.controls}
                    variants={FADE_UP}
                    custom={0}
                    initial="hidden"
                    animate="visible"
                >
                    <EmployeeSearchBar
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onAddEmployee={() => router.push('/dashboard/training/registro')}
                        canWrite={true}
                    />
                </motion.div>

                {/* ── Tabs ── */}
                <motion.div
                    className={styles.tabBar}
                    variants={FADE_UP}
                    custom={1}
                    initial="hidden"
                    animate="visible"
                >
                    {[
                        { key: 'assignment', label: 'Asignación', Icon: LayoutGrid },
                        { key: 'monitoring', label: 'Monitoreo', Icon: Activity },
                    ].map(({ key, label, Icon }) => (
                        <button
                            key={key}
                            className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab(key)}
                            type="button"
                        >
                            <Icon size={16} aria-hidden="true" />
                            <span>{label}</span>
                            {activeTab === key && (
                                <motion.div
                                    className={styles.tabIndicator}
                                    layoutId="tabIndicator"
                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </motion.div>

                {/* ── Tab content ── */}
                <AnimatePresence mode="wait">
                    {activeTab === 'assignment' ? (
                        <motion.div
                            key="assignment"
                            className={styles.grid}
                            variants={TAB_CONTENT}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {/* ── Left: Employee selection ── */}
                            <motion.div className={styles.column} variants={FADE_UP} custom={2}>
                                <div className={styles.card}>
                                    <h2 className={styles.cardTitle}>
                                        <Users size={18} aria-hidden="true" />
                                        Seleccionar Empleados
                                    </h2>

                                    {/* Area filter */}
                                    <div className={styles.filters}>
                                        <select
                                            className={styles.select}
                                            value={selectedArea}
                                            onChange={e => setSelectedArea(e.target.value)}
                                            aria-label="Filtrar por área"
                                        >
                                            <option value="all">Todas las Áreas</option>
                                            {areas.filter(a => a !== 'all').map(area => (
                                                <option key={area} value={area}>{area}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Employee list */}
                                    <div className={styles.employeeList} role="list">
                                        <div className={styles.listHeader} aria-hidden="true">
                                            <span />
                                            <span>Empleado</span>
                                            <span>Puesto</span>
                                            <span>Acciones</span>
                                        </div>

                                        {loading ? (
                                            <div className={styles.loading}>
                                                <span className={styles.loadingDot} />
                                                <span className={styles.loadingDot} />
                                                <span className={styles.loadingDot} />
                                            </div>
                                        ) : filteredEmployees.length === 0 ? (
                                            <div className={styles.emptyState}>
                                                <Users size={28} opacity={0.3} />
                                                <span>Sin resultados</span>
                                            </div>
                                        ) : (
                                            filteredEmployees.map((emp, i) => (
                                                <motion.div
                                                    key={emp.id}
                                                    role="listitem"
                                                    className={`${styles.employeeItem} ${selectedEmployees.includes(emp.id) ? styles.selected : ''}`}
                                                    onClick={() => toggleEmployeeSelection(emp.id)}
                                                    variants={LIST_ITEM}
                                                    custom={i}
                                                    initial="hidden"
                                                    animate="visible"
                                                    whileTap={{ scale: 0.99 }}
                                                >
                                                    <div className={styles.checkbox} aria-hidden="true">
                                                        {selectedEmployees.includes(emp.id) && (
                                                            <CheckCircle size={14} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className={styles.empName}>{emp.name || 'Sin Nombre'}</div>
                                                        <div className={styles.empId}>{emp.employeeId}</div>
                                                    </div>
                                                    <div className={styles.empRole}>
                                                        {emp.position || emp.puesto || '—'}
                                                    </div>
                                                    <div className={styles.itemActions} onClick={e => e.stopPropagation()}>
                                                        <button
                                                            className={styles.actionBtn}
                                                            onClick={() => setHistoryEmployee(emp)}
                                                            title="Ver Asignaciones"
                                                            type="button"
                                                        >
                                                            <FileText size={15} aria-hidden="true" />
                                                        </button>
                                                        <button
                                                            className={styles.actionBtn}
                                                            onClick={() => setEditingEmployee(emp)}
                                                            title="Editar Empleado"
                                                            type="button"
                                                        >
                                                            <Edit2 size={15} aria-hidden="true" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>

                                    {/* Selection count badge */}
                                    <AnimatePresence>
                                        {selectedEmployees.length > 0 && (
                                            <motion.div
                                                className={styles.selectionCount}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 6 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <CheckCircle size={14} aria-hidden="true" />
                                                {selectedEmployees.length} empleado{selectedEmployees.length !== 1 ? 's' : ''} seleccionado{selectedEmployees.length !== 1 ? 's' : ''}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>

                            {/* ── Right: Course selection + stats ── */}
                            <motion.div className={styles.column} variants={FADE_UP} custom={3}>
                                <div className={styles.card}>
                                    <h2 className={styles.cardTitle}>
                                        <BookOpen size={18} aria-hidden="true" />
                                        Seleccionar Curso
                                    </h2>

                                    <div className={styles.courseList} role="list">
                                        {courses.map((course, i) => (
                                            <motion.div
                                                key={course.id}
                                                role="listitem"
                                                className={`${styles.courseItem} ${selectedCourse === course.id ? styles.selectedCourse : ''}`}
                                                onClick={() => setSelectedCourse(course.id)}
                                                variants={LIST_ITEM}
                                                custom={i}
                                                initial="hidden"
                                                animate="visible"
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className={`${styles.courseIcon} ${selectedCourse === course.id ? styles.courseIconActive : ''}`}>
                                                    <BookOpen size={22} aria-hidden="true" />
                                                </div>
                                                <div className={styles.courseInfo}>
                                                    <div className={styles.courseName}>
                                                        {course.title || course.nombre}
                                                    </div>
                                                    <div className={styles.courseDuration}>
                                                        {course.duration || 'Sin duración'}
                                                    </div>
                                                </div>
                                                {selectedCourse === course.id && (
                                                    <motion.div
                                                        className={styles.courseCheck}
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                    >
                                                        <CheckCircle size={18} />
                                                    </motion.div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div className={styles.actions}>
                                        <motion.button
                                            className={`${styles.assignBtn} ${!canAssign ? styles.assignBtnDisabled : ''}`}
                                            disabled={!canAssign}
                                            onClick={handleAssign}
                                            type="button"
                                            whileHover={canAssign ? { y: -2 } : {}}
                                            whileTap={canAssign ? { scale: 0.98 } : {}}
                                        >
                                            {assigning ? (
                                                <>
                                                    <span className={styles.spinnerDot} />
                                                    Asignando...
                                                </>
                                            ) : (
                                                'Asignar Curso Seleccionado'
                                            )}
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Stats card */}
                                <motion.div
                                    className={`${styles.card} ${styles.statsCard}`}
                                    variants={FADE_UP}
                                    custom={4}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <h3 className={styles.statsTitle}>
                                        <Activity size={16} aria-hidden="true" />
                                        Resumen de Asignaciones
                                    </h3>
                                    <div className={styles.statRow}>
                                        <span className={styles.statLabel}>Asignados hoy</span>
                                        <motion.strong
                                            className={styles.statValue}
                                            key={todayCount}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                        >
                                            {todayCount}
                                        </motion.strong>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="monitoring"
                            variants={TAB_CONTENT}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <MonitoringTable />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key={toast.message}
                        className={`${styles.toast} ${styles[toast.type]}`}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        role="status"
                        aria-live="polite"
                    >
                        {toast.type === 'success'
                            ? <CheckCircle size={16} aria-hidden="true" />
                            : <span aria-hidden="true">!</span>
                        }
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Modals (unchanged) ── */}
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