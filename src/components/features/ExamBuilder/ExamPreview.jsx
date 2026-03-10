'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { X, Printer } from 'lucide-react';
import styles from './ExamBuilder.module.css';

/** Logo de la empresa desde /public */
function CompanyLogo() {
    return (
        <div className={styles.logo}>
            <Image
                src="/logo-vino-plastic.png"
                alt="Viñoplastic"
                width={80}
                height={64}
                className={styles.logoImg}
                unoptimized
                priority
            />
        </div>
    );
}

/**
 * Modal de vista previa fiel del examen, tal como lo verá el candidato.
 */
export default function ExamPreview({ exam, onClose }) {
    const handlePrint = () => window.print();

    return (
        <motion.div
            className={styles.previewOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.previewPanel}
                initial={{ scale: 0.96, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 24 }}
                transition={{ duration: 0.22 }}
                onClick={e => e.stopPropagation()}
            >
                {/* Barra superior del modal */}
                <div className={styles.previewTopBar}>
                    <span className={styles.previewBadge}>Vista previa — Formato Candidato</span>
                    <div className={styles.previewTopActions}>
                        <button className={styles.previewPrintBtn} onClick={handlePrint} title="Imprimir">
                            <Printer size={16} />
                        </button>
                        <button className={styles.previewClose} onClick={onClose} title="Cerrar">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Contenido del examen (formato imprimible) */}
                <ExamDocument exam={exam} />
            </motion.div>
        </motion.div>
    );
}

/**
 * Componente puro que renderiza el formato del examen (Reutilizable para impresión directa)
 */
export function ExamDocument({ exam }) {
    return (
        <div className={styles.previewContent}>
                    {/* Encabezado con logo y datos auditables */}
                    <div className={styles.previewHeaderRow}>
                        <CompanyLogo />
                        <div className={styles.previewMeta}>
                            <span className={`${styles.previewDocId} ${styles.hideOnPrint}`}>
                                {exam.documentId || 'ID-DOC'} · {exam.revision || 'Rev. —'}
                            </span>
                            <h1 className={styles.previewTitle}>Evaluación</h1>
                            <p className={styles.previewSubtitle}>{exam.title || 'Sin título'}</p>
                        </div>
                    </div>

                    {/* Tabla de datos del candidato */}
                    <table className={styles.previewTable}>
                        <tbody>
                            <tr>
                                <td className={styles.previewTdLabel}>NOMBRE:</td>
                                <td className={styles.previewTd}>___________________________________</td>
                                <td className={styles.previewTdLabel}>CALIFICACIÓN:</td>
                                <td className={styles.previewTd}>_________</td>
                            </tr>
                            <tr>
                                <td className={styles.previewTdLabel}>DEPARTAMENTO:</td>
                                <td className={styles.previewTd}>___________________________________</td>
                                <td className={styles.previewTdLabel}>FECHA:</td>
                                <td className={styles.previewTd}>
                                    {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Preguntas */}
                    <p className={styles.previewInstruction}>Contesta las siguientes preguntas:</p>

                    {exam.questions.length === 0 && (
                        <p className={styles.previewEmpty}>No hay preguntas aún. Agrega algunas desde el editor.</p>
                    )}

                    {exam.questions.map((q, idx) => (
                        <div key={q.id} className={styles.previewQuestion}>
                            <p className={styles.previewQText}>
                                <strong>{idx + 1}.</strong>{' '}
                                {q.text || <em>Sin texto</em>}
                                <span className={styles.previewPts}> ({q.points} pts)</span>
                            </p>

                            {/* Opciones de selección */}
                            {(q.type === 'single' || q.type === 'multiple') && q.options.map(opt => (
                                <div key={opt.id} className={styles.previewOption}>
                                    <span className={styles.previewBubble} />
                                    <span>
                                        <strong>{opt.id})</strong>{' '}
                                        {opt.text || <em>Opción vacía</em>}
                                    </span>
                                </div>
                            ))}

                            {/* Afirmaciones V/F */}
                            {q.type === 'truefalse' && q.statements.map(s => (
                                <div key={s.id} className={styles.previewStatement}>
                                    <span className={styles.previewTfBox}>V</span>
                                    <span className={styles.previewTfBox}>F</span>
                                    <span>{s.text || <em>Afirmación vacía</em>}</span>
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* Pie del examen */}
                    <div className={styles.previewFooter}>
                        <span className={styles.hideOnPrint}>Mínimo para aprobar: <strong>{exam.passingScore} / 10</strong></span>
                        <span className={styles.footerDocInfo}>{exam.documentId} · {exam.revision}</span>
                    </div>
                </div>
    );
}
