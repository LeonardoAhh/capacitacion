'use client';

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createSession } from '@/lib/sessionApi';
import ModernLogin from '@/components/ModernLogin/ModernLogin';
import BackButton from '@/components/ui/BackButton/BackButton';

// ==================== CONSTANTES ====================
const RATE_LIMIT = {
    MAX_ATTEMPTS: 5,
    BLOCK_DURATION_S: 30,
    STORAGE_KEY: 'login_rate_limit',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ==================== REDUCER ====================
const initialLoginState = {
    email: '',
    password: '',
    error: '',
    loading: false,
    isSuccess: false,
    // Rate limiting
    failedAttempts: 0,
    blockedUntil: null, // timestamp en ms
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

// ==================== HELPERS ====================

/** Lee el estado de rate limit de localStorage */
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

/** Persiste estado de rate limit en localStorage */
function saveRateLimitState(failedAttempts, blockedUntil) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(
            RATE_LIMIT.STORAGE_KEY,
            JSON.stringify({ failedAttempts, blockedUntil })
        );
    } catch {
        // Silenciar errores de storage
    }
}

/** Limpia el rate limit de localStorage */
function clearRateLimitStorage() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem(RATE_LIMIT.STORAGE_KEY);
    } catch {
        // Silenciar errores de storage
    }
}

/** Valida email y password antes de enviar a Firebase */
function validateLoginFields(email, password) {
    if (!email.trim()) {
        return 'El correo electrónico es requerido.';
    }
    if (!EMAIL_REGEX.test(email)) {
        return 'El formato del correo electrónico no es válido.';
    }
    if (!password) {
        return 'La contraseña es requerida.';
    }
    if (password.length < 6) {
        return 'La contraseña debe tener al menos 6 caracteres.';
    }
    return null;
}

// ==================== COMPONENTE ====================
export default function LoginPage() {
    const [state, dispatch] = useReducer(loginReducer, initialLoginState);
    const { signIn, signInWithGoogle } = useAuth();
    const router = useRouter();
    const timerRef = useRef(null);

    const { email, password, error, loading, isSuccess, failedAttempts, blockedUntil, remainingSeconds } = state;
    const isBlocked = blockedUntil !== null && Date.now() < blockedUntil;

    // --- Restaurar rate limit de localStorage al montar ---
    useEffect(() => {
        const stored = loadRateLimitState();
        if (!stored) return;

        const { failedAttempts: storedAttempts, blockedUntil: storedBlockedUntil } = stored;

        if (storedBlockedUntil && Date.now() < storedBlockedUntil) {
            // Aún está bloqueado
            const remaining = Math.ceil((storedBlockedUntil - Date.now()) / 1000);
            dispatch({ type: 'RATE_LIMIT_HIT' });
            dispatch({ type: 'RATE_LIMIT_TICK', seconds: remaining });
        } else if (storedAttempts >= RATE_LIMIT.MAX_ATTEMPTS) {
            // Se venció el bloqueo, limpiar
            clearRateLimitStorage();
        } else if (storedAttempts > 0) {
            // Hay intentos fallidos acumulados pero no está bloqueado
            for (let i = 0; i < storedAttempts; i++) {
                dispatch({ type: 'LOGIN_ERROR', error: '' });
            }
            // Limpiar el error visual que se generó por los dispatches
            dispatch({ type: 'SET_FIELD', field: 'error', value: '' });
        }
    }, []);

    // --- Temporizador de cuenta regresiva ---
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

        tick(); // Ejecutar inmediatamente
        timerRef.current = setInterval(tick, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [blockedUntil]);

    // --- Persistir cambios de rate limit ---
    useEffect(() => {
        if (failedAttempts > 0 || blockedUntil) {
            saveRateLimitState(failedAttempts, blockedUntil);
        }
    }, [failedAttempts, blockedUntil]);

    // --- Verificar rate limit antes de cada intento ---
    const checkRateLimit = useCallback(() => {
        if (isBlocked) return false;

        // Si acaba de alcanzar el límite de intentos, bloquear
        if (failedAttempts >= RATE_LIMIT.MAX_ATTEMPTS) {
            dispatch({ type: 'RATE_LIMIT_HIT' });
            return false;
        }

        return true;
    }, [isBlocked, failedAttempts]);

    // --- Handler: Login con email/password ---
    const handleEmployeeSubmit = useCallback(async (e) => {
        e.preventDefault();

        // Verificar rate limit
        if (!checkRateLimit()) return;

        // Validar campos antes de enviar a Firebase
        const validationError = validateLoginFields(email, password);
        if (validationError) {
            dispatch({ type: 'LOGIN_ERROR', error: validationError });
            return;
        }

        dispatch({ type: 'LOGIN_START' });

        const result = await signIn(email, password);

        if (result.success) {
            await createSession('admin');
            sessionStorage.setItem('showWelcome', 'true');
            dispatch({ type: 'LOGIN_SUCCESS' });
            clearRateLimitStorage();
        } else {
            dispatch({ type: 'LOGIN_ERROR', error: result.error });

            // Verificar si con este error se alcanzó el límite
            if (failedAttempts + 1 >= RATE_LIMIT.MAX_ATTEMPTS) {
                dispatch({ type: 'RATE_LIMIT_HIT' });
            }
        }
    }, [email, password, signIn, checkRateLimit, failedAttempts]);

    // --- Handler: Login con Google ---
    const handleGoogleSignIn = useCallback(async () => {
        // Verificar rate limit
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

    // --- Callback: Animación de éxito completada → navegar ---
    const handleSuccessComplete = useCallback(() => {
        router.push('/modulos');
    }, [router]);

    // --- Info de rate limit para ModernLogin ---
    const rateLimitInfo = isBlocked
        ? { isBlocked: true, remainingSeconds }
        : null;

    return (
        <>
            <BackButton />
            <ModernLogin
                email={email}
                setEmail={(value) => dispatch({ type: 'SET_FIELD', field: 'email', value })}
                password={password}
                setPassword={(value) => dispatch({ type: 'SET_FIELD', field: 'password', value })}
                error={error}
                loading={loading}
                onSubmit={handleEmployeeSubmit}
                onGoogleSignIn={handleGoogleSignIn}
                isSuccess={isSuccess}
                onSuccessComplete={handleSuccessComplete}
                rateLimitInfo={rateLimitInfo}
            />
        </>
    );
}
