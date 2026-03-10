'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilePlus, Edit, Trash2, CheckCircle, Clock, ArrowLeft, BookOpen, Copy, History, X } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast/Toast';
import ExamBuilder from '@/components/features/ExamBuilder/ExamBuilder';
import SetupWizard from '@/components/features/ExamBuilder/SetupWizard';
import {
    getAllExams,
    createExam,
    updateExam,
    deleteExam,
    publishExam,
    duplicateExam,
    saveExamSnapshot,
    getExamHistory,
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

    // null = lista | undefined = nuevo en blanco | objeto = editar
    const [editingExam, setEditingExam] = useState(null);

    // Wizard de configuración inicial
    const [showWizard, setShowWizard] = useState(false);

    // Modal de historial de versiones
    const [historyExam, setHistoryExam] = useState(null);
    const [historyVersions, setHistoryVersions] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

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

    // El wizard termina → abre el editor con los metadatos pre-llenados
    const handleWizardFinish = (data) => {
        setShowWizard(false);
        setEditingExam(data);
    };

    // Guarda el examen como borrador
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

    // Publica el examen y guarda snapshot en historial
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
            // Snapshot automático en /historial cada vez que se publica
            await saveExamSnapshot(examId, examData, user?.uid);
            showToast('Examen publicado — versión guardada en historial', 'success');
            await loadExams();
            setEditingExam(null);
        } catch {
            showToast('Error al publicar el examen', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Duplica un examen existente
    const handleDuplicate = async (exam) => {
        const result = await duplicateExam(exam, user?.uid);
        if (result.success) {
            showToast('Examen duplicado como borrador', 'success');
            await loadExams();
        } else {
            showToast('Error al duplicar', 'error');
        }
    };

    // Elimina un examen con confirmación
    const handleDelete = async (examId) => {
        if (!window.confirm('¿Seguro que quieres eliminar este examen? Esta acción no se puede deshacer.')) return;
        await deleteExam(examId);
        showToast('Examen eliminado', 'success');
        await loadExams();
    };

    // Carga y muestra el historial de versiones
    const handleViewHistory = async (exam) => {
        setHistoryExam(exam);
        setHistoryLoading(true);
        setHistoryVersions([]);
        const versions = await getExamHistory(exam.id);
        setHistoryVersions(versions);
        setHistoryLoading(false);
    };

    // ── VISTA EDITOR ─────────────────────────────────────────────────
    if (editingExam !== null) {
        return (
            <AdminLayout title={editingExam?.id ? 'Editar Examen' : 'Nuevo Examen'}>
                <div className={styles.container}>
                    <div className={styles.editorHeader}>
                        <button className={styles.btnBack} onClick={() => setEditingExam(null)}>
                            <ArrowLeft size={16} /> Volver a la lista
                        </button>
                        <div>
                            <h1 className={styles.pageTitle}>
                                {editingExam?.id ? 'Editar Examen' : 'Nuevo Examen'}
                            </h1>
                            {editingExam?.id && (
                                <p className={styles.pageSubtitle}>ID Firebase: {editingExam.id}</p>
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

    // ── VISTA LISTA ──────────────────────────────────────────────────
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
                    <button className={styles.btnNew} onClick={() => setShowWizard(true)}>
                        <FilePlus size={16} /> Nuevo examen
                    </button>
                </div>

                {/* Contenido */}
                {loading ? (
                    <div className={styles.examGrid}>
                        {[1, 2, 3].map(i => <div key={i} className={styles.skeletonCard} />)}
                    </div>
                ) : exams.length === 0 ? (
                    <div className={styles.emptyState}>
                        <BookOpen size={40} strokeWidth={1.2} />
                        <p>No hay exámenes creados aún.</p>
                        <button className={styles.btnNew} onClick={() => setShowWizard(true)}>
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

                                    <h3 className={styles.examCardTitle}>
                                        {exam.title || <em>Sin título</em>}
                                    </h3>
                                    <p className={styles.examCardMeta}>
                                        {exam.questions?.length || 0} preguntas · Mín. {exam.passingScore ?? '—'}/10
                                    </p>

                                    <div className={styles.examCardActions}>
                                        <button className={styles.actionBtn} onClick={() => setEditingExam(exam)}>
                                            <Edit size={14} /> Editar
                                        </button>
                                        <button className={styles.actionBtn} onClick={() => handleDuplicate(exam)} title="Duplicar">
                                            <Copy size={14} />
                                        </button>
                                        {exam.status === 'published' && (
                                            <button className={styles.actionBtn} onClick={() => handleViewHistory(exam)} title="Historial de versiones">
                                                <History size={14} />
                                            </button>
                                        )}
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

            {/* Setup Wizard overlay */}
            <AnimatePresence>
                {showWizard && (
                    <SetupWizard
                        onFinish={handleWizardFinish}
                        onSkip={() => { setShowWizard(false); setEditingExam(undefined); }}
                    />
                )}
            </AnimatePresence>

            {/* Modal de historial de versiones */}
            <AnimatePresence>
                {historyExam && (
                    <motion.div
                        className={styles.historyOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setHistoryExam(null)}
                    >
                        <motion.div
                            className={styles.historyPanel}
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className={styles.historyHeader}>
                                <div>
                                    <p className={styles.historyLabel}>Historial de versiones</p>
                                    <h3 className={styles.historyTitle}>{historyExam.title}</h3>
                                </div>
                                <button className={styles.historyClose} onClick={() => setHistoryExam(null)}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className={styles.historyBody}>
                                {historyLoading ? (
                                    <div className={styles.historyLoading}>Cargando historial…</div>
                                ) : historyVersions.length === 0 ? (
                                    <div className={styles.historyEmpty}>
                                        <History size={32} strokeWidth={1.2} />
                                        <p>No hay versiones guardadas aún.</p>
                                    </div>
                                ) : (
                                    <ul className={styles.versionList}>
                                        {historyVersions.map((v, i) => {
                                            const date = v.savedAt?.toDate?.() ?? null;
                                            return (
                                                <li key={v.id} className={styles.versionItem}>
                                                    <div className={styles.versionNum}>v{historyVersions.length - i}</div>
                                                    <div className={styles.versionInfo}>
                                                        <span className={styles.versionDate}>
                                                            {date
                                                                ? date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                                : 'Fecha no disponible'
                                                            }
                                                        </span>
                                                        <span className={styles.versionMeta}>
                                                            {v.questions?.length || 0} preguntas · {v.documentId} {v.revision}
                                                        </span>
                                                    </div>
                                                    <span className={styles.versionBadge}>Publicado</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminLayout>
    );
}
