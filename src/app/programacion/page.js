'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { useToast } from '@/components/ui/Toast/Toast';
import {
    Users, BookOpen, CheckCircle, LayoutGrid, Activity,
    Search, RefreshCw, UserPlus, Edit2, FileText, ArrowLeft, ChevronRight,
} from 'lucide-react';
import EditEmployeeModal from '@/components/features/Training/EditEmployeeModal';
import EmployeeAssignmentsModal from '@/components/features/Training/EmployeeAssignmentsModal';
import MonitoringTable from '@/components/features/Training/MonitoringTable';
import useIsMobile from '@/hooks/useIsMobile';
import styles from './page.module.css';

const STEP_LABELS = ['Empleados', 'Curso', 'Confirmar'];

// ── StatsBar ──────────────────────────────────────────────────────────────────
function StatsBar({ totalEmployees, todayCount, selectedCount, totalCourses }) {
    const items = [
        { value: totalEmployees, label: 'Total Empleados', color: 'Primary', icon: <Users size={20} /> },
        { value: todayCount,     label: 'Asignados Hoy',   color: 'Success', icon: <CheckCircle size={20} /> },
        { value: selectedCount,  label: 'Seleccionados',   color: 'Amber',   icon: <CheckCircle size={20} /> },
        { value: totalCourses,   label: 'Cursos',          color: 'Muted',   icon: <BookOpen size={20} /> },
    ];
    return (
        <div className={styles.statsGrid} role="region" aria-label="Indicadores">
            {items.map(({ value, label, color, icon }) => (
                <div key={label} className={`${styles.statCard} ${styles[`statCard${color}`]}`}>
                    <div className={`${styles.statIconWrap} ${styles[`statIconWrap${color}`]}`}>{icon}</div>
                    <div className={styles.statInfo}>
                        <div className={styles.statValue}>{value}</div>
                        <div className={styles.statLabel}>{label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProgramacionPage() {
    const router = useRouter();
    const { isMobile } = useIsMobile();
    const { toast } = useToast();

    const [employees, setEmployees] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArea, setSelectedArea] = useState('all');
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [activeTab, setActiveTab] = useState('assignment');
    const [todayCount, setTodayCount] = useState(0);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [historyEmployee, setHistoryEmployee] = useState(null);

    // Mobile stepper
    const [mobileStep, setMobileStep] = useState(0);
    const [mobileSearch, setMobileSearch] = useState('');

    // ── Data ──────────────────────────────────────────────────────────────────
    const handleUpdateEmployee = (updatedEmp) => {
        setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));
        toast.success('Empleado actualizado');
    };

    const handleDeleteEmployee = (deletedId) => {
        setEmployees(prev => prev.filter(e => e.id !== deletedId));
        setSelectedEmployees(prev => prev.filter(id => id !== deletedId));
        toast.success('Empleado eliminado');
    };

    useEffect(() => {
        fetchData();
        fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchStats = async () => {
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const snap = await getDocs(
                query(collection(db, 'programacion'), where('assignedAt', '>=', Timestamp.fromDate(today)))
            );
            setTodayCount(snap.size);
        } catch (e) {
            console.error('Error fetching stats:', e);
        }
    };

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const empSnap = await getDocs(collection(db, 'employees_programacion'));
            setEmployees(empSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            const [cursosSnap, legacySnap] = await Promise.all([
                getDocs(query(collection(db, 'cursos'), where('published', '==', true))),
                getDocs(collection(db, 'cursos_induccion')),
            ]);

            const mainCourses = cursosSnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(c => !c.tipo || c.tipo !== 'link')
                .map(c => ({ id: c.id, title: c.title || c.nombre || 'Sin título', duration: c.duration || c.duracion || '' }))
                .sort((a, b) => a.title.localeCompare(b.title, 'es'));

            const legacyCourses = legacySnap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .map(c => ({ id: c.id, title: c.title || c.nombre || 'Sin título', duration: c.duration || c.duracion || '' }));

            const seenTitles = new Set(mainCourses.map(c => c.title.toLowerCase()));
            const allCourses = [...mainCourses, ...legacyCourses.filter(c => !seenTitles.has(c.title.toLowerCase()))];

            setCourses(allCourses.length > 0 ? allCourses : [
                { id: 'mock1', title: 'Seguridad Industrial Básica', duration: '1h' },
                { id: 'mock2', title: 'Código de Ética', duration: '30m' },
                { id: 'mock3', title: '5S en Oficina', duration: '45m' },
            ]);
        } catch (e) {
            console.error('Error fetching data:', e);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedEmployees.length || !selectedCourse) {
            toast.error('Selecciona empleados y un curso');
            return;
        }
        setAssigning(true);
        try {
            await Promise.all(selectedEmployees.map(empId =>
                addDoc(collection(db, 'programacion'), {
                    employeeId: empId,
                    courseId: selectedCourse,
                    assignedAt: Timestamp.now(),
                    status: 'pending',
                })
            ));
            toast.success(`Curso asignado a ${selectedEmployees.length} empleado${selectedEmployees.length !== 1 ? 's' : ''}`);
            setSelectedEmployees([]);
            setSelectedCourse('');
            if (isMobile) setMobileStep(0);
            fetchStats();
        } catch (e) {
            console.error(e);
            toast.error('Error al asignar curso');
        } finally {
            setAssigning(false);
        }
    };

    const toggleEmployee = useCallback((id) => {
        setSelectedEmployees(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    }, []);

    // ── Derived ───────────────────────────────────────────────────────────────
    const activeSearch = isMobile ? mobileSearch : searchTerm;

    const filteredEmployees = useMemo(() =>
        employees.filter(emp => {
            const matchSearch = !activeSearch
                || emp.name?.toLowerCase().includes(activeSearch.toLowerCase())
                || emp.employeeId?.toLowerCase().includes(activeSearch.toLowerCase());
            const matchArea = selectedArea === 'all' || emp.area === selectedArea;
            return matchSearch && matchArea;
        }),
        [employees, activeSearch, selectedArea]
    );

    const areas = useMemo(() =>
        ['all', ...new Set(employees.map(e => e.area).filter(Boolean))],
        [employees]
    );

    const canAssign = !assigning && selectedEmployees.length > 0 && !!selectedCourse;

    const selectedCourseName = useMemo(() =>
        courses.find(c => c.id === selectedCourse)?.title ?? '',
        [courses, selectedCourse]
    );

    const canGoNext = mobileStep === 0
        ? selectedEmployees.length > 0
        : mobileStep === 1
            ? !!selectedCourse
            : false;

    // ── Render helpers ────────────────────────────────────────────────────────
    const renderEmployeeList = () => {
        if (loading) return (
            <div className={styles.loadingRow}>
                <span className={styles.spinner} aria-hidden="true" /> Cargando empleados…
            </div>
        );
        if (!filteredEmployees.length) return (
            <div className={styles.emptyState}>
                <Users size={32} aria-hidden="true" />
                <span>Sin resultados</span>
            </div>
        );
        return filteredEmployees.map(emp => (
            <div
                key={emp.id}
                className={`${styles.empRow} ${selectedEmployees.includes(emp.id) ? styles.empRowSelected : ''}`}
                onClick={() => toggleEmployee(emp.id)}
                role="checkbox"
                aria-checked={selectedEmployees.includes(emp.id)}
                tabIndex={0}
                onKeyDown={e => e.key === ' ' && toggleEmployee(emp.id)}
            >
                <div className={`${styles.checkbox} ${selectedEmployees.includes(emp.id) ? styles.checkboxActive : ''}`}>
                    {selectedEmployees.includes(emp.id) && <CheckCircle size={14} />}
                </div>
                <div className={styles.empInfo}>
                    <span className={styles.empName}>{emp.name || 'Sin Nombre'}</span>
                    {emp.employeeId && <span className={styles.empId}>#{emp.employeeId}</span>}
                </div>
                <div className={styles.empRole}>{emp.position || emp.puesto || '—'}</div>
                <div className={styles.itemActions} onClick={e => e.stopPropagation()}>
                    <button
                        className={`${styles.iconBtn} ${styles.iconBtnAmber}`}
                        onClick={() => setHistoryEmployee(emp)}
                        title="Ver Asignaciones"
                        type="button"
                    >
                        <FileText size={13} />
                    </button>
                    <button
                        className={`${styles.iconBtn} ${styles.iconBtnBlue}`}
                        onClick={() => setEditingEmployee(emp)}
                        title="Editar"
                        type="button"
                    >
                        <Edit2 size={13} />
                    </button>
                </div>
            </div>
        ));
    };

    const renderCourseList = () => (
        <div className={styles.courseList} role="radiogroup" aria-label="Cursos disponibles">
            {courses.map(course => (
                <div
                    key={course.id}
                    className={`${styles.courseItem} ${selectedCourse === course.id ? styles.courseItemSelected : ''}`}
                    onClick={() => setSelectedCourse(course.id)}
                    role="radio"
                    aria-checked={selectedCourse === course.id}
                    tabIndex={0}
                    onKeyDown={e => e.key === ' ' && setSelectedCourse(course.id)}
                >
                    <div className={`${styles.courseIcon} ${selectedCourse === course.id ? styles.courseIconActive : ''}`}>
                        <BookOpen size={20} aria-hidden="true" />
                    </div>
                    <div className={styles.courseInfo}>
                        <span className={styles.courseName}>{course.title}</span>
                        <span className={styles.courseDuration}>{course.duration || 'Sin duración'}</span>
                    </div>
                    {selectedCourse === course.id && (
                        <CheckCircle size={18} className={styles.courseCheck} aria-hidden="true" />
                    )}
                </div>
            ))}
        </div>
    );

    // ── Desktop assignment ────────────────────────────────────────────────────
    const renderDesktopAssignment = () => (
        <div className={styles.assignGrid}>
            {/* Left: Employees */}
            <div className={styles.panel}>
                <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>
                        <Users size={16} aria-hidden="true" /> Empleados
                    </h2>
                    <div className={styles.panelToolbar}>
                        <div className={styles.searchBox}>
                            <Search size={15} className={styles.searchIcon} aria-hidden="true" />
                            <input
                                type="search"
                                className={styles.searchInput}
                                placeholder="Buscar empleado…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                aria-label="Buscar empleado"
                            />
                        </div>
                        <select
                            className={styles.filterSelect}
                            value={selectedArea}
                            onChange={e => setSelectedArea(e.target.value)}
                            aria-label="Filtrar por área"
                        >
                            <option value="all">Todas las áreas</option>
                            {areas.filter(a => a !== 'all').map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                        <button
                            className={styles.btnOutline}
                            onClick={() => router.push('/training/registro')}
                            type="button"
                            title="Nuevo empleado"
                        >
                            <UserPlus size={14} /> Nuevo
                        </button>
                    </div>
                </div>

                <div className={styles.empListWrap}>
                    <div className={styles.listHeader} aria-hidden="true">
                        <span />
                        <span>Empleado</span>
                        <span>Puesto</span>
                        <span />
                    </div>
                    {renderEmployeeList()}
                </div>

                {selectedEmployees.length > 0 && (
                    <div className={styles.selectionBadge}>
                        <CheckCircle size={14} aria-hidden="true" />
                        {selectedEmployees.length} empleado{selectedEmployees.length !== 1 ? 's' : ''} seleccionado{selectedEmployees.length !== 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Right: Courses */}
            <div className={styles.panel}>
                <div className={styles.panelHeader}>
                    <h2 className={styles.panelTitle}>
                        <BookOpen size={16} aria-hidden="true" /> Seleccionar Curso
                    </h2>
                </div>

                {renderCourseList()}

                <div className={styles.panelFooter}>
                    <button
                        className={`${styles.btnAssign} ${!canAssign ? styles.btnAssignDisabled : ''}`}
                        onClick={handleAssign}
                        disabled={!canAssign}
                        type="button"
                    >
                        {assigning
                            ? <><span className={styles.spinner} aria-hidden="true" /> Asignando…</>
                            : 'Asignar Curso Seleccionado'
                        }
                    </button>
                </div>
            </div>
        </div>
    );

    // ── Mobile stepper ────────────────────────────────────────────────────────
    const renderMobileAssignment = () => {
        const confirmedNames = employees
            .filter(e => selectedEmployees.includes(e.id))
            .map(e => e.name || 'Sin Nombre');

        return (
            <>
                {/* Step indicators */}
                <div className={styles.stepHead} aria-label="Pasos">
                    {STEP_LABELS.map((label, i) => (
                        <div
                            key={i}
                            className={`${styles.stepDot} ${i === mobileStep ? styles.stepDotActive : ''} ${i < mobileStep ? styles.stepDotDone : ''}`}
                        >
                            <div className={styles.stepDotCircle}>
                                {i < mobileStep ? <CheckCircle size={13} aria-hidden="true" /> : <span>{i + 1}</span>}
                            </div>
                            <span className={styles.stepDotLabel}>{label}</span>
                        </div>
                    ))}
                </div>

                {/* Step content */}
                <div className={styles.stepBody}>
                    {mobileStep === 0 && (
                        <>
                            <h3 className={styles.mobileStepTitle}>
                                <Users size={16} aria-hidden="true" /> Seleccionar Empleados
                            </h3>
                            <div className={styles.searchBox}>
                                <Search size={15} className={styles.searchIcon} aria-hidden="true" />
                                <input
                                    type="search"
                                    className={styles.searchInput}
                                    placeholder="Buscar empleado…"
                                    value={mobileSearch}
                                    onChange={e => setMobileSearch(e.target.value)}
                                    aria-label="Buscar empleado"
                                />
                            </div>
                            <div className={styles.mobileFilters}>
                                <select
                                    className={styles.filterSelect}
                                    style={{ flex: 1 }}
                                    value={selectedArea}
                                    onChange={e => setSelectedArea(e.target.value)}
                                    aria-label="Filtrar por área"
                                >
                                    <option value="all">Todas las áreas</option>
                                    {areas.filter(a => a !== 'all').map(a => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                                <button
                                    className={styles.btnOutline}
                                    onClick={() => router.push('/training/registro')}
                                    type="button"
                                    title="Nuevo empleado"
                                >
                                    <UserPlus size={14} />
                                </button>
                            </div>
                            <div className={styles.empListWrap}>
                                {renderEmployeeList()}
                            </div>
                        </>
                    )}

                    {mobileStep === 1 && (
                        <>
                            <h3 className={styles.mobileStepTitle}>
                                <BookOpen size={16} aria-hidden="true" /> Seleccionar Curso
                            </h3>
                            {renderCourseList()}
                        </>
                    )}

                    {mobileStep === 2 && (
                        <>
                            <h3 className={styles.mobileStepTitle}>
                                <CheckCircle size={16} aria-hidden="true" /> Confirmar Asignación
                            </h3>
                            <div className={styles.confirmCard}>
                                <div className={styles.confirmSection}>
                                    <span className={styles.confirmLabel}>Curso</span>
                                    <span className={styles.confirmValue}>{selectedCourseName}</span>
                                </div>
                                <div className={styles.confirmDivider} />
                                <div className={styles.confirmSection}>
                                    <span className={styles.confirmLabel}>Empleados ({confirmedNames.length})</span>
                                    <ul className={styles.confirmList}>
                                        {confirmedNames.map((name, i) => (
                                            <li key={i} className={styles.confirmListItem}>
                                                <CheckCircle size={12} aria-hidden="true" />
                                                {name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className={styles.confirmDivider} />
                                <div className={styles.confirmSection}>
                                    <span className={styles.confirmLabel}>Fecha</span>
                                    <span className={styles.confirmValue}>
                                        {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.confirmStats}>
                                <div className={styles.confirmStatItem}>
                                    <span className={styles.confirmStatNumber}>{todayCount}</span>
                                    <span className={styles.confirmStatLabel}>Asignados hoy</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Bottom action bar */}
                <div className={styles.bottomBar}>
                    {mobileStep > 0 && (
                        <button
                            className={styles.bottomBarBack}
                            onClick={() => setMobileStep(p => p - 1)}
                            type="button"
                            aria-label="Paso anterior"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <div className={styles.bottomBarInfo}>
                        {mobileStep === 0 && (
                            selectedEmployees.length > 0
                                ? `${selectedEmployees.length} empleado${selectedEmployees.length !== 1 ? 's' : ''} seleccionado${selectedEmployees.length !== 1 ? 's' : ''}`
                                : 'Selecciona empleados'
                        )}
                        {mobileStep === 1 && (selectedCourse ? selectedCourseName : 'Selecciona un curso')}
                        {mobileStep === 2 && `${selectedEmployees.length} empleado${selectedEmployees.length !== 1 ? 's' : ''} × 1 curso`}
                    </div>
                    {mobileStep < 2 ? (
                        <button
                            className={`${styles.bottomBarBtn} ${!canGoNext ? styles.bottomBarBtnDisabled : ''}`}
                            onClick={() => canGoNext && setMobileStep(p => p + 1)}
                            disabled={!canGoNext}
                            type="button"
                        >
                            Siguiente <ChevronRight size={16} aria-hidden="true" />
                        </button>
                    ) : (
                        <button
                            className={`${styles.bottomBarBtn} ${styles.bottomBarBtnConfirm} ${!canAssign ? styles.bottomBarBtnDisabled : ''}`}
                            onClick={handleAssign}
                            disabled={!canAssign}
                            type="button"
                        >
                            {assigning ? 'Asignando…' : 'Confirmar'}
                        </button>
                    )}
                </div>
            </>
        );
    };

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <AdminLayout title="Programación">
            <main className={styles.page} id="main-content">

                <StatsBar
                    totalEmployees={employees.length}
                    todayCount={todayCount}
                    selectedCount={selectedEmployees.length}
                    totalCourses={courses.length}
                />

                {/* Tab bar */}
                <div className={styles.tabBar} role="tablist">
                    {[
                        { key: 'assignment', label: 'Asignación', Icon: LayoutGrid },
                        { key: 'monitoring', label: 'Monitoreo',  Icon: Activity },
                    ].map(({ key, label, Icon }) => (
                        <button
                            key={key}
                            role="tab"
                            aria-selected={activeTab === key}
                            className={`${styles.tab} ${activeTab === key ? styles.tabActive : ''}`}
                            onClick={() => { setActiveTab(key); setMobileStep(0); }}
                            type="button"
                        >
                            <Icon size={16} aria-hidden="true" />
                            {label}
                        </button>
                    ))}
                    <div className={styles.tabSpacer} />
                    <button
                        className={styles.btnOutline}
                        onClick={() => fetchData()}
                        disabled={loading}
                        type="button"
                        title="Actualizar datos"
                    >
                        <RefreshCw size={14} /> Actualizar
                    </button>
                </div>

                {/* Tab content */}
                {activeTab === 'assignment'
                    ? isMobile ? renderMobileAssignment() : renderDesktopAssignment()
                    : <MonitoringTable />
                }

            </main>

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
        </AdminLayout>
    );
}
