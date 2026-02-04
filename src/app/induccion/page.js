'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { uploadFile } from '@/lib/upload';
import { collection, query, where, getDocs, addDoc, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { Combobox } from '@/components/ui/Combobox/Combobox';
import { useToast } from '@/components/ui/Toast/Toast';
import Navbar from '@/components/Navbar/Navbar';

import inductionData from '@/data/induction_data.json';
import produccionOrgData from '@/data/produccion_org.json';
import puestosData from '../../../puestos.json';
import { migrateInstructorsToFirebase } from '@/lib/migrateInstructors';
import styles from './page.module.css';

// --- CONFIGURACIÓN Y CONSTANTES ---
const BOSS_ID = '3160';
const COORD_REC_ID = '3373';
const ANALYST_IDS = ['3376', '3884'];
const RH_IDS = [BOSS_ID, COORD_REC_ID, ...ANALYST_IDS, '2099', '3204', '3818', '3853'];

// Procesamiento de Producción
const produccionIds = produccionOrgData.map(p => p.employeeId);
const produccionTitlesMap = produccionOrgData.reduce((acc, p) => {
    if (p.titulo) acc[p.employeeId] = p.titulo;
    return acc;
}, {});

// Mapa de Títulos Profesionales
const titlesMap = {
    '3160': 'Lic.', '3373': 'Lic.', '3376': 'Lic.', '3884': 'Lic.', '2099': 'Lic.', '3818': 'Lic.',
    '3204': 'Lic.', '3853': 'Ing.', '3536': 'Ing.', '3537': 'Ing.', '2571': 'Ing.', '2172': 'Ing.', '2193': 'Ing.'
};

// --- COMPONENTES AUXILIARES ---
const OrgCard = ({ member, roleClass, subjects = [], onClick, title }) => {
    if (!member) return null;
    const displayTitle = title || titlesMap[member.employeeId] || produccionTitlesMap[member.employeeId] || '';

    return (
        <div className={`${styles.orgCard} ${roleClass ? styles[roleClass] : ''}`} onClick={() => onClick(member)}>
            <div className={styles.orgAvatar}>
                <Avatar name={member.name} src={member.photoUrl} size="xl" />
            </div>
            <h4 className={styles.orgName}>
                {displayTitle && <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>{displayTitle} </span>}
                {member.name}
            </h4>
            <span className={styles.orgRole}>{member.position || 'N/A'}</span>

            {subjects.length > 0 && (
                <div className={styles.instructorSubjects}>
                    {subjects.slice(0, 2).map((sub, i) => (
                        <span key={i} className={styles.subjectBadge}>{sub}</span>
                    ))}
                    {subjects.length > 2 && (
                        <span className={styles.subjectBadge}>+{subjects.length - 2}</span>
                    )}
                </div>
            )}
        </div>
    );
};

// Función helper para chunks
const chunkArray = (array, size) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) chunked.push(array.slice(i, i + size));
    return chunked;
};

