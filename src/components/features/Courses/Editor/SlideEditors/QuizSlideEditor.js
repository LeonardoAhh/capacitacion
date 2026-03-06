import React from 'react';
import { IconPlus } from '@/lib/icons';
import { QuestionEditor } from './Shared';

export default function QuizSlideEditor({ formData, handleChange, styles }) {
    const questions = formData.questions || [];

    const updateQuestion = (qi, updater) =>
        handleChange('questions', questions.map((q, i) => i === qi ? updater(q) : q));

    const addQuestion = () =>
        handleChange('questions', [
            ...questions,
            { q: '', options: ['', ''], correct: 0, explanation: '' },
        ]);

    const removeQuestion = (qi) =>
        handleChange('questions', questions.filter((_, i) => i !== qi));

    const addOption = (qi) =>
        updateQuestion(qi, q => ({ ...q, options: [...(q.options || []), ''] }));

    const removeOption = (qi, oi) =>
        updateQuestion(qi, q => {
            const newOptions = (q.options || []).filter((_, i) => i !== oi);
            let newCorrect = q.correct;
            if (q.correct === oi) newCorrect = 0;
            else if (typeof q.correct === 'number' && q.correct > oi) newCorrect -= 1;
            return { ...q, options: newOptions, correct: newCorrect };
        });

    return (
        <>
            {/* Título */}
            <div className={styles.formGroup}>
                <label className={styles.label}>Título del Quiz</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={e => handleChange('heading', e.target.value)}
                    placeholder="Ej. Evaluación Final"
                    maxLength={120}
                />
            </div>

            {/* Puntaje mínimo */}
            <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <label className={styles.label} style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                    Puntaje mínimo para aprobar (%)
                </label>
                <input
                    type="number"
                    className={styles.input}
                    value={formData.passingScore ?? 70}
                    min={0}
                    max={100}
                    onChange={e => handleChange('passingScore', Math.max(0, Math.min(100, Number(e.target.value))))}
                    style={{ maxWidth: 80 }}
                />
            </div>

            {/* Listado de preguntas */}
            <div className={styles.formGroup}>
                <label className={styles.label} style={{ marginBottom: 8 }}>
                    Preguntas ({questions.length})
                </label>

                {questions.map((q, qi) => (
                    <QuestionEditor
                        key={qi}
                        qi={qi}
                        q={q}
                        onUpdate={(updater) => updateQuestion(qi, updater)}
                        onRemove={() => removeQuestion(qi)}
                        onAddOption={() => addOption(qi)}
                        onRemoveOption={(oi) => removeOption(qi, oi)}
                        styles={styles}
                    />
                ))}

                <button className={styles.addItemBtn} onClick={addQuestion}>
                    <IconPlus size={14} /> Agregar Pregunta
                </button>
            </div>
        </>
    );
}
