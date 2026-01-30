'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, onSnapshot, deleteDoc, doc, documentId } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import TriviaGame from '@/components/TriviaGame/TriviaGame';
import inductionData from '@/data/induction_data.json';
import instructoresData from '@/data/instructores.json';
import produccionOrgData from '@/data/produccion_org.json';
import styles from './page.module.css';

// --- CONFIGURACIÓN Y CONSTANTES ---
const BOSS_ID = '3160';
const COORD_REC_ID = '3373';
const ANALYST_IDS = ['3376', '3884'];
const RH_IDS = [BOSS_ID, COORD_REC_ID, ...ANALYST_IDS, '2099', '3204', '3818', '3853'];

// Procesamiento de Instructores (Estático - Fuera del componente para evitar recálculos)
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

// Mapa de Títulos Profesionales (Opción B - Estático)
// Formato: 'employeeId': 'Título'
const titlesMap = {
    // --- RECURSOS HUMANOS ---
    '3160': 'Lic.',    // Jefe RH
    '3373': 'Lic.',    // Coordinador Reclutamiento
    '3376': 'Lic.',    // Analista
    '3884': 'Lic.',    // Analista
    '2099': 'Lic.',    // Otro RH
    '3818': 'Lic.',    // Otro RH

    // --- INSTRUCTORES ---
    '3204': 'Lic.',    // Líder Capacitación
    '3853': 'Ing.',    // Instructor (5S, Seguridad, etc.)
    '3536': 'Ing.',    // Instructor (Reportes, Instrucciones)
    '3537': 'Ing.',    // Instructor (Reportes, Instrucciones)
    '2571': 'Ing.',    // Instructor (SGI, Calidad)
    '2172': 'Ing.',    // Instructor (Familias del Producto)
    '2193': 'Ing.',    // Instructor (Familias del Producto)
    // Agrega más IDs aquí según sea necesario
};

// --- COMPONENTES AUXILIARES ---

