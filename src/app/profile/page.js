'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

import styles from './page.module.css';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import {
    Eye, EyeOff, RefreshCw, Calendar, User2, User, Shield, BookOpen
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast/Toast';
import { Badge } from '@/components/ui/Badge/Badge';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { Select } from '@/components/ui/Select/Select';

// ── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_BADGE_VARIANT = {
    super_admin: 'danger', SUPER_ADMIN: 'danger',
    admin: 'secondary',   ADMIN: 'secondary',
};

const ADMIN_ROLES   = ['admin', 'superadmin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'];
const AUDITOR_ROLES = ['super_admin', 'SUPER_ADMIN'];

// ── Componente principal ──────────────────────────────────────────────────────

export default function ProfilePage() {
    const { user, loading, updateUserProfile } = useAuth();
    const router = useRouter();

    const [avatarSeed, setAvatarSeed]   = useState('');
    const [isRevealed, setIsRevealed]   = useState(false);
    const [activeTab,  setActiveTab]    = useState('perfil');

    // Redirect instructores
    useEffect(() => {
        if (!user) return;
        const rol = user.rol?.toLowerCase();
        if (rol === 'instructor') { router.push('/induccion'); return; }
        setAvatarSeed(user.avatarSeed || user.email);
    }, [user, router]);

    // Redirect si no autenticado
    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    const avatarSvg = useMemo(() =>
        createAvatar(lorelei, {
            seed: avatarSeed || 'placeholder',
            size: 120,
            backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9'],
        }).toString(),
    [avatarSeed]);

    const handleRandomizeAvatar = async () => {
        const newSeed = Math.random().toString(36).substring(7);
        setAvatarSeed(newSeed);
        if (user?.uid) await updateUserProfile(user.uid, { avatarSeed: newSeed });
    };

    // ── Loading skeleton ──────────────────────────────────────────────────────
    if (loading || !user) {
        return (
            <AdminLayout title="Perfil de Usuario">
                <div className={styles.container}>
                    <div className={styles.heroCard}>
                        <Skeleton variant="rectangular" height={130} className={styles.bannerSkeleton} />
                        <div className={styles.heroBody} style={{ marginTop: 0 }}>
                            <Skeleton variant="circular" width={96} height={96} style={{ marginTop: '-48px', border: '4px solid var(--card-background)', flexShrink: 0 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: 20 }}>
                                <Skeleton variant="text" width={220} height={32} />
                                <Skeleton variant="text" width={180} height={18} />
                                <Skeleton variant="text" width={90} height={22} />
                            </div>
                        </div>
                    </div>
                    <Skeleton variant="rectangular" height={52} style={{ borderRadius: '20px' }} />
                    <Skeleton variant="rectangular" height={180} style={{ borderRadius: '20px' }} />
                </div>
            </AdminLayout>
        );
    }

    // ── Datos derivados ───────────────────────────────────────────────────────
    const roleBadgeVariant = ROLE_BADGE_VARIANT[user?.rol] ?? 'info';
    const isAdmin   = ADMIN_ROLES.includes(user?.rol);
    const isAuditor = AUDITOR_ROLES.includes(user?.rol);

    const detailRows = [
        { icon: <Calendar size={16} />, label: 'Fecha Ingreso', value: user?.fechaIngreso  || 'No definida'  },
        { icon: <User2     size={16} />, label: 'Género',        value: user?.genero        || 'No definido' },
    ];

    // ── Tabs declarativas ─────────────────────────────────────────────────────
    const profileTabs = [
        {
            value: 'perfil', label: 'Mi Perfil', icon: <User size={15} />,
            content: (
                <div className={styles.detailsCard}>
                    <h3 className={styles.detailsTitle}>Detalles del Perfil</h3>
                    <div className={styles.detailsContent}>
                        {detailRows.map(({ icon, label, value }) => (
                            <div key={label} className={styles.detailRow}>
                                <span className={styles.detailIcon}>{icon}</span>
                                <span className={styles.detailLabel}>{label}</span>
                                <span className={styles.detailValue}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ),
        },
        ...(isAdmin ? [{
            value: 'administracion', label: 'Administración', icon: <Shield size={15} />,
            content: (
                <div className={styles.tabSection}>
                    <AdminSection />
                    <AdminMuralSection />
                </div>
            ),
        }] : []),
        ...(isAuditor ? [{
            value: 'auditoria', label: 'Auditoría', icon: <BookOpen size={15} />,
            content: (
                <div className={styles.tabSection}>
                    <InduccionAuditSection />
                </div>
            ),
        }] : []),
    ];

    const visibleTab = profileTabs.find(t => t.value === activeTab) ?? profileTabs[0];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <AdminLayout title="Perfil de Usuario">
            <main className={styles.container} id="main-content">

                {/* ── Hero Card ── */}
                <div className={styles.heroCard}>
                    <div className={styles.heroBanner} aria-hidden="true" />

                    <div className={styles.heroBody}>
                        {/* Avatar */}
                        <div className={styles.avatarWrapper}>
                            <div
                                className={styles.avatar}
                                dangerouslySetInnerHTML={{ __html: avatarSvg }}
                                role="img"
                                aria-label={`Avatar de ${user.name || user.displayName || 'Usuario'}`}
                            />
                            <button
                                onClick={handleRandomizeAvatar}
                                className={styles.changeAvatarBtn}
                                aria-label="Cambiar avatar aleatorio"
                                title="Cambiar Avatar"
                            >
                                <RefreshCw size={14} />
                            </button>
                            <div className={styles.statusIndicator} role="status" aria-label="Estado: Activo" title="Activo" />
                        </div>

                        {/* Contenido textual */}
                        <div className={styles.heroContent}>
                            {(user.puesto || user.departamento) && (
                                <p className={styles.heroMeta}>
                                    {user.puesto && <span>{user.puesto}</span>}
                                    {user.puesto && user.departamento && <span className={styles.heroMetaDot} />}
                                    {user.departamento && <span>{user.departamento}</span>}
                                </p>
                            )}

                            <h1 className={styles.heroName}>
                                {user.name || user.displayName || 'Usuario'}
                            </h1>

                            {/* Email pill con blur/reveal */}
                            <div
                                className={styles.emailPill}
                                onClick={() => setIsRevealed(v => !v)}
                                role="button"
                                tabIndex={0}
                                aria-pressed={isRevealed}
                                title={isRevealed ? 'Click para ocultar email' : 'Click para revelar email'}
                                onKeyDown={(e) => e.key === 'Enter' && setIsRevealed(v => !v)}
                            >
                                <span className={styles.revealIcon} aria-hidden="true">
                                    {isRevealed ? <Eye size={14} /> : <EyeOff size={14} />}
                                </span>
                                <span className={`${styles.emailText} ${isRevealed ? styles.noBlur : styles.blur}`}>
                                    {user.email || 'correo@ejemplo.com'}
                                </span>
                            </div>

                            <div className={styles.badgeContainer}>
                                <Badge variant={roleBadgeVariant} size="md" dot>
                                    {user.rol || 'Empleado'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Tab Navigation ── */}
                <nav className={styles.tabNav} role="tablist" aria-label="Secciones del perfil">
                    {profileTabs.map(tab => (
                        <button
                            key={tab.value}
                            role="tab"
                            aria-selected={activeTab === tab.value}
                            aria-controls={`tabpanel-${tab.value}`}
                            className={`${styles.tabBtn} ${activeTab === tab.value ? styles.tabBtnActive : ''}`}
                            onClick={() => setActiveTab(tab.value)}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* ── Tab Content ── */}
                <div
                    id={`tabpanel-${visibleTab.value}`}
                    role="tabpanel"
                    className={styles.tabContent}
                >
                    {visibleTab.content}
                </div>

            </main>
        </AdminLayout>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTES (lógica de negocio intacta, solo estilos actualizados)
// ══════════════════════════════════════════════════════════════════════════════
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertTriangle, Trash2, UploadCloud, FileEdit, ChevronDown, ChevronUp } from 'lucide-react';

// ── ADMIN SECTION ─────────────────────────────────────────────────────────────
function AdminSection() {
    const { toast } = useToast();
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [duration, setDuration]           = useState(2);
    const [loading, setLoading]             = useState(true);
    const [isOpen, setIsOpen]               = useState(false);

    useEffect(() => {
        const configRef = doc(db, 'app_config', 'general');
        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                setIsMaintenance(docSnap.data().maintenanceMode || false);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const toggleMaintenance = async () => {
        const newState = !isMaintenance;
        setIsMaintenance(newState);
        try {
            const updateData = {
                maintenanceMode: newState,
                maintenanceMessage: 'Estamos realizando mejoras en la plataforma. Volveremos pronto.',
            };
            if (newState) {
                const endDate = new Date();
                endDate.setHours(endDate.getHours() + parseInt(duration));
                updateData.maintenanceUntil = endDate.toISOString();
            } else {
                updateData.maintenanceUntil = null;
            }
            await setDoc(doc(db, 'app_config', 'general'), updateData, { merge: true });
        } catch (error) {
            console.error('Error updating maintenance mode:', error);
            setIsMaintenance(!newState);
            toast.error('Error al actualizar el modo mantenimiento');
        }
    };

    if (loading) return null;

    return (
        <div className={`${styles.accordionPanel} ${isMaintenance ? styles.accordionPanelDanger : ''}`}>
            {/* Header */}
            <div
                className={`${styles.accordionHeader} ${isOpen ? styles.accordionHeaderOpen : ''} ${isMaintenance ? styles.accordionHeaderDanger : ''}`}
                onClick={() => setIsOpen(v => !v)}
                role="button"
                aria-expanded={isOpen}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setIsOpen(v => !v)}
            >
                <h3 className={`${styles.accordionTitle} ${isMaintenance ? styles.accordionTitleDanger : ''}`}>
                    <span className={`${styles.accordionIcon} ${isMaintenance ? styles.accordionIconDanger : ''}`}>
                        <Shield size={18} />
                    </span>
                    Administración del Sistema
                </h3>
                <ChevronDown
                    size={20}
                    className={`${styles.accordionChevron} ${isOpen ? styles.accordionChevronOpen : ''}`}
                />
            </div>

            {/* Body */}
            {isOpen && (
                <div className={styles.accordionBody}>
                    <div className={styles.maintenanceBox}>
                        <div className={styles.maintenanceRow}>
                            <div className={styles.maintenanceInfo}>
                                <div className={`${styles.maintenanceIcoWrap} ${isMaintenance ? styles.maintenanceIcoWrapOn : styles.maintenanceIcoWrapOff}`}>
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <p className={styles.maintenanceLabel}>Modo Mantenimiento</p>
                                    <p className={styles.maintenanceSub}>
                                        {isMaintenance
                                            ? 'La plataforma está bloqueada para usuarios.'
                                            : 'La plataforma está accesible para todos.'
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Toggle visual */}
                            <label className={styles.toggleWrap} title={isMaintenance ? 'Desactivar mantenimiento' : 'Activar mantenimiento'}>
                                <input
                                    type="checkbox"
                                    className={styles.toggleInput}
                                    checked={isMaintenance}
                                    onChange={toggleMaintenance}
                                    aria-label="Modo mantenimiento"
                                />
                                <span className={`${styles.toggleTrack} ${isMaintenance ? styles.toggleTrackOn : styles.toggleTrackOff}`}>
                                    <span className={styles.toggleThumb} style={{ left: isMaintenance ? '24px' : '3px' }} />
                                </span>
                            </label>
                        </div>

                        {!isMaintenance && (
                            <div className={styles.maintenanceDurationRow}>
                                <span className={styles.maintenanceDurationLabel}>Duración estimada:</span>
                                <Select
                                    value={String(duration)}
                                    onChange={(value) => setDuration(value)}
                                    options={[1, 2, 4, 8, 12, 24, 48, 72].map(h => ({ value: String(h), label: `${h} ${h === 1 ? 'hora' : 'horas'}` }))}
                                    className={styles.maintenanceDurationSelect}
                                />
                            </div>
                        )}
                    </div>

                    {isMaintenance && (
                        <div className={styles.maintenanceWarning}>
                            <AlertTriangle size={14} />
                            <span>Tú sigues teniendo acceso total por ser Administrador.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── ADMIN MURAL SECTION ───────────────────────────────────────────────────────
import { Presentation, Save, RefreshCcw, Download, Pencil, Check, X as CancelIcon } from 'lucide-react';
import { deleteDoc } from 'firebase/firestore';
import QRCode from 'qrcode';

const extractFirstName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 3) return parts.slice(2).join(' ');
    if (parts.length === 2) return parts[1];
    return parts[0];
};

function AdminMuralSection() {
    const { toast } = useToast();
    const [syncing,         setSyncing]         = useState(false);
    const [loadingConfig,   setLoadingConfig]   = useState(true);
    const [showManualForm,  setShowManualForm]  = useState(false);
    const [muralList,       setMuralList]       = useState([]);
    const [editingMuralId,  setEditingMuralId]  = useState(null);
    const [editData,        setEditData]        = useState({});
    const [isOpen,          setIsOpen]          = useState(false);
    const [searchingM,      setSearchingM]      = useState(false);
    const [availableThemes, setAvailableThemes] = useState([]);

    const [manualData, setManualData] = useState({
        employeeId: '', firstName: '', currentPosition: '',
        promotionTo: '', score: '', requiredScore: '', recommendations: [],
    });

    const [messages, setMessages] = useState({
        successMessage: '', motivationalMessage: '',
    });

    useEffect(() => {
        // Configuración de mensajes
        const fetchMuralConfig = async () => {
            const docSnap = await getDoc(doc(db, 'app_config', 'mural'));
            if (docSnap.exists()) {
                setMessages(prev => ({ ...prev, ...docSnap.data() }));
            } else {
                setMessages({
                    successMessage: '¡Felicidades! Has aprobado tu examen teórico. Estás un paso más cerca de tu promoción.',
                    motivationalMessage: 'El aprendizaje es un proceso constante. Te invitamos a repasar y prepararte para tu siguiente intento. ¡Confiamos en ti!',
                });
            }
            setLoadingConfig(false);
        };
        fetchMuralConfig();

        // Listener de mural_exams
        const unsubMural = onSnapshot(collection(db, 'mural_exams'), (snap) => {
            const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            arr.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
            setMuralList(arr);
        });

        // Temas de examen
        const fetchThemes = async () => {
            try {
                const qSnap = await getDocs(collection(db, 'exam_questions'));
                const themes = new Set();
                qSnap.forEach(d => { const t = d.data().theme; if (t) themes.add(t.trim().toUpperCase()); });
                setAvailableThemes(Array.from(themes).sort());
            } catch (err) { console.error('Error fetching themes', err); }
        };
        fetchThemes();

        return () => unsubMural();
    }, []);

    // Autocompletado por ID de empleado
    const fetchEmployeeData = async () => {
        const eid = manualData.employeeId?.trim();
        if (!eid) return;
        setSearchingM(true);
        try {
            const trainingQuery = query(collection(db, 'training_records'), where('employeeId', '==', eid), limit(1));
            const trainingSnap  = await getDocs(trainingQuery);
            let foundName = '', foundPosition = '';

            if (!trainingSnap.empty) {
                const data = trainingSnap.docs[0].data();
                foundName = data.name || '';
                foundPosition = data.position || '';
            } else {
                const empSnap = await getDocs(query(collection(db, 'employees'), where('employeeId', '==', eid), limit(1)));
                if (!empSnap.empty) {
                    const eData = empSnap.docs[0].data();
                    foundName = eData.name || '';
                    foundPosition = eData.puesto || '';
                }
            }

            if (!foundName && !foundPosition) {
                toast.warning('No se encontró al empleado con ese ID en los registros.');
                return;
            }

            let promoDest = '', reqScore = '';
            if (foundPosition) {
                const rulesSnap = await getDocs(query(collection(db, 'promotion_rules'), where('currentPosition', '==', foundPosition), limit(1)));
                if (!rulesSnap.empty) {
                    const rule = rulesSnap.docs[0].data();
                    promoDest = rule.promotionTo || '';
                    reqScore  = rule.examMinScore || 80;
                }
            }
            setManualData(prev => ({
                ...prev,
                firstName:       extractFirstName(foundName),
                currentPosition: foundPosition,
                promotionTo:     promoDest,
                requiredScore:   reqScore,
            }));
        } catch (error) {
            console.error('Error buscando datos del empleado:', error);
            toast.error('Hubo un problema consultando la base de datos.');
        } finally {
            setSearchingM(false);
        }
    };

    const saveMessages = async () => {
        try {
            await setDoc(doc(db, 'app_config', 'mural'), messages, { merge: true });
            toast.success('Mensajes actualizados correctamente');
        } catch {
            toast.error('No se pudieron guardar los mensajes');
        }
    };

    const handleSyncMural = async () => {
        if (!confirm('Esto extraerá las calificaciones más recientes de todos los empleados y las hará públicas en el Mural. ¿Proceder?')) return;
        setSyncing(true);
        try {
            const rulesSnapshot = await getDocs(collection(db, 'promotion_rules'));
            const rulesMap = {};
            rulesSnapshot.docs.forEach(d => {
                const data = d.data();
                if (data.currentPosition) rulesMap[data.currentPosition.toLowerCase().trim()] = data;
            });

            const empSnapshot = await getDocs(collection(db, 'employees'));
            let syncedCount = 0;

            for (const docSnap of empSnapshot.docs) {
                const emp = docSnap.data();
                const examAttempts = emp.promotionData?.examAttempts || [];
                if (examAttempts.length > 0 && emp.employeeId) {
                    const lastExam    = examAttempts[examAttempts.length - 1];
                    const empPos      = emp.puesto?.toLowerCase().trim() || '';
                    const appliedRule = rulesMap[empPos];
                    let isApproved    = lastExam.passed || false;
                    let requiredScore = 80;
                    let promotionDest = 'Siguiente Nivel';

                    if (appliedRule) {
                        requiredScore = appliedRule.examMinScore || 80;
                        promotionDest = appliedRule.promotionTo  || 'Siguiente Nivel';
                        isApproved    = lastExam.score >= requiredScore;
                    }

                    await setDoc(doc(db, 'mural_exams', emp.employeeId.toString()), {
                        employeeId:      emp.employeeId,
                        firstName:       extractFirstName(emp.name) || 'Colaborador',
                        fullName:        emp.name || '',
                        currentPosition: emp.puesto || 'Sin Puesto',
                        promotionTo:     promotionDest,
                        passed:          isApproved,
                        score:           lastExam.score || 0,
                        requiredScore,
                        date:            lastExam.date || new Date().toISOString().split('T')[0],
                        active:          true,
                        timestamp:       new Date(),
                    });
                    syncedCount++;
                }
            }
            toast.success(`Sincronización Completa. ${syncedCount} empleados actualizados en el Mural.`);
        } catch (error) {
            console.error(error);
            toast.error('Error durante la sincronización.');
        } finally {
            setSyncing(false);
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        try {
            const scoreNum    = Number(manualData.score);
            const reqScoreNum = Number(manualData.requiredScore);
            await setDoc(doc(db, 'mural_exams', manualData.employeeId.toString()), {
                employeeId:      manualData.employeeId,
                firstName:       manualData.firstName,
                currentPosition: manualData.currentPosition,
                promotionTo:     manualData.promotionTo,
                passed:          scoreNum >= reqScoreNum,
                score:           scoreNum,
                requiredScore:   reqScoreNum,
                recommendations: Array.isArray(manualData.recommendations) ? manualData.recommendations : [],
                date:            new Date().toISOString().split('T')[0],
                active:          true,
                timestamp:       new Date(),
            });
            toast.success('¡Examen guardado exitosamente en el Mural!');
            setManualData({ employeeId: '', firstName: '', currentPosition: '', promotionTo: '', score: '', requiredScore: '', recommendations: [] });
            setShowManualForm(false);
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar examen manual.');
        }
    };

    const handleEditClick   = (mural) => {
        setEditingMuralId(mural.id);
        const recs = Array.isArray(mural.recommendations)
            ? mural.recommendations
            : (typeof mural.recommendations === 'string' && mural.recommendations ? [mural.recommendations] : []);
        setEditData({ ...mural, recommendations: recs });
    };
    const handleCancelEdit  = () => { setEditingMuralId(null); setEditData({}); };
    const handleSaveEdit    = async () => {
        try {
            const scoreNum = Number(editData.score);
            const reqNum   = Number(editData.requiredScore);
            const safeData = { ...editData, score: scoreNum, requiredScore: reqNum, passed: scoreNum >= reqNum };
            delete safeData.id;
            await setDoc(doc(db, 'mural_exams', editingMuralId), safeData, { merge: true });
            toast.success('Registro actualizado correctamente.');
            setEditingMuralId(null);
        } catch {
            toast.error('No se pudo actualizar el registro.');
        }
    };
    const handleDeleteMural = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este registro público del Mural?')) return;
        try {
            await deleteDoc(doc(db, 'mural_exams', id));
            toast.success('Registro eliminado.');
        } catch {
            toast.error('No se pudo eliminar.');
        }
    };

    const handleGenerateQR = async (emp) => {
        try {
            const { jsPDF } = await import('jspdf');
            const targetUrl = 'https://vertxk.xyz/mural';
            const qrDataUrl = await QRCode.toDataURL(targetUrl, { width: 600, margin: 0, color: { dark: '#1e1e1e', light: '#FFFFFF' } });
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
            const W = pdf.internal.pageSize.getWidth();
            const H = pdf.internal.pageSize.getHeight();
            const CX = W / 2;
            const C  = { black: [30,30,30], orange: [204,73,22], gray: [110,110,110], lightGray: [210,210,210], white: [255,255,255] };
            pdf.setDrawColor(...C.black); pdf.setLineWidth(0.5); pdf.rect(12, 12, W - 24, H - 24);
            const badgeW = 58, badgeH = 8, badgeX = CX - badgeW / 2, badgeY = 23;
            pdf.setLineWidth(0.25); pdf.roundedRect(badgeX, badgeY, badgeW, badgeH, 4, 4, 'S');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(...C.black);
            pdf.text('A V I S O   I M P O R T A N T E', CX, badgeY + 5.2, { align: 'center' });
            pdf.setFont('times', 'bold'); pdf.setFontSize(34); pdf.setTextColor(...C.black);
            pdf.text('¿Realizaste la', CX, 50, { align: 'center' });
            pdf.text('evaluación de', CX, 63, { align: 'center' });
            pdf.setFont('times', 'bolditalic'); pdf.setTextColor(...C.orange);
            pdf.text('conocimientos?', CX, 77, { align: 'center' });
            pdf.setDrawColor(...C.black); pdf.setLineWidth(1.2); pdf.line(CX - 10, 84, CX + 10, 84);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...C.gray);
            pdf.text('L O S   R E S U L T A D O S   E S T Á N   L I S T O S', CX, 94, { align: 'center' });
            const QR_SIZE=90, QR_PAD=5, QR_IMG_X=CX-QR_SIZE/2, QR_IMG_Y=105;
            const FRAME_X=QR_IMG_X-QR_PAD, FRAME_Y=QR_IMG_Y-QR_PAD, FRAME_W=QR_SIZE+QR_PAD*2, FRAME_H=QR_SIZE+QR_PAD*2;
            pdf.setDrawColor(...C.black); pdf.setLineWidth(0.3); pdf.roundedRect(FRAME_X, FRAME_Y, FRAME_W, FRAME_H, 1.5, 1.5, 'S');
            pdf.addImage(qrDataUrl, 'PNG', QR_IMG_X, QR_IMG_Y, QR_SIZE, QR_SIZE);
            const ARM=7, OX=FRAME_X-1, OY=FRAME_Y-1, OW=FRAME_W+2, OH=FRAME_H+2;
            pdf.setDrawColor(...C.orange); pdf.setLineWidth(1.8);
            pdf.line(OX, OY, OX+ARM, OY); pdf.line(OX, OY, OX, OY+ARM);
            pdf.line(OX+OW, OY, OX+OW-ARM, OY); pdf.line(OX+OW, OY, OX+OW, OY+ARM);
            pdf.line(OX, OY+OH, OX+ARM, OY+OH); pdf.line(OX, OY+OH, OX, OY+OH-ARM);
            pdf.line(OX+OW, OY+OH, OX+OW-ARM, OY+OH); pdf.line(OX+OW, OY+OH, OX+OW, OY+OH-ARM);
            const URL_Y=FRAME_Y+FRAME_H+12;
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13);
            const wBlack=pdf.getTextWidth('vertxk.xyz'), wOrange=pdf.getTextWidth('/mural');
            const urlStartX=CX-(wBlack+wOrange)/2;
            pdf.setTextColor(...C.black); pdf.text('vertxk.xyz', urlStartX, URL_Y);
            pdf.setTextColor(...C.orange); pdf.text('/mural', urlStartX+wBlack, URL_Y);
            pdf.setFont('helvetica', 'italic'); pdf.setFontSize(7.5); pdf.setTextColor(...C.gray);
            pdf.text('Si no puedes escanear, ingresa la dirección en tu navegador', CX, URL_Y+6, { align: 'center' });
            pdf.setDrawColor(...C.lightGray); pdf.setLineWidth(0.25); pdf.line(22, URL_Y+13, W-22, URL_Y+13);
            const SCAN_Y=URL_Y+21;
            pdf.setFont('helvetica','bold'); pdf.setFontSize(10); pdf.setTextColor(...C.black);
            pdf.text('E S C A N E A   E L   C Ó D I G O   Q R', CX, SCAN_Y, { align: 'center' });
            pdf.setFont('helvetica','italic'); pdf.setFontSize(8.5); pdf.setTextColor(...C.gray);
            pdf.text('Usa la cámara de tu celular para acceder', CX, SCAN_Y+6, { align: 'center' });
            const STEP_Y=SCAN_Y+18;
            const steps=[{num:'1',l1:'Escanea el',l2:'código QR'},{num:'2',l1:'Ingresa tu no.',l2:'de empleado'},{num:'3',l1:'Consulta tus',l2:'resultados'}];
            [CX-60, CX, CX+60].forEach((sx, i) => {
                pdf.setFillColor(...C.black); pdf.circle(sx, STEP_Y, 4, 'F');
                pdf.setTextColor(...C.white); pdf.setFont('helvetica','bold'); pdf.setFontSize(8);
                pdf.text(steps[i].num, sx, STEP_Y+1.2, { align: 'center' });
                pdf.setTextColor(...C.black); pdf.setFont('helvetica','normal'); pdf.setFontSize(8);
                pdf.text(steps[i].l1, sx, STEP_Y+9,  { align: 'center' });
                pdf.text(steps[i].l2, sx, STEP_Y+14, { align: 'center' });
            });
            pdf.save(`QR_Poster_${(emp.fullName || String(emp.employeeId)).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
            toast.success('PDF generado exitosamente');
        } catch (error) {
            console.error(error);
            toast.error('Error al generar el PDF');
        }
    };

    // Toggle recomendación en lista
    const toggleRec = (list, setFn, theme) =>
        setFn(prev => ({
            ...prev,
            recommendations: list.includes(theme)
                ? list.filter(t => t !== theme)
                : [...list, theme],
        }));

    if (loadingConfig) return null;

    return (
        <div className={styles.accordionPanel}>
            {/* Header */}
            <div
                className={`${styles.accordionHeader} ${isOpen ? styles.accordionHeaderOpen : ''}`}
                onClick={() => setIsOpen(v => !v)}
                role="button"
                aria-expanded={isOpen}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setIsOpen(v => !v)}
            >
                <h3 className={styles.accordionTitle}>
                    <span className={styles.accordionIcon}><Presentation size={18} /></span>
                    Gestión del Mural de Reconocimiento
                </h3>
                <ChevronDown size={20} className={`${styles.accordionChevron} ${isOpen ? styles.accordionChevronOpen : ''}`} />
            </div>

            {isOpen && (
                <div className={styles.accordionBody}>
                    <p className={styles.sectionDesc}>
                        Configura los mensajes que verán los usuarios al buscar su calificación y mantén sincronizada la base pública del Mural para proteger la privacidad del empleado.
                    </p>

                    {/* Mensajes del mural */}
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Mensaje para APROBADOS</label>
                        <textarea
                            className={styles.fieldTextarea}
                            style={{ minHeight: 60 }}
                            value={messages.successMessage}
                            onChange={(e) => setMessages(m => ({ ...m, successMessage: e.target.value }))}
                            placeholder="Usa [Nombre] para incluir el nombre del empleado..."
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Mensaje para REPROBADOS (Motivacional)</label>
                        <textarea
                            className={styles.fieldTextarea}
                            style={{ minHeight: 60 }}
                            value={messages.motivationalMessage}
                            onChange={(e) => setMessages(m => ({ ...m, motivationalMessage: e.target.value }))}
                            placeholder="Usa [Nombre] para incluir el nombre del empleado..."
                        />
                    </div>

                    {/* Botones de acción */}
                    <div className={styles.actionBtnRow}>
                        <button onClick={saveMessages} className={styles.btnSecondary}>
                            <Save size={15} /> Guardar Mensajes
                        </button>
                        <button onClick={handleSyncMural} disabled={syncing} className={styles.btnPrimary}>
                            <RefreshCcw size={15} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                            {syncing ? 'Sincronizando…' : 'Auto-Sincronizar'}
                        </button>
                        <button onClick={() => setShowManualForm(v => !v)} className={styles.btnSuccess}>
                            <FileEdit size={15} /> Captura Manual
                        </button>
                    </div>

                    {/* Formulario manual */}
                    {showManualForm && (
                        <form onSubmit={handleManualSubmit} className={styles.manualForm}>
                            <h4 className={styles.manualFormTitle}>
                                <BookOpen size={16} /> Registro Manual en Mural Público
                            </h4>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>No. Empleado *</label>
                                <div className={styles.idSearchRow}>
                                    <input
                                        required type="text"
                                        className={styles.fieldInput}
                                        value={manualData.employeeId}
                                        onChange={e => setManualData({ ...manualData, employeeId: e.target.value })}
                                        placeholder="Ej. 2950"
                                    />
                                    <button
                                        type="button"
                                        onClick={fetchEmployeeData}
                                        disabled={!manualData.employeeId || searchingM}
                                        className={styles.idSearchBtn}
                                        title="Auto-rellenar"
                                    >
                                        {searchingM ? '…' : '🔍'}
                                    </button>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Primer Nombre (Público) *</label>
                                <input required type="text" className={styles.fieldInput} value={manualData.firstName} onChange={e => setManualData({ ...manualData, firstName: e.target.value })} />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Puesto Actual *</label>
                                <input required type="text" className={styles.fieldInput} value={manualData.currentPosition} onChange={e => setManualData({ ...manualData, currentPosition: e.target.value })} />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Puesto Objetivo *</label>
                                <input required type="text" className={styles.fieldInput} value={manualData.promotionTo} onChange={e => setManualData({ ...manualData, promotionTo: e.target.value })} />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Calificación alcanzada (%) *</label>
                                <input required type="number" min="0" max="100" className={styles.fieldInput} value={manualData.score} onChange={e => setManualData({ ...manualData, score: e.target.value })} placeholder="Ej. 100" />
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Calificación requerida (%) *</label>
                                <input required type="number" min="0" max="100" className={styles.fieldInput} value={manualData.requiredScore} onChange={e => setManualData({ ...manualData, requiredScore: e.target.value })} placeholder="Ej. 85" />
                            </div>

                            <div className={`${styles.fieldGroup} ${styles.manualFormSpan2}`}>
                                <label className={styles.fieldLabel}>Recomendaciones / Feedback</label>
                                <div className={styles.tagsGrid}>
                                    {availableThemes.map(theme => {
                                        const isSel = (manualData.recommendations || []).includes(theme);
                                        return (
                                            <span
                                                key={theme}
                                                className={`${styles.tagChip} ${isSel ? styles.tagChipActive : ''}`}
                                                onClick={() => toggleRec(manualData.recommendations || [], setManualData, theme)}
                                            >
                                                {theme}
                                            </span>
                                        );
                                    })}
                                    {availableThemes.length === 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>No hay temas disponibles.</span>}
                                </div>
                            </div>

                            <div className={styles.manualFormActions}>
                                <button type="button" onClick={() => setShowManualForm(false)} className={styles.btnDanger}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.btnAmber}>
                                    Guardar y Publicar
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Tabla de registros */}
                    <div className={styles.tableWrapper}>
                        <h4 className={styles.tableTitle}>
                            <Presentation size={16} />
                            Registros Públicos Actuales ({muralList.length})
                        </h4>

                        <div className={styles.tableScroll}>
                            <table className={styles.muralTable}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Puesto Actual</th>
                                        <th>Destino</th>
                                        <th>Estado</th>
                                        <th>Feedback</th>
                                        <th style={{ textAlign: 'right' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {muralList.map(item => {
                                        const isEditing = editingMuralId === item.id;
                                        if (isEditing) return (
                                            <tr key={item.id}>
                                                <td>{item.employeeId}</td>
                                                <td><input type="text" className={styles.tableEditInput} value={editData.firstName} onChange={e => setEditData({ ...editData, firstName: e.target.value })} /></td>
                                                <td><input type="text" className={styles.tableEditInput} value={editData.currentPosition} onChange={e => setEditData({ ...editData, currentPosition: e.target.value })} /></td>
                                                <td><input type="text" className={styles.tableEditInput} value={editData.promotionTo} onChange={e => setEditData({ ...editData, promotionTo: e.target.value })} /></td>
                                                <td>—</td>
                                                <td>
                                                    <div className={styles.tagsGrid} style={{ maxHeight: 120, overflowY: 'auto' }}>
                                                        {availableThemes.map(theme => {
                                                            const isSel = (editData.recommendations || []).includes(theme);
                                                            return (
                                                                <span key={theme}
                                                                    className={`${styles.tagChip} ${isSel ? styles.tagChipActive : ''}`}
                                                                    onClick={() => setEditData(prev => ({
                                                                        ...prev,
                                                                        recommendations: isSel
                                                                            ? prev.recommendations.filter(t => t !== theme)
                                                                            : [...(prev.recommendations || []), theme],
                                                                    }))}
                                                                >
                                                                    {theme}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={styles.tableActions}>
                                                        <button onClick={handleSaveEdit} className={`${styles.tableIconBtn} ${styles.tableIconBtnGreen}`} title="Guardar"><Check size={13} /></button>
                                                        <button onClick={handleCancelEdit} className={`${styles.tableIconBtn} ${styles.tableIconBtnRed}`} title="Cancelar"><CancelIcon size={13} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );

                                        return (
                                            <tr key={item.id}>
                                                <td style={{ color: 'var(--text-secondary)' }}>{item.employeeId}</td>
                                                <td style={{ fontWeight: 600 }}>{item.firstName}</td>
                                                <td style={{ color: 'var(--text-secondary)' }}>{item.currentPosition}</td>
                                                <td style={{ color: 'var(--text-secondary)' }}>{item.promotionTo}</td>
                                                <td>
                                                    {item.passed
                                                        ? <span className={styles.statusApproved}>APROBADO</span>
                                                        : <span className={styles.statusFailed}>REPROBADO</span>
                                                    }
                                                </td>
                                                <td>
                                                    <div className={styles.recTagsList}>
                                                        {Array.isArray(item.recommendations) && item.recommendations.length > 0
                                                            ? item.recommendations.map((rec, i) => <span key={i} className={styles.recTag}>{rec}</span>)
                                                            : (item.recommendations
                                                                ? <span className={styles.recTag}>{item.recommendations}</span>
                                                                : <span style={{ color: 'var(--text-tertiary)', fontSize: '0.76rem' }}>—</span>
                                                            )
                                                        }
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={styles.tableActions}>
                                                        <button onClick={() => handleGenerateQR(item)} className={`${styles.tableIconBtn} ${styles.tableIconBtnBlue}`} title="Descargar QR"><Download size={13} /></button>
                                                        <button onClick={() => handleEditClick(item)} className={`${styles.tableIconBtn} ${styles.tableIconBtnAmber}`} title="Editar"><Pencil size={13} /></button>
                                                        <button onClick={() => handleDeleteMural(item.id)} className={`${styles.tableIconBtn} ${styles.tableIconBtnRed}`} title="Eliminar"><Trash2 size={13} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {muralList.length === 0 && (
                                        <tr className={styles.tableEmptyRow}>
                                            <td colSpan="7">No hay resultados en el mural.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── AUDIT LOG ─────────────────────────────────────────────────────────────────
const ACTION_META = {
    create:    { label: 'Creó',     color: '#22c55e', icon: BookOpen    },
    import:    { label: 'Importó',  color: '#3b82f6', icon: UploadCloud },
    delete:    { label: 'Eliminó',  color: '#ef4444', icon: Trash2      },
    publish:   { label: 'Publicó',  color: '#f59e0b', icon: Eye         },
    unpublish: { label: 'Archivó',  color: '#6b7280', icon: EyeOff      },
    rename:    { label: 'Renombró', color: '#a855f7', icon: FileEdit    },
    update:    { label: 'Editó',    color: '#0ea5e9', icon: RefreshCw   },
};

function InduccionAuditSection() {
    const [logs,    setLogs]    = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen,  setIsOpen]  = useState(false);

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
        <div className={styles.accordionPanel}>
            <div
                className={`${styles.accordionHeader} ${isOpen ? styles.accordionHeaderOpen : ''}`}
                onClick={() => setIsOpen(v => !v)}
                role="button"
                aria-expanded={isOpen}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setIsOpen(v => !v)}
            >
                <h3 className={styles.accordionTitle}>
                    <span className={styles.accordionIcon}><BookOpen size={18} /></span>
                    Actividad en Inducción
                </h3>
                <ChevronDown size={20} className={`${styles.accordionChevron} ${isOpen ? styles.accordionChevronOpen : ''}`} />
            </div>

            {isOpen && (
                <div className={styles.accordionBody}>
                    {loading ? (
                        <p className={styles.auditEmpty}>Cargando historial…</p>
                    ) : logs.length === 0 ? (
                        <p className={styles.auditEmpty}>No hay actividad registrada aún.</p>
                    ) : (
                        <ul className={styles.auditList}>
                            {logs.map(log => {
                                const meta = ACTION_META[log.action] || { label: log.action, color: 'var(--text-tertiary)', icon: RefreshCw };
                                const Icon = meta.icon;
                                return (
                                    <li key={log.id} className={styles.auditItem}>
                                        <span className={styles.auditDot} style={{ color: meta.color }}>
                                            <Icon size={14} />
                                        </span>
                                        <div className={styles.auditBody}>
                                            <p className={styles.auditMain}>
                                                <strong className={styles.auditActionLabel} style={{ color: meta.color }}>{meta.label} </strong>
                                                <strong>{log.userName}</strong>
                                                {' — '}
                                                <span className={styles.auditTarget}>{log.target}</span>
                                            </p>
                                            {log.detail && <p className={styles.auditDetail}>{log.detail}</p>}
                                        </div>
                                        <span className={styles.auditTime}>{formatTime(log.timestamp)}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
