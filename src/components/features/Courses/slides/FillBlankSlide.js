'use client';
import React, { useState, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import styles from './slides.module.css';

function normalize(str) {
    return String(str || '').trim().toLowerCase();
}

/**
 * FillBlankSlide — Completa la frase con input de texto.
 * La frase usa `___` como marcador del espacio en blanco.
 * @param {{ sentence, answers: string[], explanation }} props.data
 * @param {Function} [props.onQuizSubmit] - Callback(score: 0|100)
 */
const FillBlankSlide = React.memo(function FillBlankSlide({ data, onQuizSubmit, hasBgMedia }) {
    const { sentence = '', answers = [], explanation = '' } = data;
    const [value, setValue] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [shake, setShake] = useState(false);
    const inputRef = useRef(null);

    // Dividir la frase por ___ para intercalar el input inline
    const parts = sentence.split('___');

    const handleSubmit = useCallback(() => {
        if (!value.trim()) return;
        const correct = answers.some(a => normalize(a) === normalize(value));
        setSubmitted(true);
        setIsCorrect(correct);

        if (correct) {
            confetti({
                particleCount: 100,
                spread: 65,
                origin: { y: 0.6 },
                colors: ['#003ccc', '#00cc66', '#ffcc00'],
            });
            if (onQuizSubmit) onQuizSubmit(100);
        } else {
            setShake(true);
            setTimeout(() => setShake(false), 600);
            if (onQuizSubmit) onQuizSubmit(0);
        }
    }, [value, answers, onQuizSubmit]);

    const handleRetry = useCallback(() => {
        setValue('');
        setSubmitted(false);
        setIsCorrect(false);
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    return (
        <article
            className={`${styles.slide} ${styles.fillBlankSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}
            role="region"
            aria-label="Completa la frase"
        >
            <span className={styles.slideLabel}>Completa la Frase</span>

            {/* Frase con espacio en blanco inline */}
            <div className={styles.fillBlankSentence} aria-live="polite">
                {parts.map((part, i) => (
                    <React.Fragment key={i}>
                        <span>{part}</span>
                        {i < parts.length - 1 && (
                            submitted ? (
                                <span
                                    className={`${styles.fillBlankAnswerBox} ${isCorrect ? styles.fillBlankCorrect : styles.fillBlankIncorrect}`}
                                    aria-label={isCorrect ? `Correcto: ${value}` : `Incorrecto: ${value}, respuesta correcta: ${answers[0]}`}
                                >
                                    {value}
                                    {!isCorrect && answers[0] && (
                                        <small className={styles.fillBlankCorrectHint}> ✓ {answers[0]}</small>
                                    )}
                                </span>
                            ) : (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={value}
                                    onChange={e => setValue(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && value.trim() && handleSubmit()}
                                    className={`${styles.fillBlankInput} ${shake ? styles.fillBlankShake : ''}`}
                                    placeholder="___"
                                    aria-label="Tu respuesta"
                                    autoFocus
                                    maxLength={100}
                                />
                            )
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Botón verificar */}
            {!submitted && (
                <button
                    className={styles.quizSubmitBtn}
                    onClick={handleSubmit}
                    disabled={!value.trim()}
                    aria-disabled={!value.trim()}
                    style={{ marginTop: '2rem' }}
                >
                    Verificar Respuesta
                </button>
            )}

            {/* Resultado */}
            {submitted && (
                <div
                    className={`${styles.quizResult} ${isCorrect ? styles.quizResultPassed : styles.quizResultFailed}`}
                    role="alert"
                    aria-live="polite"
                >
                    <span className={styles.quizResultLabel}>
                        {isCorrect
                            ? '¡Correcto! 🎉'
                            : `Respuesta incorrecta${answers[0] ? `. La respuesta es: "${answers[0]}"` : '.'}`}
                    </span>

                    {explanation && (
                        <div className={styles.explanation} role="note" style={{ marginTop: 8 }}>
                            <span className={styles.explanationIcon} aria-hidden="true">💡</span>
                            <p>{explanation}</p>
                        </div>
                    )}

                    {!isCorrect && (
                        <button
                            onClick={handleRetry}
                            className={styles.quizSubmitBtn}
                            style={{ marginTop: 12 }}
                        >
                            Intentar de nuevo
                        </button>
                    )}
                </div>
            )}
        </article>
    );
});

export default FillBlankSlide;
