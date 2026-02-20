'use client';

import { useState, useEffect } from 'react';

import ProfileDropdown from '@/components/layout/ProfileDropdown/ProfileDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton/BackButton';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { db } from '@/lib/firebase';
import { uploadFile } from '@/lib/upload';
import { collection, getDocs, query, orderBy, doc, updateDoc, setDoc, getDoc, deleteDoc, where, limit, writeBatch } from 'firebase/firestore';

import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import styles from './page.module.css';
import EmployeeSearchBar from '@/components/ui/EmployeeSearchBar/EmployeeSearchBar';

export default function EmpleadosPage() {
    const { user, loading: authLoading, canWrite } = useAuth();
    const router = useRouter();
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
    const [previewImage, setPreviewImage] = useState(null); // Photo Lightbox Mode


    const [isDesktop, setIsDesktop] = useState(false); // Responsive Mode

    // Auth Protection
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);



    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    const [formData, setFormData] = useState({
        id: '',
        name: '',
        position: '',
        department: '',
        curp: '',
        occupation: '',
        area: '',
        education: '',
        startDate: '',
        shift: '',
        performanceScore: '',
        performancePeriod: '',
        positionStartDate: ''
    });
    const [saving, setSaving] = useState(false);

    // File Upload States
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [docFiles, setDocFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Reset files when closing
    useEffect(() => {
        if (!isCreating && !editingEmp) {
            setPhotoFile(null);
            setPhotoPreview(null);
            setDocFiles([]);
        }
    }, [isCreating, editingEmp]);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleDocChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newDocs = Array.from(e.target.files);
            setDocFiles(prev => [...prev, ...newDocs]);
        }
    };

    const removeNewDoc = (index) => {
        setDocFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingDoc = async (index, empId) => {
        if (!editingEmp) return;
        const updatedDocs = [...(editingEmp.documents || [])];
        updatedDocs.splice(index, 1);
        setEditingEmp({ ...editingEmp, documents: updatedDocs });
    };

    const handleUploadPhoto = async (empId) => {
        if (!photoFile) return null;
        try {
            const result = await uploadFile(photoFile, { employeeId: empId, docType: 'profile' });
            if (!result.success) {
                console.error("Upload Error:", result.error);
                throw new Error(result.error || 'Error del servidor al subir foto');
            }
            return { photoUrl: result.data.viewLink, photoDriveId: result.data.id };
        } catch (error) {
            console.error("Upload Error:", error);
            toast.error("Error de Subida", error.message);
            return null;
        }
    };

    const handleUploadDocs = async (empId) => {
        if (docFiles.length === 0) return [];
        const uploadedDocs = [];
        for (const file of docFiles) {
            try {
                const result = await uploadFile(file, { employeeId: empId, docType: 'documents' });
                if (result.success) {
                    uploadedDocs.push({
                        name: file.name,
                        url: result.data.viewLink,
                        driveId: result.data.id,
                        uploadDate: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error("Error subiendo documento:", file.name, error);
            }
        }
        return uploadedDocs;
    };

    useEffect(() => {
        loadEmployees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let result = employees;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(e =>
                e.name.toLowerCase().includes(term) ||
                (e.id && e.id.toLowerCase().includes(term))
            );
        }
        if (deptFilter !== 'Todos') {
            result = result.filter(e => e.department === deptFilter);
        }
        if (posFilter !== 'Todos') {
            result = result.filter(e => e.position === posFilter);
        }
        setFilteredEmployees(result);
        setCurrentPage(1);
    }, [searchTerm, deptFilter, posFilter, employees]);

    const loadEmployees = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'training_records'), orderBy('name'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setEmployees(data);
            setFilteredEmployees(data);
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
        setFormData({
            id: '', name: '', position: '', department: '', curp: '', occupation: '', area: '', education: '', startDate: '', shift: '', performanceScore: '', performancePeriod: '', positionStartDate: ''
        });
        setIsCreating(true);
    };

    const handleEdit = (emp) => {
        setFormData({
            id: emp.id,
            name: emp.name || '',
            position: emp.position || '',
            department: emp.department || '',
            curp: emp.curp || '',
            occupation: emp.occupation || '',
            area: emp.area || '',
            education: emp.education || '',
            startDate: emp.startDate || '',
            shift: emp.shift || '',
            performanceScore: emp.promotionData?.performanceScore || '',
            performancePeriod: emp.promotionData?.performancePeriod || '',
            positionStartDate: emp.promotionData?.positionStartDate || ''
        });
        setEditingEmp(emp);
    };

    const handleDelete = async (emp) => {
        if (user?.rol !== 'super_admin') {
            toast.error("Acceso Denegado", "Solo Super Admin puede eliminar.");
            return;
        }

        if (!window.confirm(`¿Estás seguro de eliminar a ${emp.name}? Esta acción es irreversible y eliminará al empleado de todos los registros (Capacitación, Instructores, etc).`)) return;

        try {
            const batch = writeBatch(db);

            // 1. Delete Main Record (training_records)
            const empRef = doc(db, 'training_records', emp.id);
            batch.delete(empRef);

            // 2. Delete Instructor Record (instructors) if exists
            // Try to delete using employeeId (which is the key in instructors collection)
            if (emp.employeeId || emp.id) {
                // In migration we used employeeId as key. If not present, fallback to doc ID.
                const targetId = emp.employeeId || emp.id;
                const instructorRef = doc(db, 'instructors', targetId);
                batch.delete(instructorRef);
            }

            await batch.commit();

            setEmployees(prev => prev.filter(e => e.id !== emp.id));
            setFilteredEmployees(prev => prev.filter(e => e.id !== emp.id));
            toast.success("Eliminado", "Empleado y datos asociados eliminados.");
        } catch (e) {
            console.error("Error deleting", e);
            toast.error("Error", "No se pudo eliminar el registro completamente.");
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
        setUploading(true); // Mostrar estado de carga
        try {
            const empId = isCreating ? formData.id.trim() || formData.name.replace(/\s+/g, '-').toUpperCase() : editingEmp.id;
            const ref = doc(db, 'training_records', empId);

            // 1. Subir archivos
            let photoData = {};
            if (photoFile) {
                const res = await handleUploadPhoto(empId);
                if (res) photoData = res;
            }

            const newDocs = await handleUploadDocs(empId);
            // Combinar documentos existentes (que pudieron ser borrados en la UI) con los nuevos
            const existingDocs = isCreating ? [] : (editingEmp?.documents || []);
            const allDocs = [...existingDocs, ...newDocs];

            const payload = {
                name: (formData.name || '').trim().toUpperCase(),
                position: (formData.position || '').trim().toUpperCase(),
                department: (formData.department || '').trim().toUpperCase(),
                curp: (formData.curp || '').trim().toUpperCase(),
                occupation: formData.occupation ? formData.occupation.trim().toUpperCase() : (formData.position || '').trim().toUpperCase(),
                area: (formData.area || '').trim().toUpperCase(),
                education: (formData.education || '').trim(),
                startDate: formData.startDate || '',
                shift: (formData.shift || '').trim().toUpperCase(),
                promotionData: {
                    ...(editingEmp?.promotionData || {}),
                    performanceScore: formData.performanceScore ? parseFloat(formData.performanceScore) : null,
                    performancePeriod: formData.performancePeriod || '',
                    positionStartDate: formData.positionStartDate || ''
                },
                updatedAt: new Date().toISOString(),
                ...photoData, // { photoUrl, photoDriveId }
                documents: allDocs
            };

            // Calculate Matrix Requirements
            let matrixData = { requiredCount: 0, completedCount: 0, compliancePercentage: 0, requiredCourses: [] };
            try {
                // Robust Matrix Lookup
                const posName = payload.position;
                const posColl = collection(db, 'positions');
                let matrixDoc = null;

                // 1. Exact Match
                let q = query(posColl, where('name', '==', posName), limit(1));
                let snap = await getDocs(q);

                if (!snap.empty) {
                    matrixDoc = snap.docs[0].data();
                } else {
                    // 2. Normalized Match (No Accents)
                    const allPosSnap = await getDocs(query(posColl));
                    const targetNorm = posName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

                    const found = allPosSnap.docs.find(d => {
                        const dName = d.data().name.toUpperCase().trim();
                        const dNorm = dName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                        return dName === posName || dNorm === targetNorm;
                    });

                    if (found) {
                        matrixDoc = found.data();
                    }
                }

                if (matrixDoc) {
                    const requiredCourses = matrixDoc.requiredCourses || [];
                    const history = isCreating ? [] : (editingEmp.history || []);
                    const completed = requiredCourses.filter(reqCourse =>
                        history.some(h => h.courseName === reqCourse && h.status === 'approved')
                    );

                    matrixData = {
                        requiredCount: requiredCourses.length,
                        completedCount: completed.length,
                        compliancePercentage: requiredCourses.length > 0
                            ? Math.round((completed.length / requiredCourses.length) * 100)
                            : 0,
                        requiredCourses: requiredCourses
                    };
                }
            } catch (err) {
                console.error("Error fetching matrix:", err);
            }

            if (isCreating) {
                // Check if exists
                const check = await getDoc(ref);
                if (check.exists()) {
                    toast.error("ID Duplicado", `El ID de empleado "${empId}" ya existe. Por favor usa un ID diferente.`);
                    setSaving(false);
                    setUploading(false);
                    return;
                }
                await setDoc(ref, {
                    ...payload,
                    employeeId: empId,
                    history: [],
                    matrix: matrixData
                });
                toast.success("Creado", "Empleado registrado correctamente.");

                // Add to local list
                setEmployees(prev => [...prev, { id: empId, ...payload, history: [], matrix: {} }].sort((a, b) => a.name.localeCompare(b.name)));
            } else {
                await updateDoc(ref, {
                    ...payload,
                    matrix: matrixData
                });
                toast.success("Actualizado", "Datos guardados.");

                // Update local list
                setEmployees(prev => prev.map(e => e.id === empId ? { ...e, ...payload, matrix: matrixData } : e));
            }

            setIsCreating(false);
            setEditingEmp(null);
            setFormData({ id: '', name: '', position: '', department: '', curp: '', occupation: '' });

        } catch (error) {
            console.error("Error saving employee:", error);
            toast.error("Error", "No se pudo guardar.");
        } finally {
            setSaving(false);
            setUploading(false);
        }
    };

    const getComplianceColor = (score) => {
        if (score >= 95) return styles.complianceHigh;
        if (score >= 80) return styles.complianceMedium;
        return styles.complianceLow;
    };

    // State for expanded employee
    const [expandedId, setExpandedId] = useState(null);
    const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    };

    if (authLoading || !user) {
        return (
            <div className={styles.main}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={styles.profileContainer}>
                <ProfileDropdown />
            </div>
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
                            <BackButton href="/capacitacion" />
                            <div className={styles.headerContent}>
                                <h1>Gestión de Empleados</h1>
                                <p>Administración de personal y datos maestros</p>
                            </div>

                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className={styles.topSection}>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.statIconBlue}`}>👥</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{filteredEmployees.length}</span>
                                <span className={styles.statLabel}>Empleados</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.statIconGreen}`}>✓</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{filteredEmployees.filter(e => (e.matrix?.compliancePercentage || 0) >= 80).length}</span>
                                <span className={styles.statLabel}>Cumplimiento ≥80%</span>
                            </div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={`${styles.statIcon} ${styles.statIconOrange}`}>⚠</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statValue}>{filteredEmployees.filter(e => (e.matrix?.compliancePercentage || 0) < 70).length}</span>
                                <span className={styles.statLabel}>Requieren Atención</span>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className={styles.searchSection}>
                        <div style={{ flex: 1 }}>
                            <EmployeeSearchBar
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                onAddEmployee={handleCreate}
                                canWrite={canWrite()}
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className={styles.filterCard}>
                        <div className={styles.filterContent}>
                            <div className={styles.filterGroup}>
                                <label>Departamento</label>
                                <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className={styles.select}>
                                    <option value="Todos">Todos</option>
                                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className={styles.filterGroup}>
                                <label>Puesto</label>
                                <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)} className={styles.select}>
                                    <option value="Todos">Todos</option>
                                    {positions.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className={styles.countBadge}>{filteredEmployees.length} Registros</div>
                        </div>
                    </div>

                    {/* Employees List with Two Column Layout */}
                    {loading ? (
                        <div className={styles.loadingContainer}><div className="spinner"></div></div>
                    ) : (
                        <div className={styles.mainContent}>
                            {/* Left Column - Employee List */}
                            <div className={styles.listColumn}>
                                <div className={styles.employeesList}>
                                    {filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(emp => (
                                        <div key={emp.id} className={styles.employeeCard}>
                                            <div className={styles.employeeRow} onClick={() => toggleExpand(emp.id)}>
                                                <div className={styles.employeeInfo}>
                                                    <div
                                                        className={styles.avatarWrapper}
                                                        onClick={(e) => { e.stopPropagation(); emp.photoUrl && setPreviewImage({ url: emp.photoUrl, name: emp.name }); }}
                                                        style={{ cursor: emp.photoUrl ? 'pointer' : 'default' }}
                                                    >
                                                        {emp.photoUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={emp.photoUrl} alt={emp.name} referrerPolicy="no-referrer" />
                                                        ) : getInitials(emp.name)}
                                                    </div>
                                                    <div className={styles.employeeDetails}>
                                                        <span className={styles.empName}>{emp.name}</span>
                                                        <span className={styles.empMeta}>{emp.position || 'Sin puesto'} • ID: {emp.employeeId || emp.id}</span>
                                                    </div>
                                                </div>
                                                <div className={styles.employeeActions}>
                                                    <span className={`${styles.complianceBadge} ${getComplianceColor(emp.matrix?.compliancePercentage || 0)}`}>
                                                        {emp.matrix?.compliancePercentage || 0}%
                                                    </span>
                                                    <button className={`${styles.expandBtn} ${expandedId === emp.id ? styles.expanded : ''}`}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="6 9 12 15 18 9" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {expandedId === emp.id && (
                                                <div className={styles.expandedContent}>
                                                    <div className={styles.quickStats}>
                                                        <div className={styles.quickStat}>
                                                            <span>{emp.matrix?.completedCount || 0}</span>
                                                            <span>Aprobados</span>
                                                        </div>
                                                        <div className={styles.quickStat}>
                                                            <span>{emp.matrix?.requiredCount || 0}</span>
                                                            <span>Requeridos</span>
                                                        </div>
                                                        <div className={styles.quickStat}>
                                                            <span>{emp.department || '—'}</span>
                                                            <span>Departamento</span>
                                                        </div>
                                                    </div>

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
                                                            <span className={styles.detailLabel}>CURP</span>
                                                            <span className={styles.detailValue}>{emp.curp || '—'}</span>
                                                        </div>
                                                        <div className={styles.detailItem}>
                                                            <span className={styles.detailLabel}>Fecha Ingreso</span>
                                                            <span className={styles.detailValue}>{emp.startDate || '—'}</span>
                                                        </div>
                                                    </div>

                                                    {emp.history && emp.history.length > 0 && (
                                                        <div className={styles.trainingHistory}>
                                                            <h4>Historial Reciente</h4>
                                                            <div className={styles.historyList}>
                                                                {emp.history.slice().reverse().slice(0, 3).map((h, i) => (
                                                                    <div key={i} className={styles.historyItem}>
                                                                        <span className={styles.historyName}>{h.courseName}</span>
                                                                        <div className={styles.historyMeta}>
                                                                            <span>{h.date}</span>
                                                                            <span className={h.status === 'approved' ? styles.statusApproved : styles.statusRejected}>
                                                                                {h.status === 'approved' ? '✓' : '✗'} {h.score}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className={styles.actionButtonsRow}>
                                                        {canWrite() && (
                                                            <>
                                                                <button className={`${styles.actionBtn} ${styles.danger}`} onClick={(e) => { e.stopPropagation(); handleDelete(emp); }}>
                                                                    🗑️ Eliminar
                                                                </button>
                                                                <button className={`${styles.actionBtn} ${styles.primary}`} onClick={(e) => { e.stopPropagation(); handleEdit(emp); }}>
                                                                    ✏️ Editar
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {filteredEmployees.length === 0 && (
                                        <div className={styles.emptyState}>No se encontraron resultados.</div>
                                    )}
                                </div>

                                {/* Pagination */}
                                <div className={styles.paginationControls}>
                                    <span className={styles.pageInfo}>
                                        Página {currentPage} de {Math.ceil(filteredEmployees.length / itemsPerPage) || 1}
                                    </span>
                                    <div className={styles.pageButtons}>
                                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>←</Button>
                                        <Button variant="outline" size="sm" disabled={currentPage >= Math.ceil(filteredEmployees.length / itemsPerPage)} onClick={() => setCurrentPage(prev => prev + 1)}>→</Button>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Dynamic Content (Desktop only) */}
                            <div className={styles.detailColumn}>
                                {isCreating || editingEmp ? (
                                    <div className={styles.detailContent} style={{ padding: '0 10px' }}>
                                        <div className={styles.header} style={{ marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                                                {isCreating ? 'Nuevo Empleado' : 'Editar Empleado'}
                                            </h2>
                                            <Button variant="ghost" size="sm" onClick={() => { setIsCreating(false); setEditingEmp(null); }}>✕</Button>
                                        </div>

                                        {/* Foto de Perfil Form */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
                                            <div style={{
                                                width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden',
                                                background: 'var(--bg-tertiary, #f0f0f0)', marginBottom: '12px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: '2px solid var(--border-color, #e2e8f0)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                            }}>
                                                {photoPreview || editingEmp?.photoUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={photoPreview || editingEmp?.photoUrl} alt="Vista previa" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                        <circle cx="12" cy="7" r="4" />
                                                    </svg>
                                                )}
                                            </div>
                                            <label htmlFor="photo-upload-col" style={{
                                                cursor: 'pointer', padding: '6px 14px', fontSize: '0.8rem', fontWeight: '600',
                                                color: 'var(--color-primary, #2563eb)', background: 'rgba(37, 99, 235, 0.1)',
                                                borderRadius: '50px', transition: 'all 0.2s'
                                            }}>
                                                {photoPreview || editingEmp?.photoUrl ? 'Cambiar Foto' : 'Subir Foto'}
                                            </label>
                                            <input id="photo-upload-col" type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label>Nombre Completo</label>
                                            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={styles.input} />
                                        </div>

                                        <div className={styles.formGrid}>
                                            <div className={styles.formGroup}>
                                                <label>ID Empleado</label>
                                                <input type="text" value={formData.id} onChange={(e) => isCreating && setFormData({ ...formData, id: e.target.value })}
                                                    placeholder={isCreating ? "Auto" : ""} readOnly={!isCreating}
                                                    className={styles.input} style={!isCreating ? { opacity: 0.7, background: 'var(--bg-tertiary)' } : {}} />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>CURP</label>
                                                <input type="text" value={formData.curp} onChange={(e) => setFormData({ ...formData, curp: e.target.value })} maxLength={18} className={styles.input} />
                                            </div>
                                        </div>

                                        <div className={styles.formGrid}>
                                            <div className={styles.formGroup}>
                                                <label>Puesto</label>
                                                <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} list="positionsListCol" className={styles.input} />
                                                <datalist id="positionsListCol">{positions.map(p => <option key={p} value={p} />)}</datalist>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Departamento</label>
                                                <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} list="deptListCol" className={styles.input} />
                                                <datalist id="deptListCol">{departments.map(d => <option key={d} value={d} />)}</datalist>
                                            </div>
                                        </div>

                                        <div className={styles.formGrid}>
                                            <div className={styles.formGroup}>
                                                <label>Área</label>
                                                <select value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} className={styles.select}>
                                                    <option value="">-- Seleccionar --</option>
                                                    <option value="A. CALIDAD 1ER TURNO">A. CALIDAD 1ER TURNO</option>
                                                    <option value="A. CALIDAD 2DO TURNO">A. CALIDAD 2DO TURNO</option>
                                                    <option value="ALMACÉN">ALMACÉN</option>
                                                    <option value="CALIDAD ADMTVO">CALIDAD ADMTVO</option>
                                                    <option value="GERENCIA">GERENCIA</option>
                                                    <option value="LOGÍSTICA">LOGÍSTICA</option>
                                                    <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                                                    <option value="METROLOGÍA">METROLOGÍA</option>
                                                    <option value="MOLDES">MOLDES</option>
                                                    <option value="PRODUCCIÓN 1ER TURNO">PRODUCCIÓN 1ER TURNO</option>
                                                    <option value="PRODUCCIÓN 2DO TURNO">PRODUCCIÓN 2DO TURNO</option>
                                                    <option value="PRODUCCIÓN 3ER TURNO">PRODUCCIÓN 3ER TURNO</option>
                                                    <option value="PRODUCCIÓN 4TO TURNO">PRODUCCIÓN 4TO TURNO</option>
                                                    <option value="PRODUCCIÓN ADMTVO">PRODUCCIÓN ADMTVO</option>
                                                    <option value="PRODUCCIÓN MONTAJE">PRODUCCIÓN MONTAJE</option>
                                                    <option value="PROYECTOS">PROYECTOS</option>
                                                    <option value="RECURSOS HUMANOS">RECURSOS HUMANOS</option>
                                                    <option value="RESIDENTES DE CALIDAD">RESIDENTES DE CALIDAD</option>
                                                    <option value="SGI">SGI</option>
                                                    <option value="SISTEMAS">SISTEMAS</option>
                                                </select>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Turno</label>
                                                <select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className={styles.select}>
                                                    <option value="">-- Seleccionar --</option>
                                                    <option value="1">1</option>
                                                    <option value="2">2</option>
                                                    <option value="3">3</option>
                                                    <option value="4">4</option>
                                                    <option value="5">5</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className={styles.formGrid}>
                                            <div className={styles.formGroup}>
                                                <label>Escolaridad</label>
                                                <select value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })} className={styles.select}>
                                                    <option value="">-- Seleccionar --</option>
                                                    <option value="BACHILLERATO">BACHILLERATO</option>
                                                    <option value="CARRERA TECNICA">CARRERA TECNICA</option>
                                                    <option value="INGENIERIA">INGENIERIA</option>
                                                    <option value="LICENCIATURA">LICENCIATURA</option>
                                                    <option value="MAESTRIA">MAESTRIA</option>
                                                    <option value="PASANTE INGENIERIA">PASANTE INGENIERIA</option>
                                                    <option value="POSGRADO">POSGRADO</option>
                                                    <option value="PREPARATORIA">PREPARATORIA</option>
                                                    <option value="PRIMARIA">PRIMARIA</option>
                                                    <option value="SECUNDARIA">SECUNDARIA</option>
                                                    <option value="TSU">TSU</option>
                                                </select>
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label>Fecha Ingreso</label>
                                                <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className={styles.input} />
                                            </div>
                                        </div>

                                        {/* Documentos Section */}
                                        <div className={styles.formGroup} style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Documentos</h4>
                                                <label htmlFor="doc-upload-col" style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    📎 Adjuntar
                                                </label>
                                                <input id="doc-upload-col" type="file" multiple accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleDocChange} style={{ display: 'none' }} />
                                            </div>

                                            {/* Existing Docs */}
                                            {editingEmp?.documents && editingEmp.documents.length > 0 && (
                                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px 0' }}>
                                                    {editingEmp.documents.map((doc, index) => (
                                                        <li key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-tertiary)', marginBottom: '4px', borderRadius: '6px', fontSize: '0.85rem' }}>
                                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                                                                📄 {doc.name}
                                                            </a>
                                                            <button type="button" onClick={() => removeExistingDoc(index, editingEmp.id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}

                                            {/* New Docs */}
                                            {docFiles.length > 0 && (
                                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                    {docFiles.map((file, index) => (
                                                        <li key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(37, 99, 235, 0.05)', border: '1px dashed var(--color-primary)', marginBottom: '4px', borderRadius: '6px', fontSize: '0.85rem' }}>
                                                            <span style={{ color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>{file.name}</span>
                                                            <button type="button" onClick={() => removeNewDoc(index)} style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>✕</button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                                            <Button variant="ghost" style={{ flex: 1 }} onClick={() => { setIsCreating(false); setEditingEmp(null); }}>Cancelar</Button>
                                            <Button style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                                                {saving ? 'Guardando...' : 'Guardar'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : viewingEmp ? (
                                    <div className={styles.detailContent}>
                                        <div className={styles.detailHeader}>
                                            <div className={styles.detailAvatar}>
                                                {viewingEmp.photoUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={viewingEmp.photoUrl} alt={viewingEmp.name} referrerPolicy="no-referrer" />
                                                ) : (
                                                    <span>{viewingEmp.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <h2>{viewingEmp.name}</h2>
                                            <p>ID: {viewingEmp.employeeId || viewingEmp.id}</p>
                                        </div>
                                        <div className={styles.detailsGrid}>
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Puesto</span>
                                                <span className={styles.detailValue}>{viewingEmp.position || '—'}</span>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Departamento</span>
                                                <span className={styles.detailValue}>{viewingEmp.department || '—'}</span>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Área</span>
                                                <span className={styles.detailValue}>{viewingEmp.area || '—'}</span>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Turno</span>
                                                <span className={styles.detailValue}>{viewingEmp.shift || '—'}</span>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>CURP</span>
                                                <span className={styles.detailValue}>{viewingEmp.curp || '—'}</span>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Fecha Ingreso</span>
                                                <span className={styles.detailValue}>{viewingEmp.startDate || '—'}</span>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Cumplimiento</span>
                                                <span className={styles.detailValue}>{viewingEmp.matrix?.compliancePercentage || 0}%</span>
                                            </div>
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Cursos Requeridos</span>
                                                <span className={styles.detailValue}>{viewingEmp.matrix?.requiredCount || 0}</span>
                                            </div>
                                        </div>
                                        {canWrite() && (
                                            <div className={styles.detailActions}>
                                                <Button onClick={() => handleEdit(viewingEmp)}>✏️ Editar</Button>
                                                <Button variant="outline" onClick={() => handleDelete(viewingEmp)}>🗑️ Eliminar</Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className={styles.emptyDetail}>
                                        <div className={styles.emptyDetailIcon}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                        </div>
                                        <h3 className={styles.emptyDetailTitle}>Selecciona un empleado</h3>
                                        <p className={styles.emptyDetailText}>Haz clic en su tarjeta para ver detalles o editar</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main >

            {/* Create/Edit Modal - Mobile Only */}
            {
                !isDesktop && (
                    <Dialog open={isCreating || !!editingEmp} onOpenChange={(open) => !open && (setIsCreating(false), setEditingEmp(null))}>
                        <DialogHeader>
                            <DialogTitle>{isCreating ? 'Nuevo Empleado' : 'Editar Empleado'}</DialogTitle>
                            <DialogClose onClose={() => { setIsCreating(false); setEditingEmp(null); }} />
                        </DialogHeader>
                        <DialogBody>
                            {/* Foto de Perfil */}
                            {/* Foto de Perfil */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', paddingTop: '10px' }}>
                                <div style={{
                                    width: '90px',
                                    height: '90px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    background: 'var(--bg-tertiary, #f0f0f0)',
                                    marginBottom: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid var(--border-color, #e2e8f0)',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}>
                                    {photoPreview || editingEmp?.photoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={photoPreview || editingEmp?.photoUrl} alt="Vista previa" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    )}
                                </div>
                                <label htmlFor="photo-upload-modal" style={{
                                    cursor: 'pointer',
                                    padding: '6px 14px',
                                    fontSize: '0.8rem',
                                    fontWeight: '600',
                                    color: 'var(--color-primary, #2563eb)',
                                    background: 'rgba(37, 99, 235, 0.1)',
                                    borderRadius: '50px',
                                    transition: 'all 0.2s'
                                }}>
                                    {photoPreview || editingEmp?.photoUrl ? 'Cambiar Foto' : 'Subir Foto'}
                                </label>
                                <input
                                    id="photo-upload-modal"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Nombre Completo</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>ID Empleado</label>
                                    <input
                                        type="text"
                                        value={formData.id}
                                        onChange={(e) => isCreating && setFormData({ ...formData, id: e.target.value })}
                                        placeholder={isCreating ? "Auto-generado si vacío" : ""}
                                        readOnly={!isCreating}
                                        disabled={!isCreating}
                                        style={!isCreating ? { opacity: 0.7, cursor: 'not-allowed', background: '#f5f5f5' } : {}}
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
                            </div>

                            <div className={styles.formGrid}>
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
                            </div>

                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Área</label>
                                    <select
                                        value={formData.area}
                                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                                        className={styles.select}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        <option value="A. CALIDAD 1ER TURNO">A. CALIDAD 1ER TURNO</option>
                                        <option value="A. CALIDAD 2DO TURNO">A. CALIDAD 2DO TURNO</option>
                                        <option value="ALMACÉN">ALMACÉN</option>
                                        <option value="CALIDAD ADMTVO">CALIDAD ADMTVO</option>
                                        <option value="GERENCIA">GERENCIA</option>
                                        <option value="LOGÍSTICA">LOGÍSTICA</option>
                                        <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                                        <option value="METROLOGÍA">METROLOGÍA</option>
                                        <option value="MOLDES">MOLDES</option>
                                        <option value="PRODUCCIÓN 1ER TURNO">PRODUCCIÓN 1ER TURNO</option>
                                        <option value="PRODUCCIÓN 2DO TURNO">PRODUCCIÓN 2DO TURNO</option>
                                        <option value="PRODUCCIÓN 3ER TURNO">PRODUCCIÓN 3ER TURNO</option>
                                        <option value="PRODUCCIÓN 4TO TURNO">PRODUCCIÓN 4TO TURNO</option>
                                        <option value="PRODUCCIÓN ADMTVO">PRODUCCIÓN ADMTVO</option>
                                        <option value="PRODUCCIÓN MONTAJE">PRODUCCIÓN MONTAJE</option>
                                        <option value="PROYECTOS">PROYECTOS</option>
                                        <option value="RECURSOS HUMANOS">RECURSOS HUMANOS</option>
                                        <option value="RESIDENTES DE CALIDAD">RESIDENTES DE CALIDAD</option>
                                        <option value="SGI">SGI</option>
                                        <option value="SISTEMAS">SISTEMAS</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Turno</label>
                                    <select
                                        value={formData.shift}
                                        onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                        className={styles.select}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Escolaridad</label>
                                    <select
                                        value={formData.education}
                                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                        className={styles.select}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        <option value="BACHILLERATO">BACHILLERATO</option>
                                        <option value="CARRERA TECNICA">CARRERA TECNICA</option>
                                        <option value="INGENIERIA">INGENIERIA</option>
                                        <option value="LICENCIATURA">LICENCIATURA</option>
                                        <option value="MAESTRIA">MAESTRIA</option>
                                        <option value="PASANTE INGENIERIA">PASANTE INGENIERIA</option>
                                        <option value="POSGRADO">POSGRADO</option>
                                        <option value="PREPARATORIA">PREPARATORIA</option>
                                        <option value="PRIMARIA">PRIMARIA</option>
                                        <option value="SECUNDARIA">SECUNDARIA</option>
                                        <option value="TSU">TSU</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Fecha Ingreso</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                            </div>

                        </DialogBody>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => { setIsCreating(false); setEditingEmp(null); }}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </Dialog>
                )
            }

            {/* View Detail Modal - Only on mobile devices */}
            <Dialog open={!!viewingEmp && !isDesktop} onOpenChange={(open) => !open && setViewingEmp(null)}>
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

            {/* Photo Preview Modal */}
            <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogHeader>
                    <DialogTitle>{previewImage?.name}</DialogTitle>
                    <DialogClose onClose={() => setPreviewImage(null)} />
                </DialogHeader>
                <DialogBody>
                    <div style={{ display: 'flex', justifyContent: 'center', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                        {previewImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={previewImage.url}
                                alt={previewImage.name}
                                referrerPolicy="no-referrer"
                                style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '4px', objectFit: 'contain' }}
                            />
                        )}
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button onClick={() => setPreviewImage(null)}>Cerrar</Button>
                </DialogFooter>
            </Dialog>
        </>
    );
}
