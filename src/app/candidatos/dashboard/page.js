'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, setDoc, getDoc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from '@/contexts/ThemeContext';

// Components
import { BackgroundLines } from '@/components/ui/BackgroundLines/BackgroundLines';
import WelcomeScreen from './components/WelcomeScreen';
import ImportantInfoCards from './components/ImportantInfoCards';
import RoadmapTimeline from './components/RoadmapTimeline';
import ContactInfo from './components/ContactInfo';
import DataCenter from './components/DataCenter';
import GeneralInfo from './components/GeneralInfo';
import CoursesGrid from './components/CoursesGrid';
import CourseViewer from './components/CourseViewer';
import ExamModal from './components/ExamModal';
import { DashboardSkeleton, useToast } from './components'; // Keep existing barrel export if valid, otherwise import direct
import ProfileDropdown from './ProfileDropdown';
import SupportButton from './components/SupportButton';

// Hooks & Utils
import { useCandidateSession, useCourseProgress } from './hooks';
import { ONE_MINUTE_MS, FIVE_MINUTES_MS, TIMER_COLORS } from './config/constants'; // Adjusted path if needed, or use existing utils
import { extractFirstName, getCandidatePhotoUrl } from './utils/helpers';
import induccionEmpresaExam from '../../../../public/examenes/induccion_empresa.json';

import styles from './page.module.css';

