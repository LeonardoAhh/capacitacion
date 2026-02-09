'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import CandidateLogin from '@/components/CandidateLogin/CandidateLogin';

// ==================== CONSTANTS ====================
const LOGIN_CONSTANTS = {
    MAX_ATTEMPTS: 10,
    BLOCK_DURATION_MS: 15 * 60 * 1000, // 15 minutes
    SUCCESS_REDIRECT_DELAY_MS: 2500, // 2.5 seconds (reduced from 15s)
    MAX_CODE_USES: 10,
    STORAGE_KEYS: {
        BLOCK: 'candidate_login_blocked',
        SESSION: 'candidate_session'
    }
};

// ==================== HELPERS ====================
/**
 * Check if running in browser environment (SSR safety)
 */
const isBrowser = () => typeof window !== 'undefined';

/**
 * Get item from localStorage with SSR safety
 */
const safeGetLocalStorage = (key) => {
    if (!isBrowser()) return null;
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
};

/**
 * Set item in localStorage with SSR safety
 */
const safeSetLocalStorage = (key, value) => {
    if (!isBrowser()) return;
    try {
        localStorage.setItem(key, value);
    } catch {
        console.error('Failed to set localStorage:', key);
    }
};

/**
 * Remove item from localStorage with SSR safety
 */
const safeRemoveLocalStorage = (key) => {
    if (!isBrowser()) return;
    try {
        localStorage.removeItem(key);
    } catch {
        console.error('Failed to remove localStorage:', key);
    }
};

/**
 * Format remaining block time
 */
const formatBlockTime = (seconds) => {
    const mins = Math.ceil(seconds / 60);
    return mins;
};

