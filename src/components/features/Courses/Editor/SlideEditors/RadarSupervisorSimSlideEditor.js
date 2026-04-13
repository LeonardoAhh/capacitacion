'use client';

import { IconPlus, IconTrash2 } from '@/lib/icons';

function makeId() {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 11);
}

const EMPTY_ITEM = () => ({ id: makeId(), level: 1, prompt: '' });

export default function RadarSupervisorSimSlideEditor({ formData, handleChange, styles }) {
    const items = formData.items || [];

    const updateItem = (idx, field, value) => {
        const next = items.map((it, i) => i === idx ? { ...it, [field]: value } : it);
        handleChange('items', next);
    };

    const addItem = () => {
        if (items.length >= 15) return;
        handleChange('items', [...items, EMPTY_ITEM()]);
    };

    const removeItem = (idx) => {
        handleChange('items', items.filter((_, i) => i !== idx));
    };

    return (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Titulo del simulador</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={(e) => handleChange('heading', e.target.value)}
                    placeholder="Ej. Simulador: El Radar del Supervisor"
                    maxLength={120}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Subtitulo</label>
                <input
                    className={styles.input}
                    value={formData.subtitle || ''}
                    onChange={(e) => handleChange('subtitle', e.target.value)}
                    placeholder="Mensaje breve para orientar al participante"
                    maxLength={180}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Reactivos del radar ({items.length}/15)</label>
                <div className={styles.itemsList}>
                    {items.map((item, idx) => (
                        <div key={item.id} className={styles.itemRow}>
                            <select
                                className={styles.input}
                                value={item.level || 1}
                                onChange={(e) => updateItem(idx, 'level', Number(e.target.value))}
                            >
                                <option value={1}>Nivel 1</option>
                                <option value={2}>Nivel 2</option>
                                <option value={3}>Nivel 3</option>
                            </select>
                            <input
                                className={styles.input}
                                value={item.prompt || ''}
                                onChange={(e) => updateItem(idx, 'prompt', e.target.value)}
                                placeholder="Pregunta o dato a evaluar"
                                maxLength={160}
                            />
                            <button className={styles.removeBtn} onClick={() => removeItem(idx)} type="button" title="Eliminar reactivo">
                                <IconTrash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {items.length < 15 && (
                        <button className={styles.addItemBtn} onClick={addItem} type="button">
                            <IconPlus size={14} /> Agregar reactivo
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
