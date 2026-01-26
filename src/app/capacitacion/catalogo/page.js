'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/components/ui/Toast/Toast';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import styles from './page.module.css';

export default function CatalogPage() {
    const { toast } = useToast();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit Modal State
    const [editingCourse, setEditingCourse] = useState(null);
    const [validity, setValidity] = useState('');
    const [duration, setDuration] = useState('');
    const [instructor, setInstructor] = useState('');
    const [category, setCategory] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        setLoading(true);
        try {
            // "courses" collection is just names currently based on registro logic. 
            // We need to fetch objects. If they are stored as { name: "..." }, simple.
            // But wait, Registro adds to "courses" collection with { name, category, createdAt }.
            const q = query(collection(db, 'courses'), orderBy('name'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCourses(data);
        } catch (error) {
            console.error("Error loading courses:", error);
            toast.error("Error", "No se pudieron cargar los cursos");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (course) => {
        setEditingCourse(course);
        setValidity(course.validityMonths || '');
        setDuration(course.durationHours || '');
        setInstructor(course.defaultInstructor || '');
        setCategory(course.category || 'GENERAL');
    };

    const handleSave = async () => {
        if (!editingCourse) return;
        setSaving(true);
        try {
            const courseRef = doc(db, 'courses', editingCourse.id);
            await updateDoc(courseRef, {
                validityMonths: validity ? parseInt(validity) : null,
                durationHours: duration ? parseInt(duration) : null,
                defaultInstructor: instructor,
                category: category,
                updatedAt: new Date()
            });

            toast.success("Actualizado", "Curso actualizado correctamente");
            setEditingCourse(null);
            loadCourses(); // Reload to refresh list
        } catch (error) {
            console.error("Error updating course:", error);
            toast.error("Error", "Falló la actualización");
        } finally {
            setSaving(false);
        }
    };

    const filteredCourses = courses.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <Link href="/capacitacion" className={styles.backBtn}>← Volver</Link>
                            <h1>Catálogo de Cursos</h1>
                        </div>
                    </div>

                    <div className={styles.controls}>
                        <input
                            type="text"
                            className={styles.searchBar}
                            placeholder="Buscar curso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nombre del Curso</th>
                                    <th>Categoría</th>
                                    <th>Vigencia</th>
                                    <th>Instructor Default</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center' }}>Cargando...</td></tr>
                                ) : filteredCourses.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center' }}>No se encontraron cursos.</td></tr>
                                ) : (
                                    filteredCourses.map(course => (
                                        <tr key={course.id}>
                                            <td>{course.name}</td>
                                            <td>{course.category}</td>
                                            <td>
                                                {course.validityMonths ? (
                                                    <span className={styles.validityBadge}>
                                                        {course.validityMonths} meses
                                                    </span>
                                                ) : <span style={{ opacity: 0.5 }}>Permanente</span>}
                                            </td>
                                            <td>{course.defaultInstructor || '-'}</td>
                                            <td>
                                                <Button size="sm" variant="outline" onClick={() => handleEdit(course)}>
                                                    Editar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Edit Modal */}
            <Dialog open={!!editingCourse} onOpenChange={(open) => !open && setEditingCourse(null)}>
                <DialogHeader>
                    <DialogTitle>Editar Curso: {editingCourse?.name}</DialogTitle>
                    <DialogClose onClose={() => setEditingCourse(null)} />
                </DialogHeader>
                <DialogBody>
                    <div className={styles.formGroup}>
                        <label>Vigencia (Meses)</label>
                        <input
                            type="number"
                            className={styles.input}
                            placeholder="Ej. 12 (Dejar vacío para permanente)"
                            value={validity}
                            onChange={(e) => setValidity(e.target.value)}
                        />
                        <small style={{ color: 'var(--text-tertiary)' }}>0 o vacío indica que la certificación nunca vence.</small>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Duración (Horas)</label>
                        <input
                            type="number"
                            className={styles.input}
                            placeholder="Ej. 8"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Categoría</label>
                        <select
                            className={styles.select}
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="GENERAL">General</option>
                            <option value="SEGURIDAD">Seguridad</option>
                            <option value="CALIDAD">Calidad</option>
                            <option value="TECNICO">Técnico</option>
                            <option value="HUMANO">Desarrollo Humano</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Instructor Predeterminado</label>
                        <input
                            type="text"
                            className={styles.input}
                            placeholder="Nombre del instructor"
                            value={instructor}
                            onChange={(e) => setInstructor(e.target.value)}
                        />
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setEditingCourse(null)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </DialogFooter>
            </Dialog>
        </>
    );
}
