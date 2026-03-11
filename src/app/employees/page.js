'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import {
    User, Briefcase, Activity, FileText, ChevronRight, ArrowLeft,
    Search, Users, UserCheck, UserPlus, Download, Edit, Trash2, X, Save, Upload, Phone, Key, RefreshCw, Loader2
} from 'lucide-react';
import Image from 'next/image';
import { EmployeeDetail } from './components/EmployeeDetail';
import styles from './page.module.css';
import BackButton from '@/components/ui/BackButton/BackButton';
import { useEmployees } from '@/hooks/useEmployees';
import EmployeeSearchBar from '@/components/ui/EmployeeSearchBar/EmployeeSearchBar';

import { uploadFile } from '@/lib/upload';
import { useToast } from '@/components/ui/Toast/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog/ConfirmDialog';
import EmployeeSkeleton from '@/components/ui/EmployeeSkeleton/EmployeeSkeleton';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useCatalogs } from '@/hooks/useCatalogs';


import { generateEmployeeTemplate, parseImportFile, validateEmployeeImportRecords } from '@/utils/importUtils';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        // Fix for Timezone Offset:
        // If it's a YYYY-MM-DD string, parse it as LOCAL time to avoid UTC-based shift.
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-').map(Number);
            // Month is 0-indexed in Date constructor
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        const date = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        console.error('Error formatting date:', e);
        return dateString;
    }
};

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch (e) {
        console.error('Error formatting date for input:', e);
        return '';
    }
};

const getInitials = (name) => {
    if (!name) return 'EM';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
};

const calculateDatesFromStart = (startDate) => {
    if (!startDate) return {};

    const start = new Date(startDate);

    // Calculate contract end date (90 days)
    const contractEnd = new Date(start);
    contractEnd.setDate(contractEnd.getDate() + 90);

    // Calculate evaluation dates
    const eval1 = new Date(start);
    eval1.setDate(eval1.getDate() + 30);

    const eval2 = new Date(start);
    eval2.setDate(eval2.getDate() + 60);

    const eval3 = new Date(start);
    eval3.setDate(eval3.getDate() + 75);

    return {
        contractEndDate: contractEnd.toISOString().split('T')[0],
        eval1Date: eval1.toISOString().split('T')[0],
        eval2Date: eval2.toISOString().split('T')[0],
        eval3Date: eval3.toISOString().split('T')[0]
    };
};

