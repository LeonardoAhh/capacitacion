'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Search, Plus, Edit2, Trash2, ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import * as XLSX from 'xlsx';
import { useToast } from '@/components/ui/Toast/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { Dialog, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription, DialogBody } from '@/components/ui/Dialog/Dialog';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import Link from 'next/link';

import styles from './gestionar.module.css';

export default function GestionarPreguntasPage() {
    const { toast } = useToast();
    const { showConfirm, confirmDialog } = useConfirm();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('Todos');
    const [selectedType, setSelectedType] = useState('Todos');
    const [selectedTheme, setSelectedTheme] = useState('Todos');

    // Estado del Formulario Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null); // null = Crear nueva
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState(initialFormState());

    function initialFormState() {
        return {
            theme: '',
            department: 'Producción',
            type: 'Múltiple', // 'Múltiple' or 'Abierta'
            question: '',
            options: { a: '', b: '', c: '' },
            correctAnswer: 'a', // 'a', 'b', 'c' (o vacio si es abierta)
            isFixed: false
        };
    }

    const loadQuestions = useCallback(async () => {
        setLoading(true);
        try {
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
        loadQuestions();
    }, [loadQuestions]);

    const uniqueThemes = useMemo(() => {
        const themes = questions.map(q => q.theme || q.TEMA || 'General');
        return ['Todos', ...new Set(themes)].sort();
    }, [questions]);

    const filteredQuestions = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        return questions.filter(item => {
            const matchesDept = selectedDept === 'Todos' || (item.department || 'Producción') === selectedDept;
            const matchesType = selectedType === 'Todos' || item.type === selectedType;
            const themeValue = item.theme || item.TEMA || 'General';
            const matchesTheme = selectedTheme === 'Todos' || themeValue === selectedTheme;
            const matchesSearch = !q ||
                item.question?.toLowerCase().includes(q) ||
                themeValue.toLowerCase().includes(q) ||
                item.id.toLowerCase().includes(q);
            return matchesDept && matchesType && matchesTheme && matchesSearch;
        });
    }, [questions, searchTerm, selectedDept, selectedType, selectedTheme]);

    const handleCreateClick = () => {
        setFormData(initialFormState());
        setEditingQuestion(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (q) => {
        setFormData({
            theme: q.theme || '',
            department: q.department || 'Producción',
            type: q.type || 'Múltiple',
            question: q.question || '',
            options: {
                a: q.options?.a || '',
                b: q.options?.b || '',
                c: q.options?.c || ''
            },
            correctAnswer: q.correctAnswer || '',
            isFixed: q.isFixed || false
        });
        setEditingQuestion(q);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (id) => {
        if (!await showConfirm("¿Seguro que deseas eliminar esta pregunta?", { title: 'Eliminar Pregunta', confirmLabel: 'Eliminar' })) return;

        try {
            await deleteDoc(doc(db, 'exam_questions', id));
            setQuestions(prev => prev.filter(q => q.id !== id));
            toast.success("Eliminado", "Pregunta eliminada correctamente.");
        } catch (error) {
            console.error("Error deleting", error);
            toast.error("Error", "No se pudo eliminar.");
        }
    };

    const handleSaveForm = async (e) => {
        e.preventDefault();

        if (!formData.question.trim()) {
            toast.error("Error", "La pregunta es obligatoria.");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                theme: formData.theme,
                department: formData.department,
                type: formData.type,
                question: formData.question,
                options: formData.type === 'Múltiple' ? formData.options : null,
                correctAnswer: formData.correctAnswer,
                isFixed: formData.isFixed,
                updatedAt: serverTimestamp()
            };

            if (editingQuestion?.id) {
                // Update
                await updateDoc(doc(db, 'exam_questions', editingQuestion.id), payload);
                setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? { ...q, ...payload } : q));
                toast.success("Actualizado", "Pregunta actualizada.");
            } else {
                // Create
                const ref = await addDoc(collection(db, 'exam_questions'), {
                    ...payload,
                    createdAt: serverTimestamp()
                });
                setQuestions(prev => [...prev, { id: ref.id, ...payload }]);
                toast.success("Creado", "Pregunta creada satisfactoriamente.");
            }
            setIsModalOpen(false);

        } catch (error) {
            console.error("Error saving", error);
            toast.error("Error", "No se pudo guardar la pregunta.");
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadExcel = () => {
        try {
            const dataToExport = questions.map(q => ({
                'ID': q.id.slice(-6).toUpperCase(),
                'Departamento': q.department || 'N/A',
                'Tema': q.theme || 'N/A',
                'Tipo': q.type || 'N/A',
                'Pregunta': q.question || '',
                'Opción A': q.options?.a || '',
                'Opción B': q.options?.b || '',
                'Opción C': q.options?.c || '',
                'Respuesta Correcta': q.correctAnswer || ''
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Preguntas");

            // Generar nombre de archivo con fecha
            const fileName = `Banco_Preguntas_VTX_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(workbook, fileName);

            toast.success("Descarga iniciada", "El archivo Excel se está generando.");
        } catch (error) {
            console.error("Download error:", error);
            toast.error("Error", "No se pudo generar el archivo Excel.");
        }
    };

    return (
        <AdminLayout title="Gestión de Preguntas">
            <div className={styles.pageWrapper}>
                <main className={styles.main}>
                    <div className={styles.pageHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Link href="/capacitacion/examen" className={styles.backIconBtn} title="Volver al Generador">
                                <ArrowLeft size={24} />
                            </Link>
                            <div>
                                <h1 className={styles.pageTitle}>Gestión de Preguntas</h1>
                                <p className={styles.pageSubtitle}>
                                    Administra el banco de preguntas para los exámenes de capacitación.
                                </p>
                            </div>
                        </div>
                        <div className={styles.headerActions}>
                            <Button variant="outline" onClick={handleDownloadExcel} title="Descargar todas las preguntas en Excel">
                                <Download size={18} style={{ marginRight: 8 }} />
                                Descargar Excel
                            </Button>
                            <Button onClick={handleCreateClick}>
                                <Plus size={18} style={{ marginRight: 8 }} />
                                Nueva Pregunta
                            </Button>
                        </div>
                    </div>

                    <div className={styles.wrapper}>
                        <div className={styles.filtersRow}>
                            <div className={styles.searchBox}>
                                <Search size={18} className={styles.searchIcon} />
                                <input
                                    type="text"
                                    placeholder="BUSCAR"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={styles.searchInput}
                                />
                                {searchTerm && (
                                    <button className={styles.clearBtn} onClick={() => setSearchTerm('')}>✕</button>
                                )}
                            </div>
                            <select
                                className={styles.selectDept}
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                            >
                                <option value="Todos">DEPARTAMENTOS</option>
                                <option value="Producción">PRODUCCIÓN</option>
                                <option value="Calidad">CALIDAD</option>
                                <option value="Moldes">MOLDES</option>
                                <option value="Recursos Humanos">RECURSOS HUMANOS</option>
                            </select>

                            <select
                                className={styles.selectType}
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                            >
                                <option value="Todos">TIPOS</option>
                                <option value="Múltiple">MÚLTIPLE</option>
                                <option value="Abierta">ABIERTA</option>
                            </select>

                            <select
                                className={styles.selectTheme}
                                value={selectedTheme}
                                onChange={(e) => setSelectedTheme(e.target.value)}
                            >
                                {uniqueThemes.map(theme => (
                                    <option key={theme} value={theme}>
                                        {theme === 'Todos' ? 'TEMAS' : theme}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.statusRow}>
                            {loading && (
                                <p className={styles.statusText}>
                                    <span className={styles.spinner} /> Cargando preguntas...
                                </p>
                            )}
                            {!loading && filteredQuestions.length > 0 && (
                                <p className={styles.statusText}>
                                    📚 {filteredQuestions.length} pregunta{filteredQuestions.length !== 1 ? 's' : ''} disponible{filteredQuestions.length !== 1 ? 's' : ''}.
                                </p>
                            )}
                            {!loading && filteredQuestions.length === 0 && (
                                <p className={styles.statusText}>
                                    Sin resultados para esta búsqueda.
                                </p>
                            )}
                        </div>

                        <div className={styles.resultsList}>
                            {filteredQuestions.map(q => (
                                <div key={q.id} className={styles.card}>
                                    <div className={styles.cardActions}>
                                        <button onClick={() => handleEditClick(q)} className={`${styles.actionBtn} ${styles.editBtn}`} title="Editar">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteClick(q.id)} className={`${styles.actionBtn} ${styles.deleteBtn}`} title="Eliminar">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className={styles.cardMeta}>
                                        <span className={styles.idBadge}>#{q.id.substring(0, 6)}</span>
                                        <span className={styles.deptBadge}>{q.department || 'Producción'}</span>
                                        {q.theme && <span className={styles.temaBadge}>{q.theme}</span>}
                                        <span className={`${styles.tipoBadge} ${q.type === 'Múltiple' ? styles.tipoMultiple : styles.tipoAbierta}`}>
                                            {q.type}
                                        </span>
                                        {q.isFixed && <span className={styles.fixedBadge}>★ Fija</span>}
                                    </div>

                                    <p className={styles.preguntaText}>{q.question}</p>

                                    {q.type === 'Múltiple' ? (
                                        <div className={styles.opciones}>
                                            {['a', 'b', 'c'].map(l => {
                                                const texto = q.options?.[l];
                                                if (!texto) return null;
                                                const esCorrecta = q.correctAnswer === l;
                                                return (
                                                    <div key={l} className={`${styles.opcion} ${esCorrecta ? styles.opcionCorrecta : ''}`}>
                                                        <span className={styles.opcionLetra}>{l})</span>
                                                        <span className={styles.opcionTexto}>{texto}</span>
                                                        {esCorrecta && <span className={styles.checkmark}>✓</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className={styles.respuestaAbierta}>
                                            <span className={styles.respuestaLabel}>Formato:</span>
                                            <span className={styles.respuestaTexto}>Pregunta Abierta (El evaluador revisará la respuesta escrita).</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            {/* Modal de Creación / Edición */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogHeader>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <DialogTitle>{editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}</DialogTitle>
                            <DialogDescription>
                                {editingQuestion ? 'Modifica los detalles de la pregunta seleccionada.' : 'Añade una nueva pregunta al banco de conocimientos.'}
                            </DialogDescription>
                        </div>
                        <DialogClose onClose={() => setIsModalOpen(false)} />
                    </div>
                </DialogHeader>

                <DialogBody>
                    <form id="question-form" onSubmit={handleSaveForm}>
                        <div className={styles.formGroup}>
                            <label>Departamento</label>
                            <select
                                className={styles.select}
                                value={formData.department}
                                onChange={e => setFormData({ ...formData, department: e.target.value })}
                            >
                                <option value="Producción">Producción</option>
                                <option value="Calidad">Calidad</option>
                                <option value="Moldes">Moldes</option>
                                <option value="Recursos Humanos">Recursos Humanos</option>
                            </select>
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
                            <label>Tipo de Pregunta</label>
                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                                <label className={styles.checkboxWrap}>
                                    <input
                                        type="radio"
                                        name="questionType"
                                        checked={formData.type === 'Múltiple'}
                                        onChange={() => setFormData({ ...formData, type: 'Múltiple' })}
                                    />
                                    <span>Opción Múltiple</span>
                                </label>
                                <label className={styles.checkboxWrap}>
                                    <input
                                        type="radio"
                                        name="questionType"
                                        checked={formData.type === 'Abierta'}
                                        onChange={() => setFormData({ ...formData, type: 'Abierta' })}
                                    />
                                    <span>Abierta</span>
                                </label>
                            </div>
                        </div>

                        <div className={styles.formGroup} style={{ marginTop: '0.5rem' }}>
                            <label className={styles.checkboxWrap} style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.isFixed}
                                    onChange={e => setFormData({ ...formData, isFixed: e.target.checked })}
                                />
                                <span style={{ fontWeight: 600, color: '#92400e' }}>Pregunta Fija (Indispensable)</span>
                            </label>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', paddingLeft: '2.5rem', marginTop: '-0.25rem' }}>
                                Aparecerá siempre en el examen de este departamento.
                            </span>
                        </div>

                        {formData.type === 'Múltiple' ? (
                            <div className={styles.optionsGrid} style={{ marginTop: '1rem' }}>
                                <div className={styles.formGroup} style={{ gridColumn: '1 / -1', marginBottom: '0.5rem' }}>
                                    <label style={{ color: 'var(--color-primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Configuración de Respuestas</label>
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
                                    <select
                                        className={styles.select}
                                        value={formData.correctAnswer}
                                        onChange={e => setFormData({ ...formData, correctAnswer: e.target.value })}
                                        style={{ border: '1.5px solid #16a34a', background: '#f0fdf4' }}
                                    >
                                        <option value="a">Opción A</option>
                                        <option value="b">Opción B</option>
                                        <option value="c">Opción C (si aplica)</option>
                                    </select>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                <label style={{ color: 'var(--color-primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Respuesta de Guía</label>
                                <textarea
                                    className={styles.textarea}
                                    value={formData.correctAnswer}
                                    onChange={e => setFormData({ ...formData, correctAnswer: e.target.value })}
                                    placeholder="Escribe la respuesta correcta o los puntos clave que el evaluador debe buscar..."
                                    style={{ border: '1.5px solid #16a34a', background: '#f0fdf4' }}
                                    required
                                />
                            </div>
                        )}
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
