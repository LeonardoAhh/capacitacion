import React from 'react';
import RichTextEditor from '../RichTextEditor';

const BODY_MAX_CHARS = 2000;

/**
 * Editor compartido para tipos 'objective' y 'definition'.
 * Ambos tienen exactamente la misma estructura: encabezado + cuerpo de texto.
 */
export default function SimpleBodySlideEditor({ formData, handleChange, styles }) {
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
                    placeholder="Escribe el objetivo o definición del curso..."
                    maxLength={BODY_MAX_CHARS}
                    minRows={4}
                />
            </div>
        </>
    );
}
