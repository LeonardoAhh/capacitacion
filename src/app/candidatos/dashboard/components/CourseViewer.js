import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, CheckCircle, BookOpen, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './CourseViewer.module.css';
import LazyIframe from '@/components/ui/LazyIframe/LazyIframe';
import { convertDriveUrl } from '../utils/helpers';
import { EXAM_CONFIG } from '../config/constants';

// ─── Animation variants ───────────────────────────────────────────────────────

const BACKDROP_VARIANTS = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } },
};

// Sheet slides up from bottom on mobile, fades+scales on desktop.
const SHEET_VARIANTS = {
    hidden: (mobile) => mobile
        ? { y: '100%', opacity: 1 }
        : { y: 0, opacity: 0, scale: 0.97 },
    visible: (mobile) => ({
        y: 0,
        opacity: 1,
        scale: 1,
        transition: mobile
            ? { type: 'spring', damping: 28, stiffness: 320, mass: 0.9 }
            : { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
    }),
    exit: (mobile) => mobile
        ? { y: '100%', opacity: 1, transition: { type: 'spring', damping: 30, stiffness: 350 } }
        : { y: 0, opacity: 0, scale: 0.97, transition: { duration: 0.18, ease: 'easeIn' } },
};

// Cards stagger in after sheet lands
const CARD_VARIANTS = {
    hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.4,
            delay: 0.15 + i * 0.1,
            ease: [0.22, 1, 0.36, 1],
        },
    }),
};

// ─── StepCard ─────────────────────────────────────────────────────────────────

const StepCard = ({ stepNumber, title, isCompleted, isUnlocked, isLocked, index, children }) => (
    <motion.div
        className={`${styles.stepCard} ${isLocked ? styles.stepLocked : ''}`}
        variants={CARD_VARIANTS}
        custom={index}
        initial="hidden"
        animate="visible"
        aria-disabled={isLocked}
    >
        <div className={styles.stepHeader}>
            <div className={`${styles.stepNumber} ${isCompleted ? styles.stepNumberDone : ''} ${isLocked ? styles.stepNumberLocked : ''}`}>
                {isCompleted ? (
                    <CheckCircle size={22} aria-hidden="true" />
                ) : isLocked ? (
                    <Lock size={18} aria-hidden="true" />
                ) : (
                    <span aria-hidden="true">{stepNumber}</span>
                )}
            </div>
            <h4 className={styles.stepTitle}>{title}</h4>
        </div>

        {isLocked && (
            <p className={styles.stepLockedText} role="status">
                Completa el paso anterior para desbloquear
            </p>
        )}

        {isUnlocked && (
            <div className={styles.stepContent}>
                {children}
            </div>
        )}
    </motion.div>
);

// ─── ProgressBar ──────────────────────────────────────────────────────────────

