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

    /**
     * Genera HTML puro del examen y lo imprime en una ventana emergente limpia,
     * sin mostrar nada del navegador (navbar, sidebar, modal, etc.).
     */
    const handlePrint = () => {
        if (!data) return;
        const { exam, result } = data;
        const answersMap = result.answers || {};
        const passingScore = exam.passingScore ?? 7;
        const passed = result.score10 >= passingScore;
        const today = new Date().toLocaleDateString('es-MX', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });

        /** Calcula si una pregunta fue correcta */
        const isQuestionCorrect = (q) => {
            const selected = answersMap[q.id];
            if (q.type === 'single' || !q.type) return selected === q.correct;
            if (q.type === 'multiple') {
                const a = [...(selected || [])].sort().join(',');
                const b = [...(q.correct || [])].sort().join(',');
                return a === b;
            }
            if (q.type === 'truefalse') {
                return (q.statements || []).every(s => selected?.[s.id] === s.correct);
            }
            return false;
        };

        /** Genera el HTML de las opciones de una pregunta */
        const renderOptions = (q) => {
            const selected = answersMap[q.id];

            if (q.type === 'truefalse') {
                return (q.statements || []).map(stmt => {
                    const userAnswer = selected?.[stmt.id];
                    const ok = userAnswer === stmt.correct;
                    return `
                    <li style="display:flex;justify-content:space-between;padding:3px 6px;border-bottom:1px solid #eee;font-size:12px;">
                        <span>${stmt.text}</span>
                        <span style="color:${ok ? '#16a34a' : '#dc2626'};font-weight:700;">
                            ${userAnswer !== undefined ? (userAnswer ? 'Verdadero' : 'Falso') : '—'}
                            &nbsp;<span style="color:#555;font-weight:400;">(esperado: ${stmt.correct ? 'Verdadero' : 'Falso'})</span>
                        </span>
                    </li>`;
                }).join('');
            }

            // single o multiple
            return (q.options || []).map(opt => {
                const isSelected = q.type === 'multiple'
                    ? (selected || []).includes(opt.id)
                    : selected === opt.id;
                const isRight = q.type === 'multiple'
                    ? (q.correct || []).includes(opt.id)
                    : opt.id === q.correct;

                const bg = isSelected ? '#fef9c3' : 'transparent';
                const fw = isRight ? '700' : '400';

                return `
                <li style="display:flex;align-items:flex-start;gap:8px;padding:3px 6px;border-radius:4px;background:${bg};font-size:12px;font-weight:${fw};">
                    <span style="color:${isSelected ? '#d97706' : '#aaa'};flex-shrink:0;">${isSelected ? '◉' : '○'}</span>
                    ${opt.text}
                    ${isRight ? '<span style="color:#16a34a;font-size:10px;margin-left:4px;">← correcta</span>' : ''}
                </li>`;
            }).join('');
        };

        /** Genera bloque HTML de cada pregunta */
        const questionsHtml = (exam.questions || []).map((q, idx) => {
            const correct = isQuestionCorrect(q);
            const mark = correct
                ? '<span style="color:#16a34a;font-weight:900;">✓</span>'
                : '<span style="color:#dc2626;font-weight:900;">✗</span>';

            return `
            <div style="margin-bottom:1.1rem;padding-bottom:0.9rem;border-bottom:1px dashed #ccc;">
                <p style="font-weight:700;font-size:13px;margin:0 0 6px;display:flex;gap:6px;align-items:flex-start;line-height:1.4;">
                    ${mark} ${idx + 1}. ${q.text}
                </p>
                <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:3px;">
                    ${renderOptions(q)}
                </ul>
            </div>`;
        }).join('');

        const logoUrl = window.location.origin + '/logo-vino-plastic.png';
        const calStr = `${result.score10} / 10 &nbsp; (${passed ? '✓ APROBADO' : '✗ NO APROBADO'})`;
        const calColor = passed ? '#16a34a' : '#dc2626';

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Examen — ${exam.title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 1.5cm; }
    @page { margin: 1.5cm; }
  </style>
</head>
<body>
  <!-- Encabezado -->
  <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #000;">
    <img src="${logoUrl}" alt="Viñoplastic" width="70" height="56" style="object-fit:contain;flex-shrink:0;"/>
    <div>
      <span style="font-size:10px;color:#666;">${exam.documentId || ''} · ${exam.revision || ''}</span>
      <h1 style="font-size:18px;font-weight:900;margin-top:2px;">Evaluación</h1>
      <p style="font-size:12px;font-weight:700;color:#333;text-transform:uppercase;">${exam.title || ''}</p>
    </div>
  </div>

  <!-- Datos del candidato -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:12px;">
    <tbody>
      <tr>
        <td style="border:1px solid #888;padding:5px 7px;background:#f0f0f0;font-weight:700;white-space:nowrap;">NOMBRE:</td>
        <td style="border:1px solid #888;padding:5px 7px;">${candidate.name || ''}</td>
        <td style="border:1px solid #888;padding:5px 7px;background:#f0f0f0;font-weight:700;white-space:nowrap;">NO. EMPLEADO:</td>
        <td style="border:1px solid #888;padding:5px 7px;">${candidate.employeeId || ''}</td>
      </tr>
      <tr>
        <td style="border:1px solid #888;padding:5px 7px;background:#f0f0f0;font-weight:700;">PUESTO:</td>
        <td style="border:1px solid #888;padding:5px 7px;">${candidate.position || ''}</td>
        <td style="border:1px solid #888;padding:5px 7px;background:#f0f0f0;font-weight:700;">FECHA:</td>
        <td style="border:1px solid #888;padding:5px 7px;">${today}</td>
      </tr>
      <tr>
        <td style="border:1px solid #888;padding:5px 7px;background:#f0f0f0;font-weight:700;">DEPARTAMENTO:</td>
        <td style="border:1px solid #888;padding:5px 7px;">${candidate.department || candidate.area || ''}</td>
        <td style="border:1px solid #888;padding:5px 7px;background:#f0f0f0;font-weight:700;">CALIFICACIÓN:</td>
        <td style="border:1px solid #888;padding:5px 7px;font-weight:700;color:${calColor};">${calStr}</td>
      </tr>
    </tbody>
  </table>

  <!-- Preguntas -->
  <div>
    ${questionsHtml}
  </div>

  <!-- Firmas -->
  <div style="display:flex;gap:3rem;margin-top:2.5rem;padding-top:1rem;">
    <div style="flex:1;text-align:center;">
      <div style="height:40px;border-bottom:1px solid #000;margin-bottom:4px;"></div>
      <p style="font-size:11px;color:#555;">Firma del Candidato</p>
    </div>
    <div style="flex:1;text-align:center;">
      <div style="height:40px;border-bottom:1px solid #000;margin-bottom:4px;"></div>
      <p style="font-size:11px;color:#555;">Evaluador / RR.HH.</p>
    </div>
  </div>
</body>
</html>`;

        const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
        if (!printWindow) {
            alert('Tu navegador bloqueó la ventana emergente. Permite los pop-ups para este sitio e intenta de nuevo.');
            return;
        }
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        // Esperar a que cargue el logo antes de imprimir
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
        // Fallback si onload no dispara a tiempo
        setTimeout(() => {
            try { printWindow.print(); printWindow.close(); } catch (_) {}
        }, 1500);
    };

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
