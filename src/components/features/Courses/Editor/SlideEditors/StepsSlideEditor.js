import React from 'react';
import { IconPlus, IconTrash2 } from '@/lib/icons';
import ImageUploader from '../ImageUploader';
import RichTextEditor from '../RichTextEditor';

const TEXTAREA_MAX_CHARS = 400;

export default function StepsSlideEditor({ formData, handleChange, styles }) {
    const steps = formData.steps || [];

    const updateStep = (idx, field, value) => {
        const newSteps = steps.map((s, i) => i === idx ? { ...s, [field]: value } : s);
        handleChange('steps', newSteps);
    };

    const addStep = () =>
        handleChange('steps', [...steps, { title: '', desc: '', image: '' }]);

    const removeStep = (idx) =>
        handleChange('steps', steps.filter((_, i) => i !== idx));

    return (
        <>
            {/* Encabezado */}
            <div className={styles.formGroup}>
                <label className={styles.label}>Título del Slide</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={e => handleChange('heading', e.target.value)}
                    placeholder="Ej. Cómo solicitar un permiso"
                    maxLength={120}
                />
            </div>

            {/* Lista de pasos */}
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Pasos ({steps.length})
                </label>
                <div className={styles.itemsList}>
                    {steps.map((step, idx) => (
                        <div
                            key={idx}
                            style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: 10,
                                marginBottom: 10,
                                overflow: 'hidden',
                                background: 'var(--bg-primary)',
                            }}
                        >
                            {/* Header del paso */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 12px',
                                background: 'var(--bg-secondary)',
                                borderBottom: '1px solid var(--border-color)',
                            }}>
                                <span style={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    background: 'var(--color-primary)',
                                    color: 'white', fontSize: '0.72rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    {idx + 1}
                                </span>
                                <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {step.title?.trim() || `Paso ${idx + 1}`}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeStep(idx)}
                                    title="Eliminar paso"
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, flexShrink: 0 }}
                                >
                                    <IconTrash2 size={14} />
                                </button>
                            </div>

                            {/* Campos del paso */}
                            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Título del Paso</label>
                                    <input
                                        className={styles.input}
                                        value={step.title || ''}
                                        onChange={e => updateStep(idx, 'title', e.target.value)}
                                        placeholder={`Paso ${idx + 1}`}
                                        maxLength={120}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                                        Descripción
                                    </label>
                                    <RichTextEditor
                                        value={step.desc || ''}
                                        onChange={(html) => updateStep(idx, 'desc', html)}
                                        placeholder="Explica lo que se hace en este paso..."
                                        maxLength={TEXTAREA_MAX_CHARS}
                                        minRows={2}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Imagen (Opcional)</label>
                                    <ImageUploader
                                        currentImage={step.image || null}
                                        onImageChange={(url) => updateStep(idx, 'image', url)}
                                        label={step.image ? 'Cambiar imagen' : 'Agregar imagen'}
                                    />
                                    {step.image && (
                                        <button
                                            type="button"
                                            onClick={() => updateStep(idx, 'image', '')}
                                            style={{ marginTop: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                                        >
                                            <IconTrash2 size={12} /> Quitar imagen
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    <button className={styles.addItemBtn} onClick={addStep}>
                        <IconPlus size={14} /> Agregar Paso
                    </button>
                </div>
            </div>
        </>
    );
}
