'use client';

import { useState, useMemo } from 'react';
import styles from './slides.module.css';

export default function QuizSlide({ data }) {
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const questions = useMemo(() => data.questions || [], [data.questions]);
    const passingScore = data.passingScore || 70;

    const handleSelect = (qi, oi) => {
        if (submitted) return;
        setAnswers((prev) => ({ ...prev, [qi]: oi }));
    };

    const handleSubmit = () => {
        if (Object.keys(answers).length < questions.length) return;
        setSubmitted(true);
    };

    const score = useMemo(() => {
        if (!submitted) return 0;
        let correct = 0;
        questions.forEach((q, i) => {
            if (answers[i] === q.correct) correct++;
        });
        return Math.round((correct / questions.length) * 100);
    }, [submitted, answers, questions]);

    const passed = score >= passingScore;
    const allAnswered = Object.keys(answers).length === questions.length;
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    return (
        <div className={`${styles.slide} ${styles.quizSlide}`}>
            {/* Label */}
            <span className={styles.slideLabel}>Evaluación Final</span>
            <h2>{data.heading}</h2>

            {questions.map((q, qi) => (
                <div key={qi} className={styles.questionCard}>
                    <p className={styles.questionText}>
                        {qi + 1}. {q.q}
                    </p>
                    <div className={styles.optionsGrid}>
                        {q.options.map((option, oi) => {
                            const isSelected = answers[qi] === oi;
                            const isCorrect = q.correct === oi;

                            let cls = styles.optionBtn;
                            if (submitted && isSelected) {
                                cls += ` ${styles.optionSelected}`;
                                cls += isCorrect ? ` ${styles.optionCorrect}` : ` ${styles.optionIncorrect}`;
                            } else if (submitted && isCorrect) {
                                cls += ` ${styles.optionSelected} ${styles.optionCorrect}`;
                            } else if (isSelected) {
                                cls += ` ${styles.optionSelected}`;
                            }

                            return (
                                <button
                                    key={oi}
                                    className={cls}
                                    onClick={() => handleSelect(qi, oi)}
                                    disabled={submitted}
                                >
                                    <span className={styles.optionLetter}>{letters[oi]}.</span>
                                    <span>{option}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {!submitted && (
                <button
                    className={styles.quizSubmitBtn}
                    onClick={handleSubmit}
                    disabled={!allAnswered}
                >
                    {allAnswered ? 'Enviar Respuestas' : `Responde todas (${Object.keys(answers).length}/${questions.length})`}
                </button>
            )}

            {submitted && (
                <div className={`${styles.quizResult} ${passed ? styles.quizResultPassed : styles.quizResultFailed}`}>
                    <span className={styles.quizScore}>{score}%</span>
                    <span className={styles.quizResultLabel}>
                        {passed ? '¡Felicidades! Aprobaste la evaluación.' : `No alcanzaste el puntaje mínimo (${passingScore}%).`}
                    </span>
                </div>
            )}
        </div>
    );
}
