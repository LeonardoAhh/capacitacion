'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { motion, AnimatePresence } from 'framer-motion';
import { FilePlus, Edit, Trash2, CheckCircle, Clock, ArrowLeft, BookOpen } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast/Toast';
import ExamBuilder from '@/components/features/ExamBuilder/ExamBuilder';
import {
    getAllExams,
    createExam,
    updateExam,
    deleteExam,
    publishExam,
} from '@/lib/examService';
import styles from './page.module.css';

// Roles con acceso completo a esta página
const ALLOWED_ROLES = ['super_admin', 'admin', 'instructor', 'Instructor'];


export default function PrototipoPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const router = useRouter();

    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // null = vista lista | undefined = examen nuevo | objeto = examen a editar
    const [editingExam, setEditingExam] = useState(null);

    // Guard de acceso: solo roles permitidos
    useEffect(() => {
        if (!user) return;
        if (!ALLOWED_ROLES.includes(user.rol)) {
            router.replace('/dashboard');
        }
    }, [user, router]);

    // Carga todos los exámenes desde Firebase
    const loadExams = useCallback(async () => {
        setLoading(true);
        const data = await getAllExams();
        setExams(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadExams(); }, [loadExams]);

    // Guarda el examen como borrador (crea o actualiza según si tiene ID)
    const handleSave = async (examData) => {
        setSaving(true);
        try {
            if (editingExam?.id) {
                await updateExam(editingExam.id, examData);
                setEditingExam(prev => ({ ...prev, ...examData }));
                showToast('Borrador guardado correctamente', 'success');
            } else {
                const result = await createExam(examData, user?.uid);
                if (result.success) {
                    setEditingExam({ id: result.examId, ...examData });
                    showToast('Examen creado como borrador', 'success');
                }
            }
            await loadExams();
        } catch {
            showToast('Error al guardar el examen', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Publica el examen (guarda + cambia status a "published")
    const handlePublish = async (examData) => {
        setSaving(true);
        try {
            let examId = editingExam?.id;
            if (examId) {
                await updateExam(examId, examData);
            } else {
                const result = await createExam(examData, user?.uid);
                if (!result.success) throw new Error(result.error);
                examId = result.examId;
            }
            await publishExam(examId);
            showToast('Examen publicado correctamente', 'success');
            await loadExams();
            setEditingExam(null);
        } catch {
            showToast('Error al publicar el examen', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Elimina un examen con confirmación
    const handleDelete = async (examId) => {
        if (!window.confirm('¿Seguro que quieres eliminar este examen? Esta acción no se puede deshacer.')) return;
        await deleteExam(examId);
        showToast('Examen eliminado', 'success');
        await loadExams();
    };

    // ── VISTA EDITOR ────────────────────────────────────────────────────
    if (editingExam !== null) {
        return (
            <AdminLayout title={editingExam?.id ? 'Editar Examen' : 'Nuevo Examen'}>
                <div className={styles.container}>
                    <div className={styles.editorHeader}>
                        <button
                            className={styles.btnBack}
                            onClick={() => setEditingExam(null)}
                        >
                            <ArrowLeft size={16} /> Volver a la lista
                        </button>
                        <div>
                            <h1 className={styles.pageTitle}>
                                {editingExam?.id ? 'Editar Examen' : 'Nuevo Examen'}
                            </h1>
                            {editingExam?.id && (
                                <p className={styles.pageSubtitle}>ID: {editingExam.id}</p>
                            )}
                        </div>
                    </div>
                    <ExamBuilder
                        initial={editingExam || null}
                        onSave={handleSave}
                        onPublish={handlePublish}
                        saving={saving}
                    />
                </div>
            </AdminLayout>
        );
    }

    // ── VISTA LISTA ─────────────────────────────────────────────────────
    return (
        <AdminLayout title="Banco de Exámenes">
            <div className={styles.container}>
                {/* Encabezado */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.pageTitle}>Banco de Exámenes</h1>
                        <p className={styles.pageSubtitle}>
                            Crea y administra exámenes auditables para tus cursos
                        </p>
                    </div>
                    <button
                        className={styles.btnNew}
                        onClick={() => setEditingExam(undefined)}
                    >
                        <FilePlus size={16} /> Nuevo examen
                    </button>
                </div>

                {/* Contenido */}
                {loading ? (
                    <div className={styles.loadingGrid}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className={styles.skeletonCard} />
                        ))}
                    </div>
                ) : exams.length === 0 ? (
                    <div className={styles.emptyState}>
                        <BookOpen size={40} strokeWidth={1.2} />
                        <p>No hay exámenes creados aún.</p>
                        <button
                            className={styles.btnNew}
                            onClick={() => setEditingExam(undefined)}
                        >
                            <FilePlus size={16} /> Crear el primero
                        </button>
                    </div>
                ) : (
                    <div className={styles.examGrid}>
                        <AnimatePresence mode="popLayout">
                            {exams.map(exam => (
                                <motion.div
                                    key={exam.id}
                                    className={styles.examCard}
                                    layout
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                >
                                    {/* Fila superior con estado y doc ID */}
                                    <div className={styles.examCardTop}>
                                        <span className={`${styles.statusBadge} ${exam.status === 'published' ? styles.statusPublished : styles.statusDraft}`}>
                                            {exam.status === 'published'
                                                ? <><CheckCircle size={12} /> Publicado</>
                                                : <><Clock size={12} /> Borrador</>
                                            }
                                        </span>
                                        <span className={styles.examDocId}>
                                            {exam.documentId || '—'} {exam.revision ? `· ${exam.revision}` : ''}
                                        </span>
                                    </div>

                                    {/* Título */}
                                    <h3 className={styles.examCardTitle}>
                                        {exam.title || <em>Sin título</em>}
                                    </h3>

                                    {/* Metadata */}
                                    <p className={styles.examCardMeta}>
                                        {exam.questions?.length || 0} preguntas · Mín. {exam.passingScore ?? '—'}/10
                                    </p>

                                    {/* Acciones */}
                                    <div className={styles.examCardActions}>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => setEditingExam(exam)}
                                        >
                                            <Edit size={14} /> Editar
                                        </button>
                                        <button
                                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                                            onClick={() => handleDelete(exam.id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
