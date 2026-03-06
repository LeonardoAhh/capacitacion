/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { uploadFile } from '@/lib/upload';
import { collection, query, getDocs, addDoc, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button/Button';
import { Combobox } from '@/components/ui/Combobox/Combobox';
import { useToast } from '@/components/ui/Toast/Toast';
import {
    IconChevronRight as ChevronRight,
    IconPlus as Plus,
    IconFileText as FileText,
    IconLink as Link2,
    IconTrash2 as Trash2,
    IconEdit as Edit3,
    IconExternalLink as ExternalLink,
    IconX as X,
    IconCheck as Check,
    IconBookOpen as BookOpen,
    IconUpload as Upload,
    IconPlay as Play,
    IconZap as Zap,
    IconSettings as Settings2,
    IconImage as Image,
    IconVideo as Video,
    IconUploadCloud as UploadCloud,
    IconSearch as Search,
    IconFolderOpen as FolderOpen,
    IconUsers as Users,
    IconArrowLeft as ArrowLeft
} from '@/lib/icons';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton/BackButton';
import NextImage from 'next/image';
import { LogOut, User, Menu } from 'lucide-react';

import CourseWizardModal from '@/components/features/Courses/CourseWizardModal';
import InduccionSidebar from '@/components/features/Induccion/Sidebar/InduccionSidebar';

import InteractiveCoursesView from '@/components/features/Induccion/views/InteractiveCoursesView';
import CandidateCoursesView from '@/components/features/Induccion/views/CandidateCoursesView';
import MaterialView from '@/components/features/Induccion/views/MaterialView';
import GalleryView from '@/components/features/Induccion/views/GalleryView';
import CoursePlayer from '@/components/features/Courses/CoursePlayer';
import {
    importCourseFromJSON,
    getAllCourses,
    getCourseWithSlides,
    deleteCourse,
    togglePublish,
    renameCourse,
    createCourseFromWizard,
} from '@/lib/courseService';
import { logInduccionAction } from '@/lib/induccionAudit';
import { useConfirm } from '@/hooks/useConfirm';

import puestosData from '../../../puestos.json';
import styles from './page.module.css';

export default function InductionPage() {
    const { user, loading: authLoading, signOut } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { showConfirm, confirmDialog } = useConfirm();
    const fileInputRef = useRef(null);
    const galleryFileRef = useRef(null);

    // ── Tab activo ──
    const [activeTab, setActiveTab] = useState('interactivos');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // ── Colecciones existentes ──
    const [courses, setCourses] = useState([]);
    const [candidateCourses, setCandidateCourses] = useState([]);
    const [availableCourseTitles, setAvailableCourseTitles] = useState([]);

    // ── Cursos nativos ──
    const [nativeCourses, setNativeCourses] = useState([]);
    const [nativeLoading, setNativeLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [creatingCourse, setCreatingCourse] = useState(false);
    const [showNewCourseModal, setShowNewCourseModal] = useState(false);
    const [newCourseTitle, setNewCourseTitle] = useState('');

    // ── Player ──
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
        nombre: '', descripcion: '', contenidoUrl: '', examenUrl: '',
        puestosAplicables: [], duracionEstimada: 30, obligatorio: true,
        orden: 1, nativeCourseId: '', tipo: 'link',
    });

    const [newCourseName, setNewCourseName] = useState('');
    const [file, setFile] = useState(null);
    const [presentationLink, setPresentationLink] = useState('');
    const [uploading, setUploading] = useState(false);
    const [editingCandidateCourse, setEditingCandidateCourse] = useState(null);

    // ── Galería ──
    const [galleryItems, setGalleryItems] = useState([]);
    const [showGalleryModal, setShowGalleryModal] = useState(false);
    const [galleryType, setGalleryType] = useState('imagen');
    const [galleryFile, setGalleryFile] = useState(null);
    const [galleryName, setGalleryName] = useState('');
    const [galleryUploading, setGalleryUploading] = useState(false);
    const [galleryProgress, setGalleryProgress] = useState(0);
    const [galleryExpanded, setGalleryExpanded] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState(null);

    // ── Import options ──
    const [includeDynamics, setIncludeDynamics] = useState(true);
    const [includeQuizzes, setIncludeQuizzes] = useState(true);

    // ── Búsqueda ──
    const [searchQuery, setSearchQuery] = useState('');

    const canEdit = user?.rol === 'super_admin' || user?.rol === 'instructor';

    // ── Auth guard ──
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    // ── Logout: usa signOut del contexto (consistente con useAuth) ──
    const handleLogout = useCallback(async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Error', 'No se pudo cerrar sesión.');
        }
    }, [signOut, router, toast]);

    const getInitials = (name) =>
        name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

    // ── Listeners Firestore ──
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

    const loadNativeCourses = useCallback(async () => {
        setNativeLoading(true);
        const result = await getAllCourses();
        if (result.success) setNativeCourses(result.data);
        setNativeLoading(false);
    }, []);

    useEffect(() => { loadNativeCourses(); }, [loadNativeCourses]);

    useEffect(() => {
        const q = query(collection(db, 'induccion_galeria'), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            setGalleryItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    // ── Galería upload ──
    const handleGalleryUpload = useCallback(async () => {
        if (!galleryFile) return toast.warning('Atención', 'Selecciona un archivo.');
        if (!galleryName.trim()) return toast.warning('Atención', 'Escribe un nombre.');
        setGalleryUploading(true);
        setGalleryProgress(0);
        try {
            const formData = new FormData();
            formData.append('file', galleryFile);
            formData.append('nombre', galleryName.trim());
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/gallery-upload');
                xhr.withCredentials = true;
                const currentUser = auth.currentUser;
                if (!currentUser) { reject(new Error('Usuario no autenticado')); return; }
                currentUser.getIdToken().then(idToken => {
                    xhr.setRequestHeader('Authorization', `Bearer ${idToken}`);
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) setGalleryProgress(Math.round((e.loaded / e.total) * 90));
                    };
                    xhr.onload = async () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            const result = JSON.parse(xhr.responseText);
                            if (result.success) {
                                await addDoc(collection(db, 'induccion_galeria'), {
                                    nombre: galleryName.trim(), tipo: result.data.tipo,
                                    mimeType: result.data.mimeType, viewLink: result.data.viewLink,
                                    downloadLink: result.data.downloadLink, driveId: result.data.id,
                                    creadoPor: user?.uid || 'unknown', createdAt: new Date().toISOString(),
                                });
                                setGalleryProgress(100);
                                toast.success('Subido', `"${galleryName}" agregado a la galeria.`);
                                setShowGalleryModal(false); setGalleryFile(null);
                                setGalleryName(''); setGalleryProgress(0);
                                if (galleryFileRef.current) galleryFileRef.current.value = '';
                                resolve();
                            } else { reject(new Error(result.error || 'Error al subir')); }
                        } else {
                            try { const err = JSON.parse(xhr.responseText); reject(new Error(err.error || `HTTP ${xhr.status}`)); }
                            catch { reject(new Error(`HTTP ${xhr.status}`)); }
                        }
                    };
                    xhr.onerror = () => reject(new Error('Error de red'));
                    xhr.send(formData);
                }).catch(err => reject(new Error('No se pudo obtener token: ' + err.message)));
            });
        } catch (err) {
            toast.error('Error', err.message || 'No se pudo subir el archivo.');
            setGalleryProgress(0);
        } finally { setGalleryUploading(false); }
    }, [galleryFile, galleryName, user?.uid, toast]);

    const handleGalleryDelete = useCallback(async (e, itemId) => {
        e.stopPropagation();
        if (!await showConfirm('¿Eliminar este elemento de la galería?', { title: 'Eliminar', confirmLabel: 'Eliminar' })) return;
        await deleteDoc(doc(db, 'induccion_galeria', itemId));
        toast.success('Eliminado', 'Elemento eliminado de la galería.');
    }, [showConfirm, toast]);

    const handlePlayNative = useCallback(async (courseId) => {
        const result = await getCourseWithSlides(courseId);
        if (result.success) { setPlayerData(result.data); }
        else { toast.error('Error', 'No se pudo cargar el curso interactivo.'); }
    }, [toast]);

    // ── BUG FIX: setImportAlert no estaba declarado — reemplazado por toast ──
    const handleImport = useCallback(async () => {
        const f = fileInputRef.current?.files?.[0];
        if (!f) {
            toast.error('Error', 'Selecciona un archivo JSON.');
            return;
        }
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
                    const isDynamic = slide.type === 'group_dynamic' || slide.type === 'dynamic';
                    const isQuiz = slide.type === 'group_quiz' || slide.type === 'quiz';
                    if (isDynamic && !includeDynamics) return false;
                    if (isQuiz && !includeQuizzes) return false;
                    return true;
                });
                const reorderedSlides = filteredSlides.map((slide, index) => ({ ...slide, order: index + 1 }));
                const result = await importCourseFromJSON({ course: courseData, slides: reorderedSlides }, user?.uid || 'admin');
                if (result.success) { successCount++; } else { errorMsg = result.error; }
            }
            if (successCount > 0) {
                toast.success('Éxito', `${successCount} curso(s) importado(s) correctamente.`);
                if (fileInputRef.current) fileInputRef.current.value = '';
                await loadNativeCourses();
            } else {
                toast.error('Error', errorMsg || 'No se pudieron importar los cursos.');
            }
        } catch (err) {
            toast.error('Error', `Error al parsear JSON: ${err.message}`);
        }
        setImporting(false);
    }, [loadNativeCourses, user?.uid, includeDynamics, includeQuizzes, toast]);

    const handleCreateNewCourse = useCallback(() => {
        setNewCourseTitle('Nuevo Curso Interactivo');
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
        const result = await togglePublish(courseId, !currentPublished);
        if (result.success) {
            toast.success('Actualizado', `Curso ${!currentPublished ? 'publicado' : 'despublicado'}.`);
            await loadNativeCourses();
            logInduccionAction({ userId: user?.uid, userName: user?.name || user?.email || 'Desconocido', action: !currentPublished ? 'publish' : 'unpublish', target: course?.title || courseId });
        } else { toast.error('Error', result.error); }
    }, [toast, loadNativeCourses, nativeCourses, user?.uid, user?.name, user?.email]);

    const handleDeleteNative = useCallback(async (e, courseId) => {
        e.stopPropagation();
        if (!await showConfirm('¿Eliminar este curso y todos sus slides?', { title: 'Eliminar Curso', confirmLabel: 'Eliminar' })) return;
        const course = nativeCourses.find(c => c.id === courseId);
        const result = await deleteCourse(courseId);
        if (result.success) {
            toast.success('Eliminado', 'Curso eliminado.');
            await loadNativeCourses();
            logInduccionAction({ userId: user?.uid, userName: user?.name || user?.email || 'Desconocido', action: 'delete', target: course?.title || courseId });
        } else { toast.error('Error', result.error); }
    }, [toast, loadNativeCourses, nativeCourses, user?.uid, user?.name, user?.email, showConfirm]);

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
        } else { toast.error('Error', result.error); }
        setRenamingId(null);
    }, [renameValue, toast, loadNativeCourses, nativeCourses, user?.uid, user?.name, user?.email]);

    const handleRenameKeyDown = useCallback((e, courseId) => {
        if (e.key === 'Enter') handleConfirmRename(courseId);
        if (e.key === 'Escape') setRenamingId(null);
    }, [handleConfirmRename]);

    // ── Material ──
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
            await addDoc(collection(db, 'induction_courses'), { title: newCourseName, material: fileData, createdAt: new Date().toISOString() });
            toast.success('Éxito', 'Material creado');
            setNewCourseName(''); setFile(null); setPresentationLink(''); setShowCreateForm(false);
        } catch (error) { toast.error('Error', error.message); }
        finally { setUploading(false); }
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
            } catch (error) { console.error('Error fetching positions:', error); }
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
                nombre: candidateFormData.nombre, descripcion: candidateFormData.descripcion,
                duracionEstimada: candidateFormData.duracionEstimada, obligatorio: candidateFormData.obligatorio,
                orden: candidateFormData.orden, puestosAplicables: candidateFormData.puestosAplicables,
                tipo: candidateFormData.tipo,
                contenidoUrl: candidateFormData.tipo !== 'native' ? candidateFormData.contenidoUrl : '',
                examenUrl: candidateFormData.examenUrl,
                nativeCourseId: candidateFormData.tipo === 'native' ? candidateFormData.nativeCourseId : '',
            };
            if (editingCandidateCourse) {
                await updateDoc(doc(db, 'cursos_induccion', editingCandidateCourse.id), { ...dataToSave, updatedAt: new Date().toISOString() });
                toast.success('Actualizado', 'Curso actualizado');
            } else {
                await addDoc(collection(db, 'cursos_induccion'), { ...dataToSave, activo: true, creadoPor: user?.uid || 'unknown', createdAt: new Date().toISOString() });
                toast.success('Creado', 'Curso creado');
            }
            setShowCandidateForm(false); setEditingCandidateCourse(null);
            setCandidateFormData({ nombre: '', descripcion: '', contenidoUrl: '', examenUrl: '', puestosAplicables: [], duracionEstimada: 30, obligatorio: true, orden: candidateCourses.length + 1, nativeCourseId: '', tipo: 'link' });
        } catch (error) { toast.error('Error', error.message); }
        finally { setUploading(false); }
    };

    const handleEditCandidateCourse = (e, course) => {
        e.stopPropagation();
        setEditingCandidateCourse(course);
        setCandidateFormData({
            nombre: course.nombre || '', descripcion: course.descripcion || '',
            contenidoUrl: course.contenidoUrl || '', examenUrl: course.examenUrl || '',
            puestosAplicables: course.puestosAplicables || [],
            duracionEstimada: course.duracionEstimada || 30,
            obligatorio: course.obligatorio !== undefined ? course.obligatorio : true,
            orden: course.orden || 1, nativeCourseId: course.nativeCourseId || '',
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
        } catch (error) { toast.error('Error', error.message); }
    };

    const handleCandidateCardClick = useCallback(async (course) => {
        if (course.nativeCourseId || course.tipo === 'native') {
            const id = course.nativeCourseId;
            if (id) await handlePlayNative(id);
        } else if (course.contenidoUrl) {
            window.open(course.contenidoUrl, '_blank');
        }
    }, [handlePlayNative]);

    // ── Guards de carga ──
    if (authLoading || !user) {
        return (
            <div className={styles.main}>
                <div className={styles.loadingCenter}>
                    <div className="spinner" />
                </div>
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

    // ── Filtros de Búsqueda ──
    const q = searchQuery.toLowerCase().trim();
    const filteredNative = nativeCourses.filter(c => c.title?.toLowerCase().includes(q));
    const filteredCandidates = candidateCourses.filter(c =>
        c.nombre?.toLowerCase().includes(q) || c.descripcion?.toLowerCase().includes(q)
    );
    const filteredMaterial = courses.filter(c => c.title?.toLowerCase().includes(q));
    const filteredGallery = galleryItems.filter(c => c.nombre?.toLowerCase().includes(q));

    // ── Visibilidad de columnas por tab ──
    const showColumnsSection =
        activeTab === 'candidatos' || activeTab === 'material' || activeTab === 'all';

    return (
        <>
            <div className={styles.main}>
                <div className={styles.bgDecoration} aria-hidden="true" />

                {/* ══════════════ GRID PRINCIPAL ══════════════ */}
                <div className={styles.container}>

                    {/* ── SIDEBAR (Escritorio + Drawer Móvil) ── */}
                    <InduccionSidebar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        canEdit={canEdit}
                        user={user}
                        nativeCoursesCount={nativeCourses.length}
                        candidateCoursesCount={candidateCourses.length}
                        coursesCount={courses.length}
                        galleryItemsCount={galleryItems.length}
                        handleLogout={handleLogout}
                        getInitials={getInitials}
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                    />

                    {/* ── HEADER ── */}
                    <header className={styles.header}>
                        <div className={styles.titleSectionParent}>
                            {/* Botón hamburguesa — visible cuando el sidebar es drawer (≤768px) */}
                            <button
                                type="button"
                                className={styles.mobileMenuBtn}
                                onClick={() => setIsSidebarOpen(true)}
                                aria-label="Abrir menú de navegación"
                                aria-expanded={isSidebarOpen}
                                aria-controls="induccion-sidebar"
                            >
                                <Menu size={20} aria-hidden="true" />
                            </button>
                            <div className={styles.titleSection}>
                                <h1>Inducción</h1>
                                <p>Material y cursos de bienvenida para empleados y candidatos</p>
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
                                    onChange={(e) => setSearchQuery(e.target.value)}
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

                    {/* ── CONTENIDO PRINCIPAL ── */}
                    <main className={styles.contentArea} id="main-content">

                        <InteractiveCoursesView
                            canEdit={canEdit}
                            activeTab={activeTab}
                            showNativeSection={showNativeSection}
                            setShowNativeSection={setShowNativeSection}
                            nativeCourses={nativeCourses}
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
                        />

                        {/* Visibilidad por tab — solo CSS classes, sin inline style ── */}
                        <div className={`${styles.columnsContainer} ${!showColumnsSection ? styles.hidden : ''}`}>
                            <CandidateCoursesView
                                canEdit={canEdit}
                                activeTab={activeTab}
                                candidatosExpanded={candidatosExpanded}
                                setCandidatosExpanded={setCandidatosExpanded}
                                candidateCourses={candidateCourses}
                                showCandidateForm={showCandidateForm}
                                setShowCandidateForm={setShowCandidateForm}
                                setEditingCandidateCourse={setEditingCandidateCourse}
                                editingCandidateCourse={editingCandidateCourse}
                                candidateFormData={candidateFormData}
                                setCandidateFormData={setCandidateFormData}
                                handleCandidateFormChange={handleCandidateFormChange}
                                handlePuestoToggle={handlePuestoToggle}
                                handleCreateCandidateCourse={handleCreateCandidateCourse}
                                uploading={uploading}
                                availableCourseTitles={availableCourseTitles}
                                nativeCourses={nativeCourses}
                                filteredCandidates={filteredCandidates}
                                searchQuery={searchQuery}
                                handleEditCandidateCourse={handleEditCandidateCourse}
                                handleDeleteCandidateCourse={handleDeleteCandidateCourse}
                                handleToggleCourseActive={handleToggleCourseActive}
                                handleCandidateCardClick={handleCandidateCardClick}
                            />

                            <MaterialView
                                canEdit={canEdit}
                                activeTab={activeTab}
                                materialExpanded={materialExpanded}
                                setMaterialExpanded={setMaterialExpanded}
                                courses={courses}
                                showCreateForm={showCreateForm}
                                setShowCreateForm={setShowCreateForm}
                                handleCreateCourse={handleCreateCourse}
                                newCourseName={newCourseName}
                                setNewCourseName={setNewCourseName}
                                file={file}
                                setFile={setFile}
                                presentationLink={presentationLink}
                                setPresentationLink={setPresentationLink}
                                uploading={uploading}
                                filteredMaterial={filteredMaterial}
                                searchQuery={searchQuery}
                                handleDeleteCourse={handleDeleteCourse}
                            />
                        </div>

                        <GalleryView
                            canEdit={canEdit}
                            activeTab={activeTab}
                            galleryExpanded={galleryExpanded}
                            setGalleryExpanded={setGalleryExpanded}
                            galleryItems={galleryItems}
                            setGalleryFile={setGalleryFile}
                            setGalleryName={setGalleryName}
                            setGalleryProgress={setGalleryProgress}
                            setGalleryType={setGalleryType}
                            setShowGalleryModal={setShowGalleryModal}
                            filteredGallery={filteredGallery}
                            searchQuery={searchQuery}
                            setSelectedMedia={setSelectedMedia}
                            handleGalleryDelete={handleGalleryDelete}
                        />

                    </main>
                </div>

                {/* ══ MODAL: Nuevo Curso Interactivo (Wizard) ══ */}
                {showNewCourseModal && (
                    <CourseWizardModal
                        onComplete={handleConfirmNewCourse}
                        onCancel={() => setShowNewCourseModal(false)}
                    />
                )}

                {/* ══ MODAL: Galería Upload ══ */}
                {showGalleryModal && (
                    <div
                        className={styles.galleryModalBackdrop}
                        onClick={(e) => { if (e.target === e.currentTarget) setShowGalleryModal(false); }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Subir archivo a galería"
                    >
                        <div className={styles.galleryModalBox}>
                            <button
                                type="button"
                                className={styles.closeModalBtn}
                                onClick={() => setShowGalleryModal(false)}
                                aria-label="Cerrar modal"
                            >
                                <X size={14} aria-hidden="true" />
                            </button>
                            <div className={styles.galleryModalHeader}>
                                <UploadCloud size={22} className={styles.galleryModalIcon} aria-hidden="true" />
                                <h2>Subir a Galería</h2>
                                <p>Sube una imagen o video y asígnale un nombre.</p>
                            </div>
                            <div className={styles.galleryTypeSelector}>
                                {['imagen', 'video'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        className={`${styles.galleryTypeBtn} ${galleryType === t ? styles.galleryTypeBtnActive : ''}`}
                                        onClick={() => { setGalleryType(t); setGalleryFile(null); if (galleryFileRef.current) galleryFileRef.current.value = ''; }}
                                        disabled={galleryUploading}
                                    >
                                        {t === 'imagen' ? <Image size={14} aria-hidden="true" /> : <Video size={14} aria-hidden="true" />}
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="gallery-name">Nombre</label>
                                <input
                                    id="gallery-name"
                                    className={styles.input}
                                    placeholder={galleryType === 'imagen' ? 'Ej. Logo empresa' : 'Ej. Video bienvenida'}
                                    value={galleryName}
                                    onChange={e => setGalleryName(e.target.value)}
                                    disabled={galleryUploading}
                                />
                            </div>
                            <label className={`${styles.galleryFileLabel} ${galleryFile ? styles.galleryFileLabelActive : ''}`}>
                                <input
                                    ref={galleryFileRef}
                                    type="file"
                                    accept={galleryType === 'imagen'
                                        ? 'image/jpeg,image/png,image/webp,image/gif'
                                        : 'video/mp4,video/webm,video/quicktime'}
                                    className={styles.galleryFileInput}
                                    onChange={e => { const f = e.target.files?.[0]; if (f) { setGalleryFile(f); if (!galleryName) setGalleryName(f.name.replace(/\.[^.]+$/, '')); } }}
                                    disabled={galleryUploading}
                                />
                                {galleryFile
                                    ? <><Check size={14} aria-hidden="true" /> {galleryFile.name}</>
                                    : <><Upload size={14} aria-hidden="true" /> {galleryType === 'imagen' ? 'Seleccionar imagen' : 'Seleccionar video'}</>
                                }
                            </label>
                            {galleryUploading && (
                                <div className={styles.galleryProgressWrap} role="progressbar" aria-valuenow={galleryProgress} aria-valuemin={0} aria-valuemax={100}>
                                    <div className={styles.galleryProgressBar} style={{ width: `${galleryProgress}%` }} />
                                    <span className={styles.galleryProgressText}>{galleryProgress}%</span>
                                </div>
                            )}
                            <div className={styles.galleryModalActions}>
                                <button
                                    type="button"
                                    className={styles.toggleBtn}
                                    onClick={() => setShowGalleryModal(false)}
                                    disabled={galleryUploading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className={styles.newCourseBtn}
                                    onClick={handleGalleryUpload}
                                    disabled={galleryUploading || !galleryFile || !galleryName.trim()}
                                >
                                    <UploadCloud size={13} aria-hidden="true" />
                                    {galleryUploading ? 'Subiendo...' : 'Subir'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ LIGHTBOX ══ */}
                {selectedMedia && (
                    <div
                        className={styles.lightboxBackdrop}
                        onClick={() => setSelectedMedia(null)}
                        role="dialog"
                        aria-modal="true"
                        aria-label={`Ver ${selectedMedia.nombre}`}
                    >
                        <button
                            type="button"
                            className={styles.lightboxCloseBtn}
                            onClick={() => setSelectedMedia(null)}
                            aria-label="Cerrar vista previa"
                        >
                            <X size={24} aria-hidden="true" />
                        </button>
                        <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
                            {selectedMedia.tipo === 'imagen' ? (
                                <img
                                    src={selectedMedia.viewLink}
                                    alt={selectedMedia.nombre}
                                    className={styles.lightboxImage}
                                />
                            ) : (
                                <video
                                    src={selectedMedia.viewLink}
                                    controls
                                    autoPlay
                                    className={styles.lightboxVideo}
                                />
                            )}
                            <div className={styles.lightboxCaption}>{selectedMedia.nombre}</div>
                        </div>
                    </div>
                )}

                {confirmDialog}
            </div>
        </>
    );
}