'use client';

import { memo } from 'react';
import Link from 'next/link';
import DynamicCredits from '@/components/features/DynamicCredits/DynamicCredits';
import ThemeSelector from '@/components/layout/ThemeSelector/ThemeSelector';
import styles from './ShapeHero.module.css';

const NAV_LINKS = [
    {
        href: '/login',
        label: 'RRHH',
        ariaLabel: 'Acceder al portal de empleados',
        description: 'Portal de Empleados',
        index: '01',
    },
    {
        href: '/candidatos',
        label: 'Candidatos',
        ariaLabel: 'Acceder al portal de candidatos',
        description: 'Portal de Reclutamiento',
        index: '02',
    },
    {
        href: '/training/login',
        label: 'Empleados',
        ariaLabel: 'Acceder al módulo de capacitación',
        description: 'Módulo de Capacitación',
        index: '03',
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

            {/* Subtle grid texture */}
            <div className={styles.grid} aria-hidden="true" />

            {/* Top bar */}
            <header className={styles.topBar}>
                <div className={styles.topBarBrand}>
                    <span className={styles.topBarDot} aria-hidden="true" />
                    <span className={styles.topBarLabel}>Viñoplastic · Planta Querétaro</span>
                </div>
                <div className={styles.controls}>
                    <ThemeSelector />
                </div>
            </header>

            {/* Main content */}
            <div className={styles.content} id="main-content">

                {/* Brand block */}
                <div className={styles.brand}>
                    <span className={styles.portal}>Portal Corporativo</span>
                    <h1 className={styles.title}>
                        VIÑO<span className={styles.titleAccent}>PLASTIC</span>
                    </h1>
                    <span className={styles.location}>Planta Querétaro</span>
                </div>

                {/* Divider */}
                <div className={styles.divider} aria-hidden="true" />

                {/* Nav cards */}
                <nav className={styles.nav} aria-label="Navegación principal">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={styles.card}
                            aria-label={link.ariaLabel}
                        >
                            <span className={styles.cardIndex} aria-hidden="true">{link.index}</span>
                            <span className={styles.cardBody}>
                                <span className={styles.cardDescription}>{link.description}</span>
                                <span className={styles.cardLabel}>{link.label}</span>
                            </span>
                            <span className={styles.cardArrow} aria-hidden="true">→</span>
                        </Link>
                    ))}
                </nav>

                <DynamicCredits />

            </div>

            {/* Footer */}
            <footer className={styles.footer}>
                <span className={styles.year}>© {new Date().getFullYear()} Vertx System</span>
            </footer>
        </section>
    );
}

const ShapeHero = memo(ShapeHeroComponent);
export default ShapeHero;