// ==================== COMPONENT ====================
export default function CandidatosLoginPage() {
    const router = useRouter();

    // Form state
    const [employeeId, setEmployeeId] = useState('');
    const [curp, setCurp] = useState('');
    const [accessCode, setAccessCode] = useState('');

    // UI state
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    // Security state
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

    // Memoized check for form validity
    const isFormValid = useMemo(() => {
        return employeeId.trim() !== '' &&
            curp.trim().length === 18 &&
            accessCode.trim() !== '';
    }, [employeeId, curp, accessCode]);

    // Check for existing block on mount
    useEffect(() => {
        const blockData = safeGetLocalStorage(LOGIN_CONSTANTS.STORAGE_KEYS.BLOCK);

        if (!blockData) return;

        const blockUntil = parseInt(blockData, 10);

        if (isNaN(blockUntil) || blockUntil <= Date.now()) {
            safeRemoveLocalStorage(LOGIN_CONSTANTS.STORAGE_KEYS.BLOCK);
            return;
        }

        setIsBlocked(true);
        setBlockTimeRemaining(Math.ceil((blockUntil - Date.now()) / 1000));

        const interval = setInterval(() => {
            const remaining = Math.ceil((blockUntil - Date.now()) / 1000);

            if (remaining <= 0) {
                setIsBlocked(false);
                setBlockTimeRemaining(0);
                safeRemoveLocalStorage(LOGIN_CONSTANTS.STORAGE_KEYS.BLOCK);
                setLoginAttempts(0);
                clearInterval(interval);
            } else {
                setBlockTimeRemaining(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Handle failed login attempt
    const handleFailedAttempt = useCallback(() => {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        if (newAttempts >= LOGIN_CONSTANTS.MAX_ATTEMPTS) {
            const blockUntil = Date.now() + LOGIN_CONSTANTS.BLOCK_DURATION_MS;
            safeSetLocalStorage(LOGIN_CONSTANTS.STORAGE_KEYS.BLOCK, blockUntil.toString());
            setIsBlocked(true);
            setBlockTimeRemaining(LOGIN_CONSTANTS.BLOCK_DURATION_MS / 1000);
        }
    }, [loginAttempts]);

    // Clear error when user modifies input
    const handleInputChange = useCallback((setter) => (e) => {
        setError('');
        setter(e.target.value.toUpperCase());
    }, []);

    // Handle access code change (no uppercase)
    const handleAccessCodeChange = useCallback((e) => {
        setError('');
        setAccessCode(e.target.value);
    }, []);

    // Form submission handler
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Step 1: Anonymous Firebase Auth
            await signInAnonymously(auth);

            // Step 2: Check if blocked
            const blockData = safeGetLocalStorage(LOGIN_CONSTANTS.STORAGE_KEYS.BLOCK);
            if (blockData) {
                const blockUntil = parseInt(blockData, 10);
                if (Date.now() < blockUntil) {
                    const remainingMins = formatBlockTime((blockUntil - Date.now()) / 1000);
                    setError(`Demasiados intentos fallidos. Espera ${remainingMins} minutos.`);
                    setLoading(false);
                    return;
                }
                safeRemoveLocalStorage(LOGIN_CONSTANTS.STORAGE_KEYS.BLOCK);
            }

            // Step 3: Validate required fields
            if (!employeeId.trim() || !curp.trim() || !accessCode.trim()) {
                setError('Por favor completa todos los campos');
                setLoading(false);
                return;
            }

            // Step 4: Query employee by ID
            const employeesRef = collection(db, 'employees');
            const q = query(employeesRef, where('employeeId', '==', employeeId.trim()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('ID de empleado no encontrado');
                handleFailedAttempt();
                setLoading(false);
                return;
            }

            const docSnapshot = querySnapshot.docs[0];
            const data = docSnapshot.data();
            const candidateDocId = docSnapshot.id;

            // Step 5: Validate CURP
            const candidateCurp = data.curp || data.CURP || '';
            if (!candidateCurp || candidateCurp.toUpperCase() !== curp.toUpperCase()) {
                setError('CURP incorrecto');
                handleFailedAttempt();
                setLoading(false);
                return;
            }

            // Step 6: Validate access code
            if (!data.accessCode || data.accessCode !== accessCode) {
                setError('Código de acceso incorrecto');
                handleFailedAttempt();
                setLoading(false);
                return;
            }

            // Step 7: Check code expiration
            if (!data.accessCodeExpires || Date.now() > data.accessCodeExpires) {
                setError('Código de acceso expirado. Contacta a Recursos Humanos.');
                setLoading(false);
                return;
            }

            // Step 8: Check usage limit
            const codeUses = data.accessCodeUses || 0;
            if (codeUses >= LOGIN_CONSTANTS.MAX_CODE_USES) {
                setError(`Este código ha alcanzado el límite de ${LOGIN_CONSTANTS.MAX_CODE_USES} inicios de sesión. Contacta a RH para un nuevo código.`);
                setLoading(false);
                return;
            }

            // Step 9: Update usage count (using updateDoc instead of setDoc)
            const employeeRef = doc(db, 'employees', candidateDocId);
            await updateDoc(employeeRef, {
                accessCodeUses: increment(1),
                lastLoginCandidate: new Date().toISOString()
            });

            // Step 10: Create session
            const sessionData = {
                id: candidateDocId,
                employeeId: data.employeeId || employeeId,
                name: data.name || data.nombre || data.Nombre || 'N/A',
                area: data.area || data.Area || data['área'] || 'N/A',
                curp: candidateCurp,
                department: data.department || data.departamento || 'N/A',
                position: data.position || data.puesto || 'N/A',
                shift: data.shift || data.turno || 'N/A',
                startdate: data.startDate || data.fechaInicio || data.fecha_ingreso || 'N/A',
                cursosCompletados: data.cursosCompletados || [],
                photoUrl: data.photoUrl || data.photoURL || data.photo || data.foto || null
            };

            if (isBrowser()) {
                sessionStorage.setItem(LOGIN_CONSTANTS.STORAGE_KEYS.SESSION, JSON.stringify(sessionData));
            }

            // Step 11: Reset security state
            setLoginAttempts(0);
            safeRemoveLocalStorage(LOGIN_CONSTANTS.STORAGE_KEYS.BLOCK);

            // Step 12: Show success and redirect
            setIsSuccess(true);
            setLoading(false);

            setTimeout(() => {
                router.push('/candidatos/dashboard');
            }, LOGIN_CONSTANTS.SUCCESS_REDIRECT_DELAY_MS);

        } catch (err) {
            console.error('Error en login de candidato:', err);

            // More specific error messages
            if (err.code === 'permission-denied') {
                setError('Error de permisos. Contacta al administrador.');
            } else if (err.code === 'unavailable') {
                setError('Servicio no disponible. Intenta más tarde.');
            } else {
                setError('Error al iniciar sesión. Intenta nuevamente.');
            }

            setLoading(false);
        }
    }, [employeeId, curp, accessCode, handleFailedAttempt, router]);

    return (
        <CandidateLogin
            employeeId={employeeId}
            setEmployeeId={handleInputChange(setEmployeeId)}
            curp={curp}
            setCurp={handleInputChange(setCurp)}
            accessCode={accessCode}
            setAccessCode={handleAccessCodeChange}
            error={error}
            loading={loading}
            isBlocked={isBlocked}
            blockTimeRemaining={blockTimeRemaining}
            onSubmit={handleSubmit}
            isSuccess={isSuccess}
            isFormValid={isFormValid}
        />
    );
}
