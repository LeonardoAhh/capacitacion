'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, GraduationCap, Settings } from 'lucide-react';
import ModuleCard from '@/components/ModuleCard/ModuleCard';
import ProfileDropdown from '@/components/ProfileDropdown/ProfileDropdown';
import styles from './page.module.css';

export default function ModulesPage() {
    const { user, loading: authLoading, signOut } = useAuth();
    const router = useRouter();

    // Protección: Redirigir candidatos a su dashboard
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/'); // OR /login
            return;
        }

        const candidateSession = sessionStorage.getItem('candidate_session');
        if (candidateSession) {
            router.push('/candidatos/dashboard');
        }
    }, [router, user, authLoading]);

    if (authLoading || !user) {
        return (
            <div className={styles.container}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    const isDemo = user?.rol === 'demo' || user?.email?.includes('demo');
    const isSuperAdmin = user?.rol === 'super_admin';

    // Definir módulos con sus características
    const modules = [
        {
            id: 'dashboard',
            title: 'Gestión de Talento',
            subtitle: 'Administra empleados y desarrollo',
            description: 'Sistema completo de gestión de recursos humanos y desarrollo de talento.',
            features: [
                'Gestión de empleados',
                'Reportes y analíticas',
                'Control de capacitación',
                'Dashboard ejecutivo'
            ],
            icon: LayoutDashboard,
            href: '/dashboard',
            disabled: isDemo,
        },
        {
            id: 'induction',
            title: 'Inducción',
            subtitle: 'Cursos y onboarding',
            description: 'Portal de capacitación e inducción para nuevos colaboradores.',
            features: [
                'Cursos de inducción',
                'Material didáctico',
                'Evaluaciones',
                'Certificaciones'
            ],
            icon: GraduationCap,
            href: '/induccion',
            disabled: false,
        },
        {
            id: 'iluo',
            title: 'ILUO Manager',
            subtitle: 'Ajustes del sistema ILUO',
            description: 'Configuración avanzada del sistema de gestión de habilidades.',
            features: [
                'Configuración de skills',
                'Gestión de matrices',
                'Ajustes de sistema',
                'Solo para admins'
            ],
            icon: Settings,
            href: '/iluo-manager',
            disabled: !isSuperAdmin,
        },
    ];

    return (
        <div className={styles.container}>
            {/* Skip to Content Link for Accessibility */}
            <a href="#main-content" className={styles.skipLink}>
                Saltar al contenido principal
            </a>

            {/* ProfileDropdown */}
            <div className={styles.profileContainer}>
                <ProfileDropdown />
            </div>

            {/* Background Effects */}
            <div className={styles.bgDecoration} aria-hidden="true">
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
                <div className={`${styles.blob} ${styles.blob3}`}></div>
            </div>

            <div className={styles.content}>
                <header className={styles.header} role="banner">
                    <h1 className={styles.title}>
                        Hola, <span className={styles.userName}>{(user?.nombre || user?.name || user?.displayName || 'Usuario').split(' ')[0]}</span>
                    </h1>
                    <p className={styles.subtitle}>Selecciona un módulo para comenzar</p>
                </header>

                {/* Bento Grid */}
                <div className={styles.bentoGrid} id="main-content" role="navigation" aria-label="Módulos disponibles">
                    {modules.map((module, index) => (
                        <div
                            key={module.id}
                            className={styles.gridItem}
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <ModuleCard
                                title={module.title}
                                subtitle={module.subtitle}
                                description={module.description}
                                features={module.features}
                                icon={module.icon}
                                href={module.href}
                                disabled={module.disabled}
                            />
                        </div>
                    ))}
                </div>

                <footer className={styles.footer}>
                    <p className={styles.copyright}>© 2024 Vertx System</p>
                </footer>
            </div>
        </div>
    );
}
