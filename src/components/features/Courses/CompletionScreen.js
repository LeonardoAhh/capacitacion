'use client';

import { useEffect, useState } from 'react';
import styles from './CompletionScreen.module.css';

/**
 * Pantalla de Finalización del Curso
 * Se muestra al presionar "Finalizar" en el último slide.
 * @param {Object} props
 * @param {Object}   props.course        - Datos del curso
 * @param {number}   props.quizScore     - Score del quiz (0-100), null si no hubo quiz
 * @param {number}   props.quizPassing   - Puntaje mínimo requerido del quiz
 * @param {number}   props.elapsedSecs   - Segundos transcurridos en el curso
 * @param {Function} props.onRestart     - Callback para volver al inicio del curso
 * @param {Function} props.onClose       - Callback para salir del curso
 */
export default function CompletionScreen({
    course,
    quizScore = null,
    quizPassing = 70,
    elapsedSecs = 0,
    onRestart,
    onClose,
}) {
    const [visible, setVisible] = useState(false);
    const [displayScore, setDisplayScore] = useState(0);

    // Animar entrada
    useEffect(() => {
        const t = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(t);
    }, []);

    // Animar contador de score
    useEffect(() => {
        if (quizScore === null) return;
        let start = 0;
        const duration = 1000;
        const step = quizScore / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= quizScore) {
                setDisplayScore(quizScore);
                clearInterval(timer);
            } else {
                setDisplayScore(Math.floor(start));
            }
        }, 16);
        return () => clearInterval(timer);
    }, [quizScore]);

    const passed = quizScore === null || quizScore >= quizPassing;

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        if (m === 0) return `${s}s`;
        return `${m}m ${s}s`;
    };

    return (
        <div
            className={`${styles.overlay} ${visible ? styles.visible : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Curso completado"
        >
            {/* Confetti partículas decorativas */}
            <div className={styles.confetti} aria-hidden="true">
                {Array.from({ length: 18 }).map((_, i) => (
                    <span key={i} className={styles.confettiPiece} style={{ '--i': i }} />
                ))}
            </div>

            <div className={`${styles.card} ${visible ? styles.cardVisible : ''}`}>
                {/* Ícono principal */}
                <div className={`${styles.iconWrap} ${passed ? styles.iconSuccess : styles.iconWarning}`}>
                    <span className={styles.mainEmoji} aria-hidden="true">
                        {passed ? '🏆' : '📚'}
                    </span>
                </div>

                <h1 className={styles.title}>
                    {passed ? '¡Curso Completado!' : 'Sigue Practicando'}
                </h1>

                <p className={styles.courseTitle}>{course?.title}</p>

                {/* Stats */}
                <div className={styles.statsRow}>
                    {/* Tiempo transcurrido */}
                    <div className={styles.statCard}>
                        <span className={styles.statEmoji} aria-hidden="true">⏱</span>
                        <span className={styles.statValue}>{formatTime(elapsedSecs)}</span>
                        <span className={styles.statLabel}>Tiempo</span>
                    </div>

                    {/* Score del quiz */}
                    {quizScore !== null && (
                        <div className={`${styles.statCard} ${passed ? styles.statSuccess : styles.statFail}`}>
                            <span className={styles.statEmoji} aria-hidden="true">
                                {passed ? '✅' : '❌'}
                            </span>
                            <span className={styles.statValue}>{displayScore}%</span>
                            <span className={styles.statLabel}>Evaluación</span>
                        </div>
                    )}

                    {/* Slides vistos */}
                    <div className={styles.statCard}>
                        <span className={styles.statEmoji} aria-hidden="true">📑</span>
                        <span className={styles.statValue}>{course?.slideCount ?? '—'}</span>
                        <span className={styles.statLabel}>Slides</span>
                    </div>
                </div>

                {/* Mensaje quiz reprobado */}
                {quizScore !== null && !passed && (
                    <p className={styles.retryMsg}>
                        Necesitas al menos {quizPassing}% para aprobar. ¡Revisa el material e inténtalo de nuevo!
                    </p>
                )}

                {/* Acciones */}
                <div className={styles.actions}>
                    <button
                        className={styles.btnSecondary}
                        onClick={onRestart}
                    >
                        🔄 Ver de nuevo
                    </button>
                    <button
                        className={styles.btnPrimary}
                        onClick={onClose}
                    >
                        Salir del curso
                    </button>
                </div>
            </div>
        </div>
    );
}
