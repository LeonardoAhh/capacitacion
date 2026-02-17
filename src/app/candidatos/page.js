'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import UnifiedLogin from '@/components/ui/UnifiedLogin';
import { safeGetLocalStorage, safeSetLocalStorage, safeRemoveLocalStorage } from '@/utils/storage';
import { createSession } from '@/lib/sessionApi';

const CONFIG = {
    MAX_ATTEMPTS: 5,
    BLOCK_DURATION_MS: 30 * 1000,
    STORAGE_KEYS: {
        BLOCK: 'candidate_login_block',
        SESSION: 'candidate_session',
    },
    MAX_CODE_USES: 5,
    SUCCESS_REDIRECT_DELAY_MS: 1500,
};

export default function CandidatosLoginPage() {
    const router = useRouter();

    const [employeeId, setEmployeeId] = useState('');
    const [curp, setCurp] = useState('');
    const [accessCode, setAccessCode] = useState('');

    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    const [loginAttempts, setLoginAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

    const isFormValid = useMemo(() => {
        return employeeId.trim() !== '' &&
            curp.trim().length === 18 &&
            accessCode.trim() !== '';
    }, [employeeId, curp, accessCode]);

    useEffect(() => {
        const blockData = safeGetLocalStorage(CONFIG.STORAGE_KEYS.BLOCK);

        if (!blockData) return;

        const blockUntil = parseInt(blockData, 10);

        if (isNaN(blockUntil) || blockUntil <= Date.now()) {
            safeRemoveLocalStorage(CONFIG.STORAGE_KEYS.BLOCK);
            return;
        }

        setIsBlocked(true);
        setBlockTimeRemaining(Math.ceil((blockUntil - Date.now()) / 1000));

        const interval = setInterval(() => {
            const remaining = Math.ceil((blockUntil - Date.now()) / 1000);

            if (remaining <= 0) {
                setIsBlocked(false);
                setBlockTimeRemaining(0);
                safeRemoveLocalStorage(CONFIG.STORAGE_KEYS.BLOCK);
                setLoginAttempts(0);
                clearInterval(interval);
            } else {
                setBlockTimeRemaining(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleFailedAttempt = useCallback(() => {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        if (newAttempts >= CONFIG.MAX_ATTEMPTS) {
            const blockUntil = Date.now() + CONFIG.BLOCK_DURATION_MS;
            safeSetLocalStorage(CONFIG.STORAGE_KEYS.BLOCK, blockUntil.toString());
            setIsBlocked(true);
            setBlockTimeRemaining(CONFIG.BLOCK_DURATION_MS / 1000);
        }
    }, [loginAttempts]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInAnonymously(auth);

            const blockData = safeGetLocalStorage(CONFIG.STORAGE_KEYS.BLOCK);
            if (blockData) {
                const blockUntil = parseInt(blockData, 10);
                if (Date.now() < blockUntil) {
                    setError(`Demasiados intentos fallidos. Espera ${Math.ceil((blockUntil - Date.now()) / 1000)}s.`);
                    setLoading(false);
                    return;
                }
                safeRemoveLocalStorage(CONFIG.STORAGE_KEYS.BLOCK);
            }

            if (!employeeId.trim() || !curp.trim() || !accessCode.trim()) {
                setError('Por favor completa todos los campos');
                setLoading(false);
                return;
            }

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

            const candidateCurp = data.curp || data.CURP || '';
            if (!candidateCurp || candidateCurp.toUpperCase() !== curp.toUpperCase()) {
                setError('CURP incorrecto');
                handleFailedAttempt();
                setLoading(false);
                return;
            }

            if (!data.accessCode || data.accessCode !== accessCode) {
                setError('Código de acceso incorrecto');
                handleFailedAttempt();
                setLoading(false);
                return;
            }

            if (!data.accessCodeExpires || Date.now() > data.accessCodeExpires) {
                setError('Código de acceso expirado. Contacta a Recursos Humanos.');
                setLoading(false);
                return;
            }

            const codeUses = data.accessCodeUses || 0;
            if (codeUses >= CONFIG.MAX_CODE_USES) {
                setError(`Este código ha alcanzado el límite de ${CONFIG.MAX_CODE_USES} inicios de sesión.`);
                setLoading(false);
                return;
            }

            const employeeRef = doc(db, 'employees', candidateDocId);
            await updateDoc(employeeRef, {
                accessCodeUses: increment(1),
                lastLoginCandidate: new Date().toISOString()
            });

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

            sessionStorage.setItem(CONFIG.STORAGE_KEYS.SESSION, JSON.stringify(sessionData));

            setLoginAttempts(0);
            safeRemoveLocalStorage(CONFIG.STORAGE_KEYS.BLOCK);
            await createSession('candidate');

            setIsSuccess(true);
            setLoading(false);

            setTimeout(() => {
                router.push('/candidatos/dashboard');
            }, CONFIG.SUCCESS_REDIRECT_DELAY_MS);

        } catch (err) {
            console.error('Error en login de candidato:', err);

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

    const fields = [
        {
            id: 'employeeId',
            label: 'ID de Empleado',
            value: employeeId,
            onChange: (e) => { setError(''); setEmployeeId(e.target.value); },
            onBlur: () => setEmployeeId(prev => prev.toUpperCase()),
            placeholder: 'Ej: 3204',
            inputMode: 'numeric',
        },
        {
            id: 'curp',
            label: 'CURP',
            value: curp,
            onChange: (e) => { setError(''); setCurp(e.target.value); },
            onBlur: () => setCurp(prev => prev.toUpperCase()),
            placeholder: '18 caracteres',
            maxLength: 18,
        },
        {
            id: 'accessCode',
            label: 'Código de Acceso',
            value: accessCode,
            onChange: (e) => { setError(''); setAccessCode(e.target.value); },
            placeholder: '6 dígitos',
            maxLength: 6,
            helperText: 'Proporcionado por Recursos Humanos',
        },
    ];

    const footerContent = (
        <>
            <p className="footer-text">¿Problemas para acceder?</p>
            <a
                href="https://wa.me/524211265940"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8125rem',
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                }}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
                </svg>
                WhatsApp
            </a>
        </>
    );

    return (
        <UnifiedLogin
            portal="Portal de Candidatos"
            title="Bienvenido"
            subtitle="Proceso de inducción"
            fields={fields}
            error={error}
            loading={loading}
            blocked={isBlocked}
            blockedMessage={isBlocked ? `Espera ${blockTimeRemaining}s para intentar de nuevo` : null}
            onSubmit={handleSubmit}
            submitText="Acceder"
            isSuccess={isSuccess}
            footerContent={footerContent}
            backHref="/"
            backLabel="Inicio"
        />
    );
}
