'use client';

import { useState, useEffect } from 'react';
import {
    IconBookOpen, IconCheck, IconTarget, IconUsers, IconLayout,
    IconFileText, IconBars, IconCheckSquare, IconZap, IconList
} from '@/lib/icons';
import styles from './CourseWizardModal.module.css';

const MAX_STEPS = 3;

/**
 * Premium Wizard UI para la creación guiada de cursos interactivos.
 * Presenta 3 pasos fluidos: Presentación, Detalles (Título/Categoría), y Plantilla inicial.
 */
export default function CourseWizardModal({ onComplete, onCancel }) {
    const [step, setStep] = useState(1);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('General');
    const [firstSlideType, setFirstSlideType] = useState('title');
    const [isAnimating, setIsAnimating] = useState(false);

    // Evitar scroll en el fondo mientras el modal está abierto
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const changeStep = (newStep) => {
        setIsAnimating(true);
        setTimeout(() => {
            setStep(newStep);
            setIsAnimating(false);
        }, 200);
    };

    const handleNext = () => {
        if (step === 2 && !title.trim()) return;
        changeStep(Math.min(step + 1, MAX_STEPS));
    };

    const handlePrev = () => {
        changeStep(Math.max(step - 1, 1));
    };

    const handleFinish = () => {
        if (!title.trim()) return;
        onComplete({
            title: title.trim(),
            category
        }, firstSlideType);
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className={`${styles.stepContent} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}>
                        <div className={styles.heroSection}>
                            <div className={styles.heroIconWrapper}>
                                <IconZap size={36} className={styles.heroIcon} />
                            </div>
                            <h2 className={styles.heroTitle}>Nuevo Curso Interactivo</h2>
                            <p className={styles.heroSubtitle}>
                                Diseña experiencias de capacitación dinámicas que involucren a tus colaboradores mediante micro-aprendizaje y evaluaciones prácticas.
                            </p>
                        </div>

                        <div className={styles.featuresList}>
                            <div className={styles.featureItem}>
                                <div className={styles.featureIcon}><IconBookOpen size={20} /></div>
                                <div className={styles.featureText}>
                                    <strong>Plantillas Inteligentes</strong>
                                    <p>Organiza contenido con portadas, teoría, listas y resúmenes estructurados.</p>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <div className={styles.featureIcon}><IconTarget size={20} /></div>
                                <div className={styles.featureText}>
                                    <strong>Evaluación Continua</strong>
                                    <p>Integra Quizzes interactivos para validar el aprendizaje en tiempo real.</p>
                                </div>
                            </div>
                            <div className={styles.featureItem}>
                                <div className={styles.featureIcon}><IconUsers size={20} /></div>
                                <div className={styles.featureText}>
                                    <strong>Dinámicas Grupales</strong>
                                    <p>Habilita interacciones y debates entre los participantes del curso.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className={`${styles.stepContent} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}>
                        <div className={styles.headerContext}>
                            <h2 className={styles.stepTitle}>Detalles del Curso</h2>
                            <p className={styles.stepSubtitle}>Proporciona la información principal para identificar tu nuevo curso.</p>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Título del Curso <span className={styles.required}>*</span>
                            </label>
                            <input
                                autoFocus
                                type="text"
                                className={styles.input}
                                placeholder="Ej. Inducción a Seguridad Industrial"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && title.trim() && handleNext()}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Categoría</label>
                            <div className={styles.selectWrapper}>
                                <select
                                    className={styles.select}
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                >
                                    <option value="General">General</option>
                                    <option value="Seguridad Industrial">Seguridad Industrial</option>
                                    <option value="Operaciones">Operaciones</option>
                                    <option value="Calidad">Calidad</option>
                                    <option value="Cultura">Cultura Organizacional</option>
                                    <option value="Soft Skills">Soft Skills</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className={`${styles.stepContent} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}>
                        <div className={styles.headerContext}>
                            <h2 className={styles.stepTitle}>Selecciona una Plantilla</h2>
                            <p className={styles.stepSubtitle}>Elige un lienzo inicial para empezar a construir tu curso interactivo.</p>
                        </div>

                        <div className={styles.templatesGrid}>
                            {[
                                { id: 'title', icon: IconLayout, label: 'Portada de Título', desc: 'Ideal para iniciar el curso o un módulo.' },
                                { id: 'objective', icon: IconTarget, label: 'Objetivo', desc: 'Define las metas claras de aprendizaje.' },
                                { id: 'content', icon: IconFileText, label: 'Lectura', desc: 'Bloque de texto e imágenes descriptivo.' },
                                { id: 'benefits', icon: IconBars, label: 'Viñetas', desc: 'Lista estructurada de conceptos rápidos.' },
                                { id: 'steps', icon: IconList, label: 'Paso a Paso', desc: 'Secuencia numerada de pasos del proceso.' },
                                { id: 'quiz', icon: IconCheckSquare, label: 'Quiz', desc: 'Añade una pregunta de opción múltiple.' }
                            ].map(tpl => (
                                <div
                                    key={tpl.id}
                                    className={`${styles.templateCard} ${firstSlideType === tpl.id ? styles.selectedTemplate : ''}`}
                                    onClick={() => setFirstSlideType(tpl.id)}
                                >
                                    <div className={styles.templateIconWrapper}>
                                        <tpl.icon size={26} />
                                    </div>
                                    <div className={styles.templateInfo}>
                                        <span className={styles.templateLabel}>{tpl.label}</span>
                                        <span className={styles.templateDesc}>{tpl.desc}</span>
                                    </div>
                                    <div className={styles.radioIndicator}>
                                        {firstSlideType === tpl.id && <IconCheck size={14} className={styles.checkIcon} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {/* ── PROGRESS STRIP ── */}
                <div className={styles.progressContainer}>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ transform: `translateX(-${100 - ((step) / MAX_STEPS) * 100}%)` }}
                        />
                    </div>
                </div>

                {/* ── DYNAMIC BODY ── */}
                <div className={styles.body}>
                    {renderStepContent()}
                </div>

                {/* ── FOOTER ACTIONS ── */}
                <div className={styles.footer}>
                    <div className={styles.footerLeft}>
                        <span className={styles.stepIndicator}>Paso {step} de {MAX_STEPS}</span>
                    </div>
                    <div className={styles.footerRight}>
                        {step === 1 ? (
                            <button className={styles.btnSecondary} onClick={onCancel}>
                                Cancelar
                            </button>
                        ) : (
                            <button className={styles.btnSecondary} onClick={handlePrev} disabled={isAnimating}>
                                Volver
                            </button>
                        )}

                        {step < MAX_STEPS ? (
                            <button
                                className={styles.btnPrimary}
                                onClick={handleNext}
                                disabled={isAnimating || (step === 2 && !title.trim())}
                            >
                                Continuar
                            </button>
                        ) : (
                            <button
                                className={`${styles.btnPrimary} ${styles.btnFinish}`}
                                onClick={handleFinish}
                                disabled={isAnimating}
                            >
                                Crear Curso
                                <IconZap size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
