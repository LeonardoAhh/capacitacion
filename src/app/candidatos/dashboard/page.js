'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { BookOpen, FileText, LogOut, CheckCircle, Clock, Sparkles, ArrowRight, ChevronRight, User, ChevronLeft, Contrast, HelpCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './page.module.css';

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

    // Logout handler (declared before useEffect that uses it)
    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            sessionStorage.removeItem('candidate_session');
            router.push('/candidatos');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            sessionStorage.removeItem('candidate_session');
            router.push('/candidatos');
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

        // Session Timeout Logic (2 hours)
        const TIMEOUT_DURATION = 2 * 60 * 60 * 1000;

        let timeoutId;
        let intervalId;

        // Iniciar timer visual
        const startTimer = () => {
            const startTime = Date.now();
            const endTime = startTime + TIMEOUT_DURATION;

            // Limpiar anteriores
            if (timeoutId) clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);

            // Actualizar cuenta regresiva
            intervalId = setInterval(() => {
                const remaining = endTime - Date.now();
                if (remaining <= 0) {
                    clearInterval(intervalId);
                    setTimeLeft(0);
                    handleLogout(); // Ensure logout is called
                    return;
                }
                setTimeLeft(remaining);
            }, 1000);

            // Timeout real para cerrar sesión
            timeoutId = setTimeout(() => {
                handleLogout(); // Use handleLogout for consistency
            }, TIMEOUT_DURATION);

            // Resetear estado visual
            setTimeLeft(TIMEOUT_DURATION);
        };

        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        const resetTimer = () => {
            startTimer();
        };

        events.forEach(event => document.addEventListener(event, resetTimer));

        startTimer(); // Iniciar al montar

        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (intervalId) clearInterval(intervalId);
            events.forEach(event => document.removeEventListener(event, resetTimer));
        };
    }, [router, handleLogout]);

    // Timer State and Helpers
    const [timeLeft, setTimeLeft] = useState(30 * 60 * 1000);

    const formatTime = (ms) => {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const getTimerColor = () => {
        if (timeLeft < 60 * 1000) return '#ef4444'; // Rojo (último minuto)
        if (timeLeft < 5 * 60 * 1000) return '#f59e0b'; // Naranja (últimos 5 min)
        return 'inherit';
    };


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



    const viewCourse = (course) => {
        setSelectedCourse(course);
    };

    const closeViewer = () => {
        setSelectedCourse(null);
    };

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

            // Use setDoc with merge to ensure the 'coursesProgress' map is created if it doesn't exist
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
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>Cargando cursos...</p>
            </div>
        );
    }

    // Pantalla de Bienvenida
    if (showWelcome) {
        return (
            <div className={styles.welcomeOverlay}>
                <div className={styles.welcomeCard}>
                    {/* Welcome Header */}
                    <div className={styles.welcomeHeader}>
                        <div className={styles.welcomeAvatar}>
                            {(candidate?.photoUrl || candidate?.photoURL || candidate?.photo || candidate?.foto) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={candidate.photoUrl || candidate.photoURL || candidate.photo || candidate.foto}
                                    alt="Foto de perfil"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                />
                            ) : (
                                <User size={64} />
                            )}
                        </div>
                    </div>

                    <h1 className={styles.welcomeTitle}>
                        ¡Bienvenido a <span>ViñoPlastic</span>!
                    </h1>

                    <p className={styles.welcomeSubtitle}>
                        {candidate?.name || candidate?.nombre || 'Nuevo Colaborador'}
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



                    {/* Help Section */}
                    <div className={styles.welcomeHelp}>
                        <div className={styles.welcomeHelpContent}>
                            <h3 className={styles.welcomeHelpTitle}>Información Importante</h3>
                            <ul className={styles.welcomeHelpList}>
                                <li>Solo tienes <strong>5 inicios de sesión</strong> disponibles</li>
                                <li>Puedes descargar el examen y contestarlo o solo anotar las respuestas</li>
                                <li>Presenta tus respuestas en tu primer día de trabajo</li>
                                <li>Si agotaste tus 5 oportunidades, contacta a Recursos Humanos para obtener un nuevo código</li>
                            </ul>
                        </div>
                    </div>

                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Puesto:</span>
                            <span className={styles.infoValue}>{candidate?.position || 'N/A'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Área:</span>
                            <span className={styles.infoValue}>{candidate?.area || 'N/A'}</span>
                        </div>

                        <button
                            className={styles.welcomeButton}
                            onClick={() => setShowWelcome(false)}
                        >
                            <span>Iniciar Cursos de Inducción</span>
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* iOS Navigation Bar */}
            <nav className={styles.navbar}>
                <button onClick={handleLogout} className={styles.navBack}>
                    <ChevronLeft size={24} />
                    <span>Salir</span>
                </button>
                <h1 className={styles.navTitle}>Mi Perfil</h1>
                <div className={styles.navActions}>
                    <div className={styles.navTimer} style={{ color: getTimerColor() }}>
                        <Clock size={14} />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={styles.themeButton}
                        aria-label="Cambiar tema"
                    >
                        <Contrast size={20} />
                    </button>
                </div>
            </nav>

            {/* Scrollable Content */}
            <div className={styles.scrollContent}>
                {/* Profile Section */}
                <section className={styles.profileSection}>
                    <div className={styles.avatarContainer}>
                        <div className={styles.avatar}>
                            {(candidate?.photoUrl || candidate?.photoURL || candidate?.photo || candidate?.foto) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={candidate.photoUrl || candidate.photoURL || candidate.photo || candidate.foto}
                                    alt="Foto de perfil"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                />
                            ) : (
                                <User size={48} />
                            )}
                        </div>
                    </div>
                    <h2 className={styles.profileName}>
                        {candidate?.name || candidate?.nombre || 'Candidato'}
                    </h2>
                    <p className={styles.profilePosition}>
                        {candidate?.position || candidate?.puesto || 'Nuevo Ingreso'}
                    </p>
                </section>

                {/* Info Section */}
                <section className={styles.menuSection}>
                    <div className={styles.menuGroup}>
                        <div className={styles.menuItem}>
                            <span className={styles.menuLabel}>ID Empleado</span>
                            <span className={styles.menuValue}>{candidate?.employeeId}</span>
                        </div>
                        <div className={styles.menuItem}>
                            <span className={styles.menuLabel}>CURP</span>
                            <span className={styles.menuValue}>{candidate?.curp}</span>
                        </div>
                        <div className={styles.menuItem}>
                            <span className={styles.menuLabel}>Área</span>
                            <span className={styles.menuValue}>{candidate?.area}</span>
                        </div>
                        <div className={styles.menuItem}>
                            <span className={styles.menuLabel}>Departamento</span>
                            <span className={styles.menuValue}>{candidate?.department}</span>
                        </div>
                        <div className={styles.menuItem}>
                            <span className={styles.menuLabel}>Turno</span>
                            <span className={styles.menuValue}>{candidate?.shift}</span>
                        </div>
                        <div className={styles.menuItem}>
                            <span className={styles.menuLabel}>Fecha de Ingreso</span>
                            <span className={styles.menuValue}>{candidate?.startdate}</span>
                        </div>
                    </div>
                </section>

                {/* Courses Section */}
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
                        <div className={styles.menuGroup}>
                            {courses.map((course) => {
                                const isCompleted = candidate?.cursosCompletados?.includes(course.id);

                                return (
                                    <div
                                        key={course.id}
                                        className={styles.courseItem}
                                        onClick={() => viewCourse(course)}
                                    >
                                        <div className={`${styles.courseIcon} ${isCompleted ? styles.courseIconCompleted : ''}`}>
                                            {isCompleted ? (
                                                <CheckCircle size={24} />
                                            ) : (
                                                <BookOpen size={24} />
                                            )}
                                        </div>
                                        <div className={styles.courseContent}>
                                            <span className={styles.courseTitle}>
                                                {course.title || course.nombre}
                                            </span>
                                            {course.duration && (
                                                <span className={styles.courseDuration}>
                                                    {course.duration} min
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.courseActions}>
                                            <button
                                                className={isCompleted ? styles.btnCompleted : styles.btnMarkComplete}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleCourseCompletion(course.id, !isCompleted);
                                                }}
                                            >
                                                {isCompleted ? 'Completado' : 'Marcar como Completado'}
                                            </button>
                                            <ChevronRight size={20} className={styles.chevron} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* Exams Section - DESHABILITADA: Ahora los exámenes son parte del flujo de pasos progresivos */}
                {/* {courses.some(c => c.examenUrl || (c.material?.type === 'document' && c.material?.url)) && (
                    <section className={styles.menuSection}>
                        <h3 className={styles.sectionHeader}>Exámenes</h3>
                        <div className={styles.menuGroup}>
                            {courses.filter(c => c.examenUrl || (c.material?.type === 'document' && c.material?.url)).map((course) => (
                                <div
                                    key={`exam-${course.id}`}
                                    className={styles.courseItem}
                                    onClick={() => downloadExam(course)}
                                >
                                    <div className={styles.examIcon}>
                                        <FileText size={24} />
                                    </div>
                                    <div className={styles.courseContent}>
                                        <span className={styles.courseTitle}>
                                            Examen: {course.title || course.nombre}
                                        </span>
                                        <span className={styles.courseDuration}>
                                            Descargar PDF
                                        </span>
                                    </div>
                                    <ChevronRight size={20} className={styles.chevron} />
                                </div>
                            ))}
                        </div>
                    </section>
                )} */}

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
                                                <iframe
                                                    src={convertDriveUrl(selectedCourse) || selectedCourse.contenidoUrl}
                                                    className={styles.iframe}
                                                    title={selectedCourse.title || selectedCourse.nombre}
                                                    allow="autoplay; fullscreen"
                                                    allowFullScreen
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
                                            Descarga el examen y respóndelo para completar el curso.
                                        </p>

                                        <button
                                            className={styles.stepButtonPrimary}
                                            onClick={() => downloadExam(selectedCourse)}
                                        >
                                            <FileText size={18} />
                                            Descargar Examen
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
        </div>
    );
}
