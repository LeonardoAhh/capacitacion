'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';
import Link from 'next/link';
import { Search, ArrowLeft, Users, CheckCircle, Clock, FileText, FileCheck, AlertCircle, Bell } from 'lucide-react';
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
    }, [user, authLoading, router]);

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

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Candidates (Status 'Candidato' OR isCandidato: true)
            const employeesRef = collection(db, 'employees');
            // Firestore doesn't support logical OR directly in one query easily for distinct fields without multiple queries
            // We'll fetch all and filter in client for simplicity given specific constraints or do two queries
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



            // 3. Fetch Positions to know required courses (NAMES)
            const positionsRef = collection(db, 'positions');
            const posSnapshot = await getDocs(positionsRef);
            const positionsMap = {};
            posSnapshot.docs.forEach(doc => {
                const data = doc.data();
                const requiredCourseNames = data.requiredCourses || [];
                positionsMap[data.name] = {
                    count: requiredCourseNames.length,
                    courseNames: requiredCourseNames // Keep as NAMES
                };
            });

            // 4. Process Data
            const processedCandidates = rawCandidates.map(c => {
                const positionName = c.position || c.puesto;
                const positionData = positionsMap[positionName];
                const requiredCount = positionData?.count || 0;
                const requiredCourseNames = positionData?.courseNames || [];

                // Calculate progress based on granular steps if available
                // If not, fallback to cursosCompletados length
                const completedCoursesList = c.cursosCompletados || [];
                let completedCount = completedCoursesList.length;

                // Detailed check: Count unique courses where at least "presentationCompleted" is true
                // This gives us "In Progress" insight even if not fully complete
                const progressMap = c.coursesProgress || {};
                const startedCoursesCount = Object.keys(progressMap).length;

                // Granular stats for UI
                const presentationsViewed = Object.values(progressMap).filter(p => p.presentationCompleted).length;
                const examsDownloaded = Object.values(progressMap).filter(p => p.examDownloaded).length;

                let progress = 0;
                if (requiredCount > 0) {
                    progress = Math.round((completedCount / requiredCount) * 100);
                } else if (completedCount > 0) {
                    progress = 100;
                }

                // Cap at 100
                if (progress > 100) progress = 100;

                // Status Logic
                let status = 'pending';
                if (progress >= 100) status = 'completed'; // Completed
                else if (progress > 0 || startedCoursesCount > 0) status = 'inProgress'; // In Progress
                else status = 'notStarted'; // Not started

                // Calculate days since last login
                const lastLoginRaw = c.lastLoginCandidate || null;
                const daysSinceLastLogin = lastLoginRaw ? calculateDaysSinceLastLogin(lastLoginRaw) : null;

                // Check if inactive (>2 days without access and not completed)
                if (daysSinceLastLogin !== null && daysSinceLastLogin > 2 && status !== 'completed') {
                    status = 'inactive';
                }

                // Format last login display
                let lastLoginDisplay = 'Nunca';
                if (lastLoginRaw) {
                    if (daysSinceLastLogin === 0) {
                        lastLoginDisplay = 'Hoy';
                    } else if (daysSinceLastLogin === 1) {
                        lastLoginDisplay = 'Hace 1 día';
                    } else if (daysSinceLastLogin !== null) {
                        lastLoginDisplay = `Hace ${daysSinceLastLogin} días`;
                    } else {
                        lastLoginDisplay = new Date(lastLoginRaw).toLocaleDateString();
                    }
                }

                return {
                    ...c,
                    name: c.name || c.nombre || 'Sin Nombre',
                    email: c.email || 'N/A',
                    position: positionName || 'N/A',
                    progress,
                    requiredCount,
                    requiredCourseNames, // Array of course NAMES
                    coursesMapRef: coursesMap, // Reference to coursesMap for reverse lookup
                    completedCount,
                    presentationsViewed,
                    examsDownloaded,
                    status,
                    daysSinceLastLogin,
                    lastLogin: lastLoginDisplay
                };
            });

            // 4. Calculate Stats
            const total = processedCandidates.length;
            const completed = processedCandidates.filter(c => c.progress >= 100).length;
            const inactive = processedCandidates.filter(c => c.status === 'inactive').length;
            const inProgress = processedCandidates.filter(c => c.status === 'inProgress').length;
            const avgProgress = total > 0
                ? Math.round(processedCandidates.reduce((acc, c) => acc + c.progress, 0) / total)
                : 0;

            setCandidates(processedCandidates);
            setCoursesMapRef(coursesMap);
            setStats({ total, completed, inProgress, avgProgress, inactive });

        } catch (error) {
            console.error("Error fetching candidates:", error);
        } finally {
            setLoading(false);
        }
    };

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
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, ID o puesto..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: '#666' }}>
                                                <div title="Presentaciones Vistas" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <FileText size={14} />
                                                    {candidate.presentationsViewed} Vistas
                                                </div>
                                                <div title="Exámenes Descargados" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <FileCheck size={14} />
                                                    {candidate.examsDownloaded} Descargas
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
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className={styles.emptyState}>
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
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.avatar}>
                                        {candidate.name.charAt(0)}
                                    </div>
                                    <div className={styles.cardUserInfo}>
                                        <span className={styles.userName}>{candidate.name}</span>
                                        <span className={styles.userDetail}>{candidate.position}</span>
                                    </div>
                                    <span className={`${styles.badge} ${styles[candidate.status]}`}>
                                        {candidate.status === 'active' ? 'Activo' :
                                            candidate.status === 'inactive' ? 'Inactivo' : 'Pendiente'}
                                    </span>
                                </div>

                                <div className={styles.cardStats}>
                                    <div className={styles.statItem}>
                                        <span className={styles.statLabel}>Progreso</span>
                                        <div className={styles.progressContainer}>
                                            <div className={styles.progressBar}>
                                                <div
                                                    className={styles.progressFill}
                                                    style={{ width: `${candidate.progress}%` }}
                                                />
                                            </div>
                                            <span className={styles.progressText}>{candidate.progress}%</span>
                                        </div>
                                        <div className={styles.statDetail}>
                                            {candidate.completedCount}/{candidate.requiredCount} cursos
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    <button className={styles.viewDetailButton}>
                                        Ver Detalle
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
