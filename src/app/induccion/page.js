'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';
import { uploadFile } from '@/lib/upload';
import { collection, query, getDocs, addDoc, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button/Button';
import { Combobox } from '@/components/ui/Combobox/Combobox';
import { useToast } from '@/components/ui/Toast/Toast';
import {
    ChevronRight, Plus, FileText, Link2, Trash2, Edit3,
    ExternalLink, X, Check, BookOpen, Upload, Play,
    Zap, Settings2
} from 'lucide-react';
import Link from 'next/link';
import ProfileDropdown from '@/components/layout/ProfileDropdown/ProfileDropdown';
import BackButton from '@/components/ui/BackButton/BackButton';
import CoursePlayer from '@/components/features/Courses/CoursePlayer';
import {
    importCourseFromJSON,
    getAllCourses,
    getCourseWithSlides,
    deleteCourse,
    togglePublish,
    renameCourse,
    createEmptyCourse,
} from '@/lib/courseService';
import { logInduccionAction } from '@/lib/induccionAudit';
import { useConfirm } from '@/hooks/useConfirm';

import puestosData from '../../../puestos.json';
import styles from './page.module.css';

export default function InductionPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { showConfirm, confirmDialog } = useConfirm();
    const fileInputRef = useRef(null);

    // ── Colecciones existentes ──
    const [courses, setCourses] = useState([]);
    const [candidateCourses, setCandidateCourses] = useState([]);
    const [availableCourseTitles, setAvailableCourseTitles] = useState([]);

    // ── Cursos nativos (colección `cursos`) ──
    const [nativeCourses, setNativeCourses] = useState([]);
    const [nativeLoading, setNativeLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [importAlert, setImportAlert] = useState(null);
    const [creatingCourse, setCreatingCourse] = useState(false);
    const [showNewCourseModal, setShowNewCourseModal] = useState(false);
    const [newCourseTitle, setNewCourseTitle] = useState('');

    // ── Player de cursos interactivos ──
    const [playerData, setPlayerData] = useState(null);

    // ── Rename inline ──
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');

    // ── UI state ──
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showCandidateForm, setShowCandidateForm] = useState(false);
    const [showNativeSection, setShowNativeSection] = useState(true);

    const [materialExpanded, setMaterialExpanded] = useState(true);
    const [candidatosExpanded, setCandidatosExpanded] = useState(true);

    const [candidateFormData, setCandidateFormData] = useState({
        nombre: '',
        descripcion: '',
        contenidoUrl: '',
        examenUrl: '',
        puestosAplicables: [],
        duracionEstimada: 30,
        obligatorio: true,
        orden: 1,
        nativeCourseId: '',
        tipo: 'link', // 'link' | 'file' | 'native'
    });

    const [newCourseName, setNewCourseName] = useState('');
    const [file, setFile] = useState(null);
    const [presentationLink, setPresentationLink] = useState('');
    const [uploading, setUploading] = useState(false);
    const [editingCandidateCourse, setEditingCandidateCourse] = useState(null);

    const canEdit = user?.rol === 'super_admin' || user?.rol === 'instructor';

    // ── Auth guard ──
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    // ── Cargar colecciones existentes ──
    useEffect(() => {
        const q = query(collection(db, 'induction_courses'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCourses(data);
            setAvailableCourseTitles(data.map(c => c.title).filter(Boolean).sort());
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        const q = query(collection(db, 'cursos_induccion'), orderBy('orden', 'asc'));
        const unsub = onSnapshot(q, (snap) => {
            setCandidateCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    // ── Cargar cursos nativos ──
    const loadNativeCourses = useCallback(async () => {
        setNativeLoading(true);
        const result = await getAllCourses();
        if (result.success) setNativeCourses(result.data);
        setNativeLoading(false);
    }, []);

    useEffect(() => {
        loadNativeCourses();
    }, [loadNativeCourses]);

    // Auto-ocultar alerta import
    useEffect(() => {
        if (!importAlert) return;
        const t = setTimeout(() => setImportAlert(null), 5000);
        return () => clearTimeout(t);
    }, [importAlert]);

    // ── Abrir CoursePlayer ──
    const handlePlayNative = useCallback(async (courseId) => {
        const result = await getCourseWithSlides(courseId);
        if (result.success) {
            setPlayerData(result.data);
        } else {
            toast.error('Error', 'No se pudo cargar el curso interactivo.');
        }
    }, [toast]);

    // ── Configuración de Importación ──
    const [includeDynamics, setIncludeDynamics] = useState(true);
    const [includeQuizzes, setIncludeQuizzes] = useState(true);

    // ── Importar JSON (admin) ──
    const handleImport = useCallback(async () => {
        const f = fileInputRef.current?.files?.[0];
        if (!f) {
            setImportAlert({ type: 'error', message: 'Selecciona un archivo JSON.' });
            return;
        }
        setImporting(true);
        try {
            const text = await f.text();
            const jsonData = JSON.parse(text);

            // Detectar si es un array de cursos (estructura mandosmedios.json)
            const coursesToImport = jsonData.courses || [jsonData];

            let successCount = 0;
            let errorMsg = '';

            for (const courseItem of coursesToImport) {
                // Estructura esperada por importCourseFromJSON: { course, slides }
                // Si viene como mandosmedios.json, "courseItem" tiene todo junto.
                // Adaptamos la estructura:
                const courseData = { ...courseItem };
                delete courseData.slides; // Separamos slides del objeto curso

                const slidesData = courseItem.slides || [];

                // Filtrar slides según configuración
                const filteredSlides = slidesData.filter(slide => {
                    const isDynamic = slide.type === 'group_dynamic' || slide.type === 'dynamic';
                    const isQuiz = slide.type === 'group_quiz' || slide.type === 'quiz';

                    if (isDynamic && !includeDynamics) return false;
                    if (isQuiz && !includeQuizzes) return false;

                    return true;
                });

                // Re-enumerar
                const reorderedSlides = filteredSlides.map((slide, index) => ({
                    ...slide,
                    order: index + 1
                }));

                // Construir objeto para importCourseFromJSON
                const importPayload = {
                    course: courseData,
                    slides: reorderedSlides
                };

                const result = await importCourseFromJSON(importPayload, user?.uid || 'admin');
                if (result.success) {
                    successCount++;
                } else {
                    errorMsg = result.error;
                }
            }

            if (successCount > 0) {
                setImportAlert({ type: 'success', message: `${successCount} curso(s) importado(s) correctamente.` });
                if (fileInputRef.current) fileInputRef.current.value = '';
                await loadNativeCourses();
            } else {
                setImportAlert({ type: 'error', message: errorMsg || 'No se pudieron importar los cursos.' });
            }

        } catch (err) {
            console.error(err);
            setImportAlert({ type: 'error', message: `Error al parsear JSON: ${err.message}` });
        }
        setImporting(false);
    }, [loadNativeCourses, user?.uid, includeDynamics, includeQuizzes]);

    // ── Crear curso vacío desde cero ──
    const handleCreateNewCourse = useCallback(() => {
        setNewCourseTitle('Nuevo Curso Interactivo');
        setShowNewCourseModal(true);
    }, []);

    const handleConfirmNewCourse = useCallback(async () => {
        if (!newCourseTitle.trim()) return;
        setCreatingCourse(true);
        setShowNewCourseModal(false);
        const result = await createEmptyCourse(newCourseTitle.trim(), user?.uid || 'admin');
        if (result.success) {
            toast.success('Creado', 'Redirigiendo al editor...');
            logInduccionAction({ userId: user?.uid, userName: user?.name || user?.email || 'Desconocido', action: 'create', target: newCourseTitle.trim() });
            router.push(`/induccion/cursos/${result.courseId}/editar`);
        } else {
            toast.error('Error', result.error || 'No se pudo crear el curso.');
        }
        setCreatingCourse(false);
    }, [newCourseTitle, user?.uid, user?.name, user?.email, toast, router]);

    // ── Toggle publicar curso nativo ──
    const handleTogglePublish = useCallback(async (courseId, currentPublished) => {
        const course = nativeCourses.find(c => c.id === courseId);
        const result = await togglePublish(courseId, !currentPublished);
        if (result.success) {
            toast.success('Actualizado', `Curso ${!currentPublished ? 'publicado' : 'despublicado'}.`);
            await loadNativeCourses();
            logInduccionAction({ userId: user?.uid, userName: user?.name || user?.email || 'Desconocido', action: !currentPublished ? 'publish' : 'unpublish', target: course?.title || courseId });
        } else {
            toast.error('Error', result.error);
        }
    }, [toast, loadNativeCourses, nativeCourses, user?.uid, user?.name, user?.email]);

    // ── Eliminar curso nativo ──
    const handleDeleteNative = useCallback(async (e, courseId) => {
        e.stopPropagation();
        if (!await showConfirm('¿Eliminar este curso y todos sus slides?', { title: 'Eliminar Curso', confirmLabel: 'Eliminar' })) return;
        const course = nativeCourses.find(c => c.id === courseId);
        const result = await deleteCourse(courseId);
        if (result.success) {
            toast.success('Eliminado', 'Curso eliminado.');
            await loadNativeCourses();
            logInduccionAction({ userId: user?.uid, userName: user?.name || user?.email || 'Desconocido', action: 'delete', target: course?.title || courseId });
        } else {
            toast.error('Error', result.error);
        }
    }, [toast, loadNativeCourses, nativeCourses, user?.uid, user?.name, user?.email, showConfirm]);

    // ── Rename inline ──
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
            await loadNativeCourses();
            logInduccionAction({ userId: user?.uid, userName: user?.name || user?.email || 'Desconocido', action: 'rename', target: trimmed, detail: `Antes: "${prev?.title || courseId}"` });
        } else {
            toast.error('Error', result.error);
        }
        setRenamingId(null);
    }, [renameValue, toast, loadNativeCourses, nativeCourses, user?.uid, user?.name, user?.email]);

    const handleRenameKeyDown = useCallback((e, courseId) => {
        if (e.key === 'Enter') handleConfirmRename(courseId);
        if (e.key === 'Escape') setRenamingId(null);
    }, [handleConfirmRename]);


    // ── Material de empleados ──
    const handleCreateCourse = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        if (!newCourseName.trim()) return toast.warning('Atención', 'Nombre requerido');
        setUploading(true);
        try {
            let fileData = null;
            if (file) {
                const uploadResult = await uploadFile(file, { docType: 'Induccion' });
                if (!uploadResult.success) throw new Error(uploadResult.error || 'Error subiendo archivo');
                fileData = { type: 'file', name: file.name, url: uploadResult.data.viewLink, downloadUrl: uploadResult.data.downloadLink };
            } else {
                fileData = { type: 'link', name: 'Presentación', url: presentationLink };
            }
            await addDoc(collection(db, 'induction_courses'), {
                title: newCourseName,
                material: fileData,
                createdAt: new Date().toISOString()
            });
            toast.success('Éxito', 'Material creado');
            setNewCourseName(''); setFile(null); setPresentationLink(''); setShowCreateForm(false);
        } catch (error) {
            toast.error('Error', error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteCourse = async (e, courseId) => {
        e.stopPropagation();
        if (!canEdit) return;
        if (await showConfirm('¿Borrar este material?', { title: 'Borrar Material', confirmLabel: 'Borrar' })) {
            await deleteDoc(doc(db, 'induction_courses', courseId));
            toast.success('Borrado', 'Material eliminado');
        }
    };

    // ── Candidatos ──
    const handleCandidateFormChange = async (field, value) => {
        setCandidateFormData(prev => ({ ...prev, [field]: value }));
        if (field === 'nombre' && value) {
            try {
                const positionsSnapshot = await getDocs(collection(db, 'positions'));
                const matching = [];
                positionsSnapshot.docs.forEach(d => {
                    const pd = d.data();
                    if (pd.requiredCourses?.includes(value)) matching.push(pd.name);
                });
                if (matching.length > 0) {
                    setCandidateFormData(prev => ({ ...prev, nombre: value, puestosAplicables: matching }));
                    toast.success('Auto-asignado', `${matching.length} puesto(s)`);
                }
            } catch (error) {
                console.error('Error fetching positions:', error);
            }
        }
    };

    const handlePuestoToggle = (puesto) => {
        setCandidateFormData(prev => ({
            ...prev,
            puestosAplicables: prev.puestosAplicables.includes(puesto)
                ? prev.puestosAplicables.filter(p => p !== puesto)
                : [...prev.puestosAplicables, puesto]
        }));
    };

    const handleCreateCandidateCourse = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        if (!candidateFormData.nombre.trim()) return toast.warning('Atención', 'El nombre es obligatorio');
        if (candidateFormData.tipo !== 'native' && !candidateFormData.contenidoUrl.trim())
            return toast.warning('Atención', 'La URL es obligatoria');
        if (candidateFormData.tipo === 'native' && !candidateFormData.nativeCourseId)
            return toast.warning('Atención', 'Selecciona un curso interactivo');
        if (candidateFormData.puestosAplicables.length === 0)
            return toast.warning('Atención', 'Selecciona al menos un puesto');

        setUploading(true);
        try {
            const dataToSave = {
                nombre: candidateFormData.nombre,
                descripcion: candidateFormData.descripcion,
                duracionEstimada: candidateFormData.duracionEstimada,
                obligatorio: candidateFormData.obligatorio,
                orden: candidateFormData.orden,
                puestosAplicables: candidateFormData.puestosAplicables,
                tipo: candidateFormData.tipo,
                contenidoUrl: candidateFormData.tipo !== 'native' ? candidateFormData.contenidoUrl : '',
                examenUrl: candidateFormData.examenUrl,
                nativeCourseId: candidateFormData.tipo === 'native' ? candidateFormData.nativeCourseId : '',
            };

            if (editingCandidateCourse) {
                await updateDoc(doc(db, 'cursos_induccion', editingCandidateCourse.id), {
                    ...dataToSave, updatedAt: new Date().toISOString()
                });
                toast.success('Actualizado', 'Curso actualizado');
            } else {
                await addDoc(collection(db, 'cursos_induccion'), {
                    ...dataToSave, activo: true, creadoPor: user?.uid || 'unknown', createdAt: new Date().toISOString()
                });
                toast.success('Creado', 'Curso creado');
            }
            setShowCandidateForm(false);
            setEditingCandidateCourse(null);
            setCandidateFormData({
                nombre: '', descripcion: '', contenidoUrl: '', examenUrl: '',
                puestosAplicables: [], duracionEstimada: 30, obligatorio: true,
                orden: candidateCourses.length + 1, nativeCourseId: '', tipo: 'link',
            });
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error', error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleEditCandidateCourse = (e, course) => {
        e.stopPropagation();
        setEditingCandidateCourse(course);
        setCandidateFormData({
            nombre: course.nombre || '',
            descripcion: course.descripcion || '',
            contenidoUrl: course.contenidoUrl || '',
            examenUrl: course.examenUrl || '',
            puestosAplicables: course.puestosAplicables || [],
            duracionEstimada: course.duracionEstimada || 30,
            obligatorio: course.obligatorio !== undefined ? course.obligatorio : true,
            orden: course.orden || 1,
            nativeCourseId: course.nativeCourseId || '',
            tipo: course.tipo || (course.nativeCourseId ? 'native' : 'link'),
        });
        setShowCandidateForm(true);
    };

    const handleDeleteCandidateCourse = async (e, courseId) => {
        e.stopPropagation();
        if (!canEdit) return;
        if (await showConfirm('¿Borrar este curso?', { title: 'Borrar Curso', confirmLabel: 'Borrar' })) {
            await deleteDoc(doc(db, 'cursos_induccion', courseId));
            toast.success('Borrado', 'Curso eliminado');
        }
    };

    const handleToggleCourseActive = async (courseId, currentStatus) => {
        if (!canEdit) return;
        try {
            await updateDoc(doc(db, 'cursos_induccion', courseId), { activo: !currentStatus });
            toast.success('Actualizado', `Curso ${!currentStatus ? 'activado' : 'desactivado'}`);
        } catch (error) {
            toast.error('Error', error.message);
        }
    };

    // ── Click en tarjeta candidato ──
    const handleCandidateCardClick = useCallback(async (course) => {
        if (course.nativeCourseId || course.tipo === 'native') {
            const id = course.nativeCourseId;
            if (id) await handlePlayNative(id);
        } else if (course.contenidoUrl) {
            window.open(course.contenidoUrl, '_blank');
        }
    }, [handlePlayNative]);

    // ── Loading/Auth guard ──
    if (authLoading || !user) {
        return (
            <div className={styles.main}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    // ── Si el player está abierto, solo renderizar el player ──
    if (playerData) {
        return (
            <CoursePlayer
                course={playerData.course}
                slides={playerData.slides}
                onClose={() => setPlayerData(null)}
            />
        );
    }

    // ── Nombre del curso nativo seleccionado ──
    const selectedNativeCourse = nativeCourses.find(c => c.id === candidateFormData.nativeCourseId);

    return (
        <>
            <div className={styles.main}>
                <div className={styles.profileContainer}>
                    <ProfileDropdown />
                </div>
                <div className={styles.bgDecoration}></div>

                <div className={styles.container}>
                    <BackButton href="/modulos" hidden={user?.rol === 'instructor'} />

                    <header className={styles.header}>
                        <div className={styles.titleSection}>
                            <h1>Inducción</h1>
                            <p>Material y cursos de bienvenida para empleados y candidatos</p>
                        </div>
                    </header>

                    {/* ==================== CURSOS INTERACTIVOS (solo admin) ==================== */}
                    {canEdit && (
                        <section className={styles.nativeSection}>
                            <div className={styles.coursesHeader}>
                                <h2
                                    className={styles.sectionTitle}
                                    onClick={() => setShowNativeSection(!showNativeSection)}
                                >
                                    <ChevronRight
                                        size={16}
                                        className={`${styles.chevronIcon} ${showNativeSection ? styles.expanded : ''}`}
                                    />
                                    <Zap size={14} style={{ color: '#e8742a', flexShrink: 0 }} />
                                    Cursos Interactivos
                                    <span className={styles.sectionCount}>{nativeCourses.length}</span>
                                </h2>

                                <div className={styles.nativeActions}>
                                    <div className={styles.importOptions}>
                                        <label title="Incluir dinámicas grupales">
                                            <input
                                                type="checkbox"
                                                checked={includeDynamics}
                                                onChange={(e) => setIncludeDynamics(e.target.checked)}
                                            />
                                            <span style={{ fontSize: '0.8rem', marginLeft: 4 }}>Dinámicas</span>
                                        </label>
                                        <label title="Incluir quizzes grupales">
                                            <input
                                                type="checkbox"
                                                checked={includeQuizzes}
                                                onChange={(e) => setIncludeQuizzes(e.target.checked)}
                                            />
                                            <span style={{ fontSize: '0.8rem', marginLeft: 4 }}>Quizzes</span>
                                        </label>
                                    </div>

                                    <label className={styles.importJsonBtn}>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".json"
                                            style={{ display: 'none' }}
                                            onChange={() => { }}
                                        />
                                        <FileText size={13} />
                                        <span>JSON</span>
                                    </label>
                                    <button
                                        className={styles.importBtn}
                                        onClick={handleImport}
                                        disabled={importing}
                                    >
                                        <Upload size={13} />
                                        {importing ? 'Importando…' : 'Importar'}
                                    </button>
                                    <button
                                        className={styles.newCourseBtn}
                                        onClick={handleCreateNewCourse}
                                        disabled={creatingCourse}
                                        title="Crear curso interactivo desde cero"
                                    >
                                        <Plus size={13} />
                                        {creatingCourse ? 'Creando...' : 'Nuevo Curso'}
                                    </button>
                                </div>
                            </div>

                            {importAlert && (
                                <div className={`${styles.importAlert} ${importAlert.type === 'success' ? styles.importAlertSuccess : styles.importAlertError}`}>
                                    {importAlert.message}
                                </div>
                            )}

                            {showNativeSection && (
                                <div className={styles.nativeGrid}>
                                    {nativeLoading ? (
                                        <div className={styles.emptyState}><p>Cargando cursos…</p></div>
                                    ) : nativeCourses.length === 0 ? (
                                        <div className={styles.emptyState}>
                                            <p>No hay cursos interactivos. Importa un JSON para comenzar.</p>
                                        </div>
                                    ) : (
                                        nativeCourses.map(course => (
                                            <div key={course.id} className={styles.nativeCard}>
                                                <div className={styles.nativeCardLeft}>
                                                    <div className={styles.nativeIcon}>
                                                        <BookOpen size={16} />
                                                    </div>
                                                    <div className={styles.nativeInfo}>
                                                        {renamingId === course.id ? (
                                                            <input
                                                                className={styles.renameInput}
                                                                value={renameValue}
                                                                autoFocus
                                                                onChange={e => setRenameValue(e.target.value)}
                                                                onBlur={() => handleConfirmRename(course.id)}
                                                                onKeyDown={e => handleRenameKeyDown(e, course.id)}
                                                                onClick={e => e.stopPropagation()}
                                                            />
                                                        ) : (
                                                            <span className={styles.nativeTitle}>{course.title}</span>
                                                        )}
                                                        <div className={styles.nativeMeta}>
                                                            {course.category && <span>{course.category}</span>}
                                                            {course.slideCount && <span>{course.slideCount} slides</span>}
                                                            {course.duration && <span>{course.duration}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={styles.nativeCardRight}>
                                                    <span
                                                        className={`${styles.publishBadge} ${course.published ? styles.publishedBadge : styles.draftBadge}`}
                                                        onClick={() => handleTogglePublish(course.id, course.published)}
                                                        title="Click para cambiar estado"
                                                    >
                                                        {course.published ? 'Publicado' : 'Borrador'}
                                                    </span>
                                                    <button
                                                        className={styles.editBtn}
                                                        onClick={(e) => handleStartRename(e, course)}
                                                        title="Renombrar curso"
                                                    >
                                                        <Edit3 size={13} />
                                                    </button>
                                                    <Link
                                                        href={`/induccion/cursos/${course.id}/editar`}
                                                        className={styles.editBtn}
                                                        title="Editar slides y contenido"
                                                    >
                                                        <Settings2 size={13} />
                                                    </Link>
                                                    <button
                                                        className={styles.playBtn}
                                                        onClick={() => handlePlayNative(course.id)}
                                                        title="Reproducir"
                                                    >
                                                        <Play size={13} />
                                                    </button>
                                                    <button
                                                        className={styles.nativeDeleteBtn}
                                                        onClick={(e) => handleDeleteNative(e, course.id)}
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {/* ==================== DOS COLUMNAS (existentes) ==================== */}
                    <div className={styles.columnsContainer}>
                        {/* COLUMNA IZQUIERDA - Cursos de Candidatos */}
                        {canEdit && (
                            <section className={styles.columnSection}>
                                <div className={styles.coursesHeader}>
                                    <h2
                                        className={styles.sectionTitle}
                                        onClick={() => setCandidatosExpanded(!candidatosExpanded)}
                                    >
                                        <ChevronRight
                                            size={16}
                                            className={`${styles.chevronIcon} ${candidatosExpanded ? styles.expanded : ''}`}
                                        />
                                        Candidatos
                                        <span className={styles.sectionCount}>{candidateCourses.length}</span>
                                    </h2>
                                    <button
                                        className={styles.toggleBtn}
                                        onClick={() => {
                                            setShowCandidateForm(!showCandidateForm);
                                            setEditingCandidateCourse(null);
                                            setCandidateFormData({
                                                nombre: '', descripcion: '', contenidoUrl: '', examenUrl: '',
                                                puestosAplicables: [], duracionEstimada: 30, obligatorio: true,
                                                orden: 1, nativeCourseId: '', tipo: 'link',
                                            });
                                        }}
                                    >
                                        <Plus size={14} />
                                        {showCandidateForm ? 'Cerrar' : 'Nuevo'}
                                    </button>
                                </div>

                                {candidatosExpanded && (
                                    <>
                                        {showCandidateForm && (
                                            <div className={styles.createCourseContainer}>
                                                <h3>{editingCandidateCourse ? 'Editar curso' : 'Nuevo curso'}</h3>
                                                <form onSubmit={handleCreateCandidateCourse} className={styles.createCourseForm}>
                                                    <div className={styles.inputGroup}>
                                                        <label>Nombre del curso</label>
                                                        <Combobox
                                                            value={candidateFormData.nombre}
                                                            onChange={(value) => handleCandidateFormChange('nombre', value)}
                                                            options={availableCourseTitles}
                                                            placeholder="Seleccionar o escribir..."
                                                            searchPlaceholder="Buscar..."
                                                        />
                                                    </div>

                                                    <div className={styles.inputGroup}>
                                                        <label>Descripción</label>
                                                        <textarea
                                                            className={styles.input}
                                                            value={candidateFormData.descripcion}
                                                            onChange={e => handleCandidateFormChange('descripcion', e.target.value)}
                                                            placeholder="Breve descripción del curso..."
                                                            rows={2}
                                                        />
                                                    </div>

                                                    {/* Selector de tipo de contenido */}
                                                    <div className={styles.inputGroup}>
                                                        <label>Tipo de contenido</label>
                                                        <div className={styles.tipoSelector}>
                                                            {['link', 'native'].map(tipo => (
                                                                <button
                                                                    key={tipo}
                                                                    type="button"
                                                                    className={`${styles.tipoBtn} ${candidateFormData.tipo === tipo ? styles.tipoBtnActive : ''}`}
                                                                    onClick={() => handleCandidateFormChange('tipo', tipo)}
                                                                >
                                                                    {tipo === 'link' && <><Link2 size={12} /> Enlace</>}
                                                                    {tipo === 'native' && <><Zap size={12} /> Interactivo</>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {candidateFormData.tipo === 'native' ? (
                                                        <div className={styles.inputGroup}>
                                                            <label>Curso interactivo</label>
                                                            <select
                                                                className={styles.input}
                                                                value={candidateFormData.nativeCourseId}
                                                                onChange={e => handleCandidateFormChange('nativeCourseId', e.target.value)}
                                                            >
                                                                <option value="">— Seleccionar curso —</option>
                                                                {nativeCourses.map(c => (
                                                                    <option key={c.id} value={c.id}>{c.title}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <div className={styles.inputGroup}>
                                                            <label>URL de presentación</label>
                                                            <input
                                                                className={styles.input}
                                                                value={candidateFormData.contenidoUrl}
                                                                onChange={e => handleCandidateFormChange('contenidoUrl', e.target.value)}
                                                                placeholder="https://drive.google.com/..."
                                                            />
                                                        </div>
                                                    )}

                                                    <div className={styles.inputGroup}>
                                                        <label>URL de examen (opcional)</label>
                                                        <input
                                                            className={styles.input}
                                                            value={candidateFormData.examenUrl}
                                                            onChange={e => handleCandidateFormChange('examenUrl', e.target.value)}
                                                            placeholder="https://..."
                                                        />
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                        <div className={styles.inputGroup}>
                                                            <label>Duración (min)</label>
                                                            <input
                                                                type="number"
                                                                className={styles.input}
                                                                value={candidateFormData.duracionEstimada}
                                                                onChange={e => handleCandidateFormChange('duracionEstimada', parseInt(e.target.value) || 0)}
                                                                min="1"
                                                            />
                                                        </div>
                                                        <div className={styles.inputGroup}>
                                                            <label>Orden</label>
                                                            <input
                                                                type="number"
                                                                className={styles.input}
                                                                value={candidateFormData.orden}
                                                                onChange={e => handleCandidateFormChange('orden', parseInt(e.target.value) || 1)}
                                                                min="1"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className={styles.inputGroup}>
                                                        <label>Puestos aplicables ({candidateFormData.puestosAplicables.length})</label>
                                                        <div className={styles.puestosCheckboxContainer}>
                                                            {puestosData.map((p, idx) => (
                                                                <label key={idx}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={candidateFormData.puestosAplicables.includes(p.positions)}
                                                                        onChange={() => handlePuestoToggle(p.positions)}
                                                                    />
                                                                    {p.positions}
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className={styles.formActions}>
                                                        <Button type="submit" disabled={uploading}>
                                                            {uploading ? 'Guardando...' : (editingCandidateCourse ? 'Actualizar' : 'Crear')}
                                                        </Button>
                                                        {editingCandidateCourse && (
                                                            <button
                                                                type="button"
                                                                className={styles.toggleBtn}
                                                                onClick={() => { setEditingCandidateCourse(null); setShowCandidateForm(false); }}
                                                            >
                                                                Cancelar
                                                            </button>
                                                        )}
                                                    </div>
                                                </form>
                                            </div>
                                        )}

                                        <div className={styles.coursesGrid}>
                                            {candidateCourses.length === 0 ? (
                                                <div className={styles.emptyState}><p>No hay cursos de candidatos</p></div>
                                            ) : (
                                                candidateCourses.map(course => {
                                                    const isNative = course.tipo === 'native' || !!course.nativeCourseId;
                                                    return (
                                                        <div
                                                            key={course.id}
                                                            className={styles.courseCard}
                                                            onClick={() => handleCandidateCardClick(course)}
                                                        >
                                                            <div
                                                                className={styles.cardTopColor}
                                                                style={{ background: course.activo ? '#22c55e' : '#94a3b8' }}
                                                            />
                                                            <div className={styles.cardActionsRow}>
                                                                <button className={styles.editBtn} onClick={(e) => handleEditCandidateCourse(e, course)}>
                                                                    <Edit3 size={12} />
                                                                </button>
                                                                <button className={styles.deleteBtn} onClick={(e) => handleDeleteCandidateCourse(e, course.id)}>
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                            <div className={styles.cardContent}>
                                                                <div>
                                                                    <h3 className={styles.courseTitle}>{course.nombre}</h3>
                                                                    {course.descripcion && (
                                                                        <p className={styles.cardDescription}>
                                                                            {course.descripcion.length > 60
                                                                                ? course.descripcion.substring(0, 60) + '...'
                                                                                : course.descripcion}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className={styles.cardMeta}>
                                                                    {isNative ? (
                                                                        <span className={`${styles.courseTypeBadge} ${styles.nativeBadge}`}>
                                                                            <Zap size={9} /> Interactivo
                                                                        </span>
                                                                    ) : (
                                                                        <span className={styles.courseTypeBadge}>
                                                                            <Link2 size={9} /> Enlace
                                                                        </span>
                                                                    )}
                                                                    <span className={styles.courseTypeBadge}>
                                                                        {course.puestosAplicables?.length || 0} puestos
                                                                    </span>
                                                                    <span className={styles.courseTypeBadge}>
                                                                        {course.duracionEstimada} min
                                                                    </span>
                                                                    <button
                                                                        className={styles.toggleBtn}
                                                                        onClick={(e) => { e.stopPropagation(); handleToggleCourseActive(course.id, course.activo); }}
                                                                        style={{ marginLeft: 'auto' }}
                                                                    >
                                                                        {course.activo ? 'Desactivar' : 'Activar'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </>
                                )}
                            </section>
                        )}

                        {/* COLUMNA DERECHA - Material de Inducción */}
                        <section className={styles.columnSection}>
                            <div className={styles.coursesHeader}>
                                <h2
                                    className={styles.sectionTitle}
                                    onClick={() => setMaterialExpanded(!materialExpanded)}
                                >
                                    <ChevronRight
                                        size={16}
                                        className={`${styles.chevronIcon} ${materialExpanded ? styles.expanded : ''}`}
                                    />
                                    Material
                                    <span className={styles.sectionCount}>{courses.length}</span>
                                </h2>
                                {canEdit && (
                                    <button className={styles.toggleBtn} onClick={() => setShowCreateForm(!showCreateForm)}>
                                        <Plus size={14} />
                                        {showCreateForm ? 'Cerrar' : 'Nuevo'}
                                    </button>
                                )}
                            </div>

                            {materialExpanded && (
                                <>
                                    {showCreateForm && canEdit && (
                                        <div className={styles.createCourseContainer}>
                                            <h3>Nuevo material</h3>
                                            <form onSubmit={handleCreateCourse} className={styles.createCourseForm}>
                                                <div className={styles.inputGroup}>
                                                    <label>Nombre</label>
                                                    <input
                                                        className={styles.input}
                                                        value={newCourseName}
                                                        onChange={e => setNewCourseName(e.target.value)}
                                                        placeholder="Ej. Manual de Bienvenida"
                                                    />
                                                </div>
                                                <div className={styles.inputGroup}>
                                                    <label>Archivo o enlace</label>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <input type="file" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} id="fileUpload" />
                                                        <label
                                                            htmlFor="fileUpload"
                                                            className={`${styles.fileBtn} ${file ? styles.fileBtnActive : ''}`}
                                                        >
                                                            {file ? <Check size={14} /> : <FileText size={14} />}
                                                            {file ? 'Listo' : 'PDF'}
                                                        </label>
                                                        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>o</span>
                                                        <input
                                                            className={styles.input}
                                                            placeholder="Pegar enlace..."
                                                            value={presentationLink}
                                                            onChange={e => setPresentationLink(e.target.value)}
                                                            style={{ flex: 1 }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className={styles.formActions}>
                                                    <Button type="submit" disabled={uploading}>
                                                        {uploading ? 'Subiendo...' : 'Publicar'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    <div className={styles.coursesGrid}>
                                        {courses.length === 0 ? (
                                            <div className={styles.emptyState}><p>No hay material de inducción</p></div>
                                        ) : (
                                            courses.map(course => (
                                                <div
                                                    key={course.id}
                                                    className={styles.courseCard}
                                                    onClick={() => window.open(course.material?.url, '_blank')}
                                                >
                                                    <div
                                                        className={styles.cardTopColor}
                                                        style={{ background: course.material?.type === 'link' ? '#f59e0b' : '#ef4444' }}
                                                    />
                                                    {canEdit && (
                                                        <button className={styles.deleteBtn} onClick={(e) => handleDeleteCourse(e, course.id)}>
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                    <div className={styles.cardContent}>
                                                        <h3 className={styles.courseTitle}>{course.title}</h3>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span className={styles.courseTypeBadge}>
                                                                {course.material?.type === 'link' ? (
                                                                    <><Link2 size={10} /> Enlace</>
                                                                ) : (
                                                                    <><FileText size={10} /> PDF</>
                                                                )}
                                                            </span>
                                                            <div className={styles.cardAction}>
                                                                <ExternalLink size={14} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </section>
                    </div>
                </div>

                {/* ── Modal: Nuevo Curso Interactivo ── */}
                {showNewCourseModal && (
                    <div
                        className={styles.modalBackdrop}
                        onClick={() => setShowNewCourseModal(false)}
                    >
                        <div
                            className={styles.modalContent}
                            style={{ textAlign: 'left', maxWidth: 420 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        Nuevo Curso Interactivo
                                    </h2>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                                        Podrás agregar slides desde el editor
                                    </p>
                                </div>
                                <button
                                    className={styles.closeModalBtn}
                                    onClick={() => setShowNewCourseModal(false)}
                                    type="button"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div className={styles.inputGroup} style={{ marginBottom: 20 }}>
                                <label>Nombre del curso</label>
                                <input
                                    className={styles.input}
                                    value={newCourseTitle}
                                    onChange={e => setNewCourseTitle(e.target.value)}
                                    placeholder="Ej. Operadores de Máquina"
                                    autoFocus
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleConfirmNewCourse();
                                        if (e.key === 'Escape') setShowNewCourseModal(false);
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                <button
                                    className={styles.toggleBtn}
                                    onClick={() => setShowNewCourseModal(false)}
                                    type="button"
                                >
                                    Cancelar
                                </button>
                                <button
                                    className={styles.newCourseBtn}
                                    onClick={handleConfirmNewCourse}
                                    disabled={!newCourseTitle.trim() || creatingCourse}
                                    type="button"
                                    style={{ padding: '7px 16px', fontSize: '0.85rem' }}
                                >
                                    <Plus size={13} />
                                    Crear y editar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {confirmDialog}
        </>
    );
}
