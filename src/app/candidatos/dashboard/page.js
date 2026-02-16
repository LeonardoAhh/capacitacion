'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, setDoc, getDoc, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from '@/contexts/ThemeContext';

// Components
import { BackgroundLines } from '@/components/ui/BackgroundLines/BackgroundLines';
import SetupWizard from '@/components/SetupWizard/SetupWizard';
import AvatarSelector from '@/components/AvatarSelector/AvatarSelector';
import ThemeSelectorModal from '@/components/ThemeSelectorModal/ThemeSelectorModal';
import PWAPrompt from '@/components/PWAPrompt/PWAPrompt';
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
import ModernPillNavbar from './components/ModernPillNavbar';
import SupportButton from './components/SupportButton';

// Hooks & Utils
import { useCandidateSession, useCourseProgress } from './hooks';
import { useCandidateData } from '@/hooks/useCandidateData';
import { ONE_MINUTE_MS, FIVE_MINUTES_MS, TIMER_COLORS } from './config/constants'; // Adjusted path if needed, or use existing utils

import { extractFirstName, getCandidatePhotoUrl } from './utils/helpers';
import induccionEmpresaExam from '../../../../public/examenes/induccion_empresa.json';

import { THEME_COLORS } from './config/themeColors';
import styles from './page.module.css';

export default function CandidatoDashboard() {
    const router = useRouter();
    const { toggleTheme } = useTheme();

    // New Hook Integration
    const { candidate, loading, setCandidate, updateTheme, updateAvatar, updateNickname } = useCandidateData();

    // Local UI State
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showWelcome, setShowWelcome] = useState(false); // Changed default to false, controlled by logic below
    const [courseProgress, setCourseProgress] = useState({});
    const [showExamModal, setShowExamModal] = useState(false);
    const [examData, setExamData] = useState(induccionEmpresaExam);

    // Customization UI State
    const [showSetupWizard, setShowSetupWizard] = useState(false);
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [showThemeSelector, setShowThemeSelector] = useState(false);

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

    // Effect: Check for Setup Wizard / Welcome
    useEffect(() => {
        if (candidate && !loading) {
            const hasSeenSetup = sessionStorage.getItem(`candidate_setup_${candidate.id}`);

            // If user has a nickname, assume setup is done (or if they've seen it)
            if (candidate.nickname && candidate.nickname.trim() !== '') {
                if (!hasSeenSetup) {
                    sessionStorage.setItem(`candidate_setup_${candidate.id}`, 'true');
                }

                // Show Welcome Screen if not seen in this session
                // Using a session-based key for welcome screen to show it once per login
                const hasSeenWelcome = sessionStorage.getItem(`candidate_welcome_${candidate.id}`);
                if (!hasSeenWelcome) {
                    setShowWelcome(true);
                }
            } else if (!hasSeenSetup) {
                // No nickname and hasn't seen setup -> Show Wizard
                setShowSetupWizard(true);
            } else {
                // Fallback
                const hasSeenWelcome = sessionStorage.getItem(`candidate_welcome_${candidate.id}`);
                if (!hasSeenWelcome) {
                    setShowWelcome(true);
                }
            }

            // Load Courses logic moved here dependent on candidate
            const positionToLoad = candidate.position || candidate.puesto;
            if (positionToLoad && positionToLoad !== 'N/A') {
                loadCourses(positionToLoad);
            }

            if (candidate.coursesProgress) {
                setCourseProgress(candidate.coursesProgress);
            }
        }
    }, [candidate, loading]);

    // Timer Logic Integration
    useEffect(() => {
        if (loading || !candidate) return;

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
    }, [router, handleLogout, loading, candidate]);

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

                    // Firestore 'in' supports max 30 values — split into chunks
                    const chunkSize = 30;
                    const chunks = [];
                    for (let i = 0; i < requiredCourses.length; i += chunkSize) {
                        chunks.push(requiredCourses.slice(i, i + chunkSize));
                    }

                    const allResults = await Promise.all(
                        chunks.map(chunk =>
                            getDocs(query(inductionRef, where('title', 'in', chunk)))
                        )
                    );

                    coursesData = allResults.flatMap(snapshot =>
                        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    );

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
        } catch (error) {
            console.error('Error loading courses:', error);
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
                onStart={() => {
                    setShowWelcome(false);
                    if (candidate?.id) {
                        sessionStorage.setItem(`candidate_welcome_${candidate.id}`, 'true');
                    }
                }}
            />
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.backgroundGradient} />

            <div className={styles.shapesContainer}>
                <BackgroundLines colors={THEME_COLORS[candidate?.theme] || THEME_COLORS.light} />
            </div>

            <AvatarSelector
                isOpen={showAvatarSelector}
                onClose={() => setShowAvatarSelector(false)}
                onSave={updateAvatar}
                userName={candidate?.nickname || candidate?.name} // Use nickname if available
            />

            <SetupWizard
                isOpen={showSetupWizard}
                onClose={() => {
                    setShowSetupWizard(false);
                    sessionStorage.setItem(`candidate_setup_${candidate.id}`, 'true');
                    setShowWelcome(true);
                }}
                user={candidate}
                onUpdateAvatar={updateAvatar}
                onUpdateTheme={updateTheme}
                onUpdateNickname={updateNickname}
            />

            <PWAPrompt />

            <ThemeSelectorModal
                isOpen={showThemeSelector}
                onClose={() => setShowThemeSelector(false)}
                currentTheme={candidate?.theme || 'light'}
                onSelectTheme={updateTheme}
            />

            <nav className={styles.navbar}>
                <div className={styles.navActions}>
                    <ModernPillNavbar
                        candidate={candidate}
                        onLogout={handleLogout}
                        timeLeft={Math.floor(timeLeft / 1000)}
                        toggleTheme={toggleTheme}
                        onAvatarClick={() => setShowAvatarSelector(true)}
                        onThemeClick={() => setShowThemeSelector(true)}
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
