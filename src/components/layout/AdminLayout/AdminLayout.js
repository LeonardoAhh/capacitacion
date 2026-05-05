'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import styles from './AdminLayout.module.css';
import { LogOut, GraduationCap, Trophy, User, Moon, Sun, ChevronDown } from 'lucide-react';

const NAV_ITEMS = [
    { id: 'induccion', label: 'Presentaciones Cursos', shortLabel: 'Cursos', href: '/induccion', icon: GraduationCap },
    { id: 'mural', label: 'Mural Resultados', shortLabel: 'Mural', href: '/mural', icon: Trophy },
];

const INSTRUCTOR_ITEMS = [
    { id: 'induccion', label: 'Presentaciones Cursos', shortLabel: 'Cursos', href: '/induccion', icon: GraduationCap },
];

export default function AdminLayout({ children, title = 'Dashboard' }) {
    const { user, loading, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const isInstructor = user?.rol === 'instructor' || user?.rol === 'Instructor';
    const items = isInstructor ? INSTRUCTOR_ITEMS : NAV_ITEMS;
    const isDark = theme === 'dark';

    const handleLogout = async () => {
        setMenuOpen(false);
        if (isSigningOut) return;
        try {
            setIsSigningOut(true);
            await new Promise(resolve => setTimeout(resolve, 5000));
            await signOut();
        } catch { /* ignorar errores de cierre */ }
        router.push('/');
    };

    const handleToggleTheme = useCallback(() => {
        toggleTheme();
    }, [toggleTheme]);

    useEffect(() => {
        if (!loading && !user && !isSigningOut) router.replace('/login');
    }, [loading, user, router, isSigningOut]);

    useEffect(() => {
        if (!menuOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        const handleEscape = (e) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [menuOpen]);

    if (loading || !user) {
        return (
            <div className={styles.loadingPage}>
                <div className={styles.loadingSpinner} />
            </div>
        );
    }

    const firstName = (user?.nombre || user?.nickname || user?.name || 'Admin').split(' ')[0];
    const userEmail = user?.email || '';
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

                {/* Right: user menu */}
                <div className={styles.userMenu} ref={menuRef}>
                    <button
                        type="button"
                        className={`${styles.userPill} ${menuOpen ? styles.userPillOpen : ''}`}
                        onClick={() => setMenuOpen(o => !o)}
                        aria-expanded={menuOpen}
                        aria-haspopup="true"
                    >
                        <div className={styles.pillAvatar}>
                            <NextImage
                                src={avatarSrc}
                                alt={firstName}
                                width={28}
                                height={28}
                                className={styles.pillAvatarImg}
                                unoptimized
                            />
                        </div>
                        <span className={styles.pillName}>{firstName}</span>
                        <ChevronDown size={14} className={`${styles.pillChevron} ${menuOpen ? styles.pillChevronOpen : ''}`} />
                    </button>

                    {/* Dropdown */}
                    <div className={`${styles.dropdown} ${menuOpen ? styles.dropdownOpen : ''}`} role="menu">
                        {/* User header */}
                        <div className={styles.dropdownHeader}>
                            <div className={styles.dropdownAvatar}>
                                <NextImage
                                    src={avatarSrc}
                                    alt={firstName}
                                    width={40}
                                    height={40}
                                    className={styles.dropdownAvatarImg}
                                    unoptimized
                                />
                            </div>
                            <div className={styles.dropdownUserInfo}>
                                <span className={styles.dropdownUserName}>{firstName}</span>
                                {userEmail && <span className={styles.dropdownUserEmail}>{userEmail}</span>}
                            </div>
                        </div>

                        <div className={styles.dropdownDivider} />

                        {/* Menu items */}
                        <Link
                            href="/profile"
                            className={styles.dropdownItem}
                            role="menuitem"
                            onClick={() => setMenuOpen(false)}
                        >
                            <User size={16} />
                            <span>Perfil</span>
                        </Link>

                        <button
                            type="button"
                            className={styles.dropdownItem}
                            role="menuitem"
                            onClick={handleToggleTheme}
                        >
                            {isDark ? <Sun size={16} /> : <Moon size={16} />}
                            <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
                        </button>

                        <div className={styles.dropdownDivider} />

                        <button
                            type="button"
                            className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
                            role="menuitem"
                            onClick={handleLogout}
                            disabled={isSigningOut}
                        >
                            <LogOut size={16} />
                            <span>Cerrar sesión</span>
                        </button>
                    </div>
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
