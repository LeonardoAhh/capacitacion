'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

export default function ModulesPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const isDemo = user?.rol === 'demo' || user?.email?.includes('demo');

    return (
        <div className={styles.container}>
            {/* Background Effects */}
            <div className={styles.bgDecoration}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
            </div>

            <div className={styles.content}>
                <header className={styles.header}>
                    <h1 className={styles.title}>
                        Hola, <span className={styles.userName}>{user?.displayName?.split(' ')[0] || 'Usuario'}</span>
                    </h1>
                    <p className={styles.subtitle}>Selecciona un módulo</p>
                </header>

                <div className={styles.grid} id="main-content" role="navigation" aria-label="Módulos disponibles">
                    {/* Module: Dashboard */}
                    {!isDemo ? (
                        <Link href="/dashboard" className={styles.moduleCard} aria-label="Ir a Gestión de Talento">
                            <div className={styles.iconWrapper}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="14" width="7" height="7" rx="1" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                </svg>
                            </div>
                            <div className={styles.cardContent}>
                                <h2 className={styles.cardTitle}>Gestión de Talento</h2>
                                <p className={styles.cardDescription}>Administra empleados y desarrollo.</p>
                            </div>
                            <div className={styles.cardArrow}>→</div>
                        </Link>
                    ) : (
                        <div className={`${styles.moduleCard} ${styles.disabled}`} aria-disabled="true">
                            <div className={styles.iconWrapper}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                    <path d="M17 21v-8H7v8" />
                                    <path d="M7 3v5h8" />
                                </svg>
                            </div>
                            <div className={styles.cardContent}>
                                <h2 className={styles.cardTitle}>Gestión de Talento</h2>
                                <p className={styles.cardDescription}>Bloqueado en modo Demo</p>
                            </div>
                            <div className={styles.lockIcon}>🔒</div>
                        </div>
                    )}

                    {/* Module: Inducción */}
                    <Link href="/induccion" className={`${styles.moduleCard} ${styles.highlight}`} aria-label="Ir a Inducción">
                        <div className={styles.iconWrapper}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c3 3 9 3 12 0v-5" />
                            </svg>
                        </div>
                        <div className={styles.cardContent}>
                            <h2 className={styles.cardTitle}>Inducción</h2>
                            <p className={styles.cardDescription}>Cursos y onboarding.</p>
                        </div>
                        <div className={styles.cardArrow}>→</div>
                    </Link>

                    {/* Module: ILUO Manager */}
                    {user?.rol === 'super_admin' ? (
                        <Link href="/iluo-manager" className={styles.moduleCard} aria-label="Ir a Configuración ILUO">
                            <div className={styles.iconWrapper}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                            </div>
                            <div className={styles.cardContent}>
                                <h2 className={styles.cardTitle}>Configuración</h2>
                                <p className={styles.cardDescription}>Ajustes del sistema ILUO.</p>
                            </div>
                            <div className={styles.cardArrow}>→</div>
                        </Link>
                    ) : (
                        <div className={`${styles.moduleCard} ${styles.disabled}`} aria-disabled="true">
                            <div className={styles.iconWrapper}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                            </div>
                            <div className={styles.cardContent}>
                                <h2 className={styles.cardTitle}>Configuración</h2>
                                <p className={styles.cardDescription}>Solo Administradores</p>
                            </div>
                            <div className={styles.lockIcon}>🔒</div>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Cerrar Sesión
                    </button>
                    <p className={styles.copyright}>© 2024 Vertx System</p>
                </div>
            </div>
        </div>
    );
}

