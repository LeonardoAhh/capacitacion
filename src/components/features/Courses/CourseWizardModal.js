'use client';

import { useState, useEffect } from 'react';
import {
    IconBookOpen, IconCheck, IconTarget, IconUsers, IconLayout,
    IconFileText, IconBars, IconCheckSquare, IconZap, IconList,
    IconPlay, IconCopy,
} from '@/lib/icons';
import styles from './CourseWizardModal.module.css';
import { Select } from '@/components/ui/Select/Select';

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

    // Focus trap avanzado y body lock
    useEffect(() => {
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onCancel();
                return;
            }
            if (e.key === 'Tab') {
                const focusable = Array.from(
                    document.querySelectorAll(
                        '.wizard-modal button, .wizard-modal [href], .wizard-modal input, .wizard-modal select, .wizard-modal textarea, .wizard-modal [tabindex]:not([tabindex="-1"])'
                    )
                );
                if (focusable.length === 0) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    last.focus();
                    e.preventDefault();
                } else if (!e.shiftKey && document.activeElement === last) {
                    first.focus();
                    e.preventDefault();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onCancel]);

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
                    <div
                        className={`${styles.stepContent} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}
                        role="form"
                        aria-labelledby="wizard-step1-title"
                    >
                        <div className={styles.heroSection}>
                            <div className={styles.heroIconWrapper} aria-hidden="true">
                                <IconZap size={36} className={styles.heroIcon} />
                            </div>
                            <h2 id="wizard-step1-title" className={styles.heroTitle}>Nuevo Curso Interactivo</h2>
                            <p className={styles.heroSubtitle}>
                                Diseña experiencias de capacitación dinámicas que involucren a tus colaboradores mediante micro-aprendizaje y evaluaciones prácticas.
                            </p>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div
                        className={`${styles.stepContent} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}
                        role="form"
                        aria-labelledby="wizard-step2-title"
                    >
                        <div className={styles.headerContext}>
                            <h2 id="wizard-step2-title" className={styles.stepTitle}>Detalles del Curso</h2>
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
                            <Select
                                value={category}
                                onChange={value => setCategory(value)}
                                options={[
                                    { value: 'General', label: 'General' },
                                    { value: 'Seguridad e Higiene', label: 'Seguridad e Higiene' },
                                    { value: 'Producción', label: 'Producción' },
                                    { value: 'Calidad', label: 'Calidad' },
                                    { value: 'Recursos Humanos', label: 'Recursos Humanos' },
                                ]}
                            />
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div
                        className={`${styles.stepContent} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}
                        role="form"
                        aria-labelledby="wizard-step3-title"
                    >
                        <div className={styles.headerContext}>
                            <h2 id="wizard-step3-title" className={styles.stepTitle}>Selecciona una Plantilla</h2>
                            <p className={styles.stepSubtitle}>Elige un lienzo inicial para empezar a construir tu curso interactivo.</p>
                        </div>

                        <div className={styles.templatesGrid} role="radiogroup" aria-required="true" aria-label="Selección de plantilla">
                            <div
                                className={`${styles.templateCard} ${firstSlideType === 'title' ? styles.selectedTemplate : ''}`}
                                onClick={() => setFirstSlideType('title')}
                                role="radio"
                                aria-checked={firstSlideType === 'title'}
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setFirstSlideType('title');
                                    }
                                }}
                            >
                                <div className={styles.templateIconWrapper} aria-hidden="true">
                                    <IconLayout size={26} />
                                </div>
                                <div className={styles.templateInfo}>
                                    <span className={styles.templateLabel}>Portada de Título</span>
                                    <span className={styles.templateDesc}>Ideal para iniciar el curso o un módulo.</span>
                                </div>
                                <div className={styles.radioIndicator}>
                                    {firstSlideType === 'title' && <IconCheck size={14} className={styles.checkIcon} />}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div
            className={`${styles.overlay} wizard-modal`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`wizard-step${step}-title`}
        >
            <div className={styles.modal}>
                {/* ── PROGRESS STRIP ── */}
                <div className={styles.progressContainer} aria-hidden="true">
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
