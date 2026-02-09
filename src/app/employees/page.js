'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProfileDropdown from '@/components/ProfileDropdown/ProfileDropdown';
import {
    User, Briefcase, Activity, FileText, ChevronRight, ArrowLeft,
    Search, Users, UserCheck, UserPlus, Download, Edit, Trash2, X, Save, Upload, Phone, Key, RefreshCw, Loader2
} from 'lucide-react';
import styles from './page.module.css';
import { useEmployees } from '@/hooks/useEmployees';
import EmployeeSearchBar from '@/components/EmployeeSearchBar/EmployeeSearchBar';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerClose
} from '@/components/ui/Drawer/Drawer';
import { uploadFile } from '@/lib/upload';
import { useToast } from '@/components/ui/Toast/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog/ConfirmDialog';
import EmployeeSkeleton from '@/components/EmployeeSkeleton/EmployeeSkeleton';
import { useFormValidation } from '@/hooks/useFormValidation';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
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
    const [itemsPerPage, setItemsPerPage] = useState(4);

    const {
        employees,
        loading,
        refresh,
        page,
        hasMore,
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

    // Drawer states
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState('create');
    const [formData, setFormData] = useState(getEmptyFormData());
    const [isSaving, setIsSaving] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

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

    // Form validation
    const { errors: formErrors, validate, clearError, clearAllErrors } = useFormValidation();

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

    const openCreateDrawer = useCallback(() => {
        setDrawerMode('create');
        setFormData(getEmptyFormData());
        clearAllErrors();
        setPhotoFile(null);
        setPhotoPreview(null);
        setIsDrawerOpen(true);
    }, [clearAllErrors]);

    const openEditDrawer = useCallback((employee) => {
        setDrawerMode('edit');
        setFormData({
            id: employee.id,
            name: employee.name || '',
            employeeId: employee.employeeId || '',
            curp: employee.curp || '',
            phone: employee.phone || '',
            position: employee.position || '',
            department: employee.department || '',
            area: employee.area || '',
            shift: employee.shift || '',
            status: employee.status || 'Activo',
            isCandidato: employee.isCandidato || false,
            startDate: employee.startDate || '',
            contractEndDate: employee.contractEndDate || '',
            photoUrl: employee.photoUrl || '',
            accessCode: employee.accessCode || '',
            accessCodeExpires: employee.accessCodeExpires || null,
            accessCodeGeneratedAt: employee.accessCodeGeneratedAt || null,
            accessCodeUses: employee.accessCodeUses || 0,
            trainingPlanDelivered: employee.trainingPlanDelivered || false,
            eval1Date: employee.eval1Date || '',
            eval1Score: employee.eval1Score || '',
            eval2Date: employee.eval2Date || '',
            eval2Score: employee.eval2Score || '',
            eval3Date: employee.eval3Date || '',
            eval3Score: employee.eval3Score || ''
        });
        clearAllErrors();
        setPhotoFile(null);
        setPhotoPreview(employee.photoUrl || null);
        setIsDrawerOpen(true);
    }, [clearAllErrors]);

    const closeDrawer = useCallback(() => {
        setIsDrawerOpen(false);
        setFormData(getEmptyFormData());
        clearAllErrors();
        setPhotoFile(null);
        setPhotoPreview(null);
        setUploadProgress(0);
    }, [clearAllErrors]);

    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'startDate' && value) {
            const calculatedDates = calculateDatesFromStart(value);
            setFormData(prev => ({
                ...prev,
                startDate: value,
                ...calculatedDates
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }

        if (formErrors[name]) {
            clearError(name);
        }
    }, [formErrors, clearError]);

    const handlePhotoChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (5MB max)
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > MAX_SIZE) {
            showToast('La imagen no debe superar 5MB', 'error');
            e.target.value = ''; // Reset input
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            showToast('Solo se permiten imágenes (JPG, PNG, GIF, WEBP)', 'error');
            e.target.value = ''; // Reset input
            return;
        }

        setPhotoFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoPreview(reader.result);
        };
        reader.onerror = () => {
            showToast('Error al leer la imagen', 'error');
            setPhotoFile(null);
        };
        reader.readAsDataURL(file);
    }, [showToast]);

    const handleRemovePhoto = useCallback(() => {
        setPhotoFile(null);
        setPhotoPreview(null);
    }, []);

    const handleGenerateAccessCode = useCallback(() => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const now = Date.now();
        const expiresIn3Days = now + (3 * 24 * 60 * 60 * 1000);

        setFormData(prev => ({
            ...prev,
            accessCode: code,
            accessCodeGeneratedAt: now,
            accessCodeExpires: expiresIn3Days,
            accessCodeUses: 0
        }));

        showToast('Código de acceso generado', 'success');
    }, [showToast]);

    const validateFormData = useCallback(() => {
        const validationRules = {
            name: 'required',
            employeeId: 'required'
        };

        // Add optional validations only if fields have values
        if (formData.curp?.trim()) {
            validationRules.curp = 'curp';
        }
        if (formData.phone?.trim()) {
            validationRules.phone = 'phone';
        }

        return validate(formData, validationRules);
    }, [formData, validate]);

    const handleSave = useCallback(async () => {
        if (!validateFormData()) {
            showToast('Por favor corrige los errores en el formulario', 'error');
            return;
        }

        setIsSaving(true);
        setUploadProgress(0);

        try {
            let photoData = {};

            if (photoFile) {
                setUploadProgress(30);
                const uploadResult = await uploadFile(photoFile, {
                    employeeId: formData.employeeId,
                    docType: 'profile'
                });

                setUploadProgress(60);

                if (!uploadResult.success) {
                    throw new Error(uploadResult.error || 'Error al subir la foto');
                }

                photoData = {
                    photoUrl: uploadResult.data.viewLink,
                    photoDriveId: uploadResult.data.id
                };
            }

            setUploadProgress(80);

            const employeeData = { ...formData, ...photoData };

            let result;
            if (drawerMode === 'create') {
                result = await createEmployee(employeeData);
            } else {
                const { id, ...updateData } = employeeData;
                result = await updateEmployee(id, updateData);
            }

            setUploadProgress(100);

            if (!result.success) {
                if (result.error === 'ID_DUPLICADO') {
                    showToast(result.message || 'El ID del empleado ya existe', 'error');
                } else {
                    throw new Error(result.error || 'Error al guardar');
                }
                return;
            }

            showToast(
                drawerMode === 'create'
                    ? 'Empleado creado exitosamente'
                    : 'Empleado actualizado exitosamente',
                'success'
            );

            closeDrawer();

            if (drawerMode === 'edit' && selectedEmployee) {
                setSelectedEmployee(null);
            }
        } catch (error) {
            console.error('Error saving employee:', error);
            showToast(error.message || 'Error al guardar el empleado', 'error');
        } finally {
            setIsSaving(false);
            setUploadProgress(0);
        }
    }, [
        validateFormData,
        photoFile,
        formData,
        drawerMode,
        createEmployee,
        updateEmployee,
        showToast,
        closeDrawer,
        selectedEmployee
    ]);

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
    // RENDER LOADING STATE
    // ============================================================================

    if (authLoading) {
        return (
            <div className={styles.main}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Cargando empleados...</p>
                </div>
            </div>
        );
    }

    // ============================================================================
    // MAIN RENDER
    // ============================================================================

    return (
        <main className={styles.main}>
            {/* Skip Link for Accessibility */}
            <a href="#main-content" className={styles.skipLink}>
                Saltar al contenido principal
            </a>

            {/* Profile Dropdown */}
            <div className={styles.profileContainer}>
                <ProfileDropdown />
            </div>

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
                        <button
                            onClick={() => router.push('/dashboard')}
                            className={styles.backButton}
                            title="Volver al Dashboard"
                        >
                            <ArrowLeft size={20} />
                            <span className={styles.backButtonText}>Dashboard</span>
                        </button>

                        <h1 className={styles.pageTitle}>
                            <Users size={32} style={{ marginRight: '12px' }} />
                            Gestión de Empleados
                        </h1>
                        <p className={styles.pageSubtitle}>
                            Administra y consulta la información de tu equipo
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                <Users size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <div className={styles.statValue}>{stats.total}</div>
                                <div className={styles.statLabel}>Total</div>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                <UserCheck size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <div className={styles.statValue}>{stats.active}</div>
                                <div className={styles.statLabel}>Activos</div>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                <UserPlus size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <div className={styles.statValue}>{stats.candidates}</div>
                                <div className={styles.statLabel}>Candidatos</div>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className={styles.searchSection}>
                        <div style={{ flex: 1 }}>
                            <EmployeeSearchBar
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                onUpload={() => { }}
                                onDownload={() => { }}
                                onAddEmployee={openCreateDrawer}
                                canWrite={true}
                            />
                        </div>
                    </div>
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
                                    <div className={styles.employeeGrid}>
                                        {employees.map(emp => (
                                            <div
                                                key={emp.id}
                                                role="button"
                                                tabIndex={0}
                                                className={styles.employeeCard}
                                                onClick={() => handleSelectEmployee(emp)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        handleSelectEmployee(emp);
                                                    }
                                                }}
                                                aria-label={`Ver detalles de ${emp.name}, ${emp.position || 'sin puesto'}`}
                                            >
                                                <div className={styles.cardHeader}>
                                                    <div className={styles.employeeAvatar}>
                                                        {emp.photoUrl ? (
                                                            <img
                                                                src={emp.photoUrl}
                                                                alt={`Foto de ${emp.name}`}
                                                                loading="lazy"
                                                                onError={(e) => handleImageError(e, emp.name)}
                                                            />
                                                        ) : (
                                                            <span aria-hidden="true">{getInitials(emp.name)}</span>
                                                        )}
                                                    </div>
                                                    <div className={styles.employeeInfo}>
                                                        <h3 className={styles.employeeName}>{emp.name}</h3>
                                                        <p className={styles.employeePosition}>{emp.position || 'Sin puesto'}</p>
                                                    </div>
                                                </div>
                                                <div className={styles.cardFooter}>
                                                    <span className={styles.employeeId}>ID: {emp.employeeId || emp.id}</span>
                                                    <span className={`${styles.statusBadge} ${emp.status === 'Inactivo' ? styles.statusInactive : styles.statusActive}`}>
                                                        {emp.status || 'Activo'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
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
                                                <option value={4}>4</option>
                                                <option value={8}>8</option>
                                                <option value={12}>12</option>
                                            </select>
                                            <span className={styles.itemsPerPageText}>por página</span>
                                        </div>

                                        <div className={styles.paginationControls}>
                                            <button
                                                onClick={prevPage}
                                                disabled={page <= 1}
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
                        <div className={styles.detailView}>
                            <button onClick={handleBackToList} className={styles.backButton}>
                                <ArrowLeft size={18} />
                                Volver a la lista
                            </button>

                            {/* Employee Header */}
                            <div className={styles.detailHeader}>
                                <div className={styles.avatarLarge}>
                                    {selectedEmployee.photoUrl ? (
                                        <img
                                            src={selectedEmployee.photoUrl}
                                            alt={selectedEmployee.name}
                                            onError={(e) => handleImageError(e, selectedEmployee.name)}
                                        />
                                    ) : (
                                        <span>{getInitials(selectedEmployee.name)}</span>
                                    )}
                                </div>
                                <div className={styles.headerInfo}>
                                    <h2 className={styles.detailName}>{selectedEmployee.name}</h2>
                                    <p className={styles.detailId}>ID: {selectedEmployee.employeeId || selectedEmployee.id}</p>
                                    <span className={`${styles.statusBadge} ${selectedEmployee.status === 'Inactivo' ? styles.statusInactive : styles.statusActive}`}>
                                        {selectedEmployee.status || 'Activo'}
                                    </span>
                                </div>
                                <div className={styles.actionButtons}>
                                    {selectedEmployee.phone && (
                                        <a
                                            href={`https://wa.me/${selectedEmployee.phone.replace(/\s/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.whatsappButton}
                                            title="Enviar mensaje por WhatsApp"
                                        >
                                            <Phone size={18} />
                                            WhatsApp
                                        </a>
                                    )}
                                    <button
                                        onClick={() => openEditDrawer(selectedEmployee)}
                                        className={styles.editButton}
                                        title="Editar empleado"
                                    >
                                        <Edit size={18} />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEmployee(selectedEmployee.id)}
                                        className={styles.deleteButton}
                                        title="Eliminar empleado"
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? (
                                            <Loader2 size={18} className={styles.spinning} />
                                        ) : (
                                            <Trash2 size={18} />
                                        )}
                                        Eliminar
                                    </button>
                                </div>
                            </div>

                            {/* Tabs Navigation */}
                            <div className={styles.tabsNav} role="tablist">
                                <button
                                    role="tab"
                                    aria-selected={activeTab === 'personal'}
                                    aria-controls="personal-panel"
                                    className={`${styles.tabButton} ${activeTab === 'personal' ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab('personal')}
                                >
                                    <User size={18} />
                                    Personal
                                </button>
                                <button
                                    role="tab"
                                    aria-selected={activeTab === 'laboral'}
                                    aria-controls="laboral-panel"
                                    className={`${styles.tabButton} ${activeTab === 'laboral' ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab('laboral')}
                                >
                                    <Briefcase size={18} />
                                    Laboral
                                </button>
                                <button
                                    role="tab"
                                    aria-selected={activeTab === 'actividad'}
                                    aria-controls="actividad-panel"
                                    className={`${styles.tabButton} ${activeTab === 'actividad' ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab('actividad')}
                                >
                                    <Activity size={18} />
                                    Actividad
                                </button>
                                <button
                                    role="tab"
                                    aria-selected={activeTab === 'documentos'}
                                    aria-controls="documentos-panel"
                                    className={`${styles.tabButton} ${activeTab === 'documentos' ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab('documentos')}
                                >
                                    <FileText size={18} />
                                    Documentos
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className={styles.tabContent}>
                                {activeTab === 'personal' && (
                                    <div id="personal-panel" role="tabpanel" className={styles.infoGrid}>
                                        <div className={styles.infoItem}>
                                            <label>Nombre Completo</label>
                                            <span>{selectedEmployee.name}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <label>CURP</label>
                                            <span>{selectedEmployee.curp || '—'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <label>ID Empleado</label>
                                            <span>{selectedEmployee.employeeId || '—'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <label>Tipo</label>
                                            <span>{selectedEmployee.isCandidato ? 'Candidato' : 'Empleado'}</span>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'laboral' && (
                                    <div id="laboral-panel" role="tabpanel" className={styles.infoGrid}>
                                        <div className={styles.infoItem}>
                                            <label>Puesto</label>
                                            <span>{selectedEmployee.position || '—'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <label>Departamento</label>
                                            <span>{selectedEmployee.department || '—'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <label>Área</label>
                                            <span>{selectedEmployee.area || '—'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <label>Turno</label>
                                            <span>{selectedEmployee.shift || '—'}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <label>Fecha de Inicio</label>
                                            <span>{formatDate(selectedEmployee.startDate)}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <label>Fin de Contrato</label>
                                            <span>{formatDate(selectedEmployee.contractEndDate)}</span>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'actividad' && (
                                    <div id="actividad-panel" role="tabpanel">
                                        <div className={styles.infoGrid}>
                                            <div className={styles.infoItem}>
                                                <label>Código de Acceso</label>
                                                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                    {selectedEmployee.accessCode || '—'}
                                                </span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <label>Plan Entregado</label>
                                                <span>{selectedEmployee.trainingPlanDelivered ? 'Sí' : 'No'}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <label>Fecha Notificación</label>
                                                <span>{formatDate(selectedEmployee.notificationDate)}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <label>Último Login</label>
                                                <span>{formatDate(selectedEmployee.lastLoginCandidate)}</span>
                                            </div>
                                        </div>

                                        {selectedEmployee.cursosCompletados && selectedEmployee.cursosCompletados.length > 0 && (
                                            <div style={{ marginTop: '24px' }}>
                                                <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Cursos Completados</h4>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {selectedEmployee.cursosCompletados.map((courseId, idx) => (
                                                        <span key={idx} className={styles.courseBadge}>
                                                            {courseId.substring(0, 12)}...
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedEmployee.coursesProgress && Object.keys(selectedEmployee.coursesProgress).length > 0 && (
                                            <div style={{ marginTop: '24px' }}>
                                                <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Progreso de Cursos</h4>
                                                {Object.entries(selectedEmployee.coursesProgress).map(([courseId, progress]) => (
                                                    <div key={courseId} className={styles.progressItem}>
                                                        <span className={styles.courseId}>{courseId.substring(0, 12)}...</span>
                                                        <div className={styles.progressSteps}>
                                                            <span className={progress.step1Completed ? styles.stepCompleted : styles.stepPending}>
                                                                Paso 1
                                                            </span>
                                                            <span className={progress.step2Completed ? styles.stepCompleted : styles.stepPending}>
                                                                Paso 2
                                                            </span>
                                                            {progress.examDownloaded && (
                                                                <span className={styles.stepInfo}>
                                                                    <Download size={14} /> Examen
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'documentos' && (
                                    <div id="documentos-panel" role="tabpanel">
                                        {selectedEmployee.documents && selectedEmployee.documents.length > 0 ? (
                                            <div className={styles.documentsList}>
                                                {selectedEmployee.documents.map((doc, idx) => (
                                                    <div key={idx} className={styles.documentItem}>
                                                        <FileText size={20} />
                                                        <span>Documento {idx + 1}</span>
                                                        <a href="#" className={styles.documentLink}>Ver</a>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={styles.emptyState}>
                                                <FileText size={32} />
                                                <p>No hay documentos disponibles</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DRAWER for Create/Edit Employee */}
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <DrawerContent>
                    <DrawerHeader>
                        <DrawerTitle>
                            {drawerMode === 'create' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <UserPlus size={24} />
                                    Nuevo Empleado
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Edit size={24} />
                                    Editar Empleado
                                </div>
                            )}
                        </DrawerTitle>
                        <DrawerClose asChild>
                            <button className={styles.closeButtonIcon} aria-label="Cerrar">
                                <X size={24} />
                            </button>
                        </DrawerClose>
                    </DrawerHeader>

                    <div className={styles.drawerContentScroll}>
                        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                            {/* Personal Information */}
                            <div className={styles.formSection}>
                                <h3 className={styles.formSectionTitle}>Información Personal</h3>

                                <div className={styles.formGroup}>
                                    <label htmlFor="name" className={styles.formLabel}>
                                        Nombre Completo <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name || ''}
                                        onChange={handleInputChange}
                                        className={`${styles.formInput} ${formErrors.name ? styles.inputError : ''}`}
                                        placeholder="Ej: Juan Pérez García"
                                        autoComplete="name"
                                        aria-invalid={!!formErrors.name}
                                        aria-describedby={formErrors.name ? 'name-error' : undefined}
                                        required
                                    />
                                    {formErrors.name && <span id="name-error" className={styles.errorText} role="alert">{formErrors.name}</span>}
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="employeeId" className={styles.formLabel}>
                                            ID Empleado <span className={styles.required}>*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="employeeId"
                                            name="employeeId"
                                            value={formData.employeeId || ''}
                                            onChange={handleInputChange}
                                            className={`${styles.formInput} ${formErrors.employeeId ? styles.inputError : ''}`}
                                            placeholder="Ej: EMP-001"
                                            autoComplete="off"
                                            aria-invalid={!!formErrors.employeeId}
                                            aria-describedby={formErrors.employeeId ? 'employeeId-error' : undefined}
                                            required
                                        />
                                        {formErrors.employeeId && <span id="employeeId-error" className={styles.errorText} role="alert">{formErrors.employeeId}</span>}
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="curp" className={styles.formLabel}>
                                            CURP
                                        </label>
                                        <input
                                            type="text"
                                            id="curp"
                                            name="curp"
                                            value={formData.curp || ''}
                                            onChange={handleInputChange}
                                            className={`${styles.formInput} ${formErrors.curp ? styles.inputError : ''}`}
                                            placeholder="Ej: JUPE800101HDFRNN00"
                                            maxLength={18}
                                            autoComplete="off"
                                            aria-invalid={!!formErrors.curp}
                                            aria-describedby={formErrors.curp ? 'curp-error' : undefined}
                                        />
                                        {formErrors.curp && <span id="curp-error" className={styles.errorText} role="alert">{formErrors.curp}</span>}
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>
                                        Foto de Perfil
                                    </label>
                                    <div className={styles.photoUploadContainer}>
                                        {photoPreview ? (
                                            <div className={styles.photoPreviewBox}>
                                                <img
                                                    src={photoPreview}
                                                    alt="Preview"
                                                    className={styles.photoPreview}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleRemovePhoto}
                                                    className={styles.removePhotoButton}
                                                    aria-label="Quitar foto"
                                                >
                                                    <X size={16} />
                                                    Quitar foto
                                                </button>
                                            </div>
                                        ) : (
                                            <label className={styles.photoUploadLabel}>
                                                <Upload size={24} />
                                                <span>Seleccionar foto</span>
                                                <span className={styles.photoUploadHint}>PNG, JPG hasta 5MB</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handlePhotoChange}
                                                    className={styles.photoInput}
                                                    aria-label="Seleccionar foto de perfil"
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label htmlFor="phone" className={styles.formLabel}>
                                        Teléfono (WhatsApp)
                                    </label>
                                    <div className={styles.phoneInputContainer}>
                                        <Phone size={18} className={styles.phoneIcon} aria-hidden="true" />
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone || ''}
                                            onChange={handleInputChange}
                                            className={`${styles.formInput} ${formErrors.phone ? styles.inputError : ''}`}
                                            placeholder="Ej: +52 442 123 4567"
                                            autoComplete="tel"
                                            aria-invalid={!!formErrors.phone}
                                            aria-describedby={formErrors.phone ? 'phone-error' : undefined}
                                        />
                                    </div>
                                    {formErrors.phone && <span id="phone-error" className={styles.errorText} role="alert">{formErrors.phone}</span>}
                                </div>
                            </div>

                            {/* Work Information */}
                            <div className={styles.formSection}>
                                <h3 className={styles.formSectionTitle}>Información Laboral</h3>

                                <div className={styles.formGroup}>
                                    <label htmlFor="position" className={styles.formLabel}>
                                        Puesto
                                    </label>
                                    <input
                                        type="text"
                                        id="position"
                                        name="position"
                                        value={formData.position || ''}
                                        onChange={handleInputChange}
                                        className={styles.formInput}
                                        placeholder="Ej: Desarrollador Senior"
                                        autoComplete="organization-title"
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="department" className={styles.formLabel}>
                                            Departamento
                                        </label>
                                        <input
                                            type="text"
                                            id="department"
                                            name="department"
                                            value={formData.department || ''}
                                            onChange={handleInputChange}
                                            className={styles.formInput}
                                            placeholder="Ej: Tecnología"
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="area" className={styles.formLabel}>
                                            Área
                                        </label>
                                        <input
                                            type="text"
                                            id="area"
                                            name="area"
                                            value={formData.area || ''}
                                            onChange={handleInputChange}
                                            className={styles.formInput}
                                            placeholder="Ej: Backend"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="shift" className={styles.formLabel}>
                                            Turno
                                        </label>
                                        <select
                                            id="shift"
                                            name="shift"
                                            value={formData.shift || ''}
                                            onChange={handleInputChange}
                                            className={styles.formInput}
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="Matutino">Matutino</option>
                                            <option value="Vespertino">Vespertino</option>
                                            <option value="Nocturno">Nocturno</option>
                                            <option value="Mixto">Mixto</option>
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="status" className={styles.formLabel}>
                                            Estado
                                        </label>
                                        <select
                                            id="status"
                                            name="status"
                                            value={formData.status || 'Activo'}
                                            onChange={handleInputChange}
                                            className={styles.formInput}
                                        >
                                            <option value="Activo">Activo</option>
                                            <option value="Inactivo">Inactivo</option>
                                            <option value="Suspendido">Suspendido</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="startDate" className={styles.formLabel}>
                                            Fecha de Inicio
                                        </label>
                                        <input
                                            type="date"
                                            id="startDate"
                                            name="startDate"
                                            value={formatDateForInput(formData.startDate)}
                                            onChange={handleInputChange}
                                            className={styles.formInput}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label htmlFor="contractEndDate" className={styles.formLabel}>
                                            Fin de Contrato
                                        </label>
                                        <input
                                            type="date"
                                            id="contractEndDate"
                                            name="contractEndDate"
                                            value={formatDateForInput(formData.contractEndDate)}
                                            className={`${styles.formInput} ${styles.readonlyInput}`}
                                            readOnly
                                            disabled
                                            aria-readonly="true"
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.checkboxLabel}>
                                        <input
                                            type="checkbox"
                                            name="isCandidato"
                                            checked={formData.isCandidato || false}
                                            onChange={handleInputChange}
                                            className={styles.checkbox}
                                        />
                                        <span>Es candidato</span>
                                    </label>
                                </div>
                            </div>

                            {/* Performance Evaluations */}
                            {drawerMode === 'edit' && formData.startDate && (
                                <div className={styles.formSection}>
                                    <h3 className={styles.formSectionTitle}>Evaluaciones de Desempeño</h3>
                                    <p className={styles.formSectionHint}>
                                        Las fechas se calculan automáticamente desde la fecha de inicio
                                    </p>

                                    {/* Evaluación 1 - 30 días */}
                                    <div className={styles.evalCard}>
                                        <h4 className={styles.evalTitle}>Evaluación 1 (30 días)</h4>
                                        <div className={styles.formRow}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.formLabel}>
                                                    Fecha de Evaluación
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formatDateForInput(formData.eval1Date)}
                                                    className={`${styles.formInput} ${styles.readonlyInput}`}
                                                    readOnly
                                                    disabled
                                                    aria-readonly="true"
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="eval1Score" className={styles.formLabel}>
                                                    Resultado / Calificación
                                                </label>
                                                <input
                                                    type="text"
                                                    id="eval1Score"
                                                    name="eval1Score"
                                                    value={formData.eval1Score || ''}
                                                    onChange={handleInputChange}
                                                    className={styles.formInput}
                                                    placeholder="Ej: Aprobado, 85/100, Excelente"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Evaluación 2 - 60 días */}
                                    <div className={styles.evalCard}>
                                        <h4 className={styles.evalTitle}>Evaluación 2 (60 días)</h4>
                                        <div className={styles.formRow}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.formLabel}>
                                                    Fecha de Evaluación
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formatDateForInput(formData.eval2Date)}
                                                    className={`${styles.formInput} ${styles.readonlyInput}`}
                                                    readOnly
                                                    disabled
                                                    aria-readonly="true"
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="eval2Score" className={styles.formLabel}>
                                                    Resultado / Calificación
                                                </label>
                                                <input
                                                    type="text"
                                                    id="eval2Score"
                                                    name="eval2Score"
                                                    value={formData.eval2Score || ''}
                                                    onChange={handleInputChange}
                                                    className={styles.formInput}
                                                    placeholder="Ej: Aprobado, 85/100, Excelente"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Evaluación 3 - 75 días */}
                                    <div className={styles.evalCard}>
                                        <h4 className={styles.evalTitle}>Evaluación 3 (75 días)</h4>
                                        <div className={styles.formRow}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.formLabel}>
                                                    Fecha de Evaluación
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formatDateForInput(formData.eval3Date)}
                                                    className={`${styles.formInput} ${styles.readonlyInput}`}
                                                    readOnly
                                                    disabled
                                                    aria-readonly="true"
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label htmlFor="eval3Score" className={styles.formLabel}>
                                                    Resultado / Calificación
                                                </label>
                                                <input
                                                    type="text"
                                                    id="eval3Score"
                                                    name="eval3Score"
                                                    value={formData.eval3Score || ''}
                                                    onChange={handleInputChange}
                                                    className={styles.formInput}
                                                    placeholder="Ej: Aprobado, 85/100, Excelente"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Additional Information */}
                            {drawerMode === 'edit' && (
                                <div className={styles.formSection}>
                                    <h3 className={styles.formSectionTitle}>Información Adicional</h3>

                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>
                                            Código de Acceso
                                        </label>
                                        <div className={styles.accessCodeContainer}>
                                            {formData.accessCode ? (
                                                <div className={styles.accessCodeDisplay}>
                                                    <div className={styles.codeValueBox}>
                                                        <Key size={20} />
                                                        <span className={styles.codeValue}>{formData.accessCode}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleGenerateAccessCode}
                                                        className={styles.regenerateButton}
                                                        title="Regenerar código"
                                                    >
                                                        <RefreshCw size={16} />
                                                        Regenerar
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateAccessCode}
                                                    className={styles.generateButton}
                                                >
                                                    <Key size={18} />
                                                    Generar Código de Acceso
                                                </button>
                                            )}

                                            {formData.accessCode && (
                                                <div className={styles.codeInfo}>
                                                    <div className={styles.codeInfoItem}>
                                                        <strong>Generado:</strong>
                                                        <span>{new Date(formData.accessCodeGeneratedAt).toLocaleString('es-MX')}</span>
                                                    </div>
                                                    <div className={styles.codeInfoItem}>
                                                        <strong>Expira:</strong>
                                                        <span>{new Date(formData.accessCodeExpires).toLocaleString('es-MX')}</span>
                                                    </div>
                                                    <div className={styles.codeInfoItem}>
                                                        <strong>Usos:</strong>
                                                        <span>{formData.accessCodeUses || 0}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                name="trainingPlanDelivered"
                                                checked={formData.trainingPlanDelivered || false}
                                                onChange={handleInputChange}
                                                className={styles.checkbox}
                                            />
                                            <span>Plan de capacitación entregado</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Upload Progress Indicator */}
                            {uploadProgress > 0 && uploadProgress < 100 && (
                                <div className={styles.uploadProgress}>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${uploadProgress}%` }}
                                            role="progressbar"
                                            aria-valuenow={uploadProgress}
                                            aria-valuemin="0"
                                            aria-valuemax="100"
                                        />
                                    </div>
                                    <span className={styles.progressText}>{uploadProgress}%</span>
                                </div>
                            )}
                        </form>
                    </div>

                    <DrawerFooter>
                        <button
                            type="button"
                            onClick={closeDrawer}
                            className={styles.cancelButton}
                            disabled={isSaving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className={styles.saveButton}
                            disabled={isSaving}
                            aria-busy={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={18} className={styles.spinning} />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    {drawerMode === 'create' ? 'Crear Empleado' : 'Guardar Cambios'}
                                </>
                            )}
                        </button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>

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
        </main>
    );
}