import React from 'react';
import { IconPlus, IconTrash2 } from '@/lib/icons';
import ImageUploader from '../ImageUploader';
import IconPicker from '../IconPicker';
import { CharCounter } from './Shared';

const ICON_GRID_MAX = 6;
const TEXTAREA_MAX_CHARS = 400;

export default function IconGridSlideEditor({ formData, handleChange, styles }) {
    const items = formData.items || [];
    const atMax = items.length >= ICON_GRID_MAX;

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
                <label className={styles.label}>
                    Descripción
                    <CharCounter current={formData.description?.length ?? 0} max={TEXTAREA_MAX_CHARS} />
                </label>
                <textarea
                    className={styles.textarea}
                    value={formData.description || ''}
                    onChange={e => handleChange('description', e.target.value)}
                    maxLength={TEXTAREA_MAX_CHARS}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Íconos
                    <span style={{
                        float: 'right',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: atMax ? 'var(--color-danger)' : 'var(--text-tertiary)',
                    }}>
                        {items.length}/{ICON_GRID_MAX} máx.
                    </span>
                </label>
                <div className={styles.itemsList}>
                    {items.map((item, idx) => (
                        <div key={idx} className={styles.itemRow} style={{ flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', width: '100%', gap: 8, alignItems: 'flex-start' }}>
                                {/* Número de ícono */}
                                <span style={{
                                    flexShrink: 0, width: 24, height: 24,
                                    borderRadius: '50%', background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)',
                                    marginTop: 8,
                                }}>
                                    {idx + 1}
                                </span>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {/* Etiqueta */}
                                    <input
                                        className={styles.input}
                                        placeholder="Etiqueta del ícono"
                                        value={item.label || ''}
                                        maxLength={50}
                                        onChange={e => {
                                            const newItems = [...items];
                                            newItems[idx] = { ...item, label: e.target.value };
                                            handleChange('items', newItems);
                                        }}
                                    />
                                    {/* IconPicker visual */}
                                    <IconPicker
                                        value={item.icon || ''}
                                        onChange={(iconName) => {
                                            const newItems = [...items];
                                            newItems[idx] = { ...item, icon: iconName };
                                            handleChange('items', newItems);
                                        }}
                                    />
                                </div>
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => {
                                        const newItems = items.filter((_, i) => i !== idx);
                                        handleChange('items', newItems);
                                    }}
                                    title="Eliminar ícono"
                                    style={{ marginTop: 6 }}
                                >
                                    <IconTrash2 size={16} />
                                </button>
                            </div>

                            {/* Imagen alternativa (opcional) */}
                            <div style={{ paddingLeft: 32, borderLeft: '2px solid var(--border-color)' }}>
                                <ImageUploader
                                    currentImage={item.image}
                                    onImageChange={(url) => {
                                        const newItems = [...items];
                                        newItems[idx] = { ...item, image: url };
                                        handleChange('items', newItems);
                                    }}
                                    label="Imagen (reemplaza ícono)"
                                />
                            </div>

                            {/* Descripción del ítem */}
                            <textarea
                                className={styles.input}
                                placeholder="Descripción del ícono (opcional)"
                                rows={2}
                                style={{ paddingLeft: 32, marginLeft: 0, resize: 'vertical' }}
                                value={item.description || ''}
                                maxLength={200}
                                onChange={e => {
                                    const newItems = [...items];
                                    newItems[idx] = { ...item, description: e.target.value };
                                    handleChange('items', newItems);
                                }}
                            />
                        </div>
                    ))}

                    {/* Botón añadir — deshabilitado al llegar al máximo */}
                    <button
                        className={styles.addItemBtn}
                        onClick={() => {
                            if (atMax) return;
                            handleChange('items', [...items, { label: '', icon: 'Bulb', description: '' }]);
                        }}
                        disabled={atMax}
                        title={atMax ? `Máximo ${ICON_GRID_MAX} íconos permitidos` : undefined}
                        style={{ opacity: atMax ? 0.4 : 1, cursor: atMax ? 'not-allowed' : 'pointer' }}
                    >
                        <IconPlus size={14} />
                        {atMax ? `Máximo ${ICON_GRID_MAX} íconos` : 'Agregar Ícono'}
                    </button>
                </div>
            </div>
        </>
    );
}
