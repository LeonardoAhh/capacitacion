'use client';

import { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Plus, Save, Eye, Send, ChevronDown, ChevronUp,
    BookOpen, AlertCircle, CheckCircle, X,
} from 'lucide-react';
import ExamHeader from './ExamHeader';
import QuestionCard from './QuestionCard';
import ExamPreview, { ExamDocument } from './ExamPreview';
import styles from './ExamBuilder.module.css';

// ── Estado vacío de un examen nuevo ─────────────────────────────────
const EMPTY_EXAM = {
    documentId: '',
    revision: '',
    title: '',
    passingScore: 7,
    puestosAplicables: [],
    questions: [],
    status: 'draft',
};

// ── Crea una pregunta nueva con valores por defecto según tipo ───────
export function createQuestion(type = 'single') {
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
        statements: type === 'truefalse'
            ? [{ id: 's1', text: '', correct: true }, { id: 's2', text: '', correct: false }]
            : [],
    };
}

// ── Validación completa del examen → devuelve array de errores ───────
function validateExam(exam) {
    const errors = [];
    if (!exam.title?.trim())
        errors.push({ id: 'title', msg: 'El examen necesita un título' });
    if (!exam.documentId?.trim())
        errors.push({ id: 'docId', msg: 'Falta el ID del documento (ej: RG-GER-015)' });
    if (!exam.questions?.length)
        errors.push({ id: 'questions', msg: 'Agrega al menos una pregunta' });

    exam.questions?.forEach((q, idx) => {
        const n = idx + 1;
        if (!q.text?.trim())
            errors.push({ id: `q${idx}-text`, msg: `Pregunta ${n}: falta el texto` });
        if (q.type === 'single' && !q.correct)
            errors.push({ id: `q${idx}-ans`, msg: `Pregunta ${n}: no tiene respuesta correcta marcada` });
        if (q.type === 'multiple' && !q.correct?.length)
            errors.push({ id: `q${idx}-ans`, msg: `Pregunta ${n}: no tiene respuestas correctas marcadas` });
        q.options?.forEach((opt, oi) => {
            if (!opt.text?.trim())
                errors.push({ id: `q${idx}-o${oi}`, msg: `Pregunta ${n}: la opción "${opt.id.toUpperCase()}" está vacía` });
        });
        q.statements?.forEach((s, si) => {
            if (!s.text?.trim())
                errors.push({ id: `q${idx}-s${si}`, msg: `Pregunta ${n}: la afirmación ${si + 1} está vacía` });
        });
    });
    return errors;
}

