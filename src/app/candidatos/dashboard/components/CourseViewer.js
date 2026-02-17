import { ChevronLeft, CheckCircle, BookOpen, Lock } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './CourseViewer.module.css';
import LazyIframe from '@/components/ui/LazyIframe/LazyIframe';
import { convertDriveUrl } from '../utils/helpers';

const StepCard = ({ stepNumber, title, isCompleted, isUnlocked, isLocked, children }) => (
    <div className={`${styles.stepCard} ${isLocked ? styles.stepLocked : ''}`} aria-disabled={isLocked}>
        <div className={styles.stepHeader}>
            <div className={`${styles.stepNumber} ${isCompleted ? styles.stepNumberDone : ''} ${isLocked ? styles.stepNumberLocked : ''}`}>
                {isCompleted ? (
                    <CheckCircle size={20} aria-hidden="true" />
                ) : isLocked ? (
                    <Lock size={16} aria-hidden="true" />
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
    </div>
);

const ProgressBar = ({ currentStep, totalSteps = 2 }) => (
    <div className={styles.progressBar} role="progressbar" aria-valuenow={currentStep} aria-valuemax={totalSteps}>
        <div className={styles.progressSteps}>
            {Array.from({ length: totalSteps }, (_, i) => {
                const step = i + 1;
                const isActive = step === currentStep;
                const isCompleted = step < currentStep;

                return (
                    <div key={step} className={styles.progressStep}>
                        <div className={`
                            ${styles.progressDot}
                            ${isCompleted ? styles.progressDotCompleted : ''}
                            ${isActive ? styles.progressDotActive : ''}
                        `}>
                            {isCompleted ? <CheckCircle size={14} aria-hidden="true" /> : step}
                        </div>

                        {step < totalSteps && (
                            <div className={styles.progressLineTrack}>
                                <div className={styles.progressLineFill} style={{ width: isCompleted ? '100%' : '0' }} />
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
    const progress = courseProgress[selectedCourse.id] || {};
    const step1Unlocked = true;
    const presentationUnlocked = isStepUnlocked(courseProgress, selectedCourse.id, 'presentation');
    const currentStep = getCurrentStepNumber(courseProgress, selectedCourse.id);
    const courseTitle = selectedCourse.title || selectedCourse.nombre;
    const candidateName = candidate?.nickname?.trim() || candidate?.name || candidate?.nombre || 'Candidato';

    return (
        <>
            <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-label={`Curso: ${courseTitle}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <button onClick={onClose} className={styles.modalBack} aria-label="Cerrar y volver">
                        <ChevronLeft size={20} aria-hidden="true" />
                        <span>Volver</span>
                    </button>
                    <h3 className={styles.modalTitle}>{courseTitle}</h3>
                    <div className={styles.modalBackSpacer} aria-hidden="true" />
                </div>

                <ProgressBar currentStep={currentStep} totalSteps={2} />

                <div className={styles.stepsContainer}>
                    <StepCard
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
                                <CheckCircle size={16} aria-hidden="true" />
                                Completado
                            </div>
                        ) : (
                            <button
                                className={styles.stepButton}
                                onClick={() => markStepComplete(selectedCourse.id, 'step1Completed')}
                            >
                                <CheckCircle size={16} aria-hidden="true" />
                                Marcar como completado
                            </button>
                        )}
                    </StepCard>

                    <StepCard
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
                                    <BookOpen size={28} className={styles.noContentIcon} aria-hidden="true" />
                                    <p>No hay contenido disponible</p>
                                </div>
                            )}
                        </div>

                        {progress.presentationCompleted ? (
                            <div className={styles.stepCompleted} role="status">
                                <CheckCircle size={16} aria-hidden="true" />
                                Curso Finalizado
                            </div>
                        ) : (
                            <button
                                className={`${styles.stepButton} ${styles.stepButtonPrimary}`}
                                onClick={() => markStepComplete(selectedCourse.id, 'presentationCompleted')}
                            >
                                <CheckCircle size={16} aria-hidden="true" />
                                Finalizar Curso
                            </button>
                        )}
                    </StepCard>
                </div>
            </div>
        </>
    );
}
