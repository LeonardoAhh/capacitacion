'use client';

import { useState, useEffect } from 'react';

import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import styles from './page.module.css';

export default function EmpleadosPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('Todos');
    const [posFilter, setPosFilter] = useState('Todos');
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Modals State
    const [editingEmp, setEditingEmp] = useState(null); // Edit Mode
    const [viewingEmp, setViewingEmp] = useState(null); // Detail Mode
    const [isCreating, setIsCreating] = useState(false); // Create Mode

    const [formData, setFormData] = useState({ id: '', name: '', position: '', department: '', curp: '', occupation: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadEmployees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let result = employees;

        // 1. Text Search
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(e =>
                e.name.toLowerCase().includes(term) ||
                (e.id && e.id.toLowerCase().includes(term))
            );
        }

        // 2. Department Filter
        if (deptFilter !== 'Todos') {
            result = result.filter(e => e.department === deptFilter);
        }

        // 3. Position Filter
        if (posFilter !== 'Todos') {
            result = result.filter(e => e.position === posFilter);
        }

        setFilteredEmployees(result);
        setCurrentPage(1); // Reset to page 1 on filter change
    }, [searchTerm, deptFilter, posFilter, employees]);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'training_records'), orderBy('name'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            setEmployees(data);
            setFilteredEmployees(data);

            // Extract Unique Filtes
            const depts = new Set(data.map(e => e.department).filter(Boolean));
            setDepartments(Array.from(depts).sort());

            const pos = new Set(data.map(e => e.position).filter(Boolean));
            setPositions(Array.from(pos).sort());

        } catch (error) {
            console.error("Error loading employees:", error);
            toast.error("Error", "No se pudieron cargar los empleados.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setFormData({ id: '', name: '', position: '', department: '' });
        setIsCreating(true);
    };

    const handleEdit = (emp) => {
        setFormData({
            id: emp.id,
            name: emp.name || '',
            position: emp.position || '',
            department: emp.department || '',
            curp: emp.curp || '',
            occupation: emp.occupation || ''
        });
        setEditingEmp(emp);
    };

    const handleDelete = async (emp) => {
        if (user?.rol !== 'super_admin') {
            toast.error("Acceso Denegado", "Solo Super Admin puede eliminar.");
            return;
        }

        if (!window.confirm(`¿Estás seguro de eliminar a ${emp.name}? Esta acción es irreversible.`)) return;

        try {
            await deleteDoc(doc(db, 'training_records', emp.id));
            setEmployees(prev => prev.filter(e => e.id !== emp.id));
            setFilteredEmployees(prev => prev.filter(e => e.id !== emp.id));
            toast.success("Eliminado", "Empleado eliminado.");
        } catch (e) {
            console.error("Error deleting", e);
            toast.error("Error", "No se pudo eliminar.");
        }
    };

    const handleSave = async () => {
        if (user?.rol !== 'super_admin') {
            toast.error("Acceso Denegado", "Tu rol actual (Lectura) no permite modificar datos.");
            return;
        }

        if (!formData.name.trim()) {
            toast.error("Error", "El nombre es obligatorio.");
            return;
        }

        setSaving(true);
        try {
            const empId = isCreating ? formData.id.trim() || formData.name.replace(/\s+/g, '-').toUpperCase() : editingEmp.id;
            const ref = doc(db, 'training_records', empId);

            const payload = {
                name: formData.name.trim().toUpperCase(),
                position: formData.position.trim().toUpperCase(),
                department: formData.department.trim().toUpperCase(),
                curp: formData.curp.trim().toUpperCase(),
                occupation: formData.occupation ? formData.occupation.trim().toUpperCase() : formData.position.trim().toUpperCase(),
                updatedAt: new Date().toISOString()
            };

            if (isCreating) {
                // Check if exists
                const check = await getDoc(ref);
                if (check.exists()) {
                    toast.error("Error", "Ya existe un empleado con este ID.");
                    setSaving(false);
                    return;
                }
                await setDoc(ref, {
                    ...payload,
                    employeeId: empId,
                    history: [],
                    matrix: {}
                });
                toast.success("Creado", "Empleado registrado correctamente.");

                // Add to local list
                setEmployees(prev => [...prev, { id: empId, ...payload, history: [], matrix: {} }].sort((a, b) => a.name.localeCompare(b.name)));
            } else {
                await updateDoc(ref, payload);
                toast.success("Actualizado", "Datos guardados.");

                // Update local list
                setEmployees(prev => prev.map(e => e.id === empId ? { ...e, ...payload } : e));
            }

            setIsCreating(false);
            setEditingEmp(null);
            setIsCreating(false);
            setEditingEmp(null);
            setFormData({ id: '', name: '', position: '', department: '', curp: '', occupation: '' });

        } catch (error) {
            console.error("Error saving employee:", error);
            toast.error("Error", "No se pudo guardar.");
        } finally {
            setSaving(false);
        }
    };

    const getComplianceColor = (score) => {
        if (score >= 95) return styles.complianceHigh;
        if (score >= 80) return styles.complianceMedium;
        return styles.complianceLow;
    };

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.header}>
                    <div>
                        <Link href="/capacitacion" className={styles.backBtn}>← Volver</Link>
                        <h1>Gestión de Empleados</h1>
                        <p>Administración de personal y datos maestros.</p>
                    </div>
                    <Button onClick={handleCreate}>+ Nuevo Empleado</Button>
                </div>

                <Card className={styles.filterCard}>
                    <CardContent className={styles.filterContent}>
                        <div className={styles.filterGroup}>
                            <label>Buscar</label>
                            <input
                                type="text"
                                placeholder="Nombre o ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                        <div className={styles.filterGroup}>
                            <label>Departamento</label>
                            <select
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className={styles.select}
                            >
                                <option value="Todos">Todos</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <label>Puesto</label>
                            <select
                                value={posFilter}
                                onChange={(e) => setPosFilter(e.target.value)}
                                className={styles.select}
                            >
                                <option value="Todos">Todos</option>
                                {positions.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className={styles.countBadge}>
                            {filteredEmployees.length} Registros
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="spinner"></div>
                ) : (
                    <>
                        <Card>
                            <CardContent style={{ padding: 0 }}>
                                <div className={styles.tableWrapper}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Puesto</th>
                                                <th>Departamento</th>
                                                <th className="text-center">Cumplimiento</th>
                                                <th style={{ textAlign: 'center' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(emp => (
                                                <tr key={emp.id}>
                                                    <td className={styles.fwBold}>
                                                        {emp.name}
                                                        <div className={styles.subText}>ID: {emp.employeeId || emp.id}</div>
                                                    </td>
                                                    <td>{emp.position}</td>
                                                    <td>
                                                        {emp.department ? (
                                                            <span className={styles.deptBadge}>{emp.department}</span>
                                                        ) : (
                                                            <span className={styles.missingBadge}>Sin Asignar ⚠️</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`${styles.badge} ${getComplianceColor(emp.matrix?.compliancePercentage || 0)}`}>
                                                            {emp.matrix?.compliancePercentage || 0}%
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div className={styles.actionButtons}>
                                                            <Button variant="ghost" size="sm" onClick={() => setViewingEmp(emp)}>
                                                                👁️ Ver
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(emp)}>
                                                                ✏️ Editar
                                                            </Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(emp)} style={{ color: 'var(--color-danger)' }}>
                                                                🗑️
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredEmployees.length === 0 && (
                                                <tr>
                                                    <td colSpan={5} className={styles.emptyState}>
                                                        No se encontraron resultados.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                <div className={styles.paginationControls}>
                                    <span className={styles.pageInfo}>
                                        Página {currentPage} de {Math.ceil(filteredEmployees.length / itemsPerPage)}
                                    </span>
                                    <div className={styles.pageButtons}>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => prev - 1)}
                                        >
                                            Anterior
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={currentPage >= Math.ceil(filteredEmployees.length / itemsPerPage)}
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                        >
                                            Siguiente
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>

            {/* Create/Edit Modal */}
            <Dialog open={isCreating || !!editingEmp} onOpenChange={(open) => !open && (setIsCreating(false), setEditingEmp(null))}>
                <DialogHeader>
                    <DialogTitle>{isCreating ? 'Nuevo Empleado' : 'Editar Empleado'}</DialogTitle>
                    <DialogClose onClose={() => { setIsCreating(false); setEditingEmp(null); }} />
                </DialogHeader>
                <DialogBody>
                    {isCreating && (
                        <div className={styles.formGroup}>
                            <label>ID Empleado (Opcional)</label>
                            <input
                                type="text"
                                value={formData.id}
                                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                placeholder="Si se deja vacío, se generará uno."
                            />
                        </div>
                    )}
                    <div className={styles.formGroup}>
                        <label>Nombre Completo</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>CURP</label>
                        <input
                            type="text"
                            value={formData.curp}
                            onChange={(e) => setFormData({ ...formData, curp: e.target.value })}
                            placeholder="Importante para DC-3"
                            maxLength={18}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Puesto (Categoría)</label>
                        <input
                            type="text"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            list="positionsList"
                        />
                        <datalist id="positionsList">
                            {positions.map(p => <option key={p} value={p} />)}
                        </datalist>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Ocupación Específica (DC-3)</label>
                        <input
                            type="text"
                            value={formData.occupation}
                            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                            placeholder="Si difiere del puesto"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Departamento</label>
                        <input
                            type="text"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            list="deptList"
                        />
                        <datalist id="deptList">
                            {departments.map(d => <option key={d} value={d} />)}
                        </datalist>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => { setIsCreating(false); setEditingEmp(null); }}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* View Detail Modal - Quick View of Compliance */}
            <Dialog open={!!viewingEmp} onOpenChange={(open) => !open && setViewingEmp(null)}>
                <DialogHeader>
                    <DialogTitle>{viewingEmp?.name}</DialogTitle>
                    <div className={styles.subtitle}>{viewingEmp?.position} - {viewingEmp?.department}</div>
                    <DialogClose onClose={() => setViewingEmp(null)} />
                </DialogHeader>
                <DialogBody>
                    <div className={styles.detailStats}>
                        <div className={styles.statBox}>
                            <div className={styles.statLabel}>Cumplimiento</div>
                            <div className={`${styles.statValue} ${getComplianceColor(viewingEmp?.matrix?.compliancePercentage || 0)}`}>
                                {viewingEmp?.matrix?.compliancePercentage || 0}%
                            </div>
                        </div>
                        <div className={styles.statBox}>
                            <div className={styles.statLabel}>Cursos Aprobados</div>
                            <div className={styles.statValue}>{viewingEmp?.matrix?.completedCount || 0} / {viewingEmp?.matrix?.requiredCount || 0}</div>
                        </div>
                    </div>

                    <h4 className={styles.sectionTitle}>Historial Reciente</h4>
                    <div className={styles.historyList}>
                        {viewingEmp?.history?.slice().reverse().slice(0, 5).map((h, i) => (
                            <div key={i} className={styles.historyItem}>
                                <div className={styles.historyName}>{h.courseName}</div>
                                <div className={styles.historyMeta}>
                                    <span>{h.date}</span>
                                    <span className={h.status === 'approved' ? styles.statusApproved : styles.statusRejected}>
                                        {h.status === 'approved' ? 'Aprobado' : 'Reprobado'} ({h.score})
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                        <Link href={`/capacitacion/analisis`} onClick={() => setViewingEmp(null)} className={styles.viewAnalysisLink}>
                            Ver análisis completo →
                        </Link>
                    </div>

                </DialogBody>
                <DialogFooter>
                    <Button onClick={() => setViewingEmp(null)}>Cerrar</Button>
                </DialogFooter>
            </Dialog>
        </>
    );
}
