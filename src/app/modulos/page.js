'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

export default function ModulesPage() {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <div className={styles.container}>
            {/* Background */}
            <div className={styles.bgDecoration}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
            </div>

            <div className={styles.content}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Bienvenido, {user?.displayName?.split(' ')[0] || 'Usuario'}</h1>
                    <p className={styles.subtitle}>Selecciona el módulo al que deseas acceder</p>
                </header>

                <div className={styles.grid}>
                    {/* Module 1: Dashboard / Capacitación */}
                    <Link href="/dashboard" className={styles.moduleCard}>
                        <div className={styles.iconWrapper}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                        </div>
                        <h2 className={styles.cardTitle}>Gestión de Talento</h2>
                        <p className={styles.cardDescription}>
                            Administración de empleados, matriz de habilidades, reportes y cumplimiento normativo.
                        </p>
                    </Link>

                    {/* Module 2: Inducción */}
                    <Link href="/induccion" className={styles.moduleCard}>
                        <div className={styles.iconWrapper}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h2 className={styles.cardTitle}>Inducción</h2>
                        <p className={styles.cardDescription}>
                            Plataforma interactiva para la bienvenida y capacitación inicial de nuevos ingresos.
                        </p>
                    </Link>
                </div>

                <div style={{ marginTop: '3rem' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            margin: '0 auto',
                            padding: '10px 20px',
                            borderRadius: '50px',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(255,0,0,0.1)';
                            e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
