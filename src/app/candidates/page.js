'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast/Toast';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/Drawer/Drawer';
import styles from './page.module.css';
import {
    Search, Users, CheckCircle2, Clock, AlertTriangle, MessageCircle,
    Key, ChevronRight, Bell, RefreshCw, X, Send,
} from 'lucide-react';
import CandidateDrawer from '@/components/features/Dashboard/CandidateDrawer';
import { useConfirm } from '@/hooks/useConfirm';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { Select } from '@/components/ui/Select/Select';

// ── Data fetching ──────────────────────────────────────────────────────────────
function useDataFetching() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [coursesMapRef, setCoursesMapRef] = useState({});

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            setError(null);

            const [employeesSnap, coursesSnap, positionsSnap, legacyCoursesSnap, nuevaCursosSnap] = await Promise.allSettled([
                getDocs(collection(db, 'employees')),
                getDocs(collection(db, 'induction_courses')),
                getDocs(collection(db, 'positions')),
                getDocs(collection(db, 'cursos_induccion')).catch(() => ({ docs: [] })),
                getDocs(collection(db, 'cursos')).catch(() => ({ docs: [] })),
            ]);

            const rawCandidates = employeesSnap.status === 'fulfilled'
                ? employeesSnap.value.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(emp => emp.status === 'Candidato' || emp.isCandidato === true)
                : [];

            const coursesMap = {};
            if (coursesSnap.status === 'fulfilled') {
                coursesSnap.value.docs.forEach(d => {
                    const cd = d.data();
                    if (cd.activo !== false) {
                        coursesMap[d.id] = { id: d.id, name: cd.title || cd.nombre || 'Sin nombre', ...cd };
                    }
                });
            }
            if (legacyCoursesSnap.status === 'fulfilled') {
                legacyCoursesSnap.value.docs.forEach(d => {
                    const cd = d.data();
                    if (cd.activo !== false && !coursesMap[cd.id] && !coursesMap[cd.nombre]) {
                        coursesMap[d.id] = { id: d.id, name: cd.nombre, ...cd };
                    }
                });
            }
            if (nuevaCursosSnap.status === 'fulfilled') {
                nuevaCursosSnap.value.docs.forEach(d => {
                    const cd = d.data();
                    const isActive = cd.tipo === 'link' ? cd.activo !== false : cd.published === true;
                    if (isActive && !coursesMap[d.id]) {
                        coursesMap[d.id] = { id: d.id, name: cd.title || cd.nombre || 'Sin nombre', ...cd };
                    }
                });
            }
            setCoursesMapRef(coursesMap);

            const positionRequirements = {};
            if (positionsSnap.status === 'fulfilled') {
                positionsSnap.value.docs.forEach(d => {
                    const p = d.data();
                    if (p.name) positionRequirements[p.name] = p.requiredCourses || [];
                });
            }

            const calcDaysSince = (dateStr) => {
                if (!dateStr || dateStr === 'Nunca') return null;
                try {
                    const diff = Math.abs(new Date() - new Date(dateStr));
                    return Math.floor(diff / (1000 * 60 * 60 * 24));
                } catch { return null; }
            };

            const finalCandidates = rawCandidates.map(c => {
                const position = c.position;
                const requiredCourseTitles = positionRequirements[position] || [];
                const requiredCourseIds = [];
                requiredCourseTitles.forEach(title => {
                    const found = Object.values(coursesMap).find(course =>
                        course.name === title || course.title === title
                    );
                    if (found) requiredCourseIds.push(found.id);
                });
                if (requiredCourseIds.length === 0) {
                    Object.values(coursesMap).forEach(course => {
                        if (course.puestosAplicables?.includes(position) && !requiredCourseIds.includes(course.id)) {
                            requiredCourseIds.push(course.id);
                        }
                    });
                }

                const completedIds = c.cursosCompletados || [];
                const totalRequired = requiredCourseIds.length;
                const completedRequiredCount = requiredCourseIds.filter(id => completedIds.includes(id)).length;
                const progress = totalRequired > 0 ? Math.round((completedRequiredCount / totalRequired) * 100) : 0;

                const progressMap = c.coursesProgress || {};
                const presentationsViewed = Object.values(progressMap).filter(p => p.presentationCompleted).length;

                const daysIdle = calcDaysSince(c.lastLoginCandidate);
                const isInactive = daysIdle !== null && daysIdle > 2;

                let status = 'notStarted';
                if (progress >= 100) status = 'completed';
                else if (progress > 0 || Object.keys(progressMap).length > 0) status = 'inProgress';
                if (isInactive && status !== 'completed') status = 'inactive';

                let lastLoginDisplay = 'Nunca';
                if (c.lastLoginCandidate) {
                    if (daysIdle === 0) lastLoginDisplay = 'Hoy';
                    else if (daysIdle === 1) lastLoginDisplay = 'Hace 1 día';
                    else if (daysIdle !== null) lastLoginDisplay = `Hace ${daysIdle} días`;
                    else lastLoginDisplay = new Date(c.lastLoginCandidate).toLocaleDateString();
                }

                return {
                    ...c,
                    name: c.name || c.nombre || 'Sin Nombre',
                    email: c.email || 'N/A',
                    position: position || 'N/A',
                    requiredCount: totalRequired,
                    completedCount: completedRequiredCount,
                    progress,
                    presentationsViewed,
                    status,
                    daysSinceLastLogin: daysIdle,
                    lastLogin: lastLoginDisplay,
                    requiredCourseIds,
                    accessCode: c.accessCode || '-',
                    accessCodeUses: c.accessCodeUses || 0,
                };
            });

            setCandidates(finalCandidates);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Error al cargar los datos. Intenta de nuevo.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    return { loading, error, candidates, setCandidates, coursesMapRef, fetchData };
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getDeadlineInfo(candidate) {
    if (!candidate) return null;
    try {
        let deadline;
        if (candidate.fechaLimite) {
            deadline = new Date(candidate.fechaLimite);
        } else {
            const baseDateRaw = candidate.startDate || candidate.fechaIngreso || candidate.createdAt;
            if (!baseDateRaw) return null;
            const baseStr = String(baseDateRaw);
            let start;
            if (baseStr.includes('T')) start = new Date(baseDateRaw);
            else if (baseStr.match(/^\d{4}-\d{2}-\d{2}$/)) start = new Date(`${baseStr}T00:00:00`);
            else start = new Date(baseDateRaw);
            if (isNaN(start.getTime())) return null;
            deadline = new Date(start.getTime());
            deadline.setDate(deadline.getDate() + 3);
            deadline.setHours(23, 59, 59, 0);
        }
        if (isNaN(deadline.getTime())) return null;
        const diffMs = deadline - new Date();
        if (diffMs <= 0) return { daysLeft: 0, hoursLeft: 0, isExpired: true, isUrgent: true, label: 'Vencido' };
        const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const isUrgent = daysLeft < 2;
        const label = daysLeft === 0 ? `${hoursLeft}h` : daysLeft === 1 ? `1d ${hoursLeft}h` : `${daysLeft}d ${hoursLeft}h`;
        return { daysLeft, hoursLeft, isExpired: false, isUrgent, label, deadlineDate: deadline };
    } catch { return null; }
}

