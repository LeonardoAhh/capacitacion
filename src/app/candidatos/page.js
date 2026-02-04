'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import styles from './page.module.css';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { Lock, User, Key, ArrowLeft } from 'lucide-react';

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // PASO 1: Autenticar anónimamente con Firebase Auth
            // Esto habilita las reglas de seguridad de Firestore
            await signInAnonymously(auth);

            // PASO 2: Verificar bloqueo por intentos fallidos
            const blockKey = 'candidate_login_blocked';
            const blockData = localStorage.getItem(blockKey);

            if (blockData) {
                const { until } = JSON.parse(blockData);
                if (Date.now() < until) {
                    const remainingMinutes = Math.ceil((until - Date.now()) / 60000);
                    setError(`Demasiados intentos fallidos. Espera ${remainingMinutes} minutos.`);
                    setLoading(false);
                    return;
                }
                // Bloqueo expirado
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

            // Verificar usos del código (Max 3 usos)
            const codeUses = data.accessCodeUses || 0;
            if (codeUses >= 3) {
                setError('Este código de acceso ya ha alcanzado el límite de 3 inicios de sesión. Contacta a RH para obtener un nuevo código.');
                setLoading(false);
                return;
            }

            // Validar que sea candidato (o permitir si tiene código activo)
            if (data.status !== 'Candidato' && !data.isCandidato) {
                // Validación flexible para permitir acceso si tiene código válido
            }

            // Login exitoso: Registrar uso del código
            await setDoc(doc(db, 'employees', candidateDocId), {
                accessCodeUses: codeUses + 1,
                lastLoginCandidate: new Date().toISOString()
            }, { merge: true });

            // Crear sesión con TODOS los datos solicitados - Mapeo exhaustivo
            const sessionData = {
                id: candidateDocId,
                employeeId: data.employeeId || data.id || employeeId,
                name: data.name || data.nombre || data.Nombre || 'N/A',
                // Mapeo exhaustivo de campos que pueden venir en español o inglés
                area: data.area || data.Area || data['área'] || data.Area || 'N/A',
                curp: candidateCurp,
                department: data.department || data.departamento || data.Department || 'N/A',
                position: data.position || data.puesto || data.Position || 'N/A',
                shift: data.shift || data.turno || data.Shift || 'N/A',
                // Fechas
                startdate: data.startDate || data.fechaInicio || data.start_date || data.fecha_ingreso || 'N/A',
                cursosCompletados: data.cursosCompletados || []
            };

            console.log('Datos de sesión obtenidos:', sessionData); // Debug log

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

    return (
        <div className={styles.container}>
            {/* Theme Toggle */}
            <div className={styles.themeToggle}>
                <ThemeToggle />
            </div>

            {/* Background Effects */}
            <div className={styles.bgDecoration}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
            </div>

            {/* Login Card */}
            <div className={styles.loginCard}>
                {/* Back Button */}
                <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className={styles.backButton}
                >
                    <ArrowLeft size={18} />
                    <span>Volver</span>
                </button>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.iconCircle}>
                        <User size={32} />
                    </div>
                    <h1 className={styles.title}>Portal de Candidatos</h1>
                    <p className={styles.subtitle}>Bienvenido a tu proceso de inducción</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    {/* Employee ID */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="employeeId" className={styles.label}>
                            ID de Empleado
                        </label>
                        <div className={styles.inputWrapper}>
                            <User size={20} className={styles.inputIcon} />
                            <input
                                id="employeeId"
                                type="text"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                                placeholder="EMP-2024-001"
                                className={styles.input}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* CURP */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="curp" className={styles.label}>
                            CURP
                        </label>
                        <div className={styles.inputWrapper}>
                            <Lock size={20} className={styles.inputIcon} />
                            <input
                                id="curp"
                                type="text"
                                value={curp}
                                onChange={(e) => setCurp(e.target.value.toUpperCase())}
                                placeholder="AAAA000000HDFBBB00"
                                maxLength={18}
                                className={styles.input}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Access Code */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="accessCode" className={styles.label}>
                            Código de Acceso
                        </label>
                        <div className={styles.inputWrapper}>
                            <Key size={20} className={styles.inputIcon} />
                            <input
                                id="accessCode"
                                type="text"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                placeholder="123456"
                                maxLength={6}
                                className={styles.input}
                                disabled={loading}
                            />
                        </div>
                        <p className={styles.hint}>
                            Código proporcionado por Recursos Humanos
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className={styles.errorMessage}>
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? 'Verificando...' : 'Acceder'}
                    </button>
                </form>

                {/* Footer */}
                <div className={styles.footer}>
                    <p className={styles.footerText}>
                        ¿Problemas para acceder? <br />
                        Contacta a Recursos Humanos
                    </p>
                </div>
            </div>
        </div>
    );
}
