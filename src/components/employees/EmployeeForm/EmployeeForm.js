import { useState, useEffect } from 'react';
import { Combobox } from '@/components/ui/Combobox/Combobox';
import styles from './EmployeeForm.module.css';
import { useEmployeeDates } from '@/hooks/useEmployeeDates';
import { useToast } from '@/components/ui/Toast/Toast';

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
    // Hooks
    const { calculateDates, calculateTrainingPlanDate, formatDate } = useEmployeeDates();

    // Estado local del formulario
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

    // Cargar datos si estamos editando
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
                trainingPlanDelivered: employee.trainingPlanDelivered || false
            });
        }
    }, [employee]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Calcular fechas antes de enviar
        const dates = calculateDates(formData.startDate);

        onSubmit({
            ...formData,
            ...dates
        });
    };

    const getEvalStatus = (score) => {
        if (score === '' || score === null || score === undefined) return 'pending';
        const numScore = parseFloat(score);
        return numScore >= 80 ? 'approved' : 'failed';
    };

    return (
        <div className={`${styles.formCard} fade-in`}>
            <h2>{title}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="employeeId" className="label">ID de Empleado</label>
                        <input
                            id="employeeId"
                            type="text"
                            className="input-field"
                            placeholder=""
                            value={formData.employeeId}
                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="name" className="label">Nombre Completo</label>
                        <input
                            id="name"
                            type="text"
                            className="input-field"
                            placeholder=""
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                            spellCheck="true"
                            autoComplete="off"
                            style={{ textTransform: 'uppercase' }}
                            required
                        />
                    </div>

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
                            area: '' // Reset area when department changes
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
                        <label htmlFor="shift" className="label">Turno</label>
                        <select
                            id="shift"
                            className="input-field"
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
                        <label htmlFor="startDate" className="label">Fecha de Inicio</label>
                        <input
                            id="startDate"
                            type="date"
                            className="input-field"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            required
                        />
                    </div>
                </div>

                {formData.startDate && (
                    <div className={styles.calculatedDates}>
                        <h3 className={styles.sectionTitle}>Fechas Importantes</h3>
                        <div className={styles.datesGrid}>
                            <div className={styles.dateInfo}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <div>
                                    <strong>Fin de Contrato:</strong> {calculateDates(formData.startDate) ? formatDate(calculateDates(formData.startDate).contractEndDate) : '-'}
                                </div>
                            </div>
                        </div>

                        <h3 className={styles.sectionTitle} style={{ marginTop: 'var(--spacing-lg)' }}>Evaluaciones de Desempeño</h3>
                        <div className={styles.evalsGrid}>
                            <div className={`${styles.evalCard} ${getEvalStatus(formData.eval1Score) === 'approved' ? styles.evalApproved : getEvalStatus(formData.eval1Score) === 'failed' ? styles.evalFailed : ''}`}>
                                <div className={styles.evalHeader}>
                                    <span className={styles.evalNumber}>1</span>
                                    <div>
                                        <strong>Evaluación 1</strong>
                                        <span className={styles.evalDate}>{calculateDates(formData.startDate) ? formatDate(calculateDates(formData.startDate).eval1Date) : '-'} (30 días)</span>
                                    </div>
                                </div>
                                <div className={styles.evalInput}>
                                    <label htmlFor="eval1Score">Calificación:</label>
                                    <input
                                        id="eval1Score"
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="input-field"
                                        placeholder="0-100"
                                        value={formData.eval1Score}
                                        onChange={(e) => setFormData({ ...formData, eval1Score: e.target.value })}
                                    />
                                    {formData.eval1Score && (
                                        <span className={`${styles.evalStatus} ${getEvalStatus(formData.eval1Score) === 'approved' ? styles.approved : styles.failed}`}>
                                            {getEvalStatus(formData.eval1Score) === 'approved' ? '✓ Aprobado' : '✗ Requiere seguimiento'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className={`${styles.evalCard} ${getEvalStatus(formData.eval2Score) === 'approved' ? styles.evalApproved : getEvalStatus(formData.eval2Score) === 'failed' ? styles.evalFailed : ''}`}>
                                <div className={styles.evalHeader}>
                                    <span className={styles.evalNumber}>2</span>
                                    <div>
                                        <strong>Evaluación 2</strong>
                                        <span className={styles.evalDate}>{calculateDates(formData.startDate) ? formatDate(calculateDates(formData.startDate).eval2Date) : '-'} (60 días)</span>
                                    </div>
                                </div>
                                <div className={styles.evalInput}>
                                    <label htmlFor="eval2Score">Calificación:</label>
                                    <input
                                        id="eval2Score"
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="input-field"
                                        placeholder="0-100"
                                        value={formData.eval2Score}
                                        onChange={(e) => setFormData({ ...formData, eval2Score: e.target.value })}
                                    />
                                    {formData.eval2Score && (
                                        <span className={`${styles.evalStatus} ${getEvalStatus(formData.eval2Score) === 'approved' ? styles.approved : styles.failed}`}>
                                            {getEvalStatus(formData.eval2Score) === 'approved' ? '✓ Aprobado' : '✗ Requiere seguimiento'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className={`${styles.evalCard} ${getEvalStatus(formData.eval3Score) === 'approved' ? styles.evalApproved : getEvalStatus(formData.eval3Score) === 'failed' ? styles.evalFailed : ''}`}>
                                <div className={styles.evalHeader}>
                                    <span className={styles.evalNumber}>3</span>
                                    <div>
                                        <strong>Evaluación 3</strong>
                                        <span className={styles.evalDate}>{calculateDates(formData.startDate) ? formatDate(calculateDates(formData.startDate).eval3Date) : '-'} (75 días)</span>
                                    </div>
                                </div>
                                <div className={styles.evalInput}>
                                    <label htmlFor="eval3Score">Calificación:</label>
                                    <input
                                        id="eval3Score"
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="input-field"
                                        placeholder="0-100"
                                        value={formData.eval3Score}
                                        onChange={(e) => setFormData({ ...formData, eval3Score: e.target.value })}
                                    />
                                    {formData.eval3Score && (
                                        <span className={`${styles.evalStatus} ${getEvalStatus(formData.eval3Score) === 'approved' ? styles.approved : styles.failed}`}>
                                            {getEvalStatus(formData.eval3Score) === 'approved' ? '✓ Aprobado' : '✗ Requiere seguimiento'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles.evalLegend}>
                            <span><strong>≥ 80:</strong> Aprobado</span>
                            <span><strong>&lt; 80:</strong> Reprobado - Requiere seguimiento</span>
                        </div>

                        {/* Plan de Formación */}
                        <h3 className={styles.sectionTitle} style={{ marginTop: 'var(--spacing-lg)' }}>Plan de Formación</h3>
                        <div className={styles.trainingPlanCard}>
                            <div className={styles.trainingPlanInfo}>
                                <div className={styles.trainingPlanIcon}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                </div>
                                <div className={styles.trainingPlanDetails}>
                                    <strong>Fecha de Entrega:</strong>
                                    {calculateTrainingPlanDate(formData.startDate, formData.department, formData.area) ? (
                                        <span className={styles.trainingDate}>
                                            {formatDate(calculateTrainingPlanDate(formData.startDate, formData.department, formData.area).date)}
                                            <span className={styles.trainingDays}>
                                            </span>
                                        </span>
                                    ) : (
                                        <span className={styles.trainingPending}>Ingresa fecha de inicio, departamento y área</span>
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
                )}

                <div className={styles.formActions}>
                    {onCancel && (
                        <button type="button" onClick={onCancel} className="btn btn-secondary">
                            Cancelar
                        </button>
                    )}
                    <button type="submit" className="btn btn-primary">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                        </svg>
                        {employee ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    );
}
