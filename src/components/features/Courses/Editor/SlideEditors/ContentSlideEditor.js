'use client';

import React from 'react';
import { IconPlus, IconTrash2 } from '@/lib/icons';
import ImageUploader from '../ImageUploader';
import RichTextEditor from '../RichTextEditor';
import { Select } from '@/components/ui/Select/Select';

const BODY_MAX_CHARS = 600;

export default function ContentSlideEditor({ formData, handleChange, setFormData, styles }) {
    const images = formData.images
        ? formData.images
        : formData.image ? [formData.image] : [];

    const handleAddImage = (url) => {
        const updated = [...images, url];
        setFormData(prev => ({ ...prev, images: updated, image: updated[0] || '' }));
    };

    const handleRemoveImage = (idx) => {
        const updated = images.filter((_, i) => i !== idx);
        setFormData(prev => ({ ...prev, images: updated, image: updated[0] || '' }));
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
                    onChange={(html) => handleChange('body', html)}
                    placeholder="Escribe el cuerpo del slide..."
                    maxLength={BODY_MAX_CHARS}
                    minRows={4}
                />
            </div>

            {/* Galería de imágenes */}
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Imágenes ({images.length}/6)
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 8 }}>
                        Se mostrarán en diseño optimizado tipo galería.
                    </span>
                </label>

                {images.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 10 }}>
                        {images.map((url, idx) => (
                            <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={url} alt={`Imagen ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                    onClick={() => handleRemoveImage(idx)}
                                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
                                    title="Quitar imagen"
                                >×</button>
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
                                        const newBullets = [...formData.bullets];
                                        newBullets[idx] = e.target.value;
                                        handleChange('bullets', newBullets);
                                    }}
                                    maxLength={200}
                                />
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => {
                                        const newBullets = formData.bullets.filter((_, i) => i !== idx);
                                        handleChange('bullets', newBullets);
                                    }}
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
            <div className={styles.formGroup} style={{ background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-color)', marginTop: 12 }}>
                <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                    <input
                        type="checkbox"
                        checked={!!formData.snippet}
                        onChange={e => {
                            if (e.target.checked) handleChange('snippet', { type: 'info', title: 'Importante', text: '' });
                            else handleChange('snippet', null);
                        }}
                        style={{ accentColor: 'var(--color-primary)', width: 16, height: 16 }}
                    />
                    Añadir bloque de Alerta / Destacado
                </label>

                {formData.snippet && (
                    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 2fr', gap: 10 }}>
                            <Select
                                value={formData.snippet.type || 'info'}
                                onChange={value => handleChange('snippet', { ...formData.snippet, type: value })}
                                options={[
                                    { value: 'info', label: 'ℹ️ Información' },
                                    { value: 'success', label: '✅ Éxito' },
                                    { value: 'warning', label: '⚠️ Advertencia' },
                                    { value: 'danger', label: '🚨 Peligro' },
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
