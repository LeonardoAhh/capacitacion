'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { uploadFile } from '@/lib/upload';
import { collection, query, where, getDocs, addDoc, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import Navbar from '@/components/Navbar/Navbar';
import TriviaGame from '@/components/TriviaGame/TriviaGame';
import inductionData from '@/data/induction_data.json';
import produccionOrgData from '@/data/produccion_org.json';
import styles from './page.module.css';

// Optional import - may not exist in production
let instructoresData = [];
try {
    instructoresData = require('@/data/instructores.json');
} catch (e) {
    console.log('instructores.json not found');
}

// --- CONFIGURACIÓN Y CONSTANTES ---
const BOSS_ID = '3160';
const COORD_REC_ID = '3373';
const ANALYST_IDS = ['3376', '3884'];
const RH_IDS = [BOSS_ID, COORD_REC_ID, ...ANALYST_IDS, '2099', '3204', '3818', '3853'];

// Procesamiento de Instructores (Estático)
const instructorsMap = instructoresData.reduce((acc, item) => {
    if (!acc[item.employeeId]) acc[item.employeeId] = [];
    acc[item.employeeId].push(item['curso que imparte']);
    return acc;
}, {});
const instructorIds = Object.keys(instructorsMap);

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
    const { user } = useAuth();
    const { toast } = useToast();

    // UI States
    const [activeTab, setActiveTab] = useState('rh');
    const [employeesMap, setEmployeesMap] = useState({});
    const [loadingTeam, setLoadingTeam] = useState(true);
    const [courses, setCourses] = useState([]);

    // Interaction States
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [previewCourse, setPreviewCourse] = useState(null);
    const [previewEmp, setPreviewEmp] = useState(null);

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
    }, [toast]);

    // Fetch Courses
    useEffect(() => {
        const q = query(collection(db, 'induction_courses'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
                        <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Material de Inducción</h2>
                        {canEdit && (
                            <button className={styles.toggleBtn} onClick={() => setShowCreateForm(!showCreateForm)}>
                                {showCreateForm ? 'Cancelar' : '+ Nuevo Curso'}
                            </button>
                        )}
                    </div>

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
                                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                            <polyline points="15 3 21 3 21 9" />
                                            <line x1="10" y1="14" x2="21" y2="3" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Trivia Game */}
                <section style={{ marginBottom: '60px' }}>
                    <h2 className={styles.sectionTitle}>Pon a prueba tu conocimiento</h2>
                    <TriviaGame data={inductionData} />
                </section>
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