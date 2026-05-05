'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import ThemeToggle from '@/components/layout/ThemeToggle/ThemeToggle';
import styles from './AdminLayout.module.css';
import { LogOut, GraduationCap, Trophy } from 'lucide-react';

const NAV_ITEMS = [
    { id: 'induccion', label: 'Presentaciones Cursos', shortLabel: 'Cursos', href: '/induccion', icon: GraduationCap },
    { id: 'mural', label: 'Mural Resultados', shortLabel: 'Mural', href: '/mural', icon: Trophy },
];

const INSTRUCTOR_ITEMS = [
    { id: 'induccion', label: 'Presentaciones Cursos', shortLabel: 'Cursos', href: '/induccion', icon: GraduationCap },
];

function getRoleLabel(rol) {
    const map = { super_admin: 'Super Admin', admin: 'Admin', instructor: 'Instructor' };
    return map[rol] || rol || 'Usuario';
}

export default function AdminLayout({ children, title = 'Dashboard' }) {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const isInstructor = user?.rol === 'instructor' || user?.rol === 'Instructor';
    const items = isInstructor ? INSTRUCTOR_ITEMS : NAV_ITEMS;

    const handleLogout = async () => {
        if (isSigningOut) return;
        try {
            setIsSigningOut(true);
            await new Promise(resolve => setTimeout(resolve, 5000));
            await signOut();
        } catch { /* ignorar errores de cierre */ }
        router.push('/');
    };

    useEffect(() => {
        if (!loading && !user && !isSigningOut) router.replace('/login');
    }, [loading, user, router, isSigningOut]);

    if (loading || !user) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.loadingSpinner} />
            </div>
        );
    }

    const firstName = (user?.nombre || user?.nickname || user?.name || 'Admin').split(' ')[0];
    const avatarSeed = user?.avatarSeed || user?.email || 'admin';
    const avatarStyle = user?.avatarStyle || 'lorelei';
    const avatarSrc = user?.photoURL || user?.avatar ||
        `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    return (
        <div className={styles.root}>
            {/* ── Logout overlay ── */}
            <AnimatePresence>
                {isSigningOut && (
                    <motion.div
                        className={styles.logoutOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        role="status"
                        aria-live="assertive"
                        aria-label="Cerrando sesión"
                    >
                        <motion.div
                            className={styles.logoutContent}
                            initial={{ scale: 0.85, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <div className={styles.logoutRingWrap}>
                                <motion.div
                                    className={styles.logoutPulse1}
                                    initial={{ scale: 1, opacity: 0.4 }}
                                    animate={{ scale: 2.2, opacity: 0 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                                />
                                <motion.div
                                    className={styles.logoutPulse2}
                                    initial={{ scale: 1, opacity: 0.25 }}
                                    animate={{ scale: 2.8, opacity: 0 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.7 }}
                                />
                                <motion.svg
                                    className={styles.logoutSvgIcon}
                                    viewBox="0 0 52 52"
                                    aria-hidden="true"
                                    initial={{ rotate: 90, scale: 0.6 }}
                                    animate={{ rotate: 0, scale: 1 }}
                                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    <motion.circle
                                        cx="26" cy="26" r="23"
                                        fill="#fff0f0"
                                        stroke="#ef4444"
                                        strokeWidth="2"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                    />
                                    <motion.path
                                        fill="none"
                                        stroke="#ef4444"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M33 14 L40 14 L40 38 L33 38"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.35, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                                    />
                                    <motion.path
                                        fill="none"
                                        stroke="#ef4444"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13 26 L31 26 M23 18 L31 26 L23 34"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.45, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                    />
                                </motion.svg>
                            </div>

                            <motion.span
                                className={styles.logoutLogoText}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.9, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            >
                                VIÑO<span className={styles.logoutLogoAccent}>PLASTIC</span>
                            </motion.span>

                            <motion.p
                                className={styles.logoutMsg}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.1 }}
                            >
                                Hasta pronto
                            </motion.p>

                            <motion.div
                                className={styles.logoutCountdownBar}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.1 }}
                            >
                                <motion.div
                                    className={styles.logoutCountdownFill}
                                    initial={{ scaleX: 1 }}
                                    animate={{ scaleX: 0 }}
                                    transition={{ duration: 3.9, ease: 'linear', delay: 1.1 }}
                                    style={{ transformOrigin: 'left' }}
                                />
                            </motion.div>

                            <motion.span
                                className={styles.logoutRedirectMsg}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.3 }}
                            >
                                Cerrando sesión...
                            </motion.span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ══ UNIFIED TOP NAVBAR ═══════════════════════ */}
            <nav className={styles.navbar} aria-label="Navegación principal">
                {/* Left: brand */}
                <div className={styles.navLeft}>
                    <Link href="/induccion" className={styles.brand}>
                        <span className={styles.brandDot} aria-hidden="true" />
                        <span className={styles.brandName}>VIÑOPLASTIC</span>
                    </Link>
                </div>

                {/* Center: nav links (desktop) */}
                <div className={styles.navLinks}>
                    {items.map(item => {
                        const Icon = item.icon;
                        const active = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
                                aria-current={active ? 'page' : undefined}
                            >
                                <Icon size={15} className={styles.navLinkIcon} />
                                <span className={styles.navLinkLabel}>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* Right: unified actions bar */}
                <div className={styles.actionsBar}>
                    <ThemeToggle />
                    <span className={styles.actionsDivider} aria-hidden="true" />
                    <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={handleLogout}
                        disabled={isSigningOut}
                        aria-label="Cerrar sesión"
                        title="Cerrar sesión"
                    >
                        <LogOut size={16} />
                    </button>
                    <span className={styles.actionsDivider} aria-hidden="true" />
                    <Link href="/profile" className={styles.userChip}>
                        <div className={styles.chipAvatar}>
                            <NextImage
                                src={avatarSrc}
                                alt={firstName}
                                width={28}
                                height={28}
                                className={styles.chipAvatarImg}
                                unoptimized
                            />
                        </div>
                        <span className={styles.chipName}>{firstName}</span>
                    </Link>
                </div>
            </nav>

            {/* ══ PAGE CONTENT ═════════════════════════════ */}
            <main className={styles.content}>
                {children}
            </main>

            {/* ══ BOTTOM TABS (mobile only) ════════════════ */}
            {items.length > 1 && (
                <nav className={styles.bottomTabs} aria-label="Navegación inferior">
                    {items.map(item => {
                        const Icon = item.icon;
                        const active = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={`${styles.bottomTab} ${active ? styles.bottomTabActive : ''}`}
                                aria-current={active ? 'page' : undefined}
                            >
                                <Icon size={18} />
                                <span>{item.shortLabel}</span>
                            </Link>
                        );
                    })}
                </nav>
            )}
        </div>
    );
}
