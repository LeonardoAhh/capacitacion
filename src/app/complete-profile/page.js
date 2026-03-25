'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from './page.module.css';
import { Select } from '@/components/ui/Select/Select';

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
                        <Select
                            value={formData.departamento}
                            onChange={(value) => setFormData({ ...formData, departamento: value })}
                            options={[
                                { value: 'Recursos Humanos', label: 'Recursos Humanos' },
                                { value: 'Producción', label: 'Producción' },
                                { value: 'Calidad', label: 'Calidad' },
                                { value: 'Logística', label: 'Logística' },
                                { value: 'Mantenimiento', label: 'Mantenimiento' },
                                { value: 'Administración', label: 'Administración' },
                                { value: 'Sistemas', label: 'Sistemas' },
                            ]}
                            placeholder="Selecciona..."
                        />
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
                        <Select
                            value={formData.genero}
                            onChange={(value) => setFormData({ ...formData, genero: value })}
                            options={[
                                { value: 'Masculino', label: 'Masculino' },
                                { value: 'Femenino', label: 'Femenino' },
                                { value: 'Otro', label: 'Prefiero no decirlo' },
                            ]}
                            placeholder="Selecciona..."
                        />
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
