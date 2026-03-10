'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronRight, Trophy, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from './CandidateExamViewer.module.css';

/**
 * Califica el examen comparando las respuestas del candidato con las correctas.
 * Compatible con preguntas de tipo 'single', 'multiple' y 'truefalse'.
 */
function gradeExam(questions, answers) {
    let correct = 0;

    questions.forEach(q => {
        const candidateAnswer = answers[q.id];
        if (candidateAnswer === undefined || candidateAnswer === null) return;

        if (q.type === 'single') {
            if (candidateAnswer === q.correct) correct++;
        } else if (q.type === 'multiple') {
            const sortedCandidate = [...(candidateAnswer || [])].sort().join(',');
            const sortedCorrect  = [...(q.correct   || [])].sort().join(',');
            if (sortedCandidate === sortedCorrect) correct++;
        } else if (q.type === 'truefalse') {
            // q.statements[i].correct es el valor esperado; candidateAnswer[stmtId] = boolean
            const allRight = (q.statements || []).every(
                s => candidateAnswer[s.id] !== undefined && candidateAnswer[s.id] === s.correct
            );
            if (allRight) correct++;
        }
    });

    // Calificación sobre 10
    const score10 = questions.length > 0
        ? parseFloat(((correct / questions.length) * 10).toFixed(1))
        : 0;

    return { correct, total: questions.length, score10 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Portada del examen
// ─────────────────────────────────────────────────────────────────────────────
function ExamCover({ exam, onStart }) {
    return (
        <motion.div
            className={styles.cover}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className={styles.coverIcon}>📝</div>
            <h2 className={styles.coverTitle}>{exam.title}</h2>
            <p className={styles.coverSub}>
                {exam.questions?.length || 0} preguntas · Calificación mínima: {exam.passingScore ?? 7} / 10
            </p>
            <p className={styles.coverHint}>Responde todas las preguntas para finalizar. Puedes tomarte el tiempo que necesites.</p>
            <button className={styles.btnPrimary} onClick={onStart}>
                Comenzar examen <ChevronRight size={18} />
            </button>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Una pregunta
// ─────────────────────────────────────────────────────────────────────────────
function QuestionStep({ question, stepIndex, total, answer, onChange, onNext }) {
    const isSingle     = !question.type || question.type === 'single';
    const isMultiple   = question.type === 'multiple';
    const isTrueFalse  = question.type === 'truefalse';

    const canProceed = isTrueFalse
        ? (question.statements || []).every(s => answer?.[s.id] !== undefined)
        : (answer !== null && answer !== undefined && (isMultiple ? answer.length > 0 : true));

    const handleMultiToggle = (optId) => {
        const current = answer || [];
        if (current.includes(optId)) {
            onChange(current.filter(id => id !== optId));
        } else {
            onChange([...current, optId]);
        }
    };

    const handleTrueFalse = (stmtId, value) => {
        onChange({ ...(answer || {}), [stmtId]: value });
    };

    return (
        <motion.div
            key={question.id}
            className={styles.questionWrap}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
        >
            {/* Progreso */}
            <div className={styles.progress}>
                <span className={styles.progressLabel}>Pregunta {stepIndex + 1} de {total}</span>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${((stepIndex + 1) / total) * 100}%` }}
                    />
                </div>
            </div>

            {/* Enunciado */}
            <p className={styles.questionText}>{question.text}</p>

            {/* Opciones — Single choice */}
            {isSingle && (
                <div className={styles.options}>
                    {(question.options || []).map(opt => (
                        <label
                            key={opt.id}
                            className={`${styles.optionCard} ${answer === opt.id ? styles.optionSelected : ''}`}
                        >
                            <input
                                type="radio"
                                name={question.id}
                                value={opt.id}
                                checked={answer === opt.id}
                                onChange={() => onChange(opt.id)}
                                className={styles.hiddenInput}
                            />
                            <span className={styles.optionDot} />
                            <span className={styles.optionText}>{opt.text}</span>
                        </label>
                    ))}
                </div>
            )}

            {/* Opciones — Multiple choice */}
            {isMultiple && (
                <div className={styles.options}>
                    {(question.options || []).map(opt => {
                        const checked = (answer || []).includes(opt.id);
                        return (
                            <label
                                key={opt.id}
                                className={`${styles.optionCard} ${checked ? styles.optionSelected : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => handleMultiToggle(opt.id)}
                                    className={styles.hiddenInput}
                                />
                                <span className={`${styles.optionDot} ${styles.optionDotSquare}`} />
                                <span className={styles.optionText}>{opt.text}</span>
                            </label>
                        );
                    })}
                </div>
            )}

            {/* Opciones — True/False */}
            {isTrueFalse && (
                <div className={styles.trueFalseList}>
                    {(question.statements || []).map(stmt => (
                        <div key={stmt.id} className={styles.tfRow}>
                            <span className={styles.tfText}>{stmt.text}</span>
                            <div className={styles.tfBtns}>
                                <button
                                    className={`${styles.tfBtn} ${answer?.[stmt.id] === true ? styles.tfBtnActive : ''}`}
                                    onClick={() => handleTrueFalse(stmt.id, true)}
                                    type="button"
                                >Verdadero</button>
                                <button
                                    className={`${styles.tfBtn} ${answer?.[stmt.id] === false ? styles.tfBtnActiveF : ''}`}
                                    onClick={() => handleTrueFalse(stmt.id, false)}
                                    type="button"
                                >Falso</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button
                className={styles.btnPrimary}
                disabled={!canProceed}
                onClick={onNext}
            >
                {stepIndex + 1 === total ? 'Finalizar examen' : 'Siguiente pregunta'}
                <ChevronRight size={18} />
            </button>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: Resultado
// ─────────────────────────────────────────────────────────────────────────────
function ResultScreen({ result, passingScore, onClose, onRetry }) {
    const passed = result.score10 >= (passingScore ?? 7);

    return (
        <motion.div
            className={styles.result}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className={styles.resultIcon}>
                {passed ? <Trophy size={52} color="#f59e0b" /> : <XCircle size={52} color="#ef4444" />}
            </div>
            <h2 className={styles.resultTitle}>
                {passed ? '¡Felicidades! Aprobado ✅' : 'No aprobaste esta vez'}
            </h2>
            <p className={styles.resultScore}>
                Calificación: <strong className={passed ? styles.scoreGood : styles.scoreBad}>
                    {result.score10} / 10
                </strong>
            </p>
            <p className={styles.resultCorrectas}>
                <CheckCircle size={14} /> {result.correct} correctas de {result.total}
            </p>
            <p className={styles.resultHint}>
                {passed
                    ? 'Tu resultado ha sido registrado. Puedes continuar con el resto de tu inducción.'
                    : `Necesitas mínimo ${passingScore ?? 7}/10. Repasa el material e inténtalo de nuevo.`}
            </p>
            <div className={styles.resultActions}>
                {!passed && (
                    <button className={styles.btnSecondary} onClick={onRetry}>
                        <RefreshCw size={16} /> Volver a intentar
                    </button>
                )}
                <button className={styles.btnPrimary} onClick={onClose}>
                    {passed ? 'Cerrar' : 'Cerrar por ahora'}
                </button>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────
export default function CandidateExamViewer({ exam, candidate, onClose }) {
    // phase: 'cover' | 'questions' | 'result'
    const [phase, setPhase] = useState('cover');
    const [step, setStep]   = useState(0);
    const [answers, setAnswers] = useState({});
    const [result, setResult]   = useState(null);
    const [saving, setSaving]   = useState(false);

    if (!exam) return null;

    const questions = exam.questions || [];

    const handleAnswer = (value) => {
        setAnswers(prev => ({ ...prev, [questions[step].id]: value }));
    };

    const handleNext = async () => {
        if (step < questions.length - 1) {
            setStep(prev => prev + 1);
            return;
        }
        // Último paso → calificar
        const gradeResult = gradeExam(questions, answers);
        setResult(gradeResult);
        setPhase('result');

        // Guardar resultado en Firestore (sub-colección del empleado)
        if (candidate?.id) {
            setSaving(true);
            try {
                const resultRef = doc(db, 'employees', candidate.id, 'exam_results', exam.id);
                await setDoc(resultRef, {
                    examId: exam.id,
                    examTitle: exam.title,
                    score10: gradeResult.score10,
                    correct: gradeResult.correct,
                    total: gradeResult.total,
                    passed: gradeResult.score10 >= (exam.passingScore ?? 7),
                    answers,
                    completedAt: serverTimestamp(),
                }, { merge: true });
            } catch (err) {
                console.error('Error guardando resultado del examen:', err);
            } finally {
                setSaving(false);
            }
        }
    };

    const handleRetry = () => {
        setPhase('cover');
        setStep(0);
        setAnswers({});
        setResult(null);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.sheet} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <span className={styles.headerTitle}>
                        {phase === 'cover' ? 'Examen de Inducción' :
                         phase === 'result' ? 'Resultado' : exam.title}
                    </span>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    <AnimatePresence mode="wait">
                        {phase === 'cover' && (
                            <ExamCover key="cover" exam={exam} onStart={() => setPhase('questions')} />
                        )}
                        {phase === 'questions' && questions.length > 0 && (
                            <QuestionStep
                                key={`q-${step}`}
                                question={questions[step]}
                                stepIndex={step}
                                total={questions.length}
                                answer={answers[questions[step].id]}
                                onChange={handleAnswer}
                                onNext={handleNext}
                            />
                        )}
                        {phase === 'result' && result && (
                            <ResultScreen
                                key="result"
                                result={result}
                                passingScore={exam.passingScore}
                                onClose={onClose}
                                onRetry={handleRetry}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
