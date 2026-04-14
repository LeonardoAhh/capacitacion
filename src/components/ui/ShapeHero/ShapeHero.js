'use client';

import { useReducer, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { createSession } from '@/lib/sessionApi';
import { CARD_ENTER, FADE_UP_LOGIN, ERROR_VARIANTS, SUCCESS_ENTER } from '@/components/auth/LoginBase/loginAnimations';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import DynamicCredits from '@/components/features/DynamicCredits/DynamicCredits';
import styles from './ShapeHero.module.css';

/* ─── Rate limiting ──────────────────────────────────────── */

const RATE_LIMIT = {
    MAX_ATTEMPTS: 3,
    BLOCK_DURATION_S: 10,
    STORAGE_KEY: 'login_rate_limit',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Reducer ────────────────────────────────────────────── */

const initialState = {
    identifier: '',
    password: '',
    error: '',
    loading: false,
    isSuccess: false,
    failedAttempts: 0,
    blockedUntil: null,
    remainingSeconds: 0,
};

function loginReducer(state, action) {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value, error: '' };
        case 'LOGIN_START':
            return { ...state, error: '', loading: true };
        case 'LOGIN_SUCCESS':
            return { ...state, loading: false, isSuccess: true, failedAttempts: 0, blockedUntil: null };
        case 'LOGIN_ERROR':
            return { ...state, loading: false, error: action.error, failedAttempts: state.failedAttempts + 1 };
        case 'RATE_LIMIT_HIT': {
            const blockedUntil = Date.now() + RATE_LIMIT.BLOCK_DURATION_S * 1000;
            return {
                ...state,
                loading: false,
                blockedUntil,
                remainingSeconds: RATE_LIMIT.BLOCK_DURATION_S,
                error: `Demasiados intentos fallidos. Espera ${RATE_LIMIT.BLOCK_DURATION_S} segundos.`,
            };
        }
        case 'RATE_LIMIT_TICK':
            return { ...state, remainingSeconds: action.seconds };
        case 'RATE_LIMIT_CLEAR':
            return { ...state, failedAttempts: 0, blockedUntil: null, remainingSeconds: 0, error: '' };
        default:
            return state;
    }
}

/* ─── Rate limit helpers ─────────────────────────────────── */

function loadRateLimitState() {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(RATE_LIMIT.STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

function saveRateLimitState(failedAttempts, blockedUntil) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(RATE_LIMIT.STORAGE_KEY, JSON.stringify({ failedAttempts, blockedUntil }));
    } catch { }
}

function clearRateLimitStorage() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(RATE_LIMIT.STORAGE_KEY);
    } catch { }
}

function validateLoginFields(identifier, password) {
    if (!identifier.trim()) return 'El correo o nombre de usuario es requerido.';
    if (!password) return 'La contraseña es requerida.';
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    return null;
}

/* ─── Component ──────────────────────────────────────────── */

