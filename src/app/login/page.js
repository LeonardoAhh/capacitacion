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
            router.push('/dashboard');
        }
    }, [user, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await signIn(email, password);

        if (result.success) {
            sessionStorage.setItem('showWelcome', 'true');
            router.push('/dashboard');
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
            router.push('/dashboard');
        } else {
            setError('Error al iniciar demo: ' + result.error);
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* Theme Toggle */}
            <div className={styles.themeToggle}>
                <ThemeToggle />
            </div>

            {/* Main Card */}
            <div className={styles.card}>
                {/* Left Side - Brand */}
                <div className={styles.brandSide}>
                    {/* Pattern Overlay */}
                    <div className={styles.patternOverlay}>
                        <svg width="100%" height="100%">
                            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="1" fill="currentColor" />
                            </pattern>
                            <rect width="100%" height="100%" fill="url(#dots)" />
                        </svg>
                    </div>

                    {/* Gradient Blob */}
                    <div className={styles.gradientBlob}></div>

                    {/* Content */}
                    <div className={styles.brandContent}>
                        <div className={styles.logoSection}>
                            <div className={styles.logoIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <span className={styles.logoText}>Vertx</span>
                        </div>

                        <h2 className={styles.brandTitle}>
                            Gestión de Talento Simplificada.
                        </h2>
                        <p className={styles.brandDescription}>
                            Centraliza competencias, cumplimiento normativo y desarrollo en una sola plataforma segura.
                        </p>
                    </div>

                    {/* Features */}
                    <div className={styles.featuresList}>
                        <div className={styles.featureItem}>
                            <span className={styles.featureCheck}>✓</span>
                            <span>Matriz de Habilidades</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureCheck}>✓</span>
                            <span>Auditorías ISO/IATF</span>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureCheck}>✓</span>
                            <span>Reportes en Tiempo Real</span>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className={styles.formSide}>
                    <div className={styles.formContainer}>
                        <div className={styles.formHeader}>
                            <h3>Bienvenido de vuelta</h3>
                            <p>Ingresa tus credenciales para acceder al sistema.</p>
                        </div>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            {error && (
                                <div className={styles.errorBox}>
                                    {error}
                                </div>
                            )}

                            <div className={styles.inputGroup}>
                                <label htmlFor="email">Correo Corporativo</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="••••••••••••"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label htmlFor="password">Contraseña</label>
                                <input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />

                            </div>

                            <div className={styles.buttonGroup}>
                                <button
                                    type="submit"
                                    className={styles.primaryBtn}
                                    disabled={loading}
                                >
                                    {loading ? 'Procesando...' : 'Ingresar al Dashboard'}
                                </button>

                                <div className={styles.divider}>
                                    <span>O</span>
                                </div>

                                <button
                                    type="button"
                                    className={styles.ghostBtn}
                                    onClick={handleDemo}
                                    disabled={loading}
                                >
                                    Modo Invitado
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className={styles.footer}>
                <p>Sistema Vertx v2.0</p>
            </div>
        </div>
    );
}