// Extraído para evitar re-renderizados innecesarios
const OrgCard = ({ member, roleClass, subjects = [], onClick, title }) => {
    if (!member) return null;

    // Si no se pasa título explícito, buscar en ambos mapas
    const displayTitle = title || titlesMap[member.employeeId] || produccionTitlesMap[member.employeeId] || '';

    return (
        <div className={`${styles.orgCard} ${styles[roleClass]}`} onClick={() => onClick(member)}>
            <div className={styles.orgAvatar}>
                <Avatar name={member.name} src={member.photoUrl} size="xl" />
            </div>
            <h4 className={styles.orgName}>
                {displayTitle && <span style={{ color: '#007AFF', fontWeight: '600' }}>{displayTitle} </span>}
                {member.name}
            </h4>
            <span className={styles.orgRole}>{member.position || 'N/A'}</span>
            {member.shift && <span className={styles.orgShift}>{member.shift}</span>}

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

// Función para dividir arrays grandes (Firestore limita 'in' a lotes de 10-30)
const chunkArray = (array, size) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
};

// --- COMPONENTE PRINCIPAL ---
export default function InductionPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    // UI States
    const [activeTab, setActiveTab] = useState('rh');

    // Data States
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
                // Unimos IDs y eliminamos duplicados
                const allIdsToFetch = [...new Set([...RH_IDS, ...instructorIds, ...produccionIds])];

                // Dividimos en lotes de 10 para evitar errores de límite de Firestore
                const idChunks = chunkArray(allIdsToFetch, 10);
                const fetchPromises = idChunks.map(chunk => {
                    const q = query(collection(db, 'training_records'), where('employeeId', 'in', chunk));
                    return getDocs(q);
                });

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
    }, [toast]); // Dependencia agregada por seguridad linting

    // Fetch Courses (Realtime)
    useEffect(() => {
        const q = query(collection(db, 'induction_courses'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    // Helpers RH (Memoizados para rendimiento)
    const { boss, coordRec, analysts, othersRh } = useMemo(() => {
        const getMember = (id) => employeesMap[id];
        return {
            boss: getMember(BOSS_ID),
            coordRec: getMember(COORD_REC_ID),
            analysts: RH_IDS.filter(id => ANALYST_IDS.includes(id)).map(getMember).filter(Boolean),
            othersRh: RH_IDS.filter(id => !ANALYST_IDS.includes(id) && id !== BOSS_ID && id !== COORD_REC_ID).map(getMember).filter(Boolean)
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
                const formData = new FormData();
                formData.append('file', file);
                formData.append('docType', 'Induccion');
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!res.ok) throw new Error('Error subiendo archivo');
                const data = await res.json();
                fileData = { type: 'file', name: file.name, url: data.data.viewLink, downloadUrl: data.data.downloadLink };
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
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Módulo de Inducción</h1>
                    <p>Bienvenido al proceso de inducción en ViñoPlastic QRO.</p>
                </div>
                <div className={styles.headerActions}>
                    <ThemeToggle />
                    <Link href="/modulos">
                        <Button variant="secondary">Volver al Menú</Button>
                    </Link>
                </div>
            </div>

            <section className={styles.orgSection}>
                <h2 className={styles.sectionTitle}>Conoce al Equipo</h2>

                <div className={styles.tabsContainer}>
                    <button
                        onClick={() => setActiveTab('rh')}
                        className={`${styles.tabBtn} ${activeTab === 'rh' ? styles.activeTab : ''}`}
                    >
                        Recursos Humanos
                    </button>
                    <button
                        onClick={() => setActiveTab('instructors')}
                        className={`${styles.tabBtn} ${activeTab === 'instructors' ? styles.activeTab : ''}`}
                    >
                        Instructores Internos
                    </button>
                    <button
                        onClick={() => setActiveTab('produccion')}
                        className={`${styles.tabBtn} ${activeTab === 'produccion' ? styles.activeTab : ''}`}
                    >
                        Producción
                    </button>
                </div>

                {loadingTeam ? <p>Cargando equipo...</p> : (
                    <>
                        {/* === PESTAÑA RH === */}
                        {activeTab === 'rh' && (
                            <div className={styles.orgChart}>
                                {/* Nivel 1: Jefe */}
                                <div className={styles.levelRow}>
                                    <OrgCard member={boss} roleClass="cardBoss" onClick={setPreviewEmp} />
                                </div>
                                <div className={styles.levelSpacing}></div>

                                {/* Nivel 2: Coordinador */}
                                {coordRec && (
                                    <div className={styles.levelRow}>
                                        <OrgCard member={coordRec} roleClass="cardCoord" onClick={setPreviewEmp} />
                                    </div>
                                )}
                                <div className={styles.levelSpacing}></div>

                                {/* Nivel 3: Analistas */}
                                <div className={styles.levelRow}>
                                    {analysts.map(member => (
                                        <OrgCard key={member.id} member={member} roleClass="cardAnalyst" onClick={setPreviewEmp} />
                                    ))}
                                </div>

                                {/* Nivel 4: Otros */}
                                {othersRh.length > 0 && (
                                    <div className={styles.instructorsGrid}>
                                        <div className={styles.teamDivider}><span>Integrantes</span></div>
                                        {othersRh.map(member => (
                                            <OrgCard key={member.id} member={member} roleClass="cardCoord" onClick={setPreviewEmp} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === PESTAÑA INSTRUCTORES === */}
                        {activeTab === 'instructors' && (
                            <div className={styles.orgChart}>
                                <h3 style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '20px' }}>Liderazgo de Capacitación</h3>

                                {/* Nivel 1: Líder 3204 */}
                                {employeesMap['3204'] && (
                                    <div className={styles.levelRow}>
                                        <OrgCard
                                            member={employeesMap['3204']}
                                            roleClass="cardBoss"
                                            subjects={instructorsMap['3204']}
                                            onClick={setPreviewEmp}
                                        />
                                    </div>
                                )}

                                {/* Nivel 2 y 3 movidos a grid general */}

                                {/* Nivel 2, 3, 4: Grid General */}
                                {instructorIds.filter(id => id !== '3204').length > 0 && (
                                    <div className={styles.instructorsGrid}>
                                        <div className={styles.teamDivider}><span>Instructores Certificados</span></div>
                                        {instructorIds
                                            .filter(id => id !== '3204')
                                            .map(id => employeesMap[id] ? (
                                                <OrgCard
                                                    key={id}
                                                    member={employeesMap[id]}
                                                    roleClass="cardInstructor"
                                                    subjects={instructorsMap[id]}
                                                    onClick={setPreviewEmp}
                                                />
                                            ) : null)
                                        }
                                    </div>
                                )}
                            </div>
                        )}

                        {/* === PESTAÑA PRODUCCIÓN === */}
                        {activeTab === 'produccion' && (
                            <div className={styles.orgChart}>
                                <h3 style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '20px' }}>Área de Producción</h3>

                                {/* Nivel 1: Gerente/Jefe (1130) */}
                                {employeesMap['1130'] && (
                                    <div className={styles.levelRow}>
                                        <OrgCard
                                            member={employeesMap['1130']}
                                            roleClass="cardBoss"
                                            onClick={setPreviewEmp}
                                        />
                                    </div>
                                )}
                                <div className={styles.levelSpacing}></div>

                                {/* Nivel 2: Coordinadores (1131, 1694) */}
                                <div className={styles.levelRow}>
                                    {['1131', '1694'].map(id => employeesMap[id] && (
                                        <OrgCard
                                            key={id}
                                            member={employeesMap[id]}
                                            roleClass="cardCoord"
                                            onClick={setPreviewEmp}
                                        />
                                    ))}
                                </div>
                                <div className={styles.levelSpacing}></div>

                                {/* Nivel 3: Supervisores/Equipo (reportan a 1694) */}
                                {produccionOrgData.filter(p => p.reportsTo === '1694').length > 0 && (
                                    <div className={styles.instructorsGrid}>
                                        <div className={styles.teamDivider}><span>Supervisores</span></div>
                                        {produccionOrgData
                                            .filter(p => p.reportsTo === '1694')
                                            .map(p => employeesMap[p.employeeId] ? (
                                                <OrgCard
                                                    key={p.employeeId}
                                                    member={employeesMap[p.employeeId]}
                                                    roleClass="cardAnalyst"
                                                    onClick={setPreviewEmp}
                                                />
                                            ) : null)
                                        }
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* CURSOS */}
            <section style={{ marginBottom: '60px' }}>
                <div className={styles.coursesHeader}>
                    <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Cursos de Inducción</h2>
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
                                <label>Nombre del Curso</label>
                                <input className={styles.input} value={newCourseName} onChange={e => setNewCourseName(e.target.value)} placeholder="Ej. Seguridad Industrial..." />
                            </div>
                            <div className={styles.inputGroup} style={{ flexDirection: 'row', alignItems: 'center', gap: '15px' }}>
                                <input type="file" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} id="fileUpload" />
                                <label htmlFor="fileUpload" className={styles.fileBtn}>{file ? 'Archivo Listo' : '📎 Subir PDF'}</label>
                                <span style={{ color: 'var(--text-tertiary)' }}>o</span>
                                <input className={styles.input} placeholder="Pegar Link..." value={presentationLink} onChange={e => setPresentationLink(e.target.value)} />
                            </div>
                            <Button type="submit" disabled={uploading}>{uploading ? 'Guardando...' : 'Crear Curso'}</Button>
                        </form>
                    </div>
                )}

                <div className={styles.coursesGrid}>
                    {courses.map(course => (
                        <div key={course.id} className={styles.courseCard} onClick={() => setPreviewCourse(course)}>
                            <div className={styles.cardTopColor} style={{ background: course.material?.type === 'link' ? '#FF9500' : '#FF3B30' }}></div>
                            {canEdit && <button className={styles.deleteBtn} onClick={(e) => handleDeleteCourse(e, course.id)}>✕</button>}
                            <div className={styles.cardContent}>
                                <h3 className={styles.courseTitle}>{course.title}</h3>
                                <span className={styles.courseTypeBadge}>
                                    {course.material?.type === 'link' ? '🔗 Presentación' : '📄 Documento PDF'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* DINÁMICA INTERACTIVA */}
            <section>
                <TriviaGame data={inductionData} />
            </section>

            {/* MODALES */}
            {previewCourse && (
                <div className={styles.modalBackdrop} onClick={() => setPreviewCourse(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeModalBtn} onClick={() => setPreviewCourse(null)}>✕</button>
                        <h2>{previewCourse.title}</h2>
                        <div style={{ marginTop: '20px' }}>
                            <a href={previewCourse.material?.url} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-block', padding: '12px 30px', background: '#007AFF', color: 'white', borderRadius: '50px', fontWeight: '600', textDecoration: 'none' }}>
                                {previewCourse.material?.type === 'link' ? 'Abrir Presentación' : 'Ver Documento'}
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {previewEmp && (
                <div className={styles.modalBackdrop} onClick={() => setPreviewEmp(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeModalBtn} onClick={() => setPreviewEmp(null)}>✕</button>
                        {previewEmp.photoUrl ? (
                            <img src={previewEmp.photoUrl} alt={previewEmp.name} className={styles.modalImage} />
                        ) : (
                            <div style={{ width: 150, height: 150, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Avatar name={previewEmp.name} size="xl" />
                            </div>
                        )}
                        <h3>{previewEmp.name}</h3>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{previewEmp.position}</p>

                        {/* Instructor Detail */}
                        {instructorsMap[previewEmp.employeeId] && (
                            <div style={{ marginTop: '25px', textAlign: 'left', width: '100%', background: 'var(--bg-tertiary)', padding: '15px', borderRadius: '15px' }}>
                                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Especialidades</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {instructorsMap[previewEmp.employeeId].map((sub, i) => (
                                        <span key={i} style={{
                                            background: 'var(--bg-secondary)',
                                            padding: '8px 14px',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            border: '1px solid var(--border-color)',
                                            color: '#AF52DE',
                                            fontWeight: '600'
                                        }}>
                                            {sub}
                                        </span>
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