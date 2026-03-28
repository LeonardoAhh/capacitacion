'use client';
import { useState } from 'react';
import { IconPlus } from '@/lib/icons';

export default function FillBlankSlideEditor({ formData, handleChange, styles }) {
    const [tagInput, setTagInput] = useState('');
    const answers = formData.answers || [];

    const addAnswer = () => {
        const val = tagInput.trim();
        if (!val || answers.map(a => a.toLowerCase()).includes(val.toLowerCase())) return;
        handleChange('answers', [...answers, val]);
        setTagInput('');
    };

    const removeAnswer = (idx) =>
        handleChange('answers', answers.filter((_, i) => i !== idx));

    return (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Frase con espacio en blanco</label>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Usa <code style={{ background: 'var(--bg-secondary)', padding: '1px 5px', borderRadius: 4 }}>___</code> (tres guiones bajos) para marcar el espacio.
                </p>
                <input
                    className={styles.input}
                    value={formData.sentence || ''}
                    onChange={e => handleChange('sentence', e.target.value)}
                    placeholder="Ej. El EPP incluye casco, guantes y ___"
                    maxLength={300}
                />
                {formData.sentence && !formData.sentence.includes('___') && (
                    <p style={{ fontSize: '0.76rem', color: 'var(--color-warning, #f59e0b)', marginTop: 4 }}>
                        ⚠ La frase no contiene <code>___</code> — el alumno no podrá escribir una respuesta.
                    </p>
                )}
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Respuestas Válidas</label>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Agrega todas las variantes aceptadas. La comparación ignora mayúsculas y espacios extra.
                </p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                        className={styles.input}
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAnswer(); } }}
                        placeholder='Ej. "botas de seguridad" — presiona Enter para agregar'
                        maxLength={100}
                        style={{ flex: 1 }}
                    />
                    <button
                        className={styles.addItemBtn}
                        onClick={addAnswer}
                        type="button"
                        style={{ marginTop: 0, flex: 'none', padding: '0 14px' }}
                        aria-label="Agregar respuesta"
                    >
                        <IconPlus size={14} />
                    </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {answers.map((ans, idx) => (
                        <span key={idx} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: 'var(--color-primary)', color: 'white',
                            borderRadius: 20, padding: '3px 10px 3px 12px',
                            fontSize: '0.8rem', fontWeight: 500,
                        }}>
                            {ans}
                            <button
                                onClick={() => removeAnswer(idx)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', padding: 2, lineHeight: 1, fontSize: 16 }}
                                aria-label={`Quitar respuesta: ${ans}`}
                            >×</button>
                        </span>
                    ))}
                    {answers.length === 0 && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Sin respuestas aún — agrega al menos una.
                        </span>
                    )}
                </div>
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Explicación (Opcional)</label>
                <textarea
                    className={styles.input}
                    value={formData.explanation || ''}
                    onChange={e => handleChange('explanation', e.target.value)}
                    placeholder="Se muestra al alumno después de responder, ya sea correcto o incorrecto..."
                    rows={3}
                    maxLength={400}
                    style={{ resize: 'vertical' }}
                />
            </div>
        </>
    );
}
