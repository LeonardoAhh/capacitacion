'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProfileDropdown from '@/components/ProfileDropdown/ProfileDropdown';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import DashboardBentoGrid from '@/components/Dashboard/DashboardBentoGrid';
import NotificationBanner from './components/NotificationBanner';
import ExpiringContractsDialog from './components/ExpiringContractsDialog';
import styles from './page.module.css';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // Data — hook centralizado
    const {
        stats,
        evaluations,
        expiringEmployees,
        loading,
    } = useDashboardStats(user);

    // UI States
    const [showExpiringModal, setShowExpiringModal] = useState(false);

    // Notifications
    const { permission, requestPermission, sendNotification } = useNotifications();

    // ─── Protección: Redirigir candidatos a su dashboard ────────
    useEffect(() => {
        const candidateSession = sessionStorage.getItem('candidate_session');
        if (candidateSession) {
            router.push('/candidatos/dashboard');
        }
    }, [router]);

    // ─── Redirigir si no está autenticado o es demo ─────────────
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

    // ─── Notificaciones push automáticas ────────────────────────
    useEffect(() => {
        if (loading || (stats.expiringContracts === 0 && evaluations.overdue.length === 0)) return;

        const today = new Date().toISOString().split('T')[0];
        const lastNotif = localStorage.getItem('last_notification_date');

        if (lastNotif !== today && permission === 'granted') {
            if (stats.expiringContracts > 0) {
                sendNotification('⚠️ Contratos por Vencer', {
                    body: `Tienes ${stats.expiringContracts} contrato(s) próximo(s) a vencer. Revisa el dashboard para más detalles.`,
                    icon: '/icon.svg',
                    tag: 'expiring-contracts',
                    requireInteraction: true,
                });
            }

            if (evaluations.overdue.length > 0) {
                setTimeout(() => {
                    sendNotification('🚨 Evaluaciones Vencidas', {
                        body: `Hay ${evaluations.overdue.length} evaluación(es) con retraso.`,
                        icon: '/icon.svg',
                        tag: 'overdue-evals',
                        requireInteraction: true,
                    });
                }, 5000);
            }
            localStorage.setItem('last_notification_date', today);
        }
    }, [loading, stats, evaluations, permission, sendNotification]);

    // ─── Handlers ───────────────────────────────────────────────
    const handleEnableNotifications = useCallback(async () => {
        const granted = await requestPermission();
        if (granted) {
            sendNotification('🔔 Notificaciones Activadas', {
                body: 'Ahora recibirás alertas sobre contratos y evaluaciones.',
                icon: '/icon.svg'
            });
        }
    }, [requestPermission, sendNotification]);

    // ─── Loading state ──────────────────────────────────────────
    if (authLoading || !user) {
        return (
            <div className={styles.loadingContainer}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className={styles.main}>
            <div className={styles.profileContainer}>
                <ProfileDropdown />
            </div>

            <div className={styles.bgDecoration}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
            </div>

            <div className={styles.container}>
                {/* Back Link */}
                <Link href="/modulos" className={styles.backLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5" />
                        <path d="M12 19l-7-7 7-7" />
                    </svg>
                    Volver
                </Link>

                {/* Notification Banner */}
                {permission === 'default' && (
                    <NotificationBanner onEnable={handleEnableNotifications} />
                )}

                {/* Modern Bento Grid Dashboard */}
                <DashboardBentoGrid
                    stats={stats}
                    evaluations={evaluations}
                />
            </div>

            {/* Expiring Contracts Modal */}
            <ExpiringContractsDialog
                open={showExpiringModal}
                onOpenChange={setShowExpiringModal}
                employees={expiringEmployees}
            />
        </div>
    );
}
