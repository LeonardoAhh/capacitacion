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
import { useDebounce } from '@/utils/debounce';
import { useFormValidation } from '@/hooks/useFormValidation';

// Helper functions
const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
        if (typeof dateString === 'number') {
            return new Date(dateString).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
};

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch (e) {
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

export default function EmployeesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast(); // Global toast context

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
        deleteEmployee
    } = useEmployees(itemsPerPage);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');

    // Drawer states
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState('create'); // 'create' or 'edit'
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Toast notification state
    const [toast, setToast] = useState(null);

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

    // Deleting state
    const [isDeleting, setIsDeleting] = useState(false);

    // Form validation
    const { errors: formErrors, validate, clearError, clearAllErrors } = useFormValidation();

    // Debounced search term
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

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

    useEffect(() => {
        if (user) refresh();
    }, [user, refresh]);

    // Filter and sort employees with useMemo for performance
    const filteredEmployees = useMemo(() => {
        return employees
            .filter(emp =>
                emp.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                emp.employeeId?.includes(debouncedSearchTerm) ||
                emp.position?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            )
            .sort((a, b) => {
                // Sort by employeeId (ascending - lowest to highest)  
                const idA = a.employeeId || '';
                const idB = b.employeeId || '';
                return idA.localeCompare(idB, undefined, { numeric: true });
            });
    }, [employees, debouncedSearchTerm]);


    const handleSelectEmployee = useCallback((emp) => {
        setSelectedEmployee(emp);
        setActiveTab('personal');
    }, []);

    const handleBackToList = useCallback(() => {
        setSelectedEmployee(null);
    }, []);

    // Drawer handlers
    const openCreateDrawer = () => {
        setDrawerMode('create');
        setFormData({
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
            eval3Score: ''
        });
        clearAllErrors();
        setIsDrawerOpen(true);
    };

    const openEditDrawer = (employee) => {
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
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setFormData({});
        clearAllErrors();
        setPhotoFile(null);
        setPhotoPreview(null);
        setUploadProgress(0);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        // If startDate is changing, calculate related dates automatically
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

        // Clear error for this field
        if (formErrors[name]) {
            clearError(name);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemovePhoto = () => {
        setPhotoFile(null);
        setPhotoPreview(null);
    };

    const handleGenerateAccessCode = () => {
        // Generate a random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const now = Date.now();
        const expiresIn3Days = now + (3 * 24 * 60 * 60 * 1000); // 3 days from now

        setFormData(prev => ({
            ...prev,
            accessCode: code,
            accessCodeGeneratedAt: now,
            accessCodeExpires: expiresIn3Days,
            accessCodeUses: 0
        }));
    };

    const validateFormData = () => {
        const validationRules = {
            name: 'required',
            employeeId: 'required',
            curp: formData.curp ? 'curp' : null,
            phone: formData.phone ? 'phone' : null
        };

        // Remove null rules
        Object.keys(validationRules).forEach(key => {
            if (validationRules[key] === null) {
                delete validationRules[key];
            }
        });

        return validate(formData, validationRules);
    };

    const handleSave = async () => {
        if (!validateFormData()) {
            showToast('Por favor corrige los errores en el formulario', 'error');
            return;
        }

        setIsSaving(true);
        setUploadProgress(0);

        try {
            let photoData = {};

            // Upload photo if selected
            if (photoFile) {
                setUploadProgress(30);
                const uploadResult = await uploadFile(photoFile, {
                    employeeId: formData.employeeId,
                    docType: 'profile'
                });

                setUploadProgress(60);

                if (uploadResult.success) {
                    photoData = {
                        photoUrl: uploadResult.data.viewLink,
                        photoDriveId: uploadResult.data.id
                    };
                } else {
                    showToast('Error al subir la foto: ' + (uploadResult.error || 'Error desconocido'), 'error');
                    setIsSaving(false);
                    setUploadProgress(0);
                    return;
                }
            }

            setUploadProgress(80);

            // Merge photo data with form data
            const employeeData = { ...formData, ...photoData };

            let result;
            if (drawerMode === 'create') {
                result = await createEmployee(employeeData);
            } else {
                const { id, ...updateData } = employeeData;
                result = await updateEmployee(id, updateData);
            }

            setUploadProgress(100);

            if (result.success) {
                showToast(
                    drawerMode === 'create'
                        ? 'Empleado creado exitosamente'
                        : 'Empleado actualizado exitosamente',
                    'success'
                );
                closeDrawer();
                if (drawerMode === 'edit' && selectedEmployee) {
                    // Update selected employee view
                    setSelectedEmployee(null);
                }
            } else {
                if (result.error === 'ID_DUPLICADO') {
                    clearAllErrors();
                    // Manually set the specific error
                    showToast(result.message, 'error');
                } else {
                    showToast('Error: ' + (result.error || 'Error desconocido'), 'error');
                }
            }
        } catch (error) {
            console.error('Error saving employee:', error);
            showToast('Error al guardar el empleado', 'error');
        } finally {
            setIsSaving(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async (employeeId) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este empleado? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const result = await deleteEmployee(employeeId);
            if (result.success) {
                setSelectedEmployee(null);
                alert('Empleado eliminado exitosamente');
            } else {
                alert('Error al eliminar: ' + (result.error || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
            alert('Error al eliminar el empleado');
        }
    };

    // Loading state
    if (authLoading || loading) {
        return (
            <div className={styles.main}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Cargando empleados...</p>
                </div>
            </div>
        );
    }

    // Stats calculations
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(e => e.status !== 'Inactivo').length;
    const candidates = employees.filter(e => e.isCandidato).length;

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
                        {/* Back to Dashboard Button */}
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
                                <div className={styles.statValue}>{totalEmployees}</div>
                                <div className={styles.statLabel}>Total</div>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                                <UserCheck size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <div className={styles.statValue}>{activeEmployees}</div>
                                <div className={styles.statLabel}>Activos</div>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                                <UserPlus size={20} />
                            </div>
                            <div className={styles.statContent}>
                                <div className={styles.statValue}>{candidates}</div>
                                <div className={styles.statLabel}>Candidatos</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Bar with Add Button */}
                <div className={styles.searchSection}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
                        <button
                            onClick={openCreateDrawer}
                            className={styles.addButton}
                            title="Agregar nuevo empleado"
                        >
                            <UserPlus size={20} />
                            <span className={styles.buttonText}>Nuevo Empleado</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                {!selectedEmployee ? (
                    /* LIST VIEW */
                    <div className={styles.contentSection}>
                        {loading ? (
                            /* Show skeleton while loading */
                            <EmployeeSkeleton count={itemsPerPage} />
                        ) : filteredEmployees.length > 0 ? (
                            <>
                                <div className={styles.employeeGrid}>
                                    {filteredEmployees.map(emp => (
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
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                            }}
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
                                        >
                                            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
                                            Anterior
                                        </button>
                                        <span className={styles.pageIndicator}>Página {page}</span>
                                        <button
                                            onClick={nextPage}
                                            disabled={!hasMore}
                                            className={styles.paginationBtn}
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
                    </div>
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
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = `<span>${getInitials(selectedEmployee.name)}</span>`;
                                        }}
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
                                    onClick={() => handleDelete(selectedEmployee.id)}
                                    className={styles.deleteButton}
                                    title="Eliminar empleado"
                                >
                                    <Trash2 size={18} />
                                    Eliminar
                                </button>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className={styles.tabsNav}>
                            <button
                                className={`${styles.tabButton} ${activeTab === 'personal' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('personal')}
                            >
                                <User size={18} />
                                Personal
                            </button>
                            <button
                                className={`${styles.tabButton} ${activeTab === 'laboral' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('laboral')}
                            >
                                <Briefcase size={18} />
                                Laboral
                            </button>
                            <button
                                className={`${styles.tabButton} ${activeTab === 'actividad' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('actividad')}
                            >
                                <Activity size={18} />
                                Actividad
                            </button>
                            <button
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
                                <div className={styles.infoGrid}>
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
                                <div className={styles.infoGrid}>
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
                                <div>
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
                                <div>
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

            {/* DRAWER for Create/Edit Employee - Using shadcn UI */}
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
                            <button className={styles.closeButtonIcon}>
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
                                            maxLength="18"
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
                                        <Phone size={18} className={styles.phoneIcon} />
                                        <input
                                            type="tel"
                                            id="phone"
                                            name="phone"
                                            value={formData.phone || ''}
                                            onChange={handleInputChange}
                                            className={styles.formInput}
                                            placeholder="Ej: +52 442 123 4567"
                                        />
                                    </div>
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
                confirmText={confirmDialog.confirmText || 'Confirmar'}
                cancelText="Cancelar"
                onConfirm={() => {
                    confirmDialog.onConfirm?.();
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                }}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                variant={confirmDialog.variant || 'danger'}
            />
        </main>
    );
}
