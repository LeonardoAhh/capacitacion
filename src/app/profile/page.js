'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProfileDropdown from '@/components/layout/ProfileDropdown/ProfileDropdown';
import styles from './page.module.css';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import { Eye, EyeOff } from 'lucide-react';
import BackButton from '@/components/ui/BackButton/BackButton';
import { useToast } from '@/components/ui/Toast/Toast';

export default function ProfilePage() {
    const { user, loading, updateUserProfile } = useAuth();
    const router = useRouter();
    const [avatarSeed, setAvatarSeed] = useState('');

    // Email Reveal State
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        if (user) {
            // Prioritize saved avatarSeed, otherwise use email as default seed
            setAvatarSeed(user.avatarSeed || user.email);
        }
    }, [user]);

    const avatarSvg = useMemo(() => {
        return createAvatar(lorelei, {
            seed: avatarSeed || 'placeholder',
            size: 120,
            backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9'],
        }).toString();
    }, [avatarSeed]);

    const handleRandomizeAvatar = async () => {
        const newSeed = Math.random().toString(36).substring(7);
        // Optimistically update local state
        setAvatarSeed(newSeed);

        // Save to Firestore
        if (user && user.uid) {
            await updateUserProfile(user.uid, { avatarSeed: newSeed });
        }
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
                <span>Cargando perfil...</span>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
            <div className={styles.profileContainer}>
                <ProfileDropdown />
            </div>



            <main className={styles.container}>

                <BackButton onClick={() => router.back()} />

                {/* Header Card (Avatar + Info) */}
                <div className={styles.headerCard}>

                    {/* Avatar */}
                    <div className={styles.avatarContainer}>
                        <div
                            className={styles.avatar}
                            dangerouslySetInnerHTML={{ __html: avatarSvg }}
                            style={{ overflow: 'hidden' }}
                        />
                        <button
                            onClick={handleRandomizeAvatar}
                            className={styles.changeAvatarBtn}
                            title="Cambiar Avatar"
                        >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <div className={styles.statusIndicator} title="Activo"></div>
                    </div>

                    {/* Basic Info */}
                    <div className={styles.userInfo}>
                        <h1 className={styles.userName}>
                            {user.name || user.displayName || 'Usuario'}
                        </h1>

                        {/* Email Reveal Section */}
                        <div className={styles.emailSection}>
                            <div
                                className={styles.emailWrapper}
                                onClick={() => setIsRevealed(!isRevealed)}
                                style={{ cursor: 'pointer' }}
                                title={isRevealed ? "Click para ocultar" : "Click para ver"}
                            >
                                <span className={styles.revealIcon}>
                                    {isRevealed ? <Eye size={18} /> : <EyeOff size={18} />}
                                </span>

                                <span className={`${styles.emailText} ${isRevealed ? styles.noBlur : styles.blur}`}>
                                    {user.email || 'correo@ejemplo.com'}
                                </span>
                            </div>
                        </div>

                        <div className={styles.badgeContainer}>
                            <span className={`${styles.badge} ${styles.badgePrimary}`}>
                                {user.rol || 'Empleado'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Details Card */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>
                        <svg className={styles.cardIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Detalles del Perfil
                    </h3>
                    <ul className={styles.detailsList}>
                        <li className={styles.detailsItem}>
                            <span className={styles.label}>Puesto</span>
                            <span className={styles.value}>{user.puesto || 'No definido'}</span>
                        </li>
                        <li className={styles.detailsItem}>
                            <span className={styles.label}>Departamento</span>
                            <span className={styles.value}>{user.departamento || 'No definido'}</span>
                        </li>
                        <li className={styles.detailsItem}>
                            <span className={styles.label}>Fecha Ingreso</span>
                            <span className={styles.value}>{user.fechaIngreso || 'No definida'}</span>
                        </li>
                        <li className={styles.detailsItem}>
                            <span className={styles.label}>Género</span>
                            <span className={styles.value}>{user.genero || 'No definido'}</span>
                        </li>
                    </ul>
                </div>

                {/* Administration Section (Only for Admins) */}
                {(
                    ['admin', 'superadmin', 'super_admin'].includes(user.rol?.toLowerCase()) ||
                    ['ADMIN', 'SUPER_ADMIN'].includes(user.rol)
                ) && (
                        <>
                            <AdminSection />
                            <AdminMuralSection />
                        </>
                    )}

                {/* Log de Auditoría de Inducción */}
                {(['super_admin', 'instructor'].includes(user.rol)) && (
                    <InduccionAuditSection />
                )}
            </main>
        </div>
    );
}

// Subcomponente para evitar re-renders innecesarios y organizar código
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shield, AlertTriangle, BookOpen, Trash2, RefreshCw, UploadCloud, FileEdit } from 'lucide-react';

