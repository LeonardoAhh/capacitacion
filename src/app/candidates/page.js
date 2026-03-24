'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast/Toast';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/Drawer/Drawer';
import styles from './page.module.css';
import { Search, Users, CheckCircle, CheckCircle2, Clock, AlertCircle, Bell, MessageCircle, Key, X, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, TriangleAlert } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import CandidateDrawer from '@/components/features/Dashboard/CandidateDrawer';
import ProfileDropdown from '@/components/layout/ProfileDropdown/ProfileDropdown';
import AvatarSelector from '@/components/ui/AvatarSelector/AvatarSelector';
import { useConfirm } from '@/hooks/useConfirm';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import Select from '@/components/ui/Select/Select';

// Custom hook for data fetching
function useDataFetching() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [coursesMapRef, setCoursesMapRef] = useState({});

    const fetchData = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            setError(null);

            // Parallel fetching for better performance
            const [employeesSnap, coursesSnap, positionsSnap, legacyCoursesSnap, nuevaCursosSnap] = await Promise.allSettled([
                getDocs(collection(db, 'employees')),
                getDocs(collection(db, 'induction_courses')),
                getDocs(collection(db, 'positions')),
                getDocs(collection(db, 'cursos_induccion')).catch(() => ({ docs: [] })),
                getDocs(collection(db, 'cursos')).catch(() => ({ docs: [] }))  // Nueva arquitectura de cursos
            ]);

            // Process employees
            const rawCandidates = employeesSnap.status === 'fulfilled'
                ? employeesSnap.value.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(emp => emp.status === 'Candidato' || emp.isCandidato === true)
                : [];

            // Process courses
            const coursesMap = {};
            if (coursesSnap.status === 'fulfilled') {
                coursesSnap.value.docs.forEach(doc => {
                    const courseData = doc.data();
                    if (courseData.activo !== false) {
                        const courseName = courseData.title || courseData.nombre || 'Sin nombre';
                        coursesMap[doc.id] = {
                            id: doc.id,
                            name: courseName,
                            ...courseData
                        };
                    }
                });
            }

            // Process legacy courses (cursos_induccion)
            if (legacyCoursesSnap.status === 'fulfilled') {
                legacyCoursesSnap.value.docs.forEach(doc => {
                    const d = doc.data();
                    if (d.activo !== false && !coursesMap[d.id] && !coursesMap[d.nombre]) {
                        coursesMap[d.id] = { id: doc.id, name: d.nombre, ...d };
                    }
                });
            }

            // Process new architecture courses (colección `cursos`) — misma fuente que usa el portal candidato
            if (nuevaCursosSnap.status === 'fulfilled') {
                nuevaCursosSnap.value.docs.forEach(doc => {
                    const d = doc.data();
                    // Mismo filtro que courseService.js: links activos, interactivos publicados
                    const isActive = d.tipo === 'link' ? d.activo !== false : d.published === true;
                    if (isActive && !coursesMap[doc.id]) {
                        const courseName = d.title || d.nombre || 'Sin nombre';
                        coursesMap[doc.id] = { id: doc.id, name: courseName, ...d };
                    }
                });
            }

            setCoursesMapRef(coursesMap);

            // Process positions
            const positionRequirements = {};
            if (positionsSnap.status === 'fulfilled') {
                positionsSnap.value.docs.forEach(doc => {
                    const p = doc.data();
                    if (p.name) {
                        positionRequirements[p.name] = p.requiredCourses || [];
                    }
                });
            }

            // Helper function to calculate days since last login
            const calculateDaysSinceLastLogin = (lastLoginDate) => {
                if (!lastLoginDate || lastLoginDate === 'Nunca') return null;
                try {
                    const lastLogin = new Date(lastLoginDate);
                    const today = new Date();
                    const diffTime = Math.abs(today - lastLogin);
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays;
                } catch (error) {
                    return null;
                }
            };

            // Process candidates
            const finalCandidates = rawCandidates.map(c => {
                const position = c.position;
                const requiredCourseTitles = positionRequirements[position] || [];

                // Find required course IDs
                const requiredCourseIds = [];
                requiredCourseTitles.forEach(title => {
                    const found = Object.values(coursesMap).find(course =>
                        course.name === title || course.title === title
                    );
                    if (found) requiredCourseIds.push(found.id);
                });

                // Fallback: buscar en cualquier curso del mapa que tenga puestosAplicables
                // (cubre tanto cursos_induccion como la nueva colección `cursos`)
                if (requiredCourseIds.length === 0) {
                    Object.values(coursesMap).forEach(course => {
                        if (course.puestosAplicables && course.puestosAplicables.includes(position)) {
                            if (!requiredCourseIds.includes(course.id)) {
                                requiredCourseIds.push(course.id);
                            }
                        }
                    });
                }

                // Calculate progress
                const completedIds = c.cursosCompletados || [];
                const totalRequired = requiredCourseIds.length;
                const completedRequiredCount = requiredCourseIds.filter(id => completedIds.includes(id)).length;
                const progress = totalRequired > 0 ? Math.round((completedRequiredCount / totalRequired) * 100) : 0;

                // Calculate activity metrics
                const progressMap = c.coursesProgress || {};
                const presentationsViewed = Object.values(progressMap).filter(p => p.presentationCompleted).length;

                // Determine status
                const daysIdle = calculateDaysSinceLastLogin(c.lastLoginCandidate);
                const isInactive = daysIdle !== null && daysIdle > 2;

                let status = 'notStarted';
                if (progress >= 100) status = 'completed';
                else if (progress > 0 || Object.keys(progressMap).length > 0) status = 'inProgress';
                if (isInactive && status !== 'completed') status = 'inactive';

                // Format last login
                let lastLoginDisplay = 'Nunca';
                if (c.lastLoginCandidate) {
                    if (daysIdle === 0) lastLoginDisplay = 'Hoy';
                    else if (daysIdle === 1) lastLoginDisplay = 'Hace 1 día';
                    else if (daysIdle !== null) lastLoginDisplay = `Hace ${daysIdle} días`;
                    else lastLoginDisplay = new Date(c.lastLoginCandidate).toLocaleDateString();
                }

                return {
                    ...c,
                    name: c.name || c.nombre || 'Sin Nombre',
                    email: c.email || 'N/A',
                    position: position || 'N/A',
                    requiredCount: totalRequired,
                    completedCount: completedRequiredCount,
                    progress: progress,
                    presentationsViewed,
                    status: status,
                    daysSinceLastLogin: daysIdle,
                    lastLogin: lastLoginDisplay,
                    requiredCourseIds: requiredCourseIds,
                    accessCode: c.accessCode || '-',
                    accessCodeUses: c.accessCodeUses || 0,
                    accessCodeExpires: c.accessCodeExpires ? new Date(c.accessCodeExpires).toLocaleDateString() : '-'
                };
            });

            setCandidates(finalCandidates);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setError('Error al cargar los datos. Por favor, intenta de nuevo.');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    return { loading, error, candidates, setCandidates, coursesMapRef, fetchData };
}

