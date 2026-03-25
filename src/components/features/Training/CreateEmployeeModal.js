'use client';

import { useState, useCallback, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import {
    User, Briefcase, KeyRound, ChevronRight,
    ChevronLeft, Copy, Check, RefreshCw, UserPlus,
    CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '@/components/ui/Select/Select';
import styles from './CreateEmployeeModal.module.css';

const AREAS = ['ALMACEN', 'CALIDAD', 'MOLDES', 'MANTENIMIENTO', 'PRODUCCION', 'RH', 'SISTEMAS', 'PROYECTOS'];
const TURNOS = ['1', '2', '3', '4', 'Mixto'];

const STEPS = [
    { id: 1, label: 'Personales', icon: User },
    { id: 2, label: 'Laborales',  icon: Briefcase },
    { id: 3, label: 'Acceso',      icon: KeyRound },
];

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Componente Modal para crear un nuevo empleado (Reemplaza la pagina /training/registro)
 * @param {boolean} isOpen - Estado de visibilidad
 * @param {function} onClose - Funcion para cerrar el modal
 * @param {function} onSuccess - Callback tras registro exitoso
 */
export default function CreateEmployeeModal({ isOpen, onClose, onSuccess }) {
    const [step, setStep]         = useState(1);
    const [direction, setDirection] = useState(1);
    const [copied, setCopied]     = useState(false);
    const [success, setSuccess]   = useState(false);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const [savedEmployee, setSavedEmployee] = useState(null);

    const [formData, setFormData] = useState({
        name:       '',
        employeeId: '',
        position:   '',
        area:       '',
        department: '',
        shift:      '',
        accessCode: '',
    });

    // Reset when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setSuccess(false);
            setError('');
            setFormData({ name: '', employeeId: '', position: '', area: '', department: '', shift: '', accessCode: '' });
        }
    }, [isOpen]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'employeeId' ? value.toUpperCase() : value,
        }));
        setError('');
    }, []);

    const handleGenerateCode = useCallback(() => {
        setFormData(prev => ({ ...prev, accessCode: generateCode() }));
        setCopied(false);
        setError('');
    }, []);

    const handleCopy = useCallback(async () => {
        if (!formData.accessCode) return;
        try {
            await navigator.clipboard.writeText(formData.accessCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            const el = document.createElement('textarea');
            el.value = formData.accessCode;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    }, [formData.accessCode]);

    const validateStep = useCallback((currentStep) => {
        if (currentStep === 1) {
            if (!formData.name.trim())       return 'El nombre completo es requerido.';
            if (!formData.employeeId.trim()) return 'El ID de empleado es requerido.';
            if (formData.employeeId.length < 3) return 'El ID debe tener al menos 3 caracteres.';
        }
        if (currentStep === 2) {
            if (!formData.area.trim())     return 'Selecciona un area.';
            if (!formData.position.trim()) return 'El puesto es requerido.';
        }
        if (currentStep === 3) {
            if (!formData.accessCode) return 'Genera o escribe un codigo de acceso.';
            if (formData.accessCode.length < 6) return 'El codigo debe tener al menos 6 caracteres.';
        }
        return null;
    }, [formData]);

    const goNext = useCallback(() => {
        const err = validateStep(step);
        if (err) { setError(err); return; }
        setError('');
        setDirection(1);
        setStep(s => s + 1);
    }, [step, validateStep]);

    const goBack = useCallback(() => {
        setError('');
        setDirection(-1);
        setStep(s => s - 1);
    }, []);

    const handleSubmit = useCallback(async () => {
        const err = validateStep(3);
        if (err) { setError(err); return; }

        setLoading(true);
        setError('');

        try {
            const ref  = collection(db, 'employees_programacion');
            const q    = query(ref, where('employeeId', '==', formData.employeeId));
            const snap = await getDocs(q);

            if (!snap.empty) {
                setError('El ID de empleado ya existe en el sistema.');
                setLoading(false);
                return;
            }

            await addDoc(ref, {
                ...formData,
                role:        'employee',
                createdAt:   Timestamp.now(),
                active:      true,
                programacion: [],
            });

            setSavedEmployee({ ...formData });
            setSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError('Error al registrar. Intenta de nuevo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [formData, validateStep, onSuccess]);

    const progress = ((step - 1) / (STEPS.length - 1)) * 100;

    if (!isOpen) return null;

    return (
        <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <motion.div 
                className={styles.modal}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
                <header className={styles.header}>
                    <h2 className={styles.headerTitle}>
                        <UserPlus size={20} className={styles.headerIcon} />
                        Registrar Empleado
                    </h2>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
                        <X size={20} />
                    </button>
                </header>

                <div className={styles.content}>
                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                key="success"
                                className={styles.successPane}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className={styles.successIconWrap}>
                                    <CheckCircle2 size={36} />
                                </div>
                                <h3 className={styles.successTitle}>¡Empleado listo!</h3>
                                <p className={styles.successSub}>Se ha registrado correctamente en el sistema.</p>

                                <div className={styles.summary}>
                                    <div className={styles.summaryGrid}>
                                        <div className={styles.summaryRow}>
                                            <span className={styles.summaryLabel}>Nombre</span>
                                            <span className={styles.summaryValue}>{savedEmployee?.name}</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span className={styles.summaryLabel}>ID</span>
                                            <span className={styles.summaryValue}>{savedEmployee?.employeeId}</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span className={styles.summaryLabel}>Area</span>
                                            <span className={styles.summaryValue}>{savedEmployee?.area}</span>
                                        </div>
                                        <div className={styles.summaryRow}>
                                            <span className={styles.summaryLabel}>Codigo</span>
                                            <span className={styles.summaryValue} style={{ color: '#003ccc', fontWeight: 800 }}>
                                                {savedEmployee?.accessCode}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button className={styles.btnPrimary} onClick={onClose}>
                                    Finalizar
                                </button>
                            </motion.div>
                        ) : (
                            <div className={styles.wizardPane}>
                                <div className={styles.stepper}>
                                    {STEPS.map((s, idx) => {
                                        const done   = step > s.id;
                                        const active = step === s.id;
                                        const Icon   = s.icon;
                                        return (
                                            <div key={s.id} className={styles.stepItem}>
                                                <div className={`${styles.stepCircle} ${active ? styles.stepActive : ''} ${done ? styles.stepDone : ''}`}>
                                                    {done ? <Check size={14} /> : <Icon size={14} />}
                                                </div>
                                                <span className={`${styles.stepLabel} ${active ? styles.stepLabelActive : ''}`}>
                                                    {s.label}
                                                </span>
                                                {idx < STEPS.length - 1 && (
                                                    <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ''}`} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className={styles.progressTrack}>
                                    <motion.div
                                        className={styles.progressFill}
                                        animate={{ width: `${progress}%` }}
                                    />
                                </div>

                                <div className={styles.stepBody}>
                                    <AnimatePresence mode="wait" initial={false} custom={direction}>
                                        <motion.div
                                            key={step}
                                            custom={direction}
                                            variants={{
                                                enter:  (d) => ({ opacity: 0, x: d > 0 ? 20 : -20 }),
                                                center: { opacity: 1, x: 0 },
                                                exit:   (d) => ({ opacity: 0, x: d > 0 ? -20 : 20 }),
                                            }}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            className={styles.stepContent}
                                        >
                                            {step === 1 && (
                                                <div className={styles.fields}>
                                                    <div className={styles.stepHeading}>
                                                        <h3 className={styles.title}>Datos Personales</h3>
                                                        <p className={styles.desc}>Identificacion oficial en el sistema.</p>
                                                    </div>
                                                    <div className={styles.fieldGroup}>
                                                        <label className={styles.label}>Nombre Completo <span className={styles.req}>*</span></label>
                                                        <input 
                                                            className={styles.input} 
                                                            name="name" 
                                                            value={formData.name} 
                                                            onChange={handleChange} 
                                                            placeholder="Ej. Juan Perez" 
                                                            autoFocus 
                                                        />
                                                    </div>
                                                    <div className={styles.fieldGroup}>
                                                        <label className={styles.label}>ID de Empleado <span className={styles.req}>*</span></label>
                                                        <input 
                                                            className={styles.input} 
                                                            name="employeeId" 
                                                            value={formData.employeeId} 
                                                            onChange={handleChange} 
                                                            placeholder="Ej. VT0123" 
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {step === 2 && (
                                                <div className={styles.fields}>
                                                    <div className={styles.stepHeading}>
                                                        <h3 className={styles.title}>Datos Laborales</h3>
                                                        <p className={styles.desc}>Ubicacion y puesto dentro de la planta.</p>
                                                    </div>
                                                    <div className={styles.grid2}>
                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.label}>Area <span className={styles.req}>*</span></label>
                                                            <Select 
                                                                value={formData.area} 
                                                                onChange={(v) => setFormData(p => ({...p, area: v}))}
                                                                options={AREAS.map(a => ({ value: a, label: a }))}
                                                                placeholder="Seleccionar..."
                                                            />
                                                        </div>
                                                        <div className={styles.fieldGroup}>
                                                            <label className={styles.label}>Puesto <span className={styles.req}>*</span></label>
                                                            <input 
                                                                className={styles.input} 
                                                                name="position" 
                                                                value={formData.position} 
                                                                onChange={handleChange} 
                                                                placeholder="Ej. Operador" 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {step === 3 && (
                                                <div className={styles.fields}>
                                                    <div className={styles.stepHeading}>
                                                        <h3 className={styles.title}>Código de Acceso</h3>
                                                        <p className={styles.desc}>Este sera su NIP para ingresar al portal.</p>
                                                    </div>
                                                    <div className={styles.codeBox}>
                                                        <span className={styles.codeDisplay}>
                                                            {formData.accessCode || <span className={styles.codePlaceholder}>000000</span>}
                                                        </span>
                                                        <div className={styles.codeActions}>
                                                            <button className={styles.btnSecondary} onClick={handleGenerateCode}>
                                                                <RefreshCw size={14} />
                                                            </button>
                                                            <button 
                                                                className={`${styles.btnSecondary} ${copied ? styles.btnCopied : ''}`} 
                                                                onClick={handleCopy}
                                                                disabled={!formData.accessCode}
                                                            >
                                                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <input 
                                                        className={styles.input} 
                                                        name="accessCode" 
                                                        value={formData.accessCode} 
                                                        onChange={handleChange} 
                                                        placeholder="O escribe uno aqui..." 
                                                    />
                                                </div>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {error && (
                                    <div className={styles.errorMsg}>
                                        <AlertCircle size={14} />
                                        {error}
                                    </div>
                                )}

                                <footer className={styles.footer}>
                                    <button className={styles.btnGhost} onClick={goBack} disabled={step === 1}>
                                        <ChevronLeft size={16} /> Anterior
                                    </button>
                                    {step < 3 ? (
                                        <button className={styles.btnPrimary} onClick={goNext}>
                                            Siguiente <ChevronRight size={16} />
                                        </button>
                                    ) : (
                                        <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                                            {loading ? <span className={styles.spin} /> : <><UserPlus size={16} /> Registrar</>}
                                        </button>
                                    )}
                                </footer>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
