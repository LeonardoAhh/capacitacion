'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCourseWithSlides } from '@/lib/courseService';
import styles from './page.module.css';

/* ─────────────────────────────────────────────
   Normaliza slides quiz / group_quiz a un array
   plano: { q, options[], correct, explanation }
───────────────────────────────────────────── */
function extractQuestions(slides) {
    const questions = [];
    for (const slide of slides) {
        if (slide.type === 'quiz' && Array.isArray(slide.data?.questions)) {
            for (const q of slide.data.questions) {
                questions.push({
                    q: q.q || '',
                    options: q.options || [],
                    correct: q.correct ?? 0,
                    explanation: q.explanation || '',
                });
            }
        } else if (slide.type === 'group_quiz') {
            const d = slide.data || {};
            const opts = d.options || [];
            const correctIdx = opts.findIndex(o => o.id === d.correctOptionId);
            questions.push({
                q: d.question || d.heading || '',
                options: opts.map(o => o.text || o),
                correct: correctIdx >= 0 ? correctIdx : 0,
                explanation: d.explanation || '',
            });
        }
    }
    return questions;
}

const PASSING_SCORE = 70;

export default function PublicQuizPage({ params }) {
    const { courseId } = params;
    const router = useRouter();

    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');
    const [course, setCourse]       = useState(null);
    const [questions, setQuestions] = useState([]);

    // Wizard state
    const [step, setStep]       = useState(0);
    const [selected, setSelected] = useState(null);
    const [revealed, setRevealed] = useState(false);
    const [answers, setAnswers]   = useState([]);
    const [finished, setFinished] = useState(false);

    /* ── Carga ── */
    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const result = await getCourseWithSlides(courseId);
                if (!active) return;
                if (!result.success) { setError(result.error || 'No se pudo cargar el quiz.'); return; }
                const quizSlides = result.data.slides.filter(s => ['quiz', 'group_quiz'].includes(s.type));
                const qs = extractQuestions(quizSlides);
                if (qs.length === 0) { setError('Este curso no tiene preguntas de evaluación.'); return; }
                setCourse(result.data.course);
                setQuestions(qs);
            } catch {
                if (active) setError('Error inesperado al cargar el quiz.');
            } finally {
                if (active) setLoading(false);
            }
        };
        load();
        return () => { active = false; };
    }, [courseId]);

    /* ── Handlers ── */
    const handleSelect  = useCallback((idx) => { if (!revealed) setSelected(idx); }, [revealed]);

    const handleConfirm = useCallback(() => {
        if (selected === null || revealed) return;
        setRevealed(true);
        setAnswers(prev => [...prev, { selected, isCorrect: selected === questions[step].correct }]);
    }, [selected, revealed, questions, step]);

    const handleNext = useCallback(() => {
        if (step === questions.length - 1) {
            setFinished(true);
        } else {
            setStep(s => s + 1);
            setSelected(null);
            setRevealed(false);
        }
    }, [step, questions.length]);

    const handleRestart = useCallback(() => {
        setStep(0); setSelected(null); setRevealed(false); setAnswers([]); setFinished(false);
    }, []);

    /* ── Loading ── */
    if (loading) {
        return (
            <div className={styles.shell}>
                <div className={styles.loadingWrap}>
                    <span className={styles.spinner} aria-hidden="true" />
                    <p>Cargando evaluación…</p>
                </div>
            </div>
        );
    }

    /* ── Error ── */
    if (error) {
        return (
            <div className={styles.shell}>
                <div className={styles.errorCard}>
                    <span className={styles.errorEmoji} aria-hidden="true">⚠️</span>
                    <p className={styles.errorMsg}>{error}</p>
                    <button className={styles.btnPrimary} onClick={() => router.push('/')}>Ir al inicio</button>
                </div>
            </div>
        );
    }

    /* ── Resultados ── */
    if (finished) {
        const correct = answers.filter(a => a.isCorrect).length;
        const score   = Math.round((correct / questions.length) * 100);
        const passed  = score >= PASSING_SCORE;

        return (
            <div className={styles.shell}>
                <div className={styles.resultsCard}>
                    <div className={`${styles.resultsBadge} ${passed ? styles.badgePassed : styles.badgeFailed}`}>
                        {passed ? '🎉' : '📚'}
                    </div>

                    <h1 className={styles.resultsTitle}>{passed ? '¡Felicidades!' : 'Sigue practicando'}</h1>
                    <p className={styles.resultsSubtitle}>{course?.title}</p>

                    <div className={styles.scoreRing}>
                        <span className={`${styles.scorePct} ${passed ? styles.scorePass : styles.scoreFail}`}>
                            {score}%
                        </span>
                        <span className={styles.scoreDetail}>{correct} de {questions.length} correctas</span>
                    </div>

                    <div className={styles.scoreBar} role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
                        <div className={`${styles.scoreBarFill} ${passed ? styles.fillPass : styles.fillFail}`} style={{ width: `${score}%` }} />
                    </div>

                    <p className={`${styles.resultNote} ${passed ? styles.notePass : styles.noteFail}`}>
                        {passed ? `Superaste el mínimo de ${PASSING_SCORE}%.` : `Se requiere ${PASSING_SCORE}% para aprobar.`}
                    </p>

                    <ul className={styles.summary} role="list">
                        {questions.map((q, i) => (
                            <li key={i} className={`${styles.summaryRow} ${answers[i]?.isCorrect ? styles.rowCorrect : styles.rowWrong}`}>
                                <span className={styles.summaryIcon} aria-hidden="true">{answers[i]?.isCorrect ? '✓' : '✗'}</span>
                                <span className={styles.summaryQ}>{i + 1}. {q.q}</span>
                            </li>
                        ))}
                    </ul>

                    <div className={styles.resultsActions}>
                        <button className={styles.btnSecondary} onClick={handleRestart}>Reintentar</button>
                        <button className={styles.btnPrimary} onClick={() => router.push('/')}>Ir al inicio</button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── Pregunta activa ── */
    const q = questions[step];
    const isLast = step === questions.length - 1;
    const progress = Math.round(((step + (revealed ? 1 : 0)) / questions.length) * 100);

    return (
        <div className={styles.shell}>
            {/* Header */}
            <header className={styles.header}>
                <p className={styles.headerCourse}>{course?.title}</p>
                <p className={styles.headerCount} aria-live="polite">
                    Pregunta <strong>{step + 1}</strong> / <strong>{questions.length}</strong>
                </p>
            </header>

            {/* Barra de progreso */}
            <div className={styles.progressTrack} role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={questions.length}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>

            {/* Tarjeta */}
            <main className={styles.questionCard}>
                <p className={styles.stepLabel}>Pregunta {step + 1} de {questions.length}</p>
                <h2 className={styles.questionText}>{q.q}</h2>

                <ul className={styles.optionsList} role="list">
                    {q.options.map((opt, i) => {
                        const isCorrect  = revealed && i === q.correct;
                        const isWrong    = revealed && i === selected && i !== q.correct;
                        const isSelected = !revealed && i === selected;

                        return (
                            <li key={i}>
                                <button
                                    type="button"
                                    className={[
                                        styles.option,
                                        isCorrect  ? styles.optionCorrect  : '',
                                        isWrong    ? styles.optionWrong    : '',
                                        isSelected ? styles.optionSelected : '',
                                    ].join(' ')}
                                    onClick={() => handleSelect(i)}
                                    disabled={revealed}
                                    aria-pressed={selected === i}
                                >
                                    <span className={styles.optionLetter} aria-hidden="true">
                                        {String.fromCharCode(65 + i)}
                                    </span>
                                    <span className={styles.optionText}>{opt}</span>
                                    {isCorrect && <span className={styles.optionCheck} aria-hidden="true">✓</span>}
                                    {isWrong   && <span className={styles.optionX}     aria-hidden="true">✗</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>

                {/* Feedback */}
                {revealed && q.explanation && (
                    <div
                        className={`${styles.feedback} ${selected === q.correct ? styles.feedbackCorrect : styles.feedbackWrong}`}
                        role="alert"
                    >
                        <span className={styles.feedbackIcon} aria-hidden="true">
                            {selected === q.correct ? '✓' : 'ℹ'}
                        </span>
                        <p className={styles.feedbackText}>{q.explanation}</p>
                    </div>
                )}

                {/* Acciones */}
                <div className={styles.actions}>
                    {!revealed ? (
                        <button
                            type="button"
                            className={styles.btnPrimary}
                            onClick={handleConfirm}
                            disabled={selected === null}
                        >
                            Confirmar respuesta
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={styles.btnPrimary}
                            onClick={handleNext}
                        >
                            {isLast ? 'Ver resultados →' : 'Siguiente pregunta →'}
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
