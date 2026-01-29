'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext'; // Importar AuthContext
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import styles from './page.module.css';

// Configuración de Jerarquía
const BOSS_ID = '3160'; // Jefe RH
const COORD_REC_ID = '3373'; // Coord Reclutamiento
const ANALYST_IDS = ['3376', '3884']; // Reportan a Coord Reclutamiento
const ALL_IDS = [BOSS_ID, COORD_REC_ID, ...ANALYST_IDS, '2099', '3204', '3818', '3853'];

export default function InductionPage() {
    const { user } = useAuth(); // Obtener usuario activo
    const { toast } = useToast();
    const [rhTeam, setRhTeam] = useState([]);
    const [loadingTeam, setLoadingTeam] = useState(true);

    // Estados Cursos
    const [courses, setCourses] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [previewCourse, setPreviewCourse] = useState(null); // Modal Curso
    const [previewEmp, setPreviewEmp] = useState(null); // Modal Foto Empleado

    // Form States
    const [newCourseName, setNewCourseName] = useState('');
    const [file, setFile] = useState(null);
    const [presentationLink, setPresentationLink] = useState('');
    const [uploading, setUploading] = useState(false);

    const canEdit = user?.rol === 'super_admin'; // Permiso de edición

    // 1. Cargar Equipo RH
    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const q = query(collection(db, 'training_records'), where('employeeId', 'in', ALL_IDS));
                const snapshot = await getDocs(q);
                const teamData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRhTeam(teamData);
            } catch (error) {
                console.error("Error fetching RH Team:", error);
                toast.error("Error", "No se pudo cargar el equipo.");
            } finally {
                setLoadingTeam(false);
            }
        };
        fetchTeam();
    }, []);

    // 2. Cargar Cursos (Realtime)
    useEffect(() => {
        const q = query(collection(db, 'induction_courses'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const getMember = (id) => rhTeam.find(m => m.employeeId === id);
    const boss = getMember(BOSS_ID);
    const coordRec = getMember(COORD_REC_ID);
    const analysts = rhTeam.filter(m => ANALYST_IDS.includes(m.employeeId));
    const others = rhTeam.filter(m => !ANALYST_IDS.includes(m.employeeId) && m.employeeId !== BOSS_ID && m.employeeId !== COORD_REC_ID);

    const handleDeleteCourse = async (e, courseId) => {
        e.stopPropagation();
        if (!canEdit) return; // Seguridad
        if (window.confirm('¿Eliminar curso permanentemente?')) {
            try {
                await deleteDoc(doc(db, 'induction_courses', courseId));
                toast.success('Eliminado', 'Curso borrado.');
            } catch (error) {
                toast.error('Error', 'No se pudo eliminar.');
            }
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        if (!canEdit) return; // Seguridad

        if (!newCourseName.trim()) return toast.warning('Atención', 'Nombre requerido');
        if (!file && !presentationLink.trim()) return toast.warning('Atención', 'Material requerido');

        setUploading(true);
        try {
            let fileData = null;
            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('docType', 'Induccion');
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.details || 'Error subiendo archivo');
                }
                const data = await res.json();
                fileData = { type: 'file', name: file.name, url: data.data.viewLink, downloadUrl: data.data.downloadLink, mimeType: file.type };
            } else {
                fileData = { type: 'link', name: 'Presentación', url: presentationLink, mimeType: 'link' };
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

    const OrgCard = ({ member, roleClass }) => {
        if (!member) return null;
        return (
            <div className={`${styles.orgCard} ${styles[roleClass]}`} onClick={() => setPreviewEmp(member)}>
                <div className={styles.orgAvatar}>
                    <Avatar name={member.name} src={member.photoUrl} size="xl" />
                </div>
                <h4 className={styles.orgName}>{member.name}</h4>
                <span className={styles.orgRole}>{member.position || 'Recursos Humanos'}</span>
                {member.shift && <span className={styles.orgShift}>{member.shift}</span>}
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Módulo de Inducción</h1>
                    <p>Bienvenido al proceso de incorporación RH.</p>
                </div>
                <div className={styles.headerActions}>
                    <ThemeToggle />
                    <Link href="/modulos">
                        <Button variant="secondary">Volver al Menú</Button>
                    </Link>
                </div>
            </div>

            {/* ORGANIGRAMA */}
            <section className={styles.orgSection}>
                <h2 className={styles.sectionTitle}>Nuestro Equipo</h2>

                {loadingTeam ? <p>Cargando...</p> : (
                    <div className={styles.orgChart}>
                        <div className={`${styles.orgLevel} ${styles.hasChildren}`}>
                            <div className={styles.treeNode}>
                                <OrgCard member={boss} roleClass="cardBoss" />
                            </div>
                        </div>

                        <div className={`${styles.orgLevel} ${styles.hasParent}`}>
                            {others.map(member => (
                                <div key={member.id} className={styles.treeNode}>
                                    <OrgCard member={member} roleClass="cardCoord" />
                                </div>
                            ))}

                            {coordRec && (
                                <div className={`${styles.treeNode} ${styles.hasChildren}`}>
                                    <OrgCard member={coordRec} roleClass="cardCoord" />
                                    <div className={styles.childrenGroup}>
                                        {analysts.map(member => (
                                            <div key={member.id} className={`${styles.treeNode} ${styles.hasParent}`}>
                                                <OrgCard member={member} roleClass="cardAnalyst" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>

            {/* CURSOS */}
            <section>
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
                            {canEdit && (
                                <button className={styles.deleteBtn} onClick={(e) => handleDeleteCourse(e, course.id)}>✕</button>
                            )}
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

            {/* MODAL CURSO */}
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

            {/* MODAL FOTO EMPLEADO */}
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
                    </div>
                </div>
            )}
        </div>
    );
}
