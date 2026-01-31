'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import styles from './page.module.css';

// Hooks
import { useEmployees } from '@/hooks/useEmployees';

// Components
import { Button } from '@/components/ui/Button/Button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { useToast } from '@/components/ui/Toast/Toast';
import EmployeeForm from '@/components/employees/EmployeeForm/EmployeeForm';

// Data
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

export default function EmployeesPage() {
    const { user, loading: authLoading, canWrite } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    // Custom Hooks
    const {
        employees,
        loading,
        page,
        hasMore,
        nextPage,
        prevPage,
        searchEmployees,
        refresh,
        createEmployee,
        updateEmployee,
        deleteEmployee
    } = useEmployees();

    // Local State
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState({ show: false, employee: null });
    const [expandedId, setExpandedId] = useState(null);

    // Auth Protection
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/');
                return;
            }
            if (user.rol === 'demo' || user.email?.includes('demo')) {
                router.push('/induccion');
            }
        }
    }, [user, authLoading, router]);

    // Initialize Data
    useEffect(() => {
        if (user) {
            refresh();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Handle Search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchEmployees(searchTerm);
        }, 500);
        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    // Handlers
    const handleSubmit = async (employeeData) => {
        let result;
        if (editingEmployee) {
            result = await updateEmployee(editingEmployee.id, employeeData);
            if (result.success) toast.success('¡Actualizado!', 'El empleado se actualizó correctamente.');
        } else {
            result = await createEmployee(employeeData);
            if (result.success) toast.success('¡Guardado!', 'El empleado se registró correctamente.');
        }
        if (result.success) {
            setShowForm(false);
            setEditingEmployee(null);
        } else {
            toast.error('Error', 'No se pudo guardar el empleado. Intenta de nuevo.');
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setShowForm(true);
    };

    const handleDelete = (employee) => {
        setDeleteModal({ show: true, employee });
    };

    const confirmDelete = async () => {
        if (!deleteModal.employee) return;
        const result = await deleteEmployee(deleteModal.employee.id);
        if (result.success) {
            setDeleteModal({ show: false, employee: null });
            toast.success('Eliminado', 'El empleado fue eliminado correctamente.');
        } else {
            toast.error('Error', 'No se pudo eliminar el empleado.');
        }
    };

    const cancelDelete = () => {
        setDeleteModal({ show: false, employee: null });
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    };

    if (authLoading || !user) {
        return (
            <div className={styles.loadingContainer}>
                <div className="spinner"></div>
            </div>
        );
    }

    // Demo user restriction
    const isDemo = user?.rol === 'demo' || user?.email?.includes('demo');
    if (isDemo) {
        return (
            <div style={{
                height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', background: 'var(--bg-primary)', color: 'var(--text-primary)',
                textAlign: 'center', padding: '20px'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔒</div>
                <h2 style={{ margin: '0 0 10px', fontSize: '1.5rem' }}>Acceso Restringido</h2>
                <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                    Esta sección no está disponible en modo Demo.
                </p>
                <button onClick={() => router.push('/induccion')}
                    style={{
                        padding: '12px 30px', background: 'var(--color-primary)', color: 'white',
                        border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: '600'
                    }}>
                    Ir a Inducción
                </button>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <main className={styles.main} id="main-content">
                {/* Background Effects */}
                <div className={styles.bgDecoration}>
                    <div className={`${styles.blob} ${styles.blob1}`}></div>
                    <div className={`${styles.blob} ${styles.blob2}`}></div>
                </div>

                <div className={styles.container}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <Link href="/dashboard" className={styles.backBtn}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
                                </svg>
                                Volver
                            </Link>
                            <h1>Gestión de Empleados</h1>
                        </div>
                        {canWrite() && (
                            <Button onClick={() => { setShowForm(!showForm); setEditingEmployee(null); }}>
                                {showForm ? 'Cancelar' : '+ Nuevo'}
                            </Button>
                        )}
                    </div>

                    {/* Form Modal */}
                    <Dialog
                        open={showForm}
                        onOpenChange={(val) => {
                            if (!val) {
                                setShowForm(false);
                                setEditingEmployee(null);
                            }
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>{editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
                            <DialogClose onClose={() => { setShowForm(false); setEditingEmployee(null); }} />
                        </DialogHeader>
                        <DialogBody>
                            <EmployeeForm
                                title={editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                                employee={editingEmployee}
                                onSubmit={handleSubmit}
                                onCancel={() => { setShowForm(false); setEditingEmployee(null); }}
                                puestosOptions={PUESTOS_OPTIONS}
                                departamentosOptions={DEPARTAMENTOS_OPTIONS}
                                getAreasForDepartment={getAreasForDepartment}
                                embedded={true}
                            />
                        </DialogBody>
                    </Dialog>

                    {/* Stats Summary */}
                    <div className={styles.statsSummary}>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.statIconBlue}`}>👥</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{employees.length}</span>
                                <span className={styles.statLabel}>Empleados</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>✓</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{employees.filter(e => e.department).length}</span>
                                <span className={styles.statLabel}>Con Depto.</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.statIconPurple}`}>📋</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{new Set(employees.map(e => e.position).filter(Boolean)).size}</span>
                                <span className={styles.statLabel}>Puestos</span>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className={styles.searchBar}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Employees List */}
                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <div className="spinner"></div>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className={styles.emptyState}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <h3>No hay empleados</h3>
                            <p>{searchTerm ? 'No hay resultados para tu búsqueda' : 'Comienza agregando un nuevo empleado'}</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.employeesList}>
                                {employees.map((emp) => (
                                    <div key={emp.id} className={styles.employeeCard}>
                                        <div className={styles.employeeRow} onClick={() => toggleExpand(emp.id)}>
                                            <div className={styles.employeeInfo}>
                                                <div className={styles.avatarWrapper}>
                                                    {emp.photoUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={emp.photoUrl} alt={emp.name} referrerPolicy="no-referrer" />
                                                    ) : (
                                                        getInitials(emp.name)
                                                    )}
                                                </div>
                                                <div className={styles.employeeDetails}>
                                                    <span className={styles.empName}>{emp.name}</span>
                                                    <span className={styles.empMeta}>{emp.position || 'Sin puesto'} • ID: {emp.employeeId || emp.id}</span>
                                                </div>
                                            </div>
                                            <div className={styles.employeeActions}>
                                                {emp.department && (
                                                    <span className={styles.deptBadge}>{emp.department}</span>
                                                )}
                                                <button className={`${styles.expandBtn} ${expandedId === emp.id ? styles.expanded : ''}`}>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="6 9 12 15 18 9" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {expandedId === emp.id && (
                                            <div className={styles.expandedContent}>
                                                <div className={styles.detailsGrid}>
                                                    <div className={styles.detailItem}>
                                                        <span className={styles.detailLabel}>Área</span>
                                                        <span className={styles.detailValue}>{emp.area || '—'}</span>
                                                    </div>
                                                    <div className={styles.detailItem}>
                                                        <span className={styles.detailLabel}>Turno</span>
                                                        <span className={styles.detailValue}>{emp.shift || '—'}</span>
                                                    </div>
                                                    <div className={styles.detailItem}>
                                                        <span className={styles.detailLabel}>Fecha Ingreso</span>
                                                        <span className={styles.detailValue}>{emp.startDate || '—'}</span>
                                                    </div>
                                                    <div className={styles.detailItem}>
                                                        <span className={styles.detailLabel}>Escolaridad</span>
                                                        <span className={styles.detailValue}>{emp.education || '—'}</span>
                                                    </div>
                                                    <div className={styles.detailItem}>
                                                        <span className={styles.detailLabel}>CURP</span>
                                                        <span className={styles.detailValue}>{emp.curp || '—'}</span>
                                                    </div>
                                                    <div className={styles.detailItem}>
                                                        <span className={styles.detailLabel}>Eval. Desempeño</span>
                                                        <span className={styles.detailValue}>{emp.promotionData?.performanceScore ? `${emp.promotionData.performanceScore}%` : '—'}</span>
                                                    </div>
                                                </div>
                                                {canWrite() && (
                                                    <div className={styles.actionButtonsRow}>
                                                        <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(emp)}>
                                                            🗑️ Eliminar
                                                        </button>
                                                        <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => handleEdit(emp)}>
                                                            ✏️ Editar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className={styles.pagination}>
                                <Button variant="secondary" size="sm" onClick={prevPage} disabled={page <= 1 || loading}>
                                    ← Anterior
                                </Button>
                                <span className={styles.pageIndicator}>Página {page}</span>
                                <Button variant="secondary" size="sm" onClick={nextPage} disabled={!hasMore || loading}>
                                    Siguiente →
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Delete Dialog */}
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
                    <Button variant="secondary" onClick={cancelDelete}>Cancelar</Button>
                    <Button variant="danger" onClick={confirmDelete}>Eliminar</Button>
                </DialogFooter>
            </Dialog>
        </>
    );
}
