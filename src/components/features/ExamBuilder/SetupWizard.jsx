'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronRight, CheckCircle, X } from 'lucide-react';
import styles from './SetupWizard.module.css';

const TOTAL_STEPS = 2;

/**
 * Wizard de 2 pasos para crear un nuevo examen con metadatos pre-cargados.
 * Se muestra como overlay sobre la lista de exámenes.
 * @param {Function} onFinish - Recibe el objeto con los metadatos del examen
 * @param {Function} onSkip - Llama cuando el usuario quiere empezar en blanco
 */
export default function SetupWizard({ onFinish, onSkip }) {
    const [step, setStep] = useState(0);
    const [data, setData] = useState({
        documentId: '',
        revision: 'Rev. 1',
        title: '',
        passingScore: 7,
    });

    const update = (field, value) => setData(prev => ({ ...prev, [field]: value }));
    const canNext = data.title.trim().length > 0;

    return (
        <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className={styles.wizard}
                initial={{ scale: 0.95, y: 28 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ duration: 0.22 }}
            >
                {/* Encabezado */}
                <div className={styles.header}>
                    <div className={styles.brand}>
                        <FileText size={18} />
                        <span>Nuevo examen</span>
                    </div>
                    <button className={styles.skipBtn} onClick={onSkip} title="Empezar en blanco">
                        Saltar <X size={13} />
                    </button>
                </div>

                {/* Indicador de pasos */}
                <div className={styles.stepIndicator}>
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                        <div
                            key={i}
                            className={`${styles.stepDot} ${step >= i ? styles.stepDotActive : ''}`}
                        />
                    ))}
                    <span className={styles.stepLabel}>Paso {step + 1} de {TOTAL_STEPS}</span>
                </div>

                {/* Contenido animado por paso */}
                <AnimatePresence mode="wait">
                    {step === 0 && (
                        <motion.div
                            key="step0"
                            className={styles.stepContent}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.18 }}
                        >
                            <h2 className={styles.stepTitle}>Información del documento</h2>
                            <p className={styles.stepDesc}>
                                Estos datos son auditables y aparecerán en el encabezado impreso del examen.
                            </p>

                            <div className={styles.fieldGroup}>
                                <label className={styles.label}>Título del examen *</label>
                                <input
                                    className={styles.input}
                                    value={data.title}
                                    onChange={e => update('title', e.target.value)}
                                    placeholder="Alerta de calidad y catálogo de fallas"
                                    autoFocus
                                />
                            </div>

                            <div className={styles.fieldRow}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>ID del documento</label>
                                    <input
                                        className={styles.input}
                                        value={data.documentId}
                                        onChange={e => update('documentId', e.target.value)}
                                        placeholder="RG-GER-015"
                                    />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Revisión</label>
                                    <input
                                        className={styles.input}
                                        value={data.revision}
                                        onChange={e => update('revision', e.target.value)}
                                        placeholder="Rev. 1"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div
                            key="step1"
                            className={styles.stepContent}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.18 }}
                        >
                            <h2 className={styles.stepTitle}>Configuración de evaluación</h2>
                            <p className={styles.stepDesc}>
                                Define el puntaje mínimo. Un candidato necesita este porcentaje del total de puntos para aprobar.
                            </p>

                            <div className={styles.fieldGroupNarrow}>
                                <label className={styles.label}>Puntaje mínimo para aprobar (/ 10)</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={data.passingScore}
                                    min={1}
                                    max={10}
                                    step={0.5}
                                    onChange={e => update('passingScore', +e.target.value)}
                                />
                            </div>

                            {/* Resumen visual del examen a crear */}
                            <div className={styles.summaryCard}>
                                <p className={styles.summaryTitle}>Resumen del examen</p>
                                <div className={styles.summaryRow}>
                                    <span>Título</span>
                                    <strong>{data.title}</strong>
                                </div>
                                {data.documentId && (
                                    <div className={styles.summaryRow}>
                                        <span>Documento</span>
                                        <strong>{data.documentId} · {data.revision}</strong>
                                    </div>
                                )}
                                <div className={styles.summaryRow}>
                                    <span>Mínimo para aprobar</span>
                                    <strong>{data.passingScore} / 10</strong>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navegación */}
                <div className={styles.nav}>
                    {step > 0 && (
                        <button className={styles.btnPrev} onClick={() => setStep(s => s - 1)}>
                            Atrás
                        </button>
                    )}
                    <div className={styles.navSpacer} />
                    {step < TOTAL_STEPS - 1 ? (
                        <button
                            className={styles.btnNext}
                            onClick={() => setStep(s => s + 1)}
                            disabled={!canNext}
                        >
                            Siguiente <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button
                            className={styles.btnFinish}
                            onClick={() => onFinish(data)}
                            disabled={!canNext}
                        >
                            <CheckCircle size={16} /> Crear examen
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
