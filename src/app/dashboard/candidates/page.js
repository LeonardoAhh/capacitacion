'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';
import Link from 'next/link';
import { Search, ArrowLeft, Users, CheckCircle, Clock, FileText, FileCheck, AlertCircle, Bell, MessageCircle, Key } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import CandidateDrawer from '@/components/Dashboard/CandidateDrawer';

export default function CandidateMonitoringPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();

    const [loading, setLoading] = useState(true);
    const [candidates, setCandidates] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        avgProgress: 0,
        inactive: 0,
    });
    // Drawer State
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const handleRowClick = (candidate) => {
        setSelectedCandidate(candidate);
        setIsDrawerOpen(true);
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [coursesMapRef, setCoursesMapRef] = useState({});

    // WhatsApp Modal State
    const [whatsappModal, setWhatsappModal] = useState({
        isOpen: false,
        candidate: null
    });

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

    // WhatsApp handler
    const handleWhatsApp = (candidate, e) => {
        e.stopPropagation(); // Prevent row click
        setWhatsappModal({
            isOpen: true,
            candidate
        });
    };

    const sendWhatsAppMessage = (template) => {
        if (!whatsappModal.candidate) return;

        const { name, phone } = whatsappModal.candidate;
        if (!phone) {
            alert('El candidato no tiene número de teléfono registrado');
            return;
        }

        // Clean phone number (remove spaces, dashes, etc.)
        const cleanPhone = phone.replace(/\D/g, '');
        const message = template.message(name);
        const encodedMessage = encodeURIComponent(message);

        // Open WhatsApp with message
        window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank');

        // Close modal
        setWhatsappModal({ isOpen: false, candidate: null });
    };


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

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);

            // 1. Fetch Candidates (Status 'Candidato' OR isCandidato: true)
            const employeesRef = collection(db, 'employees');
            const snapshot = await getDocs(employeesRef);

            const rawCandidates = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(emp => emp.status === 'Candidato' || emp.isCandidato === true);

            // 2. Fetch all courses from induction_courses (only active ones)
            const coursesRef = collection(db, 'induction_courses');
            const coursesSnapshot = await getDocs(coursesRef);
            const coursesMap = {}; // ID -> {nombre, ...}

            coursesSnapshot.docs.forEach(doc => {
                const courseData = doc.data();
                // Only include active courses
                if (courseData.activo !== false) {
                    const courseName = courseData.title || courseData.nombre || 'Sin nombre';

                    coursesMap[doc.id] = {
                        id: doc.id,
                        name: courseName, // Normalize to 'name' for consistency
                        ...courseData
                    };
                }
            });

            // Legacy courses support
            try {
                const legacyRef = collection(db, 'cursos_induccion'); // Assuming this is collection name
                const legacySnap = await getDocs(legacyRef);
                legacySnap.docs.forEach(doc => {
                    const d = doc.data();
                    if (d.activo !== false && !coursesMap[d.id] && !coursesMap[d.nombre]) {
                        coursesMap[d.id] = { id: doc.id, name: d.nombre, ...d };
                    }
                });
            } catch (e) {
                // Ignore if collection doesnt exist
            }

            setCoursesMapRef(coursesMap);


            // 3. Process each candidate
            // Determine Total Courses for THIS candidate based on Position
            // Logic: Filter coursesMap where 'available_positions' includes candidate.position
            // If no position or no match, maybe default? For now, 0.

            // 3b. Actually we need the Position->Courses mapping first to be accurate.
            const positionsRef = collection(db, 'positions');
            const positionsSnap = await getDocs(positionsRef);
            const positionRequirements = {}; // 'Operador' -> ['Curso 1', 'Curso 2']

            positionsSnap.docs.forEach(doc => {
                const p = doc.data();
                if (p.name) {
                    positionRequirements[p.name] = p.requiredCourses || [];
                }
            });

            const finalCandidates = rawCandidates.map(c => {
                const position = c.position;
                const requiredCourseTitles = positionRequirements[position] || [];

                // Find IDs of these courses in our coursesMap
                // Logic: coursesMap values have 'name' === title
                const requiredCourseIds = [];
                requiredCourseTitles.forEach(title => {
                    const found = Object.values(coursesMap).find(course => course.name === title || course.title === title);
                    if (found) requiredCourseIds.push(found.id);
                });

                // Also check legacy 'puestosAplicables' if the new system yielded 0
                if (requiredCourseIds.length === 0) {
                    Object.values(coursesMap).forEach(course => {
                        if (course.puestosAplicables && course.puestosAplicables.includes(position)) {
                            requiredCourseIds.push(course.id);
                        }
                    });
                }

                // Calculate Progress
                const completedIds = c.cursosCompletados || [];
                // Filter completedIds to only those that are actually REQUIRED (semantics?)
                // Usually progress % is (Completed Required / Total Required)
                // But simply: Count how many of 'requiredCourseIds' are in 'completedIds'

                const totalRequired = requiredCourseIds.length;
                const completedRequiredCount = requiredCourseIds.filter(id => completedIds.includes(id)).length;

                const progress = totalRequired > 0 ? Math.round((completedRequiredCount / totalRequired) * 100) : 0;

                // Determine Status
                // - Inactivo: Last login > 7 days ago ?? Or just 'status' field?
                // Let's use logic:
                const daysIdle = calculateDaysSinceLastLogin(c.lastLoginCandidate); // Use lastLoginCandidate from raw data
                const isInactive = daysIdle !== null && daysIdle > 2; // Example threshold, matching original logic

                // Granular stats for UI
                const progressMap = c.coursesProgress || {};
                const presentationsViewed = Object.values(progressMap).filter(p => p.presentationCompleted).length;
                const examsDownloaded = Object.values(progressMap).filter(p => p.examDownloaded).length;

                let status = 'notStarted';
                if (progress >= 100) status = 'completed';
                else if (progress > 0 || Object.keys(progressMap).length > 0) status = 'inProgress';
                if (isInactive && status !== 'completed') status = 'inactive';

                // Format last login display
                let lastLoginDisplay = 'Nunca';
                if (c.lastLoginCandidate) {
                    if (daysIdle === 0) {
                        lastLoginDisplay = 'Hoy';
                    } else if (daysIdle === 1) {
                        lastLoginDisplay = 'Hace 1 día';
                    } else if (daysIdle !== null) {
                        lastLoginDisplay = `Hace ${daysIdle} días`;
                    } else {
                        lastLoginDisplay = new Date(c.lastLoginCandidate).toLocaleDateString();
                    }
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
                    requiredCourseIds: requiredCourseIds, // Store for detail view
                    // Access Code Info
                    accessCode: c.accessCode || '-',
                    accessCodeUses: c.accessCodeUses || 0,
                    accessCodeExpires: c.accessCodeExpires ? new Date(c.accessCodeExpires).toLocaleDateString() : '-'
                };
            });


            setCandidates(finalCandidates);

            // 4. Calculate Stats
            const newStats = {
                total: finalCandidates.length,
                completed: finalCandidates.filter(c => c.status === 'completed').length,
                inProgress: finalCandidates.filter(c => c.status === 'inProgress').length,
                inactive: finalCandidates.filter(c => c.status === 'inactive').length,
                avgProgress: finalCandidates.length > 0
                    ? Math.round(finalCandidates.reduce((acc, c) => acc + c.progress, 0) / finalCandidates.length)
                    : 0
            };
            setStats(newStats);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (!['admin', 'super_admin'].includes(user.rol)) {
                router.push('/dashboard'); // Unauthorized
            } else {
                fetchData();
            }
        }
    }, [user, authLoading, router, fetchData]);

    const filteredCandidates = candidates.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.title}>
                    <h1>Monitoreo de Candidatos</h1>
                    <p className={styles.subtitle}>Supervisa el avance de inducción en tiempo real</p>
                </div>
                <Link href="/dashboard" className={styles.backButton}>
                    <ArrowLeft size={18} />
                    <span>Volver al Dashboard</span>
                </Link>
            </header>

            {/* Stats Overview */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} blue`}>
                        <Users />
                    </div>
                    <div>
                        <h3 className={styles.statValue}>{stats.total}</h3>
                        <p className={styles.statLabel}>Candidatos Totales</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} green`}>
                        <CheckCircle />
                    </div>
                    <div>
                        <h3 className={styles.statValue}>{stats.completed}</h3>
                        <p className={styles.statLabel}>Inducción Completada</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} orange`}>
                        <Clock />
                    </div>
                    <div>
                        <h3 className={styles.statValue}>{stats.avgProgress}%</h3>
                        <p className={styles.statLabel}>Progreso Promedio</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} red`}>
                        <AlertCircle />
                    </div>
                    <div>
                        <h3 className={styles.statValue}>{stats.inactive}</h3>
                        <p className={styles.statLabel}>Sin Actividad (+2 días)</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className={styles.filterBar}>
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
                </div>
            </div>

            {/* Table */}
            <div className={styles.tableCard}>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Candidato</th>
                                <th>ID Empleado</th>
                                <th>Puesto</th>
                                <th>Estado</th>
                                <th>Progreso General</th>
                                <th>Actividad Detallada</th>
                                <th>Último Acceso</th>
                                <th>WhatsApp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCandidates.length > 0 ? (
                                filteredCandidates.map((candidate) => (
                                    <tr
                                        key={candidate.id}
                                        onClick={() => handleRowClick(candidate)}
                                        style={{ cursor: 'pointer' }}
                                        className={styles.tableRow} // Optional: add hover effect class
                                    >
                                        <td>
                                            <div className={styles.userCell}>
                                                <div className={styles.avatar}>
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
                                        <td style={{ minWidth: '140px' }}>
                                            <div className={styles.progressContainer}>
                                                <div
                                                    className={`${styles.progressBar} ${candidate.progress >= 100 ? 'complete' : ''}`}
                                                    style={{ width: `${candidate.progress}%` }}
                                                ></div>
                                            </div>
                                            <span className={styles.progressText}>
                                                {candidate.completedCount} de {candidate.requiredCount} completados ({candidate.progress}%)
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', color: '#666' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <div title="Presentaciones Vistas" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <FileText size={14} />
                                                        {candidate.presentationsViewed} Vistas
                                                    </div>
                                                    <div title="Exámenes Descargados" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <FileCheck size={14} />
                                                        {candidate.examsDownloaded} Descargas
                                                    </div>
                                                </div>

                                                {/* Access Code Info */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                                    <Key size={14} style={{ color: '#007AFF' }} aria-hidden="true" />
                                                    <span title={`Expira el: ${candidate.accessCodeExpires}`}>
                                                        Code: <strong style={{ color: '#1c1c1e' }}>{candidate.accessCode}</strong>
                                                    </span>
                                                    <span title="Veces utilizado" style={{ marginLeft: '4px', fontSize: '0.75rem', color: '#8e8e93' }}>
                                                        ({candidate.accessCodeUses} usos)
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {candidate.daysSinceLastLogin !== null && candidate.daysSinceLastLogin > 2 && candidate.status !== 'completed' && (
                                                    <Bell size={16} style={{ color: '#FF3B30' }} title="Sin actividad reciente" />
                                                )}
                                                {candidate.lastLogin}
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                onClick={(e) => handleWhatsApp(candidate, e)}
                                                className={styles.whatsappButton}
                                                title={candidate.phone ? "Enviar mensaje de WhatsApp" : "Sin número de teléfono"}
                                                disabled={!candidate.phone}
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
                                    </div>
                                    <span className={`${styles.badge} ${styles[candidate.status]}`}>
                                        {candidate.status === 'completed' ? 'Completado' :
                                            candidate.status === 'inProgress' ? 'En Proceso' :
                                                candidate.status === 'inactive' ? 'Inactivo' : 'Pendiente'}
                                    </span>
                                </div>

                                <div className={styles.cardStats}>
                                    <div className={styles.statItem}>
                                        <span className={styles.statLabel}>Progreso</span>
                                        <div className={styles.progressContainer} aria-label={`Progreso: ${candidate.progress}%`}>
                                            <div
                                                className={styles.progressBar}
                                                style={{ width: `${candidate.progress}%` }}
                                            />
                                        </div>
                                        <div className={styles.statDetail}>
                                            {candidate.completedCount}/{candidate.requiredCount} cursos ({candidate.progress}%)
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.viewDetailButton}
                                        aria-label={`Ver detalles de ${candidate.name}`}
                                    >
                                        Ver Detalle
                                    </button>

                                    <button
                                        onClick={(e) => handleWhatsApp(candidate, e)}
                                        className={styles.whatsappButton}
                                        title={candidate.phone ? "Enviar mensaje por WhatsApp" : "Sin número de teléfono"}
                                        disabled={!candidate.phone}
                                        aria-label={`Enviar WhatsApp a ${candidate.name}`}
                                        style={{ marginLeft: 'auto' }} // Push to right if needed
                                    >
                                        <MessageCircle size={18} aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            No se encontraron candidatos.
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
                />
            </div>
        </div>
    );
}
