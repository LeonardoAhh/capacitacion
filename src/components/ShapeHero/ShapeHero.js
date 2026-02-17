'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Users, UserPlus, GraduationCap, ChevronRight } from 'lucide-react';
import DynamicCredits from '@/components/DynamicCredits/DynamicCredits';
import ThemeSelector from '@/components/ThemeSelector/ThemeSelector';
import styles from './ShapeHero.module.css';

const NAV_LINKS = [
    {
        href: '/login',
        label: 'RRHH',
        ariaLabel: 'Acceder al portal de empleados',
        icon: Users,
    },
    {
        href: '/candidatos',
        label: 'Candidatos',
        ariaLabel: 'Acceder al portal de candidatos',
        icon: UserPlus,
    },
    {
        href: '/training/login',
        label: 'Empleados',
        ariaLabel: 'Acceder al módulo de capacitación',
        icon: GraduationCap,
    },
];

function ShapeHeroComponent() {
    return (
        <section
            className={styles.hero}
            role="banner"
            aria-label="Página principal de ViñoPlastic"
        >
            <a href="#main-content" className={styles.skipLink}>
                Saltar al contenido principal
            </a>

            <div className={styles.controls}>
                <ThemeSelector />
            </div>

            <div className={styles.content} id="main-content">
                <div className={styles.brand}>
                    <span className={styles.portal}>Portal Corporativo</span>
                    <h1 className={styles.title}>VIÑOPLASTIC</h1>
                    <span className={styles.location}>Planta Querétaro</span>
                </div>

                <nav className={styles.nav} aria-label="Navegación principal">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={styles.card}
                            aria-label={link.ariaLabel}
                        >
                            <div className={styles.cardIcon}>
                                <link.icon size={24} strokeWidth={1.5} />
                            </div>
                            <div className={styles.cardContent}>
                                <span className={styles.cardLabel}>{link.label}</span>
                                <ChevronRight size={16} className={styles.cardArrow} />
                            </div>
                        </Link>
                    ))}
                </nav>

                <DynamicCredits />

                <Link href="/features" className={styles.featuresLink}>
                    Features
                </Link>
            </div>

            <div className={styles.footer}>
                <span className={styles.year}>© {new Date().getFullYear()}</span>
            </div>
        </section>
    );
}

const ShapeHero = memo(ShapeHeroComponent);
export default ShapeHero;
