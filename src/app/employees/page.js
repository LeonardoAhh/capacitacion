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
import EmployeeImportPreview from './components/EmployeeImportPreview';
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
import { getInitials, formatFullName } from '@/lib/employeeUtils';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EmployeesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();

    // Pagination state
    const [itemsPerPage, setItemsPerPage] = useState(8);

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
    const [importPreview, setImportPreview] = useState(null);
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

    const handleUpdateEmployee = useCallback(async (id, data) => {
        const result = await updateEmployee(id, data);
        if (result.success) {
            // Actualizar el snapshot local para que el detalle refleje los cambios al instante
            setSelectedEmployee(prev => prev ? { ...prev, ...data } : prev);
        }
        return result;
    }, [updateEmployee]);

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

            // Show Preview instead of direct import
            setImportPreview(validation);
            showToast('Archivo procesado. Revisa la vista previa.', 'info');

        } catch (error) {
            console.error('Import error:', error);
            showToast(error.message || 'Error al importar el archivo', 'error');
        } finally {
            setIsImporting(false);
        }
    }, [employees, showToast]);

    const handleImportConfirm = useCallback(async (rowsToImport) => {
        setIsImporting(true);
        let importedCount = 0;
        let errors = 0;

        try {
            for (const record of rowsToImport) {
                const result = await createEmployee({
                    ...record,
                    status: 'Activo',
                    isCandidato: false
                });

                if (result.success) {
                    importedCount++;
                } else {
                    errors++;
                    console.error(`Error importing row ${record.row}:`, result.error);
                }
            }

            if (errors > 0) {
                showToast(`Importación finalizada con ${errors} errores. ${importedCount} empleados creados.`, 'warning');
            } else {
                showToast(`Importación completada: ${importedCount} empleados creados`, 'success');
            }
            
            setImportPreview(null);
            refresh();
        } catch (error) {
            console.error('Confirm import error:', error);
            showToast('Error al procesar la importación', 'error');
        } finally {
            setIsImporting(false);
        }
    }, [createEmployee, showToast, refresh]);

    const handleImportCancel = useCallback(() => {
        setImportPreview(null);
    }, []);

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




            {/* Main Container */}
                <div className={styles.container}>
                    {/* Stats Row */}
                    {/* Solicitud del usuario: "Quita las cards" (Se ocultó la sección statsGrid) */}

                    {/* Barra de Controles: Búsqueda y Botones de Acción */}
                    <div className={styles.controlsBar}>
                        <div className={styles.controlsBarTop}>
                            <div className={styles.searchSection}>
                                <EmployeeSearchBar
                                    searchTerm={searchTerm}
                                    onSearchChange={setSearchTerm}
                                    onUpload={handleImportClick}
                                    onDownload={handleDownloadTemplate}
                                    onAddEmployee={() => router.push('/employees/new')}
                                    canWrite={true}
                                />
                            </div>
                            <div className={styles.headerActions}>
                                <button className={styles.actionBtn} onClick={handleDownloadTemplate}>
                                    <Download size={16} />
                                    <span>Plantilla Excel</span>
                                </button>
                                <button className={styles.actionBtn} onClick={handleImportClick}>
                                    <Upload size={16} />
                                    <span>Carga Masiva</span>
                                </button>
                                <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => router.push('/employees/new')}>
                                    <UserPlus size={16} />
                                    <span>Nuevo Empleado</span>
                                </button>
                            </div>
                        </div>
                        {/* Aquí irían los tabs de filtros en el futuro, por ahora no existen tabs aparte de los de states */}
                    </div>

                    {/* Hidden File Input for Import */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".xlsx,.xls,.json"
                        onChange={handleFileImport}
                        disabled={isImporting}
                    />


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
                                        <div className={styles.employeeList}>
                                            <div className={styles.listHeader}>
                                                <div className={styles.colHeaderAvatar} aria-hidden="true"></div>
                                                <div className={styles.colHeaderName}>Empleado</div>
                                                <div className={styles.colHeaderPosition}>Puesto</div>
                                                <div className={styles.colHeaderDepartment}>Departamento</div>
                                                <div className={styles.colHeaderShift}>Turno</div>
                                                <div className={styles.colHeaderStatus}>Estatus</div>
                                                <div aria-hidden="true"></div>
                                            </div>
                                            {employees.map(emp => {
                                                const formattedName = formatFullName(emp.name);
                                                const initialsWords = formattedName.split(' ').filter(w => !['de','la','las','los','del','y','san','santa'].includes(w.toLowerCase()));
                                                const initials = initialsWords.length >= 2 
                                                    ? (initialsWords[0][0] + initialsWords[initialsWords.length - 1][0]).toUpperCase()
                                                    : (initialsWords[0] || 'C').slice(0, 2).toUpperCase();

                                                return (
                                                    <button
                                                        key={emp.id}
                                                        className={styles.employeeRow}
                                                        onClick={() => handleSelectEmployee(emp)}
                                                        aria-label={`Ver detalles de ${emp.name}, ${emp.position || 'sin puesto'}`}
                                                    >
                                                        {/* Avatar */}
                                                        <div className={styles.rowAvatar} aria-hidden="true">
                                                            {emp.photoUrl ? (
                                                                <Image
                                                                    src={emp.photoUrl}
                                                                    alt={`Foto`}
                                                                    width={36}
                                                                    height={36}
                                                                    unoptimized
                                                                    onError={(e) => handleImageError(e, emp.name)}
                                                                />
                                                            ) : (
                                                                initials
                                                            )}
                                                        </div>

                                                        {/* Nombre + ID */}
                                                        <div className={styles.rowIdentity}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span className={styles.rowName}>{formattedName}</span>
                                                                {emp.isCandidato && (
                                                                    <span className={styles.candidateBadgeMini}>Candidato</span>
                                                                )}
                                                            </div>
                                                            <span className={styles.rowId}>{emp.employeeId || emp.id}</span>
                                                        </div>

                                                        {/* Puesto */}
                                                        <span className={styles.rowPosition}>{emp.position || '—'}</span>

                                                        {/* Departamento */}
                                                        <span className={styles.rowDepartment}>{emp.department || '—'}</span>

                                                        {/* Turno */}
                                                        <span className={styles.rowShift}>{emp.shift || '—'}</span>

                                                        {/* Estatus */}
                                                        <span className={`${styles.statusBadge} ${emp.status === 'Inactivo' ? styles.statusInactive : styles.statusActive}`}>
                                                            {emp.status || 'Activo'}
                                                        </span>

                                                        {/* Flecha */}
                                                        <ChevronRight size={15} className={styles.rowArrow} aria-hidden="true" />
                                                    </button>
                                                );
                                            })}
                                        </div>
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
                            onUpdate={handleUpdateEmployee}
                            onDelete={handleDeleteEmployee}
                            onImageError={handleImageError}
                            isDeleting={isDeleting}
                        />
                    )}
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

            {/* Import Preview Overlay */}
            {importPreview && (
                <EmployeeImportPreview 
                    preview={importPreview}
                    existingEmployees={employees}
                    onCancel={handleImportCancel}
                    onConfirm={handleImportConfirm}
                    isImporting={isImporting}
                />
            )}
        </AdminLayout>
    );
}
