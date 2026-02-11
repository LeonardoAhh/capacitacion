'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';
import Link from 'next/link';
import { Search, ArrowLeft, Users, CheckCircle, Clock, FileText, FileCheck, AlertCircle, Bell, MessageCircle, Key, Filter, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import CandidateDrawer from '@/components/Dashboard/CandidateDrawer';
import ProfileDropdown from '@/components/ProfileDropdown/ProfileDropdown';

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
                const examsDownloaded = Object.values(progressMap).filter(p => p.examDownloaded).length;

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
                    examsDownloaded,
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

export default function CandidateMonitoringPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();

    // Data fetching hook
    const { loading, error, candidates, coursesMapRef, fetchData } = useDataFetching();

    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [whatsappModal, setWhatsappModal] = useState({
        isOpen: false,
        candidate: null
    });

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
        return candidates.filter(c => {
            const matchesSearch =
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

            const isArchived = c.isArchived === true;

            // Logica de filtrado por estado
            let matchesStatus = false;
            if (statusFilter === 'archived') {
                matchesStatus = isArchived;
            } else {
                // Si no estamos filtrando por archivados, excluimos los archivados por defecto
                if (isArchived) return false;
                matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            }

            return matchesSearch && matchesStatus;
        });
    }, [candidates, searchTerm, statusFilter]);

    // Event handlers
    const handleRowClick = useCallback((candidate) => {
        setSelectedCandidate(candidate);
        setIsDrawerOpen(true);
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

        const { name, phone } = whatsappModal.candidate;
        if (!phone) {
            alert('El candidato no tiene número de teléfono registrado');
            return;
        }

        const cleanPhone = phone.replace(/\D/g, '');
        const message = template.message(name);
        const encodedMessage = encodeURIComponent(message);

        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');
        setWhatsappModal({ isOpen: false, candidate: null });
    }, [whatsappModal.candidate]);

    // Archive Handler
    const handleArchiveCandidate = useCallback(async (candidate) => {
        if (!confirm(`¿Estás seguro de que deseas ${candidate.isArchived ? 'restaurar' : 'archivar'} a ${candidate.name}?`)) return;

        try {
            const docRef = doc(db, 'employees', candidate.id);
            await updateDoc(docRef, {
                isArchived: !candidate.isArchived,
                archivedAt: !candidate.isArchived ? new Date().toISOString() : null
            });

            // Optimistic update handled by fetch or real-time listener, but we can force refresh if needed
            // For now, let's rely on data refetch or local state update if we had it.
            // Since we use real-time listeners for some parts, or manual fetch for this page:
            fetchData();
            setIsDrawerOpen(false);
        } catch (error) {
            console.error('Error updating candidate archive status:', error);
            alert('Error al actualizar el estado del candidato');
        }
    }, [fetchData]);

    // Predefined WhatsApp message templates
    const messageTemplates = [
        {
            id: 'progress_check',
            title: '✅ Revisión de Progreso',
            message: (name) => `Hola ${name}, ¿cómo vas con tu capacitación? Nos gustaría saber si tienes alguna duda o necesitas ayuda.`
        },
        {
            id: 'problem_inquiry',
            title: '❓ Consulta de Problemas',
            message: (name) => `Hola ${name}, hemos notado que no has avanzado mucho en tus cursos. ¿Hay algún problema o dificultad que podamos ayudarte a resolver?`
        },
        {
            id: 'inactive_alert',
            title: '⏰ Recordatorio de Inactividad',
            message: (name) => `Hola ${name}, notamos que no has ingresado a la plataforma recientemente. Recuerda que es importante completar tus cursos a tiempo. ¿Necesitas ayuda?`
        },
        {
            id: 'completion_reminder',
            title: '🎯 Recordatorio de Finalización',
            message: (name) => `Hola ${name}, te recordamos completar los cursos pendientes. Cualquier duda que tengas, estamos para ayudarte.`
        },
        {
            id: 'support_offer',
            title: '🤝 Ofrecimiento de Apoyo',
            message: (name) => `Hola ${name}, queremos ofrecerte nuestro apoyo en tu proceso de capacitación. ¿Hay algo en lo que podamos asistirte?`
        }
    ];

    // Effects
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
            <div className={styles.container}>
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
            <div className={styles.container}>
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
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.headerLeft}>
                        <Link href="/dashboard" className={styles.backButton} aria-label="Volver al Dashboard">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className={styles.title}>
                            <h1>Monitoreo de Candidatos</h1>
                            <p className={styles.subtitle}>Supervisa el avance de inducción en tiempo real</p>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <ProfileDropdown className={styles.profileDropdown} />
                    </div>
                </div>
            </header>

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

            {/* Table Container */}
            <div className={styles.tableCard}>
                {/* Desktop Table */}
                <div className={styles.tableContainer}>
                    <table className={styles.table} role="table">
                        <thead>
                            <tr>
                                <th scope="col">Candidato</th>
                                <th scope="col">ID Empleado</th>
                                <th scope="col">Puesto</th>
                                <th scope="col">Estado</th>
                                <th scope="col">Progreso General</th>
                                <th scope="col">Actividad Detallada</th>
                                <th scope="col">Último Acceso</th>
                                <th scope="col">WhatsApp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCandidates.length > 0 ? (
                                filteredCandidates.map((candidate) => (
                                    <tr
                                        key={candidate.id}
                                        onClick={() => handleRowClick(candidate)}
                                        className={styles.tableRow}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                handleRowClick(candidate);
                                            }
                                        }}
                                        aria-label={`Ver detalles de ${candidate.name}`}
                                    >
                                        <td>
                                            <div className={styles.userCell}>
                                                <div className={styles.avatar} aria-hidden="true">
                                                    {candidate.name.charAt(0)}
                                                </div>
                                                <div className={styles.userInfo}>
                                                    <span className={styles.userName}>{candidate.name}</span>
                                                    <span className={styles.userEmail}>{candidate.curp || 'Sin CURP'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{candidate.employeeId || 'N/A'}</td>
                                        <td>{candidate.position}</td>
                                        <td>
                                            <span className={`${styles.badge} ${styles[candidate.status]}`}>
                                                {candidate.status === 'completed' ? '✓ Completado' :
                                                    candidate.status === 'inProgress' ? '⏳ En Proceso' :
                                                        candidate.status === 'inactive' ? '⚠ Inactivo' :
                                                            '○ Sin Iniciar'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.progressCell}>
                                                <div className={styles.progressContainer} aria-label={`Progreso: ${candidate.progress}%`}>
                                                    <div
                                                        className={`${styles.progressBar} ${candidate.progress >= 100 ? styles.complete : ''}`}
                                                        style={{ width: `${candidate.progress}%` }}
                                                    />
                                                </div>
                                                <span className={styles.progressText}>
                                                    {candidate.completedCount} de {candidate.requiredCount} completados ({candidate.progress}%)
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.activityCell}>
                                                <div className={styles.activityRow}>
                                                    <div className={styles.activityItem} title="Presentaciones Vistas">
                                                        <FileText size={14} />
                                                        {candidate.presentationsViewed} Vistas
                                                    </div>
                                                    <div className={styles.activityItem} title="Exámenes Descargados">
                                                        <FileCheck size={14} />
                                                        {candidate.examsDownloaded} Descargas
                                                    </div>
                                                </div>
                                                <div className={styles.accessCodeInfo} title={`Expira el: ${candidate.accessCodeExpires}`}>
                                                    <Key size={14} />
                                                    <span>
                                                        Code: <strong>{candidate.accessCode}</strong>
                                                    </span>
                                                    <span className={styles.usageCount}>
                                                        ({candidate.accessCodeUses} usos)
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.lastLoginCell}>
                                                {candidate.daysSinceLastLogin !== null && candidate.daysSinceLastLogin > 2 && candidate.status !== 'completed' && (
                                                    <Bell size={16} className={styles.inactiveIcon} title="Sin actividad reciente" />
                                                )}
                                                <span>{candidate.lastLogin}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                onClick={(e) => handleWhatsApp(candidate, e)}
                                                className={styles.whatsappButton}
                                                title={candidate.phone ? "Enviar mensaje de WhatsApp" : "Sin número de teléfono"}
                                                disabled={!candidate.phone}
                                                aria-label={`Enviar WhatsApp a ${candidate.name}`}
                                            >
                                                <MessageCircle size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className={styles.emptyState}>
                                        No se encontraron candidatos que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className={styles.mobileCards}>
                    {filteredCandidates.length > 0 ? (
                        filteredCandidates.map((candidate) => (
                            <div
                                key={candidate.id}
                                className={styles.mobileCard}
                                onClick={() => handleRowClick(candidate)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleRowClick(candidate);
                                    }
                                }}
                                aria-label={`Ver detalles de ${candidate.name}`}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.avatar} aria-hidden="true">
                                        {candidate.name.charAt(0)}
                                    </div>
                                    <div className={styles.cardUserInfo}>
                                        <span className={styles.userName}>{candidate.name}</span>
                                        <span className={styles.userDetail}>{candidate.position}</span>
                                        <span className={styles.userMeta}>{candidate.employeeId || 'Sin ID'}</span>
                                    </div>
                                    <span className={`${styles.badge} ${styles[candidate.status]}`}>
                                        {candidate.status === 'completed' ? 'Completado' :
                                            candidate.status === 'inProgress' ? 'En Proceso' :
                                                candidate.status === 'inactive' ? 'Inactivo' : 'Pendiente'}
                                    </span>
                                </div>

                                <div className={styles.cardBody}>
                                    <div className={styles.progressSection}>
                                        <div className={styles.progressHeader}>
                                            <span className={styles.progressLabel}>Progreso de Inducción</span>
                                            <span className={styles.progressPercentage}>{candidate.progress}%</span>
                                        </div>
                                        <div className={styles.progressContainer} aria-label={`Progreso: ${candidate.progress}%`}>
                                            <div
                                                className={`${styles.progressBar} ${candidate.progress >= 100 ? styles.complete : ''}`}
                                                style={{ width: `${candidate.progress}%` }}
                                            />
                                        </div>
                                        <div className={styles.progressDetail}>
                                            {candidate.completedCount} de {candidate.requiredCount} cursos completados
                                        </div>
                                    </div>

                                    <div className={styles.activitySection}>
                                        <div className={styles.activityItem}>
                                            <FileText size={14} />
                                            <span>{candidate.presentationsViewed} Presentaciones vistas</span>
                                        </div>
                                        <div className={styles.activityItem}>
                                            <FileCheck size={14} />
                                            <span>{candidate.examsDownloaded} Exámenes descargados</span>
                                        </div>
                                        <div className={styles.accessCodeItem}>
                                            <Key size={14} />
                                            <div className={styles.accessCodeDetails}>
                                                <span className={styles.accessCode}>Code: {candidate.accessCode}</span>
                                                <span className={styles.accessCodeMeta}>
                                                    {candidate.accessCodeUses} usos · Expira: {candidate.accessCodeExpires}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.lastLoginSection}>
                                        <div className={styles.lastLoginInfo}>
                                            <span className={styles.lastLoginLabel}>Último acceso:</span>
                                            <span className={styles.lastLoginValue}>{candidate.lastLogin}</span>
                                            {candidate.daysSinceLastLogin !== null && candidate.daysSinceLastLogin > 2 && candidate.status !== 'completed' && (
                                                <Bell size={16} className={styles.inactiveIcon} title="Sin actividad reciente" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.viewDetailButton}
                                        aria-label={`Ver detalles de ${candidate.name}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRowClick(candidate);
                                        }}
                                    >
                                        Ver Detalle
                                    </button>

                                    <button
                                        onClick={(e) => handleWhatsApp(candidate, e)}
                                        className={styles.whatsappButton}
                                        title={candidate.phone ? "Enviar mensaje por WhatsApp" : "Sin número de teléfono"}
                                        disabled={!candidate.phone}
                                        aria-label={`Enviar WhatsApp a ${candidate.name}`}
                                    >
                                        <MessageCircle size={18} aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            No se encontraron candidatos que coincidan con la búsqueda.
                        </div>
                    )}
                </div>

                {/* WhatsApp Message Selector Modal */}
                {whatsappModal.isOpen && (
                    <div
                        className={styles.modalOverlay}
                        onClick={() => setWhatsappModal({ isOpen: false, candidate: null })}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="modal-title"
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
                                    ×
                                </button>
                            </div>

                            <div className={styles.modalBody}>
                                <p className={styles.modalSubtitle}>
                                    Enviando mensaje a: <strong>{whatsappModal.candidate?.name}</strong>
                                </p>

                                <div className={styles.messageTemplates}>
                                    {messageTemplates.map(template => (
                                        <button
                                            key={template.id}
                                            className={styles.templateButton}
                                            onClick={() => sendWhatsAppMessage(template)}
                                        >
                                            <div className={styles.templateTitle}>{template.title}</div>
                                            <div className={styles.templatePreview}>
                                                {template.message(whatsappModal.candidate?.name || 'Candidato')}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Global Candidate Drawer */}
                <CandidateDrawer
                    candidate={selectedCandidate}
                    coursesMap={coursesMapRef}
                    open={isDrawerOpen}
                    onOpenChange={setIsDrawerOpen}
                    onArchive={() => handleArchiveCandidate(selectedCandidate)}
                />
            </div>
        </div>
    );
}