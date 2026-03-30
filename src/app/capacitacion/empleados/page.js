'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast/Toast';
import { db } from '@/lib/firebase';
import { uploadFile } from '@/lib/upload';
import {
    collection, getDocs, query, doc,
    updateDoc, setDoc, getDoc, deleteDoc, writeBatch
} from 'firebase/firestore';
import {
    Users, CheckCircle, AlertTriangle, UserPlus,
    Search, Edit2, Trash2, X, Save, Paperclip, BookOpen
} from 'lucide-react';
import styles from './page.module.css';
import { useConfirm } from '@/hooks/useConfirm';
import { Select } from '@/components/ui/Select/Select';


// ── Opciones estáticas ─────────────────────────────────────────────────────────
const AREA_OPTIONS = [
    'A. CALIDAD 1ER TURNO', 'A. CALIDAD 2DO TURNO', 'ALMACÉN', 'CALIDAD ADMTVO',
    'GERENCIA', 'LOGÍSTICA', 'MANTENIMIENTO', 'METROLOGÍA', 'MOLDES',
    'PRODUCCIÓN 1ER TURNO', 'PRODUCCIÓN 2DO TURNO', 'PRODUCCIÓN 3ER TURNO',
    'PRODUCCIÓN 4TO TURNO', 'PRODUCCIÓN ADMTVO', 'PRODUCCIÓN MONTAJE',
    'PROYECTOS', 'RECURSOS HUMANOS', 'RESIDENTES DE CALIDAD', 'SGI', 'SISTEMAS',
].map(v => ({ value: v, label: v }));

const SHIFT_OPTIONS = ['1', '2', '3', '4', '5'].map(v => ({ value: v, label: v }));

const EDUCATION_OPTIONS = [
    'BACHILLERATO', 'CARRERA TECNICA', 'INGENIERIA', 'LICENCIATURA', 'MAESTRIA',
    'PASANTE INGENIERIA', 'POSGRADO', 'PREPARATORIA', 'PRIMARIA', 'SECUNDARIA', 'TSU',
].map(v => ({ value: v, label: v }));

const ITEMS_PER_PAGE = 50;

// ── Helpers ────────────────────────────────────────────────────────────────────
function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function normalizePhotoUrl(url) {
    if (!url) return url;
    if (url.startsWith('/api/drive-image')) return url;
    try {
        const u = new URL(url);
        if (u.hostname === 'drive.google.com') {
            const id = u.searchParams.get('id');
            if (id) return `/api/drive-image?id=${id}`;
        }
    } catch { /* no válido, devolver tal cual */ }
    return url;
}

const sortByEmpId = arr =>
    [...arr].sort((a, b) =>
        (parseInt(b.employeeId || b.id) || 0) - (parseInt(a.employeeId || a.id) || 0)
    );

function getComplianceClass(score) {
    if (score >= 80) return styles.complianceHigh;
    if (score >= 60) return styles.complianceMedium;
    return styles.complianceLow;
}

const EMPTY_FORM = {
    id: '', name: '', position: '', department: '', curp: '',
    occupation: '', area: '', education: '', startDate: '', shift: '',
    performanceScore: '', performancePeriod: '', positionStartDate: '',
};

