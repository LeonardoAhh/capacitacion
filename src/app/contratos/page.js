'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import styles from './page.module.css';
import {
    Search, Plus, Upload, Edit2, Trash2, X, Save,
    Users, AlertTriangle, ClipboardList, CheckCircle2,
    Calendar, Clock, Star, BookOpen, SlidersHorizontal,
} from 'lucide-react';
import {
    subscribeContratos, createContrato, updateContrato, deleteContrato,
    bulkImportContratos, getEvalDates, getEvalStatus, getContractStatus,
    getTrainingPlanStatus, formatDate, parseDate, EMPTY_FORM,
} from '@/lib/contratosService';
import { useToast } from '@/components/ui/Toast/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { Select } from '@/components/ui/Select/Select';

// ── Constantes ────────────────────────────────────────────────────────────────
const EVAL_KEYS = ['first', 'second', 'third'];
const EVAL_LABELS = { first: '1ª Eval', second: '2ª Eval', third: '3ª Eval' };
const EVAL_DAYS = { first: 30, second: 60, third: 80 };

const DEPARTMENTS = [
    'ALMACÉN', 'CALIDAD', 'LOGÍSTICA', 'MANTENIMIENTO', 'METROLOGÍA', 'MOLDES',
    'PRODUCCIÓN', 'PROYECTOS', 'RECURSOS HUMANOS', 'SGI', 'SISTEMAS', 'VENTAS',
];

// Helper: Convierte PATERNO MATERNO NOMBRES -> NOMBRES PATERNO MATERNO
const formatFullName = (fullName) => {
    if (!fullName) return '';
    const nameStr = fullName.trim();
    const parts = nameStr.split(/\s+/);
    if (parts.length < 3) return nameStr;

    let apellidosStr = '';
    let currIdx = 0;
    let numApellidos = 0;
    const preposiciones = new Set(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y', 'MAC', 'MC', 'SAN', 'SANTA']);

    while (currIdx < parts.length && numApellidos < 2) {
        const word = parts[currIdx];
        if (preposiciones.has(word.toUpperCase())) {
            apellidosStr += word + ' ';
            currIdx++;
        } else {
            apellidosStr += word + ' ';
            currIdx++;
            numApellidos++;
        }
    }

    const apellidos = apellidosStr.trim();
    const nombres = parts.slice(currIdx).join(' ');

    if (!nombres) return nameStr;
    return `${nombres} ${apellidos}`;
};


// ── Sub-componente: EvalChip ──────────────────────────────────────────────────
function EvalChip({ evalDate, score, label, onClick }) {
    const { status, label: statusLabel } = getEvalStatus(evalDate, score);
    const chipClass = {
        na: styles.evalChipNa,
        pending: styles.evalChipPending,
        upcoming: styles.evalChipUpcoming,
        overdue: styles.evalChipOverdue,
        approved: styles.evalChipApproved,
        failed: styles.evalChipFailed,
    }[status] ?? styles.evalChipPending;

    const icon = {
        na: null,
        pending: <Clock size={11} />,
        upcoming: <AlertTriangle size={11} />,
        overdue: <AlertTriangle size={11} />,
        approved: <CheckCircle2 size={11} />,
        failed: <X size={11} />,
    }[status];

    const canClick = status !== 'na';
    const isScored = status === 'approved' || status === 'failed';

    return (
        <button
            className={`${styles.evalChip} ${chipClass}`}
            onClick={canClick ? onClick : undefined}
            aria-label={`${label}: ${statusLabel}${isScored ? ` — ${score}` : ''}`}
            title={evalDate ? `Fecha: ${formatDate(evalDate)}` : ''}
            type="button"
        >
            {isScored ? score : statusLabel}
        </button>
    );
}

// ── Sub-componente: TrainingBtn ───────────────────────────────────────────────
function TrainingBtn({ item, onToggle, disabled }) {
    const { isDelivered, isOverdue, dueDate } = getTrainingPlanStatus(item.entryDate, item.department, item.trainingPlan);

    const chipClass = isDelivered ? styles.trainingEntregado
        : isOverdue ? styles.trainingVencido
            : styles.trainingPendiente;

    const Icon = isDelivered ? CheckCircle2 : (isOverdue ? AlertTriangle : Clock);
    const labelText = isDelivered ? 'Entregado' : (isOverdue ? 'Vencido' : 'Pendiente');
    const tooltip = dueDate && !isDelivered ? `Límite: ${formatDate(dueDate)}` : `Plan de formación: ${labelText}`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <button
                className={`${styles.trainingBtn} ${chipClass}`}
                onClick={onToggle}
                disabled={disabled}
                type="button"
                aria-pressed={isDelivered}
                title={tooltip}
            >
                {labelText}
            </button>
            {!isDelivered && dueDate && (
                <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: isOverdue ? 'var(--c-danger)' : 'var(--c-muted)',
                    whiteSpace: 'nowrap'
                }}>
                    Lím: {formatDate(dueDate)}
                </span>
            )}
        </div>
    );
}

