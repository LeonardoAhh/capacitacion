import React, { useState } from 'react';
import { IconPlus, IconTrash2 } from '@/lib/icons';
import ImageUploader from '../ImageUploader';

export function CharCounter({ current = 0, max }) {
    const pct = current / max;
    const color = pct >= 1
        ? 'var(--color-danger)'
        : pct >= 0.85
            ? 'var(--color-warning)'
            : 'var(--text-tertiary)';

    return (
        <span style={{ fontSize: '0.68rem', color, float: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {current}/{max}
        </span>
    );
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function QuestionEditor({ qi, q, onUpdate, onRemove, onAddOption, onRemoveOption, styles: s }) {
    const [collapsed, setCollapsed] = useState(() => Boolean(q.q?.trim()));

    return (
        <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: 10,
            marginBottom: 10,
            overflow: 'hidden',
            background: 'var(--bg-primary)'
        }}>
            <div
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', background: 'var(--bg-secondary)', cursor: 'pointer'
                }}
                onClick={() => setCollapsed(!collapsed)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{
                        width: 24, height: 24, borderRadius: '50%',
                        background: 'var(--color-primary)',
                        color: 'white', fontSize: '0.72rem', fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        Q{qi + 1}
                    </span>
                    <span style={{
                        flex: 1, fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                        {q.q?.trim() || 'Nueva Pregunta'}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                        {collapsed ? 'Editar' : 'Ocultar'}
                    </span>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        title="Eliminar pregunta"
                        style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--color-danger)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6
                        }}
                    >
                        <IconTrash2 size={16} />
                    </button>
                </div>
            </div>

            {!collapsed && (
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                            Texto de la Pregunta
                            <CharCounter current={q.q?.length ?? 0} max={250} />
                        </label>
                        <textarea
                            className={s.textarea}
                            placeholder="Ej. ¿Cuál es el propósito de esta herramienta?"
                            rows={2}
                            style={{ resize: 'vertical' }}
                            value={q.q || ''}
                            onChange={e => onUpdate(prev => ({ ...prev, q: e.target.value }))}
                            maxLength={250}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                            Opciones de Respuesta
                            <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>
                                {' '}— Selecciona la correcta con el círculo izquierdo
                            </span>
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {(q.options || []).map((opt, oi) => {
                                const isCorrect = q.correct === oi;
                                return (
                                    <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <button
                                            type="button"
                                            onClick={() => onUpdate(prev => ({ ...prev, correct: oi }))}
                                            style={{
                                                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                                                border: `2px solid ${isCorrect ? 'var(--color-success)' : 'var(--border-color)'}`,
                                                background: isCorrect ? 'var(--color-success)' : 'transparent',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0
                                            }}
                                            title="Marcar como respuesta correcta"
                                        >
                                            {isCorrect && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                                        </button>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', minWidth: 14, textAlign: 'center', flexShrink: 0 }}>
                                            {OPTION_LETTERS[oi] || '?'}
                                        </span>
                                        <input
                                            className={s.input}
                                            value={opt}
                                            style={{ flex: 1 }}
                                            placeholder={`Opción ${oi + 1}`}
                                            onChange={e => onUpdate(prev => {
                                                const newOpts = [...(prev.options || [])];
                                                newOpts[oi] = e.target.value;
                                                return { ...prev, options: newOpts };
                                            })}
                                            maxLength={150}
                                        />
                                        <button
                                            type="button"
                                            className={s.removeBtn}
                                            onClick={() => onRemoveOption(oi)}
                                            disabled={(q.options || []).length <= 2}
                                            title="Eliminar opción"
                                        >
                                            <IconTrash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                            {(q.options || []).length < 6 && (
                                <button className={s.addItemBtn} onClick={onAddOption} style={{ marginTop: 4 }}>
                                    <IconPlus size={14} /> Agregar otra opción
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                            Explicación (Feedback al responder)
                            <CharCounter current={q.explanation?.length ?? 0} max={300} />
                        </label>
                        <textarea
                            className={s.input}
                            placeholder="Aparecerá cuando el usuario revise sus respuestas..."
                            rows={2}
                            style={{ resize: 'vertical' }}
                            value={q.explanation || ''}
                            onChange={e => onUpdate(prev => ({ ...prev, explanation: e.target.value }))}
                            maxLength={300}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
