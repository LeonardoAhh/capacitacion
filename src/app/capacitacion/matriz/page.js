'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import BackButton from '@/components/ui/BackButton/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, where, writeBatch } from 'firebase/firestore';
import { seedCapacitacionDataRobust } from '@/lib/seedCapacitacion';
import styles from './page.module.css';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';

export default function MatrizPage() {
    const { user, loading: authLoading, canWrite } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [positions, setPositions] = useState([]);
    const [courses, setCourses] = useState([]); // All available courses for autocomplete
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [seeding, setSeeding] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
    const [selectedDepartment, setSelectedDepartment] = useState('Todos');
    const [departments, setDepartments] = useState([]);

    // Selection State for Bulk Actions
    const [selectedPositions, setSelectedPositions] = useState(new Set());

    // Edit Modal State
    const [editingPosition, setEditingPosition] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [courseSearch, setCourseSearch] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            loadData();
        }
    }, [user, authLoading, router]);



    const loadData = async () => {
        setLoading(true);
        try {
            // Load Positions
            const positionsRef = collection(db, 'positions');
            const q = query(positionsRef, orderBy('name'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPositions(data);

            // Extract Unique Departments
            const depts = new Set(data.map(p => p.department).filter(Boolean));
            setDepartments(['Todos', ...Array.from(depts).sort()]);

            // Load Courses (for selection)
            const coursesRef = collection(db, 'courses');
            const coursesSnap = await getDocs(coursesRef);
            const coursesData = coursesSnap.docs.map(doc => doc.data().name);
            setCourses(coursesData.sort());

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSeed = async () => {
        setSeeding(true);
        try {
            const result = await seedCapacitacionDataRobust();
            if (result.success) {
                toast.success('Éxito', result.message);
                loadData();
            } else {
                toast.error('Error', 'Falló la migración: ' + result.error);
            }
        } catch (e) {
            toast.error('Error', 'Ocurrió un error inesperado.');
        } finally {
            setSeeding(false);
        }
    };

    // Filter Logic
    const filteredPositions = positions.filter(pos => {
        const matchesSearch = pos.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pos.department?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = selectedDepartment === 'Todos' || pos.department === selectedDepartment;
        return matchesSearch && matchesDept;
    });

    // Bulk Selection Handlers
    const toggleSelectPosition = (id) => {
        const newSelected = new Set(selectedPositions);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedPositions(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedPositions.size === filteredPositions.length) {
            setSelectedPositions(new Set());
        } else {
            setSelectedPositions(new Set(filteredPositions.map(p => p.id)));
        }
    };

    // Bulk Action State
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkCourseSearch, setBulkCourseSearch] = useState('');

    // Copy Matrix State
    const [showCopyModal, setShowCopyModal] = useState(false);
    const [sourcePositionId, setSourcePositionId] = useState('');
    const [copySearchTerm, setCopySearchTerm] = useState('');

    // Employee Match Logic
    const [matchingEmployees, setMatchingEmployees] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'employees'

    if (authLoading || !user) {
        return (
            <AdminLayout title="Módulo">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    // Edit Handlers
    const openEdit = async (position) => {
        setEditingPosition({ ...position }); // Copy to avoid direct mut
        setShowEditModal(true);
        setCourseSearch('');
        setActiveTab('courses');

        // Fetch matching employees
        setLoadingEmployees(true);
        try {
            const employeesRef = collection(db, 'employees');
            // Note: Ensure your employees have 'position' field that matches exactly
            const q = query(employeesRef, where('position', '==', position.name));
            const snapshot = await getDocs(q);
            const emps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMatchingEmployees(emps);
        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const handleBulkAdd = async (courseName) => {
        try {
            const batch = writeBatch(db);
            const positionsToUpdate = positions.filter(p => selectedPositions.has(p.id));

            positionsToUpdate.forEach(pos => {
                if (!pos.requiredCourses.includes(courseName)) {
                    const docRef = doc(db, 'positions', pos.id);
                    batch.update(docRef, {
                        requiredCourses: [...pos.requiredCourses, courseName].sort()
                    });
                }
            });

            await batch.commit();
            toast.success('Éxito', `Curso agregado a ${positionsToUpdate.length} puestos.`);
            setShowBulkModal(false);
            setSelectedPositions(new Set()); // Clear selection
            loadData(); // Refresh
        } catch (error) {
            console.error(error);
            toast.error('Error', 'Falló la asignación masiva.');
        }
    };

    // Copiar toda la matriz de un puesto origen a los puestos seleccionados
    const handleCopyMatrix = async () => {
        if (!sourcePositionId) {
            toast.error('Error', 'Selecciona el puesto de origen');
            return;
        }
        const source = positions.find(p => p.id === sourcePositionId);
        if (!source || !source.requiredCourses?.length) {
            toast.error('Error', 'El puesto origen no tiene cursos asignados');
            return;
        }
        try {
            const batch = writeBatch(db);
            const targets = positions.filter(p => selectedPositions.has(p.id) && p.id !== sourcePositionId);
            if (targets.length === 0) {
                toast.error('Error', 'No hay puestos destino seleccionados (o solo seleccionaste el origen)');
                return;
            }
            targets.forEach(pos => {
                // Merge: union de cursos sin duplicados, ordenados
                const merged = Array.from(new Set([...(pos.requiredCourses || []), ...source.requiredCourses])).sort();
                const docRef = doc(db, 'positions', pos.id);
                batch.update(docRef, { requiredCourses: merged });
            });
            await batch.commit();
            toast.success('Éxito', `Matriz copiada a ${targets.length} puesto(s). Los cursos existentes se conservaron.`);
            setShowCopyModal(false);
            setSourcePositionId('');
            setSelectedPositions(new Set());
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('Error', 'No se pudo copiar la matriz.');
        }
    };

    const handleRemoveCourse = (courseToRemove) => {
        setEditingPosition(prev => ({
            ...prev,
            requiredCourses: prev.requiredCourses.filter(c => c !== courseToRemove)
        }));
    };

    const handleAddCourse = (courseToAdd) => {
        if (!editingPosition.requiredCourses.includes(courseToAdd)) {
            setEditingPosition(prev => ({
                ...prev,
                requiredCourses: [...prev.requiredCourses, courseToAdd].sort()
            }));
        }
        setCourseSearch('');
    };

    const handleSave = async () => {
        try {
            const docRef = doc(db, 'positions', editingPosition.id);
            await updateDoc(docRef, {
                requiredCourses: editingPosition.requiredCourses
            });

            // Update local state
            setPositions(prev => prev.map(p => p.id === editingPosition.id ? editingPosition : p));

            toast.success('Guardado', 'Matriz actualizada correctamente.');
            setShowEditModal(false);
        } catch (error) {
            console.error(error);
            toast.error('Error', 'No se pudo guardar.');
        }
    };

    // Filter available courses for addition
    const availableCourses = courses.filter(c =>
        c.toLowerCase().includes(courseSearch.toLowerCase()) &&
        !editingPosition?.requiredCourses.includes(c)
    ).slice(0, 5); // Limit suggestions

    const bulkAvailableCourses = courses.filter(c =>
        c.toLowerCase().includes(bulkCourseSearch.toLowerCase())
    ).slice(0, 5);

    return (
        <AdminLayout title="Matriz de Capacitación">
            <main className={styles.main} id="main-content">
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <BackButton href="/dashboard" />
                            <h1>Matriz de Capacitación</h1>
                        </div>

                        <div className={styles.headerRight}>
                            {positions.length === 0 && (
                                <Button onClick={handleSeed} disabled={seeding}>
                                    {seeding ? 'Cargando datos...' : 'Inicializar Datos (Seed)'}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className={styles.controlsBar}>
                        <div className={styles.searchBar}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar por puesto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <select
                            className={styles.deptFilter}
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>

                        <div className={styles.viewToggles}>
                            <button
                                className={`${styles.toggleBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Vista Cuadrícula"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                </svg>
                            </button>
                            <button
                                className={`${styles.toggleBtn} ${viewMode === 'table' ? styles.active : ''}`}
                                onClick={() => setViewMode('table')}
                                title="Vista Tabla"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="8" y1="6" x2="21" y2="6" />
                                    <line x1="8" y1="12" x2="21" y2="12" />
                                    <line x1="8" y1="18" x2="21" y2="18" />
                                    <line x1="3" y1="6" x2="3.01" y2="6" />
                                    <line x1="3" y1="12" x2="3.01" y2="12" />
                                    <line x1="3" y1="18" x2="3.01" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Bulk Actions Bar */}
                    {selectedPositions.size > 0 && (
                        <div className={styles.bulkActionBar}>
                            <span>{selectedPositions.size} puestos seleccionados</span>
                            <div className={styles.bulkActions}>
                                <Button variant="secondary" onClick={() => setSelectedPositions(new Set())}>
                                    Cancelar
                                </Button>
                                <button
                                    onClick={() => { setShowCopyModal(true); setSourcePositionId(''); setCopySearchTerm(''); }}
                                    style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                        padding: '0.55rem 1rem',
                                        background: 'rgba(255,255,255,0.2)',
                                        color: 'white',
                                        border: '1.5px solid rgba(255,255,255,0.6)',
                                        borderRadius: '50px',
                                        fontWeight: 600, fontSize: '0.875rem',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'background 0.2s',
                                    }}
                                >
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <rect x="9" y="9" width="13" height="13" rx="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                    Copiar Matriz de...
                                </button>
                                <Button variant="primary" onClick={() => setShowBulkModal(true)}>
                                    Agregar Curso a Selección
                                </Button>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="spinner"></div>
                    ) : filteredPositions.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No se encontraron puestos.</p>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'grid' ? (
                                <div className={styles.grid}>
                                    {filteredPositions.map(pos => (
                                        <Card
                                            key={pos.id}
                                            className={`${styles.card} ${selectedPositions.has(pos.id) ? styles.selectedCard : ''}`}
                                            onClick={() => viewMode === 'grid' && toggleSelectPosition(pos.id)}
                                        >
                                            <CardHeader>
                                                <div className={styles.cardTitleRow}>
                                                    <CardTitle>{pos.name}</CardTitle>
                                                    {canWrite() && (
                                                        <div onClick={(e) => e.stopPropagation()}>
                                                            <Button variant="ghost" size="sm" onClick={() => openEdit(pos)}>
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                                </svg>
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={styles.department}>{pos.department}</span>
                                            </CardHeader>
                                            <CardContent>
                                                <div className={styles.courseCount}>
                                                    <strong>{pos.requiredCourses?.length || 0}</strong> Cursos Asignados
                                                </div>
                                                <div className={styles.previewCourses}>
                                                    {pos.requiredCourses?.slice(0, 3).map((c, i) => (
                                                        <span key={i} className={styles.badge}>{c}</span>
                                                    ))}
                                                    {(pos.requiredCourses?.length || 0) > 3 && (
                                                        <span className={styles.moreBadge}>+{pos.requiredCourses.length - 3} más</span>
                                                    )}
                                                </div>
                                                {/* Select Indicator */}
                                                {selectedPositions.has(pos.id) && (
                                                    <div className={styles.selectedBadge}>✓</div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.tableWrapper}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th width="40">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPositions.size === filteredPositions.length && filteredPositions.length > 0}
                                                        onChange={toggleSelectAll}
                                                    />
                                                </th>
                                                <th>Puesto</th>
                                                <th>Departamento</th>
                                                <th>Cursos Requeridos</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPositions.map(pos => (
                                                <tr key={pos.id} className={selectedPositions.has(pos.id) ? styles.selectedRow : ''}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedPositions.has(pos.id)}
                                                            onChange={() => toggleSelectPosition(pos.id)}
                                                        />
                                                    </td>
                                                    <td className={styles.fwBold}>{pos.name}</td>
                                                    <td>
                                                        <span className={styles.deptBadge}>{pos.department}</span>
                                                    </td>
                                                    <td>
                                                        {pos.requiredCourses?.length || 0} cursos
                                                        <div className={styles.coursesTooltip}>
                                                            {pos.requiredCourses?.join(', ')}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {canWrite() && (
                                                            <Button variant="ghost" size="sm" onClick={() => openEdit(pos)}>
                                                                Editar
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Edit Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogHeader>
                    <DialogTitle>Editar Matriz: {editingPosition?.name}</DialogTitle>
                    <DialogClose onClose={() => setShowEditModal(false)} />
                </DialogHeader>
                <DialogBody>
                    <div className={styles.editContainer}>
                        <div className={styles.assignedSection}>
                            <h3>Cursos Asignados ({editingPosition?.requiredCourses.length})</h3>
                            <div className={styles.chipGrid}>
                                {editingPosition?.requiredCourses.map((course, idx) => (
                                    <div key={idx} className={styles.chip}>
                                        <span>{course}</span>
                                        <button onClick={() => handleRemoveCourse(course)}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.addSection}>
                            <h3>Agregar Curso</h3>
                            <div className={styles.autocomplete}>
                                <input
                                    type="text"
                                    placeholder="Buscar curso para agregar..."
                                    value={courseSearch}
                                    onChange={(e) => setCourseSearch(e.target.value)}
                                    className={styles.searchInput}
                                />
                                {courseSearch && (
                                    <div className={styles.suggestions}>
                                        {availableCourses.map((c, idx) => (
                                            <div
                                                key={idx}
                                                className={styles.suggestionItem}
                                                onClick={() => handleAddCourse(c)}
                                            >
                                                + {c}
                                            </div>
                                        ))}
                                        {availableCourses.length === 0 && (
                                            <div className={styles.noResults}>No se encontraron cursos</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSave}>Guardar Cambios</Button>
                </DialogFooter>
            </Dialog>

            {/* Bulk Add Course Modal */}
            <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
                <DialogHeader>
                    <DialogTitle>Agregar Curso a {selectedPositions.size} Puestos</DialogTitle>
                    <DialogClose onClose={() => setShowBulkModal(false)} />
                </DialogHeader>
                <DialogBody>
                    <div className={styles.bulkModalContent}>
                        <p className={styles.bulkModalDescription}>
                            Selecciona un curso para agregarlo a todos los puestos seleccionados.
                        </p>
                        <div className={styles.autocomplete}>
                            <input
                                type="text"
                                placeholder="Buscar curso..."
                                value={bulkCourseSearch}
                                onChange={(e) => setBulkCourseSearch(e.target.value)}
                                className={styles.searchInput}
                                autoFocus
                            />
                            {bulkCourseSearch && (
                                <div className={styles.suggestions}>
                                    {bulkAvailableCourses.length > 0 ? (
                                        bulkAvailableCourses.map((c, idx) => (
                                            <div
                                                key={idx}
                                                className={styles.suggestionItem}
                                                onClick={() => {
                                                    handleBulkAdd(c);
                                                    setBulkCourseSearch('');
                                                }}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <line x1="12" y1="5" x2="12" y2="19" />
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                </svg>
                                                {c}
                                            </div>
                                        ))
                                    ) : (
                                        <div className={styles.noResults}>No se encontraron cursos</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Show all courses if no search */}
                        {!bulkCourseSearch && (
                            <div className={styles.allCoursesList}>
                                <h4>Cursos Disponibles</h4>
                                <div className={styles.courseGrid}>
                                    {courses.slice(0, 12).map((c, idx) => (
                                        <button
                                            key={idx}
                                            className={styles.courseOption}
                                            onClick={() => handleBulkAdd(c)}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                                {courses.length > 12 && (
                                    <p className={styles.moreCoursesHint}>
                                        Usa el buscador para ver más cursos...
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => {
                        setShowBulkModal(false);
                        setBulkCourseSearch('');
                    }}>
                        Cancelar
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* Copy Matrix Modal */}
            <Dialog open={showCopyModal} onOpenChange={setShowCopyModal}>
                <DialogHeader>
                    <DialogTitle>Copiar Matriz a {selectedPositions.size} Puesto(s)</DialogTitle>
                    <DialogClose onClose={() => setShowCopyModal(false)} />
                </DialogHeader>
                <DialogBody>
                    <div className={styles.bulkModalContent}>
                        <p className={styles.bulkModalDescription}>
                            Selecciona el puesto <strong>origen</strong> cuyos cursos quieres copiar.
                            Los cursos existentes en los puestos destino se conservarán (se hace una unión).
                        </p>

                        {/* Buscador */}
                        <div className={styles.autocomplete} style={{ marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Buscar puesto origen..."
                                value={copySearchTerm}
                                onChange={(e) => setCopySearchTerm(e.target.value)}
                                className={styles.searchInput}
                                autoFocus
                            />
                        </div>

                        {/* Lista de puestos origen */}
                        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {positions
                                .filter(p =>
                                    !selectedPositions.has(p.id) && // excluir los destino
                                    (p.requiredCourses?.length || 0) > 0 && // solo los que tienen cursos
                                    p.name.toLowerCase().includes(copySearchTerm.toLowerCase())
                                )
                                .map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSourcePositionId(p.id)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.75rem 1rem',
                                            borderRadius: '10px',
                                            border: `2px solid ${sourcePositionId === p.id ? 'var(--color-primary)' : 'var(--card-border)'}`,
                                            background: sourcePositionId === p.id ? 'rgba(var(--color-primary-rgb,59,130,246),0.08)' : 'var(--card-background)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.15s',
                                            width: '100%',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{p.name}</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{p.department}</div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.78rem', fontWeight: 700,
                                            color: sourcePositionId === p.id ? 'var(--color-primary)' : '#f59e0b',
                                            background: sourcePositionId === p.id ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                                            padding: '2px 8px', borderRadius: '20px'
                                        }}>
                                            {p.requiredCourses.length} cursos
                                        </span>
                                    </button>
                                ))
                            }
                        </div>

                        {/* Preview cursos a copiar */}
                        {sourcePositionId && (() => {
                            const src = positions.find(p => p.id === sourcePositionId);
                            return src ? (
                                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '10px' }}>
                                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                        Se copiarán {src.requiredCourses.length} cursos de <strong>{src.name}</strong>:
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                        {src.requiredCourses.slice(0, 10).map((c, i) => (
                                            <span key={i} style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'var(--card-background)', border: '1px solid var(--card-border)', borderRadius: '20px', color: 'var(--text-primary)' }}>{c}</span>
                                        ))}
                                        {src.requiredCourses.length > 10 && (
                                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>+{src.requiredCourses.length - 10} más</span>
                                        )}
                                    </div>
                                </div>
                            ) : null;
                        })()}
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setShowCopyModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleCopyMatrix} disabled={!sourcePositionId}>
                        Copiar Cursos
                    </Button>
                </DialogFooter>
            </Dialog>
        </AdminLayout>
    );
}