export default function CandidatoDashboard() {
    const router = useRouter();
    const { toggleTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [candidate, setCandidate] = useState(null);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showWelcome, setShowWelcome] = useState(true);
    const [courseProgress, setCourseProgress] = useState({});
    const [showExamModal, setShowExamModal] = useState(false);
    const [examData, setExamData] = useState(induccionEmpresaExam);

    // Session Timeout Logic
    const [timeLeft, setTimeLeft] = useState(2 * 60 * 60 * 1000); // 2 hours default

    // Logout handler
    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            sessionStorage.removeItem('candidate_session');
            sessionStorage.removeItem('candidate_session_expiry');
            router.push('/');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            sessionStorage.removeItem('candidate_session');
            router.push('/');
        }
    }, [router]);

    // Initialize Session
    useEffect(() => {
        const session = sessionStorage.getItem('candidate_session');
        if (!session) {
            router.push('/candidatos');
            return;
        }

        const candidateData = JSON.parse(session);
        setCandidate(candidateData);

        // Fetch Fresh Data
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
                    // Update session storage
                    const newSession = { ...candidateData, ...freshData };
                    sessionStorage.setItem('candidate_session', JSON.stringify(newSession));
                }
            } catch (error) {
                console.error("Error loading fresh data:", error);
            }
        };
        fetchFreshData();

        // Load Courses
        const positionToLoad = candidateData.position || candidateData.puesto;
        if (positionToLoad && positionToLoad !== 'N/A') {
            loadCourses(positionToLoad);
        } else {
            setLoading(false);
        }

        // Timer Logic
        const TIMEOUT_DURATION = 2 * 60 * 60 * 1000;
        let intervalId;

        const startTimer = () => {
            let storedExpiry = sessionStorage.getItem('candidate_session_expiry');
            let expiryTime;

            if (storedExpiry) {
                expiryTime = parseInt(storedExpiry, 10);
            } else {
                expiryTime = Date.now() + TIMEOUT_DURATION;
                sessionStorage.setItem('candidate_session_expiry', expiryTime.toString());
            }

            const tick = () => {
                const now = Date.now();
                const remaining = expiryTime - now;

                if (remaining <= 0) {
                    clearInterval(intervalId);
                    setTimeLeft(0);
                    handleLogout();
                    return;
                }
                setTimeLeft(remaining);
            };

            tick();
            intervalId = setInterval(tick, 1000);
        };

        startTimer();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [router, handleLogout]);

    const loadCourses = async (position) => {
        try {
            const positionsRef = collection(db, 'positions');
            const positionQuery = query(positionsRef, where('name', '==', position));
            const positionSnapshot = await getDocs(positionQuery);

            let coursesData = [];

            if (!positionSnapshot.empty) {
                const positionData = positionSnapshot.docs[0].data();
                const requiredCourses = positionData.requiredCourses || [];

                if (requiredCourses.length > 0) {
                    const inductionRef = collection(db, 'induction_courses');
                    const coursesQuery = query(inductionRef, where('title', 'in', requiredCourses));
                    const coursesSnapshot = await getDocs(coursesQuery);

                    coursesData = coursesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // Sort by requiredCourses order
                    coursesData = requiredCourses
                        .map(courseName => coursesData.find(c => c.title === courseName))
                        .filter(Boolean);

                    // Enrich with legacy data (examenUrl)
                    try {
                        const cursosRef = collection(db, 'cursos_induccion');
                        const legacyQuery = query(
                            cursosRef,
                            where('puestosAplicables', 'array-contains', position),
                            where('activo', '==', true)
                        );
                        const legacySnapshot = await getDocs(legacyQuery);
                        const legacyCourseMap = {};
                        legacySnapshot.docs.forEach(doc => {
                            legacyCourseMap[doc.data().nombre] = doc.data();
                        });

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

            // Fallback to legacy
            if (coursesData.length === 0) {
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
                coursesData.sort((a, b) => (a.orden || 0) - (b.orden || 0));
            }

            setCourses(coursesData);
            setLoading(false);
        } catch (error) {
            console.error('Error loading courses:', error);
            setLoading(false);
        }
    };

    // Course Progress Hook
    const {
        markStepComplete,
        isStepUnlocked,
        getCurrentStepNumber,
        handleExamSubmit: handleExamSubmitProgress // renamed to avoid conflict if any, or use directly
    } = useCourseProgress({ candidate, setCourseProgress, setCandidate, courseProgress });

    // Use the hook's handleExamSubmit directly? 
    // Wait, useCourseProgress hook definition in my view (Step 98) showed handleExamSubmit taking `(courseId, courseName, finalScore, answers)`.
    // The `ExamModal` onSubmit expects `(finalScore, answers)`.
    // I need a wrapper.

    const handleExamModalSubmit = async (finalScore, answers) => {
        // Find induction course ID
        const inductionCourse = courses.find(c =>
            c.title?.toUpperCase().includes('INDUCCIÓN A LA EMPRESA') ||
            c.nombre?.toUpperCase().includes('INDUCCIÓN A LA EMPRESA')
        );

        if (inductionCourse) {
            await handleExamSubmitProgress(inductionCourse.id, inductionCourse.title || inductionCourse.nombre, finalScore, answers);
            if (finalScore >= 70) {
                setTimeout(() => setShowExamModal(false), 2000);
            }
        }
    };

    const toggleCourseCompletion = async (courseId, shouldMarkComplete) => {
        if (!candidate?.id) return;

        const currentCompleted = candidate.cursosCompletados || [];
        const newCompleted = shouldMarkComplete
            ? [...currentCompleted, courseId]
            : currentCompleted.filter(id => id !== courseId);

        setCandidate(prev => ({ ...prev, cursosCompletados: newCompleted }));

        try {
            const employeeRef = doc(db, 'employees', candidate.id);
            const updates = {
                cursosCompletados: shouldMarkComplete ? arrayUnion(courseId) : arrayRemove(courseId)
            };

            if (shouldMarkComplete) {
                updates.coursesProgress = {
                    [courseId]: {
                        presentationCompleted: true,
                        examDownloaded: true,
                        step1: true,
                        step2: true,
                        step1Completed: true,
                        step2Completed: true
                    }
                };
            }
            await setDoc(employeeRef, updates, { merge: true });

            // Session update
            const session = JSON.parse(sessionStorage.getItem('candidate_session') || '{}');
            session.cursosCompletados = newCompleted;
            sessionStorage.setItem('candidate_session', JSON.stringify(session));
        } catch (error) {
            console.error("Error updating completion:", error);
            setCandidate(prev => ({ ...prev, cursosCompletados: currentCompleted }));
        }
    };

    const downloadExam = (course) => {
        if (course.examenUrl) {
            window.open(course.examenUrl, '_blank');
            markStepComplete(course.id, 'examDownloaded');
            return;
        }
        if (course.material?.type === 'document' && course.material?.url) {
            window.open(course.material.url, '_blank');
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.backgroundGradient} />
                <DashboardSkeleton />
            </div>
        );
    }

    if (showWelcome) {
        return (
            <WelcomeScreen
                candidate={candidate}
                onStart={() => setShowWelcome(false)}
            />
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.backgroundGradient} />

            <div className={styles.shapesContainer}>
                <BackgroundLines />
            </div>

            <nav className={styles.navbar}>
                <div className={styles.navActions}>
                    <ProfileDropdown
                        candidate={candidate}
                        onLogout={handleLogout}
                        timeLeft={Math.floor(timeLeft / 1000)}
                        toggleTheme={toggleTheme}
                    />
                </div>
            </nav>

            <div className={styles.scrollContent}>
                <ImportantInfoCards className={styles.importantCardsSpacing} />

                <RoadmapTimeline />

                <ContactInfo />

                <DataCenter />

                <GeneralInfo candidate={candidate} />

                <CoursesGrid
                    courses={courses}
                    candidate={candidate}
                    onViewCourse={setSelectedCourse}
                    onToggleCompletion={toggleCourseCompletion}
                />

                <footer className={styles.footer}>
                    <p>ViñoPlastic Inyección S.A. de C.V.</p>
                    <p>Portal de Inducción v2.0</p>
                </footer>
            </div>

            {/* Modals */}
            {selectedCourse && (
                <CourseViewer
                    selectedCourse={selectedCourse}
                    onClose={() => setSelectedCourse(null)}
                    candidate={candidate}
                    courseProgress={courseProgress}
                    // Hooks methods passed down
                    isStepUnlocked={isStepUnlocked}
                    getCurrentStepNumber={getCurrentStepNumber}
                    markStepComplete={markStepComplete}
                    onOpenExamModal={() => setShowExamModal(true)}
                    onDownloadExam={downloadExam}
                />
            )}

            <ExamModal
                isOpen={showExamModal}
                onClose={() => setShowExamModal(false)}
                examData={examData}
                onSubmit={handleExamModalSubmit}
            />


            <SupportButton />
        </div>
    );
}
