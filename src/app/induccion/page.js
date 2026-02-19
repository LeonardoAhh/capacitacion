'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { uploadFile } from '@/lib/upload';
import { collection, query, getDocs, addDoc, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button/Button';
import { Combobox } from '@/components/ui/Combobox/Combobox';
import { useToast } from '@/components/ui/Toast/Toast';
import { ChevronRight, Plus, FileText, Link2, Trash2, Edit3, ExternalLink, X, Check } from 'lucide-react';
import ProfileDropdown from '@/components/ProfileDropdown/ProfileDropdown';
import BackButton from '@/components/ui/BackButton/BackButton';

import puestosData from '../../../puestos.json';
import styles from './page.module.css';

export default function InductionPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [courses, setCourses] = useState([]);
    const [candidateCourses, setCandidateCourses] = useState([]);
    const [availableCourseTitles, setAvailableCourseTitles] = useState([]);

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showCandidateForm, setShowCandidateForm] = useState(false);
    const [previewCourse, setPreviewCourse] = useState(null);

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
        orden: 1
    });

    const [newCourseName, setNewCourseName] = useState('');
    const [file, setFile] = useState(null);
    const [presentationLink, setPresentationLink] = useState('');
    const [uploading, setUploading] = useState(false);
    const [editingCandidateCourse, setEditingCandidateCourse] = useState(null);

    const canEdit = user?.rol === 'super_admin';

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    useEffect(() => {
        const q = query(collection(db, 'induction_courses'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCourses(coursesData);
            setAvailableCourseTitles(coursesData.map(c => c.title).filter(Boolean).sort());
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const q = query(collection(db, 'cursos_induccion'), orderBy('orden', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCandidateCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

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
            setNewCourseName('');
            setFile(null);
            setPresentationLink('');
            setShowCreateForm(false);
        } catch (error) {
            toast.error('Error', error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteCourse = async (e, courseId) => {
        e.stopPropagation();
        if (!canEdit) return;
        if (window.confirm('¿Borrar este material?')) {
            await deleteDoc(doc(db, 'induction_courses', courseId));
            toast.success('Borrado', 'Material eliminado');
        }
    };

    const handleCandidateFormChange = async (field, value) => {
        setCandidateFormData(prev => ({ ...prev, [field]: value }));
        if (field === 'nombre' && value) {
            try {
                const positionsRef = collection(db, 'positions');
                const positionsSnapshot = await getDocs(positionsRef);
                const matchingPositions = [];
                positionsSnapshot.docs.forEach(doc => {
                    const positionData = doc.data();
                    if (positionData.requiredCourses && positionData.requiredCourses.includes(value)) {
                        matchingPositions.push(positionData.name);
                    }
                });
                if (matchingPositions.length > 0) {
                    setCandidateFormData(prev => ({ ...prev, nombre: value, puestosAplicables: matchingPositions }));
                    toast.success('Auto-asignado', `${matchingPositions.length} puesto(s)`);
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
        if (!candidateFormData.contenidoUrl.trim()) return toast.warning('Atención', 'La URL es obligatoria');
        if (candidateFormData.puestosAplicables.length === 0) return toast.warning('Atención', 'Selecciona al menos un puesto');

        setUploading(true);
        try {
            if (editingCandidateCourse) {
                await updateDoc(doc(db, 'cursos_induccion', editingCandidateCourse.id), {
                    ...candidateFormData,
                    updatedAt: new Date().toISOString()
                });
                toast.success('Actualizado', 'Curso actualizado');
            } else {
                await addDoc(collection(db, 'cursos_induccion'), {
                    ...candidateFormData,
                    activo: true,
                    creadoPor: user?.uid || 'unknown',
                    createdAt: new Date().toISOString()
                });
                toast.success('Creado', 'Curso creado');
            }
            setShowCandidateForm(false);
            setEditingCandidateCourse(null);
            setCandidateFormData({
                nombre: '',
                descripcion: '',
                contenidoUrl: '',
                examenUrl: '',
                puestosAplicables: [],
                duracionEstimada: 30,
                obligatorio: true,
                orden: candidateCourses.length + 1
            });
        } catch (error) {
            console.error('Error saving candidate course:', error);
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
            orden: course.orden || 1
        });
        setShowCandidateForm(true);
    };

    const handleDeleteCandidateCourse = async (e, courseId) => {
        e.stopPropagation();
        if (!canEdit) return;
        if (window.confirm('¿Borrar este curso?')) {
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

    if (authLoading || !user) {
        return (
            <div className={styles.main}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.main}>
            <div className={styles.profileContainer}>
                <ProfileDropdown />
            </div>
            <div className={styles.bgDecoration}></div>

            <div className={styles.container}>
                <BackButton href="/modulos" />

                <header className={styles.header}>
                    <div className={styles.titleSection}>
                        <h1>Inducción</h1>
                        <p>Material y cursos de bienvenida</p>
                    </div>
                </header>

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
                                            puestosAplicables: [], duracionEstimada: 30, obligatorio: true, orden: 1
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

                                                <div className={styles.inputGroup}>
                                                    <label>URL de presentación</label>
                                                    <input
                                                        className={styles.input}
                                                        value={candidateFormData.contenidoUrl}
                                                        onChange={e => handleCandidateFormChange('contenidoUrl', e.target.value)}
                                                        placeholder="https://drive.google.com/..."
                                                    />
                                                </div>

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
                                                            onClick={() => {
                                                                setEditingCandidateCourse(null);
                                                                setShowCandidateForm(false);
                                                            }}
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
                                            <div className={styles.emptyState}>
                                                <p>No hay cursos de candidatos</p>
                                            </div>
                                        ) : (
                                            candidateCourses.map(course => (
                                                <div key={course.id} className={styles.courseCard}>
                                                    <div
                                                        className={styles.cardTopColor}
                                                        style={{ background: course.activo ? '#22c55e' : '#94a3b8' }}
                                                    />
                                                    <div className={styles.cardActionsRow}>
                                                        <button
                                                            className={styles.editBtn}
                                                            onClick={(e) => handleEditCandidateCourse(e, course)}
                                                        >
                                                            <Edit3 size={12} />
                                                        </button>
                                                        <button
                                                            className={styles.deleteBtn}
                                                            onClick={(e) => handleDeleteCandidateCourse(e, course.id)}
                                                        >
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
                                                            <span className={styles.courseTypeBadge}>
                                                                {course.puestosAplicables?.length || 0} puestos
                                                            </span>
                                                            <span className={styles.courseTypeBadge}>
                                                                {course.duracionEstimada} min
                                                            </span>
                                                            <button
                                                                className={styles.toggleBtn}
                                                                onClick={() => handleToggleCourseActive(course.id, course.activo)}
                                                                style={{ marginLeft: 'auto' }}
                                                            >
                                                                {course.activo ? 'Desactivar' : 'Activar'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
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
                                        <div className={styles.emptyState}>
                                            <p>No hay material de inducción</p>
                                        </div>
                                    ) : (
                                        courses.map(course => (
                                            <div
                                                key={course.id}
                                                className={styles.courseCard}
                                                onClick={() => setPreviewCourse(course)}
                                            >
                                                <div
                                                    className={styles.cardTopColor}
                                                    style={{ background: course.material?.type === 'link' ? '#f59e0b' : '#ef4444' }}
                                                />
                                                {canEdit && (
                                                    <button
                                                        className={styles.deleteBtn}
                                                        onClick={(e) => handleDeleteCourse(e, course.id)}
                                                    >
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

            {previewCourse && (
                <div className={styles.modalBackdrop} onClick={() => setPreviewCourse(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeModalBtn} onClick={() => setPreviewCourse(null)}>
                            <X size={14} />
                        </button>
                        <h2>{previewCourse.title}</h2>
                        <Button onClick={() => window.open(previewCourse.material?.url, '_blank')}>
                            <ExternalLink size={14} style={{ marginRight: 6 }} />
                            {previewCourse.material?.type === 'link' ? 'Abrir enlace' : 'Ver documento'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
