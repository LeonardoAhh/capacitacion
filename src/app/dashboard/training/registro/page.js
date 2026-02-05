'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import Navbar from '@/components/Navbar/Navbar';
import { UserPlus, Save, AlertCircle, CheckCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function RegistroEmpleadosPage() {
    const [formData, setFormData] = useState({
        name: '',
        employeeId: '',
        position: '',
        area: '',
        department: '',
        shift: '',
        accessCode: '' // Will act as password
    });

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'employeeId' ? value.toUpperCase() : value
        }));
    };

    const generateRandomCode = () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setFormData(prev => ({ ...prev, accessCode: code }));
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            return 'El nombre es requerido';
        }
        if (!formData.employeeId.trim()) {
            return 'El ID de empleado es requerido';
        }
        if (formData.employeeId.length < 3) {
            return 'El ID debe tener al menos 3 caracteres';
        }
        if (!formData.position.trim()) {
            return 'El puesto es requerido';
        }
        if (!formData.area.trim()) {
            return 'El área es requerida';
        }
        if (!formData.accessCode) {
            return 'El código de acceso es requerido';
        }
        if (formData.accessCode.length < 6) {
            return 'El código debe tener al menos 6 caracteres';
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        // Client-side validation
        const validationError = validateForm();
        if (validationError) {
            setStatus({ type: 'error', message: validationError });
            setLoading(false);
            return;
        }

        try {
            // 1. Validar duplicados
            const employeesRef = collection(db, 'employees_programacion');
            const q = query(employeesRef, where('employeeId', '==', formData.employeeId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setStatus({ type: 'error', message: 'ERROR: El ID de empleado ya existe en el sistema.' });
                setLoading(false);
                return;
            }

            // 2. Guardar
            await addDoc(employeesRef, {
                ...formData,
                role: 'employee', // Rol por defecto
                createdAt: Timestamp.now(),
                active: true,
                programacion: [] // Inicializar array de cursos
            });

            setStatus({ type: 'success', message: 'Empleado registrado exitosamente.' });
            setFormData({
                name: '',
                employeeId: '',
                position: '',
                area: '',
                department: '',
                shift: '',
                accessCode: ''
            });

        } catch (error) {
            console.error('Error en registro:', error);
            const errorMessage = error.code === 'permission-denied'
                ? 'Error de permisos: No tienes autorización para registrar empleados.'
                : error.code === 'unavailable'
                    ? 'Error de conexión: No se puede conectar a la base de datos.'
                    : 'Error al registrar empleado. Por favor, intenta de nuevo.';
            setStatus({ type: 'error', message: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Navbar />

            <main className={styles.main}>
                <div className={styles.headerWrapper}>
                    <Link href="/dashboard/programacion" className={styles.backLink}>
                        <ChevronLeft size={20} />
                        Volver a Programación
                    </Link>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Registro de Personal</h1>
                        <p className={styles.subtitle}>Alta rápida de empleados para plataforma de capacitación.</p>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <UserPlus className={styles.icon} />
                        <h2>Nuevo Empleado</h2>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.grid}>
                            {/* Información Personal */}
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>Datos Personales</h3>

                                <div className={styles.inputGroup}>
                                    <label>Nombre Completo</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Ej. Juan Pérez"
                                        required
                                        className={styles.input}
                                    />
                                </div>

                                <div className={styles.inputGroup}>
                                    <label>ID de Empleado</label>
                                    <input
                                        type="text"
                                        name="employeeId"
                                        value={formData.employeeId}
                                        onChange={handleChange}
                                        placeholder="Ej. EMP001"
                                        required
                                        className={styles.input}
                                    />
                                </div>
                            </div>

                            {/* Información Laboral */}
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>Datos Laborales</h3>

                                <div className={styles.rowTwo}>
                                    <div className={styles.inputGroup}>
                                        <label>Área</label>
                                        <select
                                            name="area"
                                            value={formData.area}
                                            onChange={handleChange}
                                            required
                                            className={styles.select}
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="ALMACEN">Almacén</option>
                                            <option value="CALIDAD">Calidad</option>
                                            <option value="COMERCIAL">Comercial</option>
                                            <option value="MANTENIMIENTO">Mantenimiento</option>
                                            <option value="PRODUCCIÓN">Producción</option>
                                            <option value="RH">Recursos Humanos</option>
                                            <option value="SISTEMAS">Sistemas</option>
                                            <option value="OTROS">Otros</option>
                                        </select>
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>Puesto</label>
                                        <input
                                            type="text"
                                            name="position"
                                            value={formData.position}
                                            onChange={handleChange}
                                            placeholder="Ej. Auxiliar Administrativo"
                                            required
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.rowTwo}>
                                    <div className={styles.inputGroup}>
                                        <label>Turno</label>
                                        <select
                                            name="shift"
                                            value={formData.shift}
                                            onChange={handleChange}
                                            className={styles.select}
                                        >
                                            <option value="">Seleccionar...</option>
                                            <option value="1">1er Turno</option>
                                            <option value="2">2do Turno</option>
                                            <option value="3">3er Turno</option>
                                            <option value="4">4to Turno (Mixto)</option>
                                            <option value="Admin">Administrativo</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Acceso */}
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>Credenciales de Acceso</h3>
                                <div className={styles.accessCodeWrapper}>
                                    <div className={styles.inputGroup} style={{ flex: 1 }}>
                                        <label>Código de Acceso (Contraseña)</label>
                                        <input
                                            type="text"
                                            name="accessCode"
                                            value={formData.accessCode}
                                            onChange={handleChange}
                                            placeholder="Generar o escribir..."
                                            required
                                            className={`${styles.input} ${styles.codeFont}`}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={generateRandomCode}
                                        className={styles.generateBtn}
                                    >
                                        Generar
                                    </button>
                                </div>
                                <p className={styles.helperText}>Este código será la contraseña del empleado para ingresar al portal.</p>
                            </div>
                        </div>

                        {status.message && (
                            <div className={`${styles.statusMessage} ${styles[status.type]}`}>
                                {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                {status.message}
                            </div>
                        )}

                        <div className={styles.footer}>
                            <button
                                type="submit"
                                disabled={loading}
                                className={styles.submitBtn}
                            >
                                {loading ? 'Registrando...' : 'Registrar Empleado'}
                                <Save size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