// --- COMPONENTE PRINCIPAL ---
export default function InductionPage() {
    const { user, canWrite } = useAuth(); // Added canWrite for admin check
    const { toast } = useToast();

    // UI States
    const [activeTab, setActiveTab] = useState('rh');
    const [employeesMap, setEmployeesMap] = useState({});
    const [loadingTeam, setLoadingTeam] = useState(true);
    const [courses, setCourses] = useState([]);
    const [candidateCourses, setCandidateCourses] = useState([]);
    const [availableCourseTitles, setAvailableCourseTitles] = useState([]);

    // Dynamic Instructors Data
    const [instructorsMap, setInstructorsMap] = useState({});
    const [instructorIds, setInstructorIds] = useState([]);

    // Interaction States
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showCandidateForm, setShowCandidateForm] = useState(false);
    const [previewCourse, setPreviewCourse] = useState(null);
    const [previewEmp, setPreviewEmp] = useState(null);

    // Collapsible sections state
    const [materialExpanded, setMaterialExpanded] = useState(true);
    const [candidatosExpanded, setCandidatosExpanded] = useState(true);

    // Candidate Course Form States
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

    // Load instructors from Firebase
    useEffect(() => {
        const loadInstructors = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'instructors'));
                const newMap = {};
                const newIds = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const empId = data.employeeId;
                    newMap[empId] = data.courses || [];
                    newIds.push(empId);
                });

                setInstructorsMap(newMap);
                setInstructorIds(newIds);

                // If empty and we have local file logic (we might want to trigger migration manually)
                if (newIds.length === 0) {
                    console.log("No instructors in Firebase.");
                }

            } catch (err) {
                console.error("Error loading instructors:", err);
            }
        };

        loadInstructors();
    }, []);

    const handleMigrate = async () => {
        if (!confirm("¿Migrar instructores desde JSON local a Firebase?")) return;
        const result = await migrateInstructorsToFirebase();
        if (result.success) {
            toast.success("Migración exitosa", `Se migraron ${result.count} instructores.`);
            window.location.reload();
        } else {
            toast.error("Error", result.message || result.error);
        }
    };


    // Form States
    const [newCourseName, setNewCourseName] = useState('');
    const [file, setFile] = useState(null);
    const [presentationLink, setPresentationLink] = useState('');
    const [uploading, setUploading] = useState(false);

    const canEdit = user?.rol === 'super_admin';

    // Fetch Team Data
    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const allIdsToFetch = [...new Set([...RH_IDS, ...instructorIds, ...produccionIds])];
                const idChunks = chunkArray(allIdsToFetch, 10);
                const fetchPromises = idChunks.map(chunk => getDocs(query(collection(db, 'training_records'), where('employeeId', 'in', chunk))));
                const snapshots = await Promise.all(fetchPromises);

                const empData = {};
                snapshots.forEach(snapshot => {
                    snapshot.docs.forEach(doc => {
                        const data = doc.data();
                        empData[data.employeeId] = { id: doc.id, ...data };
                    });
                });
                setEmployeesMap(empData);
            } catch (error) {
                console.error(error);
                toast.error("Error", "No se pudo cargar la información del equipo");
            } finally {
                setLoadingTeam(false);
            }
        };
        fetchTeam();
    }, [toast, instructorIds]);

    // Fetch Courses
    useEffect(() => {
        const q = query(collection(db, 'induction_courses'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCourses(coursesData);
            // Extract unique course titles for Combobox
            const titles = coursesData.map(c => c.title).filter(Boolean).sort();
            setAvailableCourseTitles(titles);
        });
        return () => unsubscribe();
    }, []);

    // Fetch Candidate Courses
    useEffect(() => {
        const q = query(collection(db, 'cursos_induccion'), orderBy('orden', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCandidateCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const { boss, coordRec, analysts, othersRh } = useMemo(() => {
        return {
            boss: employeesMap[BOSS_ID],
            coordRec: employeesMap[COORD_REC_ID],
            analysts: RH_IDS.filter(id => ANALYST_IDS.includes(id)).map(id => employeesMap[id]).filter(Boolean),
            othersRh: RH_IDS.filter(id => !ANALYST_IDS.includes(id) && id !== BOSS_ID && id !== COORD_REC_ID).map(id => employeesMap[id]).filter(Boolean)
        };
    }, [employeesMap]);

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

            toast.success('Éxito', 'Curso creado');
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
        if (window.confirm('¿Borrar curso?')) {
            await deleteDoc(doc(db, 'induction_courses', courseId));
            toast.success('Borrado', 'Curso eliminado');
        }
    };

    // Candidate Course Handlers
    const handleCandidateFormChange = async (field, value) => {
        setCandidateFormData(prev => ({ ...prev, [field]: value }));

        // Auto-populate positions when course name is selected
        if (field === 'nombre' && value) {
            try {
                // Query positions collection to find which positions require this course
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
                    setCandidateFormData(prev => ({
                        ...prev,
                        nombre: value,
                        puestosAplicables: matchingPositions
                    }));
                    toast.success('Auto-asignado', `${matchingPositions.length} puesto(s) seleccionado(s) automáticamente`);
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

    // State for editing candidate courses
    const [editingCandidateCourse, setEditingCandidateCourse] = useState(null);

    const handleCreateCandidateCourse = async (e) => {
        e.preventDefault();
        if (!canEdit) return;
        if (!candidateFormData.nombre.trim()) return toast.warning('Atención', 'El nombre del curso es obligatorio');
        if (!candidateFormData.contenidoUrl.trim()) return toast.warning('Atención', 'La URL de presentación es obligatoria');
        if (candidateFormData.puestosAplicables.length === 0) return toast.warning('Atención', 'Selecciona al menos un puesto');

        setUploading(true);
        try {
            if (editingCandidateCourse) {
                // UPDATE logic
                await updateDoc(doc(db, 'cursos_induccion', editingCandidateCourse.id), {
                    ...candidateFormData,
                    updatedAt: new Date().toISOString()
                });
                toast.success('Actualizado', 'Curso actualizado exitosamente');
            } else {
                // CREATE logic
                await addDoc(collection(db, 'cursos_induccion'), {
                    ...candidateFormData,
                    activo: true,
                    creadoPor: user?.uid || 'unknown',
                    createdAt: new Date().toISOString()
                });
                toast.success('Creado', 'Curso creado exitosamente');
            }

            // Reset Form
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
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };

    const handleDeleteCandidateCourse = async (e, courseId) => {
        e.stopPropagation();
        if (!canEdit) return;
        if (window.confirm('¿Borrar este curso de candidatos?')) {
            await deleteDoc(doc(db, 'cursos_induccion', courseId));
            toast.success('Borrado', 'Curso eliminado');
        }
    };

    const handleToggleCourseActive = async (courseId, currentStatus) => {
        if (!canEdit) return;
        try {
            await updateDoc(doc(db, 'cursos_induccion', courseId), {
                activo: !currentStatus
            });
            toast.success('Actualizado', `Curso ${!currentStatus ? 'activado' : 'desactivado'}`);
        } catch (error) {
            toast.error('Error', error.message);
        }
    };

    return (
        <div className={styles.main}>
            {/* Navbar Global */}
            <Navbar />

            {/* Background Effects */}
            <div className={styles.bgDecoration}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
            </div>

            <div className={styles.container}>
                {/* Back Link */}
                <Link href="/modulos" className={styles.backLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5" />
                        <path d="M12 19l-7-7 7-7" />
                    </svg>
                    Volver
                </Link>

                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.titleSection}>
                        <h1>Módulo de Inducción</h1>
                        <p>Bienvenido al proceso de inducción en ViñoPlastic QRO.</p>
                    </div>
                </header>

                {/* Team Section */}
                <section className={styles.orgSection}>
                    <div className={styles.coursesHeader}>
                        <h2 className={styles.sectionTitle}>Conoce al Equipo</h2>
                        <div className={styles.tabsContainer} style={{ marginBottom: 0 }}>
                            <button onClick={() => setActiveTab('rh')} className={`${styles.tabBtn} ${activeTab === 'rh' ? styles.activeTab : ''}`}>RH</button>
                            <button onClick={() => setActiveTab('instructors')} className={`${styles.tabBtn} ${activeTab === 'instructors' ? styles.activeTab : ''}`}>Instructores</button>
                            <button onClick={() => setActiveTab('produccion')} className={`${styles.tabBtn} ${activeTab === 'produccion' ? styles.activeTab : ''}`}>Producción</button>
                        </div>

                    </div>

                    {loadingTeam ? (
                        <div className={styles.loadingContainer}>
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'rh' && (
                                <div className={styles.orgChart}>
                                    <div className={styles.levelRow}>
                                        <OrgCard member={boss} roleClass="cardBoss" onClick={setPreviewEmp} />
                                    </div>
                                    <div className={styles.levelSpacing}></div>
                                    {coordRec && (
                                        <>
                                            <div className={styles.levelRow}>
                                                <OrgCard member={coordRec} roleClass="cardCoord" onClick={setPreviewEmp} />
                                            </div>
                                            <div className={styles.levelSpacing}></div>
                                        </>
                                    )}
                                    <div className={styles.levelRow}>
                                        {analysts.map(member => (
                                            <OrgCard key={member.id} member={member} roleClass="cardAnalyst" onClick={setPreviewEmp} />
                                        ))}
                                    </div>
                                    {othersRh.length > 0 && (
                                        <div className={styles.instructorsGrid}>
                                            <div className={styles.teamDivider}><span>Otros Integrantes</span></div>
                                            {othersRh.map(member => (
                                                <OrgCard key={member.id} member={member} roleClass="cardCoord" onClick={setPreviewEmp} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'instructors' && (
                                <div className={styles.orgChart}>
                                    {employeesMap['3204'] && (
                                        <div className={styles.levelRow}>
                                            <OrgCard member={employeesMap['3204']} roleClass="cardBoss" subjects={instructorsMap['3204']} onClick={setPreviewEmp} />
                                        </div>
                                    )}
                                    <div className={styles.instructorsGrid}>
                                        <div className={styles.teamDivider}><span>Instructores Certificados</span></div>
                                        {instructorIds.filter(id => id !== '3204').map(id => employeesMap[id] ? (
                                            <OrgCard key={id} member={employeesMap[id]} roleClass="cardInstructor" subjects={instructorsMap[id]} onClick={setPreviewEmp} />
                                        ) : null)}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'produccion' && (
                                <div className={styles.orgChart}>
                                    {employeesMap['1130'] && (
                                        <div className={styles.levelRow}>
                                            <OrgCard member={employeesMap['1130']} roleClass="cardBoss" onClick={setPreviewEmp} />
                                        </div>
                                    )}
                                    <div className={styles.levelSpacing}></div>
                                    <div className={styles.levelRow}>
                                        {['1131', '1694'].map(id => employeesMap[id] && (
                                            <OrgCard key={id} member={employeesMap[id]} roleClass="cardCoord" onClick={setPreviewEmp} />
                                        ))}
                                    </div>
                                    <div className={styles.instructorsGrid}>
                                        <div className={styles.teamDivider}><span>Supervisores</span></div>
                                        {produccionOrgData.filter(p => p.reportsTo === '1694').map(p => employeesMap[p.employeeId] ? (
                                            <OrgCard key={p.employeeId} member={employeesMap[p.employeeId]} roleClass="cardAnalyst" onClick={setPreviewEmp} />
                                        ) : null)}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* Courses Section */}
                <section>
                    <div className={styles.coursesHeader}>
                        <h2
                            className={styles.sectionTitle}
                            style={{ marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                            onClick={() => setMaterialExpanded(!materialExpanded)}
                        >
                            <svg
                                width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2"
                                style={{ transition: 'transform 0.2s', transform: materialExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                            Material de Inducción
                            <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'var(--text-tertiary)' }}>
                                ({courses.length})
                            </span>
                        </h2>
                        {canEdit && (
                            <button className={styles.toggleBtn} onClick={() => setShowCreateForm(!showCreateForm)}>
                                {showCreateForm ? 'Cancelar' : '+ Nuevo Curso'}
                            </button>
                        )}
                    </div>

                    {materialExpanded && (
                        <>
                            {showCreateForm && canEdit && (
                                <div className={styles.createCourseContainer}>
                                    <form onSubmit={handleCreateCourse} className={styles.createCourseForm}>
                                        <div className={styles.inputGroup}>
                                            <label>Nombre del Material</label>
                                            <input className={styles.input} value={newCourseName} onChange={e => setNewCourseName(e.target.value)} placeholder="Ej. Manual de Bienvenida..." />
                                        </div>
                                        <div className={styles.inputGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '15px' }}>
                                            <input type="file" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} id="fileUpload" />
                                            <label htmlFor="fileUpload" className={styles.fileBtn}>{file ? 'Archivo Seleccionado' : '📎 Subir PDF'}</label>
                                            <span style={{ color: 'var(--text-tertiary)' }}>o</span>
                                            <input className={styles.input} placeholder="Pegar enlace externo..." value={presentationLink} onChange={e => setPresentationLink(e.target.value)} style={{ flex: 1 }} />
                                        </div>
                                        <Button type="submit" disabled={uploading} style={{ alignSelf: 'flex-start' }}>{uploading ? 'Subiendo...' : 'Publicar Material'}</Button>
                                    </form>
                                </div>
                            )}

                            <div className={styles.coursesGrid}>
                                {courses.map(course => (
                                    <div key={course.id} className={styles.courseCard} onClick={() => setPreviewCourse(course)}>
                                        <div className={styles.cardTopColor} style={{ background: course.material?.type === 'link' ? '#FF9500' : '#FF3B30' }}></div>
                                        {canEdit && <button className={styles.deleteBtn} onClick={(e) => handleDeleteCourse(e, course.id)}>✕</button>}
                                        <div className={styles.cardContent}>
                                            <div>
                                                <h3 className={styles.courseTitle}>{course.title}</h3>
                                                <span className={styles.courseTypeBadge}>
                                                    {course.material?.type === 'link' ? 'Presentación' : 'Documento PDF'}
                                                </span>
                                            </div>
                                            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                    <polyline points="15 3 21 3 21 9" />
                                                    <line x1="10" y1="14" x2="21" y2="3" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </section>



                {/* Candidate Courses Section */}
                {canEdit && (
                    <section style={{ marginBottom: '60px' }}>
                        <div className={styles.coursesHeader}>
                            <h2
                                className={styles.sectionTitle}
                                style={{ marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                onClick={() => setCandidatosExpanded(!candidatosExpanded)}
                            >
                                <svg
                                    width="20" height="20" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2"
                                    style={{ transition: 'transform 0.2s', transform: candidatosExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                >
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                                Cursos de Candidatos
                                <span style={{ fontSize: '0.8rem', fontWeight: '400', color: 'var(--text-tertiary)' }}>
                                    ({candidateCourses.length})
                                </span>
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
                                {showCandidateForm ? 'Cancelar' : '+ Nuevo Curso'}
                            </button>
                        </div>

                        {candidatosExpanded && (
                            <>

                                {showCandidateForm && (
                                    <div className={styles.createCourseContainer}>
                                        <h3 style={{ marginBottom: '20px' }}>{editingCandidateCourse ? 'Editar Curso' : 'Nuevo Curso'}</h3>
                                        <form onSubmit={handleCreateCandidateCourse} className={styles.createCourseForm}>
                                            <Combobox
                                                label="Nombre del Curso *"
                                                value={candidateFormData.nombre}
                                                onChange={(value) => handleCandidateFormChange('nombre', value)}
                                                options={availableCourseTitles}
                                                placeholder="Seleccionar curso existente..."
                                                searchPlaceholder="Buscar curso..."
                                                required
                                            />

                                            <div className={styles.inputGroup}>
                                                <label>Descripción</label>
                                                <textarea
                                                    className={styles.input}
                                                    value={candidateFormData.descripcion}
                                                    onChange={e => handleCandidateFormChange('descripcion', e.target.value)}
                                                    placeholder="Breve descripción del curso..."
                                                    rows={3}
                                                />
                                            </div>

                                            <div className={styles.inputGroup}>
                                                <label>URL de Presentación (Google Drive / OneDrive) *</label>
                                                <input
                                                    className={styles.input}
                                                    value={candidateFormData.contenidoUrl}
                                                    onChange={e => handleCandidateFormChange('contenidoUrl', e.target.value)}
                                                    placeholder="Pegar link de 'Compartir' o 'Embed'..."
                                                />
                                                <small style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                                                    Soporta Google Drive y OneDrive (Links de compartir o IFRAME)
                                                </small>
                                            </div>

                                            <div className={styles.inputGroup}>
                                                <label>URL de Examen (Google Drive)</label>
                                                <input
                                                    className={styles.input}
                                                    value={candidateFormData.examenUrl}
                                                    onChange={e => handleCandidateFormChange('examenUrl', e.target.value)}
                                                    placeholder="https://drive.google.com/file/d/... (opcional)"
                                                />
                                            </div>

                                            <div className={styles.inputGroup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <div>
                                                    <label>Duración (min)</label>
                                                    <input
                                                        type="number"
                                                        className={styles.input}
                                                        value={candidateFormData.duracionEstimada}
                                                        onChange={e => handleCandidateFormChange('duracionEstimada', parseInt(e.target.value) || 0)}
                                                        min="1"
                                                    />
                                                </div>
                                                <div>
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
                                                <label>Puestos Aplicables * ({candidateFormData.puestosAplicables.length} seleccionados)</label>
                                                <div className={styles.puestosCheckboxContainer}>
                                                    {puestosData.map((p, idx) => (
                                                        <label
                                                            key={idx}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                padding: '6px 0',
                                                                cursor: 'pointer',
                                                                fontSize: '0.9rem'
                                                            }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={candidateFormData.puestosAplicables.includes(p.puesto)}
                                                                onChange={() => handlePuestoToggle(p.puesto)}
                                                            />
                                                            <span>{p.puesto}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <Button type="submit" disabled={uploading} style={{ alignSelf: 'flex-start' }}>
                                                    {uploading ? 'Guardando...' : (editingCandidateCourse ? 'Actualizar Curso' : 'Crear Curso')}
                                                </Button>
                                                {editingCandidateCourse && (
                                                    <button
                                                        type="button"
                                                        className={styles.toggleBtn}
                                                        onClick={() => {
                                                            setEditingCandidateCourse(null);
                                                            setShowCandidateForm(false);
                                                        }}
                                                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                                                    >
                                                        Cancelar Edición
                                                    </button>
                                                )}
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Candidate Courses List */}
                                <div className={styles.coursesGrid} style={{ marginTop: '20px' }}>
                                    {candidateCourses.map(course => (
                                        <div key={course.id} className={styles.courseCard}>
                                            <div className={styles.cardTopColor} style={{ background: course.activo ? '#34C759' : '#8E8E93' }}></div>
                                            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '8px', zIndex: 10 }}>
                                                <button
                                                    className={styles.editBtn}
                                                    onClick={(e) => handleEditCandidateCourse(e, course)}
                                                    title="Editar"
                                                    style={{
                                                        background: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer'
                                                    }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                    </svg>
                                                </button>
                                                <button className={styles.deleteBtn} onClick={(e) => handleDeleteCandidateCourse(e, course.id)} style={{ position: 'static' }}>✕</button>
                                            </div>

                                            <div className={styles.cardContent}>
                                                <div>
                                                    <h3 className={styles.courseTitle}>{course.nombre}</h3>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
                                                        {course.descripcion || 'Sin descripción'}
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                                        <span className={styles.courseTypeBadge}>
                                                            {course.puestosAplicables?.length || 0} puestos
                                                        </span>
                                                        <span className={styles.courseTypeBadge}>
                                                            {course.duracionEstimada} min
                                                        </span>
                                                        <span className={styles.courseTypeBadge}>
                                                            Orden: {course.orden}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className={styles.toggleBtn}
                                                        onClick={() => handleToggleCourseActive(course.id, course.activo)}
                                                        style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                                                    >
                                                        {course.activo ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {candidateCourses.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                            <p>No hay cursos de candidatos. Crea uno usando el botón &quot;+ Nuevo Curso&quot;</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </section>
                )}
            </div>

            {/* Modals */}
            {previewCourse && (
                <div className={styles.modalBackdrop} onClick={() => setPreviewCourse(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeModalBtn} onClick={() => setPreviewCourse(null)}>✕</button>
                        <h2 style={{ marginBottom: '20px' }}>{previewCourse.title}</h2>
                        <Button onClick={() => window.open(previewCourse.material?.url, '_blank')}>
                            {previewCourse.material?.type === 'link' ? 'Abrir Presentación' : 'Ver Documento'}
                        </Button>
                    </div>
                </div>
            )}

            {previewEmp && (
                <div className={styles.modalBackdrop} onClick={() => setPreviewEmp(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeModalBtn} onClick={() => setPreviewEmp(null)}>✕</button>
                        <div className={styles.orgAvatar} style={{ width: '120px', height: '120px', margin: '0 auto 20px' }}>
                            <Avatar name={previewEmp.name} src={previewEmp.photoUrl} size="xl" style={{ width: '100%', height: '100%', fontSize: '2rem' }} />
                        </div>
                        <h3 className={styles.sectionTitle} style={{ margin: 0, fontSize: '1.5rem', marginBottom: '8px' }}>{previewEmp.name}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '24px' }}>{previewEmp.position}</p>

                        {instructorsMap[previewEmp.employeeId] && (
                            <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '16px', textAlign: 'left' }}>
                                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>Cursos que imparte</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {instructorsMap[previewEmp.employeeId].map((sub, i) => (
                                        <span key={i} className={styles.subjectBadge} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>{sub}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}