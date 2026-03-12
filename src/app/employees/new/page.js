'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useCatalogs } from '@/hooks/useCatalogs';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useToast } from '@/components/ui/Toast/Toast';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import BackButton from '@/components/ui/BackButton/BackButton';
import { ChevronRight, ArrowLeft, Save, User, Briefcase, Info, Phone } from 'lucide-react';
import styles from './wizard.module.css';
import { Select } from '@/components/ui';

const STEPS = [
    { id: 1, title: 'Datos Personales', icon: User },
    { id: 2, title: 'Datos Laborales', icon: Briefcase },
    { id: 3, title: 'Detalles Extra', icon: Info },
];

const initialData = {
    name: '',
    employeeId: '',
    curp: '',
    phone: '',
    department: '',
    area: '',
    position: '',
    shift: '',
    startDate: '',
    contractEndDate: '',
    status: 'Activo',
    isCandidato: true, // Defaulting to Candidate as often requested
    accessCode: '',
};

export default function NewEmployeePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { createEmployee } = useEmployees();
    const { departments, areas, positions, loading: catalogsLoading } = useCatalogs();
    const { showToast } = useToast();
    const { errors: formErrors, validate: validateForm, clearError: clearErrors } = useFormValidation();

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(initialData);
    const [isSaving, setIsSaving] = useState(false);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        // Si cambia la fecha de inicio, auto-calcular fin de contrato (90 días)
        if (name === 'startDate' && value) {
            const start = new Date(value);
            const end = new Date(start);
            end.setDate(end.getDate() + 90);
            const endDateStr = end.toISOString().split('T')[0];
            setFormData(prev => ({
                ...prev,
                startDate: value,
                contractEndDate: endDateStr
            }));
            if (formErrors['startDate']) clearErrors('startDate');
            return;
        }
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (formErrors[name]) clearErrors(name);
    };

    const validateStep = (step) => {
        let isValid = true;
        if (step === 1) {
            isValid = validateForm({
                name: formData.name,
                employeeId: formData.employeeId
            }, ['name', 'employeeId']);
        }
        // Minimal validation for Step 2 and 3 can be added here if needed
        return isValid;
    };

    const nextStep = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
        }
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(3)) return; // Final verification

        setIsSaving(true);
        try {
            // Adjust dates for Firestore (ensure 12:00:00Z to avoid timezone shifts)
            const finalData = { ...formData };
            if (finalData.startDate) finalData.startDate += 'T12:00:00Z';
            if (finalData.contractEndDate) finalData.contractEndDate += 'T12:00:00Z';

            const result = await createEmployee(finalData);

            if (result.success) {
                showToast('Empleado/Candidato creado exitosamente', 'success');
                router.push('/employees'); // Navigate back to the table
            } else {
                showToast(result.error || 'Error al crear el perfil', 'error');
            }
        } catch (error) {
            console.error('Error creating employee:', error);
            showToast('Ocurrió un error inesperado', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) return null; // Or a loader

    const StepIcon = STEPS[currentStep - 1].icon;

    return (
        <AdminLayout title="Alta de Empleado">
            <div className={styles.container}>
                <BackButton onClick={() => router.push('/employees')} />

                <div className={styles.header}>
                    <h1 className={styles.title}>Nuevo Perfil</h1>
                    <p className={styles.subtitle}>Completa los datos en pasos para dar de alta un nuevo empleado o candidato.</p>
                </div>

                <div className={styles.stepper}>
                    <div
                        className={styles.stepperProgress}
                        style={{ width: `${50 * (currentStep - 1)}%` }}
                    />
                    {STEPS.map((step) => (
                        <div
                            key={step.id}
                            className={`${styles.step} ${currentStep === step.id ? styles.active : ''} ${currentStep > step.id ? styles.completed : ''}`}
                        >
                            <div className={styles.stepIcon}>
                                {step.id}
                            </div>
                            <span className={styles.stepLabel}>{step.title}</span>
                        </div>
                    ))}
                </div>

                <div className={styles.formContainer}>
                    <div className={styles.sectionTitle}>
                        <StepIcon size={24} />
                        <h2>{STEPS[currentStep - 1].title}</h2>
                    </div>

                    {currentStep === 1 && (
                        <div className={styles.formGrid}>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label htmlFor="name" className={styles.label}>
                                    Nombre Completo <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`${styles.input} ${(formErrors && formErrors.name) ? styles.inputError : ''}`}
                                    placeholder="Ej: Juan Pérez"
                                />
                                {(formErrors && formErrors.name) && <span className={styles.errorText}>{(formErrors && formErrors.name)}</span>}
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="employeeId" className={styles.label}>
                                    ID Empleado / Clave <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    id="employeeId"
                                    name="employeeId"
                                    value={formData.employeeId}
                                    onChange={handleInputChange}
                                    className={`${styles.input} ${(formErrors && formErrors.employeeId) ? styles.inputError : ''}`}
                                    placeholder="Ej: EMP-001"
                                />
                                {(formErrors && formErrors.employeeId) && <span className={styles.errorText}>{(formErrors && formErrors.employeeId)}</span>}
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="curp" className={styles.label}>CURP</label>
                                <input
                                    type="text"
                                    id="curp"
                                    name="curp"
                                    value={formData.curp}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="Ej: JUPE800101HDFR00"
                                    maxLength={18}
                                />
                            </div>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label htmlFor="phone" className={styles.label}>Teléfono (WhatsApp)</label>
                                <div className={styles.phoneContainer}>
                                    <Phone size={18} className={styles.phoneIcon} />
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={styles.input}
                                        placeholder="+52 442 123 4567"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className={styles.formGrid}>
                            <Select
                                label="Departamento"
                                value={formData.department}
                                onChange={(val) => handleInputChange({ target: { name: 'department', value: val } })}
                                placeholder="Seleccionar..."
                                options={(departments || []).map(d => ({ value: d, label: d }))}
                            />
                            <Select
                                label="Área"
                                value={formData.area}
                                onChange={(val) => handleInputChange({ target: { name: 'area', value: val } })}
                                placeholder="Seleccionar..."
                                options={(areas || []).map(a => ({ value: a, label: a }))}
                            />
                            <Select
                                label="Puesto"
                                value={formData.position}
                                onChange={(val) => handleInputChange({ target: { name: 'position', value: val } })}
                                placeholder="Seleccionar..."
                                options={(positions || []).map(p => ({ value: p, label: p }))}
                            />
                            <Select
                                label="Turno"
                                value={formData.shift}
                                onChange={(val) => handleInputChange({ target: { name: 'shift', value: val } })}
                                placeholder="Seleccionar..."
                                options={[
                                    { value: '1', label: '1' },
                                    { value: '2', label: '2' },
                                    { value: '3', label: '3' },
                                    { value: '4', label: '4' },
                                    { value: 'Mixto', label: 'Mixto' },
                                ]}
                            />
                            <div className={styles.formGroup}>
                                <label htmlFor="startDate" className={styles.label}>Fecha Inicio</label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="contractEndDate" className={styles.label}>
                                    Fin Contrato
                                    {formData.startDate && formData.contractEndDate && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginLeft: '8px', fontWeight: 400 }}>
                                            (auto-calculado)
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="date"
                                    id="contractEndDate"
                                    name="contractEndDate"
                                    value={formData.contractEndDate}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                />
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className={styles.formGrid}>
                            <Select
                                label="Estado Actual"
                                value={formData.status}
                                onChange={(val) => handleInputChange({ target: { name: 'status', value: val } })}
                                options={[
                                    { value: 'Activo', label: 'Activo' },
                                    { value: 'Inactivo', label: 'Inactivo' },
                                ]}
                            />
                            <div className={styles.formGroup}>
                                <label htmlFor="accessCode" className={styles.label}>Código PIN Accesos (Opcional)</label>
                                <input
                                    type="text"
                                    id="accessCode"
                                    name="accessCode"
                                    value={formData.accessCode}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="Ej: 1234"
                                />
                            </div>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.checkboxContainer}>
                                    <input
                                        type="checkbox"
                                        name="isCandidato"
                                        checked={formData.isCandidato}
                                        onChange={handleInputChange}
                                        className={styles.checkbox}
                                    />
                                    <span className={styles.label}>Este perfil es un candidato (aún no contratado formalmente)</span>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.btnBack}
                            onClick={prevStep}
                            style={{ visibility: currentStep === 1 ? 'hidden' : 'visible' }}
                        >
                            <ArrowLeft size={18} /> Atrás
                        </button>

                        {currentStep < STEPS.length ? (
                            <button
                                type="button"
                                className={styles.btnNext}
                                onClick={nextStep}
                            >
                                Siguiente <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="button"
                                className={styles.btnNext}
                                onClick={handleSubmit}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Guardando...' : 'Guardar Empleado'}
                                {!isSaving && <Save size={18} />}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
