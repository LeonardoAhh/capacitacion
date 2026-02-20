'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, GraduationCap, Settings } from 'lucide-react';
import ModuleCard from '@/components/ui/ModuleCard/ModuleCard';
import ProfileDropdown from '@/components/layout/ProfileDropdown/ProfileDropdown';
import styles from './page.module.css';

export default function ModulesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }

        const candidateSession = sessionStorage.getItem('candidate_session');
        if (candidateSession) {
            router.push('/candidatos/dashboard');
        }
    }, [router, user, authLoading]);

    if (authLoading || !user) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>Cargando...</div>
            </div>
        );
    }

    const isDemo = user?.rol === 'demo' || user?.email?.includes('demo');
    const isSuperAdmin = user?.rol === 'super_admin';

    const modules = [
        {
            id: 'dashboard',
            title: 'Gestión de Talento',
            subtitle: 'Administra empleados y desarrollo',
            icon: LayoutDashboard,
            href: '/dashboard',
            disabled: isDemo,
        },
        {
            id: 'induction',
            title: 'Inducción',
            subtitle: 'Cursos y onboarding',
            icon: GraduationCap,
            href: '/induccion',
            disabled: false,
        },
        {
            id: 'iluo',
            title: 'ILUO Manager',
            subtitle: 'Configuración avanzada',
            icon: Settings,
            href: '/iluo-manager',
            disabled: !isSuperAdmin,
        },
    ];

    const firstName = (user?.nombre || user?.name || user?.displayName || 'Usuario').split(' ')[0];

    return (
        <div className={styles.page}>
            <a href="#main-content" className={styles.skipLink}>
                Saltar al contenido principal
            </a>

            <div className={styles.profileContainer}>
                <ProfileDropdown />
            </div>

            <div className={styles.content}>

                <header className={styles.header}>
                    <span className={styles.portal}>Portal RRHH</span>
                    <h1 className={styles.title}>
                        Hola, <span className={styles.userName}>{firstName}</span>
                    </h1>
                    <p className={styles.subtitle}>Selecciona un módulo para comenzar</p>
                </header>

                <div className={styles.divider} aria-hidden="true" />

                <nav
                    className={styles.modulesList}
                    id="main-content"
                    aria-label="Módulos disponibles"
                >
                    {modules.map((module) => (
                        <ModuleCard
                            key={module.id}
                            title={module.title}
                            subtitle={module.subtitle}
                            icon={module.icon}
                            href={module.href}
                            disabled={module.disabled}
                        />
                    ))}
                </nav>

                <footer className={styles.footer}>
                    <p className={styles.copyright}>© {new Date().getFullYear()} Viñoplastic</p>
                </footer>

            </div>
        </div>
    );
}