// ── Barra de progreso del examen ─────────────────────────────────────
function ExamProgress({ exam }) {
    const totalPoints = useMemo(
        () => exam.questions.reduce((s, q) => s + (Number(q.points) || 0), 0),
        [exam.questions]
    );
    const completed = exam.questions.filter(q => {
        if (!q.text?.trim()) return false;
        if (q.type === 'single') return !!q.correct;
        if (q.type === 'multiple') return q.correct?.length > 0;
        return q.statements?.every(s => s.text?.trim());
    }).length;
    const pct = exam.questions.length > 0 ? Math.round((completed / exam.questions.length) * 100) : 0;
    const minPts = totalPoints > 0 ? ((exam.passingScore / 10) * totalPoints).toFixed(2) : '—';

    return (
        <div className={styles.progressWrap}>
            <div className={styles.progressStats}>
                <span><strong>{exam.questions.length}</strong> preguntas</span>
                <span className={styles.dot}>·</span>
                <span><strong>{totalPoints.toFixed(2)}</strong> pts totales</span>
                <span className={styles.dot}>·</span>
                <span>Mínimo: <strong>{exam.passingScore}/10</strong> <em>({minPts} pts)</em></span>
                <span className={styles.dot}>·</span>
                <span className={pct === 100 ? styles.progressAllDone : ''}>
                    {completed}/{exam.questions.length} completas
                </span>
            </div>
            <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ── Panel de instrucciones colapsable ────────────────────────────────
const GUIDES = [
    {
        q: '¿Cómo funciona el puntaje?',
        a: 'Los puntos de cada pregunta forman el total. La calificación final se convierte a escala 0-10. Si el mínimo es 7, el candidato necesita 70% del total de puntos.',
    },
    {
        q: '¿Opción única vs Opción múltiple?',
        a: 'Opción única: solo una respuesta correcta (radio). Opción múltiple: varias respuestas correctas (checkboxes). El candidato gana los puntos al marcar todas las correctas.',
    },
    {
        q: '¿Cómo funciona Verdadero / Falso?',
        a: 'Se presentan afirmaciones. El candidato marca cada una como V o F. Solo obtiene los puntos si acierta TODAS las afirmaciones de esa pregunta.',
    },
    {
        q: '¿Qué significa publicar?',
        a: 'El examen queda disponible para candidatos en el portal. Se guarda un snapshot automático en el historial de versiones. Puedes seguir editando después.',
    },
];

function InstructionsPanel() {
    const [open, setOpen] = useState(false);
    const [active, setActive] = useState(null);

    return (
        <div className={styles.instructionsWrap}>
            <button className={styles.instructionsToggle} onClick={() => setOpen(p => !p)}>
                <BookOpen size={15} />
                <span>Guía rápida del editor</span>
                {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        className={styles.instructionsPanel}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className={styles.instructionsContent}>
                            {GUIDES.map((g, i) => (
                                <div key={i} className={styles.guideItem}>
                                    <button
                                        className={styles.guideQ}
                                        onClick={() => setActive(active === i ? null : i)}
                                    >
                                        <span>{g.q}</span>
                                        {active === i ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                    </button>
                                    <AnimatePresence>
                                        {active === i && (
                                            <motion.p
                                                className={styles.guideA}
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                {g.a}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Modal de validación previo a publicar ────────────────────────────
function ValidationModal({ errors, onFix, onConfirm, onClose }) {
    const hasErrors = errors.length > 0;
    return (
        <motion.div
            className={styles.valOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.valModal}
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={e => e.stopPropagation()}
            >
                <div className={`${styles.valHeader} ${hasErrors ? styles.valHeaderError : styles.valHeaderOk}`}>
                    {hasErrors
                        ? <><AlertCircle size={18} /> Hay problemas por resolver</>
                        : <><CheckCircle size={18} /> El examen está listo</>
                    }
                    <button className={styles.valClose} onClick={onClose}><X size={16} /></button>
                </div>

                <div className={styles.valBody}>
                    {hasErrors ? (
                        <>
                            <p className={styles.valDesc}>
                                Corrige los siguientes puntos para garantizar la calidad del examen:
                            </p>
                            <ul className={styles.errorList}>
                                {errors.map(e => (
                                    <li key={e.id} className={styles.errorItem}>
                                        <AlertCircle size={13} /> {e.msg}
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <p className={styles.valDesc}>
                            Todas las preguntas están completas y tienen respuesta correcta.
                            Al publicar se guardará un snapshot en el historial de versiones.
                        </p>
                    )}
                </div>

                <div className={styles.valFooter}>
                    <button className={styles.valBtnSecondary} onClick={onFix}>
                        {hasErrors ? 'Volver a corregir' : 'Cancelar'}
                    </button>
                    <button className={styles.valBtnPrimary} onClick={onConfirm}>
                        <Send size={14} /> {hasErrors ? 'Publicar de todas formas' : 'Publicar ahora'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Componente principal ─────────────────────────────────────────────
export default function ExamBuilder({ initial = null, onSave, onPublish, saving }) {
    const [exam, setExam] = useState(() => initial ? { ...EMPTY_EXAM, ...initial } : EMPTY_EXAM);
    const [showPreview, setShowPreview] = useState(false);
    const [showValidation, setShowValidation] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);

    const updateMeta = useCallback((field, value) => {
        setExam(prev => ({ ...prev, [field]: value }));
    }, []);

    const addQuestion = useCallback((type = 'single') => {
        setExam(prev => ({ ...prev, questions: [...prev.questions, createQuestion(type)] }));
    }, []);

    const updateQuestion = useCallback((qId, updates) => {
        setExam(prev => ({
            ...prev,
            questions: prev.questions.map(q => q.id === qId ? { ...q, ...updates } : q),
        }));
    }, []);

    const deleteQuestion = useCallback((qId) => {
        setExam(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== qId) }));
    }, []);

    const moveQuestion = useCallback((qId, direction) => {
        setExam(prev => {
            const qs = [...prev.questions];
            const idx = qs.findIndex(q => q.id === qId);
            const next = idx + direction;
            if (next < 0 || next >= qs.length) return prev;
            [qs[idx], qs[next]] = [qs[next], qs[idx]];
            return { ...prev, questions: qs };
        });
    }, []);

    // Abre el modal de validación antes de publicar
    const handlePublishClick = () => {
        const errors = validateExam(exam);
        setValidationErrors(errors);
        setShowValidation(true);
    };

    return (
        <div className={styles.builder}>
            {/* --- UI DEL EDITOR (Oculto al imprimir) --- */}
            <div className={styles.editorUi}>
                <ExamHeader exam={exam} onChange={updateMeta} />
                <ExamProgress exam={exam} />
                <InstructionsPanel />

                {/* Lista de preguntas */}
                <div className={styles.questions}>
                    <AnimatePresence mode="popLayout">
                        {exam.questions.map((q, idx) => (
                            <QuestionCard
                                key={q.id}
                                question={q}
                                index={idx}
                                total={exam.questions.length}
                                onChange={u => updateQuestion(q.id, u)}
                                onDelete={() => deleteQuestion(q.id)}
                                onMove={d => moveQuestion(q.id, d)}
                            />
                        ))}
                    </AnimatePresence>
                    {exam.questions.length === 0 && (
                        <div className={styles.emptyQuestions}>
                            <p>Aún no hay preguntas. Usa los botones de abajo para agregar.</p>
                        </div>
                    )}
                </div>

                {/* Agregar preguntas */}
                <div className={styles.addSection}>
                    <p className={styles.addLabel}>Agregar pregunta:</p>
                    <div className={styles.addButtons}>
                        {[['single', 'Opción única'], ['multiple', 'Opción múltiple'], ['truefalse', 'Verdadero / Falso']].map(([type, label]) => (
                            <button key={type} className={styles.addBtn} onClick={() => addQuestion(type)}>
                                <Plus size={14} /> {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toolbar */}
                <div className={styles.toolbar}>
                    <button className={styles.btnPreview} onClick={() => setShowPreview(true)}>
                        <Eye size={16} /> Vista previa
                    </button>
                    <button
                        className={`${styles.btnSave} ${saving ? styles.btnSaving : ''}`}
                        onClick={() => onSave({ ...exam, status: 'draft' })}
                        disabled={saving}
                    >
                        <Save size={16} /> {saving ? 'Guardando…' : 'Guardar borrador'}
                    </button>
                    <button className={styles.btnPublish} onClick={handlePublishClick} disabled={saving}>
                        <Send size={16} /> Publicar
                    </button>
                </div>
            </div> {/* Fin de editorUi */}

            {/* --- UI DE IMPRESIÓN DIRECTA (Visible solo al imprimir) --- */}
            <div className={styles.printOnly}>
                <ExamDocument exam={exam} />
            </div>

            {/* Modales */}
            <AnimatePresence>
                {showPreview && <ExamPreview exam={exam} onClose={() => setShowPreview(false)} />}
            </AnimatePresence>
            <AnimatePresence>
                {showValidation && (
                    <ValidationModal
                        errors={validationErrors}
                        onFix={() => setShowValidation(false)}
                        onConfirm={() => { setShowValidation(false); onPublish(exam); }}
                        onClose={() => setShowValidation(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
