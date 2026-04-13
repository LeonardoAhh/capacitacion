'use client';

import { IconPlus, IconTrash2 } from '@/lib/icons';

function makeId() {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 11);
}

const EMPTY_CARD = () => ({ id: makeId(), text: '', kind: 'visible', hint: '' });

export default function IcebergLineaSimSlideEditor({ formData, handleChange, styles }) {
    const cards = formData.cards || [];

    const updateCard = (idx, field, value) => {
        const next = cards.map((card, i) => i === idx ? { ...card, [field]: value } : card);
        handleChange('cards', next);
    };

    const addCard = () => {
        if (cards.length >= 20) return;
        handleChange('cards', [...cards, EMPTY_CARD()]);
    };

    const removeCard = (idx) => {
        handleChange('cards', cards.filter((_, i) => i !== idx));
    };

    return (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Titulo del simulador</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={(e) => handleChange('heading', e.target.value)}
                    placeholder="Ej. Simulador: El Iceberg en la Linea"
                    maxLength={120}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Subtitulo</label>
                <input
                    className={styles.input}
                    value={formData.subtitle || ''}
                    onChange={(e) => handleChange('subtitle', e.target.value)}
                    placeholder="Mensaje de orientacion"
                    maxLength={180}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Reactivos para clasificar ({cards.length}/20)</label>
                <div className={styles.itemsList}>
                    {cards.map((card, idx) => (
                        <div key={card.id} style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 10, marginBottom: 10 }}>
                            <div className={styles.itemRow}>
                                <input
                                    className={styles.input}
                                    value={card.text || ''}
                                    onChange={(e) => updateCard(idx, 'text', e.target.value)}
                                    placeholder="Situacion a clasificar"
                                    maxLength={180}
                                />
                                <select
                                    className={styles.input}
                                    value={card.kind || 'visible'}
                                    onChange={(e) => updateCard(idx, 'kind', e.target.value)}
                                >
                                    <option value="visible">Parte visible</option>
                                    <option value="submerged">Parte sumergida</option>
                                </select>
                                <button className={styles.removeBtn} onClick={() => removeCard(idx)} type="button" title="Eliminar reactivo">
                                    <IconTrash2 size={14} />
                                </button>
                            </div>
                            <input
                                className={styles.input}
                                style={{ marginTop: 8 }}
                                value={card.hint || ''}
                                onChange={(e) => updateCard(idx, 'hint', e.target.value)}
                                placeholder="Hint opcional"
                                maxLength={140}
                            />
                        </div>
                    ))}
                    {cards.length < 20 && (
                        <button className={styles.addItemBtn} onClick={addCard} type="button">
                            <IconPlus size={14} /> Agregar reactivo
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
