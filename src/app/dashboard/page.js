'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProfileDropdown from '@/components/ProfileDropdown/ProfileDropdown';
import AvatarSelector from '@/components/AvatarSelector/AvatarSelector';
import { useNotifications } from '@/hooks/useNotifications';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import {
    Users, FileText, Clock, AlertCircle, Calendar,
    TrendingUp, Award, GitCompareArrows, ChevronRight
} from 'lucide-react';
import styles from './page.module.css';

export default function DashboardPage() {
    const { user, loading: authLoading, updateUserProfile } = useAuth();
    const router = useRouter();

    const { stats, evaluations, expiringEmployees, loading } = useDashboardStats(user);
    const [showExpiringModal, setShowExpiringModal] = useState(false);
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const { permission, requestPermission, sendNotification } = useNotifications();

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

    if (authLoading || !user) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Cargando...</div>
            </div>
        );
    }

    const quickActions = [
        { href: '/dashboard/candidates', title: 'Candidatos', icon: Users },
        { href: '/dashboard/programacion', title: 'Programación', icon: FileText },
        { href: '/capacitacion', title: 'Capacitación', icon: Award },
        { href: '/reports', title: 'Reportes', icon: TrendingUp },
        { href: '/capacitacion/comparacion', title: 'Comparación', icon: GitCompareArrows },
        { href: '/capacitacion/examen', title: 'Generador Exámenes', icon: Calendar },
    ];

    return (
        <div className={styles.page}>
            <AvatarSelector
                isOpen={showAvatarSelector}
                onClose={() => setShowAvatarSelector(false)}
                onSave={handleAvatarSave}
                userName={user?.name || user?.displayName || 'Usuario'}
            />

            <div className={styles.profileContainer}>
                <ProfileDropdown onAvatarClick={() => setShowAvatarSelector(true)} />
            </div>

            <div className={styles.container}>
                <Link href="/modulos" className={styles.backLink}>
                    <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
                    Módulos
                </Link>

                <header className={styles.header}>
                    <span className={styles.portal}>Dashboard</span>
                    <h1 className={styles.title}>Gestión de Talento</h1>
                    <p className={styles.subtitle}>Resumen de empleados y contratos</p>
                </header>

                <div className={styles.statsGrid}>
                    <Link href="/employees" className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.primary}`}>
                            <Users size={20} />
                        </div>
                        <span className={styles.statValue}>{stats.totalEmployees}</span>
                        <span className={styles.statLabel}>Empleados</span>
                    </Link>

                    <Link href="/employees" className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.success}`}>
                            <FileText size={20} />
                        </div>
                        <span className={styles.statValue}>{stats.activeContracts}</span>
                        <span className={styles.statLabel}>Contratos Vigentes</span>
                    </Link>

                    <div className={`${styles.statCard} ${stats.expiringContracts > 0 ? styles.clickable : ''}`}>
                        <div className={`${styles.statIcon} ${styles.warning}`}>
                            <Clock size={20} />
                        </div>
                        <span className={styles.statValue}>{stats.expiringContracts}</span>
                        <span className={styles.statLabel}>Por Vencer</span>
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

                {(evaluations.overdue.length > 0 || evaluations.upcoming.length > 0) && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Evaluaciones</h2>
                            {evaluations.overdue.length > 0 && (
                                <span className={`${styles.sectionBadge} ${styles.danger}`}>
                                    {evaluations.overdue.length} vencida{evaluations.overdue.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <div className={styles.alertList}>
                            {evaluations.overdue.slice(0, 3).map((ev, i) => (
                                <div key={`overdue-${i}`} className={styles.alertItem}>
                                    <div className={`${styles.alertIcon} ${styles.danger}`}>
                                        <AlertCircle size={16} />
                                    </div>
                                    <div className={styles.alertContent}>
                                        <span className={styles.alertTitle}>{ev.employeeName}</span>
                                        <span className={styles.alertMeta}>
                                            {ev.evaluationType} · Vencida hace <strong>{ev.daysOverdue}d</strong>
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {evaluations.upcoming.slice(0, 2).map((ev, i) => (
                                <div key={`upcoming-${i}`} className={styles.alertItem}>
                                    <div className={`${styles.alertIcon} ${styles.warning}`}>
                                        <Calendar size={16} />
                                    </div>
                                    <div className={styles.alertContent}>
                                        <span className={styles.alertTitle}>{ev.employeeName}</span>
                                        <span className={styles.alertMeta}>
                                            {ev.evaluationType} · En <strong>{ev.daysUntil}d</strong>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {stats.expiringContracts > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Contratos Próximos a Vencer</h2>
                            <span className={`${styles.sectionBadge} ${styles.warning}`}>
                                {stats.expiringContracts}
                            </span>
                        </div>
                        <div className={styles.alertList}>
                            {expiringEmployees.slice(0, 3).map((emp, i) => (
                                <div key={i} className={styles.alertItem}>
                                    <div className={`${styles.alertIcon} ${styles.warning}`}>
                                        <Clock size={16} />
                                    </div>
                                    <div className={styles.alertContent}>
                                        <span className={styles.alertTitle}>{emp.name}</span>
                                        <span className={styles.alertMeta}>
                                            {emp.position} · Vence en <strong>{emp.daysUntilExpiry}d</strong>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Accesos Rápidos</h2>
                    </div>
                    <div className={styles.actionsGrid}>
                        {quickActions.map((action) => (
                            <Link key={action.href} href={action.href} className={styles.actionBtn}>
                                <div className={styles.actionIcon}>
                                    <action.icon size={18} />
                                </div>
                                <span className={styles.actionText}>{action.title}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