export default function ShapeHero() {
    const [state, dispatch] = useReducer(loginReducer, initialState);
    const { user, signIn, signInWithUsername } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const timerRef = useRef(null);

    const { identifier, password, error, loading, isSuccess, failedAttempts, blockedUntil, remainingSeconds } = state;
    const isBlocked = blockedUntil !== null && Date.now() < blockedUntil;

    /* Redirige si ya está autenticado */
    useEffect(() => {
        // Solo redirige automáticamente si el usuario está autenticado y NO está en estado de éxito
        if (!user || isSuccess) return;
        router.replace('/induccion');
    }, [user, router, isSuccess]);

    /* Restaura rate limit del localStorage al montar */
    useEffect(() => {
        const stored = loadRateLimitState();
        if (!stored) return;
        const { failedAttempts: storedAttempts, blockedUntil: storedBlockedUntil } = stored;

        if (storedBlockedUntil && Date.now() < storedBlockedUntil) {
            const remaining = Math.ceil((storedBlockedUntil - Date.now()) / 1000);
            dispatch({ type: 'RATE_LIMIT_HIT' });
            dispatch({ type: 'RATE_LIMIT_TICK', seconds: remaining });
        } else if (storedAttempts >= RATE_LIMIT.MAX_ATTEMPTS) {
            clearRateLimitStorage();
        } else if (storedAttempts > 0) {
            for (let i = 0; i < storedAttempts; i++) {
                dispatch({ type: 'LOGIN_ERROR', error: '' });
            }
            dispatch({ type: 'SET_FIELD', field: 'error', value: '' });
        }
    }, []);

    /* Countdown del bloqueo */
    useEffect(() => {
        if (!blockedUntil) return;

        const tick = () => {
            const remaining = Math.ceil((blockedUntil - Date.now()) / 1000);
            if (remaining <= 0) {
                dispatch({ type: 'RATE_LIMIT_CLEAR' });
                clearRateLimitStorage();
                clearInterval(timerRef.current);
            } else {
                dispatch({ type: 'RATE_LIMIT_TICK', seconds: remaining });
            }
        };

        tick();
        timerRef.current = setInterval(tick, 1000);
        return () => clearInterval(timerRef.current);
    }, [blockedUntil]);

    /* Persiste rate limit en localStorage */
    useEffect(() => {
        if (failedAttempts > 0 || blockedUntil) {
            saveRateLimitState(failedAttempts, blockedUntil);
        }
    }, [failedAttempts, blockedUntil]);

    /* Redirige tras login exitoso */
    useEffect(() => {
        if (!isSuccess) return;
        const timer = setTimeout(() => router.push('/induccion'), 5000);
        return () => clearTimeout(timer);
    }, [isSuccess, router]);

    const checkRateLimit = useCallback(() => {
        if (isBlocked) return false;
        if (failedAttempts >= RATE_LIMIT.MAX_ATTEMPTS) {
            dispatch({ type: 'RATE_LIMIT_HIT' });
            return false;
        }
        return true;
    }, [isBlocked, failedAttempts]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!checkRateLimit()) return;

        const validationError = validateLoginFields(identifier, password);
        if (validationError) {
            dispatch({ type: 'LOGIN_ERROR', error: validationError });
            return;
        }

        dispatch({ type: 'LOGIN_START' });

        const isEmail = EMAIL_REGEX.test(identifier.trim());
        const result = isEmail
            ? await signIn(identifier.trim(), password)
            : await signInWithUsername(identifier.trim(), password);

        if (result.success) {
            const sessionOk = await createSession('admin');
            if (!sessionOk) {
                dispatch({ type: 'LOGIN_ERROR', error: 'Error al crear sesión. Intenta de nuevo.' });
                return;
            }
            sessionStorage.setItem('showWelcome', 'true');
            dispatch({ type: 'LOGIN_SUCCESS' });
            clearRateLimitStorage();
        } else {
            dispatch({ type: 'LOGIN_ERROR', error: result.error });
            if (failedAttempts + 1 >= RATE_LIMIT.MAX_ATTEMPTS) {
                dispatch({ type: 'RATE_LIMIT_HIT' });
            }
        }
    }, [identifier, password, signIn, signInWithUsername, checkRateLimit, failedAttempts]);

    const errorMessage = isBlocked
        ? `Demasiados intentos. Espera ${remainingSeconds}s para continuar.`
        : error;

    return (
        <section
            className={styles.hero}
            aria-label="Portal corporativo ViñoPlastic"
        >
            <div className={styles.grid} aria-hidden="true" />
            <div className={styles.glowOrb} aria-hidden="true" />

            <div className={styles.content} id="main-content">

                {/* ── Columna izquierda — Marca ── */}
                <div className={styles.left}>

                    <div className={styles.brand}>
                        <span className={styles.portal}>Vertx System v1.0</span>
                        <h1 className={styles.title}>
                            VIÑO<span className={styles.titleAccent}>PLASTIC</span>
                        </h1>
                        <p><span className={styles.location}>Planta Querétaro</span></p>
                    </div>


                    <div className={styles.divider} aria-hidden="true" />
                </div>

                {/* ── Columna derecha — Login card ── */}
                <motion.div
                    className={styles.right}
                    initial="hidden"
                    animate="visible"
                    variants={CARD_ENTER}
                >
                    <div className={styles.card}>
                        <AnimatePresence mode="wait">
                            {isSuccess ? (
                                <motion.div
                                    key="success"
                                    className={styles.successState}
                                    initial={{ opacity: 0, scale: 0.85, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.85, y: -30 }}
                                    transition={{ type: 'spring', stiffness: 340, damping: 22, duration: 0.7 }}
                                >
                                    <CheckCircle2 />
                                    <p>Acceso concedido</p>
                                </motion.div>
                            ) : (
                                <motion.div key="form">
                                    <header className={styles.cardHeader}>
                                        <div className={styles.iconBadge} aria-hidden="true">
                                            <Lock size={20} strokeWidth={2} />
                                        </div>
                                        <h2 className={styles.cardTitle}>Bienvenido</h2>
                                        <p className={styles.cardSubtitle}>
                                            Ingresa tus datos para continuar
                                        </p>
                                    </header>

                                    <form
                                        className={styles.form}
                                        onSubmit={handleSubmit}
                                        noValidate
                                    >
                                        <motion.div variants={FADE_UP_LOGIN} custom={0}>
                                            <Input
                                                id="identifier"
                                                label="Correo"
                                                type="text"
                                                autoComplete="username"
                                                value={identifier}
                                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'identifier', value: e.target.value })}
                                                disabled={isBlocked || loading}
                                                placeholder="usuario@empresa.com"
                                            />
                                        </motion.div>

                                        <motion.div variants={FADE_UP_LOGIN} custom={1}>
                                            <Input
                                                id="password"
                                                label="Contraseña"
                                                type="password"
                                                autoComplete="current-password"
                                                value={password}
                                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value })}
                                                disabled={isBlocked || loading}
                                                placeholder="••••••••"
                                            />
                                        </motion.div>

                                        <AnimatePresence mode="wait">
                                            {errorMessage && (
                                                <motion.div
                                                    key={errorMessage}
                                                    className={styles.errorBox}
                                                    role="alert"
                                                    aria-live="polite"
                                                    variants={ERROR_VARIANTS}
                                                    initial="initial"
                                                    animate="animate"
                                                    exit="exit"
                                                >
                                                    <AlertCircle size={15} aria-hidden="true" />
                                                    {errorMessage}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <motion.div variants={FADE_UP_LOGIN} custom={2}>
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                fullWidth
                                                loading={loading}
                                                disabled={isBlocked}
                                            >
                                                Iniciar Sesión
                                            </Button>
                                        </motion.div>
                                    </form>
                                    <DynamicCredits />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

            </div>

        </section>
    );
}
