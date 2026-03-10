'use client';

import { useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import {
    User, Briefcase, KeyRound, ChevronRight,
    ChevronLeft, Copy, Check, RefreshCw, UserPlus,
    CheckCircle2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './page.module.css';

// ─── Constantes ──────────────────────────────────────────────────────────────

const AREAS = ['ALMACEN', 'CALIDAD', 'MOLDES', 'MANTENIMIENTO', 'PRODUCCIÓN', 'RH', 'SISTEMAS', 'PROYECTOS'];
const TURNOS = ['1', '2', '3', '4', 'Mixto'];

const STEPS = [
    { id: 1, label: 'Datos Personales', icon: User },
    { id: 2, label: 'Datos Laborales',  icon: Briefcase },
    { id: 3, label: 'Código de Acceso', icon: KeyRound },
];

const SLIDE = {
    enter:  { opacity: 0, x: 24 },
    center: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
    exit:   { opacity: 0, x: -24, transition: { duration: 0.18 } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function RegistroEmpleadosPage() {
    const [step, setStep]       = useState(1);
    const [direction, setDirection] = useState(1); // 1=adelante, -1=atrás
    const [copied, setCopied]   = useState(false);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
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

    // ── Manejadores de campo ────────────────────────────────────────────────

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
            // Fallback para entornos sin clipboard API
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

    // ── Validación por paso ─────────────────────────────────────────────────

    const validateStep = useCallback((currentStep) => {
        if (currentStep === 1) {
            if (!formData.name.trim())       return 'El nombre completo es requerido.';
            if (!formData.employeeId.trim()) return 'El ID de empleado es requerido.';
            if (formData.employeeId.length < 3) return 'El ID debe tener al menos 3 caracteres.';
        }
        if (currentStep === 2) {
            if (!formData.area.trim())     return 'Selecciona un área.';
            if (!formData.position.trim()) return 'El puesto es requerido.';
        }
        if (currentStep === 3) {
            if (!formData.accessCode) return 'Genera o escribe un código de acceso.';
            if (formData.accessCode.length < 6) return 'El código debe tener al menos 6 caracteres.';
        }
        return null;
    }, [formData]);

    // ── Navegación entre pasos ──────────────────────────────────────────────

    const goNext = useCallback(() => {
        const validationError = validateStep(step);
        if (validationError) { setError(validationError); return; }
        setError('');
        setDirection(1);
        setStep(s => s + 1);
    }, [step, validateStep]);

    const goBack = useCallback(() => {
        setError('');
        setDirection(-1);
        setStep(s => s - 1);
    }, []);

    // ── Submit ──────────────────────────────────────────────────────────────

    const handleSubmit = useCallback(async () => {
        const validationError = validateStep(3);
        if (validationError) { setError(validationError); return; }

        setLoading(true);
        setError('');

        try {
            // Verificar duplicados
            const ref = collection(db, 'employees_programacion');
            const q   = query(ref, where('employeeId', '==', formData.employeeId));
            const snap = await getDocs(q);

            if (!snap.empty) {
                setError('El ID de empleado ya existe en el sistema.');
                setLoading(false);
                return;
            }

            // Guardar
            await addDoc(ref, {
                ...formData,
                role:        'employee',
                createdAt:   Timestamp.now(),
                active:      true,
                programacion: [],
            });

            setSavedEmployee({ ...formData });
            setSuccess(true);
        } catch (err) {
            console.error('Error en registro:', err);
            const msg = err.code === 'permission-denied'
                ? 'Sin permisos para registrar empleados.'
                : err.code === 'unavailable'
                    ? 'Sin conexión a la base de datos.'
                    : 'Error al registrar. Intenta de nuevo.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [formData, validateStep]);

    // ── Reiniciar ───────────────────────────────────────────────────────────

    const handleReset = useCallback(() => {
        setFormData({ name: '', employeeId: '', position: '', area: '', department: '', shift: '', accessCode: '' });
        setStep(1);
        setDirection(1);
        setSuccess(false);
        setError('');
        setCopied(false);
        setSavedEmployee(null);
    }, []);

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <AdminLayout title="Registro de Personal">
            <main className={styles.main}>

                {/* Encabezado de página */}
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>Registro de Personal</h1>
                    <p className={styles.pageSubtitle}>Alta de empleados para la plataforma de capacitación.</p>
                </div>

                <div className={styles.card}>

                    {/* ── Stepper ──────────────────────────────────────── */}
                    {!success && (
                        <div className={styles.stepper}>
                            {STEPS.map((s, idx) => {
                                const isCompleted = step > s.id;
                                const isActive    = step === s.id;
                                const Icon = s.icon;
                                return (
                                    <div key={s.id} className={styles.stepItem}>
                                        <div className={`${styles.stepCircle} ${isActive ? styles.stepActive : ''} ${isCompleted ? styles.stepDone : ''}`}>
                                            {isCompleted
                                                ? <Check size={14} strokeWidth={2.5} />
                                                : <Icon size={16} />
                                            }
                                        </div>
                                        <span className={`${styles.stepLabel} ${isActive ? styles.stepLabelActive : ''}`}>
                                            {s.label}
                                        </span>
                                        {idx < STEPS.length - 1 && (
                                            <div className={`${styles.stepLine} ${isCompleted ? styles.stepLineDone : ''}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── Pantalla de éxito ─────────────────────────────── */}
                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                key="success"
                                className={styles.successCard}
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            >
                                <div className={styles.successIcon}><CheckCircle2 size={48} /></div>
                                <h2 className={styles.successTitle}>¡Empleado registrado!</h2>
                                <p className={styles.successSubtitle}>
                                    El acceso al portal ha sido creado correctamente.
                                </p>
                                <div className={styles.successInfo}>
                                    <div className={styles.successRow}>
                                        <span className={styles.successLabel}>Nombre</span>
                                        <span className={styles.successValue}>{savedEmployee?.name}</span>
                                    </div>
                                    <div className={styles.successRow}>
                                        <span className={styles.successLabel}>ID</span>
                                        <span className={styles.successValue}>{savedEmployee?.employeeId}</span>
                                    </div>
                                    <div className={styles.successRow}>
                                        <span className={styles.successLabel}>Área</span>
                                        <span className={styles.successValue}>{savedEmployee?.area}</span>
                                    </div>
                                    <div className={styles.successRow}>
                                        <span className={styles.successLabel}>Código de acceso</span>
                                        <span className={`${styles.successValue} ${styles.successCode}`}>
                                            {savedEmployee?.accessCode}
                                        </span>
                                    </div>
                                </div>
                                <button className={styles.resetBtn} onClick={handleReset}>
                                    <UserPlus size={16} />
                                    Registrar otro empleado
                                </button>
                            </motion.div>
                        ) : (

                            /* ── Formulario wizard ──────────────────────── */
                            <AnimatePresence mode="wait" initial={false} custom={direction}>
                                <motion.div
                                    key={step}
                                    custom={direction}
                                    variants={{
                                        enter:  (d) => ({ opacity: 0, x: d > 0 ? 24 : -24 }),
                                        center: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
                                        exit:   (d) => ({ opacity: 0, x: d > 0 ? -24 : 24, transition: { duration: 0.18 } }),
                                    }}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    className={styles.stepContent}
                                >
                                    {/* ── Paso 1 ── */}
                                    {step === 1 && (
                                        <div className={styles.fields}>
                                            <h2 className={styles.stepTitle}>¿Quién es el empleado?</h2>
                                            <p className={styles.stepDesc}>Datos de identificación personal.</p>

                                            <div className={styles.field}>
                                                <label className={styles.label}>Nombre completo <span className={styles.req}>*</span></label>
                                                <input
                                                    className={styles.input}
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="Ej. Juan Pérez García"
                                                    autoFocus
                                                />
                                            </div>

                                            <div className={styles.field}>
                                                <label className={styles.label}>ID de empleado <span className={styles.req}>*</span></label>
                                                <input
                                                    className={styles.input}
                                                    type="text"
                                                    name="employeeId"
                                                    value={formData.employeeId}
                                                    onChange={handleChange}
                                                    placeholder="Ej. EMP001"
                                                />
                                                <span className={styles.hint}>Se convertirá a mayúsculas automáticamente.</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Paso 2 ── */}
                                    {step === 2 && (
                                        <div className={styles.fields}>
                                            <h2 className={styles.stepTitle}>Información laboral</h2>
                                            <p className={styles.stepDesc}>Área, puesto y turno de trabajo.</p>

                                            <div className={styles.rowTwo}>
                                                <div className={styles.field}>
                                                    <label className={styles.label}>Área <span className={styles.req}>*</span></label>
                                                    <select className={styles.select} name="area" value={formData.area} onChange={handleChange}>
                                                        <option value="">Seleccionar...</option>
                                                        {AREAS.map(a => (
                                                            <option key={a} value={a}>{a.charAt(0) + a.slice(1).toLowerCase()}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className={styles.field}>
                                                    <label className={styles.label}>Puesto <span className={styles.req}>*</span></label>
                                                    <input
                                                        className={styles.input}
                                                        type="text"
                                                        name="position"
                                                        value={formData.position}
                                                        onChange={handleChange}
                                                        placeholder="Ej. Operador de Producción"
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.rowTwo}>
                                                <div className={styles.field}>
                                                    <label className={styles.label}>Departamento</label>
                                                    <input
                                                        className={styles.input}
                                                        type="text"
                                                        name="department"
                                                        value={formData.department}
                                                        onChange={handleChange}
                                                        placeholder="Ej. Línea 3"
                                                    />
                                                </div>

                                                <div className={styles.field}>
                                                    <label className={styles.label}>Turno</label>
                                                    <select className={styles.select} name="shift" value={formData.shift} onChange={handleChange}>
                                                        <option value="">Seleccionar...</option>
                                                        {TURNOS.map(t => (
                                                            <option key={t} value={t}>Turno {t}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Paso 3 ── */}
                                    {step === 3 && (
                                        <div className={styles.fields}>
                                            <h2 className={styles.stepTitle}>Código de acceso</h2>
                                            <p className={styles.stepDesc}>
                                                Este código es la contraseña del empleado para ingresar al portal.
                                            </p>

                                            {/* Display del código */}
                                            <div className={styles.codeBox}>
                                                <span className={styles.codeDisplay}>
                                                    {formData.accessCode || '——————'}
                                                </span>
                                                <div className={styles.codeActions}>
                                                    <button
                                                        type="button"
                                                        className={styles.generateBtn}
                                                        onClick={handleGenerateCode}
                                                    >
                                                        <RefreshCw size={15} />
                                                        Generar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                                                        onClick={handleCopy}
                                                        disabled={!formData.accessCode}
                                                    >
                                                        {copied
                                                            ? <><Check size={15} /> Copiado</>
                                                            : <><Copy size={15} /> Copiar</>
                                                        }
                                                    </button>
                                                </div>
                                            </div>

                                            <p className={styles.hint}>
                                                También puedes escribir un código personalizado directamente.
                                            </p>
                                            <input
                                                className={styles.input}
                                                type="text"
                                                name="accessCode"
                                                value={formData.accessCode}
                                                onChange={handleChange}
                                                placeholder="O escribe un código manualmente..."
                                                maxLength={20}
                                            />

                                            {/* Resumen del empleado */}
                                            <div className={styles.summary}>
                                                <p className={styles.summaryTitle}>Resumen del registro</p>
                                                <div className={styles.summaryRow}>
                                                    <span>Nombre</span><strong>{formData.name}</strong>
                                                </div>
                                                <div className={styles.summaryRow}>
                                                    <span>ID</span><strong>{formData.employeeId}</strong>
                                                </div>
                                                <div className={styles.summaryRow}>
                                                    <span>Área</span><strong>{formData.area}</strong>
                                                </div>
                                                <div className={styles.summaryRow}>
                                                    <span>Puesto</span><strong>{formData.position}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </AnimatePresence>

                    {/* ── Error ─────────────────────────────────────────── */}
                    {error && !success && (
                        <div className={styles.errorMsg}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* ── Navegación ──────────────────────────────────────── */}
                    {!success && (
                        <div className={styles.nav}>
                            <button
                                type="button"
                                className={styles.backBtn}
                                onClick={goBack}
                                disabled={step === 1}
                            >
                                <ChevronLeft size={18} />
                                Anterior
                            </button>

                            {step < 3 ? (
                                <button type="button" className={styles.nextBtn} onClick={goNext}>
                                    Siguiente
                                    <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className={styles.submitBtn}
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading
                                        ? <><span className={styles.spinner} /> Registrando...</>
                                        : <><UserPlus size={18} /> Registrar empleado</>
                                    }
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </AdminLayout>
    );
}