/**
 * Calcula cuánto tiempo le queda al candidato para terminar sus cursos.
 * Base: fechaIngreso + 3 días al final del día. Si existe `fechaLimite` en Firestore, se usa ese valor exacto.
 * @param {Object} candidate
 * @returns {{ daysLeft: number, hoursLeft: number, isExpired: boolean, isUrgent: boolean, label: string }}
 */
function getDeadlineInfo(candidate) {
    if (!candidate) return null;

    try {
        let deadline;

        if (candidate.fechaLimite) {
            deadline = new Date(candidate.fechaLimite);
        } else {
            // Priority: startDate > fechaIngreso > createdAt
            const baseDateRaw = candidate.startDate || candidate.fechaIngreso || candidate.createdAt;
            if (!baseDateRaw) return null;
            
            // Si viene con formato 'YYYY-MM-DD' hay que protegerlo de la zona horaria UTC.
            const baseStr = String(baseDateRaw);
            let start;
            if (baseStr.includes('T')) {
                start = new Date(baseDateRaw);
            } else if (baseStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                // Forzar hora local agregando ' T00:00:00'
                start = new Date(`${baseStr}T00:00:00`);
            } else {
                start = new Date(baseDateRaw);
            }

            if (isNaN(start.getTime())) return null;

            // Plazo por defecto: 3 días a partir de la fecha de ingreso, al final del día
            deadline = new Date(start.getTime());
            deadline.setDate(deadline.getDate() + 3);
            deadline.setHours(23, 59, 59, 0);
        }

        if (isNaN(deadline.getTime())) return null;

        const now = new Date();
        const diffMs = deadline - now;

        if (diffMs <= 0) {
            return { daysLeft: 0, hoursLeft: 0, isExpired: true, isUrgent: true, label: 'Tiempo vencido' };
        }

        const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const isUrgent = daysLeft < 2;

        let label;
        if (daysLeft === 0) label = `${hoursLeft}h restantes`;
        else if (daysLeft === 1) label = `1 día ${hoursLeft}h`;
        else label = `${daysLeft} días ${hoursLeft}h`;

        return { daysLeft, hoursLeft, isExpired: false, isUrgent, label, deadlineDate: deadline };
    } catch {
        return null;
    }
}


// Da formato correcto de Title Case a todo el nombre, respetando los conectores.
function formatFullName(fullName) {
    if (!fullName || typeof fullName !== 'string') return 'Colaborador';

    const connectors = new Set(['de', 'la', 'las', 'los', 'del', 'y', 'mac', 'mc', 'van', 'von', 'san', 'santa']);
    const words = fullName.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return 'Colaborador';
    const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

    return words.map((w, i) => {
        const lower = w.toLowerCase();
        if (i === 0) return capitalize(w); // El primero siempre con mayúscula
        return connectors.has(lower) ? lower : capitalize(w);
    }).join(' ');
}

// Devuelve "Nombre Apellido - ID" o solo "Nombre Apellido" si no hay ID
function getDisplayName(candidate) {
    if (!candidate) return 'Colaborador';
    const formatted = formatFullName(candidate.name);
    const id = candidate.employeeId;
    return id ? `${formatted} - ${id}` : formatted;
}

