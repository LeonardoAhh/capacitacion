'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast/Toast';
import { recalculateComplianceFromFirestore } from '@/lib/seedHistorial';
import styles from './page.module.css';

export default function CapacitacionPage() {
    const [isRecalculating, setIsRecalculating] = useState(false);
    const { toast } = useToast();

    const handleRecalculateCompliance = async () => {
        setIsRecalculating(true);
        try {
            const result = await recalculateComplianceFromFirestore();
            if (result.success) {
                toast.success('Cumplimiento Recalculado', `Se procesaron ${result.processed} empleados`);
            } else {
                toast.error('Error', result.error);
            }
        } catch (error) {
            toast.error('Error', error.message);
        } finally {
            setIsRecalculating(false);
        }
    };

    const modules = [
        {
            href: '/capacitacion/puestos',
            title: 'Gestión de Puestos',
            description: 'Administrar puestos y requisitos',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 7h-9" />
                    <path d="M14 17H5" />
                    <circle cx="17" cy="17" r="3" />
                    <circle cx="7" cy="7" r="3" />
                </svg>
            ),
            color: 'purple'
        },
        {
            href: '/capacitacion/registro',
            title: 'Registro de Capacitación',
            description: 'Registrar nuevas capacitaciones',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
            ),
            color: 'blue'
        },
        {
            href: '/capacitacion/empleados',
            title: 'Gestión de Empleados',
            description: 'Ver y editar empleados',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            color: 'purple'
        },
        {
            href: '/capacitacion/perfil',
            title: 'Perfil de Empleado',
            description: 'Buscar perfil individual',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
            color: 'blue'
        },
        {
            href: '/capacitacion/analisis',
            title: 'Análisis y Reportes',
            description: 'Estadísticas y métricas',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                    <path d="M22 12A10 10 0 0 0 12 2v10z" />
                </svg>
            ),
            color: 'green'
        },
        {
            href: '/capacitacion/matriz',
            title: 'Matriz de Capacitación',
            description: 'Plan de formación',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
            ),
            color: 'purple'
        },
        {
            href: '/capacitacion/habilidades',
            title: 'Matriz de Habilidades',
            description: 'Competencias por área',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
            ),
            color: 'green'
        },
        {
            href: '/capacitacion/cursos',
            title: 'Vigencia de Cursos',
            description: 'Control de renovaciones',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
            ),
            color: 'orange'
        },
        {
            href: '/capacitacion/alertas',
            title: 'Alertas Inteligentes',
            description: 'Notificaciones automáticas',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            ),
            color: 'red'
        },
        {
            href: '/capacitacion/calendario',
            title: 'Calendario',
            description: 'Programación de cursos',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            ),
            color: 'blue'
        },
        {
            href: '/capacitacion/promociones',
            title: 'Cambios de Categoría',
            description: 'Ascensos y promociones',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
                </svg>
            ),
            color: 'green'
        },
        {
            href: '/capacitacion/cumplimiento',
            title: 'Cumplimiento por Curso',
            description: 'Estado de certificaciones',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            ),
            color: 'blue'
        }
    ];

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div>
                            <h1 className={styles.title}>Módulo de Capacitación</h1>
                            <p className={styles.subtitle}>Gestiona el desarrollo y formación de tu equipo</p>
                        </div>
                        <Link href="/dashboard" className={styles.backBtn}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Dashboard
                        </Link>
                    </div>

                    {/* Modules Grid */}
                    <div className={styles.modulesGrid}>
                        {modules.map((module) => (
                            <Link
                                key={module.href}
                                href={module.href}
                                className={styles.moduleCard}
                            >
                                <div className={`${styles.moduleIcon} ${styles[`icon${module.color.charAt(0).toUpperCase() + module.color.slice(1)}`]}`}>
                                    {module.icon}
                                </div>
                                <div className={styles.moduleContent}>
                                    <h3>{module.title}</h3>
                                    <p>{module.description}</p>
                                </div>
                                <svg className={styles.moduleArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}
