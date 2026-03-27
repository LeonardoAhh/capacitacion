'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import {
    collection, getDocs, addDoc, updateDoc, deleteDoc,
    doc, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { Search, Plus, Edit2, Trash2, ArrowLeft, Download, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/Toast/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import {
    Dialog, DialogHeader, DialogTitle, DialogFooter,
    DialogClose, DialogDescription, DialogBody,
} from '@/components/ui/Dialog/Dialog';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import Link from 'next/link';
import { Select } from '@/components/ui/Select/Select';
import styles from './gestionar.module.css';

// ─── Constantes ──────────────────────────────────────────────────────────────

const DEPARTMENTS = ['Producción', 'Calidad', 'Moldes', 'Recursos Humanos'];
const VALID_ANSWERS = ['a', 'b', 'c'];

const INITIAL_FORM_STATE = {
    theme: '',
    department: 'Producción',
    type: 'Múltiple',
    question: '',
    options: { a: '', b: '', c: '' },
    correctAnswer: 'a',
    isFixed: false,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeAnswer(val) {
    const lower = val?.toLowerCase();
    return VALID_ANSWERS.includes(lower) ? lower : 'a';
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function GestionarPreguntasPage() {
    const { toast } = useToast();
    const { showConfirm, confirmDialog } = useConfirm();

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('Todos');
    const [selectedTheme, setSelectedTheme] = useState('Todos');

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);

    // ─── Firebase ───────────────────────────────────────────────────────────

    const loadQuestions = useCallback(async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'exam_questions'), orderBy('question'));
            const snap = await getDocs(q);
            setQuestions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) {
            console.error('Error loading questions:', error);
            toast.error('Error', 'No se pudieron cargar las preguntas.');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadQuestions();
    }, [loadQuestions]);

    // ─── Filtros derivados ───────────────────────────────────────────────────

    const uniqueThemes = useMemo(() => {
        const themes = questions.map(q => q.theme || q.TEMA || 'General');
        return ['Todos', ...new Set(themes)].sort();
    }, [questions]);

    const filteredQuestions = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return questions.filter(item => {
            const themeValue = item.theme || item.TEMA || 'General';
            const matchesDept = selectedDept === 'Todos' || (item.department || 'Producción') === selectedDept;
            const matchesTheme = selectedTheme === 'Todos' || themeValue === selectedTheme;
            const matchesSearch = !term ||
                item.question?.toLowerCase().includes(term) ||
                themeValue.toLowerCase().includes(term) ||
                item.id.toLowerCase().includes(term);
            return matchesDept && matchesTheme && matchesSearch;
        });
    }, [questions, searchTerm, selectedDept, selectedTheme]);

    // ─── Handlers CRUD ───────────────────────────────────────────────────────

    const handleCreateClick = () => {
        setFormData(INITIAL_FORM_STATE);
        setEditingQuestion(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (q) => {
        setFormData({
            theme: q.theme || '',
            department: q.department || 'Producción',
            type: 'Múltiple',
            question: q.question || '',
            options: {
                a: q.options?.a || '',
                b: q.options?.b || '',
                c: q.options?.c || '',
            },
            correctAnswer: normalizeAnswer(q.correctAnswer),
            isFixed: q.isFixed || false,
        });
        setEditingQuestion(q);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (id) => {
        const confirmed = await showConfirm('¿Seguro que deseas eliminar esta pregunta?', {
            title: 'Eliminar Pregunta',
            confirmLabel: 'Eliminar',
        });
        if (!confirmed) return;

        try {
            await deleteDoc(doc(db, 'exam_questions', id));
            setQuestions(prev => prev.filter(q => q.id !== id));
            toast.success('Eliminado', 'Pregunta eliminada correctamente.');
        } catch (error) {
            console.error('Error deleting question:', error);
            toast.error('Error', 'No se pudo eliminar.');
        }
    };

    const handleSaveForm = async (e) => {
        e.preventDefault();

        if (!formData.question.trim()) {
            toast.error('Error', 'La pregunta es obligatoria.');
            return;
        }
        if (!formData.options.a.trim() || !formData.options.b.trim()) {
            toast.error('Error', 'Las opciones A y B son obligatorias.');
            return;
        }

        setSaving(true);
        try {
            const payload = {
                theme: formData.theme,
                department: formData.department,
                type: 'Múltiple',
                question: formData.question,
                options: formData.options,
                correctAnswer: normalizeAnswer(formData.correctAnswer),
                isFixed: formData.isFixed,
                updatedAt: serverTimestamp(),
            };

            if (editingQuestion?.id) {
                await updateDoc(doc(db, 'exam_questions', editingQuestion.id), payload);
                setQuestions(prev => prev.map(q =>
                    q.id === editingQuestion.id ? { ...q, ...payload } : q
                ));
                toast.success('Actualizado', 'Pregunta actualizada.');
            } else {
                const ref = await addDoc(collection(db, 'exam_questions'), {
                    ...payload,
                    createdAt: serverTimestamp(),
                });
                setQuestions(prev => [...prev, { id: ref.id, ...payload }]);
                toast.success('Creado', 'Pregunta creada satisfactoriamente.');
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving question:', error);
            toast.error('Error', 'No se pudo guardar la pregunta.');
        } finally {
            setSaving(false);
        }
    };

    // Exporta las preguntas visibles según filtros activos
    const handleDownloadExcel = () => {
        try {
            const dataToExport = filteredQuestions.map(q => ({
                'ID': q.id.slice(-6).toUpperCase(),
                'Departamento': q.department || 'N/A',
                'Tema': q.theme || 'N/A',
                'Pregunta': q.question || '',
                'Opción A': q.options?.a || '',
                'Opción B': q.options?.b || '',
                'Opción C': q.options?.c || '',
                'Respuesta Correcta': q.correctAnswer || '',
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Preguntas');
            const fileName = `Banco_Preguntas_VTX_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);
            toast.success('Descarga iniciada', 'El archivo Excel se está generando.');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Error', 'No se pudo generar el archivo Excel.');
        }
    };

    const handlePrintQuestions = () => {
        const visibleQuestions = filteredQuestions;
        const filterSummary = `Departamento: ${selectedDept} · Tema: ${selectedTheme} · Buscar: ${searchTerm || 'N/A'}`;
        const content = visibleQuestions.map((q, index) => {
            const themeLabel = q.theme || 'General';
            const answerOptions = ['a', 'b', 'c']
                .map(letter => {
                    const text = q.options?.[letter];
                    if (!text) return '';
                    const isCorrect = q.correctAnswer?.toLowerCase() === letter;
                    return `<div class="option ${isCorrect ? 'correct' : ''}"><strong>${letter.toUpperCase()}.</strong> ${text}${isCorrect ? ' ✓' : ''}</div>`;
                })
                .filter(Boolean)
                .join('');

            return `
                <section class="question-card">
                    <div class="question-header">
                        <div><span class="badge">#${index + 1}</span> <strong>${q.department || 'Producción'}</strong></div>
                        <div class="meta">${themeLabel}</div>
                    </div>
                    <p class="question-text">${q.question || ''}</p>
                    <div class="options">${answerOptions}</div>
                </section>
            `;
        }).join('');

        const html = `<!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8" />
                <title>Imprimir preguntas</title>
                <style>
                    @page { size: letter portrait; margin: 12mm; }
                    *, *::before, *::after { box-sizing: border-box; }
                    html, body { width: 100%; min-height: 100%; }
                    body { font-family: Arial, sans-serif; margin: 0; padding: 12px; color: #111; background: #f7fafc; font-size: 12px; }
                    h1 { margin: 0 0 8px; font-size: 20px; }
                    .header { margin-bottom: 14px; }
                    .subtitle { margin: 4px 0 0; color: #475569; font-size: 12px; }
                    .filter-summary { margin-top: 4px; color: #64748b; font-size: 11px; }
                    .question-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 14px; }
                    .question-header { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; font-size: 12px; color: #475569; }
                    .badge { display: inline-flex; align-items: center; justify-content: center; padding: 3px 8px; background: #e2e8f0; border-radius: 999px; font-size: 11px; }
                    .question-text { margin: 0 0 10px; font-size: 14px; line-height: 1.4; }
                    .options { display: grid; gap: 6px; }
                    .option { padding: 8px 10px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 13px; }
                    .option.correct { border-color: #22c55e; background: #ecfdf5; }
                    .option strong { margin-right: 6px; }
                    @media print {
                        body { background: #fff; padding: 0; }
                        .question-card { break-inside: avoid; page-break-inside: avoid; margin-bottom: 12px; }
                        h1 { font-size: 18px; }
                        .subtitle, .filter-summary, .question-header { color: #334155; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Preguntas filtradas</h1>
                    <p class="subtitle">Se imprimirán las preguntas visibles según los filtros activos.</p>
                    <p class="filter-summary">${filterSummary}</p>
                </div>
                ${visibleQuestions.length > 0 ? content : '<p>No hay preguntas visibles con el filtro actual.</p>'}
            </body>
            </html>`;

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            toast.error('Error', 'No se pudo abrir la ventana de impresión.');
            return;
        }
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.onload = () => {
            printWindow.print();
        };
    };

    // ─── Render ──────────────────────────────────────────────────────────────

    const questionCount = filteredQuestions.length;

    return (
        <AdminLayout title="Gestión de Preguntas">
            <div className={styles.pageWrapper}>
                <main className={styles.main}>

                    <div className={styles.wrapper}>

                        {/* Filtros y Acciones */}
                        <div className={styles.filtersRow}>
                            <div className={styles.filters}>
                                <div className={styles.searchBox}>
                                    <Search size={18} className={styles.searchIcon} />
                                    <input
                                        type="text"
                                        placeholder="BUSCAR"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={styles.searchInput}
                                        aria-label="Buscar pregunta"
                                    />
                                    {searchTerm && (
                                        <button
                                            className={styles.clearBtn}
                                            onClick={() => setSearchTerm('')}
                                            aria-label="Limpiar búsqueda"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                                <Select
                                    value={selectedDept}
                                    onChange={(value) => setSelectedDept(value)}
                                    options={[
                                        { value: 'Todos', label: 'DEPARTAMENTOS' },
                                        ...DEPARTMENTS.map(dept => ({ value: dept, label: dept.toUpperCase() })),
                                    ]}
                                    className={styles.filterSelect}
                                    aria-label="Filtrar por departamento"
                                />
                                <Select
                                    value={selectedTheme}
                                    onChange={(value) => setSelectedTheme(value)}
                                    options={uniqueThemes.map(theme => ({ value: theme, label: theme === 'Todos' ? 'TEMAS' : theme }))}
                                    className={styles.filterSelect}
                                    aria-label="Filtrar por tema"
                                />
                            </div>

                            <div className={styles.headerActions}>
                                <Button
                                    variant="outline"
                                    onClick={handlePrintQuestions}
                                    title={`Imprimir ${questionCount} pregunta${questionCount !== 1 ? 's' : ''} visibles`}
                                >
                                    <Printer size={18} style={{ marginRight: 8 }} />
                                    Imprimir
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleDownloadExcel}
                                    title={`Descargar ${questionCount} pregunta${questionCount !== 1 ? 's' : ''} visibles en Excel`}
                                >
                                    <Download size={18} style={{ marginRight: 8 }} />
                                    Excel
                                </Button>
                                <Button onClick={handleCreateClick}>
                                    <Plus size={18} style={{ marginRight: 8 }} />
                                    Nueva Pregunta
                                </Button>
                            </div>
                        </div>

                        {/* Status */}
                        <div className={styles.statusRow}>
                            {loading && (
                                <p className={styles.statusText}>
                                    <span className={styles.spinner} /> Cargando preguntas...
                                </p>
                            )}

                            {!loading && questionCount === 0 && (
                                <p className={styles.statusText}>Sin resultados para esta búsqueda.</p>
                            )}
                        </div>

                        {/* Lista de preguntas */}
                        <div className={styles.resultsList}>
                            {filteredQuestions.map(q => (
                                <div key={q.id} className={styles.card}>
                                    <div className={styles.cardActions}>
                                        <button
                                            onClick={() => handleEditClick(q)}
                                            className={`${styles.actionBtn} ${styles.editBtn}`}
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(q.id)}
                                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className={styles.cardMeta}>
                                        <span className={styles.idBadge}>#{q.id.substring(0, 6)}</span>
                                        <span className={styles.deptBadge}>{q.department || 'Producción'}</span>
                                        {q.theme && <span className={styles.temaBadge}>{q.theme}</span>}
                                        {q.isFixed && <span className={styles.fixedBadge}>★ Fija</span>}
                                    </div>

                                    <p className={styles.preguntaText}>{q.question}</p>

                                    <div className={styles.opciones}>
                                        {VALID_ANSWERS.map(l => {
                                            const texto = q.options?.[l];
                                            if (!texto) return null;
                                            const esCorrecta = q.correctAnswer?.toLowerCase() === l;
                                            return (
                                                <div
                                                    key={l}
                                                    className={`${styles.opcion} ${esCorrecta ? styles.opcionCorrecta : ''}`}
                                                >
                                                    <span className={styles.opcionLetra}>{l})</span>
                                                    <span className={styles.opcionTexto}>{texto}</span>
                                                    {esCorrecta && <span className={styles.checkmark}>✓</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal Crear / Editar */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogHeader>
                    <div className={styles.dialogHeaderInner}>
                        <div>
                            <DialogTitle>
                                {editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingQuestion
                                    ? 'Modifica los detalles de la pregunta seleccionada.'
                                    : 'Añade una nueva pregunta al banco de conocimientos.'}
                            </DialogDescription>
                        </div>
                        <DialogClose onClose={() => setIsModalOpen(false)} />
                    </div>
                </DialogHeader>

                <DialogBody>
                    <form id="question-form" onSubmit={handleSaveForm}>

                        <div className={styles.formGroup}>
                            <label>Departamento</label>
                            <Select
                                value={formData.department}
                                onChange={value => setFormData({ ...formData, department: value })}
                                options={DEPARTMENTS.map(dept => ({ value: dept, label: dept }))}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Tema / Categoría</label>
                            <input
                                className={styles.input}
                                value={formData.theme}
                                onChange={e => setFormData({ ...formData, theme: e.target.value })}
                                placeholder="Ej. Seguridad, Criterio de Aceptación..."
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Pregunta</label>
                            <textarea
                                className={styles.textarea}
                                value={formData.question}
                                onChange={e => setFormData({ ...formData, question: e.target.value })}
                                placeholder="Escribe la pregunta analítica o teórica..."
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.fixedCheckboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={formData.isFixed}
                                    onChange={e => setFormData({ ...formData, isFixed: e.target.checked })}
                                />
                                <span className={styles.fixedLabelText}>Pregunta Fija (Indispensable)</span>
                            </label>
                            <span className={styles.fixedHint}>
                                Aparecerá siempre en el examen de este departamento.
                            </span>
                        </div>

                        <div className={styles.optionsGrid}>
                            <div className={`${styles.formGroup} ${styles.optionsHeaderGroup}`}>
                                <label className={styles.optionsSectionLabel}>
                                    Configuración de Respuestas
                                </label>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Inciso A (Obligatorio)</label>
                                <input
                                    className={styles.input}
                                    value={formData.options.a}
                                    onChange={e => setFormData({ ...formData, options: { ...formData.options, a: e.target.value } })}
                                    placeholder="Texto para la opción A..."
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Inciso B (Obligatorio)</label>
                                <input
                                    className={styles.input}
                                    value={formData.options.b}
                                    onChange={e => setFormData({ ...formData, options: { ...formData.options, b: e.target.value } })}
                                    placeholder="Texto para la opción B..."
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Inciso C (Opcional)</label>
                                <input
                                    className={styles.input}
                                    value={formData.options.c}
                                    onChange={e => setFormData({ ...formData, options: { ...formData.options, c: e.target.value } })}
                                    placeholder="Texto opcional..."
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Respuesta Correcta</label>
                                <Select
                                    value={formData.correctAnswer}
                                    onChange={value => setFormData({ ...formData, correctAnswer: value })}
                                    options={[
                                        { value: 'a', label: 'Opción A' },
                                        { value: 'b', label: 'Opción B' },
                                        { value: 'c', label: 'Opción C (si aplica)' },
                                    ]}
                                />
                            </div>
                        </div>

                    </form>
                </DialogBody>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="question-form" disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar Pregunta'}
                    </Button>
                </DialogFooter>
            </Dialog>

            {confirmDialog}
        </AdminLayout>
    );
}
