"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Pacifico } from "next/font/google";
import Link from "next/link";
import { Users, UserPlus, GraduationCap } from "lucide-react";
import { ElegantShape } from './ui/ElegantShape';
import DynamicCredits from './DynamicCredits/DynamicCredits';
import styles from './ShapeHero.module.css';

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

// Shape configurations - extracted for maintainability
const SHAPES_CONFIG = [
    { className: 'shape1', delay: 0.3, width: 300, height: 500, rotate: -8, color: "#6366f1", borderRadius: 24 },
    { className: 'shape2', delay: 0.5, width: 600, height: 200, rotate: 15, color: "#f43f5e", borderRadius: 20 },
    { className: 'shape3', delay: 0.4, width: 300, height: 300, rotate: 24, color: "#8b5cf6", borderRadius: 32 },
    { className: 'shape4', delay: 0.6, width: 250, height: 100, rotate: -20, color: "#f59e0b", borderRadius: 12 },
    { className: 'shape5', delay: 0.7, width: 400, height: 150, rotate: 35, color: "#10b981", borderRadius: 16 },
    { className: 'shape6', delay: 0.2, width: 200, height: 200, rotate: -25, color: "#3b82f6", borderRadius: 28 },
    { className: 'shape7', delay: 0.8, width: 150, height: 80, rotate: 45, color: "#a855f7", borderRadius: 10 },
    { className: 'shape8', delay: 0.9, width: 450, height: 120, rotate: -12, color: "#14b8a6", borderRadius: 18 },
];

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

/**
 * ShapesBackground - Container for decorative shapes
 */
const ShapesBackground = memo(function ShapesBackground() {
    return (
        <div className={styles.shapesContainer} aria-hidden="true">
            {SHAPES_CONFIG.map((shape) => (
                <ElegantShape
                    key={shape.className}
                    className={styles[shape.className]}
                    delay={shape.delay}
                    width={shape.width}
                    height={shape.height}
                    rotate={shape.rotate}
                    color={shape.color}
                    borderRadius={shape.borderRadius}
                />
            ))}
        </div>
    );
});

// ==================== MAIN COMPONENT ====================

/**
 * ShapeHero - Main landing page hero section
 * Features animated shapes, brand title, and navigation buttons
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

            {/* Background gradient - decorative */}
            <div className={styles.backgroundGradient} aria-hidden="true" />

            {/* Animated shapes - decorative */}
            <ShapesBackground />

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