function AdminSection() {
    const { toast } = useToast();
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [duration, setDuration] = useState(2); // Horas por defecto
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const configRef = doc(db, 'app_config', 'general');
        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setIsMaintenance(data.maintenanceMode || false);
                // Si ya hay una fecha guardada, podríamos calcular las horas restantes para mostrar, 
                // pero por simplicidad dejaremos el selector en su valor por defecto o último usado.
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const toggleMaintenance = async () => {
        const newState = !isMaintenance;
        setIsMaintenance(newState); // Optimistic

        try {
            const updateData = {
                maintenanceMode: newState,
                maintenanceMessage: "Estamos realizando mejoras en la plataforma. Volveremos pronto."
            };

            // Si se activa, calculamos la fecha de fin
            if (newState) {
                const endDate = new Date();
                endDate.setHours(endDate.getHours() + parseInt(duration));
                updateData.maintenanceUntil = endDate.toISOString();
            } else {
                updateData.maintenanceUntil = null;
            }

            await setDoc(doc(db, 'app_config', 'general'), updateData, { merge: true });
        } catch (error) {
            console.error("Error updating maintenance mode:", error);
            setIsMaintenance(!newState);
            toast.error("Error al actualizar el modo mantenimiento");
        }
    };

    if (loading) return null;

    return (
        <div className={styles.card} style={{ borderColor: isMaintenance ? '#ef4444' : 'var(--border-color)' }}>
            <h3 className={styles.cardTitle} style={{ color: isMaintenance ? '#ef4444' : 'inherit' }}>
                <Shield className={styles.cardIcon} />
                Administración del Sistema
            </h3>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: isMaintenance ? '#fef2f2' : 'var(--bg-secondary)',
                borderRadius: '8px',
                marginTop: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{
                            padding: '0.5rem',
                            borderRadius: '50%',
                            backgroundColor: isMaintenance ? '#fee2e2' : '#e2e8f0',
                            color: isMaintenance ? '#ef4444' : '#64748b'
                        }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Modo Mantenimiento
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                {isMaintenance
                                    ? 'La plataforma está bloqueada para usuarios.'
                                    : 'La plataforma está accesible para todos.'}
                            </p>
                        </div>
                    </div>

                    <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={isMaintenance}
                            onChange={toggleMaintenance}
                            style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: isMaintenance ? '#ef4444' : '#ccc',
                            transition: '.4s',
                            borderRadius: '34px'
                        }}>
                            <span style={{
                                position: 'absolute',
                                content: '""',
                                height: '20px', width: '20px',
                                left: isMaintenance ? '26px' : '4px',
                                bottom: '3px',
                                backgroundColor: 'white',
                                transition: '.4s',
                                borderRadius: '50%'
                            }}></span>
                        </span>
                    </label>
                </div>

                {!isMaintenance && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '3.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Duración estimada:
                        </label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: '1px solid var(--border-color)',
                                fontSize: '0.85rem',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <option value="1">1 hora</option>
                            <option value="2">2 horas</option>
                            <option value="4">4 horas</option>
                            <option value="8">8 horas</option>
                            <option value="12">12 horas</option>
                            <option value="24">24 horas</option>
                            <option value="48">48 horas</option>
                        </select>
                    </div>
                )}
            </div>

            {isMaintenance && (
                <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>
                    ⚠ Tú sigues teniendo acceso por ser Administrador.
                </div>
            )}
        </div>
    );
}

// ── ADMIN MURAL SECTION ──
import { Presentation, Save, RefreshCcw } from 'lucide-react';

// Helper para extraer nombre(s) asumiendo formato "ApellidoPaterno ApellidoMaterno Nombre(s)"
const extractFirstName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 3) {
        return parts.slice(2).join(' '); // Retorna los nombres, ignorando los dos apellidos
    } else if (parts.length === 2) {
        return parts[1]; // Si son 2 palabras asume [Apellido] [Nombre]
    }
    return parts[0];
};

