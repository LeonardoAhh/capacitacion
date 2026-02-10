'use client';

import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './ExamModal.module.css';

export default function ExamModal({ isOpen, onClose, examData, onSubmit }) {
    // ... (state)

    // ... (handleSubmit, handleNext)

    return (
        <AnimatePresence>
            {isOpen && examData && (
                <motion.div
                    className={styles.modal}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        className={styles.modalContent}
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    >
                        <div className={styles.modalHeader}>
                            <button onClick={onClose} className={styles.modalBack}>
                                <ChevronLeft size={24} />
                                Cancelar
                            </button>
                            <h3 className={styles.modalTitle}>Examen</h3>
                            <div style={{ width: 40 }}></div>
                        </div>

                        <div className={styles.examBody}>
                            {step === 0 && (
                                <div style={{ textAlign: 'center' }}>
                                    <h2 className={styles.examTitle}>{examData.exámen?.courseName || 'Examen de Inducción'}</h2>
                                    <p className={styles.examDescription}>
                                        Este examen consta de {totalQuestions} preguntas. Debes responderlas todas para completar tu inducción.
                                        Necesitas una calificación mínima de 70% para aprobar.
                                    </p>
                                    <button className={styles.stepButtonPrimary} onClick={() => setStep(1)} style={{ width: '100%', justifyContent: 'center' }}>
                                        Comenzar Examen
                                    </button>
                                </div>
                            )}

                            {step > 0 && step <= totalQuestions && (
                                <div>
                                    <div className={styles.examMeta}>
                                        <span>Pregunta {step} de {totalQuestions}</span>
                                        <span>{Math.round(((step - 1) / totalQuestions) * 100)}%</span>
                                    </div>
                                    <div className={styles.examProgressBar}>
                                        <div className={styles.examProgressFill} style={{ width: `${((step - 1) / totalQuestions) * 100}%` }}></div>
                                    </div>

                                    <h3 className={styles.questionText}>{questions[step - 1].pregunta}</h3>

                                    <div className={styles.optionsContainer}>
                                        {questions[step - 1].opciones.map((opt, idx) => (
                                            <label key={idx} className={`${styles.optionLabel} ${answers[questions[step - 1].id] === opt ? styles.optionLabelSelected : ''}`}>
                                                <input
                                                    type="radio"
                                                    name={`q-${questions[step - 1].id}`}
                                                    value={opt}
                                                    checked={answers[questions[step - 1].id] === opt}
                                                    onChange={() => handleOptionSelect(questions[step - 1].id, opt)}
                                                    className={styles.radioInput}
                                                />
                                                <span className={styles.optionText}>{opt}</span>
                                            </label>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: '32px' }}>
                                        <button
                                            className={styles.stepButtonPrimary}
                                            onClick={handleNext}
                                            disabled={!answers[questions[step - 1].id]}
                                            style={{ width: '100%', justifyContent: 'center' }}
                                        >
                                            {step === totalQuestions ? 'Finalizar Examen' : 'Siguiente Pregunta'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 99 && (
                                <div className={styles.resultContainer}>
                                    <div className={styles.resultEmoji}>{score >= 70 ? '🎉' : '⚠️'}</div>
                                    <h2 className={styles.resultTitle}>{score >= 70 ? '¡Felicidades!' : 'Inténtalo de nuevo'}</h2>
                                    <p className={styles.resultScore}>
                                        Tu calificación: <strong className={score >= 70 ? styles.scoreHigh : styles.scoreLow}>{score.toFixed(1)}%</strong>
                                    </p>

                                    <p className={styles.resultText}>
                                        {score >= 70
                                            ? 'Has aprobado el examen de inducción correctamente. Se ha registrado tu avance.'
                                            : 'Necesitas un mínimo de 70% para aprobar. Por favor, repasa el material e inténtalo nuevamente.'}
                                    </p>

                                    <button
                                        className={styles.stepButtonPrimary}
                                        onClick={onClose}
                                        style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                        {score >= 70 ? 'Finalizar y Cerrar' : 'Cerrar'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
