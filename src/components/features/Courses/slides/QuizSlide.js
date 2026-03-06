'use client';
import React from 'react';

import { useState, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import styles from './slides.module.css';

/**
 * QuizSlide — Evaluación con feedback animado
 * @param {Object}   props
 * @param {Object}   props.data           - Datos del quiz (heading, questions, passingScore)
 * @param {Function} [props.onQuizSubmit] - Callback con el score (0-100) al enviar
 */
const QuizSlide = React.memo(function QuizSlide({ data, onQuizSubmit, hasBgMedia }) {
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [shakeIdx, setShakeIdx] = useState(null); // {qi, oi} para shake animation

    const questions = useMemo(() => data.questions || [], [data.questions]);
    const passingScore = data.passingScore || 70;

    const handleSelect = (qi, oi) => {
        if (submitted) return;
        setAnswers((prev) => ({ ...prev, [qi]: oi }));
    };

    const handleSubmit = useCallback(() => {
        if (Object.keys(answers).length < questions.length) return;
        setSubmitted(true);

        // Calcular score
        let correct = 0;
        questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
        const score = Math.round((correct / questions.length) * 100);

        // Shake en respuestas incorrectas
        questions.forEach((q, qi) => {
            if (answers[qi] !== undefined && answers[qi] !== q.correct) {
                setTimeout(() => setShakeIdx({ qi, oi: answers[qi] }), 200);
                setTimeout(() => setShakeIdx(null), 800);
            }
        });

        // Gamification: Confetti si aprueba
        if (score >= passingScore) {
            confetti({
                particleCount: 120,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#003ccc', '#00cc66', '#ffcc00']
            });
        }

        // Notificar al padre (CoursePlayer) con el score
        if (onQuizSubmit) onQuizSubmit(score);
    }, [answers, questions, onQuizSubmit, passingScore]);

    const score = useMemo(() => {
        if (!submitted) return 0;
        let correct = 0;
        questions.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
        return Math.round((correct / questions.length) * 100);
    }, [submitted, answers, questions]);

    const passed = score >= passingScore;
    const allAnswered = Object.keys(answers).length === questions.length;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    return (
        <article
            className={`${styles.slide} ${styles.quizSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}
            role="region"
            aria-label="Evaluación final"
        >
            <span className={styles.slideLabel}>Evaluación Final</span>
            <h2>{data.heading}</h2>

            {questions.map((q, qi) => (
                <div
                    key={qi}
                    className={styles.questionCard}
                    role="group"
                    aria-labelledby={`question-${qi}`}
                >
                    <p className={styles.questionText} id={`question-${qi}`}>
                        {qi + 1}. {q.q}
                    </p>

                    <div
                        className={styles.optionsGrid}
                        role="radiogroup"
                        aria-label={`Pregunta ${qi + 1}`}
                    >
                        {q.options.map((option, oi) => {
                            const isSelected = answers[qi] === oi;
                            const isCorrect = q.correct === oi;
                            const isShaking = submitted && shakeIdx?.qi === qi && shakeIdx?.oi === oi;

                            // Clases del botón de opción
                            let cls = styles.optionBtn;
                            if (submitted && isSelected) {
                                cls += ` ${styles.optionSelected}`;
                                cls += isCorrect ? ` ${styles.optionCorrect}` : ` ${styles.optionIncorrect}`;
                            } else if (submitted && isCorrect) {
                                cls += ` ${styles.optionSelected} ${styles.optionCorrect}`;
                            } else if (isSelected) {
                                cls += ` ${styles.optionSelected}`;
                            }
                            if (isShaking) cls += ` ${styles.optionShake}`;

                            // Ícono de feedback post-submit
                            const feedbackEmoji = submitted
                                ? isCorrect ? ' ✅'
                                    : isSelected ? ' ❌'
                                        : ''
                                : '';

                            return (
                                <button
                                    key={oi}
                                    className={cls}
                                    onClick={() => handleSelect(qi, oi)}
                                    disabled={submitted}
                                    role="radio"
                                    aria-checked={isSelected}
                                    aria-label={`${letters[oi]}. ${option}`}
                                >
                                    <span className={styles.optionLetter} aria-hidden="true">{letters[oi]}.</span>
                                    <span>{option}{feedbackEmoji}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Explicación de la respuesta correcta */}
                    {submitted && q.explanation && (
                        <div className={styles.explanation} role="note">
                            <span className={styles.explanationIcon} aria-hidden="true">💡</span>
                            <p>{q.explanation}</p>
                        </div>
                    )}
                </div>
            ))}

            {/* Botón de envío */}
            {!submitted && (
                <button
                    className={styles.quizSubmitBtn}
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                    aria-disabled={!allAnswered}
                >
                    {allAnswered
                        ? 'Enviar Respuestas'
                        : `Responde todas (${Object.keys(answers).length}/${questions.length})`
                    }
                </button>
            )}

            {/* Resultado */}
            {submitted && (
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
            )}
        </article>
    );
});

export default QuizSlide;
