import { useState, useEffect, useRef, useCallback } from 'react';
import { IconTrash2, IconArrowLeft, IconCheckCircle2, Loader2, IconPlus } from '@/lib/icons';
import MediaUploader from './MediaUploader';
import RichTextEditor from './RichTextEditor';
import styles from '@/app/induccion/cursos/[id]/editar/editor.module.css';

// Importar submódulos de edición (SRP)
import TitleSlideEditor from './SlideEditors/TitleSlideEditor';
import ContentSlideEditor from './SlideEditors/ContentSlideEditor';
import IconGridSlideEditor from './SlideEditors/IconGridSlideEditor';
import ComparisonSlideEditor from './SlideEditors/ComparisonSlideEditor';
import DynamicSlideEditor from './SlideEditors/DynamicSlideEditor';
import StepsSlideEditor from './SlideEditors/StepsSlideEditor';
import QuizSlideEditor from './SlideEditors/QuizSlideEditor';

const BODY_MAX_CHARS = 600;

export default function SlideEditorPanel({ slide, onSave, onDelete, onFormChange }) {
    const [formData, setFormData] = useState(() =>
        JSON.parse(JSON.stringify(slide?.data || {}))
    );
    const [savingState, setSavingState] = useState('idle');
    const timerRef = useRef(null);

    // Auto-save con debounce
    useEffect(() => {
        if (!slide || Object.keys(formData).length === 0) return;

        const originalDataStr = JSON.stringify(slide.data || {});
        const currentDataStr = JSON.stringify(formData);

        if (originalDataStr !== currentDataStr) {
            setSavingState('saving');
            if (timerRef.current) clearTimeout(timerRef.current);

            timerRef.current = setTimeout(async () => {
                try {
                    await onSave(slide.id, formData);
                    setSavingState('saved');
                    setTimeout(() => {
                        setSavingState(curr => curr === 'saved' ? 'idle' : curr);
                    }, 2000);
                } catch (error) {
                    console.error('Auto-save failed', error);
                    setSavingState('error');
                }
            }, 800);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [formData, slide, onSave]);

    const handleChange = useCallback((field, value) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };
            if (onFormChange) {
                queueMicrotask(() => onFormChange(next));
            }
            return next;
        });
    }, [onFormChange]);

    if (!slide) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><IconArrowLeft size={32} /></div>
                <p>Selecciona un slide para editar</p>
            </div>
        );
    }

    // ── Despacho de render por tipo ───────────────────────────────────────────
    const renderFields = () => {
        const props = { formData, handleChange, setFormData, styles };

        switch (slide.type) {
            case 'title': return <TitleSlideEditor {...props} />;
            case 'content': return <ContentSlideEditor {...props} />;
            case 'icon_grid': return <IconGridSlideEditor {...props} />;
            case 'comparison': return <ComparisonSlideEditor {...props} />;
            case 'steps': return <StepsSlideEditor {...props} />;
            case 'group_dynamic':
            case 'dynamic':
                return <DynamicSlideEditor {...props} />;
            case 'group_quiz':
            case 'quiz':
                return <QuizSlideEditor {...props} />;

            case 'objective':
            case 'definition':
                return (
                    <>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Encabezado</label>
                            <input
                                className={styles.input}
                                value={formData.heading || ''}
                                onChange={e => handleChange('heading', e.target.value)}
                                maxLength={120}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Cuerpo de texto</label>
                            <RichTextEditor
                                value={formData.body || ''}
                                onChange={(html) => handleChange('body', html)}
                                placeholder="Escribe el objetivo o definición del curso..."
                                maxLength={BODY_MAX_CHARS}
                                minRows={4}
                            />
                        </div>
                    </>
                );
            case 'benefits':
                return (
                    <>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Encabezado</label>
                            <input
                                className={styles.input}
                                value={formData.heading || ''}
                                onChange={e => handleChange('heading', e.target.value)}
                                maxLength={100}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Beneficios</label>
                            <div className={styles.itemsList}>
                                {formData.items?.map((item, idx) => (
                                    <div key={idx} className={styles.itemRow}>
                                        <input
                                            className={styles.input}
                                            value={item.text || item}
                                            maxLength={200}
                                            onChange={e => {
                                                const newItems = [...formData.items];
                                                newItems[idx] = typeof item === 'object'
                                                    ? { ...item, text: e.target.value }
                                                    : e.target.value;
                                                handleChange('items', newItems);
                                            }}
                                        />
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => {
                                                const newItems = formData.items.filter((_, i) => i !== idx);
                                                handleChange('items', newItems);
                                            }}
                                        >
                                            <IconTrash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    className={styles.addItemBtn}
                                    onClick={() => handleChange('items', [...(formData.items || []), { text: 'Nuevo beneficio' }])}
                                >
                                    <IconPlus size={14} /> Agregar Beneficio
                                </button>
                            </div>
                        </div>
                    </>
                );
            default:
                return <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Editor no disponible para tipo: {slide.type}</p>;
        }
    };

    const SLIDE_TYPE_LABELS = {
        title: 'Portada', objective: 'Objetivo', definition: 'Definición',
        content: 'Contenido', benefits: 'Beneficios', icon_grid: 'Íconos',
        comparison: 'Comparación', quiz: 'Quiz', group_quiz: 'Quiz',
        dynamic: 'Dinámica', group_dynamic: 'Dinámica',
        steps: 'Paso a Paso',
    };

    return (
        <div className={styles.formContainer}>
            {/* Cabecera del panel con estado de guardado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 className={styles.formTitle}>
                    Slide {slide.order} — {SLIDE_TYPE_LABELS[slide.type] || slide.type}
                </h2>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div className={`${styles.saveBadge} ${styles[savingState] || styles.idle}`}>
                        {savingState === 'saving' && <><Loader2 size={14} className={styles.spin} /> Guardando...</>}
                        {savingState === 'saved' && <><IconCheckCircle2 size={14} /> Guardado</>}
                        {savingState === 'error' && <>Error al guardar</>}
                        {savingState === 'idle' && <span>Auto-guardado activo</span>}
                    </div>
                    <button
                        className={styles.secondaryBtn}
                        style={{
                            padding: '8px 12px', borderRadius: 8,
                            border: '1px solid var(--border-color)',
                            background: 'transparent', cursor: 'pointer',
                            color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 6,
                        }}
                        onClick={() => onDelete(slide.id)}
                        disabled={savingState === 'saving'}
                        title="Eliminar este slide"
                    >
                        <IconTrash2 size={16} />
                    </button>
                </div>
            </div>

            {renderFields()}

            {/* Multimedia Global del Slide */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 20 }}>
                {formData.bgMedia?.url && (
                    <div className={styles.formGroup} style={{ marginBottom: 15 }}>
                        <label className={styles.label}>Layout del Multimedia</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                style={{
                                    flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                                    border: formData.bgMedia.layout !== 'split' ? 'none' : '1px solid var(--border-color)',
                                    background: formData.bgMedia.layout !== 'split' ? 'var(--color-primary)' : 'transparent',
                                    color: formData.bgMedia.layout !== 'split' ? '#fff' : 'var(--text-primary)',
                                    fontWeight: 600, fontSize: '0.82rem',
                                }}
                                onClick={() => handleChange('bgMedia', { ...formData.bgMedia, layout: 'full' })}
                            >
                                Fondo Completo
                            </button>
                            <button
                                style={{
                                    flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                                    border: formData.bgMedia.layout === 'split' ? 'none' : '1px solid var(--border-color)',
                                    background: formData.bgMedia.layout === 'split' ? 'var(--color-primary)' : 'transparent',
                                    color: formData.bgMedia.layout === 'split' ? '#fff' : 'var(--text-primary)',
                                    fontWeight: 600, fontSize: '0.82rem',
                                }}
                                onClick={() => handleChange('bgMedia', { ...formData.bgMedia, layout: 'split' })}
                            >
                                Mitad Pantalla
                            </button>
                        </div>
                    </div>
                )}

                <MediaUploader
                    currentMedia={formData.bgMedia || null}
                    onMediaChange={(mediaObj) => {
                        if (!mediaObj) handleChange('bgMedia', null);
                        else handleChange('bgMedia', { ...mediaObj, layout: formData.bgMedia?.layout || 'full' });
                    }}
                    label="Fondo / Apoyo Multimedia (Opcional)"
                />
            </div>
        </div>
    );
}
