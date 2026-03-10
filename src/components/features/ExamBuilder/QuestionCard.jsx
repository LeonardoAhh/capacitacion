'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Trash2, MoveUp, MoveDown, Plus } from 'lucide-react';
import styles from './ExamBuilder.module.css';

// IDs de opciones disponibles para preguntas de opción
const OPTION_IDS = ['a', 'b', 'c', 'd', 'e'];

const TYPE_LABELS = {
    single: 'Opción única',
    multiple: 'Opción múltiple',
    truefalse: 'Verdadero / Falso',
};

/**
 * Tarjeta editable para una pregunta del examen.
 * Soporta expand/collapse, cambio de tipo y edición de opciones/afirmaciones.
 */
export default function QuestionCard({ question: q, index, total, onChange, onDelete, onMove }) {
    const [open, setOpen] = useState(true);

    // Cambia el tipo de pregunta y ajusta las propiedades correspondientes
    const setType = useCallback((type) => {
        if (type === 'truefalse') {
            onChange({
                type,
                statements: q.statements?.length ? q.statements : [
                    { id: 's1', text: '', correct: true },
                    { id: 's2', text: '', correct: false },
                ],
                correct: null,
            });
        } else {
            onChange({
                type,
                correct: type === 'multiple' ? [] : null,
            });
        }
    }, [q.statements, onChange]);

    // Opciones (single / multiple)
    const updateOption = (optId, text) => {
        onChange({ options: q.options.map(o => o.id === optId ? { ...o, text } : o) });
    };

    const addOption = () => {
        if (q.options.length >= 5) return;
        const newId = OPTION_IDS[q.options.length];
        onChange({ options: [...q.options, { id: newId, text: '' }] });
    };

    const removeOption = (optId) => {
        if (q.options.length <= 2) return;
        const newOptions = q.options.filter(o => o.id !== optId);
        const newCorrect = q.type === 'multiple'
            ? (q.correct || []).filter(c => c !== optId)
            : q.correct === optId ? null : q.correct;
        onChange({ options: newOptions, correct: newCorrect });
    };

    // Respuesta correcta
    const setCorrectSingle = (optId) => onChange({ correct: optId });
    const toggleCorrectMultiple = (optId) => {
        const current = q.correct || [];
        const next = current.includes(optId)
            ? current.filter(c => c !== optId)
            : [...current, optId];
        onChange({ correct: next });
    };

    // Afirmaciones verdadero/falso
    const updateStatement = (sId, field, value) => {
        onChange({
            statements: q.statements.map(s => s.id === sId ? { ...s, [field]: value } : s)
        });
    };

    const addStatement = () => {
        const newId = `s${q.statements.length + 1}`;
        onChange({ statements: [...q.statements, { id: newId, text: '', correct: true }] });
    };

    const removeStatement = (sId) => {
        if (q.statements.length <= 2) return;
        onChange({ statements: q.statements.filter(s => s.id !== sId) });
    };

    return (
        <motion.div
            className={styles.questionCard}
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
        >
            {/* Cabecera de la tarjeta */}
            <div className={styles.questionHeader} onClick={() => setOpen(p => !p)}>
                <span className={styles.questionNum}>P{index + 1}</span>
                <span className={styles.questionSummary}>
                    {q.text || <em className={styles.placeholder}>Sin texto aún</em>}
                </span>
                <span className={`${styles.typeBadge} ${styles[`type_${q.type}`]}`}>
                    {TYPE_LABELS[q.type]}
                </span>
                <div className={styles.questionActions} onClick={e => e.stopPropagation()}>
                    <button
                        className={styles.iconBtn}
                        onClick={() => onMove(-1)}
                        disabled={index === 0}
                        title="Subir pregunta"
                    >
                        <MoveUp size={14} />
                    </button>
                    <button
                        className={styles.iconBtn}
                        onClick={() => onMove(1)}
                        disabled={index === total - 1}
                        title="Bajar pregunta"
                    >
                        <MoveDown size={14} />
                    </button>
                    <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        onClick={onDelete}
                        title="Eliminar pregunta"
                    >
                        <Trash2 size={14} />
                    </button>
                    <button className={styles.iconBtn} title={open ? 'Colapsar' : 'Expandir'}>
                        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>
            </div>

            {/* Cuerpo editable */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        className={styles.questionBody}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                    >
                        {/* Selector de tipo */}
                        <div className={styles.typeRow}>
                            {Object.entries(TYPE_LABELS).map(([type, label]) => (
                                <button
                                    key={type}
                                    className={`${styles.typeBtn} ${q.type === type ? styles.typeBtnActive : ''}`}
                                    onClick={() => setType(type)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* Texto de la pregunta */}
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Pregunta</label>
                            <textarea
                                className={styles.textarea}
                                value={q.text}
                                onChange={e => onChange({ text: e.target.value })}
                                placeholder="Escribe el texto de la pregunta..."
                                rows={2}
                            />
                        </div>

                        {/* Puntos */}
                        <div className={`${styles.fieldGroup} ${styles.fieldNarrow}`}>
                            <label className={styles.fieldLabel}>Puntos</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={q.points}
                                min={0.1}
                                step={0.01}
                                onChange={e => onChange({ points: +e.target.value })}
                            />
                        </div>

                        {/* Editor de opciones (single / multiple) */}
                        {q.type !== 'truefalse' && (
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>
                                    Opciones — marca la{q.type === 'multiple' ? 's' : ''} correcta{q.type === 'multiple' ? 's' : ''}
                                </label>
                                {q.options.map(opt => (
                                    <div key={opt.id} className={styles.optionRow}>
                                        {q.type === 'single' ? (
                                            <input
                                                type="radio"
                                                name={`q-${q.id}-correct`}
                                                checked={q.correct === opt.id}
                                                onChange={() => setCorrectSingle(opt.id)}
                                                className={styles.optControl}
                                            />
                                        ) : (
                                            <input
                                                type="checkbox"
                                                checked={(q.correct || []).includes(opt.id)}
                                                onChange={() => toggleCorrectMultiple(opt.id)}
                                                className={styles.optControl}
                                            />
                                        )}
                                        <span className={styles.optLetter}>{opt.id})</span>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            value={opt.text}
                                            onChange={e => updateOption(opt.id, e.target.value)}
                                            placeholder={`Texto de la opción ${opt.id.toUpperCase()}`}
                                        />
                                        <button
                                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                            onClick={() => removeOption(opt.id)}
                                            disabled={q.options.length <= 2}
                                            title="Quitar opción"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                                {q.options.length < 5 && (
                                    <button className={styles.addOptBtn} onClick={addOption}>
                                        <Plus size={13} /> Agregar opción
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Editor de afirmaciones verdadero/falso */}
                        {q.type === 'truefalse' && (
                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>
                                    Afirmaciones — activa el switch en las que son Verdaderas
                                </label>
                                {q.statements.map(s => (
                                    <div key={s.id} className={styles.statementRow}>
                                        <input
                                            type="text"
                                            className={styles.input}
                                            value={s.text}
                                            onChange={e => updateStatement(s.id, 'text', e.target.value)}
                                            placeholder="Escribe la afirmación..."
                                        />
                                        <label className={styles.tfToggle}>
                                            <input
                                                type="checkbox"
                                                checked={s.correct}
                                                onChange={e => updateStatement(s.id, 'correct', e.target.checked)}
                                            />
                                            <span className={styles.tfTrack} />
                                            <span className={styles.tfLabel}>{s.correct ? 'V' : 'F'}</span>
                                        </label>
                                        <button
                                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                            onClick={() => removeStatement(s.id)}
                                            disabled={q.statements.length <= 2}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                                {q.statements.length < 8 && (
                                    <button className={styles.addOptBtn} onClick={addStatement}>
                                        <Plus size={13} /> Agregar afirmación
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
