'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LogoVinoPlastic from '@/components/Logo/LogoVinoPlastic';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { HyperText } from '@/components/ui/HyperText';
import styles from './page.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // MFA States
    const [mfaRequired, setMfaRequired] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [mfaSecret, setMfaSecret] = useState(null);

    const { signIn, signInAnon, verifyOtp, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only auto-redirect if user exists AND we are not currently asking for MFA
        if (user && !mfaRequired) {
            router.push('/modulos');
        }
    }, [user, router, mfaRequired]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await signIn(email, password);

        if (result.success) {
            sessionStorage.setItem('showWelcome', 'true');
            router.push('/modulos');
        } else if (result.mfaRequired) {
            setMfaRequired(true);
            setMfaSecret(result.secret);
            setLoading(false);
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    const handleMfaSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await verifyOtp(verificationCode, mfaSecret);
        if (result.success) {
            sessionStorage.setItem('showWelcome', 'true');
            router.push('/modulos');
        } else {
            setError(result.error || 'Código incorrecto. Intenta de nuevo.');
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
                    <div className={styles.logoContainer}>
                        <LogoVinoPlastic
                            style={{
                                width: '100%',
                                maxWidth: '80px',
                                height: 'auto',
                                color: 'var(--text-primary)' // Adapts to light/dark mode
                            }}
                        />
                    </div>
                    {/* Hyper Text Animation */}
                    <HyperText
                        className={styles.appSubtitle}
                        startOnView={true}
                        duration={4500}
                    >
                        ViñoPlastic Inyección S.A. de C.V.
                    </HyperText>
                </div>

                {/* Login Card */}
                <div className={styles.card} id="main-content">
                    <form onSubmit={mfaRequired ? handleMfaSubmit : handleSubmit} className={styles.form}>
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

                        {!mfaRequired ? (
                            <>
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
                            </>
                        ) : (
                            <div className={styles.inputGroup}>
                                <input
                                    id="mfaCode"
                                    type="text"
                                    placeholder=" "
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    required
                                    className={`${styles.input} text-center tracking-widest text-lg`}
                                    maxLength={6}
                                />
                                <label htmlFor="mfaCode" className={styles.label}>Código de Google Authenticator</label>
                            </div>
                        )}

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
                                        {mfaRequired ? 'Verificar Código' : 'Iniciar Sesión'}
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
