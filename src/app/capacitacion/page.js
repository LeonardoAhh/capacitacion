'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProfileDropdown from '@/components/layout/ProfileDropdown/ProfileDropdown';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton/BackButton';
import { useToast } from '@/components/ui/Toast/Toast';
import { useComplianceRecalc } from '@/hooks/useComplianceRecalc';
import {
    Users, FileText, Award, TrendingUp, GitCompareArrows, Calendar,
    ClipboardPen, UserCircle, PieChart, LayoutGrid,
    CalendarDays, Star, CheckCircle2
} from 'lucide-react';
import styles from './page.module.css';

export default function CapacitacionPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { isRecalculating, handleRecalculateCompliance } = useComplianceRecalc(toast);

    // Auth Protection
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    if (authLoading || !user) {
        return (
            <div className={styles.main}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    const allActions = [
        { href: '/capacitacion/analisis', title: 'Análisis y Reportes', icon: PieChart },
        { href: '/capacitacion/calendario', title: 'Calendario', icon: CalendarDays },
        { href: '/dashboard/candidates', title: 'Candidatos', icon: Users },
        { href: '/capacitacion/cumplimiento', title: 'Cumplimiento por Curso', icon: CheckCircle2 },
        { href: '/capacitacion/comparacion', title: 'Comparación', icon: GitCompareArrows },
        { href: '/capacitacion/generador-examenes', title: 'Exámenes para Categorías', icon: Calendar },
        { href: '/capacitacion/empleados', title: 'Plantilla Activa', icon: Users },
        { href: '/capacitacion/matriz', title: 'Matriz de Capacitación', icon: LayoutGrid },
        { href: '/capacitacion/perfil', title: 'Perfil de Empleado', icon: UserCircle },
        { href: '/dashboard/programacion', title: 'Programación', icon: FileText },
        { href: '/capacitacion/promociones', title: 'Promociones y Ascensos', icon: Star },
        { href: '/capacitacion/registro', title: 'Registro de Capacitación', icon: ClipboardPen },
        { href: '/reports', title: 'RG-REC-048', icon: TrendingUp },
    ];

    return (
        <div className={styles.main}>
            <div className={styles.profileContainer}>
                <ProfileDropdown />
            </div>

            {/* Background Decorations */}
            <div className={styles.bgDecoration}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
            </div>

            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Capacitación</h1>
                        <p className={styles.subtitle}>Gestiona el desarrollo y formación de tu equipo</p>
                    </div>
                    <BackButton href="/modulos" />
                </div>

                {/* Todos los accesos en un solo grid con estilo moduleCard */}
                <div className={styles.modulesGrid}>
                    {allActions.map((action) => (
                        <Link
                            key={action.href}
                            href={action.href}
                            className={styles.moduleCard}
                        >
                            <div className={`${styles.moduleIcon} ${styles.iconOrange}`}>
                                <action.icon size={22} />
                            </div>
                            <div className={styles.moduleContent}>
                                <h3>{action.title}</h3>
                            </div>
                            <svg className={styles.moduleArrow} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
