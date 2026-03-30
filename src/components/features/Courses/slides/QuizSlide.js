'use client';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import styles from './slides.module.css';

/**
 * QuizSlide — Step wizard: una pregunta a la vez con feedback inmediato.
 * @param {Object}   props.data           - { heading, questions[], passingScore }
 * @param {Function} [props.onQuizSubmit] - Callback con score (0–100) al terminar
 * @param {boolean}  [props.hasBgMedia]   - Aplica clase de contraste sobre fondo
 */
const QuizSlide = React.memo(function QuizSlide({ data, onQuizSubmit, hasBgMedia }) {
    const questions    = useMemo(() => data.questions || [], [data.questions]);
    const passingScore = data.passingScore || 70;
    const letters      = ['A', 'B', 'C', 'D', 'E', 'F'];

    // Wizard state
    const [step,     setStep]     = useState(0);
    const [selected, setSelected] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [answers,  setAnswers]  = useState([]);   // [{selected, isCorrect}]
    const [finished, setFinished] = useState(false);

    const q      = questions[step] || {};
    const isLast = step === questions.length - 1;
    const progress = Math.round(((step + (revealed ? 1 : 0)) / questions.length) * 100);

    const handleSelect = useCallback((oi) => {
        if (!revealed) setSelected(oi);
    }, [revealed]);

    const handleConfirm = useCallback(() => {
        if (selected === null || revealed) return;
        setRevealed(true);
        setAnswers(prev => [...prev, { selected, isCorrect: selected === q.correct }]);
    }, [selected, revealed, q.correct]);

    const handleNext = useCallback(() => {
        if (isLast) {
            setFinished(true);
        } else {
            setStep(s => s + 1);
            setSelected(null);
            setRevealed(false);
        }
    }, [isLast]);

    // ── Resultados ────────────────────────────────────────────────
    const score  = useMemo(() => {
        if (!finished) return 0;
        const correct = answers.filter(a => a.isCorrect).length;
        return Math.round((correct / questions.length) * 100);
    }, [finished, answers, questions.length]);

    const passed = score >= passingScore;

    // Notificar al CoursePlayer una sola vez cuando se termine
    useEffect(() => {
        if (!finished) return;
        if (onQuizSubmit) onQuizSubmit(score);
        if (passed) {
            confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, colors: ['#003ccc', '#00cc66', '#ffcc00'] });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [finished]);

    if (finished) {
        return (
            <article
                className={`${styles.slide} ${styles.quizSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}
                role="region"
                aria-label="Resultado de evaluación"
            >
                <span className={styles.slideLabel}>Evaluación Final</span>
                <h2>{data.heading}</h2>

                {/* Resumen de preguntas */}
                <ul className={styles.quizSummary} role="list">
                    {questions.map((qItem, i) => (
                        <li
                            key={i}
                            className={`${styles.quizSummaryRow} ${answers[i]?.isCorrect ? styles.quizSummaryCorrect : styles.quizSummaryWrong}`}
                        >
                            <span className={styles.quizSummaryIcon} aria-hidden="true">
                                {answers[i]?.isCorrect ? '✓' : '✗'}
                            </span>
                            <span className={styles.quizSummaryText}>{i + 1}. {qItem.q}</span>
                        </li>
                    ))}
                </ul>

                <div
                    className={`${styles.quizResult} ${passed ? styles.quizResultPassed : styles.quizResultFailed}`}
                    role="alert"
                    aria-live="polite"
                >
                    <span className={styles.quizScore}>{score}%</span>
                    <span className={styles.quizResultLabel}>
                        {passed
                            ? '¡Felicidades! Aprobaste la evaluación. 🎉'
                            : `No alcanzaste el puntaje mínimo (${passingScore}%). Sigue intentándolo.`
                        }
                    </span>
                </div>
            </article>
        );
    }

    // ── Pregunta activa ───────────────────────────────────────────
    return (
        <article
            className={`${styles.slide} ${styles.quizSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}
            role="region"
            aria-label="Evaluación Final"
        >
            <span className={styles.slideLabel}>Evaluación Final</span>
            <h2>{data.heading}</h2>

            {/* Barra de progreso */}
            <div className={styles.quizWizardTrack} role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={questions.length}>
                <div className={styles.quizWizardFill} style={{ width: `${progress}%` }} />
            </div>

            {/* Tarjeta de pregunta */}
            <div
                className={styles.questionCard}
                role="group"
                aria-labelledby="quiz-question"
            >
                <p className={styles.quizStepLabel} aria-live="polite">
                    Pregunta {step + 1} de {questions.length}
                </p>

                <p className={styles.questionText} id="quiz-question">
                    {q.q}
                </p>

                <div className={styles.optionsGrid} role="radiogroup" aria-label={`Pregunta ${step + 1}`}>
                    {(q.options || []).map((option, oi) => {
                        const isCorrect  = revealed && oi === q.correct;
                        const isWrong    = revealed && oi === selected && oi !== q.correct;
                        const isSelected = !revealed && oi === selected;

                        let cls = styles.optionBtn;
                        if (isCorrect)  cls += ` ${styles.optionSelected} ${styles.optionCorrect}`;
                        else if (isWrong)    cls += ` ${styles.optionSelected} ${styles.optionIncorrect}`;
                        else if (isSelected) cls += ` ${styles.optionSelected}`;

                        return (
                            <button
                                key={oi}
                                type="button"
                                className={cls}
                                onClick={() => handleSelect(oi)}
                                disabled={revealed}
                                role="radio"
                                aria-checked={selected === oi}
                                aria-label={`${letters[oi]}. ${option}`}
                            >
                                <span className={styles.optionLetter} aria-hidden="true">{letters[oi]}.</span>
                                <span>{option}</span>
                                {isCorrect && <span aria-hidden="true"> ✅</span>}
                                {isWrong   && <span aria-hidden="true"> ❌</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Explicación */}
                {revealed && q.explanation && (
                    <div className={styles.explanation} role="note">
                        <span className={styles.explanationIcon} aria-hidden="true">💡</span>
                        <p>{q.explanation}</p>
                    </div>
                )}
            </div>

            {/* Acciones */}
            <div className={styles.quizWizardActions}>
                {!revealed ? (
                    <button
                        type="button"
                        className={styles.quizSubmitBtn}
                        onClick={handleConfirm}
                        disabled={selected === null}
                        aria-disabled={selected === null}
                    >
                        Confirmar respuesta
                    </button>
                ) : (
                    <button
                        type="button"
                        className={styles.quizSubmitBtn}
                        onClick={handleNext}
                    >
                        {isLast ? 'Ver resultados →' : 'Siguiente pregunta →'}
                    </button>
                )}
            </div>
        </article>
    );
});

export default QuizSlide;
