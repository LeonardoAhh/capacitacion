'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import styles from './page.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn, signInAnon, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.push('/modulos');
        }
    }, [user, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await signIn(email, password);

        if (result.success) {
            sessionStorage.setItem('showWelcome', 'true');
            router.push('/modulos');
        } else {
            setError('Acceso denegado. Verifica tus datos.');
            setLoading(false);
        }
    };

    const handleDemo = async () => {
        setError('');
        setLoading(true);
        const result = await signInAnon();
        if (result.success) {
            router.push('/modulos');
        } else {
            setError('Error al iniciar demo: ' + result.error);
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Background Effects */}
            <div className={styles.bgDecoration}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
            </div>

            {/* Theme Toggle */}
            <div className={styles.themeToggleWrapper}>
                <ThemeToggle />
            </div>

            <div className={styles.loginWrapper}>
                {/* Logo Section */}
                <div className={styles.headerSection}>
                    <div className={styles.logoIcon}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <h1 className={styles.appTitle}>Vertx</h1>
                    <p className={styles.appSubtitle}>Gestión de Talento</p>
                </div>

                {/* Login Card */}
                <div className={styles.card} id="main-content">
                    <form onSubmit={handleSubmit} className={styles.form}>
                        {error && (
                            <div className={styles.errorBox} role="alert" aria-live="polite">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className={styles.inputGroup}>
                            <input
                                id="email"
                                type="email"
                                placeholder=" "
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className={styles.input}
                            />
                            <label htmlFor="email" className={styles.label}>Correo Electrónico</label>
                        </div>

                        <div className={styles.inputGroup}>
                            <input
                                id="password"
                                type="password"
                                placeholder=" "
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className={styles.input}
                            />
                            <label htmlFor="password" className={styles.label}>Contraseña</label>
                        </div>

                        <div className={styles.actions}>
                            <button
                                type="submit"
                                className={styles.primaryBtn}
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="spinner-sm"></div>
                                ) : (
                                    <>
                                        Iniciar Sesión
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className={styles.divider}>
                            <span>o</span>
                        </div>

                        <button
                            type="button"
                            className={styles.secondaryBtn}
                            onClick={handleDemo}
                            disabled={loading}
                        >
                            Acceder como Instructor
                        </button>
                    </form>
                </div>

                <div className={styles.footer}>
                    <p>&copy; 2024 Vertx System v2.0</p>
                </div>
            </div>
        </div>
    );
}
