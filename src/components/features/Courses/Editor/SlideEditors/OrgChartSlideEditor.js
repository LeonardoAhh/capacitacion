import React from 'react';
import { IconPlus, IconTrash2 } from '@/lib/icons';
import ImageUploader from '../ImageUploader';

const LEVEL_OPTIONS = [
    { value: 0, label: 'Nivel 0 — Dirección' },
    { value: 1, label: 'Nivel 1 — Gerencia' },
    { value: 2, label: 'Nivel 2 — Jefatura' },
    { value: 3, label: 'Nivel 3 — Operativo' },
];

function makeId() {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 11);
}

export default function OrgChartSlideEditor({ formData, handleChange, styles }) {
    const members = formData.members ?? [];

    const updateMember = (idx, field, value) => {
        const updated = members.map((m, i) => i === idx ? { ...m, [field]: value } : m);
        handleChange('members', updated);
    };

    const removeMember = (idx) => {
        handleChange('members', members.filter((_, i) => i !== idx));
    };

    const addMember = () => {
        handleChange('members', [
            ...members,
            { id: makeId(), position: '', name: '', photo: '', level: 1 },
        ]);
    };

    return (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Título del Organigrama</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={e => handleChange('heading', e.target.value)}
                    placeholder="Ej. Estructura Organizacional"
                    maxLength={120}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Miembros ({members.length})
                </label>
                <div className={styles.itemsList}>
                    {members.map((member, idx) => (
                        <div
                            key={member.id || idx}
                            style={{
                                border: '1px solid var(--ds-border-hairline)',
                                borderRadius: 10,
                                marginBottom: 10,
                                overflow: 'hidden',
                                background: 'var(--ds-bg)',
                            }}
                        >
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 12px',
                                background: 'var(--ds-bg-subtle)',
                                borderBottom: '1px solid var(--ds-border-hairline)',
                            }}>
                                <span style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: 'var(--ds-text-secondary)',
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {member.position?.trim() || `Miembro ${idx + 1}`}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeMember(idx)}
                                    title="Eliminar miembro"
                                    aria-label={`Eliminar miembro ${idx + 1}`}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--accent-crimson)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: 4,
                                        borderRadius: 6,
                                        flexShrink: 0,
                                    }}
                                >
                                    <IconTrash2 size={14} />
                                </button>
                            </div>

                            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-text-secondary)', display: 'block', marginBottom: 4 }}>
                                        Puesto
                                    </label>
                                    <input
                                        className={styles.input}
                                        value={member.position || ''}
                                        onChange={e => updateMember(idx, 'position', e.target.value)}
                                        placeholder="Ej. Gerente de Producción"
                                        maxLength={100}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-text-secondary)', display: 'block', marginBottom: 4 }}>
                                        Nombre del empleado
                                    </label>
                                    <input
                                        className={styles.input}
                                        value={member.name || ''}
                                        onChange={e => updateMember(idx, 'name', e.target.value)}
                                        placeholder="Ej. Juan Pérez"
                                        maxLength={100}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ds-text-secondary)', display: 'block', marginBottom: 4 }}>
                                        Nivel jerárquico
                                    </label>
                                    <select
                                        className={styles.input}
                                        value={member.level ?? 1}
                                        onChange={e => updateMember(idx, 'level', Number(e.target.value))}
                                    >
                                        {LEVEL_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <ImageUploader
                                    currentImage={member.photo || ''}
                                    onImageChange={url => updateMember(idx, 'photo', url)}
                                    label="Foto del empleado"
                                    compact
                                />
                            </div>
                        </div>
                    ))}
                    <button className={styles.addItemBtn} onClick={addMember}>
                        <IconPlus size={14} /> Agregar Miembro
                    </button>
                </div>
            </div>
        </>
    );
}
