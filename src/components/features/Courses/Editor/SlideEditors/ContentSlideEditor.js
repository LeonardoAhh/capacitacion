'use client';

import React from 'react';
import { IconPlus, IconTrash2 } from '@/lib/icons';
import ImageUploader from '../ImageUploader';
import RichTextEditor from '../RichTextEditor';
import { Select } from '@/components/ui/Select/Select';

const BODY_MAX_CHARS = 2000;

export default function ContentSlideEditor({ formData, handleChange, handleBatchChange, styles }) {
    const images = formData.images
        ? formData.images
        : formData.image ? [formData.image] : [];

    // BUG-04 fix: usar handleBatchChange para actualizar images + image de una sola vez,
    // así onFormChange se dispara y el preview en vivo refleja el cambio.
    const handleAddImage = (url) => {
        const updated = [...images, url];
        handleBatchChange({ images: updated, image: updated[0] || '' });
    };

    const handleRemoveImage = (idx) => {
        const updated = images.filter((_, i) => i !== idx);
        handleBatchChange({ images: updated, image: updated[0] || '' });
    };

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
                    onChange={html => handleChange('body', html)}
                    placeholder="Escribe el cuerpo del slide..."
                    maxLength={BODY_MAX_CHARS}
                    minRows={4}
                />
            </div>

            {/* Galería de imágenes */}
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Imágenes ({images.length}/6)
                    <span className={styles.labelHint}>
                        Se mostrarán en diseño optimizado tipo galería.
                    </span>
                </label>

                {images.length > 0 && (
                    <div className={styles.imageGrid}>
                        {images.map((url, idx) => (
                            <div key={url + idx} className={styles.imageThumb}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Imagen ${idx + 1}`} className={styles.imageThumbImg} />
                                <button
                                    className={styles.imageRemoveBtn}
                                    onClick={() => handleRemoveImage(idx)}
                                    title="Quitar imagen"
                                    aria-label={`Quitar imagen ${idx + 1}`}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {images.length < 6 && (
                    <ImageUploader
                        currentImage={null}
                        onImageChange={handleAddImage}
                        label={images.length === 0 ? 'Agregar imagen' : '+ Agregar otra imagen'}
                    />
                )}
            </div>

            {/* Bullets opcionales */}
            {formData.bullets && (
                <div className={styles.formGroup}>
                    <label className={styles.label}>Viñetas (Bullets)</label>
                    <div className={styles.itemsList}>
                        {formData.bullets.map((txt, idx) => (
                            <div key={idx} className={styles.itemRow}>
                                <input
                                    className={styles.input}
                                    value={txt}
                                    onChange={e => {
                                        const next = [...formData.bullets];
                                        next[idx] = e.target.value;
                                        handleChange('bullets', next);
                                    }}
                                    maxLength={200}
                                />
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => handleChange('bullets', formData.bullets.filter((_, i) => i !== idx))}
                                >
                                    <IconTrash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            className={styles.addItemBtn}
                            onClick={() => handleChange('bullets', [...(formData.bullets || []), ''])}
                        >
                            <IconPlus size={14} /> Agregar viñeta
                        </button>
                    </div>
                </div>
            )}

            {/* Snippet / Alerta Especial */}
            <div className={styles.snippetBox}>
                <label className={styles.snippetToggle}>
                    <input
                        type="checkbox"
                        checked={!!formData.snippet}
                        onChange={e => {
                            if (e.target.checked) {
                                handleChange('snippet', { type: 'info', title: 'Importante', text: '' });
                            } else {
                                handleChange('snippet', null);
                            }
                        }}
                        className={styles.snippetCheckbox}
                    />
                    Añadir bloque de Alerta / Destacado
                </label>

                {formData.snippet && (
                    <div className={styles.snippetFields}>
                        <div className={styles.snippetRow}>
                            <Select
                                value={formData.snippet.type || 'info'}
                                onChange={value => handleChange('snippet', { ...formData.snippet, type: value })}
                                options={[
                                    { value: 'info',    label: 'ℹ️ Información' },
                                    { value: 'success', label: '✅ Éxito' },
                                    { value: 'warning', label: '⚠️ Advertencia' },
                                    { value: 'danger',  label: '🚨 Peligro' },
                                ]}
                            />
                            <input
                                className={styles.input}
                                placeholder="Título (ej. Recuerda)"
                                value={formData.snippet.title || ''}
                                onChange={e => handleChange('snippet', { ...formData.snippet, title: e.target.value })}
                            />
                        </div>
                        <textarea
                            className={styles.input}
                            placeholder="Descripción de la alerta o mensaje destacado..."
                            value={formData.snippet.text || ''}
                            onChange={e => handleChange('snippet', { ...formData.snippet, text: e.target.value })}
                            rows={3}
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