function formatDisplayName(fullName) {
    if (!fullName) return 'Colaborador';
    const connectors = new Set(['de', 'la', 'las', 'los', 'del', 'y', 'van', 'von', 'san', 'santa']);
    return fullName.trim().split(/\s+/).filter(Boolean).map((w, i) =>
        i === 0 || !connectors.has(w.toLowerCase())
            ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
            : w.toLowerCase()
    ).join(' ');
}

function getInitials(name) {
    if (!name) return '?';
    const words = formatDisplayName(name)
        .split(' ')
        .filter(w => !['de', 'la', 'las', 'los', 'del', 'y'].includes(w.toLowerCase()));
    if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    return (words[0] || 'X').slice(0, 2).toUpperCase();
}

// ── Plantillas WhatsApp ────────────────────────────────────────────────────────
const MESSAGE_TEMPLATES = [
    {
        id: 'welcome', title: 'Bienvenida',
        message: (name, c) =>
            `¡Bienvenido/a ${name}!\n\nPara comenzar tu capacitación, ingresa a la plataforma:\n\n*https://vertxk.xyz/*\n\nDirígete a la *sección de candidatos* e ingresa:\n\n*Número de empleado:* ${c?.employeeId || '—'}\n*CURP:* ${c?.curp || '—'}\n*Código de acceso:* ${c?.accessCode || '-'}\n\n*_Capacitación ViñoPlastic_*`
    },
    {
        id: 'progress_check', title: 'Revisión de Progreso',
        message: (name, c) =>
            `Hola ${name}\n\nLlevas un avance del *${c?.progress ?? 0}%* en tu capacitación. ¿Tienes alguna duda?\n\n_*Capacitación ViñoPlastic_*`
    },
    {
        id: 'inactive_alert', title: 'Inactividad',
        message: (name, c) => {
            const dias = c?.daysSinceLastLogin;
            const cuanto = dias === 1 ? '1 día' : dias ? `${dias} días` : 'varios días';
            return `Hola ${name},\n\nLlevo *${cuanto}* sin verte en la plataforma. Recuerda completar tus cursos a tiempo.\n\n¿Necesitas ayuda?\n\n_*Capacitación ViñoPlastic_*`;
        }
    },
    {
        id: 'completion_reminder', title: 'Tiempo Límite',
        message: (name, candidate) => {
            const dl = candidate ? getDeadlineInfo(candidate) : null;
            const tiempo = dl
                ? dl.isExpired ? 'tu plazo *ya venció*'
                    : dl.daysLeft === 0 ? `solo te quedan *${dl.hoursLeft} horas*`
                        : `te quedan *${dl.daysLeft} días y ${dl.hoursLeft} horas*`
                : 'el tiempo es limitado';
            return `Hola ${name}\n\nRecuerda que ${tiempo} para completar tu capacitación.\n\n*Capacitación ViñoPlastic*`;
        }
    },
    {
        id: 'support_offer', title: 'Apoyo',
        message: (name) =>
            `Hola ${name},\n\nSi tienes dudas sobre los cursos o el acceso a la plataforma, escríbeme. Estoy disponible de 8:00 a 17:00 h.\n\n_ViñoPlastic_`
    },
];

