'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
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

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadStats();
            loadUserData();
        }
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
            now.setHours(0, 0, 0, 0); // Normalizar a inicio del día

            const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const totalEmployees = employees.length;

            // Contratos activos: fecha de fin de contrato es mayor a hoy
            const activeContracts = employees.filter(emp => {
                if (!emp.contractEndDate) return false;
                const endDate = new Date(emp.contractEndDate + 'T00:00:00');
                return endDate >= now;
            }).length;

            // Próximos a vencer: entre 1 y 30 días para que expire
            const expiringContracts = employees.filter(emp => {
                if (!emp.contractEndDate) return false;
                const endDate = new Date(emp.contractEndDate + 'T00:00:00');
                const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
            }).length;

            // Calcular evaluaciones próximas y vencidas
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

                    // Próximas: dentro de 3 días y sin calificación
                    if (daysUntil >= 0 && daysUntil <= 3 && !hasScore) {
                        upcomingEvaluations.push({
                            employeeId: emp.employeeId,
                            employeeName: emp.name,
                            evalNum: evalItem.num,
                            date: evalItem.date,
                            daysUntil: daysUntil
                        });
                    }

                    // Vencidas: pasadas y sin calificación
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

            // Ordenar por urgencia
            upcomingEvaluations.sort((a, b) => a.daysUntil - b.daysUntil);
            overdueEvaluations.sort((a, b) => b.daysOverdue - a.daysOverdue);

            setStats({ totalEmployees, activeContracts, expiringContracts });
            setEvaluations({ upcoming: upcomingEvaluations, overdue: overdueEvaluations });
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

    if (authLoading || !user) {
        return (
            <div className={styles.loadingContainer}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div>
                            <h1 className="fade-in">Bienvenido{userName ? `, ${userName}` : ''}</h1>
                            <p className="slide-in">Panel de control del sistema</p>
                        </div>
                        <Link href="/employees" className="btn btn-primary">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Empleados
                        </Link>
                    </div>

                    {loading ? (
                        <div className={styles.statsGrid}>
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`${styles.statCard} ${styles.skeleton}`}>
                                    <div className={styles.skeletonIcon}></div>
                                    <div className={styles.skeletonText}></div>
                                    <div className={styles.skeletonTitle}></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.statsGrid}>
                            <div className={`${styles.statCard} ${styles.statCard1}`}>
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
                                    <div className={styles.statLabel}>Empleados</div>
                                </div>
                            </div>

                            <div className={`${styles.statCard} ${styles.statCard2}`}>
                                <div className={styles.statIcon}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <div className={styles.statContent}>
                                    <div className={styles.statNumber}>{stats.activeContracts}</div>
                                    <div className={styles.statLabel}>Contratos Activos</div>
                                </div>
                            </div>

                            <div className={`${styles.statCard} ${styles.statCard3}`}>
                                <div className={styles.statIcon}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                </div>
                                <div className={styles.statContent}>
                                    <div className={styles.statNumber}>{stats.expiringContracts}</div>
                                    <div className={styles.statLabel}>Próximos a Vencer</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Alertas de Evaluaciones */}
                    {(evaluations.upcoming.length > 0 || evaluations.overdue.length > 0) && (
                        <div className={styles.evaluationsSection}>
                            <h2>Alertas de Evaluaciones</h2>

                            <div className={styles.evaluationsGrid}>
                                {/* Evaluaciones Próximas */}
                                {evaluations.upcoming.length > 0 && (
                                    <div className={styles.evalAlertCard}>
                                        <div className={styles.evalAlertHeader}>
                                            <div className={styles.evalAlertIconUpcoming}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3>Próximas a Aplicar</h3>
                                                <span className={styles.evalAlertCount}>{evaluations.upcoming.length} evaluación(es)</span>
                                            </div>
                                        </div>
                                        <div className={styles.evalAlertList}>
                                            {evaluations.upcoming.slice(0, 5).map((evalItem, idx) => (
                                                <div key={idx} className={styles.evalAlertItem}>
                                                    <div className={styles.evalAlertInfo}>
                                                        <strong>{evalItem.employeeId} - {evalItem.employeeName}</strong>
                                                        <span>Evaluación {evalItem.evalNum}</span>
                                                    </div>
                                                    <div className={styles.evalAlertDate}>
                                                        <span className={styles.dateLabel}>{formatDate(evalItem.date)}</span>
                                                        <span className={styles.daysLabel}>
                                                            {evalItem.daysUntil === 0 ? '¡Hoy!' : `En ${evalItem.daysUntil} día(s)`}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Evaluaciones Vencidas */}
                                {evaluations.overdue.length > 0 && (
                                    <div className={`${styles.evalAlertCard} ${styles.evalAlertOverdue}`}>
                                        <div className={styles.evalAlertHeader}>
                                            <div className={styles.evalAlertIconOverdue}>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="8" x2="12" y2="12" />
                                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3>Vencidas</h3>
                                                <span className={styles.evalAlertCount}>{evaluations.overdue.length} evaluación(es)</span>
                                            </div>
                                        </div>
                                        <div className={styles.evalAlertList}>
                                            {evaluations.overdue.slice(0, 5).map((evalItem, idx) => (
                                                <div key={idx} className={styles.evalAlertItem}>
                                                    <div className={styles.evalAlertInfo}>
                                                        <strong>{evalItem.employeeId} - {evalItem.employeeName}</strong>
                                                        <span>Evaluación {evalItem.evalNum}</span>
                                                    </div>
                                                    <div className={styles.evalAlertDate}>
                                                        <span className={styles.dateLabel}>{formatDate(evalItem.date)}</span>
                                                        <span className={styles.daysOverdue}>
                                                            Hace {evalItem.daysOverdue} día(s)
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
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
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="8.5" cy="7" r="4" />
                                        <line x1="20" y1="8" x2="20" y2="14" />
                                        <line x1="23" y1="11" x2="17" y2="11" />
                                    </svg>
                                </div>
                                <div className={styles.actionContent}>
                                    <h3>Agregar Empleado</h3>
                                    <p>Registrar un nuevo empleado en el sistema</p>
                                </div>
                                <svg className={styles.actionArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </Link>

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
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
