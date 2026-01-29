'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card/Card';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import { Progress, CircularProgress } from '@/components/ui/Progress/Progress';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogClose } from '@/components/ui/Dialog/Dialog';
import { RoleAvatar } from '@/components/RoleAvatar';
import styles from './page.module.css';

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
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
    const [showExpiringModal, setShowExpiringModal] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
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

    // Gender-based greeting detection
    const getGreeting = (name) => {
        if (!name) return 'Bienvenido';

        const firstName = name.trim().split(' ')[0].toLowerCase();

        // Common female names in Spanish
        const femaleNames = [
            'maria', 'ana', 'carmen', 'rosa', 'patricia', 'laura', 'claudia', 'andrea',
            'lucia', 'sofia', 'elena', 'marta', 'isabel', 'paula', 'sara', 'noemi',
            'noemí', 'alejandra', 'gabriela', 'diana', 'beatriz', 'monica', 'monica',
            'silvia', 'veronica', 'adriana', 'alicia', 'susana', 'raquel', 'natalia',
            'julia', 'teresa', 'eva', 'cristina', 'mariana', 'fernanda', 'valeria',
            'daniela', 'victoria', 'karla', 'carla', 'paola', 'lorena', 'jessica',
            'jessica', 'brenda', 'elizabeth', 'guadalupe', 'leticia', 'marisol',
            'rocio', 'araceli', 'norma', 'josefina', 'esther', 'yolanda', 'irma',
            'lizbeth', 'maribel', 'perla', 'dulce', 'ivonne', 'yvonne', 'edith',
            'miriam', 'rebeca', 'vanessa', 'fabiola', 'angelica', 'marlene', 'erika',
            'erica', 'karyna', 'karina', 'carolina', 'esmeralda', 'jazmin', 'jazmín'
        ];

        // Check if it's a known female name
        if (femaleNames.includes(firstName)) {
            return 'Bienvenida';
        }

        // Common female name endings in Spanish
        const femaleEndings = ['a', 'ia', 'na', 'la', 'ra', 'da', 'sa', 'ía'];
        const masculineExceptions = ['carlos', 'nicolas', 'matias', 'elias', 'jonas',
            'isaias', 'jeremias', 'josefa', 'garcia', 'peña', 'mejia', 'mejía'];

        // Don't apply ending rule to known masculine names
        if (masculineExceptions.includes(firstName)) {
            return 'Bienvenido';
        }

        // Check endings (less reliable but helpful)
        for (const ending of femaleEndings) {
            if (firstName.endsWith(ending) && firstName.length > 3) {
                return 'Bienvenida';
            }
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

    const contractPercentage = stats.totalEmployees > 0
        ? Math.round((stats.activeContracts / stats.totalEmployees) * 100)
        : 0;

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerInfo}>
                            <div className={styles.headerTitle}>
                                <h1 className="fade-in">{getGreeting(userName)}{userName ? `, ${userName}` : ''}</h1>
                                {user?.rol && <RoleAvatar role={user.rol} size={45} />}
                            </div>
                            <p className="slide-in">Panel de control del sistema</p>
                        </div>
                        <Link href="/employees">
                            <Button
                                variant="primary"
                                icon={
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                }
                            >
                                Empleados
                            </Button>
                        </Link>
                    </div>

                    {/* Welcome Hero Section */}
                    {showWelcome && (
                        <section className={styles.welcomeSection}>
                            {/* Background Effects */}
                            <div className={styles.welcomeGlow1}></div>
                            <div className={styles.welcomeGlow2}></div>

                            <div className={styles.welcomeContent}>
                                {/* Header */}
                                <div className={styles.welcomeHeader}>
                                    <div className={styles.welcomeLogo}>
                                        <div className={styles.welcomeLogoIcon}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <span className={styles.welcomeVersion}>v2.0</span>
                                    </div>
                                    <button
                                        className={styles.welcomeClose}
                                        onClick={() => setShowWelcome(false)}
                                        aria-label="Cerrar"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Title */}
                                <h2 className={styles.welcomeTitle}>
                                    Bienvenido a <span className={styles.welcomeTitleGradient}>Vertx</span>
                                </h2>
                                <p className={styles.welcomeSubtitle}>
                                    Tu centro de comando para la gestión de talento y cumplimiento industrial.
                                </p>

                                {/* Modules Grid */}
                                <div className={styles.modulesGrid}>
                                    <Link href="/employees" className={styles.moduleCard}>
                                        <div className={styles.moduleCardHeader}>
                                            <div className={styles.moduleIcon}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                </svg>
                                            </div>
                                            <h4>Gestión de Personal</h4>
                                        </div>
                                        <ul className={styles.moduleList}>
                                            <li>Perfiles y expedientes</li>
                                            <li>Evaluación de desempeño</li>
                                            <li>Control de contratos</li>
                                        </ul>
                                    </Link>

                                    <Link href="/capacitacion" className={styles.moduleCard}>
                                        <div className={styles.moduleCardHeader}>
                                            <div className={styles.moduleIcon}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                                </svg>
                                            </div>
                                            <h4>Capacitación</h4>
                                        </div>
                                        <ul className={styles.moduleList}>
                                            <li>Registros DC-3</li>
                                            <li>Matriz de Habilidades</li>
                                            <li>Planes de carrera</li>
                                        </ul>
                                    </Link>

                                    <Link href="/capacitacion/promociones" className={styles.moduleCard}>
                                        <div className={styles.moduleCardHeader}>
                                            <div className={styles.moduleIcon}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                                    <polyline points="17 6 23 6 23 12" />
                                                </svg>
                                            </div>
                                            <h4>Ascensos</h4>
                                        </div>
                                        <ul className={styles.moduleList}>
                                            <li>Elegibilidad automática</li>
                                            <li>Criterios objetivos</li>
                                            <li>Reportes para auditoría</li>
                                        </ul>
                                    </Link>

                                    <Link href="/reports" className={styles.moduleCard}>
                                        <div className={styles.moduleCardHeader}>
                                            <div className={styles.moduleIcon}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="18" y1="20" x2="18" y2="10" />
                                                    <line x1="12" y1="20" x2="12" y2="4" />
                                                    <line x1="6" y1="20" x2="6" y2="14" />
                                                </svg>
                                            </div>
                                            <h4>Analytics</h4>
                                        </div>
                                        <ul className={styles.moduleList}>
                                            <li>KPIs en tiempo real</li>
                                            <li>Cumplimiento ISO</li>
                                            <li>Alertas preventivas</li>
                                        </ul>
                                    </Link>
                                </div>
                            </div>
                        </section>
                    )}

                    {loading ? (
                        <div className={styles.statsGrid}>
                            {[1, 2, 3].map(i => (
                                <Card key={i} hover={false}>
                                    <CardContent>
                                        <div className={styles.skeletonCard}>
                                            <Skeleton variant="circular" width={56} height={56} />
                                            <div className={styles.skeletonContent}>
                                                <Skeleton width={60} height={32} />
                                                <Skeleton width={100} height={16} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.statsGrid}>
                            <Card className={styles.statCard1}>
                                <CardContent>
                                    <div className={styles.statCardInner}>
                                        <div className={styles.statIcon}>
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                        </div>
                                        <div className={styles.statContent}>
                                            <div className={styles.statNumber}>{stats.totalEmployees}</div>
                                            <div className={styles.statLabel}>Total Empleados</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className={styles.statCard2}>
                                <CardContent>
                                    <div className={styles.statCardInner}>
                                        <CircularProgress
                                            value={contractPercentage}
                                            size={72}
                                            strokeWidth={6}
                                            variant="success"
                                        />
                                        <div className={styles.statContent}>
                                            <div className={styles.statNumber}>{stats.activeContracts}</div>
                                            <div className={styles.statLabel}>Contratos Activos</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className={`${styles.statCard3} ${stats.expiringContracts > 0 ? styles.clickableCard : ''}`}
                                onClick={() => stats.expiringContracts > 0 && setShowExpiringModal(true)}
                            >
                                <CardContent>
                                    <div className={styles.statCardInner}>
                                        <div className={styles.statIcon + ' ' + styles.warningIcon}>
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                        </div>
                                        <div className={styles.statContent}>
                                            <div className={styles.statNumber}>{stats.expiringContracts}</div>
                                            <div className={styles.statLabel}>Próximos a Vencer</div>
                                            {stats.expiringContracts > 0 && (
                                                <Badge variant="warning" size="sm">En 30 días</Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Alertas de Evaluaciones */}
                    {(evaluations.upcoming.length > 0 || evaluations.overdue.length > 0) && (
                        <div className={styles.evaluationsSection}>
                            <h2>Alertas de Evaluaciones</h2>

                            <div className={styles.evaluationsGrid}>
                                {/* Evaluaciones Próximas */}
                                {evaluations.upcoming.length > 0 && (
                                    <Card className={styles.evalCardUpcoming}>
                                        <CardHeader>
                                            <div className={styles.evalHeaderRow}>
                                                <div className={styles.evalAlertIconUpcoming}>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <polyline points="12 6 12 12 16 14" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <CardTitle>Próximas a Aplicar</CardTitle>
                                                    <Badge variant="info" size="sm">{evaluations.upcoming.length} evaluación(es)</Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className={styles.evalAlertList}>
                                                {evaluations.upcoming.slice(0, 5).map((evalItem, idx) => (
                                                    <div key={idx} className={styles.evalAlertItem}>
                                                        <div className={styles.evalAlertInfo}>
                                                            <strong>{evalItem.employeeId} - {evalItem.employeeName}</strong>
                                                            <span>Evaluación {evalItem.evalNum}</span>
                                                        </div>
                                                        <div className={styles.evalAlertDate}>
                                                            <span className={styles.dateLabel}>{formatDate(evalItem.date)}</span>
                                                            <Badge
                                                                variant={evalItem.daysUntil === 0 ? 'danger' : 'warning'}
                                                                size="sm"
                                                                dot={evalItem.daysUntil === 0}
                                                            >
                                                                {evalItem.daysUntil === 0 ? '¡Hoy!' : `En ${evalItem.daysUntil} día(s)`}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Evaluaciones Vencidas */}
                                {evaluations.overdue.length > 0 && (
                                    <Card className={styles.evalCardOverdue}>
                                        <CardHeader>
                                            <div className={styles.evalHeaderRow}>
                                                <div className={styles.evalAlertIconOverdue}>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <circle cx="12" cy="12" r="10" />
                                                        <line x1="12" y1="8" x2="12" y2="12" />
                                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <CardTitle>Vencidas</CardTitle>
                                                    <Badge variant="danger" size="sm">{evaluations.overdue.length} evaluación(es)</Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className={styles.evalAlertList}>
                                                {evaluations.overdue.slice(0, 5).map((evalItem, idx) => (
                                                    <div key={idx} className={styles.evalAlertItem}>
                                                        <div className={styles.evalAlertInfo}>
                                                            <strong>{evalItem.employeeId} - {evalItem.employeeName}</strong>
                                                            <span>Evaluación {evalItem.evalNum}</span>
                                                        </div>
                                                        <div className={styles.evalAlertDate}>
                                                            <span className={styles.dateLabel}>{formatDate(evalItem.date)}</span>
                                                            <Badge variant="danger" size="sm">
                                                                Hace {evalItem.daysOverdue} día(s)
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={styles.quickActions}>
                        <h2>Acciones Rápidas</h2>
                        <div className={styles.actionsGrid}>


                            <Link href="/employees" className={styles.actionCard}>
                                <div className={styles.actionIcon}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                </div>
                                <div className={styles.actionContent}>
                                    <h3>Ver Lista Completa</h3>
                                    <p>Consultar todos los empleados registrados</p>
                                </div>
                                <svg className={styles.actionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </Link>

                            <Link href="/reports" className={styles.actionCard}>
                                <div className={styles.actionIcon}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="20" x2="18" y2="10" />
                                        <line x1="12" y1="20" x2="12" y2="4" />
                                        <line x1="6" y1="20" x2="6" y2="14" />
                                    </svg>
                                </div>
                                <div className={styles.actionContent}>
                                    <h3>Reportes de Formación</h3>
                                    <p>Ver cumplimiento del Plan de Formación</p>
                                </div>
                                <svg className={styles.actionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </Link>

                            <Link href="/capacitacion" className={styles.actionCard}>
                                <div className={styles.actionIcon}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                    </svg>
                                </div>
                                <div className={styles.actionContent}>
                                    <h3>Capacitación</h3>
                                    <p>Gestionar programas y cursos</p>
                                </div>
                                <svg className={styles.actionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal de Próximos a Vencer */}
            <Dialog open={showExpiringModal} onOpenChange={setShowExpiringModal}>
                <DialogHeader>
                    <DialogClose onClose={() => setShowExpiringModal(false)} />
                    <DialogTitle>Contratos Próximos a Vencer</DialogTitle>
                    <p className={styles.modalDescription}>
                        Empleados con contratos que vencen en los próximos 30 días
                    </p>
                </DialogHeader>
                <DialogBody>
                    <div className={styles.expiringList}>
                        {expiringEmployees.map((emp, idx) => (
                            <Link
                                key={emp.id || idx}
                                href={`/employees/${emp.id}`}
                                className={styles.expiringItem}
                                onClick={() => setShowExpiringModal(false)}
                            >
                                <div className={styles.expiringAvatar}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <div className={styles.expiringInfo}>
                                    <div className={styles.expiringName}>
                                        <span className={styles.employeeId}>{emp.employeeId}</span>
                                        <span className={styles.employeeName}>{emp.name}</span>
                                    </div>
                                    <div className={styles.expiringDetails}>
                                        <span className={styles.expiringPosition}>{emp.position || 'Sin puesto asignado'}</span>
                                    </div>
                                </div>
                                <div className={styles.expiringDate}>
                                    <span className={styles.dateValue}>{formatDate(emp.contractEndDate)}</span>
                                    <Badge
                                        variant={emp.daysUntilExpiry <= 7 ? 'danger' : 'warning'}
                                        size="sm"
                                    >
                                        {emp.daysUntilExpiry === 0
                                            ? '¡Hoy!'
                                            : emp.daysUntilExpiry === 1
                                                ? 'Mañana'
                                                : `${emp.daysUntilExpiry} días`
                                        }
                                    </Badge>
                                </div>
                            </Link>
                        ))}
                    </div>
                </DialogBody>
            </Dialog>
        </>
    );
}
