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
                        <p className={styles.subtitle}>Gestión integral de formación, puestos y análisis de competencias.</p>
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
                                        <p>Definir perfiles, descripciones y requisitos por puesto.</p>
                                    </div>
                                    <div className={styles.arrow}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
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
                                        <p>Capturar nuevos cursos aprobados o calificaciones.</p>
                                    </div>
                                    <div className={styles.arrow}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
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
                                        <p>Directorio de personal y edición de datos.</p>
                                    </div>
                                    <div className={styles.arrow}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
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
                                        <p>Ver matrices de habilidades, cumplimiento y brechas.</p>
                                    </div>
                                    <div className={styles.arrow}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
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
                                        <p>Visualizar cumplimiento y programación anual.</p>
                                    </div>
                                    <div className={styles.arrow}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
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