// ── StatsBar ───────────────────────────────────────────────────────────────────
function StatsBar({ stats }) {
    const items = [
        { value: stats.total, label: 'Total Candidatos', color: 'Primary', icon: <Users size={20} /> },
        { value: stats.completed, label: 'Completados', color: 'Success', icon: <CheckCircle2 size={20} /> },
        { value: stats.inProgress, label: 'En Proceso', color: 'Amber', icon: <Clock size={20} /> },
        { value: stats.inactive, label: 'Sin Actividad', color: 'Danger', icon: <AlertTriangle size={20} /> },
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

// ── DeadlineChip ───────────────────────────────────────────────────────────────
function DeadlineChip({ candidate }) {
    const dl = getDeadlineInfo(candidate);
    if (!dl || candidate.status === 'completed') return <span />;

    const cls = dl.isExpired ? styles.deadlineExpired
        : dl.isUrgent ? styles.deadlineUrgent
            : styles.deadlineOk;

    return (
        <span className={`${styles.deadlineChip} ${cls}`}>
            <Clock size={11} aria-hidden="true" />
            {dl.label}
        </span>
    );
}

// ── StatusBadge ────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const map = {
        completed: { label: 'Completado', cls: styles.statusCompleted },
        inProgress: { label: 'En Proceso', cls: styles.statusInProgress },
        inactive: { label: 'Inactivo', cls: styles.statusInactive },
        notStarted: { label: 'Sin Iniciar', cls: styles.statusNotStarted },
    };
    const { label, cls } = map[status] ?? { label: status, cls: '' };
    return <span className={`${styles.statusBadge} ${cls}`}>{label}</span>;
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function CandidateMonitoringPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { showConfirm, confirmDialog } = useConfirm();
    const { toast } = useToast();
    const firstTemplateRef = useRef(null);

    const { loading, error, candidates, setCandidates, coursesMapRef, fetchData } = useDataFetching();

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [whatsappModal, setWhatsappModal] = useState({ isOpen: false, candidate: null });
    const [selectedTemplate, setSelectedTemplate] = useState(MESSAGE_TEMPLATES[0]);
    const [quickDrawerOpen, setQuickDrawerOpen] = useState(false);
    const [quickDrawerCandidate, setQuickDrawerCandidate] = useState(null);
    const [quickDrawerTab, setQuickDrawerTab] = useState('perfil');

    // ── Stats ──────────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const active = candidates.filter(c => !c.isArchived);
        return {
            total: active.length,
            completed: active.filter(c => c.status === 'completed').length,
            inProgress: active.filter(c => c.status === 'inProgress').length,
            inactive: active.filter(c => c.status === 'inactive').length,
            avgProgress: active.length > 0
                ? Math.round(active.reduce((s, c) => s + c.progress, 0) / active.length)
                : 0,
        };
    }, [candidates]);

    // ── Filtrado ───────────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return candidates.filter(c => {
            const matchSearch = !q
                || c.name.toLowerCase().includes(q)
                || c.position.toLowerCase().includes(q)
                || c.employeeId?.toLowerCase().includes(q);

            const isArchived = c.isArchived === true;
            let matchStatus = false;
            if (statusFilter === 'archived') {
                matchStatus = isArchived;
            } else {
                if (isArchived) return false;
                matchStatus = statusFilter === 'all' || c.status === statusFilter;
            }
            return matchSearch && matchStatus;
        });
    }, [candidates, search, statusFilter]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleCardClick = useCallback((candidate) => {
        setQuickDrawerCandidate(candidate);
        setQuickDrawerTab('perfil');
        setQuickDrawerOpen(true);
    }, []);

    const handleWhatsApp = useCallback((candidate, e) => {
        e?.stopPropagation();
        setWhatsappModal({ isOpen: true, candidate });
        setSelectedTemplate(MESSAGE_TEMPLATES[0]);
    }, []);

    const sendWhatsApp = useCallback((template) => {
        if (!whatsappModal.candidate) return;
        const { phone } = whatsappModal.candidate;
        if (!phone) {
            toast.warning('Sin número de teléfono registrado.');
            return;
        }
        const cleanPhone = phone.replace(/\D/g, '');
        const message = template.message(
            formatDisplayName(whatsappModal.candidate.name),
            whatsappModal.candidate
        );
        const link = document.createElement('a');
        link.href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Mensaje abierto en WhatsApp para ${formatDisplayName(whatsappModal.candidate.name)}`);
        setWhatsappModal({ isOpen: false, candidate: null });
    }, [whatsappModal.candidate, toast]);

    const handleArchive = useCallback(async (candidate) => {
        const action = candidate.isArchived ? 'restaurar' : 'archivar';
        if (!await showConfirm(`¿${action} a ${formatDisplayName(candidate.name)}?`, {
            title: 'Confirmar Acción', confirmLabel: 'Aceptar',
        })) return;
        try {
            await updateDoc(doc(db, 'employees', candidate.id), {
                isArchived: !candidate.isArchived,
                archivedAt: !candidate.isArchived ? new Date().toISOString() : null,
            });
            fetchData();
            setIsDrawerOpen(false);
        } catch {
            toast.error('Error al actualizar el candidato.');
        }
    }, [fetchData, showConfirm, toast]);

    const handleReopenDeadline = useCallback(async (candidate, extraDays = 3) => {
        if (!await showConfirm(
            `¿Extender el tiempo de ${formatDisplayName(candidate.name)} por ${extraDays} día${extraDays > 1 ? 's' : ''}?`,
            { title: 'Reabrir Plazo', confirmLabel: `Extender ${extraDays}d` }
        )) return;
        try {
            const dlInfo = getDeadlineInfo(candidate);
            let start = new Date();
            if (dlInfo && !dlInfo.isExpired && dlInfo.deadlineDate) start = new Date(dlInfo.deadlineDate.getTime());
            const newDeadline = new Date(start.getTime());
            newDeadline.setDate(newDeadline.getDate() + extraDays);
            newDeadline.setHours(23, 59, 59, 0);
            const iso = newDeadline.toISOString();
            await updateDoc(doc(db, 'employees', candidate.id), { fechaLimite: iso });
            setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, fechaLimite: iso } : c));
            toast.success(`Plazo extendido ${extraDays} días.`);
            setQuickDrawerOpen(false);
            fetchData(true);
        } catch {
            toast.error('Error al extender el plazo.');
        }
    }, [showConfirm, toast, setCandidates, fetchData]);

    // Escape key para WhatsApp modal
    useEffect(() => {
        if (!whatsappModal.isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') setWhatsappModal({ isOpen: false, candidate: null }); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [whatsappModal.isOpen]);

    useEffect(() => {
        if (whatsappModal.isOpen && firstTemplateRef.current) firstTemplateRef.current.focus();
    }, [whatsappModal.isOpen]);

    // Auth
    useEffect(() => {
        if (!authLoading) {
            if (!user) router.push('/login');
            else if (!['admin', 'super_admin', 'rh', 'instructor'].includes(user.rol)) router.push('/dashboard');
            else fetchData();
        }
    }, [user, authLoading, router, fetchData]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <AdminLayout title="Candidatos en Capacitación">
            {confirmDialog}
            <main className={styles.page} id="main-content">

                <StatsBar stats={stats} />

                {/* Toolbar */}
                <div className={styles.toolbar} role="toolbar" aria-label="Filtros y acciones">
                    <div className={styles.filters}>
                        <div className={styles.searchBox}>
                            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
                            <input
                                type="search"
                                className={styles.searchInput}
                                placeholder="BUSCAR..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                aria-label="Buscar candidato"
                            />
                        </div>

                        <Select
                            value={statusFilter}
                            onChange={value => setStatusFilter(value)}
                            options={[
                                { value: 'all', label: 'TODOS' },
                                { value: 'completed', label: 'COMPLETADOS' },
                                { value: 'inProgress', label: 'EN PROCESO' },
                                { value: 'inactive', label: 'INACTIVOS' },
                                { value: 'notStarted', label: 'SIN INICIAR' },
                                { value: 'archived', label: 'ARCHIVADOS' },
                            ]}
                            className={styles.filterSelect}
                            aria-label="Filtrar por estatus"
                        />
                    </div>

                    <div className={styles.toolbarActions}>
                        <button
                            className={styles.btnOutline}
                            onClick={() => fetchData()}
                            disabled={loading}
                            title="Actualizar datos"
                            type="button"
                        >
                            <RefreshCw size={15} />
                        </button>
                    </div>
                </div>

                {/* ── VISTA DESKTOP — Tabla ── */}
                <div className={`${styles.tableContainer} ${styles.tableView}`}>
                    {loading ? (
                        <div className={styles.loadingRow} role="status">
                            <span className={styles.spinner} aria-hidden="true" />
                            Cargando candidatos…
                        </div>
                    ) : error ? (
                        <div className={styles.emptyState}>
                            <AlertTriangle size={40} className={styles.emptyIcon} />
                            <p className={styles.emptyTitle}>Error al cargar</p>
                            <p className={styles.emptyDesc}>{error}</p>
                            <button className={styles.btnOutline} onClick={() => fetchData()} style={{ marginTop: 8 }}>
                                Reintentar
                            </button>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Users size={48} className={styles.emptyIcon} aria-hidden="true" />
                            <p className={styles.emptyTitle}>Sin candidatos</p>
                            <p className={styles.emptyDesc}>
                                {candidates.length === 0
                                    ? 'No hay candidatos registrados aún.'
                                    : 'Ajusta la búsqueda o el filtro.'}
                            </p>
                        </div>
                    ) : (
                        <div className={styles.tableScroll}>
                            <table className={styles.table} aria-label="Lista de candidatos">
                                <thead>
                                    <tr>
                                        <th style={{ width: 52 }}></th>
                                        <th>Candidato</th>
                                        <th>Puesto</th>
                                        <th>Progreso</th>
                                        <th>Estatus</th>
                                        <th>Tiempo</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(candidate => (
                                        <tr
                                            key={candidate.id}
                                            className={styles.tableRow}
                                            onClick={() => handleCardClick(candidate)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>
                                                <div className={`${styles.avatarCell} ${styles[`avatar_${candidate.status}`]}`}>
                                                    {getInitials(candidate.name)}
                                                </div>
                                            </td>
                                            <td className={styles.empCell}>
                                                <div className={styles.empName}>{formatDisplayName(candidate.name)}</div>
                                                <div className={styles.empId}>#{candidate.employeeId || candidate.id}</div>
                                            </td>
                                            <td className={styles.posCell}>
                                                <div className={styles.posName}>{candidate.position || '—'}</div>
                                                {candidate.department && (
                                                    <div className={styles.posDept}>{candidate.department}</div>
                                                )}
                                            </td>
                                            <td className={styles.progressCell}>
                                                <div className={styles.progressBar}>
                                                    <div
                                                        className={`${styles.progressFill} ${candidate.progress >= 100 ? styles.progressComplete : ''}`}
                                                        style={{ width: `${candidate.progress}%` }}
                                                    />
                                                </div>
                                                <span className={styles.progressText}>
                                                    {candidate.completedCount}/{candidate.requiredCount}
                                                </span>
                                            </td>
                                            <td>
                                                <StatusBadge status={candidate.status} />
                                            </td>
                                            <td>
                                                <DeadlineChip candidate={candidate} />
                                            </td>
                                            <td onClick={e => e.stopPropagation()}>
                                                <div className={styles.actionsCell}>
                                                    <button
                                                        className={`${styles.iconBtn} ${styles.iconBtnGreen}`}
                                                        onClick={() => handleWhatsApp(candidate)}
                                                        title="WhatsApp"
                                                        type="button"
                                                        disabled={!candidate.phone}
                                                        aria-label={`WhatsApp a ${candidate.name}`}
                                                    >
                                                        <MessageCircle size={13} />
                                                    </button>
                                                    <button
                                                        className={`${styles.iconBtn} ${styles.iconBtnBlue}`}
                                                        onClick={() => handleCardClick(candidate)}
                                                        title="Ver detalles"
                                                        type="button"
                                                        aria-label={`Ver ${candidate.name}`}
                                                    >
                                                        <ChevronRight size={13} />
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
                        <div className={styles.loadingRow}><span className={styles.spinner} /> Cargando…</div>
                    ) : filtered.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Users size={40} className={styles.emptyIcon} />
                            <p className={styles.emptyTitle}>Sin candidatos</p>
                        </div>
                    ) : filtered.map(candidate => (
                        <div
                            key={candidate.id}
                            className={styles.candidateCard}
                            onClick={() => handleCardClick(candidate)}
                        >
                            <div className={styles.cardTop}>
                                <div className={`${styles.avatarCellLg} ${styles[`avatar_${candidate.status}`]}`}>
                                    {getInitials(candidate.name)}
                                </div>
                                <div className={styles.cardEmployeeInfo}>
                                    <div className={styles.cardName}>{formatDisplayName(candidate.name)}</div>
                                    <div className={styles.cardIdPos}>
                                        <span>#{candidate.employeeId}</span>
                                        <span className={styles.cardIdDot} />
                                        <span>{candidate.position || '—'}</span>
                                    </div>
                                </div>
                                <button
                                    className={`${styles.iconBtn} ${styles.iconBtnGreen}`}
                                    onClick={e => handleWhatsApp(candidate, e)}
                                    disabled={!candidate.phone}
                                    title="WhatsApp"
                                    type="button"
                                >
                                    <MessageCircle size={13} />
                                </button>
                            </div>

                            <div className={styles.cardDivider} />

                            <div className={styles.cardBottom}>
                                <div className={styles.progressBarCard}>
                                    <div className={styles.progressBarCardTrack}>
                                        <div
                                            className={`${styles.progressFill} ${candidate.progress >= 100 ? styles.progressComplete : ''}`}
                                            style={{ width: `${candidate.progress}%` }}
                                        />
                                    </div>
                                    <span className={styles.progressText}>
                                        {candidate.completedCount}/{candidate.requiredCount} cursos
                                    </span>
                                </div>
                                <div className={styles.cardStatusRow}>
                                    <StatusBadge status={candidate.status} />
                                    <DeadlineChip candidate={candidate} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── WhatsApp Modal ── */}
                {whatsappModal.isOpen && (
                    <div
                        className={styles.modalOverlay}
                        onClick={() => setWhatsappModal({ isOpen: false, candidate: null })}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className={styles.modal} onClick={e => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>
                                    <MessageCircle size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                                    Mensaje WhatsApp
                                </h2>
                                <button
                                    className={styles.modalCloseBtn}
                                    onClick={() => setWhatsappModal({ isOpen: false, candidate: null })}
                                    type="button"
                                    aria-label="Cerrar"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className={styles.modalBody}>
                                <p className={styles.waRecipient}>
                                    Enviando a: <strong>{formatDisplayName(whatsappModal.candidate?.name)}</strong>
                                    {whatsappModal.candidate?.employeeId && (
                                        <span className={styles.waId}> #{whatsappModal.candidate.employeeId}</span>
                                    )}
                                </p>

                                <div className={styles.waTemplateGrid}>
                                    {MESSAGE_TEMPLATES.map((tpl, i) => (
                                        <button
                                            key={tpl.id}
                                            ref={i === 0 ? firstTemplateRef : null}
                                            className={`${styles.waTemplateBtn} ${selectedTemplate.id === tpl.id ? styles.waTemplateBtnActive : ''}`}
                                            onClick={() => setSelectedTemplate(tpl)}
                                            type="button"
                                        >
                                            {tpl.title}
                                        </button>
                                    ))}
                                </div>

                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    onClick={() => setWhatsappModal({ isOpen: false, candidate: null })}
                                    className={styles.btnCancel}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className={styles.btnSave}
                                    onClick={() => sendWhatsApp(selectedTemplate)}
                                >
                                    <Send size={14} /> Enviar por WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Quick Drawer ── */}
                <Drawer open={quickDrawerOpen} onOpenChange={setQuickDrawerOpen}>
                    <DrawerContent>
                        {quickDrawerCandidate && (() => {
                            const c = quickDrawerCandidate;
                            const dl = getDeadlineInfo(c);
                            return (
                                <>
                                    <DrawerHeader>
                                        <div className={styles.qdHeader}>
                                            <div className={`${styles.qdAvatar} ${styles[`avatar_${c.status}`]}`}>
                                                {getInitials(c.name)}
                                            </div>
                                            <div className={styles.qdHeaderInfo}>
                                                <DrawerTitle>{formatDisplayName(c.name)}</DrawerTitle>
                                                <p className={styles.qdPosition}>{c.position}</p>
                                                <p className={styles.qdEmployeeId}>#{c.employeeId || 'N/A'}</p>
                                            </div>
                                            <DrawerClose />
                                        </div>
                                    </DrawerHeader>

                                    <div className={styles.qdTabs}>
                                        {['perfil', 'progreso', 'acciones'].map(tab => (
                                            <button
                                                key={tab}
                                                className={`${styles.qdTab} ${quickDrawerTab === tab ? styles.qdTabActive : ''}`}
                                                onClick={() => setQuickDrawerTab(tab)}
                                            >
                                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                            </button>
                                        ))}
                                    </div>

                                    <div className={styles.qdBody}>
                                        {quickDrawerTab === 'perfil' && (
                                            <>
                                                <button
                                                    className={styles.qdWhatsappBtn}
                                                    onClick={() => { setQuickDrawerOpen(false); handleWhatsApp(c); }}
                                                    disabled={!c.phone}
                                                    type="button"
                                                >
                                                    <MessageCircle size={18} aria-hidden="true" />
                                                    {c.phone ? `WhatsApp — ${formatDisplayName(c.name)}` : 'Sin teléfono registrado'}
                                                </button>

                                                <div className={styles.qdInfoGrid}>
                                                    {[
                                                        { label: 'Puesto', value: c.position },
                                                        { label: 'Turno', value: c.turno || c.shift || '—' },
                                                        {
                                                            label: 'F. Ingreso',
                                                            value: (c.startDate || c.fechaIngreso)
                                                                ? new Date(c.startDate || c.fechaIngreso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                                                                : '—'
                                                        },
                                                        {
                                                            label: 'Último acceso',
                                                            value: c.lastLogin,
                                                            danger: c.daysSinceLastLogin !== null && c.daysSinceLastLogin > 2 && c.status !== 'completed',
                                                        },
                                                        {
                                                            label: 'Código de acceso',
                                                            value: `${c.accessCode} (${c.accessCodeUses} usos)`,
                                                            mono: true,
                                                        },
                                                        {
                                                            label: 'Plazo',
                                                            value: dl
                                                                ? dl.isExpired ? '⚠ Vencido'
                                                                    : dl.deadlineDate?.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) ?? '—'
                                                                : '—',
                                                            danger: dl?.isExpired,
                                                            warning: dl?.isUrgent && !dl?.isExpired,
                                                        },
                                                    ].map(({ label, value, mono, danger, warning }) => (
                                                        <div key={label} className={styles.qdInfoItem}>
                                                            <span className={styles.qdInfoLabel}>{label}</span>
                                                            <span className={`${styles.qdInfoValue} ${mono ? styles.qdInfoMono : ''} ${danger ? styles.qdInfoDanger : ''} ${warning ? styles.qdInfoWarning : ''}`}>
                                                                {danger && <Bell size={13} style={{ marginRight: 4 }} />}
                                                                {value}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}

                                        {quickDrawerTab === 'progreso' && (
                                            <>
                                                <div className={styles.qdProgressSection}>
                                                    <div className={styles.qdProgressHeader}>
                                                        <span className={styles.qdProgressLabel}>Progreso de Inducción</span>
                                                        <span className={styles.qdProgressPct}>{c.progress}%</span>
                                                    </div>
                                                    <div className={styles.qdProgressBarContainer}>
                                                        <div
                                                            className={`${styles.qdProgressFill} ${c.progress >= 100 ? styles.qdProgressComplete : ''}`}
                                                            style={{ width: `${Math.min(c.progress, 100)}%` }}
                                                        />
                                                    </div>
                                                    <p className={styles.qdProgressDetail}>
                                                        {c.completedCount} de {c.requiredCount} cursos completados
                                                    </p>
                                                </div>

                                                <button
                                                    className={styles.qdActivityBtn}
                                                    onClick={() => {
                                                        setQuickDrawerOpen(false);
                                                        setTimeout(() => {
                                                            setSelectedCandidate(c);
                                                            setIsDrawerOpen(true);
                                                        }, 320);
                                                    }}
                                                    type="button"
                                                >
                                                    <span>Ver Actividad Detallada</span>
                                                    <ChevronRight size={18} />
                                                </button>
                                            </>
                                        )}

                                        {quickDrawerTab === 'acciones' && (
                                            <div className={styles.qdReopenSection}>
                                                <p className={styles.qdReopenLabel}>Reabrir Plazo</p>
                                                <p className={styles.qdReopenSub}>Extiende el tiempo de capacitación del candidato.</p>
                                                <div className={styles.qdReopenBtns}>
                                                    {[1, 3, 7].map(days => (
                                                        <button
                                                            key={days}
                                                            className={styles.qdReopenBtn}
                                                            onClick={() => handleReopenDeadline(c, days)}
                                                            type="button"
                                                        >
                                                            +{days}d
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </DrawerContent>
                </Drawer>

                {/* Detailed Drawer */}
                <CandidateDrawer
                    candidate={selectedCandidate}
                    coursesMap={coursesMapRef}
                    open={isDrawerOpen}
                    onOpenChange={setIsDrawerOpen}
                    onArchive={() => handleArchive(selectedCandidate)}
                />

            </main>
        </AdminLayout>
    );
}
