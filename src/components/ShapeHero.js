"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Pacifico } from "next/font/google";
import Link from "next/link";
import { Users, UserPlus, GraduationCap } from "lucide-react";
import DynamicCredits from './DynamicCredits/DynamicCredits';
import styles from './ShapeHero.module.css';
import SwitchButton from './ui/SwitchButton/SwitchButton';
import { BackgroundLines } from './ui/BackgroundLines/BackgroundLines';

// ─── Font ─────────────────────────────────────────────────────────────────────

const pacifico = Pacifico({
    subsets: ["latin"],
    weight: ["400"],
    display: "swap",
});

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND = {
    name: "VIÑOPLASTIC",
    location: "Planta Querétaro",
};

const NAV_LINKS = [
    { href: "/login", label: "Empleados", ariaLabel: "Acceder al portal de empleados", icon: Users, variant: "primary" },
    { href: "/candidatos", label: "Candidatos", ariaLabel: "Acceder al portal de candidatos", icon: UserPlus, variant: "secondary" },
    { href: "/training/login", label: "Capacitación", ariaLabel: "Acceder al módulo de capacitación", icon: GraduationCap, variant: "tertiary" },
];

// ─── Animation variants ───────────────────────────────────────────────────────

// Outer stagger: sequences title + nav in a single coordinated pass
const PAGE_STAGGER = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.22,
            delayChildren: 0.25,
        },
    },
};

// Inner stagger for nav buttons
const NAV_STAGGER = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0,
        },
    },
};

// Clip-path reveal from bottom — used for title lines
const LINE_REVEAL = {
    hidden: {
        clipPath: "inset(100% 0% 0% 0%)",
        opacity: 0,
    },
    visible: {
        clipPath: "inset(0% 0% 0% 0%)",
        opacity: 1,
        transition: {
            duration: 0.85,
            ease: [0.22, 1, 0.36, 1],
        },
    },
};

// Blur + slide up — used for each button
const ITEM_REVEAL = {
    hidden: {
        opacity: 0,
        y: 20,
        filter: "blur(5px)",
    },
    visible: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: {
            duration: 0.55,
            ease: [0.22, 1, 0.36, 1],
        },
    },
};

// ─── NavButton ────────────────────────────────────────────────────────────────

const VARIANT_CLASS = {
    primary: "primaryButton",
    secondary: "secondaryButton",
    tertiary: "tertiaryButton",
};

const NavButton = memo(function NavButton({ href, label, ariaLabel, icon: Icon, variant }) {
    return (
        <motion.div variants={ITEM_REVEAL} style={{ display: "contents" }}>
            <Link
                href={href}
                className={styles[VARIANT_CLASS[variant] ?? "primaryButton"]}
                aria-label={ariaLabel}
            >
                <Icon className={styles.buttonIcon} aria-hidden="true" />
                <span>{label}</span>
            </Link>
        </motion.div>
    );
});

// ─── ShapeHero ────────────────────────────────────────────────────────────────

function ShapeHeroComponent() {
    return (
        <section
            className={styles.container}
            role="banner"
            aria-label="Página principal de ViñoPlastic"
        >
            {/* Skip link */}
            <a href="#main-content" className={styles.skipLink}>
                Saltar al contenido principal
            </a>

            {/* Theme toggle */}
            <div className={styles.topControls}>
                <SwitchButton />
            </div>

            {/* Animated background lines */}
            <BackgroundLines
                colors={["#6366f1", "#10b981", "#ec4899", "#8b5cf6"]}
                style={{ position: "absolute", inset: 0, zIndex: 0, opacity: 0.5 }}
                svgOptions={{ duration: 12 }}
            />

            {/* Noise texture — subtle grain for depth */}
            <div className={styles.noiseOverlay} aria-hidden="true" />

            {/* Vignette */}
            <div className={styles.overlay} aria-hidden="true" />

            {/* ── Main content — single coordinated entrance ── */}
            <motion.div
                className={styles.content}
                id="main-content"
                variants={PAGE_STAGGER}
                initial="hidden"
                animate="visible"
            >
                <div className={styles.textCenter}>

                    {/* Title: each line clips up independently */}
                    <div className={styles.titleWrapper} aria-label={`${BRAND.name} ${BRAND.location}`}>
                        <div className={styles.titleLine}>
                            <motion.span
                                className={styles.mainTitle}
                                variants={LINE_REVEAL}
                                aria-hidden="true"
                            >
                                {BRAND.name}
                            </motion.span>
                        </div>
                        <div className={styles.titleLine}>
                            <motion.span
                                className={`${styles.subtitle} ${pacifico.className}`}
                                variants={LINE_REVEAL}
                                aria-hidden="true"
                            >
                                {BRAND.location}
                            </motion.span>
                        </div>
                    </div>

                    {/* Navigation buttons */}
                    <motion.nav
                        className={styles.buttonsContainer}
                        variants={NAV_STAGGER}
                        aria-label="Navegación principal"
                    >
                        {NAV_LINKS.map((link) => (
                            <NavButton key={link.href} {...link} />
                        ))}
                    </motion.nav>

                </div>
            </motion.div>

            {/* Credits */}
            <DynamicCredits />
        </section>
    );
}

const ShapeHero = memo(ShapeHeroComponent);
export default ShapeHero;