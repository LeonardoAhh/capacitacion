'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, X, CheckCircle, XCircle, FileText, Loader } from 'lucide-react';
import Image from 'next/image';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from './ExamResultPrint.module.css';

/**
 * Obtiene los resultados del examen de un candidato junto con
 * el detalle de las preguntas del examen original.
 */
async function loadExamResult(candidateId, examId) {
    const [resultSnap, examSnap] = await Promise.all([
        getDoc(doc(db, 'employees', candidateId, 'exam_results', examId)),
        getDoc(doc(db, 'examenes', examId)),
    ]);

    if (!resultSnap.exists() || !examSnap.exists()) return null;

    return {
        result: resultSnap.data(),
        exam:   { id: examId, ...examSnap.data() },
    };
}

/**
 * Obtiene todos los resultados de exámenes de un candidato.
 */
export async function loadAllExamResults(candidateId) {
    try {
        const snap = await getDocs(collection(db, 'employees', candidateId, 'exam_results'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
        return [];
    }
}

// ─── Sub-componente: Imprimible ───────────────────────────────────────────────
function PrintableExam({ exam, result, candidate }) {
    const answersMap = result.answers || {};
    const passingScore = exam.passingScore ?? 7;
    const passed = result.score10 >= passingScore;
    const today = new Date().toLocaleDateString('es-MX', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const getOptionText = (question, selectedId) => {
        if (!selectedId) return '—';
        if (question.type === 'truefalse') return '—';
        return question.options?.find(o => o.id === selectedId)?.text || selectedId;
    };

    return (
        <div className={styles.printDoc}>
            {/* Encabezado */}
            <div className={styles.printHeader}>
                <div className={styles.printLogo}>
                    <Image src="/logo-vino-plastic.png" alt="Viñoplastic" width={72} height={58} unoptimized />
                </div>
                <div className={styles.printMeta}>
                    <span className={styles.printDocId}>{exam.documentId || ''} · {exam.revision || ''}</span>
                    <h1 className={styles.printTitle}>Evaluación</h1>
                    <p className={styles.printSubtitle}>{exam.title}</p>
                </div>
            </div>

            {/* Datos del candidato */}
            <table className={styles.dataTable}>
                <tbody>
                    <tr>
                        <td className={styles.dtLabel}>NOMBRE:</td>
                        <td className={styles.dtValue}>{candidate.name || '_______________'}</td>
                        <td className={styles.dtLabel}>NO. EMPLEADO:</td>
                        <td className={styles.dtValue}>{candidate.employeeId || '______'}</td>
                    </tr>
                    <tr>
                        <td className={styles.dtLabel}>PUESTO:</td>
                        <td className={styles.dtValue}>{candidate.position || '_______________'}</td>
                        <td className={styles.dtLabel}>FECHA:</td>
                        <td className={styles.dtValue}>{today}</td>
                    </tr>
                    <tr>
                        <td className={styles.dtLabel}>DEPARTAMENTO:</td>
                        <td className={styles.dtValue}>{candidate.department || candidate.area || '_______________'}</td>
                        <td className={styles.dtLabel}>CALIFICACIÓN:</td>
                        <td className={`${styles.dtValue} ${passed ? styles.scorePass : styles.scoreFail}`}>
                            <strong>{result.score10} / 10</strong>
                            {' '}({passed ? '✓ APROBADO' : '✗ NO APROBADO'})
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Preguntas con respuestas */}
            <div className={styles.questionsList}>
                {(exam.questions || []).map((q, idx) => {
                    const selected = answersMap[q.id];

                    // Determinar si respondió correctamente
                    let isCorrect = false;
                    if (q.type === 'single' || !q.type) {
                        isCorrect = selected === q.correct;
                    } else if (q.type === 'multiple') {
                        const sortA = [...(selected || [])].sort().join(',');
                        const sortB = [...(q.correct || [])].sort().join(',');
                        isCorrect = sortA === sortB;
                    } else if (q.type === 'truefalse') {
                        isCorrect = (q.statements || []).every(s => selected?.[s.id] === s.correct);
                    }

                    return (
                        <div key={q.id} className={styles.questionBlock}>
                            <p className={styles.questionNum}>
                                <span className={isCorrect ? styles.markCorrect : styles.markWrong}>
                                    {isCorrect ? '✓' : '✗'}
                                </span>
                                {idx + 1}. {q.text}
                            </p>

                            {/* Opciones (single / multiple) */}
                            {(q.type === 'single' || !q.type || q.type === 'multiple') && (
                                <ul className={styles.optionsList}>
                                    {(q.options || []).map(opt => {
                                        const isSelected = q.type === 'multiple'
                                            ? (selected || []).includes(opt.id)
                                            : selected === opt.id;
                                        const isRightAnswer = q.type === 'multiple'
                                            ? (q.correct || []).includes(opt.id)
                                            : opt.id === q.correct;

                                        return (
                                            <li
                                                key={opt.id}
                                                className={`${styles.optionItem}
                                                    ${isSelected ? styles.optionSelected : ''}
                                                    ${isRightAnswer ? styles.optionCorrect : ''}
                                                `}
                                            >
                                                <span className={styles.optionBullet}>
                                                    {isSelected ? '◉' : '○'}
                                                </span>
                                                {opt.text}
                                                {isRightAnswer && <span className={styles.correctTag}> ← correcta</span>}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}

                            {/* Verdadero / Falso */}
                            {q.type === 'truefalse' && (
                                <ul className={styles.optionsList}>
                                    {(q.statements || []).map(stmt => {
                                        const userAnswer = selected?.[stmt.id];
                                        const answered = userAnswer !== undefined;
                                        return (
                                            <li key={stmt.id} className={styles.tfItem}>
                                                <span>{stmt.text}</span>
                                                <span className={userAnswer === stmt.correct ? styles.markCorrect : styles.markWrong}>
                                                    {answered
                                                        ? (userAnswer ? 'Verdadero' : 'Falso')
                                                        : '—'
                                                    }
                                                    {' '}(esperado: {stmt.correct ? 'Verdadero' : 'Falso'})
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Firma */}
            <div className={styles.signatures}>
                <div className={styles.sigLine}>
                    <div className={styles.sigBlank}></div>
                    <p>Firma del Candidato</p>
                </div>
                <div className={styles.sigLine}>
                    <div className={styles.sigBlank}></div>
                    <p>Evaluador / RR.HH.</p>
                </div>
            </div>
        </div>
    );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ExamResultPrint({ candidate, examId, onClose }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!candidate?.id || !examId) return;
        setLoading(true);
        loadExamResult(candidate.id, examId)
            .then(d => {
                if (!d) setError('No se encontró el resultado del examen.');
                else setData(d);
            })
            .catch(() => setError('Error al cargar el resultado.'))
            .finally(() => setLoading(false));
    }, [candidate?.id, examId]);

    const handlePrint = () => window.print();

    return (
        <AnimatePresence>
            <motion.div
                className={styles.overlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className={styles.modal}
                    initial={{ scale: 0.96, y: 24 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.96, y: 24 }}
                    transition={{ duration: 0.2 }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Top bar */}
                    <div className={styles.topBar}>
                        <span className={styles.topBadge}>
                            <FileText size={14} /> Examen Contestado — Listo para imprimir
                        </span>
                        <div className={styles.topActions}>
                            <button className={styles.btnPrint} onClick={handlePrint} disabled={loading || !!error}>
                                <Printer size={15} /> Imprimir
                            </button>
                            <button className={styles.btnClose} onClick={onClose}>
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className={styles.body}>
                        {loading && (
                            <div className={styles.center}>
                                <Loader size={28} className={styles.spin} />
                                <p>Cargando resultado…</p>
                            </div>
                        )}
                        {!loading && error && (
                            <div className={styles.center}>
                                <XCircle size={28} color="#ef4444" />
                                <p>{error}</p>
                            </div>
                        )}
                        {!loading && data && (
                            <PrintableExam
                                exam={data.exam}
                                result={data.result}
                                candidate={candidate}
                            />
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