// ============================================================================
// TEMPLATES DE WHATSAPP
// Definidos fuera del componente → referencia estable, sin recreación en render
// ============================================================================
const MESSAGE_TEMPLATES = [
    {
        id: 'welcome',
        title: 'Bienvenida',
        message: (name, c) =>
            `¡Bienvenido/a ${name}!\n\nEs un placer tenerte en el equipo. Para comenzar tu proceso de capacitación, ingresa a la plataforma:\n\n*https://vertxk.xyz/*\n\nDirígete a la *sección de candidatos* e ingresa tus datos:\n\n*Número de empleado:* ${c?.employeeId || 'Tu número de empleado'}\n*CURP:* ${c?.curp || 'Tu CURP'}\n*Código de acceso:* ${c?.accessCode || '-'}\n\nSi tienes cualquier duda, escríbeme.\n\n*_Capacitación ViñoPlastic_*`
    },
    {
        id: 'progress_check',
        title: 'Revisión de Progreso',
        message: (name, c) =>
            `Hola ${name}\n\nNotamos que llevas un avance del *${c?.progress ?? 0}%* en tu proceso de capacitación. ¿Tienes alguna duda o necesitas apoyo?\n\nEstoy para ayudarte.\n\n_*Capacitación ViñoPlastic_*`
    },
    {
        id: 'problem_inquiry',
        title: 'Consulta de Problemas',
        message: (name) =>
            `Hola ${name},\n\nHe notado que no has avanzado en tus cursos. ¿Hay algo que te esté impidiendo continuar?\n\nPuedo agendar un momento para apoyarte, solo dime cuándo te viene bien.\n\n_*Capacitación ViñoPlastic_*`
    },
    {
        id: 'inactive_alert',
        title: 'Inactividad Reciente',
        message: (name, c) => {
            const dias = c?.daysSinceLastLogin;
            const cuanto = dias === 1 ? '1 día' : dias ? `${dias} días` : 'varios días';
            return `Hola ${name},\n\nLlevo *${cuanto}* sin verte en la plataforma de capacitación. Recuerda que completar los cursos a tiempo es parte de tu proceso de capacitación.\n\n¿Necesitas ayuda? ¡Escríbeme!\n\n_*Capacitación ViñoPlastic_*`;
        }
    },
    {
        id: 'completion_reminder',
        title: 'Tiempo Límite',
        message: (name, candidate) => {
            const dl = candidate ? getDeadlineInfo(candidate) : null;
            const tiempo = dl
                ? dl.isExpired
                    ? 'tu plazo *ya venció*'
                    : dl.daysLeft === 0
                        ? `solo te quedan *${dl.hoursLeft} horas*`
                        : dl.daysLeft === 1
                            ? `solo te queda *1 día y ${dl.hoursLeft} horas*`
                            : `te quedan *${dl.daysLeft} días y ${dl.hoursLeft} horas*`
                : 'el tiempo es limitado';
            return `Hola ${name}\n\nTe recuerdo que ${tiempo} para completar tu capacitación.\n\nPor favor entrega tus evaluaciones al área de Capacitación.\n\n*Capacitación ViñoPlastic*`;
        }
    },
    {
        id: 'support_offer',
        title: 'Ofrecimiento de Apoyo',
        message: (name) =>
            `Hola ${name},\n\nQuiero asegurarme de que tu proceso de capacitación sea lo más cómodo posible.\n\nSi tienes dudas sobre los cursos, el acceso a la plataforma o cualquier otra cosa, escríbeme aquí o acércate con Capacitación en horario de 8:00 a 17:00 h.\n\n_ViñoPlastic_`
    }
];

