import React from 'react';
import { CharCounter } from './Shared';

const TEXTAREA_MAX_CHARS = 400;

export default function DynamicSlideEditor({ formData, handleChange, styles }) {
    return (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Título de la Dinámica</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={e => handleChange('heading', e.target.value)}
                    maxLength={100}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Instrucciones
                    <CharCounter current={formData.instructions?.length ?? 0} max={TEXTAREA_MAX_CHARS} />
                </label>
                <textarea
                    className={styles.textarea}
                    placeholder="Instrucciones para el facilitador..."
                    value={formData.instructions || ''}
                    onChange={e => handleChange('instructions', e.target.value)}
                    maxLength={TEXTAREA_MAX_CHARS}
                />
            </div>
            <div className={styles.formGroup}>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                        <label className={styles.label}>Tipo</label>
                        <input
                            className={styles.input}
                            placeholder="Ej. Roleplay, Debate"
                            value={formData.type || ''}
                            onChange={e => handleChange('type', e.target.value)}
                            maxLength={60}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className={styles.label}>Duración</label>
                        <input
                            className={styles.input}
                            placeholder="Ej. 15 min"
                            value={formData.duration || ''}
                            onChange={e => handleChange('duration', e.target.value)}
                            maxLength={30}
                        />
                    </div>
                </div>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Escenario (Opcional)
                    <CharCounter current={formData.scenario?.length ?? 0} max={TEXTAREA_MAX_CHARS} />
                </label>
                <textarea
                    className={styles.textarea}
                    placeholder="Descripción del caso o escenario..."
                    value={formData.scenario || ''}
                    onChange={e => handleChange('scenario', e.target.value)}
                    maxLength={TEXTAREA_MAX_CHARS}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Reflexión (Debrief)
                    <CharCounter current={formData.debrief?.length ?? 0} max={TEXTAREA_MAX_CHARS} />
                </label>
                <textarea
                    className={styles.textarea}
                    placeholder="Preguntas para el cierre..."
                    value={formData.debrief || ''}
                    onChange={e => handleChange('debrief', e.target.value)}
                    maxLength={TEXTAREA_MAX_CHARS}
                />
            </div>
        </>
    );
}
