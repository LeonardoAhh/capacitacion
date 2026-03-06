'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast/Toast';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/Drawer/Drawer';
import styles from './page.module.css';
import BackButton from '@/components/ui/BackButton/BackButton';
import { Search, Users, CheckCircle, Clock, AlertCircle, Bell, MessageCircle, Key, Filter, X, ChevronRight, Phone, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import CandidateDrawer from '@/components/features/Dashboard/CandidateDrawer';
import ProfileDropdown from '@/components/layout/ProfileDropdown/ProfileDropdown';
import AvatarSelector from '@/components/ui/AvatarSelector/AvatarSelector';
import { useConfirm } from '@/hooks/useConfirm';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';

// Custom hook for data fetching
function useDataFetching() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [coursesMapRef, setCoursesMapRef] = useState({});

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Parallel fetching for better performance
            const [employeesSnap, coursesSnap, positionsSnap, legacyCoursesSnap] = await Promise.allSettled([
                getDocs(collection(db, 'employees')),
                getDocs(collection(db, 'induction_courses')),
                getDocs(collection(db, 'positions')),
                getDocs(collection(db, 'cursos_induccion')).catch(() => ({ docs: [] }))
            ]);

            // Process employees
            const rawCandidates = employeesSnap.status === 'fulfilled'
                ? employeesSnap.value.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(emp => emp.status === 'Candidato' || emp.isCandidato === true)
                : [];

            // Process courses
            const coursesMap = {};
            if (coursesSnap.status === 'fulfilled') {
                coursesSnap.value.docs.forEach(doc => {
                    const courseData = doc.data();
                    if (courseData.activo !== false) {
                        const courseName = courseData.title || courseData.nombre || 'Sin nombre';
                        coursesMap[doc.id] = {
                            id: doc.id,
                            name: courseName,
                            ...courseData
                        };
                    }
                });
            }

            // Process legacy courses
            if (legacyCoursesSnap.status === 'fulfilled') {
                legacyCoursesSnap.value.docs.forEach(doc => {
                    const d = doc.data();
                    if (d.activo !== false && !coursesMap[d.id] && !coursesMap[d.nombre]) {
                        coursesMap[d.id] = { id: doc.id, name: d.nombre, ...d };
                    }
                });
            }

            setCoursesMapRef(coursesMap);

            // Process positions
            const positionRequirements = {};
            if (positionsSnap.status === 'fulfilled') {
                positionsSnap.value.docs.forEach(doc => {
                    const p = doc.data();
                    if (p.name) {
                        positionRequirements[p.name] = p.requiredCourses || [];
                    }
                });
            }

            // Helper function to calculate days since last login
            const calculateDaysSinceLastLogin = (lastLoginDate) => {
                if (!lastLoginDate || lastLoginDate === 'Nunca') return null;
                try {
                    const lastLogin = new Date(lastLoginDate);
                    const today = new Date();
                    const diffTime = Math.abs(today - lastLogin);
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays;
                } catch (error) {
                    return null;
                }
            };

            // Process candidates
            const finalCandidates = rawCandidates.map(c => {
                const position = c.position;
                const requiredCourseTitles = positionRequirements[position] || [];

                // Find required course IDs
                const requiredCourseIds = [];
                requiredCourseTitles.forEach(title => {
                    const found = Object.values(coursesMap).find(course =>
                        course.name === title || course.title === title
                    );
                    if (found) requiredCourseIds.push(found.id);
                });

                // Fallback to legacy system
                if (requiredCourseIds.length === 0) {
                    Object.values(coursesMap).forEach(course => {
                        if (course.puestosAplicables && course.puestosAplicables.includes(position)) {
                            requiredCourseIds.push(course.id);
                        }
                    });
                }

                // Calculate progress
                const completedIds = c.cursosCompletados || [];
                const totalRequired = requiredCourseIds.length;
                const completedRequiredCount = requiredCourseIds.filter(id => completedIds.includes(id)).length;
                const progress = totalRequired > 0 ? Math.round((completedRequiredCount / totalRequired) * 100) : 0;

                // Calculate activity metrics
                const progressMap = c.coursesProgress || {};
                const presentationsViewed = Object.values(progressMap).filter(p => p.presentationCompleted).length;

                // Determine status
                const daysIdle = calculateDaysSinceLastLogin(c.lastLoginCandidate);
                const isInactive = daysIdle !== null && daysIdle > 2;

                let status = 'notStarted';
                if (progress >= 100) status = 'completed';
                else if (progress > 0 || Object.keys(progressMap).length > 0) status = 'inProgress';
                if (isInactive && status !== 'completed') status = 'inactive';

                // Format last login
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
                    progress: progress,
                    presentationsViewed,
                    status: status,
                    daysSinceLastLogin: daysIdle,
                    lastLogin: lastLoginDisplay,
                    requiredCourseIds: requiredCourseIds,
                    accessCode: c.accessCode || '-',
                    accessCodeUses: c.accessCodeUses || 0,
                    accessCodeExpires: c.accessCodeExpires ? new Date(c.accessCodeExpires).toLocaleDateString() : '-'
                };
            });

            setCandidates(finalCandidates);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setError('Error al cargar los datos. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, candidates, coursesMapRef, fetchData };
}

