'use client';
import { IconPlus, IconTrash2 } from '@/lib/icons';

function makeId() {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 11);
}

export default function FlashcardSlideEditor({ formData, handleChange, styles }) {
    const cards = formData.cards || [];

    const updateCard = (idx, field, value) => {
        const next = cards.map((c, i) => i === idx ? { ...c, [field]: value } : c);
        handleChange('cards', next);
    };

    const addCard = () =>
        handleChange('cards', [...cards, { id: makeId(), front: '', back: '' }]);

    const removeCard = (idx) =>
        handleChange('cards', cards.filter((_, i) => i !== idx));

    return (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Título del Mazo</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={e => handleChange('heading', e.target.value)}
                    placeholder="Ej. Terminología de Seguridad"
                    maxLength={120}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Tarjetas ({cards.length})
                    <span className={styles.labelHint}>El alumno hace clic en cada tarjeta para voltearla</span>
                </label>
                <div className={styles.itemsList}>
                    {cards.map((card, idx) => (
                        <div
                            key={card.id}
                            style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: 10,
                                marginBottom: 10,
                                overflow: 'hidden',
                                background: 'var(--bg-primary)',
                            }}
                        >
                            {/* Header de la tarjeta */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 12px',
                                background: 'var(--bg-secondary)',
                                borderBottom: '1px solid var(--border-color)',
                            }}>
                                <span style={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    background: 'var(--color-primary)',
                                    color: 'white', fontSize: '0.72rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>{idx + 1}</span>
                                <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {card.front?.trim() || `Tarjeta ${idx + 1}`}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeCard(idx)}
                                    title="Eliminar tarjeta"
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                                >
                                    <IconTrash2 size={14} />
                                </button>
                            </div>

                            {/* Campos de la tarjeta */}
                            <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                                        Anverso (Término / Pregunta)
                                    </label>
                                    <input
                                        className={styles.input}
                                        value={card.front || ''}
                                        onChange={e => updateCard(idx, 'front', e.target.value)}
                                        placeholder="Ej. EPP"
                                        maxLength={200}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                                        Reverso (Definición / Respuesta)
                                    </label>
                                    <textarea
                                        className={styles.input}
                                        value={card.back || ''}
                                        onChange={e => updateCard(idx, 'back', e.target.value)}
                                        placeholder="Ej. Equipo de Protección Personal — casco, guantes, botas de seguridad..."
                                        rows={3}
                                        maxLength={500}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}

                    <button className={styles.addItemBtn} onClick={addCard}>
                        <IconPlus size={14} /> Agregar Tarjeta
                    </button>
                </div>
            </div>
        </>
    );
}
