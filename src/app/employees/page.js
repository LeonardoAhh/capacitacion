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
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { useToast } from '@/components/ui/Toast/Toast';
import EmployeeForm from '@/components/employees/EmployeeForm/EmployeeForm';
import EmployeeTable from '@/components/employees/EmployeeTable/EmployeeTable';
import EmployeeFilters from '@/components/employees/EmployeeFilters/EmployeeFilters';

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
    const { user, loading: authLoading } = useAuth();
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

    // Auth Protection
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Initialize Data calling refresh which calls loadEmployees('initial')
    useEffect(() => {
        if (user) {
            refresh();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Handle Search
    useEffect(() => {
        // Debounce search
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
            if (result.success) {
                toast.success('¡Actualizado!', 'El empleado se actualizó correctamente.');
            }
        } else {
            result = await createEmployee(employeeData);
            if (result.success) {
                toast.success('¡Guardado!', 'El empleado se registró correctamente.');
            }
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
            toast.error('Error', 'No se pudo eliminar el empleado. Intenta de nuevo.');
        }
    };

    const cancelDelete = () => {
        setDeleteModal({ show: false, employee: null });
    };

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
                        <EmployeeForm
                            title={editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                            employee={editingEmployee}
                            onSubmit={handleSubmit}
                            onCancel={() => {
                                setShowForm(false);
                                setEditingEmployee(null);
                            }}
                            puestosOptions={PUESTOS_OPTIONS}
                            departamentosOptions={DEPARTAMENTOS_OPTIONS}
                            getAreasForDepartment={getAreasForDepartment}
                        />
                    )}

                    <EmployeeFilters
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                    />

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
                            <h3>No hay empleados registrados</h3>
                            <p>{searchTerm ? 'No hay resultados para tu búsqueda' : 'Comienza agregando un nuevo empleado'}</p>
                        </div>
                    ) : (
                        <>
                            <EmployeeTable
                                employees={employees}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />

                            {/* Pagination Controls */}
                            <div className={styles.pagination}>
                                <Button
                                    variant="secondary"
                                    onClick={prevPage}
                                    disabled={page <= 1 || loading}
                                    size="sm"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="15 18 9 12 15 6" />
                                    </svg>
                                    Anterior
                                </Button>
                                <span className={styles.pageIndicator}>Página {page}</span>
                                <Button
                                    variant="secondary"
                                    onClick={nextPage}
                                    disabled={!hasMore || loading}
                                    size="sm"
                                >
                                    Siguiente
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </main>

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