const ProgressBar = ({ currentStep, totalSteps = 2 }) => (
    <div className={styles.progressBar} role="progressbar" aria-valuenow={currentStep} aria-valuemax={totalSteps}>
        <div className={styles.progressSteps}>
            {Array.from({ length: totalSteps }, (_, i) => {
                const step = i + 1;
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;

                return (
                    <div key={step} className={styles.progressStep}>
                        <motion.div
                            className={`
                                ${styles.progressDot}
                                ${isCompleted ? styles.progressDotCompleted : ''}
                                ${isActive ? styles.progressDotActive : ''}
                            `}
                            animate={isActive ? { scale: 1.12 } : { scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                            {isCompleted ? <CheckCircle size={15} aria-hidden="true" /> : step}
                        </motion.div>

                        {step < totalSteps && (
                            <div className={styles.progressLineTrack}>
                                <motion.div
                                    className={styles.progressLineFill}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: isCompleted ? 1 : 0 }}
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                    style={{ originX: 0 }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
        <p className={styles.progressText}>
            Paso <strong>{currentStep}</strong> de {totalSteps}
        </p>
    </div>
);

// ─── CourseViewer ─────────────────────────────────────────────────────────────

export default function CourseViewer({
    selectedCourse,
    onClose,
    candidate,
    courseProgress,
    isStepUnlocked,
    getCurrentStepNumber,
    markStepComplete,
    onOpenExamModal,
    onDownloadExam,
}) {
    // Safe mobile detection — avoids SSR/hydration mismatch
    const [mobile, setMobile] = useState(true);
    useEffect(() => {
        const check = () => setMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const progress = courseProgress[selectedCourse.id] || {};
    const step1Unlocked = true;
    const presentationUnlocked = isStepUnlocked(courseProgress, selectedCourse.id, 'presentation');
    const currentStep = getCurrentStepNumber(courseProgress, selectedCourse.id);
    const courseTitle = selectedCourse.title || selectedCourse.nombre;
    const candidateName = candidate?.nickname?.trim() || candidate?.name || candidate?.nombre || 'Candidato';

    return (
        <AnimatePresence>
            {selectedCourse && (
                <>
                    {/* ── Backdrop ── */}
                    <motion.div
                        className={styles.backdrop}
                        variants={BACKDROP_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* ── Sheet ── */}
                    <motion.div
                        className={styles.modal}
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Curso: ${courseTitle}`}
                        variants={SHEET_VARIANTS}
                        custom={mobile}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={styles.modalHeader}>
                            <button
                                onClick={onClose}
                                className={styles.modalBack}
                                aria-label="Cerrar y volver"
                            >
                                <ChevronLeft size={22} aria-hidden="true" />
                                <span>Volver</span>
                            </button>
                            <h3 className={styles.modalTitle}>{courseTitle}</h3>
                            {/* Spacer keeps title centered */}
                            <div className={styles.modalBackSpacer} aria-hidden="true" />
                        </div>

                        {/* Progress */}
                        <ProgressBar currentStep={currentStep} totalSteps={2} />

                        {/* Steps */}
                        <div className={styles.stepsContainer}>

                            {/* Step 1 — Bienvenida */}
                            <StepCard
                                index={0}
                                stepNumber={1}
                                title="Bienvenida"
                                isCompleted={progress.step1Completed}
                                isUnlocked={step1Unlocked}
                                isLocked={!step1Unlocked}
                            >
                                <p className={styles.stepText}>
                                    Hola <strong>{candidateName}</strong>, te damos la bienvenida al curso de{' '}
                                    <strong>{courseTitle}</strong>. A continuación podrás encontrar información
                                    que será de utilidad en tu estancia en Viñoplastic.
                                </p>

                                {progress.step1Completed ? (
                                    <div className={styles.stepCompleted} role="status">
                                        <CheckCircle size={18} aria-hidden="true" />
                                        Completado
                                    </div>
                                ) : (
                                    <button
                                        className={styles.stepButton}
                                        onClick={() => markStepComplete(selectedCourse.id, 'step1Completed')}
                                    >
                                        <CheckCircle size={18} aria-hidden="true" />
                                        Marcar como completado
                                    </button>
                                )}
                            </StepCard>

                            {/* Step 2 — Presentación */}
                            <StepCard
                                index={1}
                                stepNumber={2}
                                title="Presentación del Curso"
                                isCompleted={progress.presentationCompleted}
                                isUnlocked={presentationUnlocked}
                                isLocked={!presentationUnlocked}
                            >
                                <div className={styles.viewerContainer}>
                                    {selectedCourse.material || selectedCourse.contenidoUrl ? (
                                        <LazyIframe
                                            src={convertDriveUrl(selectedCourse) || selectedCourse.contenidoUrl}
                                            title={courseTitle}
                                            className={styles.iframe}
                                        />
                                    ) : (
                                        <div className={styles.noContent} role="status">
                                            <BookOpen size={32} className={styles.noContentIcon} aria-hidden="true" />
                                            <p>No hay contenido disponible para este curso</p>
                                        </div>
                                    )}
                                </div>

                                {progress.presentationCompleted ? (
                                    <div className={styles.stepCompleted} role="status">
                                        <CheckCircle size={18} aria-hidden="true" />
                                        Curso Finalizado
                                    </div>
                                ) : (
                                    <button
                                        className={`${styles.stepButton} ${styles.stepButtonPrimary}`}
                                        onClick={() => markStepComplete(selectedCourse.id, 'presentationCompleted')}
                                    >
                                        <CheckCircle size={18} aria-hidden="true" />
                                        Finalizar Curso
                                    </button>
                                )}
                            </StepCard>

                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}