export default function CandidateMonitoringPage() {
    const { user, loading: authLoading, updateUserProfile } = useAuth();
    const router = useRouter();
    const { theme } = useTheme();
    const { showConfirm, confirmDialog } = useConfirm();
    const { toast } = useToast();
    // Ref para enfocar el primer template al abrir el modal (accesibilidad)
    const firstTemplateRef = useRef(null);

    // Data fetching hook
    const { loading, error, candidates, setCandidates, coursesMapRef, fetchData } = useDataFetching();

    // UI States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [whatsappModal, setWhatsappModal] = useState({ isOpen: false, candidate: null });
    const [selectedWhatsappTemplate, setSelectedWhatsappTemplate] = useState(MESSAGE_TEMPLATES[0]);
    // { key: 'name'|'progress'|'lastLogin', dir: 'asc'|'desc' }
    const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' });
    // QuickDrawer al hacer click en una card
    const [quickDrawerOpen, setQuickDrawerOpen] = useState(false);
    const [quickDrawerCandidate, setQuickDrawerCandidate] = useState(null);
    const [quickDrawerTab, setQuickDrawerTab] = useState('perfil');

    // Memoized calculations
    const stats = useMemo(() => {
        // Only count NON-ARCHIVED candidates for stats
        const activeCandidates = candidates.filter(c => !c.isArchived);
        return {
            total: activeCandidates.length,
            completed: activeCandidates.filter(c => c.status === 'completed').length,
            inProgress: activeCandidates.filter(c => c.status === 'inProgress').length,
            inactive: activeCandidates.filter(c => c.status === 'inactive').length,
            avgProgress: activeCandidates.length > 0
                ? Math.round(activeCandidates.reduce((acc, c) => acc + c.progress, 0) / activeCandidates.length)
                : 0
        };
    }, [candidates]);

    const filteredCandidates = useMemo(() => {
        const filtered = candidates.filter(c => {
            const matchesSearch =
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

            const isArchived = c.isArchived === true;

            let matchesStatus = false;
            if (statusFilter === 'archived') {
                matchesStatus = isArchived;
            } else {
                if (isArchived) return false;
                matchesStatus = statusFilter === 'all' || c.status === statusFilter;
            }

            return matchesSearch && matchesStatus;
        });

        // Ordenamiento de columnas
        if (!sortConfig.key) return filtered;

        return [...filtered].sort((a, b) => {
            let valA, valB;
            if (sortConfig.key === 'name') {
                valA = a.name?.toLowerCase() ?? '';
                valB = b.name?.toLowerCase() ?? '';
            } else if (sortConfig.key === 'progress') {
                valA = a.progress ?? 0;
                valB = b.progress ?? 0;
            } else if (sortConfig.key === 'lastLogin') {
                valA = a.daysSinceLastLogin ?? Infinity;
                valB = b.daysSinceLastLogin ?? Infinity;
            } else {
                return 0;
            }
            if (valA < valB) return sortConfig.dir === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.dir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [candidates, searchTerm, statusFilter, sortConfig]);

    // Handler para ordenar columnas
    const handleSort = useCallback((key) => {
        setSortConfig(prev =>
            prev.key === key
                ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { key, dir: 'asc' }
        );
    }, []);

    // Icono de ordenamiento para encabezados
    const SortIcon = ({ colKey }) => {
        if (sortConfig.key !== colKey) return <ArrowUpDown size={14} style={{ opacity: 0.4, marginLeft: 4 }} />;
        return sortConfig.dir === 'asc'
            ? <ArrowUp size={14} style={{ marginLeft: 4, color: 'var(--color-primary)' }} />
            : <ArrowDown size={14} style={{ marginLeft: 4, color: 'var(--color-primary)' }} />;
    };

    // Event handlers
    const handleRowClick = useCallback((candidate) => {
        setSelectedCandidate(candidate);
        setIsDrawerOpen(true);
    }, []);

    // Card click: abre el QuickDrawer
    const handleCardClick = useCallback((candidate) => {
        setQuickDrawerCandidate(candidate);
        setQuickDrawerTab('perfil'); // Reset a la primera pestaña
        setQuickDrawerOpen(true);
    }, []);

    const handleWhatsApp = useCallback((candidate, e) => {
        e?.stopPropagation();
        setWhatsappModal({
            isOpen: true,
            candidate
        });
        setSelectedWhatsappTemplate(MESSAGE_TEMPLATES[0]);
    }, []);

    const sendWhatsAppMessage = useCallback((template) => {
        if (!whatsappModal.candidate) return;

        const { phone } = whatsappModal.candidate;
        if (!phone) {
            toast.warning('Sin número de teléfono registrado — edita el perfil para agregarlo');
            return;
        }

        const cleanPhone = phone.replace(/\D/g, '');
        const message = template.message(getDisplayName(whatsappModal.candidate), whatsappModal.candidate);
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

        // <a> programático: más confiable en móvil que window.open
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Mensaje abierto en WhatsApp para ${formatFullName(whatsappModal.candidate.name)}`);
        setWhatsappModal({ isOpen: false, candidate: null });
    }, [whatsappModal.candidate, toast]);

    // Archive Handler
    const handleArchiveCandidate = useCallback(async (candidate) => {
        const action = candidate.isArchived ? 'restaurar' : 'archivar';
        if (!await showConfirm(
            `¿Estás seguro de que deseas ${action} a ${formatFullName(candidate.name)}?`,
            { title: 'Confirmar Acción', confirmLabel: 'Aceptar' }
        )) return;

        try {
            const docRef = doc(db, 'employees', candidate.id);
            await updateDoc(docRef, {
                isArchived: !candidate.isArchived,
                archivedAt: !candidate.isArchived ? new Date().toISOString() : null
            });
            fetchData();
            setIsDrawerOpen(false);
        } catch (err) {
            console.error('Error updating candidate archive status:', err);
            toast.error('Error al actualizar el estado del candidato');
        }
    }, [fetchData, showConfirm, toast]);

    const handleAvatarSave = useCallback(async (avatarUrl) => {
        if (user?.uid) {
            await updateUserProfile(user.uid, { photoURL: avatarUrl, avatar: avatarUrl });
        }
    }, [user?.uid, updateUserProfile]);

    // Reabrir / Extender el plazo del candidato N días desde hoy o desde su fecha de vencimiento actual
    const handleReopenDeadline = useCallback(async (candidate, extraDays = 3) => {
        if (!await showConfirm(
            `¿Extender el tiempo de capacitación de ${formatFullName(candidate.name)} por ${extraDays} día${extraDays > 1 ? 's' : ''} más?`,
            { title: 'Reabrir Plazo', confirmLabel: `Extender ${extraDays} día${extraDays > 1 ? 's' : ''}` }
        )) return;

        try {
            // Buscamos la fecha límite actual usando la función unificada
            const dlInfo = getDeadlineInfo(candidate);
            
            // Si tiene fecha calculable y aún no está vencido, le sumamos a su tiempo actual. Si ya venció o no tiene, sumamos a partir de hoy.
            let startDateForExtension = new Date();
            if (dlInfo && !dlInfo.isExpired && dlInfo.deadlineDate) {
                startDateForExtension = new Date(dlInfo.deadlineDate.getTime());
            }

            const newDeadline = new Date(startDateForExtension.getTime());
            newDeadline.setDate(newDeadline.getDate() + extraDays);
            newDeadline.setHours(23, 59, 59, 0); // hasta el final del día
            const isoString = newDeadline.toISOString();

            await updateDoc(doc(db, 'employees', candidate.id), {
                fechaLimite: isoString
            });

            // Actualización optimista local para no recargar todo
            setCandidates(prev => prev.map(c => 
                c.id === candidate.id ? { ...c, fechaLimite: isoString } : c
            ));

            toast.success(`Plazo extendido ${extraDays} días para ${formatFullName(candidate.name)}`);
            setQuickDrawerOpen(false);

            // Refresco silente en fondo por seguridad, sin activar spinner global
            fetchData(true);
        } catch (err) {
            console.error('Error extending deadline:', err);
            toast.error('Error al extender el plazo');
        }
    }, [showConfirm, toast, setCandidates, fetchData]);





    // Cerrar modal WhatsApp con tecla Escape (accesibilidad)
    useEffect(() => {
        if (!whatsappModal.isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setWhatsappModal({ isOpen: false, candidate: null });
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [whatsappModal.isOpen]);

    // Enfocar primer template al abrir el modal
    useEffect(() => {
        if (whatsappModal.isOpen && firstTemplateRef.current) {
            firstTemplateRef.current.focus();
        }
    }, [whatsappModal.isOpen]);

    // Effects de autenticación
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/login');
            } else if (!['admin', 'super_admin'].includes(user.rol)) {
                router.push('/dashboard');
            } else {
                fetchData();
            }
        }
    }, [user, authLoading, router, fetchData]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            setSelectedCandidate(null);
            setIsDrawerOpen(false);
            setWhatsappModal({ isOpen: false, candidate: null });
        };
    }, []);

    // Loading state
    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Cargando monitoreo de candidatos...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <AdminLayout title="Monitoreo">
                <div className={styles.errorContainer}>
                    <AlertCircle size={48} className={styles.errorIcon} />
                    <h2>Error al cargar datos</h2>
                    <p>{error}</p>
                    <button
                        onClick={fetchData}
                        className={styles.retryButton}
                    >
                        Intentar de nuevo
                    </button>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Candidatos en Inducción">
            <AvatarSelector
                isOpen={showAvatarSelector}
                onClose={() => setShowAvatarSelector(false)}
                onSave={handleAvatarSave}
                userName={user?.name || user?.displayName || 'Usuario'}
            />

            {/* Stats Row */}
            <div className={styles.statsRow}>
                <div className={styles.statBlock}>
                    <div className={`${styles.statIcon} ${styles.blue}`}>
                        <Users size={18} strokeWidth={2} />
                    </div>
                    <div className={styles.statContent}>
                        <h3 className={styles.statValue}>{stats.total}</h3>
                        <p className={styles.statLabel}>Candidatos</p>
                    </div>
                </div>
                <div className={styles.statDivider} aria-hidden="true" />
                <div className={styles.statBlock}>
                    <div className={`${styles.statIcon} ${styles.green}`}>
                        <CheckCircle size={18} strokeWidth={2} />
                    </div>
                    <div className={styles.statContent}>
                        <h3 className={styles.statValue}>{stats.completed}</h3>
                        <p className={styles.statLabel}>Completados</p>
                    </div>
                </div>
                <div className={styles.statDivider} aria-hidden="true" />
                <div className={styles.statBlock}>
                    <div className={`${styles.statIcon} ${styles.orange}`}>
                        <Clock size={18} strokeWidth={2} />
                    </div>
                    <div className={styles.statContent}>
                        <h3 className={styles.statValue}>{stats.avgProgress}%</h3>
                        <p className={styles.statLabel}>Progreso prom.</p>
                    </div>
                </div>
                <div className={styles.statDivider} aria-hidden="true" />
                <div className={styles.statBlock}>
                    <div className={`${styles.statIcon} ${styles.red}`}>
                        <TriangleAlert size={18} strokeWidth={2} />
                    </div>
                    <div className={styles.statContent}>
                        <h3 className={styles.statValue}>{stats.inactive}</h3>
                        <p className={styles.statLabel}>Sin actividad</p>
                    </div>
                </div>
            </div>

            {/* Barra de búsqueda + filtros */}
            <div className={styles.controlsBar}>
                <div className={styles.searchContainer}>
                    <Search className={styles.searchIcon} size={16} aria-hidden="true" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, puesto o ID..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Buscar candidatos"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className={styles.clearSearch}
                            aria-label="Limpiar búsqueda"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Tabs de filtro — siempre visibles */}
                <div className={styles.filterTabs} role="group" aria-label="Filtrar por estado">
                    {[
                        { value: 'all', label: 'Todos' },
                        { value: 'completed', label: 'Completados' },
                        { value: 'inProgress', label: 'En Proceso' },
                        { value: 'inactive', label: 'Inactivos' },
                        { value: 'notStarted', label: 'Sin Iniciar' },
                        { value: 'archived', label: 'Archivados' },
                    ].map(({ value, label }) => (
                        <button
                            key={value}
                            className={`${styles.filterTab} ${statusFilter === value ? styles.filterTabActive : ''}`}
                            onClick={() => setStatusFilter(value)}
                            aria-pressed={statusFilter === value}
                        >
                            {label}
                            {value !== 'all' && value !== 'archived' && (
                                <span className={styles.filterTabCount}>
                                    {value === 'completed' ? stats.completed
                                        : value === 'inProgress' ? stats.inProgress
                                            : value === 'inactive' ? stats.inactive
                                                : candidates.filter(c => c.status === 'notStarted' && !c.isArchived).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Resumen de resultados */}
            <div className={styles.resultsInfo}>
                <span>{filteredCandidates.length} de {candidates.length} candidatos</span>
            </div>

            {/* Lista de candidatos */}
            {filteredCandidates.length > 0 ? (
                <div className={styles.candidateList}>
                    {/* Encabezado de columnas — solo desktop */}
                    <div className={styles.listHeader} aria-hidden="true">
                        <div className={styles.colHeaderSpacer}></div>
                        <span className={styles.colHeaderName}>Candidato</span>
                        <span className={styles.colHeaderPosition}>Puesto</span>
                        <span className={styles.colHeaderProgress}>Progreso</span>
                        <span className={styles.colHeaderStatus}>Estado</span>
                        <span className={styles.colHeaderDeadline}>Tiempo</span>
                        <div className={styles.colHeaderSpacer}></div>
                    </div>

                    {filteredCandidates.map((candidate) => {
                        const dl = getDeadlineInfo(candidate);
                        const hasDl = dl && candidate.status !== 'completed';
                        // Iniciales para el avatar de texto y formateo de nombre
                        const formattedName = formatFullName(candidate.name);
                        const initialsWords = formattedName.split(' ').filter(w => !['de','la','las','los','del','y','san','santa'].includes(w.toLowerCase()));
                        const initials = initialsWords.length >= 2 
                            ? (initialsWords[0][0] + initialsWords[initialsWords.length - 1][0]).toUpperCase()
                            : (initialsWords[0] || 'C').slice(0, 2).toUpperCase();

                        return (
                            <button
                                key={candidate.id}
                                className={styles.candidateRow}
                                onClick={() => handleCardClick(candidate)}
                                aria-label={`Ver detalles de ${candidate.name}`}
                            >
                                {/* Avatar de iniciales */}
                                <div className={`${styles.rowAvatar} ${styles[`avatar_${candidate.status}`]}`} aria-hidden="true">
                                    {initials}
                                </div>

                                {/* Nombre + ID */}
                                <div className={styles.rowIdentity}>
                                    <span className={styles.rowName}>{formattedName}</span>
                                    <span className={styles.rowId}>{candidate.employeeId || '—'}</span>
                                </div>

                                {/* Puesto */}
                                <span className={styles.rowPosition}>{candidate.position}</span>

                                {/* Progreso */}
                                <div className={styles.rowProgress}>
                                    <div className={styles.rowProgressTrack}>
                                        <div
                                            className={`${styles.rowProgressFill} ${candidate.progress >= 100 ? styles.rowProgressComplete : ''}`}
                                            style={{ width: `${candidate.progress}%` }}
                                        />
                                    </div>
                                    <span className={styles.rowProgressText}>
                                        {candidate.completedCount}/{candidate.requiredCount}
                                    </span>
                                </div>

                                {/* Badge de estado */}
                                <span className={`${styles.rowStatus} ${styles[`status_${candidate.status}`]}`}>
                                    {candidate.status === 'completed' ? 'Completado'
                                        : candidate.status === 'inProgress' ? 'En Proceso'
                                            : candidate.status === 'inactive' ? 'Inactivo'
                                                : 'Sin Iniciar'}
                                </span>

                                {/* Deadline */}
                                {hasDl ? (
                                    <span className={`${styles.rowDeadline} ${dl.isExpired ? styles.deadlineExpired
                                        : dl.isUrgent ? styles.deadlineUrgent
                                            : styles.deadlineOk
                                        }`}>
                                        <Clock size={11} aria-hidden="true" />
                                        {dl.label}
                                    </span>
                                ) : (
                                    <span className={styles.rowDeadlinePlaceholder} aria-hidden="true" />
                                )}

                                {/* Flecha */}
                                <ChevronRight size={15} className={styles.rowArrow} aria-hidden="true" />
                            </button>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    No se encontraron candidatos que coincidan con la búsqueda.
                </div>
            )}

            {/* QuickDrawer — slide-up al hacer click en una card */}
            <Drawer open={quickDrawerOpen} onOpenChange={setQuickDrawerOpen}>
                <DrawerContent>
                    {quickDrawerCandidate && (() => {
                        const c = quickDrawerCandidate;
                        const dl = getDeadlineInfo(c);

                        // Iniciales para el avatar del modal
                        const formattedNameModal = formatFullName(c.name);
                        const initialsWordsModal = formattedNameModal.split(' ').filter(w => !['de','la','las','los','del','y','san','santa'].includes(w.toLowerCase()));
                        const initials = initialsWordsModal.length >= 2 
                            ? (initialsWordsModal[0][0] + initialsWordsModal[initialsWordsModal.length - 1][0]).toUpperCase()
                            : (initialsWordsModal[0] || 'C').slice(0, 2).toUpperCase();

                        return (
                            <>
                                <DrawerHeader>
                                    <div className={styles.qdHeader}>
                                        {/* Ícono de perfil */}
                                        <div className={styles.qdPhotoWrapper}>
                                            <div className={`${styles.qdPhotoFallback} ${styles[`avatar_${c.status}`]}`} aria-hidden="true">
                                                {initials}
                                            </div>
                                        </div>
                                        {/* Info */}
                                        <div className={styles.qdHeaderInfo}>
                                            <DrawerTitle>{c.name}</DrawerTitle>
                                            <p className={styles.qdPosition}>{c.position}</p>
                                            <p className={styles.qdEmployeeId}>ID: {c.employeeId || 'N/A'}</p>

                                        </div>
                                        <DrawerClose />
                                    </div>
                                </DrawerHeader>

                                <div className={styles.qdTabs}>
                                    <button
                                        className={`${styles.qdTab} ${quickDrawerTab === 'perfil' ? styles.qdTabActive : ''}`}
                                        onClick={() => setQuickDrawerTab('perfil')}
                                    >
                                        Perfil
                                    </button>
                                    <button
                                        className={`${styles.qdTab} ${quickDrawerTab === 'progreso' ? styles.qdTabActive : ''}`}
                                        onClick={() => setQuickDrawerTab('progreso')}
                                    >
                                        Progreso
                                    </button>
                                    <button
                                        className={`${styles.qdTab} ${quickDrawerTab === 'acciones' ? styles.qdTabActive : ''}`}
                                        onClick={() => setQuickDrawerTab('acciones')}
                                    >
                                        Acciones
                                    </button>
                                </div>

                                <div className={styles.qdBody}>
                                    {quickDrawerTab === 'perfil' && (
                                        <>
                                            {/* WhatsApp CTA */}
                                            <button
                                                className={styles.qdWhatsappBtn}
                                                onClick={() => {
                                                    setQuickDrawerOpen(false);
                                                    handleWhatsApp(c);
                                                }}
                                                disabled={!c.phone}
                                                title={c.phone
                                                    ? `Enviar WhatsApp a ${formatFullName(c.name)}`
                                                    : 'Sin teléfono registrado — edita el perfil'}
                                            >
                                                <MessageCircle size={20} aria-hidden="true" />
                                                {c.phone
                                                    ? `WhatsApp — ${getDisplayName(c)}`
                                                    : 'Sin teléfono registrado'}
                                            </button>

                                            {/* Info Grid */}
                                            <div className={styles.qdInfoGrid}>
                                                <div className={styles.qdInfoItem}>
                                                    <span className={styles.qdInfoLabel}>Puesto</span>
                                                    <span className={styles.qdInfoValue}>{c.position}</span>
                                                </div>
                                                <div className={styles.qdInfoItem}>
                                                    <span className={styles.qdInfoLabel}>Turno</span>
                                                    <span className={styles.qdInfoValue}>{c.turno || c.shift || c.TURNO || 'No especificado'}</span>
                                                </div>
                                                <div className={styles.qdInfoItem}>
                                                    <span className={styles.qdInfoLabel}>Fecha de Ingreso</span>
                                                    <span className={styles.qdInfoValue}>
                                                        {c.startDate || c.fechaIngreso || c.createdAt
                                                            ? new Date(c.startDate || c.fechaIngreso || c.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                                                            : 'No registrada'
                                                        }
                                                    </span>
                                                </div>
                                                <div className={styles.qdInfoItem}>
                                                    <span className={styles.qdInfoLabel}>Último acceso</span>
                                                    <span className={styles.qdInfoValue}>
                                                        {c.daysSinceLastLogin !== null && c.daysSinceLastLogin > 2 && c.status !== 'completed' && (
                                                            <Bell size={14} className={styles.inactiveIcon} style={{ marginRight: 4 }} />
                                                        )}
                                                        {c.lastLogin}
                                                    </span>
                                                </div>
                                                <div className={styles.qdInfoItem}>
                                                    <span className={styles.qdInfoLabel}>Código de acceso</span>
                                                    <span className={styles.qdInfoValue}>
                                                        <Key size={14} style={{ marginRight: 4 }} />
                                                        <strong>{c.accessCode}</strong>
                                                        <span className={styles.qdInfoMeta}> ({c.accessCodeUses} usos)</span>
                                                    </span>
                                                </div>
                                                <div className={styles.qdInfoItem}>
                                                    <span className={styles.qdInfoLabel}>Debe concluir el</span>
                                                    <span className={styles.qdInfoValue} style={{
                                                        color: dl?.isExpired ? '#ef4444' : dl?.isUrgent ? '#f97316' : 'inherit',
                                                        fontWeight: dl?.isExpired || dl?.isUrgent ? 600 : 'inherit'
                                                    }}>
                                                        {(() => {
                                                            const base = c.fechaLimite || c.startDate || c.fechaIngreso || c.createdAt;
                                                            if (!base) return 'No disponible';
                                                            const deadline = c.fechaLimite
                                                                ? new Date(c.fechaLimite)
                                                                : new Date(new Date(base).getTime() + 3 * 24 * 60 * 60 * 1000);
                                                            if (dl?.isExpired) return '⚠ Tiempo vencido';
                                                            return deadline.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {quickDrawerTab === 'progreso' && (
                                        <>
                                            {/* Progreso general */}
                                            <div className={styles.qdProgressSection}>
                                                <div className={styles.qdProgressHeader}>
                                                    <span className={styles.qdProgressLabel}>Progreso de Inducción</span>
                                                    <span className={styles.qdProgressPct}>{c.progress}%</span>
                                                </div>
                                                <div className={styles.qdProgressBarContainer}>
                                                    <div
                                                        className={`${styles.qdProgressFill} ${c.progress >= 100 ? styles.qdProgressComplete : ''}`}
                                                        style={{ width: `${Math.min(c.progress, 100)}%` }}
                                                    />
                                                </div>
                                                <p className={styles.qdProgressDetail}>
                                                    {c.completedCount} de {c.requiredCount} cursos completados
                                                </p>
                                            </div>

                                            {/* Actividad detallada → abre CandidateDrawer */}
                                            <button
                                                className={styles.qdActivityBtn}
                                                onClick={() => {
                                                    setQuickDrawerOpen(false);
                                                    setTimeout(() => handleRowClick(c), 320);
                                                }}
                                            >
                                                <span>Ver Actividad Detallada</span>
                                                <ChevronRight size={18} />
                                            </button>
                                        </>
                                    )}

                                    {quickDrawerTab === 'acciones' && (
                                        <>
                                            {/* Reabrir Plazo */}
                                            <div className={styles.qdReopenSection}>
                                                <p className={styles.qdReopenLabel}>Reabrir Plazo</p>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
                                                    Extiende el tiempo de capacitación del candidato.
                                                </p>
                                                <div className={styles.qdReopenBtns}>
                                                    {[1, 3, 7].map(days => (
                                                        <button
                                                            key={days}
                                                            className={styles.qdReopenBtn}
                                                            onClick={() => handleReopenDeadline(c, days)}
                                                            title={`Extender ${days} día${days > 1 ? 's' : ''} desde hoy`}
                                                        >
                                                            +{days}d
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </DrawerContent>
            </Drawer>

            {/* Global Candidate Drawer */}
            <CandidateDrawer
                candidate={selectedCandidate}
                coursesMap={coursesMapRef}
                open={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                onArchive={() => handleArchiveCandidate(selectedCandidate)}
            />

            {/* WhatsApp Modal */}
            {whatsappModal.isOpen && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setWhatsappModal({ isOpen: false, candidate: null })}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-title"
                    style={{ position: 'fixed', inset: 0, zIndex: 1000 }}
                >
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 id="modal-title">
                                <MessageCircle size={24} style={{ marginRight: '8px' }} aria-hidden="true" />
                                Selecciona un Mensaje
                            </h3>
                            <button
                                className={styles.modalCloseBtn}
                                onClick={() => setWhatsappModal({ isOpen: false, candidate: null })}
                                aria-label="Cerrar modal"
                            >
                                &times;
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <p className={styles.modalSubtitle}>
                                Enviando a: <strong>{getDisplayName(whatsappModal.candidate)}</strong>
                            </p>

                            <div className={styles.whatsappTemplatesNav}>
                                {MESSAGE_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        className={`${styles.whatsappTab} ${selectedWhatsappTemplate.id === template.id ? styles.whatsappTabActive : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedWhatsappTemplate(template);
                                        }}
                                    >
                                        {template.title}
                                    </button>
                                ))}
                            </div>


                        </div>

                        <div className={styles.modalFooterActions}>
                            <button
                                className={styles.whatsappSendBtn}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    sendWhatsAppMessage(selectedWhatsappTemplate);
                                }}
                            >
                                <MessageCircle size={18} />
                                Enviar por WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {confirmDialog}
        </AdminLayout>
    );
}