const getEmptyFormData = () => ({
    name: '',
    employeeId: '',
    curp: '',
    phone: '',
    position: '',
    department: '',
    area: '',
    shift: '',
    status: 'Activo',
    isCandidato: false,
    startDate: '',
    contractEndDate: '',
    photoUrl: '',
    eval1Date: '',
    eval1Score: '',
    eval2Date: '',
    eval2Score: '',
    eval3Date: '',
    eval3Score: '',
    trainingPlanDelivered: false
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EmployeesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    // Pagination state
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Catalogs
    const { positions, departments, areas, loading: catalogsLoading } = useCatalogs();

    const {
        employees,
        loading,
        refresh,
        page,
        hasMore,
        hasPrevious,
        nextPage,
        prevPage,
        createEmployee,
        updateEmployee,
        deleteEmployee,
        searchEmployees
    } = useEmployees(itemsPerPage);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');

    // Bulk Import State
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = React.useRef(null);

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirmar',
        variant: 'danger',
        onConfirm: null
    });

    // Deleting state
    const [isDeleting, setIsDeleting] = useState(false);

    // ============================================================================
    // EFFECTS
    // ============================================================================

    // Auth Protection
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/');
            return;
        }

        if (user.rol === 'demo' || user.email?.includes('demo')) {
            router.push('/induccion');
        }
    }, [user, authLoading, router]);

    // Trigger search when term changes
    useEffect(() => {
        if (searchEmployees) {
            searchEmployees(searchTerm);
        }
    }, [searchTerm, searchEmployees]);

    // Initial refresh when search is empty
    useEffect(() => {
        if (user && searchTerm === '') {
            refresh();
        }
    }, [user, refresh, searchTerm]);

    // ============================================================================
    // MEMOIZED VALUES
    // ============================================================================

    // Stats calculations - memoized to avoid recalculation on every render
    const stats = useMemo(() => ({
        total: employees.length,
        active: employees.filter(e => e.status !== 'Inactivo').length,
        candidates: employees.filter(e => e.isCandidato).length
    }), [employees]);

    // ============================================================================
    // HANDLERS
    // ============================================================================

    const handleSelectEmployee = useCallback((emp) => {
        setSelectedEmployee(emp);
        setActiveTab('personal');
    }, []);

    const handleBackToList = useCallback(() => {
        setSelectedEmployee(null);
    }, []);

    const handleDeleteEmployee = useCallback((employeeId) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Empleado',
            message: '¿Estás seguro de que deseas eliminar este empleado? Esta acción no se puede deshacer.',
            confirmText: 'Eliminar',
            variant: 'danger',
            onConfirm: async () => {
                setIsDeleting(true);
                try {
                    const result = await deleteEmployee(employeeId);

                    if (!result.success) {
                        throw new Error(result.error || 'Error al eliminar');
                    }

                    setSelectedEmployee(null);
                    showToast('Empleado eliminado exitosamente', 'success');
                } catch (error) {
                    console.error('Error deleting employee:', error);
                    showToast(error.message || 'Error al eliminar el empleado', 'error');
                } finally {
                    setIsDeleting(false);
                }
            }
        });
    }, [deleteEmployee, showToast]);

    const handleItemsPerPageChange = useCallback((e) => {
        setItemsPerPage(Number(e.target.value));
    }, []);

    const handleImageError = useCallback((e, employeeName) => {
        e.target.style.display = 'none';
        const parent = e.target.parentElement;
        if (parent && !parent.querySelector('span')) {
            const span = document.createElement('span');
            span.textContent = getInitials(employeeName);
            parent.appendChild(span);
        }
    }, []);

    // ============================================================================
    // BULK IMPORT HANDLERS
    // ============================================================================

    const handleDownloadTemplate = useCallback(() => {
        try {
            generateEmployeeTemplate();
            showToast('Plantilla descargada correctamente', 'success');
        } catch (error) {
            console.error('Error downloading template:', error);
            showToast('Error al descargar la plantilla', 'error');
        }
    }, [showToast]);

    const handleImportClick = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset input
            fileInputRef.current.click();
        }
    }, []);

    const handleFileImport = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const toastId = showToast('Procesando archivo...', 'info', { autoClose: false });

        try {
            // 1. Parse File
            const records = await parseImportFile(file);

            if (records.length === 0) {
                throw new Error('El archivo no contiene registros válidos');
            }

            // 2. Validate Records
            const validation = validateEmployeeImportRecords(records, employees);

            if (validation.invalid.length > 0) {
                // Show errors (simplified for now, could be a modal)
                const errorMsg = `Se encontraron ${validation.invalid.length} errores. Primer error: Fila ${validation.invalid[0].row} - ${validation.invalid[0].issues.join(', ')}`;
                throw new Error(errorMsg);
            }

            // 3. Import Valid Records
            let importedCount = 0;
            for (const record of validation.valid) {
                const result = await createEmployee({
                    ...record,
                    status: 'Activo',
                    isCandidato: false
                });

                if (result.success) {
                    importedCount++;
                } else {
                    console.error(`Error importing row ${record.row}:`, result.error);
                }
            }

            showToast(`Importación completada: ${importedCount} empleados creados`, 'success');
            refresh(); // Refresh list

        } catch (error) {
            console.error('Import error:', error);
            showToast(error.message || 'Error al importar el archivo', 'error');
        } finally {
            setIsImporting(false);
        }
    }, [employees, createEmployee, refresh, showToast]);

    // ============================================================================
    // RENDER LOADING STATE
    // ============================================================================

    if (authLoading) {
        return (
            <AdminLayout title="Módulo">
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Cargando empleados...</p>
                </div>
            </AdminLayout>
        );
    }

    // ============================================================================
    // MAIN RENDER
    // ============================================================================

    return (
        <AdminLayout title="Gestión de Empleados">
            {/* Skip Link for Accessibility */}
            <a href="#main-content" className={styles.skipLink}>
                Saltar al contenido principal
            </a>

            {/* Profile Dropdown */}


            {/* Background Effects */}
            <div className={styles.bgDecoration} aria-hidden="true">
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
            </div>

            {/* Main Container */}
            <div className={styles.container} id="main-content">
                {/* Header Section */}
                <div className={styles.header}>
                    <div className={styles.headerContent}>

                        <h1 className={styles.pageTitle}>
                            Gestión de Empleados
                        </h1>
                        <p className={styles.pageSubtitle}>
                            Administra y consulta la información de tu equipo
                        </p>
                    </div>

                    {/* Controles Superiores: Píldoras y Buscador */}
                    <div className={styles.topControlsRow}>
                        {/* Header Meta — resumen compacto */}
                        <div className={styles.headerMeta}>
                            <span className={styles.metaBadge}>
                                <Users size={14} />
                                <strong>{stats.total}</strong> empleados
                            </span>
                            <span className={`${styles.metaBadge} ${styles.metaBadgeActive}`}>
                                <UserCheck size={14} />
                                <strong>{stats.active}</strong> activos
                            </span>
                            <span className={`${styles.metaBadge} ${styles.metaBadgeCandidates}`}>
                                <UserPlus size={14} />
                                <strong>{stats.candidates}</strong> candidatos
                            </span>
                        </div>

                        {/* Search Bar */}
                        <div className={styles.searchSection}>
                            <div className={styles.searchInner}>
                                <EmployeeSearchBar
                                    searchTerm={searchTerm}
                                    onSearchChange={setSearchTerm}
                                    onUpload={handleImportClick}
                                    onDownload={handleDownloadTemplate}
                                    onAddEmployee={() => router.push('/employees/new')}
                                    canWrite={true}
                                />
                                {/* Hidden File Input for Import */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept=".xlsx,.xls,.json"
                                    onChange={handleFileImport}
                                    disabled={isImporting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mobile Floating Action Button */}
                    {true /* depends on auth, assuming user can write as this matches TopControls behavior */ && (
                        <button 
                            className={styles.mobileFab} 
                            onClick={() => router.push('/employees/new')}
                            aria-label="Agregar empleado"
                        >
                            <UserPlus size={24} />
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div
                    className={styles.contentSection}
                    role="region"
                    aria-live="polite"
                    aria-busy={loading}
                >
                    {!selectedEmployee ? (
                        /* LIST VIEW */
                        <>
                            {loading ? (
                                <EmployeeSkeleton count={itemsPerPage} />
                            ) : employees.length > 0 ? (
                                <>
                                    <div className={styles.tableContainer}>
                                        <table className={styles.dataTable}>
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Foto</th>
                                                    <th>Empleado</th>
                                                    <th>Puesto</th>
                                                    <th>Departamento</th>
                                                    <th>Turno</th>
                                                    <th>Estatus</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employees.map(emp => (
                                                    <tr
                                                        key={emp.id}
                                                        className={styles.tableRow}
                                                        onClick={() => handleSelectEmployee(emp)}
                                                        tabIndex={0}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                handleSelectEmployee(emp);
                                                            }
                                                        }}
                                                        aria-label={`Ver detalles de ${emp.name}, ${emp.position || 'sin puesto'}`}
                                                    >
                                                        <td className={styles.cellId}>
                                                            <span className={styles.rowId}>{emp.employeeId || emp.id}</span>
                                                        </td>
                                                        <td className={styles.cellAvatar}>
                                                            <div className={styles.tableAvatar}>
                                                                {emp.photoUrl ? (
                                                                    <Image
                                                                        src={emp.photoUrl}
                                                                        alt={`Foto de ${emp.name}`}
                                                                        width={40}
                                                                        height={40}
                                                                        unoptimized
                                                                        onError={(e) => handleImageError(e, emp.name)}
                                                                    />
                                                                ) : (
                                                                    <span aria-hidden="true">{getInitials(emp.name)}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className={styles.cellName}>
                                                            <div className={styles.employeeBasicInfo}>
                                                                <span className={styles.rowName}>{emp.name}</span>
                                                                {emp.isCandidato && (
                                                                    <span className={styles.candidateBadgeMini}>Candidato</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className={styles.cellPosition}>
                                                            <span className={styles.rowPosition}>{emp.position || 'Sin puesto'}</span>
                                                        </td>
                                                        <td className={styles.cellDepartment}>
                                                            {emp.department && <span className={styles.rowDepartment}>{emp.department}</span>}
                                                        </td>
                                                        <td className={styles.cellShift}>
                                                            {emp.shift && <span className={styles.rowShift}>{emp.shift}</span>}
                                                        </td>
                                                        <td className={styles.cellStatus}>
                                                            <span className={`${styles.statusBadge} ${emp.status === 'Inactivo' ? styles.statusInactive : styles.statusActive}`}>
                                                                {emp.status || 'Activo'}
                                                            </span>
                                                        </td>
                                                        <td className={styles.cellActions}>
                                                            <ChevronRight className={styles.rowChevron} size={20} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    <div className={styles.paginationContainer}>
                                        <div className={styles.itemsPerPageSelector}>
                                            <label htmlFor="itemsPerPage" className={styles.itemsPerPageLabel}>
                                                Mostrar:
                                            </label>
                                            <select
                                                id="itemsPerPage"
                                                value={itemsPerPage}
                                                onChange={handleItemsPerPageChange}
                                                className={styles.itemsPerPageSelect}
                                            >
                                                <option value={10}>10</option>
                                                <option value={12}>12</option>
                                                <option value={15}>15</option>
                                            </select>
                                            <span className={styles.itemsPerPageText}>por página</span>
                                        </div>

                                        <div className={styles.paginationControls}>
                                            <button
                                                onClick={prevPage}
                                                disabled={!hasPrevious || loading}
                                                className={styles.paginationBtn}
                                                aria-label="Página anterior"
                                            >
                                                <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
                                                Anterior
                                            </button>
                                            <span className={styles.pageIndicator} aria-current="page">
                                                Página {page}
                                            </span>
                                            <button
                                                onClick={nextPage}
                                                disabled={!hasMore}
                                                className={styles.paginationBtn}
                                                aria-label="Página siguiente"
                                            >
                                                Siguiente
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className={styles.emptyState}>
                                    <Search size={48} />
                                    <h3>No se encontraron empleados</h3>
                                    <p>Intenta con otros términos de búsqueda</p>
                                </div>
                            )}
                        </>
                    ) : (
                        /* DETAIL VIEW */
                        <EmployeeDetail
                            employee={selectedEmployee}
                            onBack={handleBackToList}
                            onUpdate={updateEmployee}
                            onDelete={handleDeleteEmployee}
                            onImageError={handleImageError}
                            isDeleting={isDeleting}
                        />
                    )}
                </div>
            </div>

            

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                confirmText={confirmDialog.confirmText}
                cancelText="Cancelar"
                onConfirm={() => {
                    if (confirmDialog.onConfirm) {
                        confirmDialog.onConfirm();
                    }
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                variant={confirmDialog.variant}
            />
        </AdminLayout>
    );
}
