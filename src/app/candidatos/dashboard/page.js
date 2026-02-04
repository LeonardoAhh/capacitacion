'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
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

    useEffect(() => {
        // Verificar sesión
        const session = sessionStorage.getItem('candidate_session');
        if (!session) {
            router.push('/candidatos');
            return;
        }

        const candidateData = JSON.parse(session);
        setCandidate(candidateData);

        // Cargar cursos
        // Usar .position que es el campo normalizado en el login, o .puesto como fallback
        const positionToLoad = candidateData.position || candidateData.puesto;
        if (positionToLoad && positionToLoad !== 'N/A') {
            loadCourses(positionToLoad);
        } else {
            setLoading(false);
        }

        // Session Timeout Logic (4 hours)
        const TIMEOUT_DURATION = 4 * 60 * 60 * 1000;

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
                    return;
                }
                setTimeLeft(remaining);
            }, 1000);

            // Timeout real para cerrar sesión
            timeoutId = setTimeout(() => {
                sessionStorage.removeItem('candidate_session');
                router.push('/candidatos');
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
    }, [router]);

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

    const handleLogout = async () => {
        try {
            // Cerrar sesión de Firebase Auth
            await signOut(auth);
            // Limpiar sessionStorage
            sessionStorage.removeItem('candidate_session');
            // Redirigir al login
            router.push('/candidatos');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            // Aún así limpiar y redirigir
            sessionStorage.removeItem('candidate_session');
            router.push('/candidatos');
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

        // Si es un enlace directo de Google Drive
        if (course.material.type === 'link' && course.material.url) {
            const fileId = course.material.url.match(/\/d\/([^\/]+)/)?.[1];
            if (fileId) {
                return `https://drive.google.com/file/d/${fileId}/preview`;
            }
            return course.material.url;
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
            markStepComplete(course.id, 'examDownloaded');
        }
    };

    // Progress tracking functions
    const markStepComplete = (courseId, step) => {
        setCourseProgress(prev => ({
            ...prev,
            [courseId]: {
                ...prev[courseId],
                [step]: true
            }
        }));
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
            <div className={styles.welcomeScreen}>
                <div className={styles.welcomeCard}>
                    <div className={styles.welcomeIcon}>
                        <Sparkles size={48} />
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
                                <li>Solo tienes <strong>3 inicios de sesión</strong> disponibles</li>
                                <li>Puedes descargar el examen y contestarlo o solo anotar las respuestas</li>
                                <li>Presenta tus respuestas en tu primer día de trabajo</li>
                                <li>Si agotaste tus 3 intentos, contacta a Recursos Humanos para obtener un nuevo código</li>
                            </ul>
                        </div>
                    </div>

                    <div className={styles.welcomeInfo}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Tu puesto:</span>
                            <span className={styles.infoValue}>{candidate?.position || candidate?.puesto || 'N/A'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Área:</span>
                            <span className={styles.infoValue}>{candidate?.area || 'N/A'}</span>
                        </div>
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
                            <User size={48} />
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
                                            {isCompleted && (
                                                <span className={styles.completedTag}>Completado</span>
                                            )}
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
                                                    allow="autoplay"
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
