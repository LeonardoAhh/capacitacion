'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ui/Toast/Toast';
import { Button } from '@/components/ui/Button/Button';
import styles from './QuestionManager.module.css';

export default function QuestionManager({ isOpen, onClose }) {
    const { toast } = useToast();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Editor State
    const [editingQuestion, setEditingQuestion] = useState(null); // null = list mode, {} = create, {id...} = edit
    const [formData, setFormData] = useState(initialFormState());
    const [saving, setSaving] = useState(false);

    const loadQuestions = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all questions - optimizations can be added later if list grows too large
            const q = query(collection(db, 'exam_questions'), orderBy('question'));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setQuestions(data);
        } catch (error) {
            console.error("Error loading questions", error);
            toast.error("Error", "No se pudieron cargar las preguntas.");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (isOpen) {
            loadQuestions();
        }
    }, [isOpen, loadQuestions]);

    function initialFormState() {
        return {
            theme: '',
            type: 'Múltiple', // 'Múltiple' or 'Abierta'
            question: '',
            options: { a: '', b: '', c: '' },
            correctAnswer: 'a' // 'a', 'b', 'c' or text
        };
    }



    const filteredQuestions = questions.filter(q =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.theme?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreate = () => {
        setFormData(initialFormState());
        setEditingQuestion({}); // Empty object signifies "New Mode"
    };

    const handleEdit = (q) => {
        setFormData({
            theme: q.theme || '',
            type: q.type || 'Múltiple',
            question: q.question || '',
            options: {
                a: q.options?.a || '',
                b: q.options?.b || '',
                c: q.options?.c || ''
            },
            correctAnswer: q.correctAnswer || ''
        });
        setEditingQuestion(q);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar esta pregunta?")) return;

        try {
            await deleteDoc(doc(db, 'exam_questions', id));
            setQuestions(prev => prev.filter(q => q.id !== id));
            toast.success("Eliminado", "Pregunta eliminada correctamente.");
        } catch (error) {
            console.error("Error deleting", error);
            toast.error("Error", "No se pudo eliminar.");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!formData.question.trim()) {
            toast.error("Error", "La pregunta es obligatoria.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                theme: formData.theme,
                type: formData.type,
                question: formData.question,
                options: formData.type === 'Múltiple' ? formData.options : null,
                correctAnswer: formData.correctAnswer,
                updatedAt: serverTimestamp()
            };

            if (editingQuestion.id) {
                // Update
                await updateDoc(doc(db, 'exam_questions', editingQuestion.id), payload);
                setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...payload } : q));
                toast.success("Actualizado", "Pregunta actualizada.");
            } else {
                // Create
                // Generate a generic ID or let Firestore do it. 
                // Existing script used "Q-XXXX". Let's stick to Firestore IDs for new ones to avoid max ID scan.
                const ref = await addDoc(collection(db, 'exam_questions'), {
                    ...payload,
                    createdAt: serverTimestamp()
                });
                setQuestions(prev => [...prev, { id: ref.id, ...payload }]);
                toast.success("Creado", "Pregunta creada.");
            }
            setEditingQuestion(null); // Back to list

        } catch (error) {
            console.error("Error saving", error);
            toast.error("Error", "No se pudo guardar la pregunta.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className={styles.panel}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    >
                        <div className={styles.header}>
                            <h2>{editingQuestion ? (editingQuestion.id ? 'Editar Pregunta' : 'Nueva Pregunta') : 'Gestión de Preguntas'}</h2>
                            <button onClick={onClose} className={styles.closeBtn}><X size={24} /></button>
                        </div>

                        <div className={styles.content}>
                            {editingQuestion ? (
                                // ===== EDITOR FORM =====
                                <form onSubmit={handleSave} className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <label>Pregunta</label>
                                        <textarea
                                            className={styles.textarea}
                                            value={formData.question}
                                            onChange={e => setFormData({ ...formData, question: e.target.value })}
                                            placeholder="Escribe la pregunta..."
                                            rows={3}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Tema</label>
                                        <input
                                            className={styles.input}
                                            value={formData.theme}
                                            onChange={e => setFormData({ ...formData, theme: e.target.value })}
                                            placeholder="Ej. Seguridad, Calidad..."
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label>Tipo</label>
                                        <select
                                            className={styles.select}
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="Múltiple">Opción Múltiple</option>
                                            <option value="Abierta">Abierta</option>
                                        </select>
                                    </div>

                                    {formData.type === 'Múltiple' && (
                                        <div className={styles.optionsGrid}>
                                            <div className={styles.formGroup}>
                                                <label>Opción A</label>
                                                <input
                                                    className={styles.input}
                                                    value={formData.options.a}
                                                    onChange={e => setFormData({ ...formData, options: { ...formData.options, a: e.target.value } })}
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Opción B</label>
                                                <input
                                                    className={styles.input}
                                                    value={formData.options.b}
                                                    onChange={e => setFormData({ ...formData, options: { ...formData.options, b: e.target.value } })}
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Opción C</label>
                                                <input
                                                    className={styles.input}
                                                    value={formData.options.c}
                                                    onChange={e => setFormData({ ...formData, options: { ...formData.options, c: e.target.value } })}
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Respuesta Correcta</label>
                                                <select
                                                    className={styles.select}
                                                    value={formData.correctAnswer}
                                                    onChange={e => setFormData({ ...formData, correctAnswer: e.target.value })}
                                                >
                                                    <option value="a">Opción A</option>
                                                    <option value="b">Opción B</option>
                                                    <option value="c">Opción C</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.formActions}>
                                        <button type="button" onClick={() => setEditingQuestion(null)} className={styles.cancelBtn}>Cancelar</button>
                                        <button type="submit" disabled={saving} className={styles.submitBtn}>
                                            {saving ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                // ===== LIST VIEW =====
                                <>
                                    <div className={styles.searchBar}>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={18} style={{ position: 'absolute', left: 10, top: 12, color: 'gray' }} />
                                            <input
                                                className={styles.searchInput}
                                                style={{ paddingLeft: '35px' }}
                                                placeholder="Buscar preguntas..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <Button onClick={handleCreate} className={styles.addButton}>
                                        <Plus size={18} style={{ marginRight: 8 }} />
                                        Nueva Pregunta
                                    </Button>

                                    {loading ? (
                                        <div className={styles.loading}>Cargando preguntas...</div>
                                    ) : (
                                        <div className={styles.questionList}>
                                            {filteredQuestions.map(q => (
                                                <div key={q.id} className={styles.questionCard}>
                                                    <div className={styles.questionHeader}>
                                                        <span className={styles.badge}>{q.theme || 'General'}</span>
                                                        <span className={styles.badge}>{q.type}</span>
                                                    </div>
                                                    <p className={styles.questionText}>{q.question}</p>
                                                    <div className={styles.actions}>
                                                        <button onClick={() => handleEdit(q)} className={`${styles.actionBtn} ${styles.editBtn}`}>
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(q.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredQuestions.length === 0 && (
                                                <div className={styles.loading}>No se encontraron preguntas.</div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
