'use client';

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createSession } from '@/lib/sessionApi';
import UnifiedLogin from '@/components/auth/UnifiedLogin';

const RATE_LIMIT = {
    MAX_ATTEMPTS: 5,
    BLOCK_DURATION_S: 30,
    STORAGE_KEY: 'login_rate_limit',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialLoginState = {
    identifier: '', // acepta email o username
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
            return {
                ...state,
                loading: false,
                error: action.error,
                failedAttempts: state.failedAttempts + 1,
            };
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

function loadRateLimitState() {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem(RATE_LIMIT.STORAGE_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
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

export default function LoginPage() {
    const [state, dispatch] = useReducer(loginReducer, initialLoginState);
    const { signIn, signInWithUsername, signInWithGoogle } = useAuth();
    const router = useRouter();
    const timerRef = useRef(null);

    const { identifier, password, error, loading, isSuccess, failedAttempts, blockedUntil, remainingSeconds } = state;
    const isBlocked = blockedUntil !== null && Date.now() < blockedUntil;

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

    useEffect(() => {
        if (!blockedUntil) return;

        const tick = () => {
            const remaining = Math.ceil((blockedUntil - Date.now()) / 1000);
            if (remaining <= 0) {
                dispatch({ type: 'RATE_LIMIT_CLEAR' });
                clearRateLimitStorage();
                if (timerRef.current) clearInterval(timerRef.current);
            } else {
                dispatch({ type: 'RATE_LIMIT_TICK', seconds: remaining });
            }
        };

        tick();
        timerRef.current = setInterval(tick, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [blockedUntil]);

    useEffect(() => {
        if (failedAttempts > 0 || blockedUntil) {
            saveRateLimitState(failedAttempts, blockedUntil);
        }
    }, [failedAttempts, blockedUntil]);

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

        // Detectar automáticamente si es email o username
        const isEmail = EMAIL_REGEX.test(identifier.trim());
        const result = isEmail
            ? await signIn(identifier.trim(), password)
            : await signInWithUsername(identifier.trim(), password);

        if (result.success) {
            await createSession('admin');
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

    const handleGoogleSignIn = useCallback(async () => {
        if (!checkRateLimit()) return;

        dispatch({ type: 'LOGIN_START' });

        const result = await signInWithGoogle();

        if (result.success) {
            await createSession('admin');
            sessionStorage.setItem('showWelcome', 'true');
            dispatch({ type: 'LOGIN_SUCCESS' });
            clearRateLimitStorage();
        } else {
            dispatch({ type: 'LOGIN_ERROR', error: result.error || 'Error al iniciar sesión con Google' });
            if (failedAttempts + 1 >= RATE_LIMIT.MAX_ATTEMPTS) {
                dispatch({ type: 'RATE_LIMIT_HIT' });
            }
        }
    }, [signInWithGoogle, checkRateLimit, failedAttempts]);

    const handleSuccessComplete = useCallback(() => {
        router.push('/dashboard');
    }, [router]);

    useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(handleSuccessComplete, 1500);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, handleSuccessComplete]);

    const fields = [
        {
            id: 'identifier',
            label: 'Correo o Usuario',
            type: 'text',
            value: identifier,
            onChange: (e) => dispatch({ type: 'SET_FIELD', field: 'identifier', value: e.target.value }),
            placeholder: '••••••••',
            autoComplete: 'username',
        },
        {
            id: 'password',
            label: 'Contraseña',
            type: 'password',
            value: password,
            onChange: (e) => dispatch({ type: 'SET_FIELD', field: 'password', value: e.target.value }),
            placeholder: '••••••••',
            autoComplete: 'current-password',
        },
    ];

    return (
        <UnifiedLogin
            portal="Portal RRHH"
            title="Bienvenido"
            subtitle="Acceso al sistema de RRHH"
            fields={fields}
            error={error}
            loading={loading}
            blocked={isBlocked}
            blockedMessage={isBlocked ? `Espera ${remainingSeconds}s para intentar de nuevo` : null}
            onSubmit={handleSubmit}
            submitText="Iniciar Sesión"
            isSuccess={isSuccess}
            showGoogle
            onGoogleSignIn={handleGoogleSignIn}
            googleLoading={loading}
            backHref="/"
            backLabel="Inicio"
        />
    );
}
