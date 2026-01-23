'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy,
    updateDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import styles from './page.module.css';

// UI Components
import { Button, IconButton } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { useToast } from '@/components/ui/Toast/Toast';
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton/Skeleton';
import { Combobox } from '@/components/ui/Combobox/Combobox';

// Datos de puestos, departamentos y áreas
import puestosData from '../../../puestos.json';
import datosData from '../../../datos.json';

// Procesar datos para los comboboxes
const PUESTOS_OPTIONS = puestosData.map(p => p.puesto);
const DEPARTAMENTOS_OPTIONS = [...new Set(datosData.map(d => d.departamento))];
const getAreasForDepartment = (dept) => {
    return datosData
        .filter(d => d.departamento === dept)
        .map(d => d.área);
};

// Configuración de plazos del Plan de Formación
const TRAINING_PLAN_CONFIG = [
    { DEPARTAMENTO: "ALMACÉN", ÁREA: "ALMACÉN", DIAS: 60 },
    { DEPARTAMENTO: "CALIDAD", ÁREA: "A. CALIDAD 1ER TURNO", DIAS: 7 },
    { DEPARTAMENTO: "CALIDAD", ÁREA: "A. CALIDAD 2DO TURNO", DIAS: 7 },
    { DEPARTAMENTO: "CALIDAD", ÁREA: "METROLOGÍA", DIAS: 7 },
    { DEPARTAMENTO: "CALIDAD", ÁREA: "CALIDAD ADMTVO", DIAS: 7 },
    { DEPARTAMENTO: "CALIDAD", ÁREA: "SGI", DIAS: 60 },
    { DEPARTAMENTO: "CALIDAD", ÁREA: "RESIDENTES DE CALIDAD", DIAS: 7 },
    { DEPARTAMENTO: "COMERCIAL", ÁREA: "VENTAS", DIAS: 60 },
    { DEPARTAMENTO: "GERENCIA DE PLANTA", ÁREA: "GERENCIA", DIAS: 60 },
    { DEPARTAMENTO: "LOGISTICA", ÁREA: "LOGISTICA", DIAS: 60 },
    { DEPARTAMENTO: "MANTENIMIENTO", ÁREA: "MANTENIMIENTO", DIAS: 90 },
    { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN ADMTVO", DIAS: 60 },
    { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN MONTAJE", DIAS: 60 },
    { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 1ER TURNO", DIAS: 60 },
    { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 2DO TURNO", DIAS: 60 },
    { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 3ER TURNO", DIAS: 60 },
    { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 4TO TURNO", DIAS: 60 },
    { DEPARTAMENTO: "PROYECTOS", ÁREA: "PROYECTOS", DIAS: 60 },
    { DEPARTAMENTO: "RECURSOS HUMANOS", ÁREA: "RECURSOS HUMANOS", DIAS: 60 },
    { DEPARTAMENTO: "SISTEMAS", ÁREA: "SISTEMAS", DIAS: 60 },
    { DEPARTAMENTO: "TALLER DE MOLDES", ÁREA: "MOLDES", DIAS: 60 }
];

export default function EmployeesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState({ show: false, employee: null });
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        employeeId: '',
        name: '',
        position: '',
        area: '',
        department: '',
        shift: '',
        startDate: '',
        eval1Score: '',
        eval2Score: '',
        eval3Score: '',
        trainingPlanDelivered: false
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadEmployees();
        }
    }, [user]);

    const loadEmployees = async () => {
        try {
            const employeesRef = collection(db, 'employees');
            const q = query(employeesRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const employeesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setEmployees(employeesList);
        } catch (error) {
            console.error('Error loading employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateDates = (startDate) => {
        const start = new Date(startDate);

        // Fin de contrato: 89 días
        const contractEnd = new Date(start);
        contractEnd.setDate(contractEnd.getDate() + 89);

        // Notificación de renovación: 75 días
        const notificationDate = new Date(start);
        notificationDate.setDate(notificationDate.getDate() + 75);

        // Evaluación 1: 30 días
        const eval1Date = new Date(start);
        eval1Date.setDate(eval1Date.getDate() + 30);

        // Evaluación 2: 60 días
        const eval2Date = new Date(start);
        eval2Date.setDate(eval2Date.getDate() + 60);

        // Evaluación 3: 75 días
        const eval3Date = new Date(start);
        eval3Date.setDate(eval3Date.getDate() + 75);

        return {
            contractEndDate: contractEnd.toISOString().split('T')[0],
            notificationDate: notificationDate.toISOString().split('T')[0],
            eval1Date: eval1Date.toISOString().split('T')[0],
            eval2Date: eval2Date.toISOString().split('T')[0],
            eval3Date: eval3Date.toISOString().split('T')[0]
        };
    };

    const getEvalStatus = (score) => {
        if (score === '' || score === null || score === undefined) return 'pending';
        const numScore = parseFloat(score);
        return numScore >= 80 ? 'approved' : 'failed';
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const calculateTrainingPlanDate = (startDate, department, area) => {
        if (!startDate || !department || !area) return null;

        // Buscar configuración por departamento y área
        const config = TRAINING_PLAN_CONFIG.find(
            c => c.DEPARTAMENTO.toUpperCase() === department.toUpperCase() &&
                c.ÁREA.toUpperCase() === area.toUpperCase()
        );

        // Si no se encuentra, buscar solo por departamento
        const configByDept = config || TRAINING_PLAN_CONFIG.find(
            c => c.DEPARTAMENTO.toUpperCase() === department.toUpperCase()
        );

        // Si no hay configuración, usar 60 días por defecto
        const days = configByDept?.DIAS || 60;

        const start = new Date(startDate);
        const deliveryDate = new Date(start);
        deliveryDate.setDate(deliveryDate.getDate() + days);

        return {
            date: deliveryDate.toISOString().split('T')[0],
            days: days
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const dates = calculateDates(formData.startDate);
            const employeeData = {
                ...formData,
                ...dates,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (editingEmployee) {
                await updateDoc(doc(db, 'employees', editingEmployee.id), employeeData);
                toast.success('¡Actualizado!', 'El empleado se actualizó correctamente.');
            } else {
                await addDoc(collection(db, 'employees'), employeeData);
                toast.success('¡Guardado!', 'El empleado se registró correctamente.');
            }

            setFormData({
                employeeId: '',
                name: '',
                position: '',
                area: '',
                department: '',
                shift: '',
                startDate: '',
                eval1Score: '',
                eval2Score: '',
                eval3Score: '',
                trainingPlanDelivered: false
            });
            setShowForm(false);
            setEditingEmployee(null);
            loadEmployees();
        } catch (error) {
            console.error('Error saving employee:', error);
            toast.error('Error', 'No se pudo guardar el empleado. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setFormData({
            employeeId: employee.employeeId,
            name: employee.name,
            position: employee.position || '',
            area: employee.area,
            department: employee.department,
            shift: employee.shift,
            startDate: employee.startDate,
            eval1Score: employee.eval1Score || '',
            eval2Score: employee.eval2Score || '',
            eval3Score: employee.eval3Score || '',
            trainingPlanDelivered: employee.trainingPlanDelivered || false
        });
        setShowForm(true);
    };

    const handleDelete = (employee) => {
        setDeleteModal({ show: true, employee });
    };

    const confirmDelete = async () => {
        if (!deleteModal.employee) return;

        try {
            await deleteDoc(doc(db, 'employees', deleteModal.employee.id));
            setDeleteModal({ show: false, employee: null });
            toast.success('Eliminado', 'El empleado fue eliminado correctamente.');
            loadEmployees();
        } catch (error) {
            console.error('Error deleting employee:', error);
            toast.error('Error', 'No se pudo eliminar el empleado. Intenta de nuevo.');
        }
    };

    const cancelDelete = () => {
        setDeleteModal({ show: false, employee: null });
    };

    const filteredEmployees = employees
        .filter(emp =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.department.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            // Extraer números del ID para ordenar numéricamente
            const numA = parseInt(a.employeeId.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.employeeId.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

    if (authLoading || !user) {
        return (
            <div className={styles.loadingContainer}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <Link href="/dashboard" className={styles.backBtn}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                Volver
                            </Link>
                            <h1>Gestión de Empleados</h1>
                        </div>
                        <button
                            onClick={() => {
                                setShowForm(!showForm);
                                setEditingEmployee(null);
                                setFormData({
                                    employeeId: '',
                                    name: '',
                                    position: '',
                                    area: '',
                                    department: '',
                                    shift: '',
                                    startDate: '',
                                    eval1Score: '',
                                    eval2Score: '',
                                    eval3Score: '',
                                    trainingPlanDelivered: false
                                });
                            }}
                            className="btn btn-primary"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            {showForm ? 'Cancelar' : 'Nuevo Empleado'}
                        </button>
                    </div>

                    {showForm && (
                        <div className={`${styles.formCard} fade-in`}>
                            <h2>{editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</h2>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formGrid}>
                                    <div className={styles.inputGroup}>
                                        <label htmlFor="employeeId" className="label">ID de Empleado</label>
                                        <input
                                            id="employeeId"
                                            type="text"
                                            className="input-field"
                                            placeholder=""
                                            value={formData.employeeId}
                                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label htmlFor="name" className="label">Nombre Completo</label>
                                        <input
                                            id="name"
                                            type="text"
                                            className="input-field"
                                            placeholder=""
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                            spellCheck="true"
                                            autoComplete="off"
                                            style={{ textTransform: 'uppercase' }}
                                            required
                                        />
                                    </div>

                                    <Combobox
                                        label="Puesto"
                                        value={formData.position}
                                        onChange={(value) => setFormData({ ...formData, position: value })}
                                        options={PUESTOS_OPTIONS}
                                        placeholder="Seleccionar puesto..."
                                        searchPlaceholder="Buscar puesto..."
                                        required
                                    />

                                    <Combobox
                                        label="Departamento"
                                        value={formData.department}
                                        onChange={(value) => setFormData({
                                            ...formData,
                                            department: value,
                                            area: '' // Reset area when department changes
                                        })}
                                        options={DEPARTAMENTOS_OPTIONS}
                                        placeholder="Seleccionar departamento..."
                                        searchPlaceholder="Buscar departamento..."
                                        required
                                    />

                                    <Combobox
                                        label="Área"
                                        value={formData.area}
                                        onChange={(value) => setFormData({ ...formData, area: value })}
                                        options={formData.department ? getAreasForDepartment(formData.department) : []}
                                        placeholder={formData.department ? "Seleccionar área..." : "Primero selecciona departamento"}
                                        searchPlaceholder="Buscar área..."
                                        disabled={!formData.department}
                                        required
                                    />

                                    <div className={styles.inputGroup}>
                                        <label htmlFor="shift" className="label">Turno</label>
                                        <select
                                            id="shift"
                                            className="input-field"
                                            value={formData.shift}
                                            onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                            required
                                        >
                                            <option value="">Seleccionar turno</option>
                                            <option value="1">Turno 1</option>
                                            <option value="2">Turno 2</option>
                                            <option value="3">Turno 3</option>
                                            <option value="4">Turno 4</option>
                                            <option value="Mixto">Mixto</option>
                                        </select>
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label htmlFor="startDate" className="label">Fecha de Inicio</label>
                                        <input
                                            id="startDate"
                                            type="date"
                                            className="input-field"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                {formData.startDate && (
                                    <div className={styles.calculatedDates}>
                                        <h3 className={styles.sectionTitle}>Fechas Importantes</h3>
                                        <div className={styles.datesGrid}>
                                            <div className={styles.dateInfo}>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                    <line x1="3" y1="10" x2="21" y2="10" />
                                                </svg>
                                                <div>
                                                    <strong>Fin de Contrato:</strong> {formatDate(calculateDates(formData.startDate).contractEndDate)}
                                                </div>
                                            </div>
                                        </div>

                                        <h3 className={styles.sectionTitle} style={{ marginTop: 'var(--spacing-lg)' }}>Evaluaciones de Desempeño</h3>
                                        <div className={styles.evalsGrid}>
                                            <div className={`${styles.evalCard} ${getEvalStatus(formData.eval1Score) === 'approved' ? styles.evalApproved : getEvalStatus(formData.eval1Score) === 'failed' ? styles.evalFailed : ''}`}>
                                                <div className={styles.evalHeader}>
                                                    <span className={styles.evalNumber}>1</span>
                                                    <div>
                                                        <strong>Evaluación 1</strong>
                                                        <span className={styles.evalDate}>{formatDate(calculateDates(formData.startDate).eval1Date)} (30 días)</span>
                                                    </div>
                                                </div>
                                                <div className={styles.evalInput}>
                                                    <label htmlFor="eval1Score">Calificación:</label>
                                                    <input
                                                        id="eval1Score"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        className="input-field"
                                                        placeholder="0-100"
                                                        value={formData.eval1Score}
                                                        onChange={(e) => setFormData({ ...formData, eval1Score: e.target.value })}
                                                    />
                                                    {formData.eval1Score && (
                                                        <span className={`${styles.evalStatus} ${getEvalStatus(formData.eval1Score) === 'approved' ? styles.approved : styles.failed}`}>
                                                            {getEvalStatus(formData.eval1Score) === 'approved' ? '✓ Aprobado' : '✗ Requiere seguimiento'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`${styles.evalCard} ${getEvalStatus(formData.eval2Score) === 'approved' ? styles.evalApproved : getEvalStatus(formData.eval2Score) === 'failed' ? styles.evalFailed : ''}`}>
                                                <div className={styles.evalHeader}>
                                                    <span className={styles.evalNumber}>2</span>
                                                    <div>
                                                        <strong>Evaluación 2</strong>
                                                        <span className={styles.evalDate}>{formatDate(calculateDates(formData.startDate).eval2Date)} (60 días)</span>
                                                    </div>
                                                </div>
                                                <div className={styles.evalInput}>
                                                    <label htmlFor="eval2Score">Calificación:</label>
                                                    <input
                                                        id="eval2Score"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        className="input-field"
                                                        placeholder="0-100"
                                                        value={formData.eval2Score}
                                                        onChange={(e) => setFormData({ ...formData, eval2Score: e.target.value })}
                                                    />
                                                    {formData.eval2Score && (
                                                        <span className={`${styles.evalStatus} ${getEvalStatus(formData.eval2Score) === 'approved' ? styles.approved : styles.failed}`}>
                                                            {getEvalStatus(formData.eval2Score) === 'approved' ? '✓ Aprobado' : '✗ Requiere seguimiento'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className={`${styles.evalCard} ${getEvalStatus(formData.eval3Score) === 'approved' ? styles.evalApproved : getEvalStatus(formData.eval3Score) === 'failed' ? styles.evalFailed : ''}`}>
                                                <div className={styles.evalHeader}>
                                                    <span className={styles.evalNumber}>3</span>
                                                    <div>
                                                        <strong>Evaluación 3</strong>
                                                        <span className={styles.evalDate}>{formatDate(calculateDates(formData.startDate).eval3Date)} (75 días)</span>
                                                    </div>
                                                </div>
                                                <div className={styles.evalInput}>
                                                    <label htmlFor="eval3Score">Calificación:</label>
                                                    <input
                                                        id="eval3Score"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        className="input-field"
                                                        placeholder="0-100"
                                                        value={formData.eval3Score}
                                                        onChange={(e) => setFormData({ ...formData, eval3Score: e.target.value })}
                                                    />
                                                    {formData.eval3Score && (
                                                        <span className={`${styles.evalStatus} ${getEvalStatus(formData.eval3Score) === 'approved' ? styles.approved : styles.failed}`}>
                                                            {getEvalStatus(formData.eval3Score) === 'approved' ? '✓ Aprobado' : '✗ Requiere seguimiento'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.evalLegend}>
                                            <span><strong>≥ 80:</strong> Aprobado</span>
                                            <span><strong>&lt; 80:</strong> Reprobado - Requiere seguimiento</span>
                                        </div>

                                        {/* Plan de Formación */}
                                        <h3 className={styles.sectionTitle} style={{ marginTop: 'var(--spacing-lg)' }}>Plan de Formación</h3>
                                        <div className={styles.trainingPlanCard}>
                                            <div className={styles.trainingPlanInfo}>
                                                <div className={styles.trainingPlanIcon}>
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                    </svg>
                                                </div>
                                                <div className={styles.trainingPlanDetails}>
                                                    <strong>Fecha de Entrega:</strong>
                                                    {calculateTrainingPlanDate(formData.startDate, formData.department, formData.area) ? (
                                                        <span className={styles.trainingDate}>
                                                            {formatDate(calculateTrainingPlanDate(formData.startDate, formData.department, formData.area).date)}
                                                            <span className={styles.trainingDays}>
                                                            </span>
                                                        </span>
                                                    ) : (
                                                        <span className={styles.trainingPending}>Ingresa fecha de inicio, departamento y área</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={styles.trainingPlanCheckbox}>
                                                <label className={styles.checkboxLabel}>
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.trainingPlanDelivered}
                                                        onChange={(e) => setFormData({ ...formData, trainingPlanDelivered: e.target.checked })}
                                                        className={styles.checkbox}
                                                    />
                                                    <span className={styles.checkboxCustom}></span>
                                                    <span className={styles.checkboxText}>
                                                        {formData.trainingPlanDelivered ? '✓ Plan Entregado' : 'Marcar como Entregado'}
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className={styles.formActions}>
                                    <button type="submit" className="btn btn-primary">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                            <polyline points="17 21 17 13 7 13 7 21" />
                                            <polyline points="7 3 7 8 15 8" />
                                        </svg>
                                        {editingEmployee ? 'Actualizar' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className={styles.searchBar}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, ID o departamento..."
                            className="input-field"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <div className="spinner"></div>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className={styles.emptyState}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <h3>No hay empleados registrados</h3>
                            <p>Comienza agregando un nuevo empleado</p>
                        </div>
                    ) : (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Puesto</th>
                                        <th>Área</th>
                                        <th>Departamento</th>
                                        <th>Turno</th>
                                        <th>Inicio</th>
                                        <th>Fin Contrato</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEmployees.map((employee) => (
                                        <tr key={employee.id}>
                                            <td>{employee.employeeId}</td>
                                            <td className={styles.nameCell}>
                                                <Avatar name={employee.name} size="sm" />
                                                {employee.name}
                                            </td>
                                            <td>{employee.position || '-'}</td>
                                            <td>{employee.area}</td>
                                            <td>{employee.department}</td>
                                            <td>
                                                <Badge variant="secondary" size="sm">Turno {employee.shift}</Badge>
                                            </td>
                                            <td>{formatDate(employee.startDate)}</td>
                                            <td>{formatDate(employee.contractEndDate)}</td>
                                            <td>
                                                <div className={styles.actions}>
                                                    <button
                                                        onClick={() => handleEdit(employee)}
                                                        className={styles.editBtn}
                                                        title="Editar"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(employee)}
                                                        className={styles.deleteBtn}
                                                        title="Eliminar"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="3 6 5 6 21 6" />
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal de Confirmación de Eliminación */}
            <Dialog open={deleteModal.show} onOpenChange={(open) => !open && cancelDelete()}>
                <DialogHeader>
                    <DialogTitle>¿Eliminar Empleado?</DialogTitle>
                    <DialogDescription>
                        Estás a punto de eliminar a <strong>{deleteModal.employee?.name}</strong>.
                        Esta acción no se puede deshacer.
                    </DialogDescription>
                    <DialogClose onClose={cancelDelete} />
                </DialogHeader>
                <DialogFooter>
                    <Button variant="secondary" onClick={cancelDelete}>
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={confirmDelete}
                        icon={
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                        }
                    >
                        Eliminar
                    </Button>
                </DialogFooter>
            </Dialog>
        </>
    );
}
