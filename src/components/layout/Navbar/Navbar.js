'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'next/navigation';
import LogoVinoPlastic from '@/components/layout/Logo/LogoVinoPlastic';
import MotivationalWidget from './MotivationalWidget';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Navbar.module.css';

/* ─── Iconos SVG inline ─────────────────────────────── */


function MenuIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}

function LogoutIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    );
}

/* ─── Helpers ───────────────────────────────────────── */

function getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

/* ─── Componente principal ──────────────────────────── */

export default function Navbar() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const drawerRef = useRef(null);

    const profileData = {
        name: user?.name || user?.displayName || 'Usuario',
        email: user?.email || '',
        avatar: user?.photoURL || user?.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'default')}`,
        role: user?.rol === 'super_admin' ? 'Super Admin'
            : user?.rol === 'admin' ? 'Admin'
            : user?.rol === 'instructor' ? 'Instructor'
            : 'Usuario',
    };

    /* Cerrar drawer con Escape */
    useEffect(() => {
        if (!drawerOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setDrawerOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [drawerOpen]);

    /* Bloquear scroll del body cuando el drawer está abierto */
    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [drawerOpen]);

    const handleSignOut = useCallback(async () => {
        if (isSigningOut) return;
        try {
            setIsSigningOut(true);
            setDrawerOpen(false);
            // Esperar 5s PRIMERO para que la animación complete,
            // luego sign out. Si signOut corre antes, onAuthStateChanged
            // dispara user=null → page guards redirigen a /login inmediatamente.
            await new Promise(resolve => setTimeout(resolve, 5000));
            const result = await signOut();
            if (result?.success !== false) router.push('/');
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
        } finally {
            setIsSigningOut(false);
        }
    }, [signOut, router, isSigningOut]);

    return (
        <>
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
                            {/* Rings + SVG logout icon — mirrors login checkmark */}
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
                                    {/* Door bracket — right side */}
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
                                    {/* Exit arrow — right */}
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

            {/* ── Pill flotante ── */}
            <nav
                className={styles.pill}
                role="navigation"
                aria-label="Barra de navegación principal"
            >
                {/* Logo */}
                <div className={styles.logoWrap}>
                    <LogoVinoPlastic
                        style={{ height: '36px', width: 'auto', color: 'var(--text-primary)', minWidth: '80px' }}
                    />
                </div>

                {/* Widget motivacional (solo admin, oculto en móvil small) */}
                <div className={styles.widgetWrap}>
                    <MotivationalWidget />
                </div>

                <div className={styles.controls}>

                    {/* Botón menú / avatar */}
                    {user ? (
                        <button
                            className={styles.avatarBtn}
                            onClick={() => setDrawerOpen(true)}
                            aria-label="Abrir menú de usuario"
                            aria-expanded={drawerOpen}
                            aria-haspopup="dialog"
                        >
                            <div className={styles.avatarRing}>
                                <Image
                                    src={profileData.avatar}
                                    alt=""
                                    width={30}
                                    height={30}
                                    className={styles.avatarImg}
                                    unoptimized={profileData.avatar.includes('dicebear.com')}
                                />
                                <span className={styles.avatarFallback}>
                                    {getInitials(profileData.name)}
                                </span>
                            </div>
                            <span className={styles.menuIconWrap}>
                                <MenuIcon />
                            </span>
                        </button>
                    ) : (
                        <button
                            className={styles.iconBtn}
                            onClick={() => setDrawerOpen(true)}
                            aria-label="Abrir menú"
                        >
                            <MenuIcon />
                        </button>
                    )}
                </div>
            </nav>

            {/* ── Overlay ── */}
            <div
                className={`${styles.overlay} ${drawerOpen ? styles.overlayVisible : ''}`}
                onClick={() => setDrawerOpen(false)}
                aria-hidden="true"
            />

            {/* ── Drawer ── */}
            <div
                ref={drawerRef}
                className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label="Menú de usuario"
            >
                {/* Handle */}
                <div className={styles.drawerHandle} aria-hidden="true" />

                {/* Header del drawer */}
                {user && (
                    <div className={styles.drawerHeader}>
                        <div className={styles.drawerAvatar}>
                            <Image
                                src={profileData.avatar}
                                alt=""
                                width={52}
                                height={52}
                                className={styles.drawerAvatarImg}
                                unoptimized={profileData.avatar.includes('dicebear.com')}
                            />
                        </div>
                        <div className={styles.drawerUserInfo}>
                            <span className={styles.drawerName}>{profileData.name}</span>
                            <span className={styles.drawerEmail}>{profileData.email}</span>
                            <span className={styles.drawerRole}>{profileData.role}</span>
                        </div>
                        <button
                            className={styles.closeBtn}
                            onClick={() => setDrawerOpen(false)}
                            aria-label="Cerrar menú"
                        >
                            <CloseIcon />
                        </button>
                    </div>
                )}

                {/* Widget motivacional en el drawer (visible en móvil) */}
                <div className={styles.drawerWidget}>
                    <MotivationalWidget />
                </div>

                <div className={styles.drawerDivider} aria-hidden="true" />

                {/* Menú items */}
                <nav className={styles.drawerMenu} aria-label="Opciones de usuario">
                    <Link
                        href="/profile"
                        className={styles.drawerItem}
                        onClick={() => setDrawerOpen(false)}
                    >
                        <span className={styles.drawerItemIcon}><UserIcon /></span>
                        <span>Mi Perfil</span>
                    </Link>


                </nav>

                <div className={styles.drawerDivider} aria-hidden="true" />

                {/* Cerrar sesión */}
                <button
                    className={styles.drawerSignOut}
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                >
                    <LogoutIcon />
                    <span>{isSigningOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
                </button>
            </div>
        </>
    );
}