/**
 * Calcula cuánto tiempo le queda al candidato para terminar sus cursos.
 * Base: fechaIngreso + 7 días.
 * @param {Object} candidate
 * @returns {{ daysLeft: number, hoursLeft: number, isExpired: boolean, isUrgent: boolean, label: string }}
 */
function getDeadlineInfo(candidate) {
    const ingreso = candidate.startDate || candidate.fechaIngreso || candidate.createdAt;
    if (!ingreso) return null;

    try {
        const start = new Date(ingreso);
        if (isNaN(start.getTime())) return null;

        const deadline = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const diffMs = deadline - now;

        if (diffMs <= 0) {
            return { daysLeft: 0, hoursLeft: 0, isExpired: true, isUrgent: true, label: 'Tiempo vencido' };
        }

        const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const isUrgent = daysLeft < 2;

        let label;
        if (daysLeft === 0) label = `${hoursLeft}h restantes`;
        else if (daysLeft === 1) label = `1 día ${hoursLeft}h`;
        else label = `${daysLeft} días ${hoursLeft}h`;

        return { daysLeft, hoursLeft, isExpired: false, isUrgent, label };
    } catch {
        return null;
    }
}


// Convierte "APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2" → "Nombre1 Apellido1"
// Maneja automáticamente 1, 2, 3 o 4+ palabras
function getShortName(fullName) {
    if (!fullName || typeof fullName !== 'string') return fullName || 'Colaborador';
    const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return capitalize(parts[0]);
    if (parts.length === 2) return `${capitalize(parts[0])} ${capitalize(parts[1])}`;
    if (parts.length === 3) return `${capitalize(parts[2])} ${capitalize(parts[0])}`;
    // 4+ palabras: APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2 → "Nombre1 Apellido1"
    return `${capitalize(parts[2])} ${capitalize(parts[0])}`;
}

// Devuelve "ID - Nombre Apellido" o solo "Nombre Apellido" si no hay ID
function getDisplayName(candidate) {
    if (!candidate) return 'Colaborador';
    const shortName = getShortName(candidate.name);
    const id = candidate.employeeId;
    return id ? `${id} - ${shortName}` : shortName;
}

