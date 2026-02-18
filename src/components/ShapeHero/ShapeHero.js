'use client';

import { memo } from 'react';
import Link from 'next/link';
import DynamicCredits from '@/components/DynamicCredits/DynamicCredits';
import ThemeSelector from '@/components/ThemeSelector/ThemeSelector';
import styles from './ShapeHero.module.css';

const NAV_LINKS = [
    {
        href: '/login',
        label: 'RRHH',
        ariaLabel: 'Acceder al portal de empleados',
    },
    {
        href: '/candidatos',
        label: 'Candidatos',
        ariaLabel: 'Acceder al portal de candidatos',
    },
    {
        href: '/training/login',
        label: 'Empleados',
        ariaLabel: 'Acceder al módulo de capacitación',
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
                            <span className={styles.cardLabel}>{link.label}</span>
                        </Link>
                    ))}
                </nav>

                <DynamicCredits />


            </div>

            <div className={styles.footer}>
                <span className={styles.year}>© {new Date().getFullYear()}</span>
            </div>
        </section>
    );
}

const ShapeHero = memo(ShapeHeroComponent);
export default ShapeHero;

