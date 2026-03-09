'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AvatarSelector from '@/components/ui/AvatarSelector/AvatarSelector';
import EvaluationModal from '@/components/features/Training/EvaluationModal';
import MainSidebar from '@/components/layout/MainSidebar/MainSidebar';
import CandidateMobileHeader from '@/components/features/CandidateSidebar/CandidateMobileHeader';
import PendingTasks from '@/components/features/PendingTasks/PendingTasks';
import AlertsWidget from '@/components/features/AlertsWidget/AlertsWidget';
import { useNotifications } from '@/hooks/useNotifications';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useToast } from '@/components/ui/Toast/Toast';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, FileText, Clock } from 'lucide-react';
import styles from './page.module.css';

export default function DashboardPage() {
    const { user, loading: authLoading, updateUserProfile } = useAuth();
    const router = useRouter();

    const { stats, evaluations, expiringEmployees, trainingPlans, loading } = useDashboardStats(user);
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const { permission, requestPermission, sendNotification } = useNotifications();
    const { toast } = useToast();

    useEffect(() => {
        const candidateSession = sessionStorage.getItem('candidate_session');
        if (candidateSession) {
            router.push('/candidatos/dashboard');
        }
    }, [router]);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/');
                return;
            }
            if (user.rol === 'demo' || user.email?.includes('demo')) {
                router.push('/induccion');
            }
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (loading || (stats.expiringContracts === 0 && evaluations.overdue.length === 0)) return;

        const today = new Date().toISOString().split('T')[0];
        const lastNotif = localStorage.getItem('last_notification_date');

        if (lastNotif !== today && permission === 'granted') {
            if (stats.expiringContracts > 0) {
                sendNotification('Contratos por Vencer', {
                    body: `Tienes ${stats.expiringContracts} contrato(s) próximo(s) a vencer.`,
                    icon: '/web-app-manifest-192x192.png',
                    tag: 'expiring-contracts',
                });
            }
            localStorage.setItem('last_notification_date', today);
        }
    }, [loading, stats, evaluations, permission, sendNotification]);

    const handleEnableNotifications = useCallback(async () => {
        await requestPermission();
    }, [requestPermission]);

    const handleAvatarSave = useCallback(async (avatarUrl) => {
        if (user?.uid) {
            await updateUserProfile(user.uid, { photoURL: avatarUrl, avatar: avatarUrl });
        }
    }, [user?.uid, updateUserProfile]);

    const handleSaveEvaluation = async (evaluation, result) => {
        try {
            if (!evaluation.employeeId) throw new Error('No employee ID');

            const q = query(collection(db, 'employees'), where('employeeId', '==', evaluation.employeeId));
            const snapshot = await getDocs(q);

            if (snapshot.empty) throw new Error('Empleado no encontrado');

            const employeeDoc = snapshot.docs[0];
            const evalNum = evaluation.evalNum; // 1, 2 or 3
            if (![1, 2, 3].includes(evalNum)) throw new Error('Número de evaluación inválido');

            const updateData = {
                [`eval${evalNum}Score`]: result
            };

            await updateDoc(doc(db, 'employees', employeeDoc.id), updateData);

            toast.success(`Evaluación guardada para ${evaluation.employeeName}`);
            setSelectedEvaluation(null);
            window.location.reload();
        } catch (error) {
            console.error('Error al guardar evaluación:', error);
            toast.error('No se pudo guardar la evaluación: ' + error.message);
        }
    };

    const handleLogout = async () => {
        try {
            await destroySession();
            router.push('/');
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            router.push('/');
        }
    };

    if (authLoading || !user) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Cargando...</div>
            </div>
        );
    }



    return (
        <div className={styles.page}>
            <AvatarSelector
                isOpen={showAvatarSelector}
                onClose={() => setShowAvatarSelector(false)}
                onSave={handleAvatarSave}
                userName={user?.name || user?.displayName || 'Usuario'}
            />

            <EvaluationModal
                isOpen={!!selectedEvaluation}
                onClose={() => setSelectedEvaluation(null)}
                evaluation={selectedEvaluation}
                onSave={handleSaveEvaluation}
            />

            <CandidateMobileHeader
                user={user}
                onOpenSidebar={() => setIsSidebarOpen(true)}
                title="Dashboard"
            />

            <MainSidebar
                user={user}
                handleLogout={handleLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <div className={styles.scrollContent}>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <h1 className={styles.pageTitle}>Hola, {(user?.nombre || user?.nickname || user?.name || 'Administrador').split(' ')[0]}</h1>
                        <p className={styles.pageSubtitle}>Resumen de empleados, talento y contratos</p>
                    </header>

                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.primary}`}>
                                <Users size={20} />
                            </div>
                            <div className={styles.statTextGroup}>
                                <span className={styles.statValue}>{stats.totalEmployees}</span>
                                <span className={styles.statLabel}>Empleados</span>
                            </div>
                        </div>

                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.success}`}>
                                <FileText size={20} />
                            </div>
                            <div className={styles.statTextGroup}>
                                <span className={styles.statValue}>{stats.activeContracts}</span>
                                <span className={styles.statLabel}>Contratos Vigentes</span>
                            </div>
                        </div>

                        <div className={`${styles.statCard} ${stats.expiringContracts > 0 ? styles.clickable : ''}`}>
                            <div className={`${styles.statIcon} ${styles.warning}`}>
                                <Clock size={20} />
                            </div>
                            <div className={styles.statTextGroup}>
                                <span className={styles.statValue}>{stats.expiringContracts}</span>
                                <span className={styles.statLabel}>Por Vencer</span>
                            </div>
                        </div>
                    </div>

                    {permission === 'default' && (
                        <div className={styles.notificationBanner}>
                            <span>Activa las notificaciones para recibir alertas</span>
                            <button onClick={handleEnableNotifications} className={styles.notificationBtn}>
                                Activar
                            </button>
                        </div>
                    )}

                    <div className={styles.bottomGrid}>
                        {/* Pending Tasks Widget */}
                        <PendingTasks />

                        {/* Widget unificado de alertas */}
                        <AlertsWidget
                            evaluations={evaluations}
                            expiringEmployees={expiringEmployees}
                            trainingPlans={trainingPlans}
                            onEditEvaluation={setSelectedEvaluation}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
