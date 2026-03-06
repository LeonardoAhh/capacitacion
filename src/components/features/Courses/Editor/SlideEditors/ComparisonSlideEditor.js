import React from 'react';
import { IconPlus, IconTrash2 } from '@/lib/icons';

export default function ComparisonSlideEditor({ formData, handleChange, styles }) {
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Lado Izquierdo */}
                <div>
                    <h4 className={styles.label} style={{ color: 'var(--color-danger)' }}>
                        🔴 Lado Izquierdo
                    </h4>
                    <div className={styles.formGroup}>
                        <input
                            className={styles.input}
                            placeholder="Título"
                            value={formData.left?.title || ''}
                            onChange={e => handleChange('left', { ...formData.left, title: e.target.value })}
                            maxLength={80}
                        />
                    </div>
                    <div className={styles.itemsList}>
                        {formData.left?.items?.map((txt, idx) => (
                            <div key={idx} className={styles.itemRow}>
                                <input
                                    className={styles.input}
                                    value={txt}
                                    maxLength={200}
                                    onChange={e => {
                                        const newItems = [...formData.left.items];
                                        newItems[idx] = e.target.value;
                                        handleChange('left', { ...formData.left, items: newItems });
                                    }}
                                />
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => {
                                        const newItems = formData.left.items.filter((_, i) => i !== idx);
                                        handleChange('left', { ...formData.left, items: newItems });
                                    }}
                                >
                                    <IconTrash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            className={styles.addItemBtn}
                            onClick={() => handleChange('left', { ...formData.left, items: [...(formData.left?.items || []), ''] })}
                        >
                            <IconPlus size={14} /> Agregar
                        </button>
                    </div>
                </div>

                {/* Lado Derecho */}
                <div>
                    <h4 className={styles.label} style={{ color: 'var(--color-success)' }}>
                        🟢 Lado Derecho
                    </h4>
                    <div className={styles.formGroup}>
                        <input
                            className={styles.input}
                            placeholder="Título"
                            value={formData.right?.title || ''}
                            onChange={e => handleChange('right', { ...formData.right, title: e.target.value })}
                            maxLength={80}
                        />
                    </div>
                    <div className={styles.itemsList}>
                        {formData.right?.items?.map((txt, idx) => (
                            <div key={idx} className={styles.itemRow}>
                                <input
                                    className={styles.input}
                                    value={txt}
                                    maxLength={200}
                                    onChange={e => {
                                        const newItems = [...formData.right.items];
                                        newItems[idx] = e.target.value;
                                        handleChange('right', { ...formData.right, items: newItems });
                                    }}
                                />
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => {
                                        const newItems = formData.right.items.filter((_, i) => i !== idx);
                                        handleChange('right', { ...formData.right, items: newItems });
                                    }}
                                >
                                    <IconTrash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            className={styles.addItemBtn}
                            onClick={() => handleChange('right', { ...formData.right, items: [...(formData.right?.items || []), ''] })}
                        >
                            <IconPlus size={14} /> Agregar
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
