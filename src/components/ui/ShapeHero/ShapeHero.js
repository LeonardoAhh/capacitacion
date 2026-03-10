'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DynamicCredits from '@/components/features/DynamicCredits/DynamicCredits';
import ThemeSelector from '@/components/layout/ThemeSelector/ThemeSelector';
import styles from './ShapeHero.module.css';

const NAV_LINKS = [
    {
        href: '/login',
        label: 'RRHH',
        ariaLabel: 'Acceder al portal de Recursos Humanos',
        description: 'Recursos Humanos',
    },
    {
        href: '/candidatos',
        label: 'Candidatos',
        ariaLabel: 'Acceder al portal de candidatos',
        description: 'Reclutamiento',
    },
    {
        href: '/training/login',
        label: 'Empleados',
        ariaLabel: 'Acceder al módulo de capacitación',
        description: 'Capacitación',
    },
];

function ShapeHeroComponent() {
    return (
        <section
            className={styles.hero}
            aria-label="Página principal de ViñoPlastic"
        >
            {/* Skip link — accesibilidad teclado */}
            <a href="#main-content" className={styles.skipLink}>
                Saltar al contenido principal
            </a>

            {/* Grid texture */}
            <div className={styles.grid} aria-hidden="true" />

            {/* Glow orb */}
            <div className={styles.glowOrb} aria-hidden="true" />

            {/* ThemeSelector — esquina inferior derecha */}
            <div className={styles.themePill}>
                <ThemeSelector />
            </div>

            {/* Main content — 2 columnas */}
            <div className={styles.content} id="main-content">

                {/* ── Columna izquierda ── */}
                <div className={styles.left}>

                    {/* Brand block */}
                    <div className={styles.brand}>
                        <span className={styles.portal}>Portal Corporativo</span>
                        <h1 className={styles.title}>
                            VIÑO<span className={styles.titleAccent}>PLASTIC</span>
                        </h1>
                        <span className={styles.location}>
                            Planta Querétaro
                        </span>
                    </div>

                    {/* Divider */}
                    <div className={styles.divider} aria-hidden="true" />

                    {/* Pill navbar */}
                    <nav className={styles.nav} aria-label="Navegación principal">
                        <div className={styles.navPill}>
                            {NAV_LINKS.map((link, i) => (
                                <span key={link.href} className={styles.navGroup}>
                                    {i > 0 && (
                                        <span className={styles.navSep} aria-hidden="true" />
                                    )}
                                    <Link
                                        href={link.href}
                                        className={styles.navItem}
                                        aria-label={link.ariaLabel}
                                    >
                                        {/* Descripción visible — área, sector */}
                                        <span className={styles.navItemDesc} aria-hidden="true">
                                            {link.description}
                                        </span>
                                        <span className={styles.navItemLabel}>{link.label}</span>
                                    </Link>
                                </span>
                            ))}
                        </div>
                    </nav>

                    {/* Créditos dinámicos */}
                    <DynamicCredits />

                </div>

                {/* ── Columna derecha — Visual SVG ── */}
                {/* aria-hidden en el wrapper porque el alt de la imagen
                    ya describe el contenido; evitamos doble anuncio */}
                <div className={styles.right} aria-hidden="true">
                    <div className={styles.visualWrapper}>
                        <Image
                            src="/logo-vino-plastic.png"
                            alt=""
                            className={styles.visualImg}
                            width={480}
                            height={480}
                            priority
                        />
                        <div className={styles.visualFade} />
                    </div>
                </div>

            </div>

            {/* Footer */}
            <footer className={styles.footer}>
                <span className={styles.year}>© {new Date().getFullYear()} ViñoPlastic System</span>
            </footer>
        </section>
    );
}

const ShapeHero = memo(ShapeHeroComponent);
export default ShapeHero;