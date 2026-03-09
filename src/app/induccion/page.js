'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast/Toast';
import { IconX as X, IconSearch as Search, IconZap as Zap, IconEdit as Edit3, IconLink as Link2 } from '@/lib/icons';
import { Suspense } from 'react';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import CourseWizardModal from '@/components/features/Courses/CourseWizardModal';
import CoursePlayer from '@/components/features/Courses/CoursePlayer';
import InteractiveCoursesView from '@/components/features/Induccion/views/InteractiveCoursesView';
import { useConfirm } from '@/hooks/useConfirm';
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

function InduccionContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { showConfirm, confirmDialog } = useConfirm();
    const fileInputRef = useRef(null);

    const [nativeCourses, setNativeCourses] = useState([]);
    const [nativeLoading, setNativeLoading] = useState(true);
    const [importing, setImporting] = useState(false);
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

    const handleImport = useCallback(async () => {
        const f = fileInputRef.current?.files?.[0];
        if (!f) { toast.error('Error', 'Selecciona un archivo JSON.'); return; }
        setImporting(true);
        try {
            const text = await f.text();
            const jsonData = JSON.parse(text);
            const coursesToImport = jsonData.courses || [jsonData];
            let successCount = 0;
            let errorMsg = '';
            for (const courseItem of coursesToImport) {
                const courseData = { ...courseItem };
                delete courseData.slides;
                const slidesData = courseItem.slides || [];
                const filteredSlides = slidesData.filter(slide => {
                    if ((slide.type === 'group_dynamic' || slide.type === 'dynamic') && !includeDynamics) return false;
                    if ((slide.type === 'group_quiz' || slide.type === 'quiz') && !includeQuizzes) return false;
                    return true;
                });
                const reorderedSlides = filteredSlides.map((slide, i) => ({ ...slide, order: i + 1 }));
                const result = await importCourseFromJSON({ course: courseData, slides: reorderedSlides }, user?.uid || 'admin');
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
        } catch (err) {
            toast.error('Error', `Error al parsear JSON: ${err.message}`);
        }
        setImporting(false);
    }, [loadCourses, user?.uid, includeDynamics, includeQuizzes, toast]);

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

    // ── Filtros ──
    const q = searchQuery.toLowerCase().trim();
    const interactiveCourses = nativeCourses.filter(c => !c.tipo || c.tipo !== 'link');
    const filteredNative = interactiveCourses.filter(c => c.title?.toLowerCase().includes(q));

    return (
        <AdminLayout title="Inducción">
            <div className={styles.main}>
                <div className={styles.container}>

                    <header className={styles.header}>
                        <div className={styles.titleSectionParent}>
                            <div className={styles.titleSection}>
                                <h1 className={styles.pageTitle}>Inducción</h1>
                                <p>Cursos interactivos y recursos URL / PDF para candidatos</p>
                            </div>
                        </div>
                        <div className={styles.headerActions}>
                            <div className={styles.searchInputWrapper}>
                                <Search size={16} className={styles.searchIcon} aria-hidden="true" />
                                <input
                                    type="search"
                                    placeholder="Buscar..."
                                    className={styles.searchInput}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    aria-label="Buscar contenido"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        className={styles.searchClearBtn}
                                        onClick={() => setSearchQuery('')}
                                        aria-label="Limpiar búsqueda"
                                    >
                                        <X size={14} aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </header>

                    <div className={styles.instructionsBanner}>
                        <div className={styles.instructionStep}>
                            <Zap size={20} className={styles.instructionIcon} />
                            <div>
                                <h4>1. Crea</h4>
                                <p>Constrúyelo desde el botón de <strong>Opciones</strong>, en la seccion de <strong>Nuevo Curso</strong>.</p>
                            </div>
                        </div>
                        <div className={styles.instructionStep}>
                            <Edit3 size={20} className={styles.instructionIcon} />
                            <div>
                                <h4>2. Configura los cursos</h4>
                                <p>Da clic en <strong>Configurar slides</strong> en el menú de opciones para agregar contenido.</p>
                            </div>
                        </div>
                        <div className={styles.instructionStep}>
                            <span className={styles.instructionIcon} style={{ fontSize: '18px' }}>📗</span>
                            <div>
                                <h4>3. ¡Importante!</h4>
                                <p>Los cursos marcados como <strong>Borrador (🔒)</strong> están ocultos para los candidatos.</p>
                            </div>
                        </div>
                        <div className={styles.instructionStep}>
                            <Link2 size={20} className={styles.instructionIcon} />
                            <div>
                                <h4>4. ¿Necesitas editar un curso?</h4>
                                <p>Al editar un curso, puedes marcar que la vista sea mediante una <strong>URL / PDF</strong> en lugar de los Cursos Interactivos.</p>
                            </div>
                        </div>
                    </div>

                    <main className={styles.contentArea} id="main-content">
                        <InteractiveCoursesView
                            canEdit={canEdit}
                            nativeCourses={interactiveCourses}
                            nativeLoading={nativeLoading}
                            filteredNative={filteredNative}
                            searchQuery={searchQuery}
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
