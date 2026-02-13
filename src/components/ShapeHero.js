"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Pacifico } from "next/font/google";
import Link from "next/link";
import { Users, UserPlus, GraduationCap } from "lucide-react";
import DynamicCredits from './DynamicCredits/DynamicCredits';
import styles from './ShapeHero.module.css';

import SwitchButton from './ui/SwitchButton/SwitchButton';
import { BackgroundLines } from './ui/BackgroundLines/BackgroundLines';

// ==================== FONT CONFIG ====================
const pacifico = Pacifico({
    subsets: ["latin"],
    weight: ["400"],
    display: "swap",
});

// ==================== CONSTANTS ====================
const BRAND = {
    name: "VIÑOPLASTIC",
    location: "Planta Querétaro"
};

// Navigation links configuration
const NAV_LINKS = [
    { href: "/login", label: "Empleados", ariaLabel: "Acceder al portal de empleados", icon: Users, variant: "primary" },
    { href: "/candidatos", label: "Candidatos", ariaLabel: "Acceder al portal de candidatos", icon: UserPlus, variant: "secondary" },
    { href: "/training/login", label: "Capacitación", ariaLabel: "Acceder al módulo de capacitación", icon: GraduationCap, variant: "tertiary" },
];

// Animation variants - defined outside component for performance
const FADE_UP_VARIANTS = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 1,
            delay: 0.5 + i * 0.2,
            ease: [0.25, 0.4, 0.25, 1],
        },
    }),
};

// ==================== SUB-COMPONENTS ====================

/**
 * NavButton - Individual navigation button with variants
 */
const NavButton = memo(function NavButton({ href, label, ariaLabel, icon: Icon, variant }) {
    const buttonClass = useMemo(() => {
        const variantClasses = {
            primary: styles.primaryButton,
            secondary: styles.secondaryButton,
            tertiary: styles.tertiaryButton,
        };
        return variantClasses[variant] || styles.primaryButton;
    }, [variant]);

    return (
        <Link
            href={href}
            className={buttonClass}
            aria-label={ariaLabel}
        >
            <Icon className={styles.buttonIcon} aria-hidden="true" />
            <span>{label}</span>
        </Link>
    );
});


// ==================== MAIN COMPONENT ====================

/**
 * ShapeHero - Main landing page hero section
 * Features brand title and navigation buttons with animated background lines
 */
function ShapeHeroComponent() {
    return (
        <section
            className={styles.container}
            role="banner"
            aria-label="Página principal de ViñoPlastic"
        >
            {/* Skip link for keyboard navigation */}
            <a href="#main-content" className={styles.skipLink}>
                Saltar al contenido principal
            </a>

            {/* Theme Toggle */}
            <div className={styles.topControls}>
                <SwitchButton />
            </div>

            {/* Background gradient - decorative */}
            <BackgroundLines
                colors={["#6366f1", "#10b981", "#ec4899", "#8b5cf6"]}
                style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5 }}
                svgOptions={{ duration: 12 }}
            />

            {/* Main content */}
            <div className={styles.content} id="main-content">
                <div className={styles.textCenter}>
                    {/* Title Section */}
                    <motion.div
                        animate="visible"
                        custom={1}
                        initial="hidden"
                        variants={FADE_UP_VARIANTS}
                    >
                        <h1 className={styles.title}>
                            <span className={styles.mainTitle}>{BRAND.name}</span>
                            <span className={`${styles.subtitle} ${pacifico.className}`}>
                                {BRAND.location}
                            </span>
                        </h1>
                    </motion.div>

                    {/* Navigation Buttons */}
                    <motion.nav
                        animate="visible"
                        custom={3}
                        initial="hidden"
                        variants={FADE_UP_VARIANTS}
                        className={styles.buttonsContainer}
                        aria-label="Navegación principal"
                    >
                        {NAV_LINKS.map((link) => (
                            <NavButton key={link.href} {...link} />
                        ))}
                    </motion.nav>

                    {/* Dynamic Credits */}
                    <DynamicCredits />
                </div>
            </div>

            {/* Overlay - decorative */}
            <div className={styles.overlay} aria-hidden="true" />
        </section>
    );
}

// Memoize main component
const ShapeHero = memo(ShapeHeroComponent);

export default ShapeHero;
