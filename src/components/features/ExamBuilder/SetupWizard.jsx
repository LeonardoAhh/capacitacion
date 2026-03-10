'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronRight, CheckCircle, X, Users, Check, AlertCircle } from 'lucide-react';
import styles from './SetupWizard.module.css';

const TOTAL_STEPS = 3; // +1 para Puestos

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
        puestosAplicables: [], // Nuevo campo
    });

    // Cargar puestos desde Firebase y buscar coincidencias automáticas
    useEffect(() => {
        const fetchPositions = async () => {
            setLoadingPositions(true);
            try {
                const snapshot = await getDocs(collection(db, 'positions'));
                const autoAssigned = [];
                
                snapshot.forEach(doc => {
                    const posData = doc.data();
                    const name = posData.name || doc.id;
                    // Verificamos si este examen (por título) está en los requiredCourses de la posición
                    if (posData.requiredCourses && Array.isArray(posData.requiredCourses)) {
                        if (data.title && posData.requiredCourses.includes(data.title)) {
                            autoAssigned.push(name);
                        }
                    }
                });

                const uniqueAssigned = [...new Set(autoAssigned)].sort((a, b) => a.localeCompare(b));
                setAvailablePositions(uniqueAssigned);
                
                // Forzamos la actualización silenciosa del examen
                setData(prev => ({ ...prev, puestosAplicables: uniqueAssigned }));

            } catch (error) {
                console.error('Error fetching positions:', error);
            } finally {
                setLoadingPositions(false);
            }
        };
        
        if (step === 2) {
            fetchPositions();
        }
    }, [step, data.title]);

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
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            className={styles.stepContent}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.18 }}
                        >
                            <div className={styles.stepTitleRow}>
                                <h2 className={styles.stepTitle}>Puestos Asignados</h2>
                                <span className={styles.autoDetectBadge}>Detección Automática <Check size={12} strokeWidth={3} /></span>
                            </div>
                            <p className={styles.stepDesc}>
                                El sistema detecta automáticamente qué puestos deben presentar este examen con base en el <strong>Catálogo de Puestos</strong>. Si necesitas añadir más, modifícalo desde la configuración del puesto.
                            </p>

                            <div className={styles.puestosContainer}>
                                {loadingPositions ? (
                                    <p className={styles.loadingText}>Analizando matriz de capacitación...</p>
                                ) : availablePositions.length > 0 ? (
                                    <div className={styles.puestosGrid}>
                                        {availablePositions.map(puesto => {
                                            return (
                                                <div
                                                    key={puesto}
                                                    className={`${styles.puestoChip} ${styles.puestoChipReadOnly}`}
                                                    title="Asignado automáticamente"
                                                >
                                                    <span className={styles.puestoDot}></span>
                                                    <span>{puesto}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className={styles.warningBox}>
                                        <AlertCircle size={16} />
                                        <p>Ningún puesto tiene asignado el examen <strong>&quot;{data.title}&quot;</strong> todavía.</p>
                                    </div>
                                )}
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
                                    <span>Puestos</span>
                                    <strong>{data.puestosAplicables?.length || 0} seleccionados</strong>
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
