'use client';

import { useReducer, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { createSession } from '@/lib/sessionApi';
import {
    CARD_ENTER,
    FADE_UP_LOGIN,
    ERROR_VARIANTS,
    EASE_OUT,
    SUCCESS_REDIRECT_DELAY_MS,
} from '@/components/auth/LoginBase/loginAnimations';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import DynamicCredits from '@/components/features/DynamicCredits/DynamicCredits';
import styles from './ShapeHero.module.css';

/* ─── Redirect safelist ──────────────────────────────────── */

const DEFAULT_REDIRECT = '/induccion';

/**
 * Sanitiza el `?redirect=` para evitar open-redirect attacks.
 * Sólo aceptamos paths internos (empiezan con "/" pero no con "//" o "/\").
 */
function sanitizeRedirect(rawRedirect) {
    if (!rawRedirect || typeof rawRedirect !== 'string') return DEFAULT_REDIRECT;
    if (!rawRedirect.startsWith('/')) return DEFAULT_REDIRECT;
    if (rawRedirect.startsWith('//') || rawRedirect.startsWith('/\\')) return DEFAULT_REDIRECT;
    if (rawRedirect === '/login') return DEFAULT_REDIRECT;
    return rawRedirect;
}

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
        case 'RESTORE_ATTEMPTS':
            return { ...state, failedAttempts: action.attempts };
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
    const prefersReducedMotion = useReducedMotion();

    const { identifier, password, error, loading, isSuccess, failedAttempts, blockedUntil, remainingSeconds } = state;
    const isBlocked = blockedUntil !== null && Date.now() < blockedUntil;

    /* Destino real del redirect — respeta `?redirect=` con safelist para
       evitar open-redirect attacks. */
    const redirectTarget = useMemo(
        () => sanitizeRedirect(searchParams.get('redirect')),
        [searchParams]
    );

    /* Redirige si ya está autenticado */
    useEffect(() => {
        // loading = true significa que hay un submit en curso (esperando createSession).
        // No redirigir hasta que el flujo termine para evitar race con createSession.
        if (!user || isSuccess || loading) return;
        router.replace(redirectTarget);
    }, [user, router, isSuccess, loading, redirectTarget]);

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
            dispatch({ type: 'RESTORE_ATTEMPTS', attempts: storedAttempts });
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
        const timer = setTimeout(() => router.push(redirectTarget), SUCCESS_REDIRECT_DELAY_MS);
        return () => clearTimeout(timer);
    }, [isSuccess, router, redirectTarget]);

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
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {/* Rings + Animated checkmark.
                                        Pulse rings se desactivan con prefers-reduced-motion para no
                                        consumir batería en mobile/PWA. */}
                                    <div className={styles.ringWrap}>
                                        {!prefersReducedMotion && (
                                            <>
                                                <motion.div
                                                    className={styles.pulse1}
                                                    initial={{ scale: 1, opacity: 0.45 }}
                                                    animate={{ scale: 2.2, opacity: 0 }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                                                />
                                                <motion.div
                                                    className={styles.pulse2}
                                                    initial={{ scale: 1, opacity: 0.3 }}
                                                    animate={{ scale: 2.8, opacity: 0 }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.7 }}
                                                />
                                            </>
                                        )}
                                        <motion.svg
                                            className={styles.svgCheck}
                                            viewBox="0 0 52 52"
                                            aria-hidden="true"
                                            initial={prefersReducedMotion ? false : { rotate: -90, scale: 0.6 }}
                                            animate={{ rotate: 0, scale: 1 }}
                                            transition={{ duration: prefersReducedMotion ? 0 : 0.7, ease: EASE_OUT }}
                                        >
                                            <motion.circle
                                                cx="26" cy="26" r="23"
                                                fill="rgba(var(--accent-teal-rgb), 0.12)"
                                                stroke="var(--accent-teal)"
                                                strokeWidth="2"
                                                initial={prefersReducedMotion ? false : { pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: prefersReducedMotion ? 0 : 0.8, ease: 'easeOut' }}
                                            />
                                            <motion.path
                                                fill="none"
                                                stroke="var(--accent-teal)"
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M13 26 L21 34 L39 16"
                                                initial={prefersReducedMotion ? false : { pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: prefersReducedMotion ? 0 : 0.75, ease: EASE_OUT }}
                                            />
                                        </motion.svg>
                                    </div>

                                    <motion.p
                                        className={styles.successText}
                                        role="status"
                                        aria-live="polite"
                                        initial={{ opacity: 0, y: 14 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: prefersReducedMotion ? 0 : 0.9, duration: 0.5, ease: EASE_OUT }}
                                    >
                                        Acceso concedido
                                    </motion.p>

                                    <motion.div
                                        className={styles.countdownBar}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: prefersReducedMotion ? 0 : 1.1 }}
                                    >
                                        <motion.div
                                            className={styles.countdownFill}
                                            initial={{ scaleX: 1 }}
                                            animate={{ scaleX: 0 }}
                                            transition={{
                                                duration: prefersReducedMotion ? 0 : (SUCCESS_REDIRECT_DELAY_MS - 1100) / 1000,
                                                ease: 'linear',
                                                delay: prefersReducedMotion ? 0 : 1.1,
                                            }}
                                            style={{ transformOrigin: 'left' }}
                                        />
                                    </motion.div>

                                    <motion.span
                                        className={styles.redirectMsg}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: prefersReducedMotion ? 0 : 1.3 }}
                                    >
                                        Redirigiendo...
                                    </motion.span>
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
