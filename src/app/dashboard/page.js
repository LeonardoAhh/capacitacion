'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge/Badge';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogClose } from '@/components/ui/Dialog/Dialog';
import { RoleAvatar } from '@/components/RoleAvatar';
import { useNotifications } from '@/hooks/useNotifications';
import styles from './page.module.css';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    // Data States
    const [stats, setStats] = useState({
        totalEmployees: 0,
        activeContracts: 0,
        expiringContracts: 0
    });
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [evaluations, setEvaluations] = useState({
        upcoming: [],
        overdue: []
    });
    const [expiringEmployees, setExpiringEmployees] = useState([]);

    // UI States
    const [showExpiringModal, setShowExpiringModal] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);

    // Notifications
    const { permission, requestPermission, sendNotification } = useNotifications();
    const [showNotifBanner, setShowNotifBanner] = useState(false);

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
        if (user) {
            loadStats();
            loadUserData();
            if (sessionStorage.getItem('showWelcome')) {
                setShowWelcome(true);
                sessionStorage.removeItem('showWelcome');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Check notifications logic
    useEffect(() => {
        if (!loading && (stats.expiringContracts > 0 || evaluations.overdue.length > 0)) {
            const today = new Date().toISOString().split('T')[0];
            const lastNotif = localStorage.getItem('last_notification_date');

            if (lastNotif !== today && permission === 'granted') {
                if (stats.expiringContracts > 0) {
                    sendNotification('⚠️ Contratos por Vencer', {
                        body: `Tienes ${stats.expiringContracts} contrato(s) próximo(s) a vencer. Revisa el dashboard para más detalles.`
                    });
                }
                if (evaluations.overdue.length > 0) {
                    setTimeout(() => {
                        sendNotification('🚨 Evaluaciones Vencidas', {
                            body: `Hay ${evaluations.overdue.length} evaluación(es) con retraso.`,
                            tag: 'overdue-evals'
                        });
                    }, 5000); // 5 sec delay between notifications
                }
                localStorage.setItem('last_notification_date', today);
            } else if (permission === 'default' && lastNotif !== today) {
                setShowNotifBanner(true);
            }
        }
    }, [loading, stats, evaluations, permission, sendNotification]);

    const handleEnableNotifications = async () => {
        const granted = await requestPermission();
        if (granted) {
            setShowNotifBanner(false);
            sendNotification('🔔 Notificaciones Activadas', {
                body: 'Ahora recibirás alertas sobre contratos y evaluaciones.'
            });
        }
    };

    const loadUserData = async () => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', user.email));
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const userData = snapshot.docs[0].data();
                setUserName(userData.nombre || '');
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const loadStats = async () => {
        try {
            const employeesRef = collection(db, 'employees');
            const snapshot = await getDocs(employeesRef);

            const now = new Date();
            now.setHours(0, 0, 0, 0);

            const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const totalEmployees = employees.length;

            const activeContracts = employees.filter(emp => {
                if (!emp.contractEndDate) return false;
                const endDate = new Date(emp.contractEndDate + 'T00:00:00');
                return endDate >= now;
            }).length;

            const expiringEmployeesList = employees.filter(emp => {
                if (!emp.contractEndDate) return false;
                const endDate = new Date(emp.contractEndDate + 'T00:00:00');
                const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
            }).map(emp => {
                const endDate = new Date(emp.contractEndDate + 'T00:00:00');
                const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                return { ...emp, daysUntilExpiry };
            }).sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

            const expiringContracts = expiringEmployeesList.length;

            const upcomingEvaluations = [];
            const overdueEvaluations = [];

            employees.forEach(emp => {
                const evalDates = [
                    { num: 1, date: emp.eval1Date, score: emp.eval1Score },
                    { num: 2, date: emp.eval2Date, score: emp.eval2Score },
                    { num: 3, date: emp.eval3Date, score: emp.eval3Score }
                ];

                evalDates.forEach(evalItem => {
                    if (!evalItem.date) return;

                    const evalDate = new Date(evalItem.date + 'T00:00:00');
                    const daysUntil = Math.ceil((evalDate - now) / (1000 * 60 * 60 * 24));
                    const hasScore = evalItem.score !== '' && evalItem.score !== null && evalItem.score !== undefined;

                    if (daysUntil >= 0 && daysUntil <= 3 && !hasScore) {
                        upcomingEvaluations.push({
                            employeeId: emp.employeeId,
                            employeeName: emp.name,
                            evalNum: evalItem.num,
                            date: evalItem.date,
                            daysUntil: daysUntil
                        });
                    }

                    if (daysUntil < 0 && !hasScore) {
                        overdueEvaluations.push({
                            employeeId: emp.employeeId,
                            employeeName: emp.name,
                            evalNum: evalItem.num,
                            date: evalItem.date,
                            daysOverdue: Math.abs(daysUntil)
                        });
                    }
                });
            });

            upcomingEvaluations.sort((a, b) => a.daysUntil - b.daysUntil);
            overdueEvaluations.sort((a, b) => b.daysOverdue - a.daysOverdue);

            setStats({ totalEmployees, activeContracts, expiringContracts });
            setEvaluations({ upcoming: upcomingEvaluations, overdue: overdueEvaluations });
            setExpiringEmployees(expiringEmployeesList);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const getGreeting = (name) => {
        if (!name) return 'Bienvenido';
        const firstName = name.trim().split(' ')[0].toLowerCase();
        if (firstName.endsWith('a') && !['nicolas', 'jonas', 'elias', 'matias'].includes(firstName)) {
            return 'Bienvenida';
        }
        return 'Bienvenido';
    };

    if (authLoading || !user) {
        return (
            <div className={styles.loadingContainer}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className={styles.main}>
            <Navbar />

            <div className={styles.bgDecoration}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
            </div>

            <div className={styles.container}>
                {/* Notification Banner */}
                {showNotifBanner && (
                    <div className={styles.sectionCard} style={{
                        marginBottom: '20px',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 24px',
                        background: 'rgba(0, 122, 255, 0.1)',
                        borderColor: 'rgba(0, 122, 255, 0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '1.5rem' }}>🔔</span>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Activar Notificaciones</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    Recibe alertas sobre contratos vencidos y evaluaciones pendientes.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleEnableNotifications}
                            style={{
                                padding: '8px 16px',
                                background: '#007AFF',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            Activar
                        </button>
                    </div>
                )}

                <header className={styles.header}>
                    <div className={styles.headerTitle}>
                        <h1>{getGreeting(userName)}{userName ? `, ${userName}` : ''}</h1>
                        <p className={styles.headerSubtitle}>Resumen de actividad y pendientes</p>
                    </div>
                    {user?.rol && <RoleAvatar role={user.rol} size={48} />}
                </header>

                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.primary}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div className={styles.statContent}>
                            <div className={styles.statNumber}>{loading ? '-' : stats.totalEmployees}</div>
                            <div className={styles.statLabel}>Total Empleados</div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={`${styles.statIcon} ${styles.success}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <path d="M14 2v6h6" />
                                <path d="M16 13H8" />
                                <path d="M16 17H8" />
                                <path d="M10 9H8" />
                            </svg>
                        </div>
                        <div className={styles.statContent}>
                            <div className={styles.statNumber}>{loading ? '-' : stats.activeContracts}</div>
                            <div className={styles.statLabel}>Contratos Activos</div>
                        </div>
                    </div>

                    <div
                        className={`${styles.statCard} ${stats.expiringContracts > 0 ? styles.clickable : ''}`}
                        onClick={() => stats.expiringContracts > 0 && setShowExpiringModal(true)}
                    >
                        <div className={`${styles.statIcon} ${stats.expiringContracts > 0 ? styles.warning : styles.success}`}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                        </div>
                        <div className={styles.statContent}>
                            <div className={styles.statNumber}>{loading ? '-' : stats.expiringContracts}</div>
                            <div className={styles.statLabel}>Vencen pronto</div>
                        </div>
                    </div>
                </div>

                <div className={styles.dashboardGrid}>
                    <div className={styles.column}>
                        {(evaluations.upcoming.length > 0 || evaluations.overdue.length > 0) ? (
                            <section className={styles.sectionCard}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>Evaluaciones Pendientes</h2>
                                </div>
                                <div className={styles.alertList}>
                                    {evaluations.overdue.slice(0, 3).map((item, idx) => (
                                        <div key={`overdue-${idx}`} className={styles.alertItem} style={{ borderLeft: '4px solid #FF3B30' }}>
                                            <div className={styles.alertIcon} style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#FF3B30' }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="8" x2="12" y2="12" />
                                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                                </svg>
                                            </div>
                                            <div className={styles.alertInfo}>
                                                <span className={styles.alertTitle}>{item.employeeName}</span>
                                                <span className={styles.alertSubtitle}>Evaluación {item.evalNum} vencida</span>
                                            </div>
                                            <div className={styles.alertMeta}>
                                                <Badge variant="danger" size="sm">Hace {item.daysOverdue} días</Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {evaluations.upcoming.slice(0, 5).map((item, idx) => (
                                        <div key={`upcoming-${idx}`} className={styles.alertItem} style={{ borderLeft: '4px solid #FF9F0A' }}>
                                            <div className={styles.alertIcon} style={{ background: 'rgba(255, 159, 10, 0.1)', color: '#FF9F0A' }}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                            </div>
                                            <div className={styles.alertInfo}>
                                                <span className={styles.alertTitle}>{item.employeeName}</span>
                                                <span className={styles.alertSubtitle}>Evaluación {item.evalNum} próxima</span>
                                            </div>
                                            <div className={styles.alertMeta}>
                                                <Badge variant="warning" size="sm">En {item.daysUntil} días</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ) : (
                            <section className={styles.sectionCard}>
                                <div className={styles.sectionHeader}>
                                    <h2 className={styles.sectionTitle}>Todo al día</h2>
                                </div>
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '16px', opacity: 0.5 }}>
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    <p>No hay evaluaciones pendientes ni atrasadas.</p>
                                </div>
                            </section>
                        )}
                    </div>

                    <div className={styles.column}>
                        <section className={styles.sectionCard}>
                            <h2 className={styles.sectionTitle}>Accesos Directos</h2>
                            <div className={styles.actionsGrid}>
                                <Link href="/employees" className={styles.actionBtn}>
                                    <div className={styles.actionIcon}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        </svg>
                                    </div>
                                    <span className={styles.actionText}>Empleados</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </Link>

                                <Link href="/capacitacion" className={styles.actionBtn}>
                                    <div className={styles.actionIcon}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                        </svg>
                                    </div>
                                    <span className={styles.actionText}>Capacitación</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </Link>

                                <Link href="/reports" className={styles.actionBtn}>
                                    <div className={styles.actionIcon}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="20" x2="18" y2="10" />
                                            <line x1="12" y1="20" x2="12" y2="4" />
                                            <line x1="6" y1="20" x2="6" y2="14" />
                                        </svg>
                                    </div>
                                    <span className={styles.actionText}>Reportes</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <Dialog open={showExpiringModal} onOpenChange={setShowExpiringModal}>
                <DialogHeader>
                    <DialogClose onClose={() => setShowExpiringModal(false)} />
                    <DialogTitle>Vencimientos Próximos</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {expiringEmployees.map((emp, idx) => (
                            <Link
                                key={emp.id || idx}
                                href={`/employees?search=${emp.employeeId}`}
                                onClick={() => setShowExpiringModal(false)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600 }}>{emp.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(emp.contractEndDate)}</div>
                                </div>
                                <Badge variant={emp.daysUntilExpiry <= 7 ? 'danger' : 'warning'}>
                                    {emp.daysUntilExpiry} días
                                </Badge>
                            </Link>
                        ))}
                    </div>
                </DialogBody>
            </Dialog>
        </div>
    );
}
