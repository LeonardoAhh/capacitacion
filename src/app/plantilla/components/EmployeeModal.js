'use client';

import { useState } from 'react';
import { X, Save, Paperclip } from 'lucide-react';
import { Select } from '@/components/ui/Select/Select';
import styles from './EmployeeModal.module.css';

// ── Catálogos ────────────────────────────────────────────────────────────────
const AREA_OPTIONS = [
    'A. CALIDAD 1ER TURNO', 'A. CALIDAD 2DO TURNO', 'ALMACÉN', 'CALIDAD ADMTVO',
    'GERENCIA', 'LOGÍSTICA', 'MANTENIMIENTO', 'METROLOGÍA', 'MOLDES',
    'PRODUCCIÓN 1ER TURNO', 'PRODUCCIÓN 2DO TURNO', 'PRODUCCIÓN 3ER TURNO',
    'PRODUCCIÓN 4TO TURNO', 'PRODUCCIÓN ADMTVO', 'PRODUCCIÓN MONTAJE',
    'PROYECTOS', 'RECURSOS HUMANOS', 'RESIDENTES DE CALIDAD', 'SGI', 'SISTEMAS',
].map(v => ({ value: v, label: v }));

const SHIFT_OPTIONS = ['1', '2', '3', '4', '5'].map(v => ({ value: v, label: v }));

const EDUCATION_OPTIONS = [
    'BACHILLERATO', 'CARRERA TECNICA', 'INGENIERIA', 'LICENCIATURA', 'MAESTRIA',
    'PASANTE INGENIERIA', 'POSGRADO', 'PREPARATORIA', 'PRIMARIA', 'SECUNDARIA', 'TSU',
].map(v => ({ value: v, label: v }));

const EMPTY_FORM = {
    id: '', name: '', position: '', department: '', curp: '',
    occupation: '', area: '', education: '', startDate: '', shift: '',
    performanceScore: '', performancePeriod: '', positionStartDate: '',
};

