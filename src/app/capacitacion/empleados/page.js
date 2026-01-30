'use client';

import { useState, useEffect } from 'react';

import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { db } from '@/lib/firebase';
import { uploadFile } from '@/lib/upload';
import { collection, getDocs, query, orderBy, doc, updateDoc, setDoc, getDoc, deleteDoc, where, limit } from 'firebase/firestore';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import styles from './page.module.css';

export default function EmpleadosPage() {
    const { user, canWrite } = useAuth();
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

        // Optimistic update local
        setEditingEmp({ ...editingEmp, documents: updatedDocs });

        // Update Firestore immediately (optional, or wait for save)
        // For now, we'll let handleSave do the heavy lifting, 
        // but we need to update formData or editingEmp to reflect changes?
        // Actually, easiest is to just update state and let handleSave merge it.
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
        setFormData({
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
                    toast.error("Error", "Ya existe un empleado con este ID.");
                    setSaving(false);
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
                    {canWrite() && <Button onClick={handleCreate}>+ Nuevo Empleado</Button>}
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
                                                <th style={{ textAlign: 'center' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(emp => (
                                                <tr key={emp.id}>
                                                    <td className={styles.fwBold}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div
                                                                onClick={() => emp.photoUrl && setPreviewImage({ url: emp.photoUrl, name: emp.name })}
                                                                style={{ cursor: emp.photoUrl ? 'pointer' : 'default', transition: 'transform 0.1s' }}
                                                                title={emp.photoUrl ? "Ver foto" : ""}
                                                                onMouseOver={(e) => emp.photoUrl && (e.currentTarget.style.transform = 'scale(1.1)')}
                                                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                            >
                                                                <Avatar name={emp.name} src={emp.photoUrl} size="md" />
                                                            </div>
                                                            <div
                                                                onClick={() => setViewingEmp(emp)}
                                                                style={{ cursor: 'pointer' }}
                                                                className={styles.clickableName}
                                                            >
                                                                {emp.name}
                                                                <div className={styles.subText}>ID: {emp.employeeId || emp.id}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{emp.position}</td>
                                                    <td>
                                                        {emp.department ? (
                                                            <span className={styles.deptBadge}>{emp.department}</span>
                                                        ) : (
                                                            <span className={styles.missingBadge}>Sin Asignar ⚠️</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div className={styles.actionButtons}>
                                                            {canWrite() && (
                                                                <>
                                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(emp)}>
                                                                        ✏️ Editar
                                                                    </Button>
                                                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(emp)} style={{ color: 'var(--color-danger)' }}>
                                                                        🗑️
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredEmployees.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className={styles.emptyState}>
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
                    {/* Foto de Perfil */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', background: '#f0f0f0', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #ddd' }}>
                            {photoPreview || editingEmp?.photoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={photoPreview || editingEmp?.photoUrl} alt="Vista previa" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            )}
                        </div>
                        <label htmlFor="photo-upload-modal" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', padding: '5px 10px', fontSize: '0.8rem' }}>
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
                        <label>Fecha de Ingreso</label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Calificación Eval. Desempeño (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.performanceScore}
                            onChange={(e) => setFormData({ ...formData, performanceScore: e.target.value })}
                            placeholder="0-100"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Período de Evaluación</label>
                        <select
                            value={formData.performancePeriod}
                            onChange={(e) => setFormData({ ...formData, performancePeriod: e.target.value })}
                            className={styles.select}
                        >
                            <option value="">-- Seleccionar --</option>
                            <option value="JULIO - DICIEMBRE 2025">JULIO - DICIEMBRE 2025</option>
                            <option value="ENERO - JUNIO 2026">ENERO - JUNIO 2026</option>
                            <option value="JULIO - DICIEMBRE 2026">JULIO - DICIEMBRE 2026</option>
                            <option value="ENERO - JUNIO 2027">ENERO - JUNIO 2027</option>
                            <option value="JULIO - DICIEMBRE 2027">JULIO - DICIEMBRE 2027</option>
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
                    <div className={styles.formGroup}>
                        <label>Fecha Último Cambio de Puesto (Temporalidad)</label>
                        <input
                            type="date"
                            value={formData.positionStartDate}
                            onChange={(e) => setFormData({ ...formData, positionStartDate: e.target.value })}
                        />
                    </div>

                    {/* Documentos */}
                    <div className={styles.formGroup} style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Documentos y Certificados</h4>

                        {/* Lista Existentes */}
                        {editingEmp?.documents && editingEmp.documents.length > 0 && (
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 15px 0' }}>
                                {editingEmp.documents.map((doc, index) => (
                                    <li key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: '#f8fafc', marginBottom: '5px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                            📄 {doc.name}
                                        </a>
                                        <button type="button" onClick={() => removeExistingDoc(index, editingEmp.id)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                                            🗑️
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {/* Lista Nuevos */}
                        {docFiles.length > 0 && (
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '5px' }}>Por subir:</div>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                    {docFiles.map((file, index) => (
                                        <li key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: '#eff6ff', marginBottom: '5px', borderRadius: '4px', border: '1px dashed #bfdbfe' }}>
                                            <span style={{ fontSize: '13px', color: '#1e40af' }}>{file.name}</span>
                                            <button type="button" onClick={() => removeNewDoc(index)} style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>✕</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <input
                            type="file"
                            id="doc-upload-modal"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.png"
                            onChange={handleDocChange}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="doc-upload-modal" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '4px' }}>
                            📎 Adjuntar Documentos
                        </label>
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

                    {/* Documentos y Certificados */}
                    {viewingEmp?.documents && viewingEmp.documents.length > 0 && (
                        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                            <h4 className={styles.sectionTitle}>Documentos y Certificados</h4>
                            <div className={styles.historyList}>
                                {viewingEmp.documents.map((doc, index) => (
                                    <div key={index} className={styles.historyItem} style={{ borderLeft: '3px solid #3b82f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className={styles.historyName}>{doc.name}</span>
                                            <span style={{ fontSize: '11px', color: '#64748b' }}>Subido: {new Date(doc.uploadDate).toLocaleDateString()}</span>
                                        </div>
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-sm btn-secondary"
                                            style={{ textDecoration: 'none', padding: '4px 8px', fontSize: '12px' }}
                                        >
                                            Ver 📄
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Missing Courses Section */}
                    {(viewingEmp?.matrix?.pendingCourses?.length > 0 || viewingEmp?.matrix?.failedCourses?.length > 0) && (
                        <>
                            <h4 className={styles.sectionTitle} style={{ marginTop: '1rem' }}>Cursos Pendientes</h4>
                            <div className={styles.historyList}>
                                {viewingEmp?.matrix?.failedCourses?.map((c, i) => (
                                    <div key={`f-${i}`} className={styles.historyItem} style={{ borderLeft: '3px solid #ef4444' }}>
                                        <div className={styles.historyName}>{c}</div>
                                        <div className={styles.historyMeta}>
                                            <span className={styles.statusRejected}>Reprobado - Requiere recursar</span>
                                        </div>
                                    </div>
                                ))}
                                {viewingEmp?.matrix?.pendingCourses?.map((c, i) => (
                                    <div key={`p-${i}`} className={styles.historyItem} style={{ borderLeft: '3px solid #f59e0b' }}>
                                        <div className={styles.historyName}>{c}</div>
                                        <div className={styles.historyMeta}>
                                            <span style={{ color: '#f59e0b' }}>Pendiente - Nunca tomado</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

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
