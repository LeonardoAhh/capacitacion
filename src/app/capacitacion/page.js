'use client';

import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card/Card';
import styles from './page.module.css';

export default function CapacitacionPage() {
    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <Link href="/dashboard" className={styles.backBtn}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                Volver al Dashboard
                            </Link>
                            <h1>Módulo de Capacitación</h1>
                        </div>
                    </div>

                    <div className={styles.modulesGrid}>
                        {/* Puestos */}
                        <Link href="/capacitacion/puestos" className={styles.moduleCard}>
                            <Card hover={false} className={styles.cardInner}>
                                <CardContent>
                                    <div className={`${styles.iconWrapper} ${styles.iconPurple}`}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 7h-9" />
                                            <path d="M14 17H5" />
                                            <circle cx="17" cy="17" r="3" />
                                            <circle cx="7" cy="7" r="3" />
                                        </svg>
                                    </div>
                                    <div className={styles.content}>
                                        <h2>Gestión de Puestos</h2>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Registro (New) */}
                        <Link href="/capacitacion/registro" className={styles.moduleCard}>
                            <Card hover={false} className={styles.cardInner}>
                                <CardContent>
                                    <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </div>
                                    <div className={styles.content}>
                                        <h2>Registro de Capacitación</h2>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Empleados (New) */}
                        <Link href="/capacitacion/empleados" className={styles.moduleCard}>
                            <Card hover={false} className={styles.cardInner}>
                                <CardContent>
                                    <div className={`${styles.iconWrapper} ${styles.iconPurple}`}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                    </div>
                                    <div className={styles.content}>
                                        <h2>Gestión de Empleados</h2>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Análisis */}
                        <Link href="/capacitacion/analisis" className={styles.moduleCard}>
                            <Card hover={false} className={styles.cardInner}>
                                <CardContent>
                                    <div className={`${styles.iconWrapper} ${styles.iconGreen}`}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                                            <path d="M22 12A10 10 0 0 0 12 2v10z" />
                                        </svg>
                                    </div>
                                    <div className={styles.content}>
                                        <h2>Análisis y Reportes</h2>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Matriz */}
                        <Link href="/capacitacion/matriz" className={styles.moduleCard}>
                            <Card hover={false} className={styles.cardInner}>
                                <CardContent>
                                    <div className={`${styles.iconWrapper} ${styles.iconPurple}`}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                            <line x1="3" y1="9" x2="21" y2="9" />
                                            <line x1="9" y1="21" x2="9" y2="9" />
                                        </svg>
                                    </div>
                                    <div className={styles.content}>
                                        <h2>Matriz de Capacitación</h2>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Catálogo (New) */}
                        <Link href="/capacitacion/cursos" className={styles.moduleCard}>
                            <Card hover={false} className={styles.cardInner}>
                                <CardContent>
                                    <div className={`${styles.iconWrapper} ${styles.iconOrange}`}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                    </div>
                                    <div className={styles.content}>
                                        <h2>Vigencia de Cursos</h2>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Alertas (New) */}
                        <Link href="/capacitacion/alertas" className={styles.moduleCard}>
                            <Card hover={false} className={styles.cardInner}>
                                <CardContent>
                                    <div className={`${styles.iconWrapper} ${styles.iconRed}`}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                            <line x1="12" y1="9" x2="12" y2="13" />
                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                        </svg>
                                    </div>
                                    <div className={styles.content}>
                                        <h2>Alertas Inteligentes</h2>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Calendario (New) */}
                        <Link href="/capacitacion/calendario" className={styles.moduleCard}>
                            <Card hover={false} className={styles.cardInner}>
                                <CardContent>
                                    <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    </div>
                                    <div className={styles.content}>
                                        <h2>Calendario de Capacitación</h2>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Promociones (New) */}
                        <Link href="/capacitacion/promociones" className={styles.moduleCard}>
                            <Card hover={false} className={styles.cardInner}>
                                <CardContent>
                                    <div className={`${styles.iconWrapper} ${styles.iconGreen}`}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
                                        </svg>
                                    </div>
                                    <div className={styles.content}>
                                        <h2>Cambios de categorías</h2>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        {/* Cumplimiento por Curso */}
                        <Link href="/capacitacion/cumplimiento" className={styles.moduleCard}>
                            <Card hover={false} className={styles.cardInner}>
                                <CardContent>
                                    <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    </div>
                                    <div className={styles.content}>
                                        <h2>Cumplimiento por Curso</h2>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>
            </main>
        </>
    );
}
