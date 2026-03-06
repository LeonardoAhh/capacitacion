import React from 'react';

export default function TitleSlideEditor({ formData, handleChange, styles }) {
    return (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Título Principal</label>
                <input
                    className={styles.input}
                    value={formData.title || ''}
                    onChange={e => handleChange('title', e.target.value)}
                    maxLength={120}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Subtítulo</label>
                <input
                    className={styles.input}
                    value={formData.subtitle || ''}
                    onChange={e => handleChange('subtitle', e.target.value)}
                    maxLength={200}
                />
            </div>
        </>
    );
}
