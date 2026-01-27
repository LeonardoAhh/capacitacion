'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { updateCourseValidity } from '@/lib/updateCourseValidity';
import styles from './page.module.css';

export default function CursosPage() {
    const { canWrite } = useAuth();
    const { toast } = useToast();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingCourse, setDeletingCourse] = useState(null);
    const [updatingValidity, setUpdatingValidity] = useState(false);
    const [deleteWarning, setDeleteWarning] = useState('');

    // Form fields
    const [formData, setFormData] = useState({
        name: '',
        duration: '',
        instructor: '',
        validityYears: 0,
        category: 'GENERAL'
    });

    const categories = ['GENERAL', 'SEGURIDAD', 'CALIDAD', 'TÉCNICO', 'NORMATIVO', 'STPS'];

    const loadCourses = useCallback(async () => {
        setLoading(true);
        try {
            const coursesRef = collection(db, 'courses');
            const snapshot = await getDocs(coursesRef);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => a.name.localeCompare(b.name));
            setCourses(data);
        } catch (error) {
            console.error("Error loading courses:", error);
            toast.error("Error", "No se pudieron cargar los cursos");
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        loadCourses();
    }, [loadCourses]);

    const openCreateModal = () => {
        setFormData({ name: '', duration: '', instructor: '', validityYears: 0, category: 'GENERAL' });
        setIsEditing(false);
        setEditingCourse(null);
        setShowModal(true);
    };

    const openEditModal = (course) => {
        setFormData({
            name: course.name || '',
            duration: course.duration || '',
            instructor: course.instructor || '',
            validityYears: course.validityYears || 0,
            category: course.category || 'GENERAL'
        });
        setIsEditing(true);
        setEditingCourse(course);
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("Error", "El nombre del curso es obligatorio");
            return;
        }

        try {
            if (isEditing && editingCourse) {
                // Update
                await updateDoc(doc(db, 'courses', editingCourse.id), {
                    ...formData,
                    updatedAt: new Date().toISOString()
                });
                toast.success("Éxito", "Curso actualizado correctamente");
            } else {
                // Create
                await addDoc(collection(db, 'courses'), {
                    ...formData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                toast.success("Éxito", "Curso creado correctamente");
            }
            setShowModal(false);
            loadCourses();
        } catch (error) {
            console.error("Error saving course:", error);
            toast.error("Error", "No se pudo guardar el curso");
        }
    };

    const handleDeleteClick = async (course) => {
        setDeletingCourse(course);
        setDeleteWarning('');

        // Check dependencies
        try {
            const recordsRef = collection(db, 'training_records');
            const snapshot = await getDocs(recordsRef);
            let usageCount = 0;

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const hasInHistory = data.history?.some(h => h.courseName === course.name);
                const hasInMatrix = data.matrix?.requiredCourses?.includes(course.name);
                if (hasInHistory || hasInMatrix) usageCount++;
            });

            if (usageCount > 0) {
                setDeleteWarning(`⚠️ Este curso está siendo usado por ${usageCount} empleado(s). Eliminarlo podría afectar sus registros.`);
            }
        } catch (error) {
            console.error("Error checking dependencies:", error);
        }

        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deletingCourse) return;

        try {
            await deleteDoc(doc(db, 'courses', deletingCourse.id));
            toast.success("Éxito", "Curso eliminado correctamente");
            setShowDeleteModal(false);
            setDeletingCourse(null);
            loadCourses();
        } catch (error) {
            console.error("Error deleting course:", error);
            toast.error("Error", "No se pudo eliminar el curso");
        }
    };

    const filteredCourses = courses.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getCategoryColor = (cat) => {
        const colors = {
            'SEGURIDAD': '#ef4444',
            'CALIDAD': '#3b82f6',
            'TÉCNICO': '#8b5cf6',
            'NORMATIVO': '#f59e0b',
            'STPS': '#10b981',
            'GENERAL': '#6b7280'
        };
        return colors[cat] || colors['GENERAL'];
    };

    const handleUpdateValidity = async () => {
        setUpdatingValidity(true);
        try {
            const result = await updateCourseValidity();
            if (result.success) {
                toast.success("Éxito", result.message);
                if (result.notFound.length > 0) {
                    toast.info("Info", `${result.notFound.length} cursos no tienen información de vigencia en el archivo.`);
                }
                loadCourses(); // Reload to show updated data
            } else {
                toast.error("Error", result.message);
            }
        } catch (error) {
            console.error("Error updating validity:", error);
            toast.error("Error", "No se pudo actualizar la vigencia de los cursos");
        } finally {
            setUpdatingValidity(false);
        }
    };

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <Link href="/capacitacion" className={styles.backBtn}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                Volver
                            </Link>
                            <h1>Catálogo de Cursos</h1>
                        </div>
                        <div className={styles.headerRight}>
                            {canWrite() && (
                                <Button onClick={openCreateModal}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    Nuevo Curso
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className={styles.statsBar}>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>{courses.length}</span>
                            <span className={styles.statLabel}>Total Cursos</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>{courses.filter(c => c.category === 'STPS').length}</span>
                            <span className={styles.statLabel}>Cursos STPS</span>
                        </div>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>{courses.filter(c => c.validityYears > 0).length}</span>
                            <span className={styles.statLabel}>Con Vigencia</span>
                        </div>
                    </div>

                    <div className={styles.searchBar}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, categoría o instructor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="spinner"></div>
                    ) : filteredCourses.length === 0 ? (
                        <div className={styles.emptyState}>
                            No se encontraron cursos.
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {filteredCourses.map(course => (
                                <div key={course.id} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <span
                                            className={styles.categoryBadge}
                                            style={{ backgroundColor: getCategoryColor(course.category) }}
                                        >
                                            {course.category || 'GENERAL'}
                                        </span>
                                        {canWrite() && (
                                            <div className={styles.cardActions}>
                                                <button className={styles.iconBtn} onClick={() => openEditModal(course)} title="Editar">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => handleDeleteClick(course)} title="Eliminar">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className={styles.cardTitle}>{course.name}</h3>
                                    <div className={styles.cardMeta}>
                                        {course.duration && (
                                            <div className={styles.metaItem}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <polyline points="12 6 12 12 16 14" />
                                                </svg>
                                                {course.duration}
                                            </div>
                                        )}
                                        {course.instructor && (
                                            <div className={styles.metaItem}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                    <circle cx="12" cy="7" r="4" />
                                                </svg>
                                                {course.instructor}
                                            </div>
                                        )}
                                        {(course.validityYears > 0 || course.renewalPeriod) && (
                                            <div className={styles.metaItem} style={{ color: course.validityYears > 0 ? '#f59e0b' : '#10b981' }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                    <line x1="3" y1="10" x2="21" y2="10" />
                                                </svg>
                                                {course.validityYears > 0
                                                    ? `Renovar cada ${course.validityYears} año(s)`
                                                    : 'Curso de 1 sola vez'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Create/Edit Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Editar Curso' : 'Nuevo Curso'}</DialogTitle>
                    <DialogClose onClose={() => setShowModal(false)} />
                </DialogHeader>
                <DialogBody>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Nombre del Curso *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Inducción a la Empresa"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Categoría</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Duración</label>
                            <input
                                type="text"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                placeholder="Ej: 8 horas"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Instructor</label>
                            <input
                                type="text"
                                value={formData.instructor}
                                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Vigencia (años)</label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                value={formData.validityYears}
                                onChange={(e) => setFormData({ ...formData, validityYears: parseInt(e.target.value) || 0 })}
                            />
                            <span className={styles.hint}>0 = Sin expiración</span>
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                    <Button onClick={handleSave}>{isEditing ? 'Guardar Cambios' : 'Crear Curso'}</Button>
                </DialogFooter>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
                <DialogHeader>
                    <DialogTitle>Eliminar Curso</DialogTitle>
                    <DialogClose onClose={() => setShowDeleteModal(false)} />
                </DialogHeader>
                <DialogBody>
                    <p>¿Estás seguro de eliminar el curso <strong>{deletingCourse?.name}</strong>?</p>
                    {deleteWarning && (
                        <div className={styles.warningBox}>
                            {deleteWarning}
                        </div>
                    )}
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
                    <Button variant="danger" onClick={confirmDelete}>Eliminar</Button>
                </DialogFooter>
            </Dialog>
        </>
    );
}

