'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LogoVinoPlastic from '@/components/Logo/LogoVinoPlastic';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { HyperText } from '@/components/ui/HyperText';
import { User, GraduationCap, Mail, Lock, Key, IdCard } from 'lucide-react';
import { signInAnonymously } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import styles from './page.module.css';

export default function LoginPage() {
    // Estados comunes
    const [selectedLoginType, setSelectedLoginType] = useState(null); // 'employee', 'candidate', null
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Estados para EMPLEADOS
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [mfaSecret, setMfaSecret] = useState(null);

    // Estados para CANDIDATOS
    const [employeeId, setEmployeeId] = useState('');
    const [curp, setCurp] = useState('');
    const [accessCode, setAccessCode] = useState('');

    const { signIn, signInAnon, verifyOtp, user } = useAuth();
    const router = useRouter();

    // === EMPLEADOS ===
    const handleEmployeeSubmit = async (e) => {
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

    // === CANDIDATOS ===
    const handleCandidateSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Autenticar anónimamente con Firebase
            await signInAnonymously(auth);

            // Validar campos
            if (!employeeId || !curp || !accessCode) {
                setError('Por favor completa todos los campos');
                setLoading(false);
                return;
            }

            // Buscar candidato por employeeId
            const employeesRef = collection(db, 'employees');
            const q = query(employeesRef, where('employeeId', '==', employeeId.toUpperCase()));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('ID de empleado no encontrado');
                setLoading(false);
                return;
            }

            const candidateDoc = querySnapshot.docs[0];
            const candidateDocId = candidateDoc.id;
            const data = candidateDoc.data();

            // Validar CURP
            const candidateCurp = curp.trim().toUpperCase();
            const storedCurp = (data.curp || data.CURP || '').trim().toUpperCase();

            if (storedCurp !== candidateCurp) {
                setError('CURP incorrecto');
                setLoading(false);
                return;
            }

            // Validar código de acceso
            if (!data.accessCode) {
                setError('No tienes un código de acceso asignado. Contacta a RH.');
                setLoading(false);
                return;
            }

            if (data.accessCode !== accessCode) {
                setError('Código de acceso incorrecto');
                setLoading(false);
                return;
            }

            // Verificar expiración del código
            if (data.accessCodeExpiry) {
                const expiryDate = new Date(data.accessCodeExpiry);
                if (expiryDate < new Date()) {
                    setError('Tu código de acceso ha expirado. Contacta a RH.');
                    setLoading(false);
                    return;
                }
            }

            // Verificar límite de usos
            const codeUses = data.accessCodeUses || 0;
            if (codeUses >= 2) {
                setError('Has alcanzado el límite de usos. Contacta a RH para un nuevo código.');
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
                employeeId: data.employeeId || employeeId,
                name: data.name || data.nombre || 'N/A',
                area: data.area || data.Area || data['área'] || 'N/A',
                curp: candidateCurp,
                department: data.department || data.departamento || 'N/A',
                position: data.position || data.puesto || 'N/A',
                shift: data.shift || data.turno || 'N/A',
                startdate: data.startDate || data.fechaInicio || 'N/A',
                cursosCompletados: data.cursosCompletados || []
            };

            sessionStorage.setItem('candidate_session', JSON.stringify(sessionData));
            router.push('/candidatos/dashboard');

        } catch (error) {
            console.error('Error en login de candidato:', error);
            setError('Error al iniciar sesión. Intenta de nuevo.');
            setLoading(false);
        }
    };

    // === RENDERIZADO ===
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
                                maxWidth: '60px',
                                height: 'auto',
                                color: 'var(--text-primary)'
                            }}
                        />
                    </div>
                    <HyperText
                        className={styles.appSubtitle}
                        startOnView={true}
                        duration={1500}
                    >
                        ViñoPlastic Inyección
                    </HyperText>
                </div>

                {/* Main Content */}
                {!selectedLoginType ? (
                    /* SELECTOR DE TIPO DE LOGIN */
                    <div className={styles.selectorContainer}>
                        <h2 className={styles.selectorTitle}>Iniciar sesión</h2>

                        <div className={styles.cardsGrid}>
                            {/* Card: EMPLEADOS */}
                            <div
                                className={styles.loginCard}
                                onClick={() => setSelectedLoginType('employee')}
                            >
                                <div className={styles.cardIcon}>
                                    <User size={40} />
                                </div>
                                <h3 className={styles.cardTitle}>Empleados</h3>
                                <p className={styles.cardDescription}>
                                    Acceso a empleados
                                </p>
                                <div className={styles.cardButton}>
                                    Ingresar
                                </div>
                            </div>

                            {/* Card: CANDIDATOS */}
                            <div
                                className={styles.loginCard}
                                onClick={() => setSelectedLoginType('candidate')}
                            >
                                <div className={styles.cardIcon}>
                                    <GraduationCap size={40} />
                                </div>
                                <h3 className={styles.cardTitle}>Candidatos</h3>
                                <p className={styles.cardDescription}>
                                    Portal de inducción
                                </p>
                                <div className={styles.cardButton}>
                                    Ingresar
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className={styles.errorBox} role="alert">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                {error}
                            </div>
                        )}
                    </div>
                ) : (
                    /* FORMULARIOS DE LOGIN */
                    <div className={styles.card}>
                        {/* Botón Volver */}
                        <button
                            className={styles.backButton}
                            onClick={() => {
                                setSelectedLoginType(null);
                                setError('');
                                setMfaRequired(false);
                            }}
                        >
                            ← Volver
                        </button>

                        {/* FORMULARIO EMPLEADOS */}
                        {selectedLoginType === 'employee' && (
                            <form onSubmit={mfaRequired ? handleMfaSubmit : handleEmployeeSubmit} className={styles.form}>
                                <div className={styles.formHeader}>
                                    <User size={32} />
                                    <h2>Acceso Empleados</h2>
                                </div>

                                {error && (
                                    <div className={styles.errorBox} role="alert">
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
                                            <Mail className={styles.inputIcon} size={20} />
                                            <input
                                                id="email"
                                                type="email"
                                                placeholder=" "
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className={styles.input}
                                                data-has-value={!!email}
                                            />
                                            <label htmlFor="email" className={styles.label}>Correo Electrónico</label>
                                        </div>

                                        <div className={styles.inputGroup}>
                                            <Lock className={styles.inputIcon} size={20} />
                                            <input
                                                id="password"
                                                type="password"
                                                placeholder=" "
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className={styles.input}
                                                data-has-value={!!password}
                                            />
                                            <label htmlFor="password" className={styles.label}>Contraseña</label>
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.inputGroup}>
                                        <Key className={styles.inputIcon} size={20} />
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
                            </form>
                        )}

                        {/* FORMULARIO CANDIDATOS */}
                        {selectedLoginType === 'candidate' && (
                            <form onSubmit={handleCandidateSubmit} className={styles.form}>
                                <div className={styles.formHeader}>
                                    <GraduationCap size={32} />
                                    <h2>Portal de Candidatos</h2>
                                </div>

                                {error && (
                                    <div className={styles.errorBox} role="alert">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        {error}
                                    </div>
                                )}

                                <div className={styles.inputGroup}>
                                    <IdCard className={styles.inputIcon} size={20} />
                                    <input
                                        id="employeeId"
                                        type="text"
                                        placeholder=" "
                                        value={employeeId}
                                        onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                                        required
                                        className={styles.input}
                                        data-has-value={!!employeeId}
                                    />
                                    <label htmlFor="employeeId" className={styles.label}>ID de Empleado</label>
                                </div>

                                <div className={styles.inputGroup}>
                                    <User className={styles.inputIcon} size={20} />
                                    <input
                                        id="curp"
                                        type="text"
                                        placeholder=" "
                                        value={curp}
                                        onChange={(e) => setCurp(e.target.value.toUpperCase())}
                                        required
                                        maxLength={18}
                                        className={styles.input}
                                        data-has-value={!!curp}
                                    />
                                    <label htmlFor="curp" className={styles.label}>CURP</label>
                                </div>

                                <div className={styles.inputGroup}>
                                    <Key className={styles.inputIcon} size={20} />
                                    <input
                                        id="accessCode"
                                        type="text"
                                        placeholder=" "
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        required
                                        className={styles.input}
                                        data-has-value={!!accessCode}
                                    />
                                    <label htmlFor="accessCode" className={styles.label}>Código de Acceso</label>
                                </div>

                                <button
                                    type="submit"
                                    className={styles.primaryBtn}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="spinner-sm"></div>
                                    ) : (
                                        <>
                                            Ingresar al Portal
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M5 12h14M12 5l7 7-7 7" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                )}

                <div className={styles.footer}>
                    <p>&copy; 2024 Vertx System v2.0</p>
                </div>
            </div>
        </div>
    );
}
