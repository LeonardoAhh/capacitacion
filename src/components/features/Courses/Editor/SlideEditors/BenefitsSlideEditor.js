import React from 'react';
import { IconPlus, IconTrash2 } from '@/lib/icons';

/**
 * Editor para slides de tipo 'benefits'.
 * Maneja ítems como objetos { id, text } para keys estables.
 * Compatible con el formato legacy (array de strings) mediante normalización progresiva.
 */
export default function BenefitsSlideEditor({ formData, handleChange, styles }) {
    const items = formData.items ?? [];

    const makeId = () =>
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2, 11);

    /** Normaliza un ítem legacy (string) a objeto con id. */
    const toObj = (item, fallbackId) =>
        typeof item === 'object' && item !== null
            ? { id: item.id || fallbackId || makeId(), text: item.text ?? '' }
            : { id: fallbackId || makeId(), text: String(item ?? '') };

    const handleItemChange = (idx, newText) => {
        const updated = items.map((item, i) => {
            if (i !== idx) return item;
            return toObj(item, null);  // normalize on edit
        });
        updated[idx] = { ...toObj(items[idx], null), text: newText };
        handleChange('items', updated);
    };

    const handleItemRemove = (idx) => {
        handleChange('items', items.filter((_, i) => i !== idx));
    };

    const handleItemAdd = () => {
        handleChange('items', [...items, { id: makeId(), text: 'Nuevo beneficio' }]);
    };

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
                    {items.map((item, idx) => {
                        const obj = toObj(item, String(idx));
                        return (
                            <div key={obj.id} className={styles.itemRow}>
                                <input
                                    className={styles.input}
                                    value={obj.text}
                                    maxLength={200}
                                    onChange={e => handleItemChange(idx, e.target.value)}
                                />
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => handleItemRemove(idx)}
                                    title="Eliminar beneficio"
                                    aria-label={`Eliminar beneficio ${idx + 1}`}
                                >
                                    <IconTrash2 size={16} />
                                </button>
                            </div>
                        );
                    })}
                    <button className={styles.addItemBtn} onClick={handleItemAdd}>
                        <IconPlus size={14} /> Agregar Beneficio
                    </button>
                </div>
            </div>
        </>
    );
}
