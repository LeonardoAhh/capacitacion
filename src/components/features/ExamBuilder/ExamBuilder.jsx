'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Save, Eye, Send } from 'lucide-react';
import ExamHeader from './ExamHeader';
import QuestionCard from './QuestionCard';
import ExamPreview from './ExamPreview';
import styles from './ExamBuilder.module.css';

// Estado vacío para un examen nuevo
const EMPTY_EXAM = {
    documentId: '',
    revision: '',
    title: '',
    passingScore: 7,
    questions: [],
    status: 'draft',
};

// Crea una pregunta nueva con valores por defecto según el tipo
function createQuestion(type = 'single') {
    return {
        id: crypto.randomUUID(),
        type,
        text: '',
        points: 1,
        options: [
            { id: 'a', text: '' },
            { id: 'b', text: '' },
            { id: 'c', text: '' },
        ],
        correct: type === 'multiple' ? [] : null,
        statements: type === 'truefalse' ? [
            { id: 's1', text: '', correct: true },
            { id: 's2', text: '', correct: false },
        ] : [],
    };
}

/**
 * Componente orquestador del constructor de exámenes.
 * Maneja el estado local del examen y delega la persistencia al padre.
 */
export default function ExamBuilder({ initial = null, onSave, onPublish, saving }) {
    const [exam, setExam] = useState(() => initial ? { ...EMPTY_EXAM, ...initial } : EMPTY_EXAM);
    const [showPreview, setShowPreview] = useState(false);

    // Actualiza un campo de los metadatos del examen
    const updateMeta = useCallback((field, value) => {
        setExam(prev => ({ ...prev, [field]: value }));
    }, []);

    // Agrega una pregunta al final del listado
    const addQuestion = useCallback((type = 'single') => {
        setExam(prev => ({
            ...prev,
            questions: [...prev.questions, createQuestion(type)],
        }));
    }, []);

    // Actualiza campos de una pregunta por su ID
    const updateQuestion = useCallback((qId, updates) => {
        setExam(prev => ({
            ...prev,
            questions: prev.questions.map(q => q.id === qId ? { ...q, ...updates } : q),
        }));
    }, []);

    // Elimina una pregunta por su ID
    const deleteQuestion = useCallback((qId) => {
        setExam(prev => ({
            ...prev,
            questions: prev.questions.filter(q => q.id !== qId),
        }));
    }, []);

    // Mueve una pregunta hacia arriba (-1) o abajo (+1)
    const moveQuestion = useCallback((qId, direction) => {
        setExam(prev => {
            const qs = [...prev.questions];
            const idx = qs.findIndex(q => q.id === qId);
            const newIdx = idx + direction;
            if (newIdx < 0 || newIdx >= qs.length) return prev;
            [qs[idx], qs[newIdx]] = [qs[newIdx], qs[idx]];
            return { ...prev, questions: qs };
        });
    }, []);

    return (
        <div className={styles.builder}>
            {/* Metadatos auditables */}
            <ExamHeader exam={exam} onChange={updateMeta} />

            {/* Lista de preguntas */}
            <div className={styles.questions}>
                <AnimatePresence mode="popLayout">
                    {exam.questions.map((q, idx) => (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            index={idx}
                            total={exam.questions.length}
                            onChange={updates => updateQuestion(q.id, updates)}
                            onDelete={() => deleteQuestion(q.id)}
                            onMove={dir => moveQuestion(q.id, dir)}
                        />
                    ))}
                </AnimatePresence>

                {exam.questions.length === 0 && (
                    <div className={styles.emptyQuestions}>
                        <p>Aún no hay preguntas. Usa los botones de abajo para agregar.</p>
                    </div>
                )}
            </div>

            {/* Botones para agregar preguntas */}
            <div className={styles.addSection}>
                <p className={styles.addLabel}>Agregar pregunta:</p>
                <div className={styles.addButtons}>
                    <button className={styles.addBtn} onClick={() => addQuestion('single')}>
                        <Plus size={14} /> Opción única
                    </button>
                    <button className={styles.addBtn} onClick={() => addQuestion('multiple')}>
                        <Plus size={14} /> Opción múltiple
                    </button>
                    <button className={styles.addBtn} onClick={() => addQuestion('truefalse')}>
                        <Plus size={14} /> Verdadero / Falso
                    </button>
                </div>
            </div>

            {/* Toolbar de acciones */}
            <div className={styles.toolbar}>
                <button className={styles.btnPreview} onClick={() => setShowPreview(true)}>
                    <Eye size={16} /> Vista previa
                </button>
                <button
                    className={`${styles.btnSave} ${saving ? styles.btnSaving : ''}`}
                    onClick={() => onSave(exam)}
                    disabled={saving}
                >
                    <Save size={16} />
                    {saving ? 'Guardando…' : 'Guardar borrador'}
                </button>
                <button
                    className={styles.btnPublish}
                    onClick={() => onPublish(exam)}
                    disabled={saving}
                >
                    <Send size={16} /> Publicar
                </button>
            </div>

            {/* Modal de vista previa */}
            <AnimatePresence>
                {showPreview && (
                    <ExamPreview exam={exam} onClose={() => setShowPreview(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}
