'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import {
    Search, X, Download, Users, BookOpen,
    CheckCircle2, AlertCircle, Loader2, ChevronDown, Trash2
} from 'lucide-react';
import styles from './page.module.css';

// ── Exportar a Excel ──────────────────────────────────────────────────────────
async function exportToExcel(courseName, attendees) {
    const XLSX = await import('xlsx');

    const headers = ['ID Empleado', 'Nombre', 'Puesto', 'Curso', 'Fecha de Asistencia'];
    const date = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const rows = attendees.map(a => [
        a.employeeId,
        a.name,
        a.occupation || '—',
        courseName,
        date,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Ancho de columnas
    ws['!cols'] = [
        { wch: 14 }, { wch: 30 }, { wch: 28 }, { wch: 40 }, { wch: 20 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');

    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `asistencia_${timestamp}.xlsx`);
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AsistenciaPage() {
    // ── Cursos ───────────────────────────────────────────────────────────────
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);

    // ── Búsqueda automática de empleados ────────────────────────────────────
    const [searchQuery, setSearchQuery]   = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchStatus, setSearchStatus] = useState(null);
    // searchStatus: null | 'not_found' | 'duplicate' | 'added'

    // ── Lista de asistentes ───────────────────────────────────────────────────
    const [attendees, setAttendees] = useState([]);

    // ── Exportar ──────────────────────────────────────────────────────────────
    const [exporting, setExporting] = useState(false);

    const searchInputRef = useRef(null);
    const dropdownRef    = useRef(null);
    const debounceRef    = useRef(null);
    // Ref para leer la lista actual sin re-crear el efecto
    const attendeesRef   = useRef(attendees);
    useEffect(() => { attendeesRef.current = attendees; }, [attendees]);

    // ── Cargar cursos ─────────────────────────────────────────────────────────
    useEffect(() => {
        async function loadCourses() {
            try {
                const snap = await getDocs(collection(db, 'courses'));
                const list = snap.docs.map(d => ({
                    id: d.id,
                    title: d.data().name || 'Sin título',
                })).sort((a, b) => a.title.localeCompare(b.title));
                setCourses(list);
            } catch (e) {
                console.error('Error cargando cursos:', e);
            } finally {
                setCoursesLoading(false);
            }
        }
        loadCourses();
    }, []);

    // ── Cerrar dropdown al hacer clic fuera ───────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setCourseDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Auto-registro con debounce (600 ms) ──────────────────────────────────
    useEffect(() => {
        const id = searchQuery.trim();

        // Limpiar estado cuando el input se vacía
        if (!id) {
            setSearchStatus(null);
            setSearchLoading(false);
            clearTimeout(debounceRef.current);
            return;
        }

        setSearchStatus(null);
        setSearchLoading(true);

        debounceRef.current = setTimeout(async () => {
            try {
                let employee = null;

                // Intento 1: doc directo
                const directSnap = await getDoc(doc(db, 'training_records', id));
                if (directSnap.exists()) {
                    const d = directSnap.data();
                    employee = {
                        employeeId: d.employeeId || id,
                        name:       d.name       || d.nombre   || '(sin nombre)',
                        occupation: d.occupation  || d.puesto   || d.position || '',
                    };
                } else {
                    // Intento 2: query por campo employeeId
                    const q = query(
                        collection(db, 'training_records'),
                        where('employeeId', '==', id)
                    );
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const d = snap.docs[0].data();
                        employee = {
                            employeeId: d.employeeId || id,
                            name:       d.name       || d.nombre   || '(sin nombre)',
                            occupation: d.occupation  || d.puesto   || d.position || '',
                        };
                    }
                }

                if (!employee) {
                    setSearchStatus('not_found');
                    return;
                }

                // Verificar duplicado
                const isDuplicate = attendeesRef.current.some(
                    a => a.employeeId === employee.employeeId
                );

                if (isDuplicate) {
                    setSearchStatus('duplicate');
                    return;
                }

                // Agregar automáticamente
                setAttendees(prev => [...prev, employee]);
                setSearchQuery('');
                setSearchStatus('added');
                searchInputRef.current?.focus();

            } catch (e) {
                console.error('Error buscando empleado:', e);
                setSearchStatus('error');
            } finally {
                setSearchLoading(false);
            }
        }, 600);

        return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    // ── Quitar empleado ───────────────────────────────────────────────────────
    const removeAttendee = (employeeId) => {
        setAttendees(prev => prev.filter(a => a.employeeId !== employeeId));
    };

    // ── Exportar Excel ────────────────────────────────────────────────────────
    const handleExport = async () => {
        if (!selectedCourse || attendees.length === 0) return;
        setExporting(true);
        try {
            await exportToExcel(selectedCourse.title, attendees);
        } catch (e) {
            console.error('Error exportando:', e);
        } finally {
            setExporting(false);
        }
    };

    const canExport = selectedCourse && attendees.length > 0;

    return (
        <AdminLayout title="Asistencia">
        <div className={styles.page}>
            <div className={styles.workspace}>
                {/* ── Panel izquierdo ── */}
                <div className={styles.leftPanel}>

                    {/* Selector de curso */}
                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <BookOpen size={16} className={styles.cardIcon} />
                            <h2 className={styles.cardTitle}>Curso en sesión</h2>
                        </div>

                        <div className={styles.dropdownWrap} ref={dropdownRef}>
                            <button
                                id="btn-select-course"
                                className={`${styles.dropdownTrigger} ${courseDropdownOpen ? styles.dropdownTriggerOpen : ''}`}
                                onClick={() => setCourseDropdownOpen(v => !v)}
                                aria-haspopup="listbox"
                                aria-expanded={courseDropdownOpen}
                                disabled={coursesLoading}
                            >
                                <span className={selectedCourse ? styles.dropdownValueSelected : styles.dropdownPlaceholder}>
                                    {coursesLoading
                                        ? 'Cargando cursos...'
                                        : selectedCourse?.title || 'Selecciona un curso...'}
                                </span>
                                <ChevronDown size={16} className={`${styles.dropdownChevron} ${courseDropdownOpen ? styles.chevronOpen : ''}`} />
                            </button>

                            {courseDropdownOpen && (
                                <ul className={styles.dropdownList} role="listbox">
                                    {courses.map(c => (
                                        <li
                                            key={c.id}
                                            role="option"
                                            aria-selected={selectedCourse?.id === c.id}
                                            className={`${styles.dropdownItem} ${selectedCourse?.id === c.id ? styles.dropdownItemActive : ''}`}
                                            onClick={() => {
                                                setSelectedCourse(c);
                                                setCourseDropdownOpen(false);
                                            }}
                                        >
                                            {c.title}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </section>

                    {/* Auto-registro de empleados */}
                    <section className={styles.card}>
                        <div className={styles.cardHeader}>
                            <Search size={16} className={styles.cardIcon} />
                            <h2 className={styles.cardTitle}>Registrar empleado</h2>
                        </div>

                        <div className={styles.searchInputWrap}>
                            {searchLoading
                                ? <Loader2 size={15} className={`${styles.searchIcon} ${styles.spin}`} />
                                : <Search size={15} className={styles.searchIcon} />
                            }
                            <input
                                ref={searchInputRef}
                                id="input-employee-id"
                                className={styles.searchInput}
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Escribe el ID del empleado..."
                                autoComplete="off"
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    className={styles.searchClear}
                                    onClick={() => {
                                        setSearchQuery('');
                                        setSearchStatus(null);
                                        searchInputRef.current?.focus();
                                    }}
                                    aria-label="Limpiar"
                                    type="button"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Mensajes de estado */}
                        {searchStatus === 'not_found' && (
                            <div className={styles.alertWarn} role="alert">
                                <AlertCircle size={15} />
                                <span>No se encontró el ID <strong>{searchQuery}</strong> en la base de datos.</span>
                            </div>
                        )}
                        {searchStatus === 'duplicate' && (
                            <div className={styles.alertWarn} role="alert">
                                <AlertCircle size={15} />
                                <span>Este empleado ya está registrado en la lista.</span>
                            </div>
                        )}
                        {searchStatus === 'error' && (
                            <div className={styles.alertWarn} role="alert">
                                <AlertCircle size={15} />
                                <span>Error al conectar con la base de datos.</span>
                            </div>
                        )}
                        {searchStatus === 'added' && (
                            <div className={styles.alertSuccess} role="status">
                                <CheckCircle2 size={15} />
                                <span>Empleado agregado correctamente.</span>
                            </div>
                        )}
                    </section>
                </div>

                {/* ── Panel derecho: Lista de asistentes ── */}
                <section className={`${styles.card} ${styles.attendeesPanel}`}>
                    <div className={styles.cardHeader}>
                        <Users size={16} className={styles.cardIcon} />
                        <h2 className={styles.cardTitle}>Asistentes registrados</h2>
                        <span className={styles.attendeeCount}>{attendees.length}</span>
                        <button
                            id="btn-export-asistencia"
                            className={`${styles.exportBtn} ${!canExport ? styles.exportBtnDisabled : ''}`}
                            onClick={handleExport}
                            disabled={!canExport || exporting}
                            title={!canExport ? 'Selecciona un curso y agrega al menos un empleado' : 'Descargar reporte Excel'}
                        >
                            {exporting
                                ? <Loader2 size={15} className={styles.spin} />
                                : <Download size={15} />
                            }
                        </button>
                    </div>

                    {attendees.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Users size={36} className={styles.emptyIcon} />
                            <p className={styles.emptyTitle}>Sin registros aún</p>
                            <p className={styles.emptyBody}>
                                Busca un ID de empleado en el panel izquierdo y agrégalo a la lista.
                            </p>
                        </div>
                    ) : (
                        <div className={styles.attendeesList}>
                            {/* Encabezado de tabla */}
                            <div className={styles.tableHead}>
                                <span className={styles.colId}>ID</span>
                                <span className={styles.colName}>Nombre</span>
                                <span className={styles.colOcc}>Puesto</span>
                                <span className={styles.colAction} aria-hidden="true" />
                            </div>

                            {attendees.map((emp, idx) => (
                                <div
                                    key={emp.employeeId}
                                    className={`${styles.attendeeRow} ${idx % 2 === 0 ? styles.rowEven : ''}`}
                                >
                                    <span className={`${styles.colId} ${styles.idBadge}`}>{emp.employeeId}</span>
                                    <span className={styles.colName}>{emp.name}</span>
                                    <span className={styles.colOcc}>{emp.occupation || '—'}</span>
                                    <button
                                        className={styles.removeBtn}
                                        onClick={() => removeAttendee(emp.employeeId)}
                                        aria-label={`Quitar a ${emp.name}`}
                                        type="button"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
        </AdminLayout>
    );
}