// ── Sub-componente: StatsBar ──────────────────────────────────────────────────
function StatsBar({ contratos }) {
    const today = useMemo(() => new Date(), []);

    const stats = useMemo(() => {
        const total = contratos.length;
        let pendingTraining = 0;
        let pendingEvals = 0;
        let expiringContracts = 0;

        contratos.forEach(c => {
            const trainSt = getTrainingPlanStatus(c.entryDate, c.department, c.trainingPlan);
            if (!trainSt.isDelivered) pendingTraining++;

            const evalDates = getEvalDates(c.entryDate);
            EVAL_KEYS.forEach(key => {
                const { status } = getEvalStatus(evalDates[key], c.evaluations?.[key]?.score);
                if (status === 'upcoming' || status === 'overdue') pendingEvals++;
            });
            const cStatus = getContractStatus(c.contractEndDate, new Date(today));
            if (cStatus === 'expiring' || cStatus === 'expired') expiringContracts++;
        });

        return { total, pendingTraining, pendingEvals, expiringContracts };
    }, [contratos, today]);

    const items = [
        {
            value: stats.total,
            label: 'Total Empleados',
            color: 'Primary',
            icon: <Users size={20} />,
        },
        {
            value: stats.pendingEvals,
            label: 'Evaluaciones Pendientes',
            color: 'Amber',
            icon: <Clock size={20} />,
        },
        {
            value: stats.expiringContracts,
            label: 'Contratos por Vencer',
            color: 'Danger',
            icon: <AlertTriangle size={20} />,
        },
        {
            value: stats.pendingTraining,
            label: 'Planes Pendientes',
            color: 'Success',
            icon: <BookOpen size={20} />,
        },
    ];

    return (
        <div className={styles.statsGrid} role="region" aria-label="Indicadores clave">
            {items.map(({ value, label, color, icon }) => (
                <div
                    key={label}
                    className={`${styles.statCard} ${styles[`statCard${color}`]}`}
                >
                    <div className={`${styles.statIconWrap} ${styles[`statIconWrap${color}`]}`}>
                        {icon}
                    </div>
                    <div className={styles.statInfo}>
                        <div className={styles.statValue}>{value}</div>
                        <div className={styles.statLabel}>{label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Sub-componente: ScoreModal ────────────────────────────────────────────────
function ScoreModal({ item, evalKey, onClose, onSave }) {
    const [score, setScore] = useState(item?.evaluations?.[evalKey]?.score ?? '');
    const [notes, setNotes] = useState(item?.evaluations?.[evalKey]?.notes ?? '');
    const [saving, setSaving] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const evalDates = getEvalDates(item?.entryDate);
    const evalDate = evalDates[evalKey];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        await onSave(item.id, evalKey, score.trim(), notes.trim());
        setSaving(false);
        onClose();
    };

    const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

    return (
        <div className={styles.scoreOverlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
            <form className={styles.scoreModal} onSubmit={handleSubmit}>
                <h3 className={styles.scoreModalTitle}>
                    {EVAL_LABELS[evalKey]} — Calificación
                </h3>
                <p className={styles.scoreModalSub}>
                    {item?.name} · Fecha: {formatDate(evalDate)}
                </p>

                <div className={styles.scoreInputWrap}>
                    <label className={styles.fieldLabel}>Calificación obtenida</label>
                    <input
                        ref={inputRef}
                        type="text"
                        className={styles.scoreInput}
                        value={score}
                        onChange={e => setScore(e.target.value)}
                        placeholder="Ej. 87 o APROBADO"
                        required
                    />
                </div>

                <div className={styles.scoreInputWrap}>
                    <label className={styles.fieldLabel}>Observaciones (opcional)</label>
                    <textarea
                        className={styles.scoreNotesInput}
                        rows={2}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Notas del evaluador..."
                    />
                </div>

                <div className={styles.scoreModalBtns}>
                    <button type="button" onClick={onClose} className={styles.btnCancel}>
                        Cancelar
                    </button>
                    <button type="submit" disabled={!score.trim() || saving} className={styles.btnSave}>
                        <Save size={14} /> {saving ? 'Guardando…' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    );
}

// ── Sub-componente: ContratoModal (Crear/Editar) ──────────────────────────────
function ContratoModal({ initial, onClose, onSave }) {
    const [form, setForm] = useState(() => initial ?? { ...EMPTY_FORM });
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);

    // Vista previa de fechas de evaluación calculadas
    const evalDates = useMemo(() => getEvalDates(form.entryDate), [form.entryDate]);

    const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step === 1) {
            setStep(2);
            return;
        }
        setSaving(true);
        await onSave(form);
        setSaving(false);
        onClose();
    };

    const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

    const toggleTraining = () =>
        set('trainingPlan', form.trainingPlan === 'entregado' ? 'pendiente' : 'entregado');

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
                            <span className={styles.stepLabel}>Datos Generales</span>
                        </div>
                        <div className={styles.stepDivider} />
                        <div className={`${styles.stepIndicator} ${step >= 2 ? styles.stepActive : ''}`}>
                            <span className={styles.stepNum}>2</span>
                            <span className={styles.stepLabel}>Contrato y Formación</span>
                        </div>
                    </div>

                    <div className={styles.formGrid}>
                        {step === 1 && (
                            <>
                                {/* ID */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>No. Empleado *</label>
                                    <input
                                        required
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.employeeId}
                                        onChange={e => set('employeeId', e.target.value)}
                                        placeholder="Ej. 4041"
                                        disabled={!!initial}
                                    />
                                </div>

                                {/* Nombre */}
                                <div className={`${styles.fieldGroup} ${styles.formGridFull}`}>
                                    <label className={styles.fieldLabel}>Nombre Completo *</label>
                                    <input
                                        required
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.name}
                                        onChange={e => set('name', e.target.value)}
                                        placeholder="Ej. HERNANDEZ GARCIA JOVANIC TOMAS"
                                    />
                                </div>

                                {/* Puesto */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Puesto *</label>
                                    <input
                                        required
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.position}
                                        onChange={e => set('position', e.target.value)}
                                        placeholder="Ej. SUPERVISOR DE PRODUCCIÓN D"
                                    />
                                </div>

                                {/* Departamento */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Departamento *</label>
                                    <Select
                                        value={form.department}
                                        onChange={value => set('department', value)}
                                        options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
                                        placeholder="Seleccionar departamento..."
                                        className={styles.fieldSelect}
                                        aria-label="Seleccionar departamento"
                                    />
                                </div>

                                {/* Área */}
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

                                {/* Turno */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Turno</label>
                                    <Select
                                        value={form.shift || ''}
                                        onChange={value => set('shift', value)}
                                        options={[
                                            { value: '1', label: '1' },
                                            { value: '2', label: '2' },
                                            { value: '3', label: '3' },
                                            { value: '4', label: '4' },
                                            { value: 'Mixto', label: 'Mixto' },
                                        ]}
                                        placeholder="Seleccionar turno..."
                                        className={styles.fieldSelect}
                                        aria-label="Seleccionar turno"
                                    />
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                {/* Fecha ingreso */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Fecha de Ingreso *</label>
                                    <input
                                        required
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.entryDate}
                                        onChange={e => set('entryDate', e.target.value)}
                                        placeholder="DD/MM/YYYY"
                                        maxLength={10}
                                    />
                                    <span className={styles.fieldHint}>Formato: DD/MM/AAAA</span>
                                </div>

                                {/* Fecha fin de contrato */}
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Fin de Contrato *</label>
                                    <input
                                        required
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.contractEndDate}
                                        onChange={e => set('contractEndDate', e.target.value)}
                                        placeholder="DD/MM/YYYY"
                                        maxLength={10}
                                    />
                                </div>

                                {/* Vista previa fechas de evaluación */}
                                {evalDates.first && (
                                    <div className={`${styles.formGridFull}`}>
                                        <label className={styles.fieldLabel} style={{ marginBottom: 6, display: 'block' }}>
                                            Fechas de evaluación calculadas
                                        </label>
                                        <div className={styles.evalPreview}>
                                            {EVAL_KEYS.map(key => (
                                                <div key={key} className={styles.evalPreviewItem}>
                                                    <span className={styles.evalPreviewNum}>{EVAL_LABELS[key]}</span>
                                                    <span className={styles.evalPreviewDate}>
                                                        {formatDate(evalDates[key])}
                                                    </span>
                                                    <span className={styles.fieldHint}>+{EVAL_DAYS[key]}d</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Plan de formación */}
                                <div className={`${styles.fieldGroup} ${styles.formGridFull}`}>
                                    <div className={styles.trainingToggleRow}>
                                        <div>
                                            <div className={styles.trainingToggleLabel}>Plan de Formación</div>
                                            <div className={styles.trainingToggleSub}>
                                                Indica si el plan de formación fue entregado al empleado
                                            </div>
                                        </div>
                                        <TrainingBtn item={form} onToggle={toggleTraining} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className={styles.modalFooter}>
                        {step === 1 ? (
                            <>
                                <button type="button" onClick={onClose} className={styles.btnCancel}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.btnSave}>
                                    Siguiente
                                </button>
                            </>
                        ) : (
                            <>
                                <button type="button" onClick={() => setStep(1)} className={styles.btnCancel}>
                                    Atrás
                                </button>
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

// ── Componente principal ──────────────────────────────────────────────────────
export default function ContratosPage() {
    const { toast } = useToast();
    const { showConfirm, confirmDialog } = useConfirm();

    const [contratos, setContratos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterShift, setFilterShift] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [importLoading, setImportLoading] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    const [scoreModal, setScoreModal] = useState(null); // { item, evalKey }

    // ── Paginación local ──────────────────────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 30;

    const fileInputRef = useRef(null);

    // ── Suscripción Firestore ─────────────────────────────────────────────────
    useEffect(() => {
        const unsub = subscribeContratos((data) => {
            setContratos(data);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // ── Opciones para filtros ─────────────────────────────────────────────────
    const departments = useMemo(() =>
        [...new Set(contratos.map(c => c.department).filter(Boolean))].sort(),
        [contratos]);

    const shifts = useMemo(() =>
        [...new Set(contratos.map(c => c.shift).filter(Boolean))].sort(),
        [contratos]);

    // ── Filtrado y búsqueda ───────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        const today = new Date();

        return contratos
            .filter(c => {
                const matchSearch =
                    !q ||
                    c.name?.toLowerCase().includes(q) ||
                    c.employeeId?.includes(q) ||
                    c.position?.toLowerCase().includes(q) ||
                    c.department?.toLowerCase().includes(q);

                const matchDept = !filterDept || c.department === filterDept;
                const matchShift = !filterShift || c.shift === filterShift;

                let matchStatus = true;
                if (filterStatus === 'expiring') {
                    const cs = getContractStatus(c.contractEndDate, new Date(today));
                    matchStatus = cs === 'expiring' || cs === 'expired';
                } else if (filterStatus === 'pending_training') {
                    const st = getTrainingPlanStatus(c.entryDate, c.department, c.trainingPlan);
                    matchStatus = !st.isDelivered;
                } else if (filterStatus === 'pending_evals') {
                    const evalDates = getEvalDates(c.entryDate);
                    matchStatus = EVAL_KEYS.some(key => {
                        const { status } = getEvalStatus(evalDates[key], c.evaluations?.[key]?.score);
                        return status === 'upcoming' || status === 'overdue';
                    });
                }

                return matchSearch && matchDept && matchShift && matchStatus;
            })
            // Ordenar por employeeID de menor a mayor ascendente numéricamente
            .sort((a, b) => {
                const idA = parseInt(a.employeeId, 10) || 0;
                const idB = parseInt(b.employeeId, 10) || 0;
                if (idA !== idB) return idA - idB;
                // Si tienen el mismo ID falto (0), desempata por nombre
                return (a.name || '').localeCompare(b.name || '', 'es');
            });
    }, [contratos, search, filterDept, filterShift, filterStatus]);

    // Calcular la lista de página actual
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filtered.slice(start, start + ITEMS_PER_PAGE);
    }, [filtered, currentPage]);

    // Resetear a pág 1 si cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [search, filterDept, filterStatus, contratos.length]);

    // ── Acciones ──────────────────────────────────────────────────────────────
    const handleImportJSON = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportLoading(true);
        try {
            const text = await file.text();
            const arr = JSON.parse(text);
            if (!Array.isArray(arr)) throw new Error('El archivo debe ser un array JSON.');
            await bulkImportContratos(arr);
            toast.success(`${arr.length} registros importados correctamente.`);
        } catch (err) {
            console.error(err);
            toast.error(`Error al importar: ${err.message}`);
        } finally {
            setImportLoading(false);
            e.target.value = '';
        }
    }, [toast]);

    const handleSave = useCallback(async (formData) => {
        try {
            if (editingItem) {
                await updateContrato(editingItem.id, formData);
                toast.success('Empleado actualizado.');
            } else {
                await createContrato(formData);
                toast.success('Empleado registrado.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar.');
        }
        setEditingItem(null);
        setShowModal(false);
    }, [editingItem, toast]);

    const handleDelete = useCallback(async (item) => {
        const ok = await showConfirm(`¿Eliminar el registro de ${item.name}?`, {
            confirmLabel: 'Eliminar',
            title: 'Confirmar eliminación',
            danger: true,
        });
        if (!ok) return;
        try {
            await deleteContrato(item.id);
            toast.success('Registro eliminado.');
        } catch {
            toast.error('No se pudo eliminar.');
        }
    }, [showConfirm, toast]);

    const handleEdit = useCallback((item) => {
        setEditingItem(item);
        setShowModal(true);
    }, []);

    const handleToggleTraining = useCallback(async (item) => {
        setTogglingId(item.id);
        const newVal = item.trainingPlan === 'entregado' ? 'pendiente' : 'entregado';
        try {
            await updateContrato(item.id, { trainingPlan: newVal });
        } catch {
            toast.error('No se pudo actualizar el plan de formación.');
        } finally {
            setTogglingId(null);
        }
    }, [toast]);

    const handleScoreSave = useCallback(async (id, evalKey, score, notes) => {
        try {
            await updateContrato(id, {
                [`evaluations.${evalKey}.score`]: score,
                [`evaluations.${evalKey}.notes`]: notes,
                [`evaluations.${evalKey}.savedAt`]: new Date().toISOString(),
            });
            toast.success('Calificación guardada.');
        } catch {
            toast.error('No se pudo guardar la calificación.');
        }
    }, [toast]);

    const openNew = useCallback(() => {
        setEditingItem(null);
        setShowModal(true);
    }, []);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <AdminLayout title="Contratos">
            {confirmDialog}
            <main className={styles.page} id="main-content">

                {/* KPIs */}
                <StatsBar contratos={contratos} />

                {/* Toolbar */}
                <div className={styles.toolbar} role="toolbar" aria-label="Acciones y filtros">
                    <div className={styles.filters}>
                        {/* Búsqueda */}
                        <div className={styles.searchBox}>
                            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
                            <input
                                type="search"
                                className={styles.searchInput}
                                placeholder="Busqueda"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                aria-label="Buscar empleado"
                            />
                        </div>

                        {/* Filtro departamento */}
                        <Select
                            value={filterDept}
                            onChange={value => setFilterDept(value)}
                            options={[{ value: '', label: 'Departamento' }, ...departments.map(d => ({ value: d, label: d }))]}
                            className={styles.filterSelect}
                            aria-label="Filtrar por departamento"
                        />

                        {/* Filtro estado */}
                        <Select
                            value={filterStatus}
                            onChange={value => setFilterStatus(value)}
                            options={[
                                { value: '', label: 'Estado' },
                                { value: 'pending_training', label: 'PLAN PENDIENTE' },
                                { value: 'pending_evals', label: 'EVALUACIONES PENDIENTES' },
                                { value: 'expiring', label: 'CONTRATO POR VENCER' },
                            ]}
                            className={styles.filterSelect}
                            aria-label="Filtrar por estado"
                        />

                        {/* Filtro turno */}
                        <Select
                            value={filterShift}
                            onChange={value => setFilterShift(value)}
                            options={[{ value: '', label: 'Turno' }, ...shifts.map(s => ({ value: s, label: s }))]}
                            className={styles.filterSelect}
                            aria-label="Filtrar por turno"
                        />
                    </div>

                    {/* Botones de acción */}
                    <div className={styles.toolbarActions}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            className={styles.fileInput}
                            onChange={handleImportJSON}
                            aria-label="Importar"
                        />
                        <button
                            className={styles.btnImport}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={importLoading}
                            title="Importar empleados desde archivo .json"
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
                            Cargando registros…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Users size={48} className={styles.emptyIcon} aria-hidden="true" />
                            <p className={styles.emptyTitle}>
                                {contratos.length === 0 ? 'Sin registros aún' : 'Sin resultados'}
                            </p>
                            <p className={styles.emptyDesc}>
                                {contratos.length === 0
                                    ? 'Importa un archivo .json o registra el primer empleado manualmente.'
                                    : 'Prueba ajustando la búsqueda o los filtros.'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className={styles.tableScroll}>
                            <table className={styles.table} aria-label="Tabla de contratos y evaluaciones">
                                <thead>
                                    <tr>
                                        <th>Empleado</th>
                                        <th>Puesto / Área</th>
                                        <th style={{ textAlign: 'center' }}>Turno</th>
                                        <th>F. Ingreso</th>
                                        <th style={{ textAlign: 'center' }}>1ª Eval</th>
                                        <th style={{ textAlign: 'center' }}>2ª Eval</th>
                                        <th style={{ textAlign: 'center' }}>3ª Eval</th>
                                        <th>F. Contrato</th>
                                        <th>RG-REC-048</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.map(item => {
                                        const evalDates = getEvalDates(item.entryDate);
                                        const contractSt = getContractStatus(item.contractEndDate);
                                        const dateClass = contractSt === 'expiring' ? styles.dateExpiring
                                            : contractSt === 'expired' ? styles.dateExpired
                                                : '';
                                        return (
                                            <tr key={item.id} className={styles.tableRow}>
                                                {/* Empleado */}
                                                <td className={styles.empCell}>
                                                    <div className={styles.empName}>{formatFullName(item.name) || '—'}</div>
                                                    <div className={styles.empId}>#{item.employeeId}</div>
                                                </td>

                                                {/* Puesto */}
                                                <td className={styles.posCell}>
                                                    <div className={styles.posName}>{item.position}</div>
                                                    <div className={styles.posDept}>{item.department}{item.area ? ` · ${item.area}` : ''}</div>
                                                </td>

                                                {/* Turno */}
                                                <td style={{ textAlign: 'center', fontWeight: '500', color: 'var(--c-ink)' }}>
                                                    {item.shift || '—'}
                                                </td>

                                                {/* Fecha ingreso */}
                                                <td className={styles.dateCell}>{item.entryDate || '—'}</td>

                                                {/* Evaluaciones */}
                                                {EVAL_KEYS.map(key => (
                                                    <td key={key} className={styles.evalCell}>
                                                        <span className={styles.evalDate}>{formatDate(evalDates[key])}</span>
                                                        <EvalChip
                                                            evalDate={evalDates[key]}
                                                            score={item.evaluations?.[key]?.score}
                                                            label={EVAL_LABELS[key]}
                                                            onClick={() => setScoreModal({ item, evalKey: key })}
                                                        />
                                                    </td>
                                                ))}

                                                {/* Vencimiento contrato */}
                                                <td className={`${styles.dateCell} ${dateClass}`}>
                                                    {item.contractEndDate || '—'}
                                                </td>

                                                {/* Plan de formación */}
                                                <td>
                                                    <TrainingBtn
                                                        item={item}
                                                        onToggle={() => handleToggleTraining(item)}
                                                        disabled={togglingId === item.id}
                                                    />
                                                </td>

                                                {/* Acciones */}
                                                <td>
                                                    <div className={styles.actionsCell}>
                                                        <button
                                                            className={`${styles.iconBtn} ${styles.iconBtnAmber}`}
                                                            onClick={() => handleEdit(item)}
                                                            title="Editar"
                                                            type="button"
                                                            aria-label={`Editar ${item.name}`}
                                                        >
                                                            <Edit2 size={13} />
                                                        </button>
                                                        <button
                                                            className={`${styles.iconBtn} ${styles.iconBtnRed}`}
                                                            onClick={() => handleDelete(item)}
                                                            title="Eliminar"
                                                            type="button"
                                                            aria-label={`Eliminar ${item.name}`}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── VISTA MOBILE — Cards ── */}
                <div className={`${styles.cardList} ${styles.cardsView}`}>
                    {loading ? (
                        <div className={styles.loadingRow} role="status">
                            <span className={styles.spinner} aria-hidden="true" />
                            Cargando…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Users size={40} className={styles.emptyIcon} />
                            <p className={styles.emptyTitle}>Sin registros</p>
                            <p className={styles.emptyDesc}>Importa un .json o crea un empleado con el botón +.</p>
                        </div>
                    ) : paginated.map(item => {
                        const evalDates = getEvalDates(item.entryDate);
                        const contractSt = getContractStatus(item.contractEndDate);
                        const cardBorder = contractSt === 'expiring' ? styles.contractCardBorderExpiring
                            : contractSt === 'expired' ? styles.contractCardBorderExpired
                                : '';
                        return (
                            <div key={item.id} className={`${styles.contractCard} ${cardBorder}`}>
                                <div className={styles.cardTop}>
                                    <div className={styles.cardEmployeeInfo}>
                                        <div className={styles.cardName}>{formatFullName(item.name)}</div>
                                        <div className={styles.cardIdPos}>
                                            <span>#{item.employeeId}</span>
                                            <span className={styles.cardIdDot} />
                                            <span>{item.position}</span>
                                        </div>
                                    </div>
                                    <div className={styles.cardActions}>
                                        <button
                                            className={`${styles.iconBtn} ${styles.iconBtnAmber}`}
                                            onClick={() => handleEdit(item)}
                                            title="Editar"
                                            type="button"
                                        >
                                            <Edit2 size={13} />
                                        </button>
                                        <button
                                            className={`${styles.iconBtn} ${styles.iconBtnRed}`}
                                            onClick={() => handleDelete(item)}
                                            title="Eliminar"
                                            type="button"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.cardDivider} />

                                <div className={styles.cardBottom}>
                                    {/* Fechas */}
                                    <div className={styles.cardDates}>
                                        <div className={styles.cardDateItem}>
                                            <span className={styles.cardDateLabel}>F. Ingreso</span>
                                            <span className={styles.cardDateValue}>{item.entryDate || '—'}</span>
                                        </div>
                                        <div className={styles.cardDateItem}>
                                            <span className={styles.cardDateLabel}>F. Contrato</span>
                                            <span className={`${styles.cardDateValue} ${contractSt === 'expiring' ? styles.dateExpiring : contractSt === 'expired' ? styles.dateExpired : ''}`}>
                                                {item.contractEndDate || '—'}
                                            </span>
                                        </div>
                                        <div className={styles.cardDateItem}>
                                            <span className={styles.cardDateLabel}>Área</span>
                                            <span className={styles.cardDateValue}>{item.department || '—'}</span>
                                        </div>
                                        <div className={styles.cardDateItem}>
                                            <span className={styles.cardDateLabel}>Turno</span>
                                            <span className={styles.cardDateValue} style={{ color: 'var(--c-ink)', fontWeight: 600 }}>
                                                {item.shift || '—'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Evaluaciones */}
                                    <div className={styles.cardEvalsRow}>
                                        <span className={styles.cardEvalsLabel}>Evals:</span>
                                        {EVAL_KEYS.map(key => (
                                            <div key={key} className={styles.cardEvalItem}>
                                                <span className={styles.cardEvalNum}>{EVAL_LABELS[key]}</span>
                                                <EvalChip
                                                    evalDate={evalDates[key]}
                                                    score={item.evaluations?.[key]?.score}
                                                    label={EVAL_LABELS[key]}
                                                    onClick={() => setScoreModal({ item, evalKey: key })}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Plan de formación */}
                                    <div className={styles.cardTrainingRow}>
                                        <span className={styles.cardTrainingLabel}>RG-REC-048</span>
                                        <TrainingBtn
                                            item={item}
                                            onToggle={() => handleToggleTraining(item)}
                                            disabled={togglingId === item.id}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ── CONTROLES DE PAGINACIÓN ── */}
                {!loading && filtered.length > 0 && (
                    <div className={styles.pagination}>
                        <div className={styles.paginationInfo}>
                            Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
                        </div>
                        <div className={styles.paginationControls}>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                type="button"
                                aria-label="Página anterior"
                            >
                                Anterior
                            </button>
                            <span className={styles.pageCurrent}>
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                type="button"
                                aria-label="Página siguiente"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}

                {/* Modal crear/editar */}
                {showModal && (
                    <ContratoModal
                        initial={editingItem}
                        onClose={() => { setShowModal(false); setEditingItem(null); }}
                        onSave={handleSave}
                    />
                )}

                {/* Modal calificación */}
                {scoreModal && (
                    <ScoreModal
                        item={scoreModal.item}
                        evalKey={scoreModal.evalKey}
                        onClose={() => setScoreModal(null)}
                        onSave={handleScoreSave}
                    />
                )}
            </main>
        </AdminLayout>
    );
}
