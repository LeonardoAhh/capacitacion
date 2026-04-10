'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast/Toast';
import { Suspense } from 'react';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import CourseWizardModal from '@/components/features/Courses/CourseWizardModal';
import CoursePlayer from '@/components/features/Courses/CoursePlayer';
import KanbanCoursesView from '@/components/features/Induccion/views/KanbanCoursesView';
import { useConfirm } from '@/hooks/useConfirm';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import {
    importCourseFromJSON,
    getAllCourses,
    getCourseWithSlides,
    deleteCourse,
    togglePublish,
    renameCourse,
    createCourseFromWizard,
    updateCourseFields,
    syncCoursePuestosFromPositions,
} from '@/lib/courseService';
import { logInduccionAction } from '@/lib/induccionAudit';
import styles from './page.module.css';


function ImportCourseModal({ courses, onConfirm, onCancel }) {
    const [items, setItems] = useState(() => courses.map(c => ({ ...c })));
    const isSingle = items.length === 1;

    const setTitle = (i, val) =>
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, titleOverride: val } : item));

    const allValid = items.every(i => i.titleOverride.trim().length > 0);

    const slidesSummary = (item) => {
        const total = item.slides.length;
        const dynamics = item.slides.filter(s => s.type === 'group_dynamic' || s.type === 'dynamic').length;
        const quizzes = item.slides.filter(s => s.type === 'group_quiz' || s.type === 'quiz').length;
        const parts = [`${total} slide${total !== 1 ? 's' : ''}`];
        if (dynamics > 0) parts.push(`${dynamics} dinámica${dynamics !== 1 ? 's' : ''}`);
        if (quizzes > 0) parts.push(`${quizzes} quiz${quizzes !== 1 ? 'zes' : ''}`);
        if (item.courseData.category) parts.push(item.courseData.category);
        return parts.join(' · ');
    };

    return (
        <Dialog open onOpenChange={open => !open && onCancel()} aria-labelledby="import-modal-title">
            <DialogHeader>
                <DialogTitle id="import-modal-title">
                    {isSingle ? 'Importar Curso' : `Importar ${items.length} Cursos`}
                </DialogTitle>
                <DialogClose onClose={onCancel} />
            </DialogHeader>
            <DialogBody>
                {items.map((item, i) => (
                    <div key={i} className={styles.importItem}>
                        {!isSingle && (
                            <p className={styles.importItemIndex}>Curso {i + 1}</p>
                        )}
                        <div className={styles.importField}>
                            <label htmlFor={`import-title-${i}`}>Nombre del curso</label>
                            <input
                                id={`import-title-${i}`}
                                type="text"
                                value={item.titleOverride}
                                onChange={e => setTitle(i, e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && allValid) onConfirm(items); }}
                                placeholder="Ej. Seguridad e Higiene Industrial"
                                autoFocus={i === 0}
                                className={styles.importInput}
                            />
                        </div>
                        <p className={styles.importPreviewText}>
                            {slidesSummary(item)}
                        </p>
                    </div>
                ))}
            </DialogBody>
            <DialogFooter>
                <button className={styles.importCancelBtn} onClick={onCancel} type="button">
                    Cancelar
                </button>
                <button
                    className={styles.importConfirmBtn}
                    onClick={() => onConfirm(items)}
                    disabled={!allValid}
                    type="button"
                >
                    Importar
                </button>
            </DialogFooter>
        </Dialog>
    );
}

function InduccionContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { showConfirm, confirmDialog } = useConfirm();
    const fileInputRef = useRef(null);

    const [nativeCourses, setNativeCourses] = useState([]);
    const [nativeLoading, setNativeLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [importModal, setImportModal] = useState(null); // null | Array<{courseData, slides, titleOverride}>
    const [creatingCourse, setCreatingCourse] = useState(false);
    const [showNewCourseModal, setShowNewCourseModal] = useState(false);
    const [updatingNative, setUpdatingNative] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [playerData, setPlayerData] = useState(null);
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [includeDynamics, setIncludeDynamics] = useState(true);
    const [includeQuizzes, setIncludeQuizzes] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const canEdit = user?.rol === 'super_admin' || user?.rol === 'instructor';

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    const loadCourses = useCallback(async () => {
        setNativeLoading(true);
        const result = await getAllCourses();
        if (result.success) setNativeCourses(result.data);
        setNativeLoading(false);
    }, []);

    useEffect(() => { loadCourses(); }, [loadCourses]);

    // ── Cursos interactivos ──

    const handlePlayNative = useCallback(async (courseId) => {
        const result = await getCourseWithSlides(courseId);
        if (result.success) setPlayerData(result.data);
        else toast.error('Error', 'No se pudo cargar el curso interactivo.');
    }, [toast]);

    // Paso 1: leer archivo y mostrar modal con vista previa
    const handleImport = useCallback(async (e) => {
        const f = e?.target?.files?.[0] ?? fileInputRef.current?.files?.[0];
        if (!f) return;
        try {
            const text = await f.text();
            const jsonData = JSON.parse(text);
            const rawCourses = jsonData.courses || [jsonData];
            const parsed = rawCourses.map(item => {
                const { slides: rawSlides, ...courseData } = item;
                return {
                    courseData,
                    slides: rawSlides || [],
                    titleOverride: item.title || '',
                };
            });
            setImportModal(parsed);
        } catch (err) {
            toast.error('Error', `JSON inválido: ${err.message}`);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [toast]);

    // Paso 2: importar con los datos confirmados por el usuario
    const handleConfirmImport = useCallback(async (coursesWithOverrides) => {
        setImportModal(null);
        setImporting(true);
        let successCount = 0;
        let errorMsg = '';
        for (const { courseData, slides, titleOverride } of coursesWithOverrides) {
            const filteredSlides = slides.filter(slide => {
                if ((slide.type === 'group_dynamic' || slide.type === 'dynamic') && !includeDynamics) return false;
                if ((slide.type === 'group_quiz' || slide.type === 'quiz') && !includeQuizzes) return false;
                return true;
            });
            const reorderedSlides = filteredSlides.map((slide, i) => ({ ...slide, order: i + 1 }));
            const finalCourse = { ...courseData, title: titleOverride.trim() || courseData.title || 'Sin título' };
            const result = await importCourseFromJSON({ course: finalCourse, slides: reorderedSlides }, user?.uid || 'admin');
            if (result.success) successCount++;
            else errorMsg = result.error;
        }
        if (successCount > 0) {
            toast.success('Éxito', `${successCount} curso(s) importado(s).`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            await loadCourses();
        } else {
            toast.error('Error', errorMsg || 'No se pudieron importar los cursos.');
        }
        setImporting(false);
    }, [includeDynamics, includeQuizzes, loadCourses, user?.uid, toast]);

    const handleCreateNewCourse = useCallback(() => {
        setShowNewCourseModal(true);
    }, []);

    const handleConfirmNewCourse = useCallback(async (courseData, firstSlideType) => {
        setCreatingCourse(true);
        setShowNewCourseModal(false);
        const result = await createCourseFromWizard(courseData, firstSlideType, user?.uid || 'admin');
        if (result.success) {
            toast.success('Creado', 'Redirigiendo al editor...');
            logInduccionAction({ userId: user?.uid, userName: user?.name || user?.email || 'Desconocido', action: 'create', target: courseData.title });
            router.push(`/induccion/cursos/${result.courseId}/editar`);
        } else {
            toast.error('Error', result.error || 'No se pudo crear el curso.');
            setCreatingCourse(false);
        }
    }, [user?.uid, user?.name, user?.email, toast, router]);

    const handleTogglePublish = useCallback(async (courseId, currentPublished) => {
        const course = nativeCourses.find(c => c.id === courseId);
        const willPublish = !currentPublished;
        const result = await togglePublish(courseId, willPublish);
        if (result.success) {
            toast.success('Actualizado', `Curso ${willPublish ? 'publicado' : 'despublicado'}.`);
            if (willPublish) {
                // Auto-sync puestosAplicables desde positions al publicar
                syncCoursePuestosFromPositions(courseId);
            }
            await loadCourses();
            logInduccionAction({ userId: user?.uid, userName: user?.name || user?.email || 'Desconocido', action: willPublish ? 'publish' : 'unpublish', target: course?.title || courseId });
        } else toast.error('Error', result.error);
    }, [toast, loadCourses, nativeCourses, user?.uid, user?.name, user?.email]);

    const handleDeleteNative = useCallback(async (e, courseId) => {
        e.stopPropagation();
        if (!await showConfirm('¿Eliminar este curso y todos sus slides?', { title: 'Eliminar Curso', confirmLabel: 'Eliminar' })) return;
        const course = nativeCourses.find(c => c.id === courseId);
        const result = await deleteCourse(courseId);
        if (result.success) {
            toast.success('Eliminado', 'Curso eliminado.');
            await loadCourses();
            logInduccionAction({ userId: user?.uid, userName: user?.name || user?.email || 'Desconocido', action: 'delete', target: course?.title || courseId });
        } else toast.error('Error', result.error);
    }, [toast, loadCourses, nativeCourses, user?.uid, user?.name, user?.email, showConfirm]);

    const handleStartRename = useCallback((e, course) => {
        e.stopPropagation();
        setRenamingId(course.id);
        setRenameValue(course.title);
    }, []);

    const handleConfirmRename = useCallback(async (courseId) => {
        const trimmed = renameValue.trim();
        if (!trimmed) { setRenamingId(null); return; }
        const prev = nativeCourses.find(c => c.id === courseId);
        const result = await renameCourse(courseId, trimmed);
        if (result.success) {
            toast.success('Renombrado', 'Nombre actualizado.');
            await loadCourses();
            logInduccionAction({ userId: user?.uid, userName: user?.name || user?.email || 'Desconocido', action: 'rename', target: trimmed, detail: `Antes: "${prev?.title || courseId}"` });
        } else toast.error('Error', result.error);
        setRenamingId(null);
    }, [renameValue, toast, loadCourses, nativeCourses, user?.uid, user?.name, user?.email]);

    const handleRenameKeyDown = useCallback((e, courseId) => {
        if (e.key === 'Enter') handleConfirmRename(courseId);
        if (e.key === 'Escape') setRenamingId(null);
    }, [handleConfirmRename]);



    const handleSyncAllPuestos = useCallback(async () => {
        setSyncing(true);
        const result = await syncCoursePuestosFromPositions();
        if (result.success) {
            toast.success('Sincronizado', `${result.updatedCount} curso(s) actualizados con sus puestos.`);
            await loadCourses();
        } else {
            toast.error('Error', result.error || 'No se pudo sincronizar.');
        }
        setSyncing(false);
    }, [toast, loadCourses]);

    const handleUpdateNative = useCallback(async (courseId, { contenidoUrl, candidateView, puestosAplicables }) => {
        setUpdatingNative(true);
        const result = await updateCourseFields(courseId, { contenidoUrl, candidateView, puestosAplicables });
        if (result.success) {
            toast.success('Actualizado', 'Curso actualizado.');
            await loadCourses();
        } else {
            toast.error('Error', result.error);
        }
        setUpdatingNative(false);
        return result.success;
    }, [toast, loadCourses]);



    // ── Guards ──

    if (authLoading || !user) {
        return (
            <div className={styles.main}>
                <div className={styles.loadingCenter}><div className="spinner" /></div>
            </div>
        );
    }

    if (playerData) {
        return (
            <CoursePlayer
                course={playerData.course}
                slides={playerData.slides}
                onClose={() => setPlayerData(null)}
            />
        );
    }

    // ── Filtros y ordenamiento alfabético ──
    const q = searchQuery.toLowerCase().trim();
    const allCourses = nativeCourses
        .filter(c => !c.tipo || c.tipo !== 'link')
        .sort((a, b) => (a.title || '').localeCompare(b.title || '', 'es', { sensitivity: 'base' }));
    const publishedCourses = allCourses.filter(c => c.published && c.title?.toLowerCase().includes(q));
    const draftCourses = allCourses.filter(c => !c.published && c.title?.toLowerCase().includes(q));

    return (
        <AdminLayout title="Presentaciones Cursos">
            <div className={styles.main}>
                <div className={styles.container}>
                    <main className={styles.contentArea} id="main-content">
                        <KanbanCoursesView
                            canEdit={canEdit}
                            nativeCourses={allCourses}
                            nativeLoading={nativeLoading}
                            publishedCourses={publishedCourses}
                            draftCourses={draftCourses}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            includeDynamics={includeDynamics}
                            setIncludeDynamics={setIncludeDynamics}
                            includeQuizzes={includeQuizzes}
                            setIncludeQuizzes={setIncludeQuizzes}
                            importing={importing}
                            handleImport={handleImport}
                            creatingCourse={creatingCourse}
                            handleCreateNewCourse={handleCreateNewCourse}
                            renamingId={renamingId}
                            renameValue={renameValue}
                            setRenameValue={setRenameValue}
                            handleStartRename={handleStartRename}
                            handleConfirmRename={handleConfirmRename}
                            handleRenameKeyDown={handleRenameKeyDown}
                            handleTogglePublish={handleTogglePublish}
                            handlePlayNative={handlePlayNative}
                            handleDeleteNative={handleDeleteNative}
                            fileInputRef={fileInputRef}
                            onUpdateNative={handleUpdateNative}
                            updatingNative={updatingNative}
                            onSyncAllPuestos={handleSyncAllPuestos}
                            syncing={syncing}
                        />
                    </main>
                </div>

                {showNewCourseModal && (
                    <CourseWizardModal
                        onComplete={handleConfirmNewCourse}
                        onCancel={() => setShowNewCourseModal(false)}
                    />
                )}

                {importModal && (
                    <ImportCourseModal
                        courses={importModal}
                        onConfirm={handleConfirmImport}
                        onCancel={() => {
                            setImportModal(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                    />
                )}

                {confirmDialog}
            </div>
        </AdminLayout>
    );
}

export default function InductionPage() {
    return (
        <Suspense fallback={<div className={styles.main}><div className={styles.loadingCenter}><div className="spinner" /></div></div>}>
            <InduccionContent />
        </Suspense>
    );
}
