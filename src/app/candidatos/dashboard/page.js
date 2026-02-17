'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from '@/contexts/ThemeContext';
import { destroySession } from '@/lib/sessionApi';

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
import { DashboardSkeleton, useToast } from './components';
import ModernPillNavbar from './components/ModernPillNavbar';
import SupportButton from './components/SupportButton';

import { useCandidateSession, useCourseProgress, useSessionTimer } from './hooks';
import { useCandidateData } from '@/hooks/useCandidateData';
import { loadCoursesForPosition } from './services/courseService';
import induccionEmpresaExam from '../../../../public/examenes/induccion_empresa.json';

import styles from './page.module.css';

export default function CandidatoDashboard() {
    const router = useRouter();
    const { toggleTheme } = useTheme();

    const { candidate, loading, setCandidate, updateTheme, updateAvatar, updateNickname } = useCandidateData();

    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [courseProgress, setCourseProgress] = useState({});
    const [showExamModal, setShowExamModal] = useState(false);
    const [examData, setExamData] = useState(induccionEmpresaExam);

    const [showSetupWizard, setShowSetupWizard] = useState(false);
    const [showAvatarSelector, setShowAvatarSelector] = useState(false);
    const [showThemeSelector, setShowThemeSelector] = useState(false);

    const handleLogout = useCallback(async () => {
        try {
            await destroySession();
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

    const { timeLeft } = useSessionTimer({
        enabled: !loading && !!candidate,
        onExpire: handleLogout,
    });

    useEffect(() => {
        if (candidate && !loading) {
            const hasSeenSetup = sessionStorage.getItem(`candidate_setup_${candidate.id}`);

            if (candidate.nickname && candidate.nickname.trim() !== '') {
                if (!hasSeenSetup) {
                    sessionStorage.setItem(`candidate_setup_${candidate.id}`, 'true');
                }
                const hasSeenWelcome = sessionStorage.getItem(`candidate_welcome_${candidate.id}`);
                if (!hasSeenWelcome) {
                    setShowWelcome(true);
                }
            } else if (!hasSeenSetup) {
                setShowSetupWizard(true);
            } else {
                const hasSeenWelcome = sessionStorage.getItem(`candidate_welcome_${candidate.id}`);
                if (!hasSeenWelcome) {
                    setShowWelcome(true);
                }
            }

            const positionToLoad = candidate.position || candidate.puesto;
            if (positionToLoad && positionToLoad !== 'N/A') {
                loadCoursesForPosition(positionToLoad)
                    .then(setCourses)
                    .catch(err => console.error('Error loading courses:', err));
            }

            if (candidate.coursesProgress) {
                setCourseProgress(candidate.coursesProgress);
            }
        }
    }, [candidate, loading]);

    const {
        markStepComplete,
        isStepUnlocked,
        getCurrentStepNumber,
        handleExamSubmit: handleExamSubmitProgress
    } = useCourseProgress({ candidate, setCourseProgress, setCandidate, courseProgress });

    const handleExamModalSubmit = async (finalScore, answers) => {
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
            <div className={styles.page}>
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
        <div className={styles.page}>
            <AvatarSelector
                isOpen={showAvatarSelector}
                onClose={() => setShowAvatarSelector(false)}
                onSave={updateAvatar}
                userName={candidate?.nickname || candidate?.name}
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
                <ModernPillNavbar
                    candidate={candidate}
                    onLogout={handleLogout}
                    timeLeft={Math.floor(timeLeft / 1000)}
                    toggleTheme={toggleTheme}
                    onAvatarClick={() => setShowAvatarSelector(true)}
                    onThemeClick={() => setShowThemeSelector(true)}
                />
            </nav>

            <div className={styles.scrollContent}>
                <ImportantInfoCards />

                <div className={styles.desktopGrid}>
                    <div className={styles.mainColumn}>
                        <RoadmapTimeline />
                        <ContactInfo />
                    </div>
                    <div className={styles.sideColumn}>
                        <DataCenter />
                        <GeneralInfo candidate={candidate} />
                    </div>
                </div>

                <CoursesGrid
                    courses={courses}
                    candidate={candidate}
                    onViewCourse={setSelectedCourse}
                    onToggleCompletion={toggleCourseCompletion}
                />

                <footer className={styles.footer}>
                    <p>ViñoPlastic Inyección S.A. de C.V.</p>
                    <p>Portal de Inducción</p>
                </footer>
            </div>

            {selectedCourse && (
                <CourseViewer
                    selectedCourse={selectedCourse}
                    onClose={() => setSelectedCourse(null)}
                    candidate={candidate}
                    courseProgress={courseProgress}
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
