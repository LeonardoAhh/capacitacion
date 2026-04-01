'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    collection, getDocs, doc, getDoc,
    query, where, addDoc, serverTimestamp,
    orderBy, limit as fsLimit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast/Toast';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import {
    Search, X, Download, Users, BookOpen,
    CheckCircle2, AlertCircle, Loader2, ChevronDown,
    Trash2, Save, History, Clock,
} from 'lucide-react';
import styles from './page.module.css';

// ── Clave de borrador en localStorage ────────────────────────────────────────
const DRAFT_KEY = 'asistencia_draft_v1';

// ── Exportar a Excel (sesión activa) ─────────────────────────────────────────
async function exportToExcel(courseName, attendees) {
    const XLSX = await import('xlsx');
    const headers = ['ID Empleado', 'Nombre', 'Puesto', 'Área / Depto.', 'Curso', 'Fecha'];
    const date = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric',
    });
    const rows = attendees.map(a => [
        a.employeeId,
        a.name,
        a.occupation || '—',
        a.department || '—',
        courseName,
        date,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 24 }, { wch: 22 }, { wch: 38 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
    XLSX.writeFile(wb, `asistencia_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ── Exportar sesión histórica a Excel ────────────────────────────────────────
async function exportSessionToExcel(session) {
    const XLSX = await import('xlsx');
    const headers = ['ID Empleado', 'Nombre', 'Puesto', 'Área / Depto.', 'Curso', 'Fecha'];
    const rows = (session.attendees || []).map(a => [
        a.employeeId,
        a.name,
        a.occupation || '—',
        a.department || '—',
        session.courseName,
        session.date,
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 24 }, { wch: 22 }, { wch: 38 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
    const safeName = (session.courseName || 'sesion').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20);
    XLSX.writeFile(wb, `asistencia_${session.date}_${safeName}.xlsx`);
}

// ── Mapear documento de training_records a objeto empleado ───────────────────
function mapEmployee(data, fallbackId) {
    return {
        employeeId: data.employeeId || fallbackId,
        name:       data.name       || data.nombre   || '(sin nombre)',
        occupation: data.occupation || data.puesto   || data.position || '',
        department: data.department || data.area     || '',
    };
}

// ════════════════════════════════════════════════════════════════════════════
export default function AsistenciaPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    // ── Cursos ───────────────────────────────────────────────────────────────
    const [courses, setCourses]                 = useState([]);
    const [coursesLoading, setCoursesLoading]   = useState(true);
    const [selectedCourse, setSelectedCourse]   = useState(null);
    const [dropdownOpen, setDropdownOpen]       = useState(false);
    const [dropdownFocusIdx, setDropdownFocusIdx] = useState(-1);

    // ── Búsqueda ─────────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery]     = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchStatus, setSearchStatus]   = useState(null);
    // searchStatus: null | 'not_found' | 'duplicate' | 'added' | 'error'
    const [nameResults, setNameResults]     = useState([]);

    // ── Asistentes ───────────────────────────────────────────────────────────
    const [attendees, setAttendees] = useState([]);

    // ── Acciones ─────────────────────────────────────────────────────────────
    const [exporting, setExporting]         = useState(false);
    const [saving, setSaving]               = useState(false);
    const [savedSessionId, setSavedSessionId] = useState(null);

    // ── Historial ────────────────────────────────────────────────────────────
    const [showHistory, setShowHistory]       = useState(false);
    const [history, setHistory]               = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // ── Sesión ───────────────────────────────────────────────────────────────
    const [sessionStart] = useState(() => new Date());

    // ── Refs ─────────────────────────────────────────────────────────────────
    const searchInputRef  = useRef(null);
    const dropdownRef     = useRef(null);
    const dropdownListRef = useRef(null);
    const debounceRef     = useRef(null);
    const statusTimerRef  = useRef(null);
    const attendeesRef    = useRef(attendees);
    useEffect(() => { attendeesRef.current = attendees; }, [attendees]);

    // ── Cargar cursos + restaurar borrador ────────────────────────────────────
    useEffect(() => {
        async function loadCourses() {
            try {
                const snap = await getDocs(collection(db, 'courses'));
                const list = snap.docs
                    .map(d => ({ id: d.id, title: d.data().name || 'Sin título' }))
                    .sort((a, b) => a.title.localeCompare(b.title));
                setCourses(list);

                // Restaurar borrador guardado
                try {
                    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
                    if (draft?.attendees?.length > 0) {
                        setAttendees(draft.attendees);
                        if (draft.courseId) {
                            const restored = list.find(c => c.id === draft.courseId);
                            if (restored) setSelectedCourse(restored);
                        }
                    }
                } catch { /* localStorage no disponible */ }
            } catch (e) {
                console.error('Error cargando cursos:', e);
            } finally {
                setCoursesLoading(false);
            }
        }
        loadCourses();
    }, []);

    // ── Persistir borrador en localStorage ───────────────────────────────────
    useEffect(() => {
        try {
            if (attendees.length > 0) {
                localStorage.setItem(DRAFT_KEY, JSON.stringify({
                    attendees,
                    courseId:   selectedCourse?.id    || null,
                    courseName: selectedCourse?.title || null,
                }));
            } else {
                localStorage.removeItem(DRAFT_KEY);
            }
        } catch { /* localStorage no disponible */ }
    }, [attendees, selectedCourse]);

    // ── Focus solo en desktop (no abre teclado virtual en móvil) ─────────────
    useEffect(() => {
        if (typeof window !== 'undefined' &&
            window.matchMedia('(pointer: fine)').matches) {
            searchInputRef.current?.focus();
        }
    }, []);

    // ── Cerrar dropdown al click fuera ────────────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
                setDropdownFocusIdx(-1);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Auto-limpiar mensajes de estado tras 3 s ──────────────────────────────
    useEffect(() => {
        if (searchStatus === 'added' || searchStatus === 'not_found') {
            clearTimeout(statusTimerRef.current);
            statusTimerRef.current = setTimeout(() => setSearchStatus(null), 3000);
        }
        return () => clearTimeout(statusTimerRef.current);
    }, [searchStatus]);

    // ── Limpiar savedSessionId cuando cambia la lista ─────────────────────────
    useEffect(() => {
        if (savedSessionId) setSavedSessionId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attendees.length]);

    // ── Scroll del ítem enfocado en dropdown ──────────────────────────────────
    useEffect(() => {
        if (dropdownFocusIdx >= 0 && dropdownListRef.current) {
            const items = dropdownListRef.current.querySelectorAll('[role="option"]');
            items[dropdownFocusIdx]?.scrollIntoView({ block: 'nearest' });
        }
    }, [dropdownFocusIdx]);

    // ── Auto-búsqueda con debounce (600 ms) ──────────────────────────────────
    useEffect(() => {
        const raw = searchQuery.trim();

        if (!raw) {
            setSearchStatus(null);
            setSearchLoading(false);
            setNameResults([]);
            clearTimeout(debounceRef.current);
            return;
        }

        const isNumeric = /^\d+$/.test(raw);

        setSearchStatus(null);
        setNameResults([]);
        setSearchLoading(true);

        debounceRef.current = setTimeout(async () => {
            try {
                if (isNumeric) {
                    // ── Búsqueda por ID → auto-registra ──────────────────────
                    let employee = null;

                    const directSnap = await getDoc(doc(db, 'training_records', raw));
                    if (directSnap.exists()) {
                        employee = mapEmployee(directSnap.data(), raw);
                    } else {
                        const q = query(
                            collection(db, 'training_records'),
                            where('employeeId', '==', raw),
                        );
                        const snap = await getDocs(q);
                        if (!snap.empty) employee = mapEmployee(snap.docs[0].data(), raw);
                    }

                    if (!employee) { setSearchStatus('not_found'); return; }

                    if (attendeesRef.current.some(a => a.employeeId === employee.employeeId)) {
                        setSearchStatus('duplicate'); return;
                    }

                    setAttendees(prev => [...prev, employee]);
                    setSearchQuery('');
                    setSearchStatus('added');
                    searchInputRef.current?.focus();

                } else if (raw.length >= 3) {
                    // ── Búsqueda por nombre → muestra lista de selección ──────
                    const upper = raw.toUpperCase();
                    const q = query(
                        collection(db, 'training_records'),
                        where('name', '>=', upper),
                        where('name', '<=', upper + '\uf8ff'),
                        fsLimit(6),
                    );
                    const snap = await getDocs(q);
                    const results = snap.docs
                        .map(d => mapEmployee(d.data(), d.id))
                        .filter(e => !attendeesRef.current.some(a => a.employeeId === e.employeeId));
                    setNameResults(results);
                    if (results.length === 0) setSearchStatus('not_found');
                }
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

    // ── Agregar desde resultados de nombre ────────────────────────────────────
    const addFromNameResults = useCallback((employee) => {
        setAttendees(prev => [...prev, employee]);
        setNameResults([]);
        setSearchQuery('');
        setSearchStatus('added');
        searchInputRef.current?.focus();
    }, []);

    // ── Quitar asistente ──────────────────────────────────────────────────────
    const removeAttendee = useCallback((employeeId) => {
        setAttendees(prev => prev.filter(a => a.employeeId !== employeeId));
    }, []);

    // ── Exportar Excel ────────────────────────────────────────────────────────
    const handleExport = useCallback(async () => {
        if (!selectedCourse || attendees.length === 0) return;
        setExporting(true);
        try {
            await exportToExcel(selectedCourse.title, attendees);
        } catch (e) {
            console.error('Error exportando:', e);
            toast.error('Error', 'No se pudo generar el archivo Excel.');
        } finally {
            setExporting(false);
        }
    }, [selectedCourse, attendees, toast]);

    // ── Guardar sesión en Firestore ───────────────────────────────────────────
    const handleSaveSession = useCallback(async () => {
        if (!selectedCourse || attendees.length === 0) return;
        setSaving(true);
        try {
            const docRef = await addDoc(collection(db, 'attendance_sessions'), {
                courseId:      selectedCourse.id,
                courseName:    selectedCourse.title,
                attendees,
                attendeeCount: attendees.length,
                date:          new Date().toISOString().slice(0, 10),
                savedAt:       serverTimestamp(),
                savedBy:       user?.email || 'desconocido',
            });
            setSavedSessionId(docRef.id);
            localStorage.removeItem(DRAFT_KEY);
            toast.success('Sesión guardada', `${attendees.length} asistentes registrados correctamente.`);
        } catch (e) {
            console.error('Error guardando sesión:', e);
            toast.error('Error', 'No se pudo guardar la sesión.');
        } finally {
            setSaving(false);
        }
    }, [selectedCourse, attendees, user, toast]);

    // ── Cargar historial ──────────────────────────────────────────────────────
    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const q = query(
                collection(db, 'attendance_sessions'),
                orderBy('savedAt', 'desc'),
                fsLimit(10),
            );
            const snap = await getDocs(q);
            setHistory(snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                savedAt: d.data().savedAt?.toDate?.() || null,
            })));
        } catch (e) {
            console.error('Error cargando historial:', e);
            toast.error('Error', 'No se pudo cargar el historial.');
        } finally {
            setHistoryLoading(false);
        }
    }, [toast]);

    const toggleHistory = useCallback(() => {
        setShowHistory(v => {
            if (!v && history.length === 0) loadHistory();
            return !v;
        });
    }, [history.length, loadHistory]);

    // ── Navegación por teclado en el dropdown ─────────────────────────────────
    const handleDropdownKeyDown = useCallback((e) => {
        if (!dropdownOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                setDropdownOpen(true);
                setDropdownFocusIdx(0);
            }
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setDropdownFocusIdx(i => Math.min(i + 1, courses.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setDropdownFocusIdx(i => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (dropdownFocusIdx >= 0 && courses[dropdownFocusIdx]) {
                    setSelectedCourse(courses[dropdownFocusIdx]);
                    setDropdownOpen(false);
                    setDropdownFocusIdx(-1);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setDropdownOpen(false);
                setDropdownFocusIdx(-1);
                break;
            default:
                break;
        }
    }, [dropdownOpen, courses, dropdownFocusIdx]);

    // ── Valores derivados ─────────────────────────────────────────────────────
    const canExport  = selectedCourse && attendees.length > 0;
    const canSave    = canExport && !savedSessionId;

    const sessionDuration = (() => {
        const mins = Math.floor((Date.now() - sessionStart.getTime()) / 60000);
        return mins < 1 ? 'menos de 1 min' : `${mins} min`;
    })();

    // ════════════════════════════════════════════════════════════════════════
    return (
        <AdminLayout title="Asistencia">
            <div className={styles.page}>
                <div className={styles.workspace}>

                    {/* ── Panel izquierdo ─────────────────────────────────── */}
                    <div className={styles.leftPanel}>

                        {/* Selector de curso */}
                        <section className={styles.card}>
                            <div className={styles.cardHeader}>
                                <BookOpen size={16} className={styles.cardIcon} aria-hidden="true" />
                                <h2 className={styles.cardTitle}>Curso en sesión</h2>
                            </div>

                            <div className={styles.dropdownWrap} ref={dropdownRef}>
                                <button
                                    id="btn-select-course"
                                    className={`${styles.dropdownTrigger} ${dropdownOpen ? styles.dropdownTriggerOpen : ''}`}
                                    onClick={() => { setDropdownOpen(v => !v); setDropdownFocusIdx(0); }}
                                    onKeyDown={handleDropdownKeyDown}
                                    aria-haspopup="listbox"
                                    aria-expanded={dropdownOpen}
                                    aria-controls="course-listbox"
                                    aria-activedescendant={dropdownFocusIdx >= 0 ? `course-opt-${dropdownFocusIdx}` : undefined}
                                    disabled={coursesLoading}
                                >
                                    <span className={selectedCourse ? styles.dropdownValueSelected : styles.dropdownPlaceholder}>
                                        {coursesLoading
                                            ? 'Cargando cursos...'
                                            : selectedCourse?.title || 'Selecciona un curso...'}
                                    </span>
                                    <ChevronDown
                                        size={16}
                                        className={`${styles.dropdownChevron} ${dropdownOpen ? styles.chevronOpen : ''}`}
                                        aria-hidden="true"
                                    />
                                </button>

                                {dropdownOpen && (
                                    <ul
                                        id="course-listbox"
                                        ref={dropdownListRef}
                                        className={styles.dropdownList}
                                        role="listbox"
                                        aria-label="Lista de cursos"
                                    >
                                        {courses.map((c, idx) => (
                                            <li
                                                key={c.id}
                                                id={`course-opt-${idx}`}
                                                role="option"
                                                aria-selected={selectedCourse?.id === c.id}
                                                className={[
                                                    styles.dropdownItem,
                                                    selectedCourse?.id === c.id ? styles.dropdownItemActive : '',
                                                    dropdownFocusIdx === idx   ? styles.dropdownItemFocused : '',
                                                ].join(' ')}
                                                onClick={() => {
                                                    setSelectedCourse(c);
                                                    setDropdownOpen(false);
                                                    setDropdownFocusIdx(-1);
                                                }}
                                            >
                                                {c.title}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </section>

                        {/* Registro de empleados */}
                        <section className={styles.card}>
                            <div className={styles.cardHeader}>
                                <Search size={16} className={styles.cardIcon} aria-hidden="true" />
                                <h2 className={styles.cardTitle}>Registrar empleado</h2>
                            </div>

                            <p className={styles.cardHint}>
                                Escribe el <strong>ID numérico</strong> para registrar automáticamente,
                                o un <strong>nombre</strong> (mín. 3 letras) para buscar.
                            </p>

                            <div className={styles.searchInputWrap}>
                                <label htmlFor="input-employee-search" className={styles.srOnly}>
                                    Buscar empleado por ID o nombre
                                </label>
                                {searchLoading
                                    ? <Loader2 size={15} className={`${styles.searchIcon} ${styles.spin}`} aria-hidden="true" />
                                    : <Search size={15} className={styles.searchIcon} aria-hidden="true" />
                                }
                                <input
                                    ref={searchInputRef}
                                    id="input-employee-search"
                                    className={styles.searchInput}
                                    type="text"
                                    inputMode="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="ID o nombre del empleado..."
                                    autoComplete="off"
                                />
                                {searchQuery && (
                                    <button
                                        className={styles.searchClear}
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSearchStatus(null);
                                            setNameResults([]);
                                            searchInputRef.current?.focus();
                                        }}
                                        aria-label="Limpiar búsqueda"
                                        type="button"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Resultados de búsqueda por nombre */}
                            {nameResults.length > 0 && (
                                <ul
                                    className={styles.nameResultsList}
                                    role="list"
                                    aria-label="Empleados encontrados"
                                >
                                    {nameResults.map(emp => (
                                        <li key={emp.employeeId} className={styles.nameResultItem}>
                                            <div className={styles.nameResultInfo}>
                                                <span className={styles.nameResultName}>{emp.name}</span>
                                                <span className={styles.nameResultMeta}>
                                                    {emp.employeeId}
                                                    {emp.department ? ` · ${emp.department}` : ''}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className={styles.nameResultAddBtn}
                                                onClick={() => addFromNameResults(emp)}
                                                aria-label={`Agregar a ${emp.name}`}
                                            >
                                                + Agregar
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Mensajes de estado */}
                            {searchStatus === 'not_found' && (
                                <div className={styles.alertWarn} role="alert">
                                    <AlertCircle size={15} aria-hidden="true" />
                                    <span>No se encontró <strong>{searchQuery || 'ese empleado'}</strong> en la base de datos.</span>
                                </div>
                            )}
                            {searchStatus === 'duplicate' && (
                                <div className={styles.alertWarn} role="alert">
                                    <AlertCircle size={15} aria-hidden="true" />
                                    <span>Este empleado ya está registrado en la lista.</span>
                                </div>
                            )}
                            {searchStatus === 'error' && (
                                <div className={styles.alertWarn} role="alert">
                                    <AlertCircle size={15} aria-hidden="true" />
                                    <span>Error al conectar con la base de datos.</span>
                                </div>
                            )}
                            {searchStatus === 'added' && (
                                <div className={styles.alertSuccess} role="status" aria-live="polite">
                                    <CheckCircle2 size={15} aria-hidden="true" />
                                    <span>Empleado agregado correctamente.</span>
                                </div>
                            )}
                        </section>

                        {/* Información de sesión */}
                        {attendees.length > 0 && (
                            <div className={styles.sessionInfo}>
                                <Clock size={13} aria-hidden="true" />
                                <span>Sesión activa · {sessionDuration}</span>
                                {savedSessionId && (
                                    <span className={styles.sessionSavedBadge}>
                                        <CheckCircle2 size={11} aria-hidden="true" />
                                        Guardada
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ── Panel derecho ────────────────────────────────────── */}
                    <div className={styles.rightPanel}>

                        {/* Tabla de asistentes */}
                        <section className={styles.card}>
                            <div className={styles.cardHeader}>
                                <Users size={16} className={styles.cardIcon} aria-hidden="true" />
                                <h2 className={styles.cardTitle}>Asistentes registrados</h2>
                                <span
                                    className={styles.attendeeCount}
                                    aria-label={`${attendees.length} asistentes`}
                                >
                                    {attendees.length}
                                </span>

                                <div className={styles.headerActions}>
                                    <button
                                        className={`${styles.actionBtn} ${styles.saveBtnStyle} ${!canSave ? styles.actionBtnDisabled : ''}`}
                                        onClick={handleSaveSession}
                                        disabled={!canSave || saving}
                                        aria-label="Guardar sesión en base de datos"
                                        title={savedSessionId ? 'Sesión ya guardada' : !canExport ? 'Selecciona un curso y agrega empleados' : 'Guardar sesión en Firestore'}
                                    >
                                        {saving
                                            ? <Loader2 size={13} className={styles.spin} aria-hidden="true" />
                                            : <Save size={13} aria-hidden="true" />
                                        }
                                        <span>Guardar</span>
                                    </button>

                                    <button
                                        className={`${styles.actionBtn} ${styles.exportBtnStyle} ${!canExport ? styles.actionBtnDisabled : ''}`}
                                        onClick={handleExport}
                                        disabled={!canExport || exporting}
                                        aria-label="Exportar lista de asistencia a Excel"
                                        title={!canExport ? 'Selecciona un curso y agrega al menos un empleado' : 'Descargar reporte Excel'}
                                    >
                                        {exporting
                                            ? <Loader2 size={13} className={styles.spin} aria-hidden="true" />
                                            : <Download size={13} aria-hidden="true" />
                                        }
                                        <span>Excel</span>
                                    </button>
                                </div>
                            </div>

                            {attendees.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <Users size={36} className={styles.emptyIcon} aria-hidden="true" />
                                    <p className={styles.emptyTitle}>Sin registros aún</p>
                                    <p className={styles.emptyBody}>
                                        Busca un ID o nombre de empleado en el panel izquierdo.
                                    </p>
                                </div>
                            ) : (
                                <div
                                    className={styles.attendeesList}
                                    role="table"
                                    aria-label="Lista de asistentes registrados"
                                >
                                    <div className={styles.tableHead} role="row">
                                        <span className={styles.colId}   role="columnheader">ID</span>
                                        <span className={styles.colName} role="columnheader">Nombre</span>
                                        <span className={styles.colOcc}  role="columnheader">Puesto</span>
                                        <span className={styles.colDept} role="columnheader">Área</span>
                                        <span className={styles.colAction} role="columnheader" aria-label="Acciones" />
                                    </div>

                                    {attendees.map((emp, idx) => (
                                        <div
                                            key={emp.employeeId}
                                            className={`${styles.attendeeRow} ${idx % 2 === 0 ? styles.rowEven : ''}`}
                                            role="row"
                                        >
                                            <span className={`${styles.colId} ${styles.idBadge}`} role="cell">
                                                {emp.employeeId}
                                            </span>
                                            <span className={styles.colName} role="cell">{emp.name}</span>
                                            <span className={styles.colOcc}  role="cell">{emp.occupation || '—'}</span>
                                            <span className={styles.colDept} role="cell">{emp.department || '—'}</span>
                                            <button
                                                className={styles.removeBtn}
                                                onClick={() => removeAttendee(emp.employeeId)}
                                                aria-label={`Quitar a ${emp.name} de la lista`}
                                                type="button"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Historial de sesiones */}
                        <div className={styles.historySection}>
                            <button
                                type="button"
                                className={styles.historyToggle}
                                onClick={toggleHistory}
                                aria-expanded={showHistory}
                                aria-controls="history-panel"
                            >
                                <History size={14} aria-hidden="true" />
                                <span>Historial de sesiones</span>
                                <ChevronDown
                                    size={14}
                                    className={`${styles.dropdownChevron} ${showHistory ? styles.chevronOpen : ''}`}
                                    aria-hidden="true"
                                />
                            </button>

                            {showHistory && (
                                <div id="history-panel" className={styles.historyBody}>
                                    {historyLoading ? (
                                        <div className={styles.historyLoading}>
                                            <Loader2 size={16} className={styles.spin} aria-hidden="true" />
                                            <span>Cargando historial...</span>
                                        </div>
                                    ) : history.length === 0 ? (
                                        <p className={styles.historyEmpty}>No hay sesiones guardadas aún.</p>
                                    ) : (
                                        <ul className={styles.historyList} role="list">
                                            {history.map(session => (
                                                <li key={session.id} className={styles.historyItem}>
                                                    <div className={styles.historyItemInfo}>
                                                        <span className={styles.historyItemCourse}>
                                                            {session.courseName}
                                                        </span>
                                                        <span className={styles.historyItemMeta}>
                                                            {session.date}
                                                            {' · '}
                                                            <strong>{session.attendeeCount}</strong> asistentes
                                                            {session.savedBy ? ` · ${session.savedBy}` : ''}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={styles.historyDownloadBtn}
                                                        onClick={() => exportSessionToExcel(session)}
                                                        aria-label={`Descargar Excel de la sesión ${session.courseName} del ${session.date}`}
                                                        title="Descargar Excel"
                                                    >
                                                        <Download size={13} />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>{/* /rightPanel */}
                </div>{/* /workspace */}
            </div>{/* /page */}
        </AdminLayout>
    );
}
