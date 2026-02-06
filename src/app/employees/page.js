'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
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
import EmployeeSearchBar from '@/components/EmployeeSearchBar/EmployeeSearchBar';

// Utils
import { assignAccessCodeToCandidate } from '@/lib/rhUtils';

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

    // Protección: Redirigir candidatos a su dashboard
    useEffect(() => {
        const candidateSession = sessionStorage.getItem('candidate_session');
        if (candidateSession) {
            router.push('/candidatos/dashboard');
            return;
        }
    }, [router]);
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
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteModal, setDeleteModal] = useState({ show: false, employee: null });
    const [accessCodeModal, setAccessCodeModal] = useState({ show: false, code: null, expiresAt: null, employeeName: null });
    const [generatingCode, setGeneratingCode] = useState(false);

    // Search input ref to maintain focus
    const searchInputRef = useRef(null);

    // Bulk upload refs and state
    const bulkFileInputRef = useRef(null);
    const [bulkUploadProgress, setBulkUploadProgress] = useState({ show: false, current: 0, total: 0, errors: [] });

    // iOS-style navigation state: 'list', 'detail', 'edit'
    const [activeView, setActiveView] = useState('list');
    const [selectedEmployee, setSelectedEmployee] = useState(null);

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

    // Memoized stats calculations to prevent expensive recalculations
    const employeeStats = useMemo(() => ({
        total: employees.length,
        withDepartment: employees.filter(e => e.department).length,
        uniquePositions: new Set(employees.map(e => e.position).filter(Boolean)).size
    }), [employees]);

    // Handle Search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchEmployees(searchTerm);
        }, 500);
        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm]);

    // Restore focus to search input after search results update
    useEffect(() => {
        if (searchTerm && searchInputRef.current && document.activeElement !== searchInputRef.current) {
            // Only restore focus if user was typing (not if they clicked elsewhere)
            const wasTyping = searchInputRef.current.value === searchTerm;
            if (wasTyping) {
                searchInputRef.current.focus();
            }
        }
    }, [employees, searchTerm]);

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
            // Update selected employee if editing
            if (editingEmployee && selectedEmployee?.id === editingEmployee.id) {
                setSelectedEmployee({ ...selectedEmployee, ...employeeData });
            }
            setEditingEmployee(null);
            // Go back to previous view
            if (selectedEmployee) {
                setActiveView('detail');
            } else {
                setActiveView('list');
            }
        } else {
            if (result.error === 'ID_DUPLICADO') {
                toast.error('ID Duplicado', result.message || 'Este ID de empleado ya existe.');
            } else {
                toast.error('Error', 'No se pudo guardar el empleado. Intenta de nuevo.');
            }
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setActiveView('edit');
    };

    const handleNewEmployee = () => {
        setEditingEmployee(null);
        setSelectedEmployee(null);
        setActiveView('edit');
    };

    const handleCancelEdit = () => {
        setEditingEmployee(null);
        if (selectedEmployee) {
            setActiveView('detail');
        } else {
            setActiveView('list');
        }
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
            // Go back to list if we deleted the selected employee
            if (selectedEmployee?.id === deleteModal.employee.id) {
                setActiveView('list');
                setSelectedEmployee(null);
            }
        } else {
            toast.error('Error', 'No se pudo eliminar el empleado.');
        }
    };

    const cancelDelete = () => {
        setDeleteModal({ show: false, employee: null });
    };

    const selectEmployee = (emp) => {
        setSelectedEmployee(emp);
        setActiveView('detail');
    };

    const handleGenerateAccessCode = async (employeeId, employeeName) => {
        setGeneratingCode(true);
        try {
            // Generate for 3 days expiration
            const result = await assignAccessCodeToCandidate(employeeId, 3);
            if (result.success) {
                setAccessCodeModal({
                    show: true,
                    code: result.code,
                    expiresAt: result.expiresAt,
                    employeeName: employeeName
                });
                toast.success('Código generado', 'Código de acceso creado correctamente');
                // Refresh employee data to show new code
                refresh();
            } else {
                toast.error('Error', result.error || 'No se pudo generar el código');
            }
        } catch (error) {
            console.error('Error generating access code:', error);
            toast.error('Error', 'Ocurrió un error al generar el código');
        } finally {
            setGeneratingCode(false);
        }
    };

    const handleCopyCode = () => {
        if (accessCodeModal.code) {
            navigator.clipboard.writeText(accessCodeModal.code);
            toast.success('Copiado', 'Código copiado al portapapeles');
        }
    };

    const closeAccessCodeModal = () => {
        setAccessCodeModal({ show: false, code: null, expiresAt: null, employeeName: null });
    };

    const goBackToList = () => {
        setActiveView('list');
        setSelectedEmployee(null);
    };

    // === BULK UPLOAD HANDLERS ===
    const handleBulkUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (!Array.isArray(data)) {
                toast.error('Formato Inválido', 'El archivo debe contener un arreglo de empleados.');
                return;
            }

            setBulkUploadProgress({ show: true, current: 0, total: data.length, errors: [] });
            const errors = [];

            for (let i = 0; i < data.length; i++) {
                const emp = data[i];

                // Validate required fields
                if (!emp.employeeId || !emp.name) {
                    errors.push(`Fila ${i + 1}: Falta employeeId o name`);
                    continue;
                }

                const result = await createEmployee({
                    employeeId: String(emp.employeeId),
                    name: emp.name.toUpperCase(),
                    curp: emp.curp || '',
                    position: emp.position || '',
                    department: emp.department || '',
                    area: emp.area || '',
                    shift: emp.shift || '',
                    startDate: emp.startDate || '',
                    contractEndDate: emp.contractEndDate || '',
                    isCandidato: emp.isCandidato || false,
                    status: emp.isCandidato ? 'Candidato' : 'Activo'
                });

                if (!result.success) {
                    errors.push(`${emp.employeeId}: ${result.message || result.error}`);
                }

                setBulkUploadProgress(prev => ({ ...prev, current: i + 1 }));
            }

            setBulkUploadProgress(prev => ({ ...prev, errors }));

            if (errors.length === 0) {
                toast.success('¡Carga Completa!', `Se importaron ${data.length} empleados correctamente.`);
            } else {
                toast.error('Carga con Errores', `${data.length - errors.length} importados, ${errors.length} con errores.`);
            }

            // Reset file input
            if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';

            // Refresh list
            refresh();

        } catch (err) {
            console.error('Bulk upload error:', err);
            toast.error('Error de Archivo', 'No se pudo leer el archivo JSON. Verifica el formato.');
        }
    };

    const handleDownloadTemplate = () => {
        window.open('/plantilla_empleados.json', '_blank');
    };

    const closeBulkModal = () => {
        setBulkUploadProgress({ show: false, current: 0, total: 0, errors: [] });
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    };

    // Chevron Icon
    const ChevronRight = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );

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

    // Get slide class based on view hierarchy
    const getSlideClass = (view) => {
        if (view === activeView) return styles.active;

        const viewOrder = ['list', 'detail', 'edit'];
        const currentIndex = viewOrder.indexOf(activeView);
        const viewIndex = viewOrder.indexOf(view);

        if (viewIndex < currentIndex) return styles.slideOut;
        return styles.slideIn;
    };

    // Edit View Component
    const EditView = () => (
        <div className={`${styles.slidePanel} ${getSlideClass('edit')}`}>
            {/* Back button and title */}
            <div className={styles.detailHeader}>
                <button onClick={handleCancelEdit} className={styles.backButton}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    {editingEmployee ? 'Detalle' : 'Empleados'}
                </button>
            </div>

            <div className={styles.formContainer}>
                <h1 className={styles.formTitle}>
                    {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                </h1>
                <div className={styles.formCard}>
                    <EmployeeForm
                        title={editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                        employee={editingEmployee}
                        onSubmit={handleSubmit}
                        onCancel={handleCancelEdit}
                        puestosOptions={PUESTOS_OPTIONS}
                        departamentosOptions={DEPARTAMENTOS_OPTIONS}
                        getAreasForDepartment={getAreasForDepartment}
                        embedded={true}
                    />
                </div>
            </div>
        </div>
    );

    // Detail View Component
    const DetailView = () => (
        <div className={`${styles.slidePanel} ${getSlideClass('detail')}`}>
            {/* Back button and title */}
            <div className={styles.detailHeader}>
                <button onClick={goBackToList} className={styles.backButton}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Empleados
                </button>
            </div>

            {!selectedEmployee && (
                <div className={styles.emptyDetail}>
                    <div className={styles.emptyDetailIcon}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <h3 className={styles.emptyDetailTitle}>Selecciona un empleado</h3>
                    <p className={styles.emptyDetailText}>Elige un empleado de la lista para ver sus detalles</p>
                </div>
            )}

            {selectedEmployee && (
                <>
                    {/* Profile Header */}
                    <div className={styles.profileHeaderCard}>
                        <div className={styles.avatarSection}>
                            <div className={styles.avatarLarge}>
                                {selectedEmployee.photoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={selectedEmployee.photoUrl} alt={selectedEmployee.name} referrerPolicy="no-referrer" />
                                ) : (
                                    <span>{getInitials(selectedEmployee.name)}</span>
                                )}
                            </div>
                            <h2 className={styles.employeeName}>{selectedEmployee.name}</h2>
                            <p className={styles.employeeIdText}>ID: {selectedEmployee.employeeId || selectedEmployee.id}</p>
                        </div>
                    </div>

                    {/* Personal Info Section */}
                    <div className={styles.settingsGroup}>
                        <h3 className={styles.settingsGroupTitle}>Información Personal</h3>
                        <div className={styles.settingsCard}>
                            <div className={styles.settingsItem}>
                                <div className={`${styles.settingsIcon} ${styles.iconBlue}`}>📋</div>
                                <span className={styles.settingsLabel}>CURP</span>
                                <span className={styles.settingsValue}>{selectedEmployee.curp || '—'}</span>
                            </div>
                            <div className={styles.settingsItem}>
                                <div className={`${styles.settingsIcon} ${styles.iconPurple}`}>🎓</div>
                                <span className={styles.settingsLabel}>Escolaridad</span>
                                <span className={styles.settingsValue}>{selectedEmployee.education || '—'}</span>
                            </div>
                            <div className={styles.settingsItem}>
                                <div className={`${styles.settingsIcon} ${styles.iconGreen}`}>📅</div>
                                <span className={styles.settingsLabel}>Fecha Ingreso</span>
                                <span className={styles.settingsValue}>{selectedEmployee.startDate || '—'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Work Info Section */}
                    <div className={styles.settingsGroup}>
                        <h3 className={styles.settingsGroupTitle}>Información Laboral</h3>
                        <div className={styles.settingsCard}>
                            <div className={styles.settingsItem}>
                                <div className={`${styles.settingsIcon} ${styles.iconOrange}`}>💼</div>
                                <span className={styles.settingsLabel}>Puesto</span>
                                <span className={styles.settingsValue}>{selectedEmployee.position || '—'}</span>
                            </div>
                            <div className={styles.settingsItem}>
                                <div className={`${styles.settingsIcon} ${styles.iconTeal}`}>🏢</div>
                                <span className={styles.settingsLabel}>Departamento</span>
                                <span className={styles.settingsValue}>{selectedEmployee.department || '—'}</span>
                            </div>
                            <div className={styles.settingsItem}>
                                <div className={`${styles.settingsIcon} ${styles.iconPink}`}>📍</div>
                                <span className={styles.settingsLabel}>Área</span>
                                <span className={styles.settingsValue}>{selectedEmployee.area || '—'}</span>
                            </div>
                            <div className={styles.settingsItem}>
                                <div className={`${styles.settingsIcon} ${styles.iconGray}`}>⏰</div>
                                <span className={styles.settingsLabel}>Turno</span>
                                <span className={styles.settingsValue}>{selectedEmployee.shift || '—'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Performance Section */}
                    {selectedEmployee.promotionData?.performanceScore && (
                        <div className={styles.settingsGroup}>
                            <h3 className={styles.settingsGroupTitle}>Desempeño</h3>
                            <div className={styles.settingsCard}>
                                <div className={styles.settingsItem}>
                                    <div className={`${styles.settingsIcon} ${styles.iconGreen}`}>📊</div>
                                    <span className={styles.settingsLabel}>Evaluación</span>
                                    <span className={styles.settingsValue}>{selectedEmployee.promotionData.performanceScore}%</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Candidate Management Section */}
                    {(user?.rol === 'super_admin' || user?.rol === 'rh') && selectedEmployee.curp && (
                        <div className={styles.settingsGroup}>
                            <h3 className={styles.settingsGroupTitle}>Gestión de Candidatos</h3>
                            <div className={styles.settingsCard}>
                                <div className={styles.settingsItem}>
                                    <div className={`${styles.settingsIcon} ${styles.iconBlue}`}>🔑</div>
                                    <span className={styles.settingsLabel}>Código de Acceso</span>
                                    <span className={styles.settingsValue}>
                                        {selectedEmployee.accessCode ? (
                                            <span style={{
                                                background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                color: 'white',
                                                fontWeight: '600',
                                                letterSpacing: '1px'
                                            }}>
                                                {selectedEmployee.accessCode}
                                            </span>
                                        ) : '—'}
                                    </span>
                                </div>
                                {selectedEmployee.accessCodeExpires && (
                                    <div className={styles.settingsItem}>
                                        <div className={`${styles.settingsIcon} ${styles.iconOrange}`}>⏱️</div>
                                        <span className={styles.settingsLabel}>Expira</span>
                                        <span className={styles.settingsValue}>
                                            {new Date(selectedEmployee.accessCodeExpires).toLocaleDateString('es-MX', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                )}
                                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleGenerateAccessCode(
                                            selectedEmployee.id,
                                            selectedEmployee.name
                                        )}
                                        disabled={generatingCode}
                                        style={{ width: '100%' }}
                                    >
                                        {generatingCode ? 'Generando...' : (selectedEmployee.accessCode ? '🔄 Regenerar Código' : '➕ Generar Código')}
                                    </Button>
                                    <p style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--text-tertiary)',
                                        marginTop: '8px',
                                        textAlign: 'center'
                                    }}>
                                        El código permite acceso al portal de candidatos
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions Section */}
                    {canWrite() && (
                        <div className={styles.settingsGroup}>
                            <h3 className={styles.settingsGroupTitle}>Acciones</h3>
                            <div className={styles.settingsCard}>
                                <button className={styles.settingsItem} onClick={() => handleEdit(selectedEmployee)}>
                                    <div className={`${styles.settingsIcon} ${styles.iconBlue}`}>✏️</div>
                                    <span className={styles.settingsLabel}>Editar Empleado</span>
                                    <ChevronRight />
                                </button>
                                <button className={`${styles.settingsItem} ${styles.dangerItem}`} onClick={() => handleDelete(selectedEmployee)}>
                                    <div className={`${styles.settingsIcon} ${styles.iconRed}`}>🗑️</div>
                                    <span className={`${styles.settingsLabel} ${styles.dangerText}`}>Eliminar Empleado</span>
                                    <ChevronRight />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    // List View Component
    const ListView = () => (
        <div className={`${styles.slidePanel} ${getSlideClass('list')}`}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <Link href="/dashboard" className={styles.headerBackLink}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Dashboard
                </Link>
                <h1 className={styles.pageTitle}>Empleados</h1>
            </div>


            {/* Modern Search Bar with Actions */}
            <EmployeeSearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onUpload={() => bulkFileInputRef.current?.click()}
                onDownload={handleDownloadTemplate}
                onAddEmployee={handleNewEmployee}
                canWrite={canWrite()}
            />

            {/* Hidden File Input for Bulk Upload */}
            <input
                type="file"
                ref={bulkFileInputRef}
                accept=".json"
                onChange={handleBulkUpload}
                style={{ display: 'none' }}
            />


            {/* Bulk Upload Progress Modal */}
            {bulkUploadProgress.show && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'var(--card-bg, white)',
                        borderRadius: '16px',
                        padding: '32px 40px',
                        maxWidth: '320px',
                        width: '85%',
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
                    }}>
                        <p style={{
                            marginBottom: '20px',
                            fontSize: '2.5rem',
                            fontWeight: '300',
                            color: 'var(--text-primary, #1c1c1e)',
                            letterSpacing: '-1px'
                        }}>
                            {bulkUploadProgress.current} / {bulkUploadProgress.total}
                        </p>
                        <div style={{
                            height: '4px',
                            background: 'var(--divider, #e5e5ea)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            marginBottom: '24px'
                        }}>
                            <div style={{
                                width: `${(bulkUploadProgress.current / bulkUploadProgress.total) * 100}%`,
                                height: '100%',
                                background: '#007AFF',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                        {bulkUploadProgress.errors.length > 0 && (
                            <div style={{
                                textAlign: 'left',
                                maxHeight: '100px',
                                overflow: 'auto',
                                fontSize: '0.75rem',
                                color: '#FF3B30',
                                marginBottom: '16px',
                                padding: '8px',
                                background: 'rgba(255,59,48,0.08)',
                                borderRadius: '8px'
                            }}>
                                {bulkUploadProgress.errors.map((err, i) => (
                                    <div key={i} style={{ marginBottom: '4px' }}>{err}</div>
                                ))}
                            </div>
                        )}
                        {bulkUploadProgress.current === bulkUploadProgress.total && (
                            <button
                                onClick={closeBulkModal}
                                style={{
                                    padding: '10px 28px',
                                    background: '#007AFF',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '20px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Cerrar
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Stats Summary */}
            <div className={styles.statsRow}>
                <div className={`${styles.statCard} ${styles.statBlue}`}>
                    <span className={styles.statNumber}>{employeeStats.total}</span>
                    <span className={styles.statLabel}>Empleados</span>
                </div>
                <div className={`${styles.statCard} ${styles.statGreen}`}>
                    <span className={styles.statNumber}>{employeeStats.withDepartment}</span>
                    <span className={styles.statLabel}>Con Depto</span>
                </div>
                <div className={`${styles.statCard} ${styles.statPurple}`}>
                    <span className={styles.statNumber}>{employeeStats.uniquePositions}</span>
                    <span className={styles.statLabel}>Puestos</span>
                </div>
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
                    <div className={styles.settingsGroup}>
                        <h3 className={styles.settingsGroupTitle}>Lista de Empleados</h3>
                        <div className={styles.settingsCard}>
                            {employees.map((emp) => (
                                <button key={emp.id} className={styles.employeeItem} onClick={() => selectEmployee(emp)}>
                                    <div className={styles.employeeAvatar}>
                                        {emp.photoUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={emp.photoUrl} alt={emp.name} referrerPolicy="no-referrer" />
                                        ) : (
                                            <span>{getInitials(emp.name)}</span>
                                        )}
                                    </div>
                                    <div className={styles.employeeInfo}>
                                        <span className={styles.empName}>{emp.name}</span>
                                        <span className={styles.empMeta}>{emp.position || 'Sin puesto'} • ID: {emp.employeeId || emp.id}</span>
                                    </div>
                                    <ChevronRight />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className={styles.pagination}>
                        <button className={styles.paginationBtn} onClick={prevPage} disabled={page <= 1 || loading}>
                            ← Anterior
                        </button>
                        <span className={styles.pageIndicator}>Página {page}</span>
                        <button className={styles.paginationBtn} onClick={nextPage} disabled={!hasMore || loading}>
                            Siguiente →
                        </button>
                    </div>
                </>
            )}
        </div>
    );

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
                    <div className={styles.slideContainer}>
                        <ListView />
                        <DetailView />
                        <EditView />
                    </div>
                </div>
            </main>

            {/* Delete Dialog - Keep as modal for confirmation */}
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

            {/* Access Code Dialog */}
            <Dialog open={accessCodeModal.show} onOpenChange={(open) => !open && closeAccessCodeModal()}>
                <DialogHeader>
                    <DialogTitle>✅ Código de Acceso Generado</DialogTitle>
                    <DialogDescription>
                        Código de acceso para <strong>{accessCodeModal.employeeName}</strong>
                    </DialogDescription>
                    <DialogClose onClose={closeAccessCodeModal} />
                </DialogHeader>

                <div style={{
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    alignItems: 'center'
                }}>
                    {/* Access Code Display */}
                    <div style={{
                        background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)',
                        padding: '20px 40px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 16px rgba(0, 122, 255, 0.3)'
                    }}>
                        <p style={{
                            fontSize: '2.5rem',
                            fontWeight: '700',
                            color: 'white',
                            letterSpacing: '4px',
                            margin: 0,
                            fontFamily: 'monospace'
                        }}>
                            {accessCodeModal.code}
                        </p>
                    </div>

                    {/* Expiration Info */}
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                            <strong>Válido hasta:</strong> {accessCodeModal.expiresAt && new Date(accessCodeModal.expiresAt).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                            Este código expira en 3 días
                        </p>
                    </div>

                    {/* Instructions */}
                    <div style={{
                        background: 'var(--bg-secondary)',
                        padding: '16px',
                        borderRadius: '12px',
                        width: '100%'
                    }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                            📋 <strong>Instrucciones:</strong>
                        </p>
                        <ol style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-secondary)',
                            margin: '8px 0 0 0',
                            paddingLeft: '20px'
                        }}>
                            <li>Proporciona este código al candidato</li>
                            <li>El candidato debe acceder a <code>/candidatos</code></li>
                            <li>Ingresar su ID, CURP y este código</li>
                        </ol>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={closeAccessCodeModal}>Cerrar</Button>
                    <Button onClick={handleCopyCode}>📋 Copiar Código</Button>
                </DialogFooter>
            </Dialog>
        </>
    );
}
