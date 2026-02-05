'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import CandidateLogin from '@/components/CandidateLogin/CandidateLogin';

export default function CandidatosLoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form fields
    const [employeeId, setEmployeeId] = useState('');
    const [curp, setCurp] = useState('');
    const [accessCode, setAccessCode] = useState('');

    // Security states
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

    // Verificar bloqueo por intentos fallidos
    useEffect(() => {
        const blocked = localStorage.getItem('candidate_login_blocked');
        if (blocked) {
            const blockUntil = parseInt(blocked);
            if (blockUntil > Date.now()) {
                setIsBlocked(true);
                const remaining = Math.ceil((blockUntil - Date.now()) / 1000);
                setBlockTimeRemaining(remaining);

                const interval = setInterval(() => {
                    const newRemaining = Math.ceil((blockUntil - Date.now()) / 1000);
                    if (newRemaining <= 0) {
                        setIsBlocked(false);
                        setBlockTimeRemaining(0);
                        localStorage.removeItem('candidate_login_blocked');
                        setLoginAttempts(0);
                        clearInterval(interval);
                    } else {
                        setBlockTimeRemaining(newRemaining);
                    }
                }, 1000);

                return () => clearInterval(interval);
            } else {
                localStorage.removeItem('candidate_login_blocked');
            }
        }
    }, []);

    const handleFailedAttempt = () => {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        if (newAttempts >= 5) {
            const blockUntil = Date.now() + (15 * 60 * 1000); // 15 minutos
            localStorage.setItem('candidate_login_blocked', blockUntil.toString());
            setIsBlocked(true);
            setBlockTimeRemaining(15 * 60);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // PASO 1: Autenticar anónimamente con Firebase Auth
            await signInAnonymously(auth);

            // PASO 2: Verificar bloqueo por intentos fallidos
            const blockKey = 'candidate_login_blocked';
            const blockData = localStorage.getItem(blockKey);

            if (blockData) {
                const blockUntil = parseInt(blockData);
                if (Date.now() < blockUntil) {
                    const remainingMinutes = Math.ceil((blockUntil - Date.now()) / 60000);
                    setError(`Demasiados intentos fallidos. Espera ${remainingMinutes} minutos.`);
                    setLoading(false);
                    return;
                }
                localStorage.removeItem(blockKey);
            }

            // PASO 3: Validar campos
            if (!employeeId || !curp || !accessCode) {
                setError('Por favor completa todos los campos');
                setLoading(false);
                return;
            }

            // Buscar candidato por campo employeeId
            const employeesRef = collection(db, 'employees');
            const q = query(employeesRef, where('employeeId', '==', employeeId));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('ID de empleado no encontrado');
                handleFailedAttempt();
                setLoading(false);
                return;
            }

            // Obtener el primer resultado (debería ser único)
            const data = querySnapshot.docs[0].data();
            const candidateDocId = querySnapshot.docs[0].id;

            // Validar CURP
            const candidateCurp = data.curp || data.CURP;
            if (!candidateCurp || candidateCurp.toUpperCase() !== curp.toUpperCase()) {
                setError('CURP incorrecto');
                handleFailedAttempt();
                setLoading(false);
                return;
            }

            // Validar código de acceso
            if (!data.accessCode || data.accessCode !== accessCode) {
                setError('Código de acceso incorrecto');
                handleFailedAttempt();
                setLoading(false);
                return;
            }

            // Validar expiración del código
            if (!data.accessCodeExpires || Date.now() > data.accessCodeExpires) {
                setError('Código de acceso expirado. Contacta a Recursos Humanos.');
                setLoading(false);
                return;
            }

            // Verificar usos del código (Max 5 usos)
            const codeUses = data.accessCodeUses || 0;
            if (codeUses >= 5) {
                setError('Este código de acceso ya ha alcanzado el límite de 5 inicios de sesión. Contacta a RH para obtener un nuevo código.');
                setLoading(false);
                return;
            }

            // Login exitoso: Registrar uso del código
            await setDoc(doc(db, 'employees', candidateDocId), {
                accessCodeUses: codeUses + 1,
                lastLoginCandidate: new Date().toISOString()
            }, { merge: true });

            // Crear sesión
            const sessionData = {
                id: candidateDocId,
                employeeId: data.employeeId || data.id || employeeId,
                name: data.name || data.nombre || data.Nombre || 'N/A',
                area: data.area || data.Area || data['área'] || data.Area || 'N/A',
                curp: candidateCurp,
                department: data.department || data.departamento || data.Department || 'N/A',
                position: data.position || data.puesto || data.Position || 'N/A',
                shift: data.shift || data.turno || data.Shift || 'N/A',
                startdate: data.startDate || data.fechaInicio || data.start_date || data.fecha_ingreso || 'N/A',
                cursosCompletados: data.cursosCompletados || []
            };

            sessionStorage.setItem('candidate_session', JSON.stringify(sessionData));

            // Reset intentos
            setLoginAttempts(0);
            localStorage.removeItem('candidate_login_blocked');

            // Redirigir al dashboard
            router.push('/candidatos/dashboard');

        } catch (err) {
            console.error('Error en login de candidato:', err);
            setError('Error al iniciar sesión. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <CandidateLogin
            employeeId={employeeId}
            setEmployeeId={setEmployeeId}
            curp={curp}
            setCurp={setCurp}
            accessCode={accessCode}
            setAccessCode={setAccessCode}
            error={error}
            loading={loading}
            isBlocked={isBlocked}
            blockTimeRemaining={blockTimeRemaining}
            onSubmit={handleSubmit}
        />
    );
}