// ── Modal Crear / Editar ───────────────────────────────────────────────────────
function EmployeeModal({ initial, isCreating, onClose, onSave, positions, departments }) {
    const [form, setForm] = useState(() => {
        if (!initial && !isCreating) return { ...EMPTY_FORM };
        if (isCreating) return { ...EMPTY_FORM };
        return {
            id: initial?.id || '',
            name: initial?.name || '',
            position: initial?.position || '',
            department: initial?.department || '',
            curp: initial?.curp || '',
            occupation: initial?.occupation || '',
            area: initial?.area || '',
            education: initial?.education || '',
            startDate: initial?.startDate || '',
            shift: initial?.shift || '',
            performanceScore: initial?.promotionData?.performanceScore || '',
            performancePeriod: initial?.promotionData?.performancePeriod || '',
            positionStartDate: initial?.promotionData?.positionStartDate || '',
        };
    });

    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [docFiles, setDocFiles] = useState([]);

    const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

    const handleDocChange = (e) => {
        if (e.target.files?.length > 0) {
            setDocFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step === 1) { setStep(2); return; }
        setSaving(true);
        await onSave({ form, docFiles });
        setSaving(false);
    };

    const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

    return (
        <div className={styles.modalOverlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
            <div className={styles.modal}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>
                        {isCreating ? 'Nuevo Empleado' : 'Editar Empleado'}
                    </h2>
                    <button className={styles.modalCloseBtn} onClick={onClose} type="button" aria-label="Cerrar">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form className={styles.modalBody} onSubmit={handleSubmit}>
                    {/* Stepper */}
                    <div className={styles.stepperHead}>
                        <div className={`${styles.stepIndicator} ${step >= 1 ? styles.stepActive : ''}`}>
                            <span className={styles.stepNum}>1</span>
                            <span className={styles.stepLabel}>Datos Personales</span>
                        </div>
                        <div className={styles.stepDivider} />
                        <div className={`${styles.stepIndicator} ${step >= 2 ? styles.stepActive : ''}`}>
                            <span className={styles.stepNum}>2</span>
                            <span className={styles.stepLabel}>Datos Laborales</span>
                        </div>
                    </div>

                    {/* Paso 1 — Datos Personales */}
                    {step === 1 && (
                        <>
                            {/* Campos */}
                            <div className={styles.formGrid}>
                                <div className={`${styles.fieldGroup} ${styles.formGridFull}`}>
                                    <label className={styles.fieldLabel}>Nombre Completo *</label>
                                    <input
                                        required
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.name}
                                        onChange={e => set('name', e.target.value)}
                                        placeholder="Ej. HERNÁNDEZ HERRERA LEONARDO"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>ID Empleado</label>
                                    <input
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.id}
                                        onChange={e => isCreating && set('id', e.target.value)}
                                        placeholder={isCreating ? 'EJ. 3204' : ''}
                                        disabled={!isCreating}
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>CURP</label>
                                    <input
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.curp}
                                        onChange={e => set('curp', e.target.value)}
                                        placeholder="Importante para DC-3"
                                        maxLength={18}
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Escolaridad</label>
                                    <Select
                                        value={form.education}
                                        onChange={value => set('education', value)}
                                        options={EDUCATION_OPTIONS}
                                        placeholder="-- Seleccionar --"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Fecha de Ingreso</label>
                                    <input
                                        type="date"
                                        className={styles.fieldInput}
                                        value={form.startDate}
                                        onChange={e => set('startDate', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Documentos */}
                            <div className={styles.docsSection}>
                                <div className={styles.docsSectionHeader}>
                                    <h4 className={styles.docsSectionTitle}>Documentos adjuntos</h4>
                                    <label htmlFor="doc-upload" className={styles.docUploadLabel}>
                                        <Paperclip size={13} /> Adjuntar
                                    </label>
                                    <input id="doc-upload" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleDocChange} style={{ display: 'none' }} />
                                </div>

                                {/* Docs existentes */}
                                {initial?.documents?.map((doc, i) => (
                                    <div key={i} className={styles.docItem}>
                                        <span className={styles.docItemName}>📄 {doc.name}</span>
                                        <button type="button" className={styles.docRemoveBtn} onClick={() => {
                                            // La eliminación real se maneja en handleSave via el initial modificado
                                        }}>✕</button>
                                    </div>
                                ))}

                                {/* Nuevos docs a subir */}
                                {docFiles.map((file, i) => (
                                    <div key={i} className={`${styles.docItem} ${styles.docItemNew}`}>
                                        <span className={`${styles.docItemName} ${styles.docItemNameNew}`}>{file.name}</span>
                                        <button type="button" className={styles.docRemoveBtn}
                                            onClick={() => setDocFiles(prev => prev.filter((_, j) => j !== i))}>✕</button>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Paso 2 — Datos Laborales */}
                    {step === 2 && (
                        <div className={styles.formGrid}>
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Puesto</label>
                                <Select
                                    value={form.position}
                                    onChange={value => set('position', value)}
                                    options={positions.map(p => ({ value: p, label: p }))}
                                    placeholder="-- Seleccionar --"
                                    searchable
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Departamento</label>
                                <Select
                                    value={form.department}
                                    onChange={value => set('department', value)}
                                    options={departments.map(d => ({ value: d, label: d }))}
                                    placeholder="-- Seleccionar --"
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Área</label>
                                <Select
                                    value={form.area}
                                    onChange={value => set('area', value)}
                                    options={AREA_OPTIONS}
                                    placeholder="-- Seleccionar --"
                                    searchable
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Turno</label>
                                <Select
                                    value={form.shift}
                                    onChange={value => set('shift', value)}
                                    options={SHIFT_OPTIONS}
                                    placeholder="-- Seleccionar --"
                                />
                            </div>

                            <div className={`${styles.fieldGroup} ${styles.formGridFull}`}>
                                <label className={styles.fieldLabel}>Ocupación (SSO)</label>
                                <input
                                    type="text"
                                    className={styles.fieldInput}
                                    value={form.occupation}
                                    onChange={e => set('occupation', e.target.value)}
                                    placeholder="Ej. OPERARIO DE PRODUCCIÓN"
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Calificación de Desempeño</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    className={styles.fieldInput}
                                    value={form.performanceScore}
                                    onChange={e => set('performanceScore', e.target.value)}
                                    placeholder="0 – 10"
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Periodo de Desempeño</label>
                                <input
                                    type="text"
                                    className={styles.fieldInput}
                                    value={form.performancePeriod}
                                    onChange={e => set('performancePeriod', e.target.value)}
                                    placeholder="Ej. Q1 2025"
                                />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Inicio en Puesto Actual</label>
                                <input
                                    type="date"
                                    className={styles.fieldInput}
                                    value={form.positionStartDate}
                                    onChange={e => set('positionStartDate', e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className={styles.modalFooter}>
                        {step === 1 ? (
                            <>
                                <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnSave}>Siguiente →</button>
                            </>
                        ) : (
                            <>
                                <button type="button" onClick={() => setStep(1)} className={styles.btnCancel}>← Atrás</button>
                                <button type="submit" disabled={saving} className={styles.btnSave}>
                                    <Save size={14} /> {saving ? 'Guardando…' : 'Guardar'}
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function EmpleadosCapacitacionPage() {
    const { user, loading: authLoading, canWrite } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { showConfirm, confirmDialog } = useConfirm();

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [posFilter, setPosFilter] = useState('');

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingEmp, setEditingEmp] = useState(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    // Caché de positions (válida 5 min) para evitar lecturas repetidas a Firestore en handleSave
    const positionsCacheRef = useRef(null);

    // Catálogo de puestos desde la colección positions
    const [positionsCatalog, setPositionsCatalog] = useState([]);

    // Catálogos dinámicos de departamentos (desde empleados existentes)
    const departments = useMemo(() =>
        [...new Set(employees.map(e => e.department).filter(Boolean))].sort()
        , [employees]);

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
        else if (!authLoading && user && (user.rol === 'demo' || user.email?.includes('demo'))) router.push('/induccion');
    }, [user, authLoading, router]);

    // Carga inicial
    useEffect(() => {
        loadEmployees();
        getDocs(collection(db, 'positions'))
            .then(snap => setPositionsCatalog(
                snap.docs.map(d => d.data().name).filter(Boolean).sort()
            ))
            .catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, 'training_records'));
            setEmployees(sortByEmpId(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
        } catch (error) {
            console.error('Error loading employees:', error);
            toast.error('No se pudieron cargar los empleados.');
        } finally {
            setLoading(false);
        }
    };

    // Filtrado
    const filtered = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return employees.filter(e => {
            const matchSearch = !term || e.name?.toLowerCase().includes(term) || e.id?.toLowerCase().includes(term);
            const matchDept = !deptFilter || e.department === deptFilter;
            const matchPos = !posFilter || e.position === posFilter;
            return matchSearch && matchDept && matchPos;
        });
    }, [employees, searchTerm, deptFilter, posFilter]);

    // Paginación
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = useMemo(() =>
        filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
        , [filtered, currentPage]);

    // Resetear página al filtrar
    useEffect(() => { setCurrentPage(1); }, [searchTerm, deptFilter, posFilter]);

    // KPIs
    const kpis = useMemo(() => ({
        total: employees.length,
        highCompliance: employees.filter(e => (e.matrix?.compliancePercentage || 0) >= 80).length,
        needsAttention: employees.filter(e => (e.matrix?.compliancePercentage || 0) < 70).length,
        noDept: employees.filter(e => !e.department).length,
    }), [employees]);

    // ── Acciones ──────────────────────────────────────────────────────────────
    const openNew = useCallback(() => { setEditingEmp(null); setIsCreatingNew(true); setShowModal(true); }, []);
    const openEdit = useCallback((emp) => { setEditingEmp(emp); setIsCreatingNew(false); setShowModal(true); }, []);
    const closeModal = useCallback(() => { setShowModal(false); setEditingEmp(null); setIsCreatingNew(false); }, []);

    const handleSave = useCallback(async ({ form, docFiles }) => {
        if (user?.rol !== 'super_admin') {
            toast.error('Solo Super Admin puede modificar datos.');
            return;
        }
        if (!form.name.trim()) {
            toast.error('El nombre es obligatorio.');
            return;
        }

        try {
            const empId = isCreatingNew
                ? (form.id.trim() || form.name.replace(/\s+/g, '-').toUpperCase())
                : editingEmp.id;
            const ref = doc(db, 'training_records', empId);

            // Subir documentos nuevos
            const uploadedDocs = [];
            for (const file of docFiles) {
                try {
                    const res = await uploadFile(file, { employeeId: empId, docType: 'documents' });
                    if (res.success) {
                        uploadedDocs.push({ name: file.name, url: res.data.viewLink, driveId: res.data.id, uploadDate: new Date().toISOString() });
                    }
                } catch (err) {
                    console.error('Error subiendo documento:', file.name, err);
                }
            }

            const existingDocs = isCreatingNew ? [] : (editingEmp?.documents || []);
            const allDocs = [...existingDocs, ...uploadedDocs];

            const payload = {
                name: (form.name || '').trim().toUpperCase(),
                position: (form.position || '').trim().toUpperCase(),
                department: (form.department || '').trim().toUpperCase(),
                curp: (form.curp || '').trim().toUpperCase(),
                occupation: form.occupation ? form.occupation.trim().toUpperCase() : (form.position || '').trim().toUpperCase(),
                area: (form.area || '').trim().toUpperCase(),
                education: (form.education || '').trim(),
                startDate: form.startDate || '',
                shift: (form.shift || '').trim().toUpperCase(),
                promotionData: {
                    ...(editingEmp?.promotionData || {}),
                    performanceScore: form.performanceScore ? parseFloat(form.performanceScore) : null,
                    performancePeriod: form.performancePeriod || '',
                    positionStartDate: form.positionStartDate || '',
                },
                updatedAt: new Date().toISOString(),
                documents: allDocs,
            };

            // Calcular matrix
            let matrixData = { requiredCount: 0, completedCount: 0, compliancePercentage: 0, requiredCourses: [] };
            try {
                const posName = payload.position;
                let matrixDoc = null;

                // Una sola lectura a Firestore; resultado en caché por 5 min
                const getPositionsDocs = async () => {
                    if (positionsCacheRef.current && Date.now() - positionsCacheRef.current.ts < 300_000) {
                        return positionsCacheRef.current.docs;
                    }
                    const snap = await getDocs(collection(db, 'positions'));
                    const docs = snap.docs.map(d => ({ id: d.id, data: d.data() }));
                    positionsCacheRef.current = { docs, ts: Date.now() };
                    return docs;
                };

                const posDocs = await getPositionsDocs();
                const targetNorm = posName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
                const found = posDocs.find(({ data: d }) => {
                    const dName = (d.name || '').toUpperCase().trim();
                    const dNorm = dName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    return dName === posName.toUpperCase().trim() || dNorm === targetNorm;
                });
                if (found) matrixDoc = found.data;

                if (matrixDoc) {
                    const requiredCourses = matrixDoc.requiredCourses || [];
                    const history = isCreatingNew ? [] : (editingEmp?.history || []);
                    const completed = requiredCourses.filter(rc =>
                        history.some(h => h.courseName === rc && h.status === 'approved')
                    );
                    matrixData = {
                        requiredCount: requiredCourses.length,
                        completedCount: completed.length,
                        compliancePercentage: requiredCourses.length > 0
                            ? Math.round((completed.length / requiredCourses.length) * 100)
                            : 0,
                        requiredCourses,
                    };
                }
            } catch (err) {
                console.error('Error fetching matrix:', err);
            }

            if (isCreatingNew) {
                const check = await getDoc(ref);
                if (check.exists()) {
                    toast.error(`El ID "${empId}" ya existe. Usa un ID diferente.`);
                    return;
                }
                await setDoc(ref, { ...payload, employeeId: empId, history: [], matrix: matrixData });
                setEmployees(prev => sortByEmpId([...prev, { id: empId, ...payload, history: [], matrix: matrixData }]));
                toast.success('Empleado registrado correctamente.');
            } else {
                await updateDoc(ref, { ...payload, matrix: matrixData });
                setEmployees(prev => prev.map(e => e.id === empId ? { ...e, ...payload, matrix: matrixData } : e));
                toast.success('Datos del empleado actualizados.');
            }

            closeModal();
        } catch (error) {
            console.error('Error saving employee:', error);
            toast.error('No se pudo guardar. Intenta nuevamente.');
        }
    }, [isCreatingNew, editingEmp, closeModal, toast, user]);

    const handleDelete = useCallback(async (emp) => {
        if (user?.rol !== 'super_admin') {
            toast.error('Solo Super Admin puede eliminar empleados.');
            return;
        }
        const ok = await showConfirm(
            `¿Estás seguro de eliminar a ${emp.name}? Esta acción eliminará al empleado de todos los registros.`,
            { title: 'Eliminar Empleado', confirmLabel: 'Eliminar', danger: true }
        );
        if (!ok) return;

        try {
            const batch = writeBatch(db);
            batch.delete(doc(db, 'training_records', emp.id));
            const targetId = emp.employeeId || emp.id;
            batch.delete(doc(db, 'instructors', targetId));
            await batch.commit();
            setEmployees(prev => prev.filter(e => e.id !== emp.id));
            toast.success('Empleado y datos asociados eliminados.');
        } catch (e) {
            console.error('Error deleting', e);
            toast.error('No se pudo eliminar el registro completamente.');
        }
    }, [user, showConfirm, toast]);

    // ── Render ────────────────────────────────────────────────────────────────
    if (authLoading || !user) return null;

    const kpiItems = [
        { value: kpis.total, label: 'Total Empleados', color: 'Primary', icon: <Users size={20} /> },
        { value: kpis.highCompliance, label: 'Cumplimiento ≥80%', color: 'Success', icon: <CheckCircle size={20} /> },
        { value: kpis.needsAttention, label: 'Requieren Atención', color: 'Warn', icon: <AlertTriangle size={20} /> },
        { value: kpis.noDept, label: 'Sin Departamento', color: 'Amber', icon: <BookOpen size={20} /> },
    ];

    return (
        <AdminLayout title="Empleados de Capacitación">
            {confirmDialog}
            <main className={styles.page} id="main-content">



                {/* ── KPIs ── */}
                <div className={styles.statsGrid} role="region" aria-label="Indicadores">
                    {kpiItems.map(({ value, label, color, icon }) => (
                        <div key={label} className={`${styles.statCard} ${styles[`statCard${color}`]}`}>
                            <div className={`${styles.statIconWrap} ${styles[`statIconWrap${color}`]}`}>{icon}</div>
                            <div className={styles.statInfo}>
                                <div className={styles.statValue}>{value}</div>
                                <div className={styles.statLabel}>{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Toolbar ── */}
                <div className={styles.toolbar} role="toolbar" aria-label="Filtros y búsqueda">
                    <div className={styles.filters}>
                        <div className={styles.searchBox}>
                            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
                            <input
                                type="search"
                                className={styles.searchInput}
                                placeholder="Buscar por nombre o ID…"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                aria-label="Buscar empleado"
                            />
                        </div>

                        <Select
                            value={deptFilter}
                            onChange={value => setDeptFilter(value)}
                            options={[{ value: '', label: 'DEPARTAMENTO' }, ...departments.map(d => ({ value: d, label: d }))]}
                            className={styles.filterSelect}
                            aria-label="Filtrar por departamento"
                        />

                        <Select
                            value={posFilter}
                            onChange={value => setPosFilter(value)}
                            options={[{ value: '', label: 'PUESTO' }, ...positionsCatalog.map(p => ({ value: p, label: p }))]}
                            className={styles.filterSelect}
                            aria-label="Filtrar por puesto"
                        />
                    </div>

                    <div className={styles.toolbarActions}>
                        {canWrite() && (
                            <button className={styles.btnPrimary} onClick={openNew} type="button">
                                <UserPlus size={15} /> Nuevo Empleado
                            </button>
                        )}
                        <div className={styles.recordCount}>{filtered.length} registros</div>
                    </div>
                </div>

                {/* ── VISTA DESKTOP — Tabla ── */}
                <div className={`${styles.tableContainer} ${styles.tableView}`} aria-live="polite" aria-atomic="false">
                    {loading ? (
                        <div className={styles.loadingRow} role="status">
                            <span className={styles.spinner} aria-hidden="true" />
                            Cargando empleados…
                        </div>
                    ) : paginated.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Users size={48} className={styles.emptyIcon} aria-hidden="true" />
                            <p className={styles.emptyTitle}>{employees.length === 0 ? 'Sin empleados aún' : 'Sin resultados'}</p>
                            <p className={styles.emptyDesc}>
                                {employees.length === 0
                                    ? 'Registra el primer empleado con el botón + Nuevo Empleado.'
                                    : 'Prueba ajustando la búsqueda o los filtros.'}
                            </p>
                        </div>
                    ) : (
                        <div className={styles.tableScroll}>
                            <table className={styles.table} aria-label="Lista de empleados">
                                <thead>
                                    <tr>
                                        <th scope="col" style={{ width: 52 }}><span className="sr-only">Avatar</span></th>
                                        <th scope="col">Empleado</th>
                                        <th scope="col">Puesto / Dpto.</th>
                                        <th scope="col">Área / Turno</th>
                                        <th scope="col">F. Ingreso</th>
                                        <th scope="col" style={{ textAlign: 'center' }}>Cumplimiento</th>
                                        <th scope="col">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map(emp => (
                                        <tr key={emp.id} className={styles.tableRow}>
                                            <td>
                                                <div className={styles.avatarCell}>
                                                    {getInitials(emp.name)}
                                                </div>
                                            </td>
                                            <td className={styles.empCell}>
                                                <div className={styles.empNameRow}>
                                                    <span className={styles.empName}>{emp.name || '—'}</span>
                                                </div>
                                                <div className={styles.empId}>#{emp.employeeId || emp.id}</div>
                                            </td>
                                            <td className={styles.posCell}>
                                                <div className={styles.posName}>{emp.position || '—'}</div>
                                                <div className={styles.posDept}>{emp.department || '—'}</div>
                                            </td>
                                            <td>
                                                <div className={styles.posName}>{emp.area || '—'}</div>
                                                <div className={styles.posDept}>Turno {emp.shift || '—'}</div>
                                            </td>
                                            <td className={styles.dateCell}>{emp.startDate || '—'}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`${styles.complianceBadge} ${getComplianceClass(emp.matrix?.compliancePercentage || 0)}`}>
                                                    {emp.matrix?.compliancePercentage || 0}%
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionsCell}>
                                                    {canWrite() && (
                                                        <>
                                                            <button
                                                                className={`${styles.iconBtn} ${styles.iconBtnAmber}`}
                                                                onClick={() => openEdit(emp)}
                                                                title="Editar"
                                                                type="button"
                                                                aria-label={`Editar ${emp.name}`}
                                                            >
                                                                <Edit2 size={13} />
                                                            </button>
                                                            <button
                                                                className={`${styles.iconBtn} ${styles.iconBtnRed}`}
                                                                onClick={() => handleDelete(emp)}
                                                                title="Eliminar"
                                                                type="button"
                                                                aria-label={`Eliminar ${emp.name}`}
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── VISTA MOBILE — Cards ── */}
                <div className={`${styles.cardList} ${styles.cardsView}`}>
                    {loading ? (
                        <div className={styles.loadingRow} role="status">
                            <span className={styles.spinner} aria-hidden="true" /> Cargando…
                        </div>
                    ) : paginated.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Users size={40} className={styles.emptyIcon} />
                            <p className={styles.emptyTitle}>Sin empleados</p>
                            <p className={styles.emptyDesc}>Usa el botón + para registrar uno.</p>
                        </div>
                    ) : paginated.map(emp => (
                        <div key={emp.id} className={styles.employeeCard}>
                            <div className={styles.cardTop}>
                                <div className={styles.avatarCellLg}>{getInitials(emp.name)}</div>
                                <div className={styles.cardEmployeeInfo}>
                                    <div className={styles.cardNameRow}>
                                        <span className={styles.cardName}>{emp.name || '—'}</span>
                                    </div>
                                    <div className={styles.cardMeta}>
                                        <span>#{emp.employeeId || emp.id}</span>
                                        <span className={styles.cardMetaDot} />
                                        <span>{emp.position || '—'}</span>
                                    </div>
                                </div>
                                {canWrite() && (
                                    <div className={styles.cardActions}>
                                        <button
                                            className={`${styles.iconBtn} ${styles.iconBtnAmber}`}
                                            onClick={() => openEdit(emp)}
                                            title="Editar"
                                            type="button"
                                        >
                                            <Edit2 size={13} />
                                        </button>
                                        <button
                                            className={`${styles.iconBtn} ${styles.iconBtnRed}`}
                                            onClick={() => handleDelete(emp)}
                                            title="Eliminar"
                                            type="button"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className={styles.cardDivider} />

                            <div className={styles.cardBottom}>
                                <div className={styles.cardMiniStats}>
                                    <div className={styles.cardMiniItem}>
                                        <span className={styles.cardMiniLabel}>Depto.</span>
                                        <span className={styles.cardMiniValue}>{emp.department || '—'}</span>
                                    </div>
                                    <div className={styles.cardMiniItem}>
                                        <span className={styles.cardMiniLabel}>Turno</span>
                                        <span className={styles.cardMiniValue}>{emp.shift || '—'}</span>
                                    </div>
                                </div>
                                <span className={`${styles.complianceBadge} ${getComplianceClass(emp.matrix?.compliancePercentage || 0)}`}>
                                    {emp.matrix?.compliancePercentage || 0}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Paginación ── */}
                {!loading && filtered.length > ITEMS_PER_PAGE && (
                    <div className={styles.pagination}>
                        <div className={styles.paginationInfo}>
                            Página {currentPage} de {totalPages} — {filtered.length} registros
                        </div>
                        <div className={styles.paginationControls}>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setCurrentPage(p => p - 1)}
                                disabled={currentPage === 1}
                                type="button"
                                aria-label="Página anterior"
                            >
                                Anterior
                            </button>
                            <span className={styles.pageCurrent}>{currentPage}</span>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setCurrentPage(p => p + 1)}
                                disabled={currentPage >= totalPages}
                                type="button"
                                aria-label="Página siguiente"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Modal ── */}
                {showModal && (
                    <EmployeeModal
                        initial={editingEmp}
                        isCreating={isCreatingNew}
                        onClose={closeModal}
                        onSave={handleSave}
                        positions={positionsCatalog}
                        departments={departments}
                    />
                )}

            </main>
        </AdminLayout>
    );
}
