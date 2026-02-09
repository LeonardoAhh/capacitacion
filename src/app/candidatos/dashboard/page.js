'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { BookOpen, FileText, LogOut, CheckCircle, Clock, Sparkles, ArrowRight, ChevronRight, User, ChevronLeft, Contrast, HelpCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import LazyIframe from '@/components/ui/LazyIframe/LazyIframe';
import { motion } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/Drawer/Drawer";
import { Shield, MapPin, UserCheck, Smile, Download, ExternalLink, Phone, Calendar } from 'lucide-react';
import styles from './page.module.css';
import ProfileDropdown from './ProfileDropdown';
import induccionEmpresaExam from '../../../../public/examenes/induccion_empresa.json';

// Custom Hooks and Utils
import { useCandidateSession, useCourseProgress } from './hooks';
import {
    PASSING_SCORE,
    INDUCTION_COURSE_NAME,
    ONE_MINUTE_MS,
    FIVE_MINUTES_MS,
    TIMER_COLORS,
    SESSION_KEYS
} from './utils/constants';
import { convertDriveUrl, extractFirstName, getCandidatePhotoUrl } from './utils/helpers';

// UI Components
import { DashboardSkeleton, useToast } from './components';


function ElegantShape({ className, delay = 0, width = 400, height = 100, rotate = 0, color, borderRadius = 16 }) {
    return (
        <motion.div
            animate={{ opacity: 1, y: 0, rotate }}
            className={className}
            initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            style={{ position: 'absolute', width: `min(${width}px, 90vw)`, height: `${height}px`, zIndex: 0 }}
        >
            <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(135deg, ${color}40, ${color}20)`,
                    borderRadius: `${borderRadius}px`,
                    backdropFilter: 'blur(1px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: '0 2px 16px -2px rgba(255, 255, 255, 0.04)',
                }}
            />
        </motion.div>
    );
}

export default function CandidatoDashboard() {
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [candidate, setCandidate] = useState(null);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showWelcome, setShowWelcome] = useState(true);
    const [courseProgress, setCourseProgress] = useState({}); // Track progress per course
    const [showHelpTooltip, setShowHelpTooltip] = useState(false);
    const [selectedDataCenterItem, setSelectedDataCenterItem] = useState(null);
    const [showExamModal, setShowExamModal] = useState(false);
    const [examData, setExamData] = useState(induccionEmpresaExam);

    const roadmapSteps = [
        {
            id: 1,
            title: 'Bienvenida RH',
            icon: <Smile size={20} />,
            details: ['Prueba de Antidoping', 'Firma de contratos', 'Entrega de EPP']
        },
        {
            id: 2,
            title: 'Capacitación',
            icon: <BookOpen size={20} />,
            details: ['Dudas', 'Información general']
        },
        {
            id: 3,
            title: 'Recorrido Planta',
            icon: <MapPin size={20} />,
            details: ['Conoce las instalaciones y salidas de emergencia']
        },
        {
            id: 4,
            title: 'Horario de Comida',
            icon: <Clock size={20} />,
            details: ['Consumo de alimentos']
        },
        {
            id: 5,
            title: 'Incorporación al área',
            icon: <UserCheck size={20} />,
            details: ['Presentación con tu jefe inmediato y equipo']
        }
    ];

    const dataCenterItems = [

        {
            id: 'dresscode',
            title: 'Código de Vestimenta',
            icon: <User size={24} />,
            desc: 'Normas sobre el uso del uniforme y calzado de seguridad.',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <p style={{ fontWeight: 600, marginBottom: '8px' }}>DEBES PORTAR EL EQUIPO DE PROTECCIÓN PERSONAL</p>
                    <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                        <li style={{ marginBottom: '4px' }}>USO DE COFIA</li>
                        <li style={{ marginBottom: '4px' }}>USO DE PLAYERA / CHALECO</li>
                        <li style={{ marginBottom: '4px' }}>PANTALON DE MEZCLILLA (NO ROTOS NO RAZGADOS)</li>
                        <li style={{ marginBottom: '4px' }}>ZAPATOS/TENIS DE SEGURIDAD (CON CASQUILLO)</li>
                    </ul>
                </div>
            )
        },
        {
            id: 'rules',
            title: 'Reglamento Interior',
            icon: <FileText size={24} />,
            desc: 'Políticas internas y normas de convivencia.',
            content: (
                <div style={{ textAlign: 'left' }}>
                    <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                        <li style={{ marginBottom: '4px' }}>PROHIBIDO EL USO DE JOYERÍA EN LAS ESTACIONES DE TRABAJO</li>
                        <li style={{ marginBottom: '4px' }}>NO INGERIR NINGÚN TIPO DE ALIMENTO O LÍQUIDO EN EL ÁREA DE TRABAJO</li>
                        <li style={{ marginBottom: '4px' }}>PROHIBIDO EL USO DE TODO EQUIPO ELECTRONICO EN LAS ÁREA OPERATIVAS</li>
                        <li style={{ marginBottom: '4px' }}>USO DE MAQUILLAJE</li>
                        <li style={{ marginBottom: '4px' }}>QUEDA PROHIBIDO HACER VENTAS O NEGOCIOS DENTRO DE LAS INSTALACIONES</li>
                        <li style={{ marginBottom: '4px' }}>QUEDA PROHIBIDO DORMIRSE DURANTE LA JORNADA LABORAL</li>
                    </ul>
                </div>
            )
        },
    ];




    // Logout handler (declared before useEffect that uses it)
    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            sessionStorage.removeItem('candidate_session');
            router.push('/');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            sessionStorage.removeItem('candidate_session');
            router.push('/');
        }
    }, [router]);

    useEffect(() => {
        // Verificar sesión
        const session = sessionStorage.getItem('candidate_session');
        if (!session) {
            router.push('/candidatos');
            return;
        }

        const candidateData = JSON.parse(session);
        setCandidate(candidateData);

        // Cargar datos frescos de Firestore (incluyendo progreso granular)
        const fetchFreshData = async () => {
            try {
                const docRef = doc(db, 'employees', candidateData.id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const freshData = docSnap.data();
                    setCandidate(prev => ({ ...prev, ...freshData }));
                    if (freshData.coursesProgress) {
                        setCourseProgress(freshData.coursesProgress);
                    }
                    // Update session storage to keep it overlapping
                    const newSession = { ...candidateData, ...freshData };
                    sessionStorage.setItem('candidate_session', JSON.stringify(newSession));
                }
            } catch (error) {
                console.error("Error loading fresh data:", error);
            }
        };
        fetchFreshData();

        // Cargar cursos
        const positionToLoad = candidateData.position || candidateData.puesto;
        if (positionToLoad && positionToLoad !== 'N/A') {
            loadCourses(positionToLoad);
        } else {
            setLoading(false);
        }

        // Session Timeout Logic (2 hours fixed duration)
        const TIMEOUT_DURATION = 2 * 60 * 60 * 1000;

        let intervalId;

        const startTimer = () => {
            // Check for existing expiry
            let storedExpiry = sessionStorage.getItem('candidate_session_expiry');
            let expiryTime;

            if (storedExpiry) {
                expiryTime = parseInt(storedExpiry, 10);
                // Validation: If expiry is in the past or way too far future (sanity check), reset?
                // For now, trust storage. If expired, it will auto-logout immediately below.
            } else {
                expiryTime = Date.now() + TIMEOUT_DURATION;
                sessionStorage.setItem('candidate_session_expiry', expiryTime.toString());
            }

            // Update Countdown
            const tick = () => {
                const now = Date.now();
                const remaining = expiryTime - now;

                if (remaining <= 0) {
                    clearInterval(intervalId);
                    setTimeLeft(0);
                    handleLogout();
                    return;
                }
                setTimeLeft(remaining); // Store in ms
            };

            // Immediate check
            tick();
            intervalId = setInterval(tick, 1000);
        };

        startTimer();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [router, handleLogout]);

    // Timer State and Helpers
    const [timeLeft, setTimeLeft] = useState(30 * 60 * 1000);

    // Memoized time formatting
    const formattedTime = useMemo(() => {
        const totalSeconds = Math.max(0, Math.floor(timeLeft / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, [timeLeft]);

    // Memoized timer color based on remaining time
    const timerColor = useMemo(() => {
        if (timeLeft < ONE_MINUTE_MS) return TIMER_COLORS.DANGER;
        if (timeLeft < FIVE_MINUTES_MS) return TIMER_COLORS.WARNING;
        return TIMER_COLORS.DEFAULT;
    }, [timeLeft]);


    const loadCourses = async (position) => {
        try {
            // Paso 1: Buscar el puesto en la colección "positions"
            const positionsRef = collection(db, 'positions');
            const positionQuery = query(positionsRef, where('name', '==', position));
            const positionSnapshot = await getDocs(positionQuery);

            let coursesData = [];

            if (!positionSnapshot.empty) {
                // Flujo nuevo: usar positions → induction_courses
                const positionData = positionSnapshot.docs[0].data();
                const requiredCourses = positionData.requiredCourses || [];

                if (requiredCourses.length > 0) {
                    // Paso 2: Buscar los cursos en "induction_courses" por nombre
                    const inductionRef = collection(db, 'induction_courses');
                    const coursesQuery = query(inductionRef, where('title', 'in', requiredCourses));
                    const coursesSnapshot = await getDocs(coursesQuery);

                    coursesData = coursesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // Ordenar por el orden de requiredCourses
                    const sortedCourses = requiredCourses
                        .map(courseName => coursesData.find(c => c.title === courseName))
                        .filter(Boolean); // Filtrar undefined

                    coursesData = sortedCourses;

                    // Enrich with examenUrl from cursos_induccion if available
                    try {
                        const cursosRef = collection(db, 'cursos_induccion');
                        const legacyQuery = query(
                            cursosRef,
                            where('puestosAplicables', 'array-contains', position),
                            where('activo', '==', true)
                        );
                        const legacySnapshot = await getDocs(legacyQuery);

                        // Map legacy courses by name for quick lookup
                        const legacyCourseMap = {};
                        legacySnapshot.docs.forEach(doc => {
                            const data = doc.data();
                            legacyCourseMap[data.nombre] = data;
                        });

                        // Enrich coursesData with examenUrl if found
                        coursesData = coursesData.map(course => {
                            const legacyCourse = legacyCourseMap[course.title];
                            if (legacyCourse && legacyCourse.examenUrl) {
                                return { ...course, examenUrl: legacyCourse.examenUrl };
                            }
                            return course;
                        });
                    } catch (error) {
                        console.error('Error enriching courses:', error);
                    }
                }
            }

            // Fallback: Si no hay cursos del flujo nuevo, buscar en cursos_induccion (legacy)
            if (coursesData.length === 0) {
                console.log('No courses found in induction_courses, trying cursos_induccion...');
                const cursosRef = collection(db, 'cursos_induccion');
                const legacyQuery = query(
                    cursosRef,
                    where('puestosAplicables', 'array-contains', position),
                    where('activo', '==', true)
                );

                const legacySnapshot = await getDocs(legacyQuery);
                coursesData = legacySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Ordenar por campo 'orden'
                coursesData.sort((a, b) => (a.orden || 0) - (b.orden || 0));
            }

            setCourses(coursesData);
            setLoading(false);
        } catch (error) {
            console.error('Error loading courses:', error);
            setLoading(false);
        }
    };



    const viewCourse = useCallback((course) => {
        setSelectedCourse(course);
    }, []);

    const closeViewer = useCallback(() => {
        setSelectedCourse(null);
    }, []);

    const convertDriveUrl = (course) => {
        if (!course || !course.material) return null;

        let url = course.material.url;
        if (!url) return null;

        // Check if input is a raw IFRAME code (starts with <iframe)
        if (url.trim().startsWith('<iframe')) {
            const srcMatch = url.match(/src="([^"]+)"/);
            if (srcMatch && srcMatch[1]) {
                url = srcMatch[1];
            }
        }

        // Si es un enlace directo de Google Drive
        if (course.material.type === 'link') {
            // Google Drive
            const fileId = url.match(/\/d\/([^\/]+)/)?.[1];
            if (fileId) {
                return `https://drive.google.com/file/d/${fileId}/preview`;
            }

            // OneDrive logic
            if (url.includes('onedrive.live.com') || url.includes('1drv.ms')) {
                // Si es un shortlink de 1drv.ms, usualmente ya es el link directo o de share
                // Si es view.aspx, intentar cambiar a embed
                if (url.includes('view.aspx')) {
                    return url.replace('view.aspx', 'embed');
                }

                return url;
            }

            return url;
        }

        return null;
    };

    const downloadExam = (course) => {
        // Si hay campo examenUrl (de cursos_induccion legacy)
        if (course.examenUrl) {
            window.open(course.examenUrl, '_blank');
            // Mark exam as downloaded
            markStepComplete(course.id, 'examDownloaded');
            return;
        }

        // Si hay material de tipo documento
        if (course.material?.type === 'document' && course.material?.url) {
            window.open(course.material.url, '_blank');
        }
    };



    // Manual Course Completion Toggle
    const toggleCourseCompletion = async (courseId, shouldMarkComplete) => {
        if (!candidate?.id) return;

        // Optimistic UI Update
        const currentCompleted = candidate.cursosCompletados || [];
        const newCompleted = shouldMarkComplete
            ? [...currentCompleted, courseId]
            : currentCompleted.filter(id => id !== courseId);

        setCandidate(prev => ({
            ...prev,
            cursosCompletados: newCompleted
        }));

        try {
            const employeeRef = doc(db, 'employees', candidate.id);

            // Prepare updates
            // 1. Update list of completed IDs
            const updates = {
                cursosCompletados: shouldMarkComplete ? arrayUnion(courseId) : arrayRemove(courseId)
            };

            // 2. If marking complete, also backfill granular progress so Admin Dashboard stats align
            // (Assumes if they mark it complete, they viewed/did everything)
            if (shouldMarkComplete) {
                updates.coursesProgress = {
                    [courseId]: {
                        presentationCompleted: true,
                        examDownloaded: true,
                        step1: true,
                        step2: true,
                        step1Completed: true,
                        step2Completed: true,
                        // Duplicates removed for clarity, but keeping the original intent
                        // presentationCompleted: true, // Already present
                        // examDownloaded: true // Already present
                    }
                };
            }

            await setDoc(employeeRef, updates, { merge: true });

            // Also update session to persist across reloads without refetch if needed immediately
            const session = JSON.parse(sessionStorage.getItem('candidate_session') || '{}');
            session.cursosCompletados = newCompleted;
            sessionStorage.setItem('candidate_session', JSON.stringify(session));

        } catch (error) {
            console.error("Error updating course completion:", error);
            // Revert on error
            setCandidate(prev => ({
                ...prev,
                cursosCompletados: currentCompleted
            }));
        }
    };

    const handleExamSubmit = async (finalScore, answers) => {
        if (!candidate?.id) return;

        try {
            const employeeRef = doc(db, 'employees', candidate.id);
            const courseId = Object.keys(courseProgress).find(id => {
                const course = courses.find(c => c.id === id);
                return course?.title?.toUpperCase().includes('INDUCCIÓN A LA EMPRESA') ||
                    course?.nombre?.toUpperCase().includes('INDUCCIÓN A LA EMPRESA');
            });

            // Legacy update for backward compatibility
            await updateDoc(employeeRef, {
                inductionScore: finalScore,
                inductionDate: new Date().toISOString(),
                inductionPassed: finalScore >= 70,
                inductionAnswers: answers
            });

            if (courseId) {
                // Update course progress with detailed exam results
                const updatePayload = {
                    [`coursesProgress.${courseId}.examScore`]: finalScore,
                    [`coursesProgress.${courseId}.examAnswers`]: answers,
                    [`coursesProgress.${courseId}.examDate`]: new Date().toISOString(),
                    [`coursesProgress.${courseId}.examDownloaded`]: true
                };

                await updateDoc(employeeRef, updatePayload);

                // Update local state
                setCourseProgress(prev => ({
                    ...prev,
                    [courseId]: {
                        ...prev[courseId],
                        examScore: finalScore,
                        examAnswers: answers,
                        examDate: new Date().toISOString(),
                        examDownloaded: true
                    }
                }));

                // Mark as completed if passed
                if (finalScore >= 70) {
                    await updateDoc(employeeRef, {
                        cursosCompletados: arrayUnion(courseId)
                    });
                    setCandidate(prev => ({
                        ...prev,
                        cursosCompletados: [...(prev.cursosCompletados || []), courseId]
                    }));
                }
            }

            // Close modal after delay
            if (finalScore >= 70) {
                setTimeout(() => {
                    setShowExamModal(false);
                }, 2000);
            }

        } catch (error) {
            console.error("Error submitting exam:", error);
        }
    };

    // Progress tracking functions
    const markStepComplete = async (courseId, step) => {
        // 1. Optimistic UI update
        setCourseProgress(prev => ({
            ...prev,
            [courseId]: {
                ...prev[courseId],
                [step]: true
            }
        }));

        // 2. Persist to Firestore
        if (!candidate?.id) return;

        try {
            const employeeRef = doc(db, 'employees', candidate.id);

            // Use setDoc with merge to ensure the 'coursesProgress' map is created if it's doesn't exist
            const updatePayload = {
                coursesProgress: {
                    [courseId]: {
                        [step]: true
                    }
                }
            };

            await setDoc(employeeRef, updatePayload, { merge: true });

            // Special handling for completion
            if (step === 'examDownloaded') {
                await updateDoc(employeeRef, {
                    cursosCompletados: arrayUnion(courseId)
                });

                // Update local candidate state
                setCandidate(prev => ({
                    ...prev,
                    cursosCompletados: [...(prev.cursosCompletados || []), courseId]
                }));
            }

        } catch (error) {
            console.error("Error saving progress:", error);
            // Optionally revert UI state on error
        }
    };



    const isStepUnlocked = (courseId, step) => {
        const progress = courseProgress[courseId] || {};

        switch (step) {
            case 'step1':
                return true; // Always unlocked
            case 'presentation':
                return progress.step1Completed;
            case 'step2':
                return progress.presentationCompleted;
            case 'exam':
                return progress.step2Completed;
            default:
                return false;
        }
    };

    const getCurrentStepNumber = (courseId) => {
        const progress = courseProgress[courseId] || {};
        if (!progress.step1Completed) return 1;
        if (!progress.presentationCompleted) return 2;
        if (!progress.step2Completed) return 3;
        if (!progress.examDownloaded) return 4;
        return 4; // All complete
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.backgroundGradient} />
                <DashboardSkeleton />
            </div>
        );
    }

    // Pantalla de Bienvenida
    if (showWelcome) {
        // Extract first name using the helper function
        const firstName = extractFirstName(candidate?.name || candidate?.nombre);
        const photoUrl = getCandidatePhotoUrl(candidate);

        return (
            <div
                className={styles.welcomeOverlay}
                role="main"
                aria-labelledby="welcome-title"
            >
                {/* Background Gradient */}
                <div className={styles.backgroundGradient} aria-hidden="true" />

                {/* Background Shapes - Hidden from screen readers */}
                <div className={styles.shapesContainer} aria-hidden="true">
                    <ElegantShape className={styles.shape1} delay={0.2} width={300} height={400} rotate={-12} color="#10b981" borderRadius={20} />
                    <ElegantShape className={styles.shape2} delay={0.4} width={350} height={150} rotate={18} color="#14b8a6" borderRadius={16} />
                    <ElegantShape className={styles.shape3} delay={0.3} width={200} height={200} rotate={-25} color="#06b6d4" borderRadius={24} />
                    <ElegantShape className={styles.shape4} delay={0.5} width={300} height={120} rotate={15} color="#3b82f6" borderRadius={12} />
                </div>

                <div className={styles.welcomeCard} role="article">
                    {/* Welcome Header */}
                    <header className={styles.welcomeHeader}>
                        <div
                            className={styles.welcomeAvatar}
                            role="img"
                            aria-label={photoUrl ? `Foto de perfil de ${firstName}` : 'Ícono de usuario'}
                        >
                            {photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={photoUrl}
                                    alt={`Foto de perfil de ${firstName}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                    loading="eager"
                                />
                            ) : (
                                <User size={64} aria-hidden="true" />
                            )}
                        </div>
                    </header>

                    <h1 id="welcome-title" className={styles.welcomeTitle}>
                        ¡Bienvenido a <span>ViñoPlastic</span>!
                    </h1>

                    <p className={styles.welcomeSubtitle} aria-label={`Hola ${firstName}`}>
                        {firstName}
                    </p>

                    <div className={styles.welcomeMessage}>
                        <p>
                            Nos da mucho gusto que formes parte de nuestra familia.
                            A partir de hoy inicias un nuevo capítulo en tu carrera profesional.
                        </p>
                        <p>
                            En <strong>ViñoPlastic Inyección S.A. de C.V.</strong> valoramos tu talento
                            y estamos comprometidos con tu desarrollo.
                        </p>
                        <p>
                            A continuación encontrarás los cursos de inducción que deberás completar
                            para conocer nuestra empresa, políticas y tu puesto de trabajo.
                        </p>
                    </div>

                    <div className={styles.infoGrid} role="list" aria-label="Información del candidato">
                        <div className={styles.infoItem} role="listitem">
                            <span className={styles.infoLabel} id="position-label">Puesto:</span>
                            <span className={styles.infoValue} aria-labelledby="position-label">
                                {candidate?.position || candidate?.puesto || 'Por asignar'}
                            </span>
                        </div>
                        <div className={styles.infoItem} role="listitem">
                            <span className={styles.infoLabel} id="area-label">Área:</span>
                            <span className={styles.infoValue} aria-labelledby="area-label">
                                {candidate?.area || 'Por asignar'}
                            </span>
                        </div>

                        <button
                            className={styles.welcomeButton}
                            onClick={() => setShowWelcome(false)}
                            aria-label="Iniciar sesión de inducción"
                            type="button"
                        >
                            <span>Iniciar</span>
                            <ArrowRight size={20} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className={styles.container}>
            {/* Background Gradient */}
            <div className={styles.backgroundGradient} />

            {/* Background Shapes */}
            <div className={styles.shapesContainer}>
                <ElegantShape className={styles.shape1} delay={0.2} width={300} height={400} rotate={-12} color="#10b981" borderRadius={20} />
                <ElegantShape className={styles.shape2} delay={0.4} width={350} height={150} rotate={18} color="#14b8a6" borderRadius={16} />
                <ElegantShape className={styles.shape3} delay={0.3} width={200} height={200} rotate={-25} color="#06b6d4" borderRadius={24} />
                <ElegantShape className={styles.shape4} delay={0.5} width={300} height={120} rotate={15} color="#3b82f6" borderRadius={12} />
            </div>

            {/* Navbar */}
            <nav
                className={styles.navbar}
                aria-label="Navegación principal del candidato"
                role="navigation"
            >
                <div className={styles.navActions}>
                    <ProfileDropdown
                        candidate={candidate}
                        onLogout={handleLogout}
                        timeLeft={Math.floor(timeLeft / 1000)}
                        toggleTheme={toggleTheme}
                    />
                </div>
            </nav>

            {/* Scrollable Content */}
            <div className={styles.scrollContent}>
                {/* Profile Section removed as it is now in Navbar */}

                {/* Important Info Section */}
                <section className={styles.menuSection} style={{ marginBottom: '24px', marginTop: '40px' }}>
                    <h3 className={styles.sectionHeader}>ℹ️ Información Importante</h3>
                    <div className={styles.importantGrid}>
                        {/* Card 1 */}
                        <div className={styles.importantCard}>
                            <div className={styles.importantCardIcon}>
                                <User size={20} />
                            </div>
                            <p className={styles.importantCardText}>
                                Solo tienes <span style={{ fontWeight: 800, color: '#007aff' }}>10 inicios de sesión</span> disponibles.
                            </p>
                        </div>
                        {/* Card 2 */}
                        <div className={styles.importantCard}>
                            <div className={styles.importantCardIcon}>
                                <Download size={20} />
                            </div>
                            <p className={styles.importantCardText}>
                                Puedes descargar el examen y contestarlo o solo anotar las respuestas.
                            </p>
                        </div>
                        {/* Card 3 */}
                        <div className={styles.importantCard}>
                            <div className={styles.importantCardIcon}>
                                <FileText size={20} />
                            </div>
                            <p className={styles.importantCardText}>
                                Presenta tus respuestas en tu <span style={{ fontWeight: 700 }}>primer día</span> de trabajo.
                            </p>
                        </div>
                        {/* Card 4 */}
                        <div className={styles.importantCard}>
                            <div className={styles.importantCardIcon}>
                                <Phone size={20} />
                            </div>
                            <p className={styles.importantCardText}>
                                Si agotaste tus oportunidades, contacta a <span style={{ fontWeight: 700 }}>RH</span> para un nuevo código.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Roadmap Section */}
                <section className={styles.roadmapSection}>
                    <h3 className={styles.sectionHeader}>📍 Tu Primer Día</h3>
                    <div className={styles.timelineContainer}>
                        {roadmapSteps.map((step, index) => (
                            <div key={step.id} className={styles.timelineItem}>
                                <div className={styles.timelineDot}></div>
                                <div className={styles.timelineContent}>
                                    <h4 className={styles.timelineTitle}>{step.title}</h4>
                                    {step.details && (
                                        <ul className={styles.timelineList}>
                                            {step.details.map((detail, idx) => (
                                                <li key={idx}>{detail}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* HR Contact Section (Moved Up) */}
                <section className={styles.menuSection} style={{ marginTop: '24px' }}>
                    <h3 className={styles.sectionHeader}>📞 Contacto Recursos Humanos</h3>
                    <div className={styles.contactGrid}>
                        {/* Card 1: Turno Mixto */}
                        <div className={styles.contactCard}>
                            <div>
                                <div className={styles.contactHeader}>
                                    <span className={styles.menuLabel} style={{ fontWeight: 600, fontSize: '17px' }}>Turno Mixto</span>
                                    <Calendar size={20} color="#007aff" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                                    <span className={styles.menuValue} style={{ textAlign: 'left', fontSize: '14px' }}>Lunes a Viernes: 8:00 - 18:00</span>
                                    <span className={styles.menuValue} style={{ textAlign: 'left', fontSize: '14px' }}>Sábados: 8:00 - 11:00</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {['55 1406 3167', '55 1525 4782', '442 509 5534', '55 6326 5881'].map(num => (
                                    <a key={num} href={`https://wa.me/${num.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#25D366', color: 'white', padding: '6px 10px', borderRadius: '12px', fontSize: '12px', textDecoration: 'none', fontWeight: 600, transition: 'transform 0.2s' }}>
                                        <Phone size={12} fill="white" /> {num}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Card 2: Tercer Turno */}
                        <div className={styles.contactCard}>
                            <div>
                                <div className={styles.contactHeader}>
                                    <span className={styles.menuLabel} style={{ fontWeight: 600, fontSize: '17px' }}>Tercer Turno</span>
                                    <Calendar size={20} color="#5856d6" />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <span className={styles.menuValue} style={{ textAlign: 'left', fontSize: '14px' }}>Lunes a Viernes: 22:00 - 6:00</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Center Section (Moved Up) */}
                <section className={styles.dataCenterSection}>
                    <h3 className={styles.sectionHeader}>📂 Datos importantes</h3>
                    <div className={styles.dataGrid}>
                        {dataCenterItems.map((item) => (
                            <div
                                key={item.id}
                                className={styles.dataCard}
                                onClick={() => setSelectedDataCenterItem(item)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setSelectedDataCenterItem(item);
                                    }
                                }}
                                aria-label={`Ver información sobre ${item.title}`}
                            >
                                <div className={styles.dataIcon}>
                                    {item.icon}
                                </div>
                                <span className={styles.dataTitle}>{item.title}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* General Data Section (Moved Down) */}
                <section className={styles.menuSection}>
                    <h3 className={styles.sectionHeader}>📋 Datos Generales</h3>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoCard}>
                            <span className={styles.infoLabelSmall}>ID Empleado</span>
                            <span className={styles.infoValueLarge}>{candidate?.employeeId || 'ND'}</span>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.infoLabelSmall}>CURP</span>
                            <span className={styles.infoValueLarge}>{candidate?.curp || 'Por definir'}</span>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.infoLabelSmall}>Área</span>
                            <span className={styles.infoValueLarge}>{candidate?.area || 'General'}</span>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.infoLabelSmall}>Departamento</span>
                            <span className={styles.infoValueLarge}>{candidate?.department || candidate?.departamento || 'No asignado'}</span>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.infoLabelSmall}>Turno</span>
                            <span className={styles.infoValueLarge}>{candidate?.shift || candidate?.turno || 'Mixto'}</span>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.infoLabelSmall}>Fecha de Ingreso</span>
                            <span className={styles.infoValueLarge}>{candidate?.startdate || new Date().toLocaleDateString('es-MX')}</span>
                        </div>
                    </div>
                </section>

                {/* Courses Section (Moved to Bottom) */}
                <section className={styles.menuSection}>
                    <div className={styles.sectionHeaderContainer}>
                        <h3 className={styles.sectionHeader}>Cursos de Inducción</h3>
                    </div>

                    {courses.length === 0 ? (
                        <div className={styles.emptyState}>
                            <BookOpen size={40} />
                            <p>No hay cursos asignados</p>
                        </div>
                    ) : (
                        <div className={styles.coursesGrid}>
                            {courses.map((course) => {
                                const isCompleted = candidate?.cursosCompletados?.includes(course.id);

                                return (
                                    <div
                                        key={course.id}
                                        className={styles.courseCard}
                                        onClick={() => viewCourse(course)}
                                        tabIndex={0} // Make focusable
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                viewCourse(course);
                                            }
                                        }}
                                        aria-label={`Ver detalles del curso ${course.title || course.nombre}`}
                                    >
                                        <div className={styles.courseCardHeader}>
                                            <div className={`${styles.courseIcon} ${isCompleted ? styles.courseIconCompleted : ''}`}>
                                                {isCompleted ? (
                                                    <CheckCircle size={24} />
                                                ) : (
                                                    <BookOpen size={24} />
                                                )}
                                            </div>
                                            <div className={styles.courseContent}>
                                                <span className={styles.courseCardTitle}>
                                                    {course.title || course.nombre}
                                                </span>
                                                {course.duration && (
                                                    <span className={styles.courseDuration} style={{ display: 'block', marginTop: '4px' }}>
                                                        {course.duration} min
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.courseCardFooter}>
                                            <button
                                                className={isCompleted ? styles.btnCompleted : styles.btnMarkComplete}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleCourseCompletion(course.id, !isCompleted);
                                                }}
                                            >
                                                {isCompleted ? 'Completado' : 'Marcar Completado'}
                                            </button>
                                            <ChevronRight size={20} className={styles.chevron} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Footer */}
                <footer className={styles.footer}>
                    <p>ViñoPlastic Inyección S.A. de C.V.</p>
                    <p>Portal de Inducción v2.0</p>
                </footer>
            </div>

            {/* Course Viewer Modal with Progressive Steps */}
            {selectedCourse && (
                <div className={styles.modal} onClick={closeViewer}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <button onClick={closeViewer} className={styles.modalBack}>
                                <ChevronLeft size={24} />
                                Volver
                            </button>
                            <h3 className={styles.modalTitle}>
                                {selectedCourse.title || selectedCourse.nombre}
                            </h3>
                        </div>

                        {/* Progress Indicator */}
                        <div className={styles.progressBar}>
                            <div className={styles.progressSteps}>
                                {[1, 2, 3, 4].map(step => {
                                    const currentStep = getCurrentStepNumber(selectedCourse.id);
                                    const isActive = step === currentStep;
                                    const isCompleted = step < currentStep;

                                    return (
                                        <div key={step} className={styles.progressStep}>
                                            <div className={`${styles.progressDot} ${isCompleted ? styles.progressDotCompleted : ''} ${isActive ? styles.progressDotActive : ''}`}>
                                                {isCompleted ? <CheckCircle size={16} /> : step}
                                            </div>
                                            {step < 4 && <div className={`${styles.progressLine} ${isCompleted ? styles.progressLineCompleted : ''}`} />}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className={styles.progressText}>
                                Paso {getCurrentStepNumber(selectedCourse.id)} de 4
                            </div>
                        </div>

                        {/* Steps Container */}
                        <div className={styles.stepsContainer}>
                            {/* STEP 1: Bienvenida */}
                            <div className={`${styles.stepCard} ${!isStepUnlocked(selectedCourse.id, 'step1') ? styles.stepLocked : ''}`}>
                                <div className={styles.stepHeader}>
                                    <div className={styles.stepNumber}>
                                        {courseProgress[selectedCourse.id]?.step1Completed ? (
                                            <CheckCircle size={24} className={styles.stepCheckIcon} />
                                        ) : (
                                            <span>1</span>
                                        )}
                                    </div>
                                    <h4 className={styles.stepTitle}>Bienvenida</h4>
                                </div>

                                {isStepUnlocked(selectedCourse.id, 'step1') && (
                                    <div className={styles.stepContent}>
                                        <p className={styles.stepText}>
                                            Hola <strong>{candidate?.name || candidate?.nombre || 'Candidato'}</strong>,
                                            te damos la bienvenida al curso de <strong>{selectedCourse.title || selectedCourse.nombre}</strong>.
                                            A continuación podrás encontrar información que será de utilidad en tu estancia en Viñoplastic.
                                        </p>

                                        {!courseProgress[selectedCourse.id]?.step1Completed && (
                                            <button
                                                className={styles.stepButton}
                                                onClick={() => markStepComplete(selectedCourse.id, 'step1Completed')}
                                            >
                                                <CheckCircle size={18} />
                                                Marcar como completado
                                            </button>
                                        )}

                                        {courseProgress[selectedCourse.id]?.step1Completed && (
                                            <div className={styles.stepCompleted}>
                                                <CheckCircle size={18} />
                                                Completado
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* STEP 2: Presentación */}
                            <div className={`${styles.stepCard} ${!isStepUnlocked(selectedCourse.id, 'presentation') ? styles.stepLocked : ''}`}>
                                <div className={styles.stepHeader}>
                                    <div className={styles.stepNumber}>
                                        {courseProgress[selectedCourse.id]?.presentationCompleted ? (
                                            <CheckCircle size={24} className={styles.stepCheckIcon} />
                                        ) : isStepUnlocked(selectedCourse.id, 'presentation') ? (
                                            <BookOpen size={24} />
                                        ) : (
                                            <span>🔒</span>
                                        )}
                                    </div>
                                    <h4 className={styles.stepTitle}>Presentación del Curso</h4>
                                </div>

                                {!isStepUnlocked(selectedCourse.id, 'presentation') && (
                                    <p className={styles.stepLockedText}>Completa el paso anterior para desbloquear</p>
                                )}

                                {isStepUnlocked(selectedCourse.id, 'presentation') && (
                                    <div className={styles.stepContent}>
                                        <div className={styles.viewerContainer}>
                                            {selectedCourse.material || selectedCourse.contenidoUrl ? (
                                                <LazyIframe
                                                    src={convertDriveUrl(selectedCourse) || selectedCourse.contenidoUrl}
                                                    title={selectedCourse.title || selectedCourse.nombre}
                                                    className={styles.iframe}
                                                />
                                            ) : (
                                                <div className={styles.noContent}>
                                                    <p>No hay contenido disponible para este curso</p>
                                                </div>
                                            )}
                                        </div>

                                        {!courseProgress[selectedCourse.id]?.presentationCompleted && (
                                            <button
                                                className={styles.stepButton}
                                                onClick={() => markStepComplete(selectedCourse.id, 'presentationCompleted')}
                                            >
                                                <CheckCircle size={18} />
                                                Marcar como finalizado
                                            </button>
                                        )}

                                        {courseProgress[selectedCourse.id]?.presentationCompleted && (
                                            <div className={styles.stepCompleted}>
                                                <CheckCircle size={18} />
                                                Finalizado
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* STEP 3: Instrucciones de Examen */}
                            <div className={`${styles.stepCard} ${!isStepUnlocked(selectedCourse.id, 'step2') ? styles.stepLocked : ''}`}>
                                <div className={styles.stepHeader}>
                                    <div className={styles.stepNumber}>
                                        {courseProgress[selectedCourse.id]?.step2Completed ? (
                                            <CheckCircle size={24} className={styles.stepCheckIcon} />
                                        ) : isStepUnlocked(selectedCourse.id, 'step2') ? (
                                            <span>2</span>
                                        ) : (
                                            <span>🔒</span>
                                        )}
                                    </div>
                                    <h4 className={styles.stepTitle}>Instrucciones</h4>
                                </div>

                                {!isStepUnlocked(selectedCourse.id, 'step2') && (
                                    <p className={styles.stepLockedText}>Completa el paso anterior para desbloquear</p>
                                )}

                                {isStepUnlocked(selectedCourse.id, 'step2') && (
                                    <div className={styles.stepContent}>
                                        <p className={styles.stepText}>
                                            Descarga el examen y anota tus respuestas, que ocuparás el primer día de trabajo en planta.
                                        </p>

                                        {!courseProgress[selectedCourse.id]?.step2Completed && (
                                            <button
                                                className={styles.stepButton}
                                                onClick={() => markStepComplete(selectedCourse.id, 'step2Completed')}
                                            >
                                                <CheckCircle size={18} />
                                                Marcar como completado
                                            </button>
                                        )}

                                        {courseProgress[selectedCourse.id]?.step2Completed && (
                                            <div className={styles.stepCompleted}>
                                                <CheckCircle size={18} />
                                                Completado
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* STEP 4: Examen */}
                            <div className={`${styles.stepCard} ${!isStepUnlocked(selectedCourse.id, 'exam') ? styles.stepLocked : ''}`}>
                                <div className={styles.stepHeader}>
                                    <div className={styles.stepNumber}>
                                        {courseProgress[selectedCourse.id]?.examDownloaded ? (
                                            <CheckCircle size={24} className={styles.stepCheckIcon} />
                                        ) : isStepUnlocked(selectedCourse.id, 'exam') ? (
                                            <FileText size={24} />
                                        ) : (
                                            <span>🔒</span>
                                        )}
                                    </div>
                                    <h4 className={styles.stepTitle}>Examen</h4>
                                </div>

                                {!isStepUnlocked(selectedCourse.id, 'exam') && (
                                    <p className={styles.stepLockedText}>Completa el paso anterior para desbloquear</p>
                                )}

                                {isStepUnlocked(selectedCourse.id, 'exam') && (selectedCourse.examenUrl || (selectedCourse.material?.type === 'document' && selectedCourse.material?.url)) && (
                                    <div className={styles.stepContent}>
                                        <p className={styles.stepText}>
                                            Descarga el examen y respóndelo para completar el curso, o realízalo digitalmente.
                                        </p>

                                        {/* Digital Exam Option */}
                                        {(selectedCourse.title?.toUpperCase().includes('INDUCCIÓN A LA EMPRESA') || selectedCourse.nombre?.toUpperCase().includes('INDUCCIÓN A LA EMPRESA')) && (
                                            <button
                                                className={styles.stepButtonPrimary}
                                                onClick={() => setShowExamModal(true)}
                                                style={{ marginBottom: '12px', width: '100%', background: 'var(--color-primary)', color: 'white', border: 'none' }}
                                            >
                                                📝 Realizar Examen Digital
                                            </button>
                                        )}

                                        <button
                                            className={styles.stepButtonPrimary}
                                            onClick={() => downloadExam(selectedCourse)}
                                            style={{ background: 'transparent', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
                                        >
                                            <FileText size={18} />
                                            Descargar Examen (PDF)
                                        </button>

                                        {courseProgress[selectedCourse.id]?.examDownloaded && (
                                            <div className={styles.stepCompleted}>
                                                <CheckCircle size={18} />
                                                Examen descargado - Curso completado
                                            </div>
                                        )}
                                    </div>
                                )}

                                {isStepUnlocked(selectedCourse.id, 'exam') && !selectedCourse.examenUrl && !(selectedCourse.material?.type === 'document' && selectedCourse.material?.url) && (
                                    <div className={styles.stepContent}>
                                        <p className={styles.stepText}>No hay examen disponible para este curso.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Data Center Drawer */}
            <Drawer open={!!selectedDataCenterItem} onOpenChange={(open) => !open && setSelectedDataCenterItem(null)}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>{selectedDataCenterItem?.title}</DrawerTitle>
                        <DrawerDescription>{selectedDataCenterItem?.desc}</DrawerDescription>
                    </DrawerHeader>
                    <div className={styles.drawerBodyContent}>
                        <div style={{ padding: '24px', textAlign: 'center', color: '#8e8e93' }}>
                            <div style={{ marginBottom: '16px', display: 'inline-block', padding: '16px', background: 'rgba(0,122,255,0.1)', borderRadius: '50%' }}>
                                <FileText size={48} color="#007aff" />
                            </div>
                            <div style={{ marginBottom: '24px', fontSize: '16px', lineHeight: '1.5' }}>
                                {selectedDataCenterItem?.content}
                            </div>
                            {selectedDataCenterItem?.id !== 'dresscode' && selectedDataCenterItem?.id !== 'rules' && (
                                <button className={styles.welcomeButton}>
                                    <Download size={20} />
                                    Descargar PDF
                                </button>
                            )}
                        </div>
                    </div>
                    <DrawerFooter>
                        <DrawerClose asChild>
                            <button className={styles.stepButton}>Cerrar</button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

            {/* Exam Modal */}
            {showExamModal && (
                <ExamModal
                    isOpen={showExamModal}
                    onClose={() => setShowExamModal(false)}
                    examData={examData}
                    onSubmit={handleExamSubmit}
                />
            )}
        </div>
    );
}

// --- EXAM MODAL COMPONENT ---
function ExamModal({ isOpen, onClose, examData, onSubmit }) {
    const [answers, setAnswers] = useState({});
    const [step, setStep] = useState(0); // 0: Intro, 1...N: Questions, 99: Result
    const [score, setScore] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen || !examData) return null;

    const questions = examData.cuestionario || [];
    const totalQuestions = questions.length;

    const handleOptionSelect = (questionId, option) => {
        setAnswers(prev => ({ ...prev, [questionId]: option }));
    };

    const handleNext = () => {
        if (step < totalQuestions) {
            setStep(prev => prev + 1);
        } else {
            // Calculate Score
            let correctCount = 0;
            questions.forEach(q => {
                if (answers[q.id] === q.respuesta) {
                    correctCount++;
                }
            });
            const finalScore = (correctCount / totalQuestions) * 100;
            setScore(finalScore);
            handleSubmit(finalScore);
        }
    };

    const handleSubmit = async (finalScore) => {
        setSubmitting(true);
        await onSubmit(finalScore, answers);
        setSubmitting(false);
        setStep(99); // Show Result
    };

    return (
        <div className={styles.modal} style={{ zIndex: 1100 }}>
            <div className={`${styles.modalContent} ${styles.examContainer}`}>
                <div className={styles.modalHeader}>
                    <button onClick={onClose} className={styles.modalBack}>
                        <ChevronLeft size={24} />
                        Cancelar
                    </button>
                    <h3 className={styles.modalTitle}>Examen</h3>
                    <div style={{ width: 40 }}></div>
                </div>

                <div className={styles.examBody}>
                    {step === 0 && (
                        <div style={{ textAlign: 'center' }}>
                            <h2 className={styles.examTitle}>{examData.exámen?.courseName || 'Examen de Inducción'}</h2>
                            <p className={styles.examDescription}>
                                Este examen consta de {totalQuestions} preguntas. Debes responderlas todas para completar tu inducción.
                                Necesitas una calificación mínima de 70% para aprobar.
                            </p>
                            <button className={styles.stepButtonPrimary} onClick={() => setStep(1)} style={{ width: '100%', justifyContent: 'center' }}>
                                Comenzar Examen
                            </button>
                        </div>
                    )}

                    {step > 0 && step <= totalQuestions && (
                        <div>
                            <div className={styles.examMeta}>
                                <span>Pregunta {step} de {totalQuestions}</span>
                                <span>{Math.round(((step - 1) / totalQuestions) * 100)}%</span>
                            </div>
                            <div className={styles.examProgressBar}>
                                <div className={styles.examProgressFill} style={{ width: `${((step - 1) / totalQuestions) * 100}%` }}></div>
                            </div>

                            <h3 className={styles.questionText}>{questions[step - 1].pregunta}</h3>

                            <div className={styles.optionsContainer}>
                                {questions[step - 1].opciones.map((opt, idx) => (
                                    <label key={idx} className={`${styles.optionLabel} ${answers[questions[step - 1].id] === opt ? styles.optionLabelSelected : ''}`}>
                                        <input
                                            type="radio"
                                            name={`q-${questions[step - 1].id}`}
                                            value={opt}
                                            checked={answers[questions[step - 1].id] === opt}
                                            onChange={() => handleOptionSelect(questions[step - 1].id, opt)}
                                            className={styles.radioInput}
                                        />
                                        <span className={styles.optionText}>{opt}</span>
                                    </label>
                                ))}
                            </div>

                            <div style={{ marginTop: '32px' }}>
                                <button
                                    className={styles.stepButtonPrimary}
                                    onClick={handleNext}
                                    disabled={!answers[questions[step - 1].id]}
                                    style={{ width: '100%', justifyContent: 'center', opacity: !answers[questions[step - 1].id] ? 0.5 : 1 }}
                                >
                                    {step === totalQuestions ? 'Finalizar Examen' : 'Siguiente Pregunta'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 99 && (
                        <div className={styles.resultContainer}>
                            <div className={styles.resultEmoji}>{score >= 70 ? '🎉' : '⚠️'}</div>
                            <h2 className={styles.resultTitle}>{score >= 70 ? '¡Felicidades!' : 'Inténtalo de nuevo'}</h2>
                            <p className={styles.resultScore}>
                                Tu calificación: <strong className={score >= 70 ? styles.scoreHigh : styles.scoreLow}>{score.toFixed(1)}%</strong>
                            </p>

                            <p className={styles.resultText}>
                                {score >= 70
                                    ? 'Has aprobado el examen de inducción correctamente. Se ha registrado tu avance.'
                                    : 'Necesitas un mínimo de 70% para aprobar. Por favor, repasa el material e inténtalo nuevamente.'}
                            </p>

                            <button
                                className={styles.stepButtonPrimary}
                                onClick={onClose}
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {score >= 70 ? 'Finalizar y Cerrar' : 'Cerrar'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
