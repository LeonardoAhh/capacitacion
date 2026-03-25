'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import styles from './page.module.css';
import {
    Search, Plus, Upload, Edit2, Trash2, X, Save,
    Users, UserCheck, UserMinus, Star, Download,
} from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/components/ui/Toast/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { formatFullName } from '@/lib/employeeUtils';
import EmployeeImportPreview from './components/EmployeeImportPreview';
import { generateEmployeeTemplate, parseImportFile, validateEmployeeImportRecords } from '@/utils/importUtils';

// ── Constantes ─────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
    'ALMACÉN', 'CALIDAD', 'LOGÍSTICA', 'MANTENIMIENTO', 'METROLOGÍA', 'MOLDES',
    'PRODUCCIÓN', 'PROYECTOS', 'RECURSOS HUMANOS', 'SGI', 'SISTEMAS', 'VENTAS',
];

const EMPTY_FORM = {
    name: '', employeeId: '', curp: '', phone: '',
    position: '', department: '', area: '', shift: '',
    startDate: '', contractEndDate: '',
    status: 'Activo', isCandidato: false,
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function getInitials(name) {
    if (!name) return '?';
    const words = formatFullName(name)
        .split(' ')
        .filter(w => !['de', 'la', 'las', 'los', 'del', 'y'].includes(w.toLowerCase()));
    if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    return (words[0] || 'X').slice(0, 2).toUpperCase();
}

function fmtDate(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    if (isNaN(d)) return isoStr;
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function toInputDate(isoStr) {
    if (!isoStr) return '';
    return isoStr.split('T')[0];
}

// ── StatsBar ───────────────────────────────────────────────────────────────────
function StatsBar({ employees }) {
    const stats = useMemo(() => ({
        total: employees.length,
        active: employees.filter(e => e.status !== 'Inactivo').length,
        candidatos: employees.filter(e => e.isCandidato).length,
        inactive: employees.filter(e => e.status === 'Inactivo').length,
    }), [employees]);

    const items = [
        { value: stats.total, label: 'Total Candidatos', color: 'Primary', icon: <Users size={20} /> },
        { value: stats.active, label: 'Activos', color: 'Success', icon: <UserCheck size={20} /> },
        { value: stats.candidatos, label: 'Candidatos', color: 'Amber', icon: <Star size={20} /> },
        { value: stats.inactive, label: 'Inactivos', color: 'Danger', icon: <UserMinus size={20} /> },
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

// ── EmployeeModal ──────────────────────────────────────────────────────────────
function EmployeeModal({ initial, onClose, onSave }) {
    const [form, setForm] = useState(() => {
        if (!initial) return { ...EMPTY_FORM };
        return {
            name: initial.name || '',
            employeeId: initial.employeeId || '',
            curp: initial.curp || '',
            phone: initial.phone || '',
            position: initial.position || '',
            department: initial.department || '',
            area: initial.area || '',
            shift: initial.shift || '',
            startDate: toInputDate(initial.startDate),
            contractEndDate: toInputDate(initial.contractEndDate),
            status: initial.status || 'Activo',
            isCandidato: initial.isCandidato || false,
        };
    });
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);

    const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleStartDateChange = (val) => {
        if (!val) { set('startDate', ''); return; }
        const start = new Date(val);
        const addDays = (d, n) => {
            const r = new Date(d);
            r.setDate(r.getDate() + n);
            return r.toISOString().split('T')[0];
        };
        setForm(prev => ({
            ...prev,
            startDate: val,
            contractEndDate: addDays(start, 90),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step === 1) { setStep(2); return; }
        setSaving(true);
        const payload = {
            ...form,
            startDate: form.startDate ? form.startDate + 'T12:00:00Z' : '',
            contractEndDate: form.contractEndDate ? form.contractEndDate + 'T12:00:00Z' : '',
        };
        if (form.startDate) {
            const start = new Date(form.startDate);
            const addDays = (d, n) => {
                const r = new Date(d);
                r.setDate(r.getDate() + n);
                return r.toISOString().split('T')[0] + 'T12:00:00Z';
            };
            payload.eval1Date = addDays(start, 30);
            payload.eval2Date = addDays(start, 60);
            payload.eval3Date = addDays(start, 85);
        }
        await onSave(payload);
        setSaving(false);
    };

    const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

    return (
        <div className={styles.modalOverlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>
                        {initial ? 'Editar Empleado' : 'Nuevo Empleado'}
                    </h2>
                    <button className={styles.modalCloseBtn} onClick={onClose} type="button" aria-label="Cerrar">
                        <X size={16} />
                    </button>
                </div>

                <form className={styles.modalBody} onSubmit={handleSubmit}>
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

                    <div className={styles.formGrid}>
                        {step === 1 && (
                            <>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>No. Empleado *</label>
                                    <input
                                        required
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.employeeId}
                                        onChange={e => set('employeeId', e.target.value)}
                                        placeholder="Ej. 3204"
                                        disabled={!!initial}
                                    />
                                </div>

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
                                    <label className={styles.fieldLabel}>CURP</label>
                                    <input
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.curp}
                                        onChange={e => set('curp', e.target.value)}
                                        placeholder="Ej. HEHL..."
                                        maxLength={18}
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Teléfono</label>
                                    <input
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.phone}
                                        onChange={e => set('phone', e.target.value)}
                                        placeholder="Ej. 442..."
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Estatus</label>
                                    <select
                                        className={styles.fieldInput}
                                        value={form.status}
                                        onChange={e => set('status', e.target.value)}
                                    >
                                        <option value="Activo">Activo</option>
                                        <option value="Inactivo">Inactivo</option>
                                    </select>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Tipo</label>
                                    <select
                                        className={styles.fieldInput}
                                        value={form.isCandidato ? 'candidato' : 'empleado'}
                                        onChange={e => set('isCandidato', e.target.value === 'candidato')}
                                    >
                                        <option value="empleado">Empleado</option>
                                        <option value="candidato">Candidato</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Puesto</label>
                                    <input
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.position}
                                        onChange={e => set('position', e.target.value)}
                                        placeholder="PUESTO EN EL SSO"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Departamento</label>
                                    <input
                                        type="text"
                                        className={styles.fieldInput}
                                        list="dept-list-emp"
                                        value={form.department}
                                        onChange={e => set('department', e.target.value)}
                                        placeholder="Ej. PRODUCCIÓN"
                                    />
                                    <datalist id="dept-list-emp">
                                        {DEPARTMENTS.map(d => <option key={d} value={d} />)}
                                    </datalist>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Área</label>
                                    <input
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.area}
                                        onChange={e => set('area', e.target.value)}
                                        placeholder="Ej. ADMINISTRATIVO"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Turno</label>
                                    <input
                                        type="text"
                                        className={styles.fieldInput}
                                        list="shift-list-emp"
                                        value={form.shift}
                                        onChange={e => set('shift', e.target.value)}
                                        placeholder="1, 2, 3, 4, Mixto"
                                    />
                                    <datalist id="shift-list-emp">
                                        {['1', '2', '3', '4', 'Mixto'].map(s => <option key={s} value={s} />)}
                                    </datalist>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Fecha de Inicio</label>
                                    <input
                                        type="date"
                                        className={styles.fieldInput}
                                        value={form.startDate}
                                        onChange={e => handleStartDateChange(e.target.value)}
                                    />
                                    <span className={styles.fieldHint}>Calcula fin de contrato automáticamente (+90 días)</span>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Fin de Contrato</label>
                                    <input
                                        type="date"
                                        className={styles.fieldInput}
                                        value={form.contractEndDate}
                                        onChange={e => set('contractEndDate', e.target.value)}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className={styles.modalFooter}>
                        {step === 1 ? (
                            <>
                                <button type="button" onClick={onClose} className={styles.btnCancel}>Cancelar</button>
                                <button type="submit" className={styles.btnSave}>Siguiente</button>
                            </>
                        ) : (
                            <>
                                <button type="button" onClick={() => setStep(1)} className={styles.btnCancel}>Atrás</button>
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
export default function EmployeesPage() {
    const { toast } = useToast();
    const { showConfirm, confirmDialog } = useConfirm();

    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterShift, setFilterShift] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [importLoading, setImportLoading] = useState(false);
    const [importPreview, setImportPreview] = useState(null);
    const fileInputRef = useRef(null);

    const {
        employees, loading, page, hasMore, hasPrevious,
        nextPage, prevPage, createEmployee, updateEmployee, deleteEmployee,
        searchEmployees, refresh,
    } = useEmployees(30);

    // Search
    useEffect(() => {
        if (searchEmployees) searchEmployees(search);
    }, [search, searchEmployees]);

    // Filters (client-side sobre los registros cargados)
    const filtered = useMemo(() => {
        return employees.filter(e => {
            const matchDept = !filterDept || e.department === filterDept;
            const matchShift = !filterShift || e.shift === filterShift;
            const matchStatus = !filterStatus
                || (filterStatus === 'active' && e.status !== 'Inactivo')
                || (filterStatus === 'inactive' && e.status === 'Inactivo')
                || (filterStatus === 'candidato' && e.isCandidato);
            return matchDept && matchShift && matchStatus;
        });
    }, [employees, filterDept, filterShift, filterStatus]);

    const departments = useMemo(() =>
        [...new Set(employees.map(e => e.department).filter(Boolean))].sort(),
        [employees]);

    const shifts = useMemo(() =>
        [...new Set(employees.map(e => e.shift).filter(Boolean))].sort(),
        [employees]);

    // ── Acciones ──────────────────────────────────────────────────────────────
    const openNew = useCallback(() => { setEditingItem(null); setShowModal(true); }, []);
    const handleEdit = useCallback((emp) => { setEditingItem(emp); setShowModal(true); }, []);
    const closeModal = useCallback(() => { setShowModal(false); setEditingItem(null); }, []);

    const handleSave = useCallback(async (formData) => {
        try {
            if (editingItem) {
                const result = await updateEmployee(editingItem.id, formData);
                if (!result.success) throw new Error(result.error);
                toast.success('Empleado actualizado.');
            } else {
                const result = await createEmployee(formData);
                if (!result.success) throw new Error(result.error);
                toast.success('Empleado registrado.');
            }
        } catch (err) {
            toast.error('Error al guardar: ' + err.message);
        }
        setEditingItem(null);
        setShowModal(false);
    }, [editingItem, createEmployee, updateEmployee, toast]);

    const handleDelete = useCallback(async (emp) => {
        const ok = await showConfirm(`¿Eliminar a ${formatFullName(emp.name)}?`, {
            confirmLabel: 'Eliminar',
            title: 'Confirmar eliminación',
            danger: true,
        });
        if (!ok) return;
        try {
            await deleteEmployee(emp.id);
            toast.success('Empleado eliminado.');
        } catch {
            toast.error('No se pudo eliminar.');
        }
    }, [showConfirm, deleteEmployee, toast]);

    const handleImportFile = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportLoading(true);
        try {
            const records = await parseImportFile(file);
            if (!records.length) throw new Error('Archivo sin registros válidos.');
            const validation = validateEmployeeImportRecords(records, employees);
            setImportPreview(validation);
            toast.success('Archivo procesado. Revisa la vista previa.');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setImportLoading(false);
            e.target.value = '';
        }
    }, [employees, toast]);

    const handleImportConfirm = useCallback(async (rows) => {
        setImportLoading(true);
        let imported = 0, errors = 0;
        for (const row of rows) {
            const result = await createEmployee({ ...row, status: 'Activo', isCandidato: false });
            result.success ? imported++ : errors++;
        }
        if (errors > 0) toast.error(`${imported} creados, ${errors} con error.`);
        else toast.success(`${imported} empleados importados correctamente.`);
        setImportPreview(null);
        refresh();
        setImportLoading(false);
    }, [createEmployee, refresh, toast]);

    const handleDownloadTemplate = useCallback(() => {
        try { generateEmployeeTemplate(); toast.success('Plantilla descargada.'); }
        catch { toast.error('Error al descargar la plantilla.'); }
    }, [toast]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <AdminLayout title="Empleados">
            {confirmDialog}
            <main className={styles.page} id="main-content">

                {/* KPIs */}
                <StatsBar employees={employees} />

                {/* Toolbar */}
                <div className={styles.toolbar} role="toolbar" aria-label="Acciones y filtros">
                    <div className={styles.searchBox}>
                        <Search size={16} className={styles.searchIcon} aria-hidden="true" />
                        <input
                            type="search"
                            className={styles.searchInput}
                            placeholder="BUSCAR.."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            aria-label="Buscar empleado"
                        />
                    </div>

                    <select
                        className={styles.filterSelect}
                        value={filterDept}
                        onChange={e => setFilterDept(e.target.value)}
                        aria-label="Filtrar por departamento"
                    >
                        <option value="">DEPARTAMENTO</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>

                    <select
                        className={styles.filterSelect}
                        value={filterShift}
                        onChange={e => setFilterShift(e.target.value)}
                        aria-label="Filtrar por turno"
                    >
                        <option value="">TURNO</option>
                        {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select
                        className={styles.filterSelect}
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        aria-label="Filtrar por estatus"
                    >
                        <option value="">ESTATUS</option>
                        <option value="active">ACTIVOS</option>
                        <option value="inactive">INACTIVOS</option>
                        <option value="candidato">CANDIDATOS</option>
                    </select>

                    <div className={styles.toolbarActions}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.json"
                            className={styles.fileInput}
                            onChange={handleImportFile}
                        />
                        <button
                            className={styles.btnOutline}
                            onClick={handleDownloadTemplate}
                            title="Descargar plantilla Excel"
                            type="button"
                        >
                            <Download size={15} /> Plantilla
                        </button>
                        <button
                            className={styles.btnImport}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importLoading}
                            title="Importar empleados desde archivo"
                            type="button"
                        >
                            <Upload size={15} />
                            {importLoading ? 'Importando…' : 'Importar'}
                        </button>
                        <button
                            className={styles.btnPrimary}
                            onClick={openNew}
                            title="Registrar nuevo empleado"
                            type="button"
                        >
                            <Plus size={15} /> Empleado
                        </button>
                    </div>
                </div>

                {/* ── VISTA DESKTOP — Tabla ── */}
                <div className={`${styles.tableContainer} ${styles.tableView}`}>
                    {loading ? (
                        <div className={styles.loadingRow} role="status">
                            <span className={styles.spinner} aria-hidden="true" />
                            Cargando empleados…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Users size={48} className={styles.emptyIcon} aria-hidden="true" />
                            <p className={styles.emptyTitle}>
                                {employees.length === 0 ? 'Sin empleados aún' : 'Sin resultados'}
                            </p>
                            <p className={styles.emptyDesc}>
                                {employees.length === 0
                                    ? 'Importa un archivo o registra el primer empleado con el botón +.'
                                    : 'Prueba ajustando la búsqueda o los filtros.'}
                            </p>
                        </div>
                    ) : (
                        <div className={styles.tableScroll}>
                            <table className={styles.table} aria-label="Lista de empleados">
                                <thead>
                                    <tr>
                                        <th style={{ width: 52 }}></th>
                                        <th>Empleado</th>
                                        <th>Puesto / Área</th>
                                        <th style={{ textAlign: 'center' }}>Turno</th>
                                        <th>F. Inicio</th>
                                        <th>Estatus</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(emp => (
                                        <tr key={emp.id} className={styles.tableRow}>
                                            <td>
                                                <div className={styles.avatarCell}>
                                                    {getInitials(emp.name)}
                                                </div>
                                            </td>
                                            <td className={styles.empCell}>
                                                <div className={styles.empNameRow}>
                                                    <span className={styles.empName}>{formatFullName(emp.name) || '—'}</span>
                                                    {emp.isCandidato && (
                                                        <span className={styles.candidateBadge}>Candidato</span>
                                                    )}
                                                </div>
                                                <div className={styles.empId}>#{emp.employeeId || emp.id}</div>
                                            </td>
                                            <td className={styles.posCell}>
                                                <div className={styles.posName}>{emp.position || '—'}</div>
                                                <div className={styles.posDept}>
                                                    {emp.department}{emp.area ? ` · ${emp.area}` : ''}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center', fontWeight: 500, color: 'var(--c-ink)', fontSize: '0.84rem' }}>
                                                {emp.shift || '—'}
                                            </td>
                                            <td className={styles.dateCell}>{fmtDate(emp.startDate)}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${emp.status === 'Inactivo' ? styles.statusInactive : styles.statusActive}`}>
                                                    {emp.status || 'Activo'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionsCell}>
                                                    <button
                                                        className={`${styles.iconBtn} ${styles.iconBtnAmber}`}
                                                        onClick={() => handleEdit(emp)}
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
                    ) : filtered.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Users size={40} className={styles.emptyIcon} />
                            <p className={styles.emptyTitle}>Sin empleados</p>
                            <p className={styles.emptyDesc}>Usa el botón + para registrar uno.</p>
                        </div>
                    ) : filtered.map(emp => (
                        <div key={emp.id} className={styles.employeeCard}>
                            <div className={styles.cardTop}>
                                <div className={styles.avatarCellLg}>{getInitials(emp.name)}</div>
                                <div className={styles.cardEmployeeInfo}>
                                    <div className={styles.cardNameRow}>
                                        <span className={styles.cardName}>{formatFullName(emp.name)}</span>
                                        {emp.isCandidato && (
                                            <span className={styles.candidateBadge}>Candidato</span>
                                        )}
                                    </div>
                                    <div className={styles.cardIdPos}>
                                        <span>#{emp.employeeId}</span>
                                        <span className={styles.cardIdDot} />
                                        <span>{emp.position || '—'}</span>
                                    </div>
                                </div>
                                <div className={styles.cardActions}>
                                    <button
                                        className={`${styles.iconBtn} ${styles.iconBtnAmber}`}
                                        onClick={() => handleEdit(emp)}
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
                            </div>

                            <div className={styles.cardDivider} />

                            <div className={styles.cardBottom}>
                                <div className={styles.cardDates}>
                                    <div className={styles.cardDateItem}>
                                        <span className={styles.cardDateLabel}>Depto</span>
                                        <span className={styles.cardDateValue}>{emp.department || '—'}</span>
                                    </div>
                                    <div className={styles.cardDateItem}>
                                        <span className={styles.cardDateLabel}>Turno</span>
                                        <span className={styles.cardDateValue}>{emp.shift || '—'}</span>
                                    </div>
                                    <div className={styles.cardDateItem}>
                                        <span className={styles.cardDateLabel}>F. Inicio</span>
                                        <span className={styles.cardDateValue}>{fmtDate(emp.startDate)}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className={`${styles.statusBadge} ${emp.status === 'Inactivo' ? styles.statusInactive : styles.statusActive}`}>
                                        {emp.status || 'Activo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Paginación ── */}
                {!loading && employees.length > 0 && (
                    <div className={styles.pagination}>
                        <div className={styles.paginationInfo}>Página {page}</div>
                        <div className={styles.paginationControls}>
                            <button
                                className={styles.pageBtn}
                                onClick={prevPage}
                                disabled={!hasPrevious || loading}
                                type="button"
                                aria-label="Página anterior"
                            >
                                Anterior
                            </button>
                            <span className={styles.pageCurrent}>{page}</span>
                            <button
                                className={styles.pageBtn}
                                onClick={nextPage}
                                disabled={!hasMore || loading}
                                type="button"
                                aria-label="Página siguiente"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal crear / editar */}
                {showModal && (
                    <EmployeeModal
                        initial={editingItem}
                        onClose={closeModal}
                        onSave={handleSave}
                    />
                )}

            </main>

            {/* Import preview */}
            {importPreview && (
                <EmployeeImportPreview
                    preview={importPreview}
                    existingEmployees={employees}
                    onCancel={() => setImportPreview(null)}
                    onConfirm={handleImportConfirm}
                    isImporting={importLoading}
                />
            )}
        </AdminLayout>
    );
}