// ============================================================================
// TEMPLATES DE WHATSAPP
// Definidos fuera del componente → referencia estable, sin recreación en render
// ============================================================================
const MESSAGE_TEMPLATES = [
    {
        id: 'welcome',
        title: '👋 Bienvenida',
        message: (name, c) =>
            `¡Bienvenido/a ${name}! 🎉\n\nEs un placer tenerte en el equipo. Para comenzar tu proceso de inducción, ingresa a la plataforma:\n\n🌐 *https://vertxk.xyz/*\n\nUsa tu código de acceso:\n\n🔑 *${c?.accessCode || '-'}*\n\nSi tienes cualquier duda, escríbenos. ¡Mucho éxito! 💼\n\n_Recursos Humanos_`
    },
    {
        id: 'progress_check',
        title: '✅ Revisión de Progreso',
        message: (name, c) =>
            `Hola ${name} 👋\n\nNotamos que llevas un avance del *${c?.progress ?? 0}%* en tu proceso de inducción. ¿Tienes alguna duda o necesitas apoyo?\n\nEstamos para ayudarte.\n\n_Recursos Humanos_`
    },
    {
        id: 'problem_inquiry',
        title: '❓ Consulta de Problemas',
        message: (name) =>
            `Hola ${name},\n\nHemos notado que no has avanzado recientemente en tus cursos. ¿Hay algo que te esté impidiendo continuar?\n\nPodemos agendar un momento para apoyarte, solo dínos cuándo te viene bien. 😊\n\n_Recursos Humanos_`
    },
    {
        id: 'inactive_alert',
        title: '⏰ Inactividad Reciente',
        message: (name, c) => {
            const dias = c?.daysSinceLastLogin;
            const cuanto = dias === 1 ? '1 día' : dias ? `${dias} días` : 'varios días';
            return `Hola ${name},\n\nLlevamos *${cuanto}* sin verte en la plataforma de capacitación. Recuerda que completar los cursos a tiempo es parte de tu proceso de integración.\n\n🔗 Ingresa con tu código de acceso: *${c?.accessCode || '-'}*\n\n¿Necesitas ayuda? ¡Escíbenos! 😊\n\n_Recursos Humanos_`;
        }
    },
    {
        id: 'completion_reminder',
        title: '🎯 Tiempo Límite',
        message: (name, candidate) => {
            const dl = candidate ? getDeadlineInfo(candidate) : null;
            const tiempo = dl
                ? dl.isExpired
                    ? 'tu plazo *ya venció*'
                    : dl.daysLeft === 0
                        ? `solo te quedan *${dl.hoursLeft} horas*`
                        : dl.daysLeft === 1
                            ? `solo te queda *1 día y ${dl.hoursLeft} horas*`
                            : `te quedan *${dl.daysLeft} días y ${dl.hoursLeft} horas*`
                : 'el tiempo es limitado';
            return `Hola ${name} ⏳\n\nTe recordamos que ${tiempo} para completar tu inducción.\n\nPor favor termina los cursos pendientes y entrega tus evaluaciones a Recursos Humanos.\n\n🔑 Tu código: *${candidate?.accessCode || '-'}*\n\n¡Cualquier duda estamos contigo! 💪\n\n_Recursos Humanos_`;
        }
    },
    {
        id: 'support_offer',
        title: '🤝 Ofrecimiento de Apoyo',
        message: (name) =>
            `Hola ${name},\n\nQueremos asegurarnos de que tu proceso de incorporación sea lo más cómodo posible. 🙌\n\nSi tienes dudas sobre los cursos, el acceso a la plataforma o cualquier otra cosa, escíbenos aquí o acércate con Recursos Humanos en horario de 8:00 a 17:00 h.\n\n_Recursos Humanos_`
    }
];

