'use client';

import { useState, useEffect } from 'react';
import { Combobox } from '@/components/ui/Combobox/Combobox';
import styles from './EmployeeForm.module.css';
import { uploadFile } from '@/lib/upload';
import { useEmployeeDates } from '@/hooks/useEmployeeDates';

export default function EmployeeForm({
    employee = null,
    title = 'Nuevo Empleado',
    onSubmit,
    onCancel,
    initialData = {},
    puestosOptions = [],
    departamentosOptions = [],
    getAreasForDepartment
}) {
    const { calculateDates, calculateTrainingPlanDate, formatDate } = useEmployeeDates();

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
        trainingPlanDelivered: false,
        ...initialData
    });

    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [docFiles, setDocFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (employee) {
            setFormData({
                employeeId: employee.employeeId || '',
                name: employee.name || '',
                position: employee.position || '',
                area: employee.area || '',
                department: employee.department || '',
                shift: employee.shift || '',
                startDate: employee.startDate || '',
                eval1Score: employee.eval1Score || '',
                eval2Score: employee.eval2Score || '',
                eval3Score: employee.eval3Score || '',
                trainingPlanDelivered: employee.trainingPlanDelivered || false,
                photoUrl: employee.photoUrl || '',
                photoDriveId: employee.photoDriveId || '',
                documents: employee.documents || []
            });
            if (employee.photoUrl) setPhotoPreview(employee.photoUrl);
        }
    }, [employee]);

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

    const removeExistingDoc = (index) => {
        const updatedDocs = [...(formData.documents || [])];
        updatedDocs.splice(index, 1);
        setFormData({ ...formData, documents: updatedDocs });
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

    const handleUploadPhoto = async (empId) => {
        if (!photoFile) return null;
        try {
            const result = await uploadFile(photoFile, { employeeId: empId, docType: 'profile' });
            if (!result.success) throw new Error(result.error || 'Error subiendo foto');
            return {
                photoUrl: result.data.viewLink,
                photoDriveId: result.data.id
            };
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        try {
            const dates = calculateDates(formData.startDate);
            let photoData = {};
            if (photoFile) {
                const uploadResult = await handleUploadPhoto(formData.employeeId);
                if (uploadResult) photoData = uploadResult;
            }
            const newUploadedDocs = await handleUploadDocs(formData.employeeId);
            const finalDocuments = [...(formData.documents || []), ...newUploadedDocs];
            onSubmit({
                ...formData,
                ...dates,
                ...photoData,
                documents: finalDocuments
            });
        } catch (error) {
            console.error("Error al guardar:", error);
        } finally {
            setUploading(false);
        }
    };

    const getEvalStatus = (score) => {
        if (score === '' || score === null || score === undefined) return 'pending';
        const numScore = parseFloat(score);
        return numScore >= 80 ? 'approved' : 'failed';
    };

    const calculatedDates = formData.startDate ? calculateDates(formData.startDate) : null;
    const trainingPlanDate = calculateTrainingPlanDate(formData.startDate, formData.department, formData.area);

    return (
        <div className={`${styles.formCard} fade-in`}>
            {/* Form Header */}
            <div className={styles.formHeader}>
                <div className={styles.headerIcon}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>
                <div className={styles.headerText}>
                    <h2>{title}</h2>
                    <p>{employee ? 'Actualiza la información del empleado' : 'Completa los datos del nuevo empleado'}</p>
                </div>
                {onCancel && (
                    <button type="button" onClick={onCancel} className={styles.closeBtn} aria-label="Cerrar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Form Body */}
            <div className={styles.formBody}>
                <form onSubmit={handleSubmit} className={styles.form}>

                    {/* Photo Upload */}
                    <div className={styles.photoSection}>
                        <div className={styles.photoPreview}>
                            {photoPreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={photoPreview} alt="Vista previa" />
                            ) : (
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            )}
                        </div>
                        <label htmlFor="photo-upload" className={styles.photoLabel}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            {photoPreview ? 'Cambiar Foto' : 'Subir Foto'}
                        </label>
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <span className={styles.photoHint}>JPG, PNG. Máximo 5MB</span>
                    </div>

                    {/* Basic Info Section */}
                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionIcon}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="8.5" cy="7" r="4" />
                                    <line x1="20" y1="8" x2="20" y2="14" />
                                    <line x1="23" y1="11" x2="17" y2="11" />
                                </svg>
                            </div>
                            <h3 className={styles.sectionTitle}>Información Personal</h3>
                        </div>
                        <div className={styles.sectionContent}>
                            <div className={styles.formGrid}>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="employeeId">ID de Empleado</label>
                                    <input
                                        id="employeeId"
                                        type="text"
                                        placeholder="Ej: EMP001"
                                        value={formData.employeeId}
                                        onChange={(e) => !employee && setFormData({ ...formData, employeeId: e.target.value })}
                                        readOnly={!!employee}
                                        disabled={!!employee}
                                        style={employee ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="name">Nombre Completo</label>
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="Nombre y apellidos"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                        style={{ textTransform: 'uppercase' }}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Work Info Section */}
                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionIcon}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                            </div>
                            <h3 className={styles.sectionTitle}>Información Laboral</h3>
                        </div>
                        <div className={styles.sectionContent}>
                            <div className={styles.formGrid}>
                                <Combobox
                                    label="Puesto"
                                    value={formData.position}
                                    onChange={(value) => setFormData({ ...formData, position: value })}
                                    options={puestosOptions}
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
                                        area: ''
                                    })}
                                    options={departamentosOptions}
                                    placeholder="Seleccionar departamento..."
                                    searchPlaceholder="Buscar departamento..."
                                    required
                                />
                                <Combobox
                                    label="Área"
                                    value={formData.area}
                                    onChange={(value) => setFormData({ ...formData, area: value })}
                                    options={formData.department && getAreasForDepartment ? getAreasForDepartment(formData.department) : []}
                                    placeholder={formData.department ? "Seleccionar área..." : "Primero selecciona departamento"}
                                    searchPlaceholder="Buscar área..."
                                    disabled={!formData.department}
                                    required
                                />
                                <div className={styles.inputGroup}>
                                    <label htmlFor="shift">Turno</label>
                                    <select
                                        id="shift"
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
                                    <label htmlFor="startDate">Fecha de Inicio</label>
                                    <input
                                        id="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Calculated Dates */}
                            {calculatedDates && (
                                <div className={styles.datesInfoCard} style={{ marginTop: 'var(--spacing-lg)' }}>
                                    <div className={styles.datesGrid}>
                                        <div className={styles.dateItem}>
                                            <div className={styles.dateIcon}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                    <line x1="3" y1="10" x2="21" y2="10" />
                                                </svg>
                                            </div>
                                            <div className={styles.dateInfo}>
                                                <span className={styles.dateLabel}>Fin de Contrato</span>
                                                <span className={styles.dateValue}>{formatDate(calculatedDates.contractEndDate)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Evaluations Section */}
                    {calculatedDates && (
                        <div className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                </div>
                                <h3 className={styles.sectionTitle}>Evaluaciones de Desempeño</h3>
                            </div>
                            <div className={styles.sectionContent}>
                                <div className={styles.evalsGrid}>
                                    {[
                                        { num: 1, date: calculatedDates.eval1Date, days: '30 días', score: 'eval1Score' },
                                        { num: 2, date: calculatedDates.eval2Date, days: '60 días', score: 'eval2Score' },
                                        { num: 3, date: calculatedDates.eval3Date, days: '75 días', score: 'eval3Score' }
                                    ].map((evalItem) => (
                                        <div
                                            key={evalItem.num}
                                            className={`${styles.evalCard} ${getEvalStatus(formData[evalItem.score]) === 'approved' ? styles.evalApproved :
                                                getEvalStatus(formData[evalItem.score]) === 'failed' ? styles.evalFailed : ''
                                                }`}
                                        >
                                            <div className={styles.evalHeader}>
                                                <span className={styles.evalNumber}>{evalItem.num}</span>
                                                <div>
                                                    <strong>Evaluación {evalItem.num}</strong>
                                                    <span className={styles.evalDate}>{formatDate(evalItem.date)} ({evalItem.days})</span>
                                                </div>
                                            </div>
                                            <div className={styles.evalInput}>
                                                <label htmlFor={evalItem.score}>Calificación</label>
                                                <input
                                                    id={evalItem.score}
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    placeholder="0-100"
                                                    value={formData[evalItem.score]}
                                                    onChange={(e) => setFormData({ ...formData, [evalItem.score]: e.target.value })}
                                                />
                                                {formData[evalItem.score] && (
                                                    <span className={`${styles.evalStatus} ${getEvalStatus(formData[evalItem.score]) === 'approved' ? styles.approved : styles.failed}`}>
                                                        {getEvalStatus(formData[evalItem.score]) === 'approved' ? '✓ Aprobado' : '✗ Reprobado'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.evalLegend}>
                                    <span><strong>≥ 80:</strong> Aprobado</span>
                                    <span><strong>&lt; 80:</strong> Reprobado - Requiere seguimiento</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Training Plan Section */}
                    {calculatedDates && (
                        <div className={styles.sectionCard}>
                            <div className={styles.sectionHeader}>
                                <div className={styles.sectionIcon}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                </div>
                                <h3 className={styles.sectionTitle}>Plan de Formación</h3>
                            </div>
                            <div className={styles.sectionContent}>
                                <div className={styles.trainingPlanCard}>
                                    <div className={styles.trainingPlanInfo}>
                                        <div className={styles.trainingPlanIcon}>
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                            </svg>
                                        </div>
                                        <div className={styles.trainingPlanDetails}>
                                            <strong>Fecha de Entrega:</strong>
                                            {trainingPlanDate ? (
                                                <span className={styles.trainingDate}>{formatDate(trainingPlanDate.date)}</span>
                                            ) : (
                                                <span className={styles.trainingPending}>Completa departamento y área</span>
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
                        </div>
                    )}

                    {/* Documents Section */}
                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <div className={styles.sectionIcon}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <h3 className={styles.sectionTitle}>Documentos y Certificados</h3>
                        </div>
                        <div className={styles.sectionContent}>
                            <div className={styles.documentsSection}>
                                {/* Existing Documents */}
                                {formData.documents && formData.documents.length > 0 && (
                                    <ul className={styles.documentsList}>
                                        {formData.documents.map((doc, index) => (
                                            <li key={index} className={styles.documentItem}>
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className={styles.documentLink}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                        <polyline points="14 2 14 8 20 8" />
                                                    </svg>
                                                    {doc.name}
                                                </a>
                                                <button type="button" onClick={() => removeExistingDoc(index)} className={styles.documentRemove} aria-label="Eliminar documento">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                        <line x1="18" y1="6" x2="6" y2="18" />
                                                        <line x1="6" y1="6" x2="18" y2="18" />
                                                    </svg>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {/* Pending Documents */}
                                {docFiles.length > 0 && (
                                    <div className={styles.pendingDocs}>
                                        <h4 className={styles.pendingTitle}>Por subir:</h4>
                                        <ul className={styles.pendingList}>
                                            {docFiles.map((file, index) => (
                                                <li key={index} className={styles.pendingItem}>
                                                    <span>{file.name}</span>
                                                    <button type="button" onClick={() => removeNewDoc(index)} className={styles.documentRemove} aria-label="Eliminar">
                                                        ✕
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Upload Button */}
                                <input
                                    type="file"
                                    id="doc-upload"
                                    multiple
                                    accept=".pdf,.doc,.docx,.jpg,.png"
                                    onChange={handleDocChange}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="doc-upload" className={styles.uploadLabel}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    Adjuntar Documentos
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className={styles.formActions}>
                        {onCancel && (
                            <button type="button" onClick={onCancel} className="btn btn-secondary">
                                Cancelar
                            </button>
                        )}
                        <button type="submit" className="btn btn-primary" disabled={uploading}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                <polyline points="17 21 17 13 7 13 7 21" />
                                <polyline points="7 3 7 8 15 8" />
                            </svg>
                            {uploading ? 'Guardando...' : (employee ? 'Actualizar' : 'Guardar')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
