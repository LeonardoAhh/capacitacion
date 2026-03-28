'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { IconTrash2, IconArrowLeft, IconCheckCircle2, Loader2 } from '@/lib/icons';
import MediaUploader from './MediaUploader';
import styles from '@/app/induccion/cursos/[id]/editar/editor.module.css';
import { SLIDE_TYPE_LABELS } from './slideConstants';

// Editores por tipo
import TitleSlideEditor from './SlideEditors/TitleSlideEditor';
import ContentSlideEditor from './SlideEditors/ContentSlideEditor';
import SimpleBodySlideEditor from './SlideEditors/SimpleBodySlideEditor';
import BenefitsSlideEditor from './SlideEditors/BenefitsSlideEditor';
import IconGridSlideEditor from './SlideEditors/IconGridSlideEditor';
import ComparisonSlideEditor from './SlideEditors/ComparisonSlideEditor';
import DynamicSlideEditor from './SlideEditors/DynamicSlideEditor';
import StepsSlideEditor from './SlideEditors/StepsSlideEditor';
import QuizSlideEditor from './SlideEditors/QuizSlideEditor';
import VideoSlideEditor from './SlideEditors/VideoSlideEditor';
import FlashcardSlideEditor from './SlideEditors/FlashcardSlideEditor';
import FillBlankSlideEditor from './SlideEditors/FillBlankSlideEditor';
import ChecklistSlideEditor from './SlideEditors/ChecklistSlideEditor';

const DEBOUNCE_MS = 800;

// ── Despacho de editor por tipo ───────────────────────────────────────────────
function SlideFieldRouter({ type, formData, handleChange, handleBatchChange, setFormData, styles: s }) {
    const props = { formData, handleChange, setFormData, styles: s };
    switch (type) {
        case 'title':
            return <TitleSlideEditor {...props} />;
        case 'content':
            return <ContentSlideEditor {...props} handleBatchChange={handleBatchChange} />;
        case 'icon_grid':
            return <IconGridSlideEditor {...props} />;
        case 'comparison':
            return <ComparisonSlideEditor {...props} />;
        case 'steps':
            return <StepsSlideEditor {...props} />;
        case 'group_dynamic':
        case 'dynamic':
            return <DynamicSlideEditor {...props} />;
        case 'group_quiz':
        case 'quiz':
            return <QuizSlideEditor {...props} />;
        case 'objective':
        case 'definition':
            return <SimpleBodySlideEditor {...props} />;
        case 'benefits':
            return <BenefitsSlideEditor {...props} />;
        case 'video':
            return <VideoSlideEditor {...props} />;
        case 'flashcard':
            return <FlashcardSlideEditor {...props} />;
        case 'fill_blank':
            return <FillBlankSlideEditor {...props} />;
        case 'checklist':
            return <ChecklistSlideEditor {...props} />;
        default:
            return (
                <p className={styles.noEditor}>
                    Editor no disponible para tipo: <strong>{type}</strong>
                </p>
            );
    }
}

// ── Panel principal ───────────────────────────────────────────────────────────
export default function SlideEditorPanel({ slide, onSave, onDelete, onFormChange, isSaving }) {
    // structuredClone para copia profunda segura (sin perder undefined/Date)
    const [formData, setFormData] = useState(() => structuredClone(slide?.data ?? {}));
    const [savingState, setSavingState] = useState('idle'); // 'idle'|'saving'|'saved'|'error'
    const timerRef = useRef(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    // ── Auto-save con debounce ───────────────────────────────────────────────
    useEffect(() => {
        if (!slide || Object.keys(formData).length === 0) return;

        const originalStr = JSON.stringify(slide.data ?? {});
        const currentStr  = JSON.stringify(formData);
        if (originalStr === currentStr) return;

        setSavingState('saving');
        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(async () => {
            try {
                await onSave(slide.id, formData);
                if (!isMountedRef.current) return;
                setSavingState('saved');
                setTimeout(() => {
                    if (isMountedRef.current) {
                        setSavingState(curr => curr === 'saved' ? 'idle' : curr);
                    }
                }, 2000);
            } catch {
                if (isMountedRef.current) setSavingState('error');
            }
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [formData, slide, onSave]);

    // ── Sync de preview en vivo ──────────────────────────────────────────────
    // useEffect (no queueMicrotask en setState) — seguro con React concurrent mode
    useEffect(() => {
        if (onFormChange) onFormChange(formData);
        // onFormChange es una ref estable (useCallback en page.js) — exclusión deliberada
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData]);

    // ── Handlers de campo ───────────────────────────────────────────────────
    /** Actualiza un solo campo en formData */
    const handleChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    /** Actualiza múltiples campos en una sola operación (para ContentSlideEditor) */
    const handleBatchChange = useCallback((updates) => {
        setFormData(prev => ({ ...prev, ...updates }));
    }, []);

    if (!slide) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><IconArrowLeft size={32} /></div>
                <p>Selecciona un slide para editar</p>
            </div>
        );
    }

    const isDisabled = savingState === 'saving' || isSaving;

    return (
        <div className={styles.formContainer}>
            {/* Cabecera del panel */}
            <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>
                    Slide {slide.order} — {SLIDE_TYPE_LABELS[slide.type] || slide.type}
                </h2>
                <div className={styles.panelHeaderActions}>
                    <div className={`${styles.saveBadge} ${styles[savingState] || styles.idle}`}>
                        {savingState === 'saving' && <><Loader2 size={14} className={styles.spin} /> Guardando...</>}
                        {savingState === 'saved'  && <><IconCheckCircle2 size={14} /> Guardado</>}
                        {savingState === 'error'  && <>Error al guardar</>}
                        {savingState === 'idle'   && <span>Auto-guardado activo</span>}
                    </div>
                    <button
                        className={styles.deleteBtn}
                        onClick={() => onDelete(slide.id)}
                        disabled={isDisabled}
                        title="Eliminar este slide"
                        aria-label="Eliminar slide"
                    >
                        <IconTrash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Editor específico por tipo */}
            <SlideFieldRouter
                type={slide.type}
                formData={formData}
                handleChange={handleChange}
                handleBatchChange={handleBatchChange}
                setFormData={setFormData}
                styles={styles}
            />

            {/* Multimedia global del slide */}
            <div className={styles.mediaSection}>
                {formData.bgMedia?.url && (
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Layout del Multimedia</label>
                        <div className={styles.mediaLayoutBtnGroup}>
                            <button
                                className={`${styles.mediaLayoutBtn} ${formData.bgMedia.layout !== 'split' ? styles.mediaLayoutBtnActive : ''}`}
                                onClick={() => handleChange('bgMedia', { ...formData.bgMedia, layout: 'full' })}
                            >
                                Fondo Completo
                            </button>
                            <button
                                className={`${styles.mediaLayoutBtn} ${formData.bgMedia.layout === 'split' ? styles.mediaLayoutBtnActive : ''}`}
                                onClick={() => handleChange('bgMedia', { ...formData.bgMedia, layout: 'split' })}
                            >
                                Mitad Pantalla
                            </button>
                        </div>
                    </div>
                )}
                <MediaUploader
                    currentMedia={formData.bgMedia ?? null}
                    onMediaChange={mediaObj => {
                        if (!mediaObj) {
                            handleChange('bgMedia', null);
                        } else {
                            handleChange('bgMedia', { ...mediaObj, layout: formData.bgMedia?.layout ?? 'full' });
                        }
                    }}
                    label="Fondo / Apoyo Multimedia (Opcional)"
                />
            </div>
        </div>
    );
}