export default function CandidateMonitoringPage() {
    const { user, loading: authLoading, updateUserProfile } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const { showConfirm, confirmDialog } = useConfirm();
    const { toast } = useToast();
    // Ref para enfocar el primer template al abrir el modal (accesibilidad)
    const firstTemplateRef = useRef(null);

    // Data fetching hook
    const { loading, error, candidates, coursesMapRef, fetchData } = useDataFetching();

    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [whatsappModal, setWhatsappModal] = useState({ isOpen: false, candidate: null });
    // { key: 'name'|'progress'|'lastLogin', dir: 'asc'|'desc' }
    const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' });
    // QuickDrawer al hacer click en una card
    const [quickDrawerOpen, setQuickDrawerOpen] = useState(false);
    const [quickDrawerCandidate, setQuickDrawerCandidate] = useState(null);

    // Memoized calculations
    const stats = useMemo(() => {
        // Only count NON-ARCHIVED candidates for stats
        const activeCandidates = candidates.filter(c => !c.isArchived);
        return {
            total: activeCandidates.length,
            completed: activeCandidates.filter(c => c.status === 'completed').length,
            inProgress: activeCandidates.filter(c => c.status === 'inProgress').length,
            inactive: activeCandidates.filter(c => c.status === 'inactive').length,
            avgProgress: activeCandidates.length > 0
                ? Math.round(activeCandidates.reduce((acc, c) => acc + c.progress, 0) / activeCandidates.length)
                : 0
        };
    }, [candidates]);

    const filteredCandidates = useMemo(() => {
        const filtered = candidates.filter(c => {
            const matchesSearch =
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

            const isArchived = c.isArchived === true;

            let matchesStatus = false;
            if (statusFilter === 'archived') {
                matchesStatus = isArchived;
            } else {
                if (isArchived) return false;
                matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            }

            return matchesSearch && matchesStatus;
        });

        // Ordenamiento de columnas
        if (!sortConfig.key) return filtered;

        return [...filtered].sort((a, b) => {
            let valA, valB;
            if (sortConfig.key === 'name') {
                valA = a.name?.toLowerCase() ?? '';
                valB = b.name?.toLowerCase() ?? '';
            } else if (sortConfig.key === 'progress') {
                valA = a.progress ?? 0;
                valB = b.progress ?? 0;
            } else if (sortConfig.key === 'lastLogin') {
                valA = a.daysSinceLastLogin ?? Infinity;
                valB = b.daysSinceLastLogin ?? Infinity;
            } else {
                return 0;
            }
            if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [candidates, searchTerm, statusFilter, sortConfig]);

    // Handler para ordenar columnas
    const handleSort = useCallback((key) => {
        setSortConfig(prev =>
            prev.key === key
                ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { key, dir: 'asc' }
        );
    }, []);

    // Icono de ordenamiento para encabezados
    const SortIcon = ({ colKey }) => {
        if (sortConfig.key !== colKey) return <ArrowUpDown size={14} style={{ opacity: 0.4, marginLeft: 4 }} />;
        return sortConfig.dir === 'asc'
            ? <ArrowUp size={14} style={{ marginLeft: 4, color: 'var(--color-primary)' }} />
            : <ArrowDown size={14} style={{ marginLeft: 4, color: 'var(--color-primary)' }} />;
    };

    // Event handlers
    const handleRowClick = useCallback((candidate) => {
        setSelectedCandidate(candidate);
        setIsDrawerOpen(true);
    }, []);

    // Card click: abre el QuickDrawer
    const handleCardClick = useCallback((candidate) => {
        setQuickDrawerCandidate(candidate);
        setQuickDrawerOpen(true);
    }, []);

    const handleWhatsApp = useCallback((candidate, e) => {
        e?.stopPropagation();
        setWhatsappModal({
            isOpen: true,
            candidate
        });
    }, []);

    const sendWhatsAppMessage = useCallback((template) => {
        if (!whatsappModal.candidate) return;

        const { phone } = whatsappModal.candidate;
        if (!phone) {
            toast.warning('Sin número de teléfono registrado — edita el perfil para agregarlo');
            return;
        }

        const cleanPhone = phone.replace(/\D/g, '');
        const message = template.message(getDisplayName(whatsappModal.candidate), whatsappModal.candidate);
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

        // <a> programático: más confiable en móvil que window.open
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Mensaje abierto en WhatsApp para ${getShortName(whatsappModal.candidate.name)}`);
        setWhatsappModal({ isOpen: false, candidate: null });
    }, [whatsappModal.candidate, toast]);

    // Archive Handler
    const handleArchiveCandidate = useCallback(async (candidate) => {
        const action = candidate.isArchived ? 'restaurar' : 'archivar';
        if (!await showConfirm(
            `¿Estás seguro de que deseas ${action} a ${getShortName(candidate.name)}?`,
            { title: 'Confirmar Acción', confirmLabel: 'Aceptar' }
        )) return;

        try {
            const docRef = doc(db, 'employees', candidate.id);
            await updateDoc(docRef, {
                isArchived: !candidate.isArchived,
                archivedAt: !candidate.isArchived ? new Date().toISOString() : null
            });
            fetchData();
            setIsDrawerOpen(false);
        } catch (err) {
            console.error('Error updating candidate archive status:', err);
            toast.error('Error al actualizar el estado del candidato');
        }
    }, [fetchData, showConfirm, toast]);

    const handleAvatarSave = useCallback(async (avatarUrl) => {
        if (user?.uid) {
            await updateUserProfile(user.uid, { photoURL: avatarUrl, avatar: avatarUrl });
        }
    }, [user?.uid, updateUserProfile]);




    // Cerrar modal WhatsApp con tecla Escape (accesibilidad)
    useEffect(() => {
        if (!whatsappModal.isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setWhatsappModal({ isOpen: false, candidate: null });
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [whatsappModal.isOpen]);

    // Enfocar primer template al abrir el modal
    useEffect(() => {
        if (whatsappModal.isOpen && firstTemplateRef.current) {
            firstTemplateRef.current.focus();
        }
    }, [whatsappModal.isOpen]);

    // Effects de autenticación
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (!['admin', 'super_admin'].includes(user.rol)) {
                router.push('/dashboard');
            } else {
                fetchData();
            }
        }
    }, [user, authLoading, router, fetchData]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            setSelectedCandidate(null);
            setIsDrawerOpen(false);
            setWhatsappModal({ isOpen: false, candidate: null });
        };
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Cargando monitoreo de candidatos...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <AdminLayout title="Monitoreo">
                <div className={styles.errorContainer}>
                    <AlertCircle size={48} className={styles.errorIcon} />
                    <h2>Error al cargar datos</h2>
                    <p>{error}</p>
                    <button
                        onClick={fetchData}
                        className={styles.retryButton}
                    >
                        Intentar de nuevo
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Candidatos en Inducción">
            <AvatarSelector
                isOpen={showAvatarSelector}
                onClose={() => setShowAvatarSelector(false)}
                onSave={handleAvatarSave}
                userName={user?.name || user?.displayName || 'Usuario'}
            />

            {/* Stats Overview */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.blue}`}>
                        <Users />
                    </div>
                    <div className={styles.statContent}>
                        <h3 className={styles.statValue}>{stats.total}</h3>
                        <p className={styles.statLabel}>Candidatos Totales</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.green}`}>
                        <CheckCircle />
                    </div>
                    <div className={styles.statContent}>
                        <h3 className={styles.statValue}>{stats.completed}</h3>
                        <p className={styles.statLabel}>Inducción Completada</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.orange}`}>
                        <Clock />
                    </div>
                    <div className={styles.statContent}>
                        <h3 className={styles.statValue}>{stats.avgProgress}%</h3>
                        <p className={styles.statLabel}>Progreso Promedio</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.red}`}>
                        <AlertCircle />
                    </div>
                    <div className={styles.statContent}>
                        <h3 className={styles.statValue}>{stats.inactive}</h3>
                        <p className={styles.statLabel}>Sin Actividad (+2 días)</p>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className={styles.filterBar}>
                <div className={styles.filterContent}>
                    <div className={styles.searchContainer}>
                        <Search className={styles.searchIcon} size={18} aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, ID o puesto..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label="Buscar candidatos"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className={styles.clearSearch}
                                aria-label="Limpiar búsqueda"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Desktop Filters */}
                    <div className={styles.desktopFilters}>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={styles.statusFilter}
                            aria-label="Filtrar por estado"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="completed">Completados</option>
                            <option value="inProgress">En Proceso</option>
                            <option value="inactive">Inactivos</option>
                            <option value="notStarted">Sin Iniciar</option>
                            <option value="archived">🗄️ Archivados</option>
                        </select>
                    </div>

                    {/* Mobile Filter Toggle */}
                    <button
                        onClick={() => setShowMobileFilters(!showMobileFilters)}
                        className={styles.mobileFilterToggle}
                        aria-label="Mostrar filtros"
                    >
                        <Filter size={18} />
                    </button>
                </div>

                {/* Mobile Filters Panel */}
                {showMobileFilters && (
                    <div className={styles.mobileFiltersPanel}>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={styles.statusFilter}
                        >
                            <option value="all">Todos los estados</option>
                            <option value="completed">Completados</option>
                            <option value="inProgress">En Proceso</option>
                            <option value="inactive">Inactivos</option>
                            <option value="notStarted">Sin Iniciar</option>
                            <option value="archived">🗄️ Archivados</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Results Summary */}
            <div className={styles.resultsInfo}>
                <span>
                    Mostrando {filteredCandidates.length} de {candidates.length} candidatos
                </span>
            </div>

            {/* Grid de Candidatos */}
            {filteredCandidates.length > 0 ? (
                <div className={styles.candidateGrid}>
                    {filteredCandidates.map((candidate) => {
                        const dl = getDeadlineInfo(candidate);
                        const hasDl = dl && candidate.status !== 'completed';
                        return (
                            <button
                                key={candidate.id}
                                className={styles.candidateCard}
                                onClick={() => handleCardClick(candidate)}
                                aria-label={`Ver detalles de ${candidate.name}`}
                            >
                                {/* Foto o Inicial */}
                                <div className={styles.cardPhotoWrapper}>
                                    {candidate.photoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={candidate.photoUrl}
                                            alt={`Foto de ${candidate.name}`}
                                            className={styles.cardPhoto}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                e.currentTarget.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className={styles.cardPhotoFallback}
                                        style={{ display: candidate.photoUrl ? 'none' : 'flex' }}
                                        aria-hidden="true"
                                    >
                                        {getShortName(candidate.name).charAt(0).toUpperCase()}
                                    </div>
                                    {/* Badge de estado flotante */}
                                    <span
                                        className={`${styles.cardStatusDot} ${styles[`dot_${candidate.status}`]}`}
                                        title={
                                            candidate.status === 'completed' ? 'Completado' :
                                                candidate.status === 'inProgress' ? 'En Proceso' :
                                                    candidate.status === 'inactive' ? 'Inactivo' : 'Sin Iniciar'
                                        }
                                    />
                                </div>
                                {/* ID Empleado */}
                                <span className={styles.cardEmployeeId}>
                                    {candidate.employeeId || 'Sin ID'}
                                </span>
                                {/* Nombre formateado */}
                                <span className={styles.cardName}>
                                    {getShortName(candidate.name)}
                                </span>
                                {/* Tiempo restante */}
                                {hasDl && (
                                    <span
                                        className={styles.cardDeadline}
                                        style={{
                                            background: dl.isExpired ? 'rgba(239,68,68,0.15)' : dl.isUrgent ? 'rgba(251,146,60,0.15)' : 'rgba(34,197,94,0.12)',
                                            color: dl.isExpired ? '#ef4444' : dl.isUrgent ? '#f97316' : '#16a34a',
                                        }}
                                    >
                                        {'\u23f1'} {dl.label}
                                    </span>
                                )}
                                {/* Mini barra de progreso */}
                                <div className={styles.cardProgressBar} aria-label={`Progreso: ${candidate.progress}%`}>
                                    <div
                                        className={`${styles.cardProgressFill} ${candidate.progress >= 100 ? styles.cardProgressComplete : ''}`}
                                        style={{ width: `${candidate.progress}%` }}
                                    />
                                </div>
                                <span className={styles.cardProgressLabel}>{candidate.progress}%</span>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    No se encontraron candidatos que coincidan con la b\u00fasqueda.
                </div>
            )}

            {/* QuickDrawer — slide-up al hacer click en una card */}
            <Drawer open={quickDrawerOpen} onOpenChange={setQuickDrawerOpen}>
                <DrawerContent>
                    {quickDrawerCandidate && (() => {
                        const c = quickDrawerCandidate;
                        const dl = getDeadlineInfo(c);
                        return (
                            <>
                                <DrawerHeader>
                                    <div className={styles.qdHeader}>
                                        {/* Foto */}
                                        <div className={styles.qdPhotoWrapper}>
                                            {c.photoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={c.photoUrl}
                                                    alt={`Foto de ${c.name}`}
                                                    className={styles.qdPhoto}
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className={styles.qdPhotoFallback}
                                                style={{ display: c.photoUrl ? 'none' : 'flex' }}
                                                aria-hidden="true"
                                            >
                                                {getShortName(c.name).charAt(0).toUpperCase()}
                                            </div>
                                        </div>
                                        {/* Info */}
                                        <div className={styles.qdHeaderInfo}>
                                            <DrawerTitle>{c.name}</DrawerTitle>
                                            <p className={styles.qdPosition}>{c.position}</p>
                                            <p className={styles.qdEmployeeId}>ID: {c.employeeId || 'N/A'}</p>
                                            <span className={`${styles.badge} ${styles[c.status]}`}>
                                                {c.status === 'completed' ? '\u2713 Completado' :
                                                    c.status === 'inProgress' ? '\u23f3 En Proceso' :
                                                        c.status === 'inactive' ? '\u26a0 Inactivo' : '\u25cb Sin Iniciar'}
                                            </span>
                                        </div>
                                        <DrawerClose />
                                    </div>
                                </DrawerHeader>

                                <div className={styles.qdBody}>
                                    {/* WhatsApp CTA */}
                                    <button
                                        className={styles.qdWhatsappBtn}
                                        onClick={() => {
                                            setQuickDrawerOpen(false);
                                            handleWhatsApp(c);
                                        }}
                                        disabled={!c.phone}
                                        title={c.phone
                                            ? `Enviar WhatsApp a ${getShortName(c.name)}`
                                            : 'Sin tel\u00e9fono registrado \u2014 edita el perfil'}
                                    >
                                        <MessageCircle size={20} aria-hidden="true" />
                                        {c.phone
                                            ? `WhatsApp \u2014 ${getDisplayName(c)}`
                                            : 'Sin tel\u00e9fono registrado'}
                                    </button>

                                    {/* Tiempo restante */}
                                    {dl && c.status !== 'completed' && (
                                        <div
                                            className={styles.qdDeadline}
                                            style={{
                                                background: dl.isExpired ? 'rgba(239,68,68,0.10)' : dl.isUrgent ? 'rgba(251,146,60,0.10)' : 'rgba(34,197,94,0.08)',
                                                borderColor: dl.isExpired ? 'rgba(239,68,68,0.3)' : dl.isUrgent ? 'rgba(251,146,60,0.3)' : 'rgba(34,197,94,0.3)',
                                                color: dl.isExpired ? '#ef4444' : dl.isUrgent ? '#f97316' : '#16a34a',
                                            }}
                                        >
                                            <Clock size={16} />
                                            <span>Tiempo restante: <strong>{dl.label}</strong></span>
                                        </div>
                                    )}

                                    {/* Info Grid */}
                                    <div className={styles.qdInfoGrid}>
                                        <div className={styles.qdInfoItem}>
                                            <span className={styles.qdInfoLabel}>Puesto</span>
                                            <span className={styles.qdInfoValue}>{c.position}</span>
                                        </div>
                                        <div className={styles.qdInfoItem}>
                                            <span className={styles.qdInfoLabel}>\u00daltimo acceso</span>
                                            <span className={styles.qdInfoValue}>
                                                {c.daysSinceLastLogin !== null && c.daysSinceLastLogin > 2 && c.status !== 'completed' && (
                                                    <Bell size={14} className={styles.inactiveIcon} style={{ marginRight: 4 }} />
                                                )}
                                                {c.lastLogin}
                                            </span>
                                        </div>
                                        <div className={styles.qdInfoItem}>
                                            <span className={styles.qdInfoLabel}>C\u00f3digo de acceso</span>
                                            <span className={styles.qdInfoValue}>
                                                <Key size={14} style={{ marginRight: 4 }} />
                                                <strong>{c.accessCode}</strong>
                                                <span className={styles.qdInfoMeta}> ({c.accessCodeUses} usos)</span>
                                            </span>
                                        </div>
                                        <div className={styles.qdInfoItem}>
                                            <span className={styles.qdInfoLabel}>Presentaciones vistas</span>
                                            <span className={styles.qdInfoValue}>{c.presentationsViewed}</span>
                                        </div>
                                    </div>

                                    {/* Progreso general */}
                                    <div className={styles.qdProgressSection}>
                                        <div className={styles.qdProgressHeader}>
                                            <span className={styles.qdProgressLabel}>Progreso de Inducci\u00f3n</span>
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

                                    {/* Actividad detallada \u2192 abre CandidateDrawer */}
                                    <button
                                        className={styles.qdActivityBtn}
                                        onClick={() => {
                                            setQuickDrawerOpen(false);
                                            // Esperar que la animación de cierre termine antes de abrir
                                            setTimeout(() => handleRowClick(c), 320);
                                        }}
                                    >
                                        <span>Ver Actividad Detallada</span>
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </>
                        );
                    })()}
                </DrawerContent>
            </Drawer>

            {/* Global Candidate Drawer */}
            <CandidateDrawer
                candidate={selectedCandidate}
                coursesMap={coursesMapRef}
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                onArchive={() => handleArchiveCandidate(selectedCandidate)}
            />

            {/* WhatsApp Modal */}
            {whatsappModal.isOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setWhatsappModal({ isOpen: false, candidate: null })}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
                >
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 id="modal-title">
                                <MessageCircle size={24} style={{ marginRight: '8px' }} aria-hidden="true" />
                                Selecciona un Mensaje
                            </h3>
                            <button
                                className={styles.modalCloseBtn}
                                onClick={() => setWhatsappModal({ isOpen: false, candidate: null })}
                                aria-label="Cerrar modal"
                            >
                                &times;
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <p className={styles.modalSubtitle}>
                                Enviando mensaje a: <strong>{getDisplayName(whatsappModal.candidate)}</strong>
                            </p>

                            <div className={styles.messageTemplates}>
                                {MESSAGE_TEMPLATES.map((template, idx) => (
                                    <button
                                        key={template.id}
                                        ref={idx === 0 ? firstTemplateRef : null}
                                        className={styles.templateButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            sendWhatsAppMessage(template);
                                        }}
                                    >
                                        <div className={styles.templateTitle}>{template.title}</div>
                                        <div className={styles.templatePreview}>
                                            {template.message(getDisplayName(whatsappModal.candidate) || 'Candidato', whatsappModal.candidate)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {confirmDialog}
        </AdminLayout>
    );
}