// ── Componente ───────────────────────────────────────────────────────────────
export function EmployeeModal({ initial, isCreating, onClose, onSave, positions, departments }) {
    const [form, setForm] = useState(() => {
        if (isCreating) return { ...EMPTY_FORM };
        return {
            id:                  initial?.id                                || '',
            name:                initial?.name                              || '',
            position:            initial?.position                          || '',
            department:          initial?.department                        || '',
            curp:                initial?.curp                              || '',
            occupation:          initial?.occupation                        || '',
            area:                initial?.area                              || '',
            education:           initial?.education                         || '',
            startDate:           initial?.startDate                         || '',
            shift:               initial?.shift                             || '',
            performanceScore:    initial?.promotionData?.performanceScore   || '',
            performancePeriod:   initial?.promotionData?.performancePeriod  || '',
            positionStartDate:   initial?.promotionData?.positionStartDate  || '',
        };
    });

    const [step, setStep]         = useState(1);
    const [saving, setSaving]     = useState(false);
    const [docFiles, setDocFiles] = useState([]);

    const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

    const handleDocChange = (e) => {
        if (e.target.files?.length > 0)
            setDocFiles(prev => [...prev, ...Array.from(e.target.files)]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step === 1) { setStep(2); return; }
        setSaving(true);
        await onSave({ form, docFiles });
        setSaving(false);
    };

    const handleOverlayClick = (e) => { if (e.target === e.currentTarget) onClose(); };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true">
            <div className={styles.modal}>

                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        {isCreating ? 'Nuevo Empleado' : 'Editar Empleado'}
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose} type="button" aria-label="Cerrar">
                        <X size={14} />
                    </button>
                </div>

                {/* Stepper */}
                <div className={styles.stepper}>
                    <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ''}`}>
                        <span className={styles.stepNum}>1</span>
                        <span className={styles.stepLabel}>Datos Personales</span>
                    </div>
                    <div className={styles.stepLine} />
                    <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ''}`}>
                        <span className={styles.stepNum}>2</span>
                        <span className={styles.stepLabel}>Datos Laborales</span>
                    </div>
                </div>

                {/* Form — flex column, footer sticky abajo */}
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.body}>

                        {/* ── Paso 1: Datos Personales ── */}
                        {step === 1 && (
                            <>
                                <div className={styles.formGrid}>
                                    <div className={`${styles.fieldGroup} ${styles.fieldFull}`}>
                                        <label className={styles.fieldLabel}>Nombre Completo *</label>
                                        <input
                                            required
                                            type="text"
                                            className={styles.fieldInput}
                                            value={form.name}
                                            onChange={e => set('name', e.target.value)}
                                            placeholder="Ej. HERNÁNDEZ HERRERA LEONARDO"
                                        />
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>ID Empleado</label>
                                        <input
                                            type="text"
                                            className={styles.fieldInput}
                                            value={form.id}
                                            onChange={e => isCreating && set('id', e.target.value)}
                                            placeholder={isCreating ? 'Ej. 3204' : ''}
                                            disabled={!isCreating}
                                        />
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>CURP</label>
                                        <input
                                            type="text"
                                            className={styles.fieldInput}
                                            value={form.curp}
                                            onChange={e => set('curp', e.target.value)}
                                            placeholder="Importante para DC-3"
                                            maxLength={18}
                                        />
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Escolaridad</label>
                                        <Select
                                            value={form.education}
                                            onChange={v => set('education', v)}
                                            options={EDUCATION_OPTIONS}
                                            placeholder="-- Seleccionar --"
                                        />
                                    </div>

                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Fecha de Ingreso</label>
                                        <input
                                            type="date"
                                            className={styles.fieldInput}
                                            value={form.startDate}
                                            onChange={e => set('startDate', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Documentos */}
                                <div className={styles.docsSection}>
                                    <div className={styles.docsSectionHeader}>
                                        <h4 className={styles.docsSectionTitle}>Documentos adjuntos</h4>
                                        <label htmlFor="doc-upload" className={styles.docUploadLabel}>
                                            <Paperclip size={12} /> Adjuntar
                                        </label>
                                        <input
                                            id="doc-upload"
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.jpg,.png"
                                            onChange={handleDocChange}
                                            style={{ display: 'none' }}
                                        />
                                    </div>

                                    {initial?.documents?.map((doc, i) => (
                                        <div key={i} className={styles.docItem}>
                                            <span className={styles.docItemName}>📄 {doc.name}</span>
                                            <button type="button" className={styles.docRemoveBtn}>✕</button>
                                        </div>
                                    ))}

                                    {docFiles.map((file, i) => (
                                        <div key={i} className={`${styles.docItem} ${styles.docItemNew}`}>
                                            <span className={`${styles.docItemName} ${styles.docItemNameNew}`}>
                                                {file.name}
                                            </span>
                                            <button
                                                type="button"
                                                className={styles.docRemoveBtn}
                                                onClick={() => setDocFiles(prev => prev.filter((_, j) => j !== i))}
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* ── Paso 2: Datos Laborales ── */}
                        {step === 2 && (
                            <div className={styles.formGrid}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Puesto</label>
                                    <Select
                                        value={form.position}
                                        onChange={v => set('position', v)}
                                        options={positions.map(p => ({ value: p, label: p }))}
                                        placeholder="-- Seleccionar --"
                                        searchable
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Departamento</label>
                                    <Select
                                        value={form.department}
                                        onChange={v => set('department', v)}
                                        options={departments.map(d => ({ value: d, label: d }))}
                                        placeholder="-- Seleccionar --"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Área</label>
                                    <Select
                                        value={form.area}
                                        onChange={v => set('area', v)}
                                        options={AREA_OPTIONS}
                                        placeholder="-- Seleccionar --"
                                        searchable
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Turno</label>
                                    <Select
                                        value={form.shift}
                                        onChange={v => set('shift', v)}
                                        options={SHIFT_OPTIONS}
                                        placeholder="-- Seleccionar --"
                                    />
                                </div>

                                <div className={`${styles.fieldGroup} ${styles.fieldFull}`}>
                                    <label className={styles.fieldLabel}>Ocupación (SSO)</label>
                                    <input
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.occupation}
                                        onChange={e => set('occupation', e.target.value)}
                                        placeholder="Ej. OPERARIO DE PRODUCCIÓN"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Calificación de Desempeño</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="10"
                                        className={styles.fieldInput}
                                        value={form.performanceScore}
                                        onChange={e => set('performanceScore', e.target.value)}
                                        placeholder="0 – 10"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Periodo de Desempeño</label>
                                    <input
                                        type="text"
                                        className={styles.fieldInput}
                                        value={form.performancePeriod}
                                        onChange={e => set('performancePeriod', e.target.value)}
                                        placeholder="Ej. Q1 2025"
                                    />
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Inicio en Puesto Actual</label>
                                    <input
                                        type="date"
                                        className={styles.fieldInput}
                                        value={form.positionStartDate}
                                        onChange={e => set('positionStartDate', e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer — siempre visible, fuera del scroll */}
                    <div className={styles.footer}>
                        {step === 1 ? (
                            <>
                                <button type="button" onClick={onClose} className={styles.btnCancel}>
                                    Cancelar
                                </button>
                                <button type="submit" className={styles.btnSave}>
                                    Siguiente →
                                </button>
                            </>
                        ) : (
                            <>
                                <button type="button" onClick={() => setStep(1)} className={styles.btnCancel}>
                                    ← Atrás
                                </button>
                                <button type="submit" disabled={saving} className={styles.btnSave}>
                                    <Save size={13} />
                                    {saving ? 'Guardando…' : 'Guardar'}
                                </button>
                            </>
                        )}
                    </div>
                </form>

            </div>
        </div>
    );
}
