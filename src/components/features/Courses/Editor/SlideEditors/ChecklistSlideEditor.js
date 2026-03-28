'use client';
import { IconPlus, IconTrash2 } from '@/lib/icons';

function makeId() {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 11);
}

export default function ChecklistSlideEditor({ formData, handleChange, styles }) {
    const items = formData.items || [];

    const updateItem = (idx, value) => {
        const next = items.map((it, i) => i === idx ? { ...it, text: value } : it);
        handleChange('items', next);
    };

    const addItem = () =>
        handleChange('items', [...items, { id: makeId(), text: '' }]);

    const removeItem = (idx) =>
        handleChange('items', items.filter((_, i) => i !== idx));

    return (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Título del Checklist</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={e => handleChange('heading', e.target.value)}
                    placeholder="Ej. Requisitos antes de iniciar operaciones"
                    maxLength={120}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Ítems ({items.length}/12)</label>
                <div className={styles.itemsList}>
                    {items.map((item, idx) => (
                        <div key={item.id} className={styles.itemRow}>
                            <span style={{
                                width: 20, height: 20, flexShrink: 0,
                                border: '2px solid var(--color-primary)',
                                borderRadius: 4, display: 'inline-block',
                            }} aria-hidden="true" />
                            <input
                                className={styles.input}
                                value={item.text || ''}
                                onChange={e => updateItem(idx, e.target.value)}
                                placeholder={`Ítem ${idx + 1}`}
                                maxLength={200}
                            />
                            <button
                                className={styles.removeBtn}
                                onClick={() => removeItem(idx)}
                                title="Eliminar ítem"
                                aria-label={`Eliminar ítem ${idx + 1}`}
                                type="button"
                            >
                                <IconTrash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {items.length < 12 && (
                        <button className={styles.addItemBtn} onClick={addItem} type="button">
                            <IconPlus size={14} /> Agregar Ítem
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    <input
                        type="checkbox"
                        checked={!!formData.requireAll}
                        onChange={e => handleChange('requireAll', e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
                    />
                    Requerir que todos los ítems estén marcados para avanzar
                </label>
                {formData.requireAll && (
                    <p style={{ fontSize: '0.76rem', color: 'var(--color-warning, #f59e0b)', marginTop: 4 }}>
                        ⚠️ El botón &quot;Siguiente&quot; se deshabilitará hasta que el alumno marque todos los ítems.
                    </p>
                )}
            </div>
        </>
    );
}
