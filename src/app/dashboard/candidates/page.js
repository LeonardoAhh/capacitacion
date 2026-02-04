'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';
import Link from 'next/link';
import { Search, ArrowLeft, Users, CheckCircle, Clock } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

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
        avgProgress: 0
    });
    const [searchTerm, setSearchTerm] = useState('');

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

            // 2. Fetch Positions to know required course count
            const positionsRef = collection(db, 'positions');
            const posSnapshot = await getDocs(positionsRef);
            const positionsMap = {};
            posSnapshot.docs.forEach(doc => {
                const data = doc.data();
                positionsMap[data.name] = (data.requiredCourses || []).length;
            });

            // 3. Process Data
            const processedCandidates = rawCandidates.map(c => {
                const positionName = c.position || c.puesto; // Handle varied field names
                const requiredCount = positionsMap[positionName] || 0;

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
                if (progress >= 100) status = 'active'; // Completed
                else if (progress > 0 || startedCoursesCount > 0) status = 'pending'; // In Progress

                return {
                    ...c,
                    name: c.name || c.nombre || 'Sin Nombre',
                    email: c.email || 'N/A',
                    position: positionName || 'N/A',
                    progress,
                    requiredCount,
                    completedCount,
                    presentationsViewed, // New field for granular tracking
                    examsDownloaded,     // New field for granular tracking
                    status,
                    lastLogin: c.lastLoginCandidate ? new Date(c.lastLoginCandidate).toLocaleDateString() : 'Nunca'
                };
            });

            // 4. Calculate Stats
            const total = processedCandidates.length;
            const completed = processedCandidates.filter(c => c.progress >= 100).length;
            const inProgress = total - completed;
            const avgProgress = total > 0
                ? Math.round(processedCandidates.reduce((acc, c) => acc + c.progress, 0) / total)
                : 0;

            setCandidates(processedCandidates);
            setStats({ total, completed, inProgress, avgProgress });

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
                                <th>Progreso General</th>
                                <th>Actividad Detallada</th>
                                <th>Último Acceso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCandidates.length > 0 ? (
                                filteredCandidates.map((candidate) => (
                                    <tr key={candidate.id}>
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
                                                    <Users size={14} />
                                                    {candidate.presentationsViewed} Vistas
                                                </div>
                                                <div title="Exámenes Descargados" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <CheckCircle size={14} />
                                                    {candidate.examsDownloaded} Descargas
                                                </div>
                                            </div>
                                        </td>
                                        <td>{candidate.lastLogin}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className={styles.emptyState}>
                                        No se encontraron candidatos que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
