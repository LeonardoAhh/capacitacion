'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from './page.module.css';

export default function CompleteProfilePage() {
    const { user, loading: authLoading, updateUserProfile } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        departamento: '',
        puesto: '',
        genero: '',
        fechaIngreso: new Date().toLocaleDateString('es-MX')
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const result = await updateUserProfile(user.uid, {
                ...formData,
                profileComplete: true
            });

            if (result.success) {
                router.push('/dashboard');
            } else {
                setError(result.error || 'Error al actualizar perfil');
            }
        } catch (err) {
            setError('Error al guardar datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
                <span>Cargando...</span>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.card}
            >
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>Completa tu perfil</h1>
                    <p className={styles.subtitle}>
                        Bienvenido {user?.email}. Por favor completa tu información.
                    </p>
                </div>

                {error && (
                    <div className={styles.error}>{error}</div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>Nombre Completo *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Departamento *</label>
                        <select
                            name="departamento"
                            value={formData.departamento}
                            onChange={handleChange}
                            required
                            className={styles.input}
                        >
                            <option value="">Selecciona...</option>
                            <option value="Recursos Humanos">Recursos Humanos</option>
                            <option value="Producción">Producción</option>
                            <option value="Calidad">Calidad</option>
                            <option value="Logística">Logística</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                            <option value="Administración">Administración</option>
                            <option value="Sistemas">Sistemas</option>
                        </select>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Puesto *</label>
                        <input
                            type="text"
                            name="puesto"
                            value={formData.puesto}
                            onChange={handleChange}
                            required
                            className={styles.input}
                            placeholder="Ej: Analista de Capacitación"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Género *</label>
                        <select
                            name="genero"
                            value={formData.genero}
                            onChange={handleChange}
                            required
                            className={styles.input}
                        >
                            <option value="">Selecciona...</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Femenino">Femenino</option>
                            <option value="Otro">Prefiero no decirlo</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={styles.submitButton}
                    >
                        {loading ? 'Guardando...' : 'Completar Perfil'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