function AdminMuralSection() {
    const { toast } = useToast();
    const [syncing, setSyncing] = useState(false);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualData, setManualData] = useState({
        employeeId: '', firstName: '', currentPosition: '', promotionTo: '', score: '', requiredScore: ''
    });
    const [messages, setMessages] = useState({
        successMessage: '',
        motivationalMessage: ''
    });

    // Cargar configuración de mensajes
    useEffect(() => {
        const fetchMuralConfig = async () => {
            const docRef = doc(db, 'app_config', 'mural');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setMessages(prev => ({ ...prev, ...docSnap.data() }));
            } else {
                // Defaults
                setMessages({
                    successMessage: '¡Felicidades! Has aprobado tu examen teórico. Estás un paso más cerca de tu promoción.',
                    motivationalMessage: 'El aprendizaje es un proceso constante. Te invitamos a repasar y prepararte para tu siguiente intento. ¡Confiamos en ti!'
                });
            }
            setLoadingConfig(false);
        };
        fetchMuralConfig();
    }, []);

    // ── Lógica de Autocompletado del Formulario (M) ──
    const [searchingM, setSearchingM] = useState(false);

    const fetchEmployeeData = async () => {
        const eid = manualData.employeeId?.trim();
        if (!eid) return;

        setSearchingM(true);
        try {
            // 1. Buscar en training_records (donde el usuario indicó que está el nombre y puesto real)
            const trainingQuery = query(collection(db, 'training_records'), where('employeeId', '==', eid), limit(1));
            const trainingSnap = await getDocs(trainingQuery);

            let foundName = '';
            let foundPosition = '';

            if (!trainingSnap.empty) {
                const data = trainingSnap.docs[0].data();
                foundName = data.name || '';
                foundPosition = data.position || '';
            } else {
                // Fallback: Buscar en employees
                const empQuery = query(collection(db, 'employees'), where('employeeId', '==', eid), limit(1));
                const empSnap = await getDocs(empQuery);
                if (!empSnap.empty) {
                    const eData = empSnap.docs[0].data();
                    foundName = eData.name || '';
                    foundPosition = eData.puesto || '';
                }
            }

            if (!foundName && !foundPosition) {
                toast.warning("No se encontró al empleado con ese ID en los registros.");
                setSearchingM(false);
                return;
            }

            // 2. Buscar en promotion_rules para saber hacia dónve va y cuánto score requiere
            let promoDest = '';
            let reqScore = '';

            if (foundPosition) {
                const rulesQuery = query(collection(db, 'promotion_rules'), where('currentPosition', '==', foundPosition), limit(1));
                const rulesSnap = await getDocs(rulesQuery);

                if (!rulesSnap.empty) {
                    const ruleData = rulesSnap.docs[0].data();
                    promoDest = ruleData.promotionTo || '';
                    reqScore = ruleData.examMinScore || 80;
                }
            }

            setManualData(prev => ({
                ...prev,
                firstName: extractFirstName(foundName), // Solo el nombre real extraído
                currentPosition: foundPosition,
                promotionTo: promoDest,
                requiredScore: reqScore
            }));

        } catch (error) {
            console.error("Error buscando datos del empleado:", error);
            toast.error("Hubo un problema consultando la base de datos.");
        } finally {
            setSearchingM(false);
        }
    };

    // Guardar mensajes
    const saveMessages = async () => {
        try {
            await setDoc(doc(db, 'app_config', 'mural'), messages, { merge: true });
            toast.success("Mensajes actualizados correctamente");
        } catch (error) {
            console.error("Error saving mural config:", error);
            toast.error("No se pudieron guardar los mensajes");
        }
    };

    // Script de Sincronización Segura
    const handleSyncMural = async () => {
        if (!confirm("Esto extraerá las calificaciones más recientes de todos los empleados y las hará públicas en el Mural (búsqueda por número de empleado). ¿Proceder?")) return;

        setSyncing(true);
        try {
            // 1. Obtener Reglas de Promoción para saber a dónde va y cuánto necesita
            const rulesSnapshot = await getDocs(collection(db, 'promotion_rules'));
            const rulesMap = {};
            rulesSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.currentPosition) {
                    rulesMap[data.currentPosition.toLowerCase().trim()] = data;
                }
            });

            // 2. Obtener Empleados
            const empSnapshot = await getDocs(collection(db, 'employees'));
            let syncedCount = 0;

            // 3. Procesar e inyectar en mural_exams separando la DB
            for (const docSnap of empSnapshot.docs) {
                const emp = docSnap.data();
                const examAttempts = emp.promotionData?.examAttempts || [];

                if (examAttempts.length > 0 && emp.employeeId) {
                    const lastExam = examAttempts[examAttempts.length - 1];

                    // Buscar regla aplicable para el puesto actual del empleado
                    const empPosition = emp.puesto?.toLowerCase().trim() || '';
                    const appliedRule = rulesMap[empPosition];

                    let isApproved = lastExam.passed || false;
                    let requiredScore = 80; // default
                    let promotionDest = 'Siguiente Nivel';

                    if (appliedRule) {
                        requiredScore = appliedRule.examMinScore || 80;
                        promotionDest = appliedRule.promotionTo || 'Siguiente Nivel';

                        // Recalcular status basado strictamente en la regla (por si pasaron con 80 pero la regla pedia 90)
                        isApproved = (lastExam.score >= requiredScore);
                    }

                    const safeData = {
                        employeeId: emp.employeeId,
                        firstName: extractFirstName(emp.name) || 'Colaborador',
                        fullName: emp.name || '',
                        currentPosition: emp.puesto || 'Sin Puesto',
                        promotionTo: promotionDest,
                        passed: isApproved,
                        score: lastExam.score || 0,
                        requiredScore: requiredScore,
                        date: lastExam.date || new Date().toISOString().split('T')[0],
                        active: true,
                        timestamp: new Date()
                    };

                    await setDoc(doc(db, 'mural_exams', emp.employeeId.toString()), safeData);
                    syncedCount++;
                }
            }

            toast.success(`Sincronización Completa. ${syncedCount} empleados actualizados en el Mural.`);
        } catch (error) {
            console.error(error);
            toast.error("Error durante la sincronización.");
        } finally {
            setSyncing(false);
        }
    };

    // Guardar Manualmente Examen en Mural
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        try {
            const scoreNum = Number(manualData.score);
            const reqScoreNum = Number(manualData.requiredScore);
            const isApproved = scoreNum >= reqScoreNum;

            const safeData = {
                employeeId: manualData.employeeId,
                firstName: manualData.firstName,
                currentPosition: manualData.currentPosition,
                promotionTo: manualData.promotionTo,
                passed: isApproved,
                score: scoreNum,
                requiredScore: reqScoreNum,
                date: new Date().toISOString().split('T')[0],
                active: true,
                timestamp: new Date()
            };

            await setDoc(doc(db, 'mural_exams', manualData.employeeId.toString()), safeData);
            toast.success("¡Examen guardado exitosamente en el Mural!");
            setManualData({ employeeId: '', firstName: '', currentPosition: '', promotionTo: '', score: '', requiredScore: '' });
            setShowManualForm(false);
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar examen manual.");
        }
    };

    if (loadingConfig) return null;

    return (
        <div className={styles.card} style={{ marginTop: '20px' }}>
            <h3 className={styles.cardTitle}>
                <Presentation className={styles.cardIcon} />
                Gestión del Mural de Reconocimiento
            </h3>

            <div style={{ padding: '10px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Configura los mensajes que verán los usuarios al buscar su calificación y mantén sincronizada su base pública para proteger la privacidad del empleado.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '10px' }}>

                {/* Inputs de Configuración */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Mensaje para APROBADOS</label>
                    <textarea
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', minHeight: '60px', resize: 'vertical' }}
                        value={messages.successMessage}
                        onChange={(e) => setMessages(m => ({ ...m, successMessage: e.target.value }))}
                        placeholder="Usa [Nombre] para incluir el nombre del empleado..."
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Mensaje para REPROBADOS (Motivacional)</label>
                    <textarea
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', minHeight: '60px', resize: 'vertical' }}
                        value={messages.motivationalMessage}
                        onChange={(e) => setMessages(m => ({ ...m, motivationalMessage: e.target.value }))}
                        placeholder="Usa [Nombre] para incluir el nombre del empleado..."
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '5px' }}>
                    <button
                        onClick={saveMessages}
                        style={{ padding: '8px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}
                    >
                        <Save size={16} /> Guardar Mensajes
                    </button>

                    <button
                        onClick={handleSyncMural}
                        disabled={syncing}
                        style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: syncing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                    >
                        <RefreshCcw size={16} className={syncing ? 'spinner' : ''} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                        {syncing ? '...' : 'Auto-Sincronizar Panel Exámenes'}
                    </button>

                    <button
                        onClick={() => setShowManualForm(!showManualForm)}
                        style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                    >
                        + Captura Manual Nuevo
                    </button>
                </div>

                {/* ---------- FORMULARIO MANUAL ---------- */}
                {showManualForm && (
                    <form onSubmit={handleManualSubmit} style={{ marginTop: '1rem', padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
                        <h4 style={{ gridColumn: 'span 2', margin: '0 0 10px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BookOpen size={18} /> Registro Manual en Mural Público
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No. Empleado (Ej. 2950)*</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input required type="text" value={manualData.employeeId} onChange={e => setManualData({ ...manualData, employeeId: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} placeholder="Digita el ID" />
                                <button type="button" onClick={fetchEmployeeData} disabled={!manualData.employeeId || searchingM} style={{ padding: '0 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: (!manualData.employeeId || searchingM) ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }} title="Autorrellenar Info">
                                    {searchingM ? '...' : '🔍'}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Primer Nombre (Público)*</label>
                            <input required type="text" value={manualData.firstName} onChange={e => setManualData({ ...manualData, firstName: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Puesto Actual*</label>
                            <input required type="text" value={manualData.currentPosition} onChange={e => setManualData({ ...manualData, currentPosition: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Aplica Para (Puesto Objetivo)*</label>
                            <input required type="text" value={manualData.promotionTo} onChange={e => setManualData({ ...manualData, promotionTo: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Calificación Alcanzada (%)*</label>
                            <input required type="number" min="0" max="100" value={manualData.score} onChange={e => setManualData({ ...manualData, score: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} placeholder="Ej. 100" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Calificación Requerida (%)*</label>
                            <input required type="number" min="0" max="100" value={manualData.requiredScore} onChange={e => setManualData({ ...manualData, requiredScore: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} placeholder="Ej. 85" />
                        </div>

                        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button type="button" onClick={() => setShowManualForm(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer' }}>
                                Cancelar
                            </button>
                            <button type="submit" style={{ padding: '8px 16px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
                                Guardar y Publicar
                            </button>
                        </div>
                    </form>
                )}

            </div>
        </div>
    );
}


// ── Iconos/colores por tipo de acción ──
const ACTION_META = {
    create: { label: 'Creó', color: '#22c55e', icon: BookOpen },
    import: { label: 'Importó', color: '#3b82f6', icon: UploadCloud },
    delete: { label: 'Eliminó', color: '#ef4444', icon: Trash2 },
    publish: { label: 'Publicó', color: '#f59e0b', icon: Eye },
    unpublish: { label: 'Archivó', color: '#6b7280', icon: EyeOff },
    rename: { label: 'Renombró', color: '#a855f7', icon: FileEdit },
    update: { label: 'Editó', color: '#0ea5e9', icon: RefreshCw },
};

function InduccionAuditSection() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'audit_logs'),
            where('module', '==', 'induccion'),
            orderBy('timestamp', 'desc'),
            limit(30)
        );
        const unsub = onSnapshot(q, (snap) => {
            setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const formatTime = (ts) => {
        if (!ts) return '—';
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return date.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={styles.card}>
            <h3 className={styles.cardTitle}>
                <BookOpen className={styles.cardIcon} style={{ width: 18, height: 18 }} />
                Actividad en Inducción
            </h3>

            {loading ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', padding: '1rem 0' }}>Cargando historial...</p>
            ) : logs.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', padding: '1rem 0' }}>No hay actividad registrada aún.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {logs.map(log => {
                        const meta = ACTION_META[log.action] || { label: log.action, color: 'var(--text-tertiary)', icon: RefreshCw };
                        const Icon = meta.icon;
                        return (
                            <li key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                                <span style={{ marginTop: 2, color: meta.color, flexShrink: 0 }}>
                                    <Icon size={14} />
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                        <strong style={{ color: meta.color }}>{meta.label}</strong>
                                        {' '}
                                        <span style={{ fontWeight: 600 }}>{log.userName}</span>
                                        {' — '}
                                        <span style={{ color: 'var(--text-secondary)' }}>{log.target}</span>
                                    </p>
                                    {log.detail && (
                                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{log.detail}</p>
                                    )}
                                </div>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                    {formatTime(log.timestamp)}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
