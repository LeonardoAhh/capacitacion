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
                    {/* Module 1: Dashboard / Gestión de Talento - BLOQUEADO PARA DEMO */}
                    {!isDemo ? (
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
                        </Link>
                    ) : (
                        <div className={styles.moduleCard} style={{ opacity: 0.5, cursor: 'not-allowed', filter: 'grayscale(1)', borderColor: 'rgba(255,255,255,0.1)' }}>
                            <div className={styles.iconWrapper}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <h2 className={styles.cardTitle}>Gestión de Talento</h2>
                            <p className={styles.cardDescription} style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '10px' }}>
                                Acceso restringido en modo Demo. 🔒
                            </p>
                        </div>
                    )}

                    {/* Module 2: Inducción - SIEMPRE DISPONIBLE */}
                    <Link href="/induccion" className={styles.moduleCard} style={isDemo ? { boxShadow: '0 0 30px rgba(0, 122, 255, 0.3)', borderColor: '#007AFF' } : {}}>
                        <div className={styles.iconWrapper} style={isDemo ? { color: '#007AFF', background: 'rgba(0, 122, 255, 0.1)' } : {}}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <h2 className={styles.cardTitle}>Inducción</h2>
                        {isDemo && <p className={styles.cardDescription} style={{ color: '#007AFF', marginTop: '5px' }}>Módulo Habilitado ✨</p>}
                    </Link>

                    {/* Module 3: Configuración ILUO (Solo Admin) - BLOQUEADO PARA DEMO */}
                    {user?.rol === 'super_admin' ? (
                        <Link href="/iluo-manager" className={styles.moduleCard} style={{ borderColor: '#AF52DE' }}>
                            <div className={styles.iconWrapper} style={{ color: '#AF52DE', background: 'rgba(175, 82, 222, 0.1)' }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                </svg>
                            </div>
                            <h2 className={styles.cardTitle}>ILUO</h2>
                        </Link>
                    ) : (
                        <div className={styles.moduleCard} style={{ opacity: 0.5, cursor: 'not-allowed', filter: 'grayscale(1)', borderColor: 'rgba(255,255,255,0.1)' }}>
                            <div className={styles.iconWrapper}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <h2 className={styles.cardTitle}>Configuración ILUO</h2>
                            <p className={styles.cardDescription} style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '10px' }}>
                                Acceso restringido solo para administradores. 🔒
                            </p>
                        </div>
                    )}
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
