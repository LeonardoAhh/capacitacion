import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, CheckCircle, BookOpen, FileText } from 'lucide-react';
import styles from './CourseViewer.module.css';
import LazyIframe from '@/components/ui/LazyIframe/LazyIframe';
import { convertDriveUrl } from '../utils/helpers';
import { EXAM_CONFIG } from '../config/constants';

// Step Component for clearer structure
const StepCard = ({ stepNumber, title, isCompleted, isUnlocked, isLocked, children }) => (
    <div className={`${styles.stepCard} ${isLocked ? styles.stepLocked : ''}`}>
        <div className={styles.stepHeader}>
            <div className={styles.stepNumber}>
                {isCompleted ? (
                    <CheckCircle size={24} className={styles.stepCheckIcon} />
                ) : isUnlocked ? (
                    <span>{stepNumber}</span>
                ) : (
                    <span>🔒</span>
                )}
            </div>
            <h4 className={styles.stepTitle}>{title}</h4>
        </div>

        {isLocked && (
            <p className={styles.stepLockedText}>Completa el paso anterior para desbloquear</p>
        )}

        {isUnlocked && (
            <div className={styles.stepContent}>
                {children}
            </div>
        )}
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
    onDownloadExam
}) {
    const progress = courseProgress[selectedCourse.id] || {};
    const isInductionCourse = selectedCourse.title?.toUpperCase().includes('INDUCCIÓN') ||
        selectedCourse.nombre?.toUpperCase().includes('INDUCCIÓN');

    const step1Unlocked = true;
    const presentationUnlocked = isStepUnlocked(courseProgress, selectedCourse.id, 'presentation');
    const step2Unlocked = isStepUnlocked(courseProgress, selectedCourse.id, 'step2');
    const examUnlocked = isStepUnlocked(courseProgress, selectedCourse.id, 'exam');

    return (
        <AnimatePresence>
            {selectedCourse && (
                <motion.div
                    className={styles.modal}
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className={styles.modalContent}
                        onClick={(e) => e.stopPropagation()}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        <div className={styles.modalHeader}>
                            <button onClick={onClose} className={styles.modalBack}>
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
                                    const currentStep = getCurrentStepNumber(courseProgress, selectedCourse.id);
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
                                Paso {getCurrentStepNumber(courseProgress, selectedCourse.id)} de 4
                            </div>
                        </div>

                        {/* Steps Container */}
                        <div className={styles.stepsContainer}>
                            {/* STEP 1: Bienvenida */}
                            <StepCard
                                stepNumber={1}
                                title="Bienvenida"
                                isCompleted={progress.step1Completed}
                                isUnlocked={step1Unlocked}
                                isLocked={!step1Unlocked}
                            >
                                <p className={styles.stepText}>
                                    Hola <strong>{candidate?.name || candidate?.nombre || 'Candidato'}</strong>,
                                    te damos la bienvenida al curso de <strong>{selectedCourse.title || selectedCourse.nombre}</strong>.
                                    A continuación podrás encontrar información que será de utilidad en tu estancia en Viñoplastic.
                                </p>

                                {!progress.step1Completed ? (
                                    <button
                                        className={styles.stepButton}
                                        onClick={() => markStepComplete(selectedCourse.id, 'step1Completed')}
                                    >
                                        <CheckCircle size={18} />
                                        Marcar como completado
                                    </button>
                                ) : (
                                    <div className={styles.stepCompleted}>
                                        <CheckCircle size={18} />
                                        Completado
                                    </div>
                                )}
                            </StepCard>

                            {/* STEP 2: Presentación */}
                            <div className={`${styles.stepCard} ${!presentationUnlocked ? styles.stepLocked : ''}`}>
                                <div className={styles.stepHeader}>
                                    <div className={styles.stepNumber}>
                                        {progress.presentationCompleted ? (
                                            <CheckCircle size={24} className={styles.stepCheckIcon} />
                                        ) : presentationUnlocked ? (
                                            <BookOpen size={24} />
                                        ) : (
                                            <span>🔒</span>
                                        )}
                                    </div>
                                    <h4 className={styles.stepTitle}>Presentación del Curso</h4>
                                </div>

                                {!presentationUnlocked && (
                                    <p className={styles.stepLockedText}>Completa el paso anterior para desbloquear</p>
                                )}

                                {presentationUnlocked && (
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

                                        {!progress.presentationCompleted ? (
                                            <button
                                                className={styles.stepButton}
                                                onClick={() => markStepComplete(selectedCourse.id, 'presentationCompleted')}
                                            >
                                                <CheckCircle size={18} />
                                                Marcar como finalizado
                                            </button>
                                        ) : (
                                            <div className={styles.stepCompleted}>
                                                <CheckCircle size={18} />
                                                Finalizado
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* STEP 3: Instrucciones de Examen */}
                            <StepCard
                                stepNumber={2}
                                title="Instrucciones"
                                isCompleted={progress.step2Completed}
                                isUnlocked={step2Unlocked}
                                isLocked={!step2Unlocked}
                            >
                                <p className={styles.stepText}>
                                    Descarga el examen y anota tus respuestas, que ocuparás el primer día de trabajo en planta.
                                </p>

                                {!progress.step2Completed ? (
                                    <button
                                        className={styles.stepButton}
                                        onClick={() => markStepComplete(selectedCourse.id, 'step2Completed')}
                                    >
                                        <CheckCircle size={18} />
                                        Marcar como completado
                                    </button>
                                ) : (
                                    <div className={styles.stepCompleted}>
                                        <CheckCircle size={18} />
                                        Completado
                                    </div>
                                )}
                            </StepCard>

                            {/* STEP 4: Examen */}
                            <div className={`${styles.stepCard} ${!examUnlocked ? styles.stepLocked : ''}`}>
                                <div className={styles.stepHeader}>
                                    <div className={styles.stepNumber}>
                                        {progress.examDownloaded ? (
                                            <CheckCircle size={24} className={styles.stepCheckIcon} />
                                        ) : examUnlocked ? (
                                            <FileText size={24} />
                                        ) : (
                                            <span>🔒</span>
                                        )}
                                    </div>
                                    <h4 className={styles.stepTitle}>Examen</h4>
                                </div>

                                {!examUnlocked && (
                                    <p className={styles.stepLockedText}>Completa el paso anterior para desbloquear</p>
                                )}

                                {examUnlocked && (selectedCourse.examenUrl || (selectedCourse.material?.type === 'document' && selectedCourse.material?.url)) && (
                                    <div className={styles.stepContent}>
                                        <p className={styles.stepText}>
                                            Descarga el examen y respóndelo para completar el curso, o realízalo digitalmente.
                                        </p>



                                        <button
                                            className={styles.stepButtonPrimary}
                                            onClick={() => onDownloadExam(selectedCourse)}
                                            style={{ background: 'transparent', border: '1px solid #007aff', color: '#007aff', boxShadow: 'none' }}
                                        >
                                            <FileText size={18} />
                                            Descargar Examen (PDF)
                                        </button>

                                        {progress.examDownloaded && (
                                            <div className={styles.stepCompleted} style={{ marginTop: '16px' }}>
                                                <CheckCircle size={18} />
                                                Examen descargado - Curso completado
                                            </div>
                                        )}
                                    </div>
                                )}

                                {examUnlocked && !selectedCourse.examenUrl && !(selectedCourse.material?.type === 'document' && selectedCourse.material?.url) && (
                                    <div className={styles.stepContent}>
                                        <p className={styles.stepText}>No hay examen disponible para este curso.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
