"use client";

import * as React from "react";
import { LogOut, User, Moon, Sun, ChevronDown, ImagePlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import styles from './ProfileDropdown.module.css';

const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.96, y: -6, transformOrigin: 'top right' },
    show: {
        opacity: 1, scale: 1, y: 0,
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
        opacity: 0, scale: 0.96, y: -6,
        transition: { duration: 0.16, ease: 'easeIn' },
    },
};

const menuStagger = {
    show: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
};

const menuItem = {
    hidden: { opacity: 0, x: -6 },
    show: { opacity: 1, x: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
};

export default function ProfileDropdown({ className = '', onAvatarClick }) {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = React.useState(false);
    const [isSigningOut, setIsSigningOut] = React.useState(false);
    const { theme, toggleTheme } = useTheme();
    const [isMounted, setIsMounted] = React.useState(false);
    const dropdownRef = React.useRef(null);

    React.useEffect(() => { setIsMounted(true); }, []);

    React.useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    React.useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => e.key === 'Escape' && setIsOpen(false);
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen]);

    const profileData = React.useMemo(() => ({
        name: user?.name || user?.displayName || "Usuario",
        email: user?.email || "",
        avatar: user?.photoURL || user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'default')}`,
        role: user?.rol === 'super_admin' ? 'Admin' : user?.rol === 'demo' ? 'Demo' : 'Usuario',
    }), [user]);

    const handleSignOut = React.useCallback(async () => {
        if (isSigningOut) return;
        try {
            setIsSigningOut(true);
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setIsSigningOut(false);
        }
    }, [signOut, router, isSigningOut]);

    const handleAvatarClick = React.useCallback(() => {
        setIsOpen(false);
        if (onAvatarClick) onAvatarClick();
    }, [onAvatarClick]);

    const getInitials = React.useCallback((name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }, []);

    if (!isMounted) {
        return (
            <div className={`${styles.container} ${className}`}>
                <div className={styles.skeleton} />
            </div>
        );
    }

    return (
        <div className={`${styles.container} ${className}`} ref={dropdownRef}>
            <motion.button
                type="button"
                className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Menú de perfil de ${profileData.name}`}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
            >
                <div className={styles.avatar}>
                    <Image
                        src={profileData.avatar}
                        alt=""
                        width={32}
                        height={32}
                        className={styles.avatarImage}
                        unoptimized={profileData.avatar.includes('dicebear.com')}
                    />
                    <span className={styles.avatarFallback}>{getInitials(profileData.name)}</span>
                </div>
                <div className={styles.userInfo}>
                    <span className={styles.userName}>{profileData.name}</span>
                    <span className={styles.userRole}>{profileData.role}</span>
                </div>
                <motion.span
                    className={styles.chevron}
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                    <ChevronDown size={14} />
                </motion.span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.dropdown}
                        role="menu"
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                    >
                        {/* Header */}
                        <div className={styles.dropdownHeader}>
                            <div className={styles.headerAvatar}>
                                <Image
                                    src={profileData.avatar}
                                    alt=""
                                    width={48}
                                    height={48}
                                    className={styles.headerAvatarImage}
                                    unoptimized={profileData.avatar.includes('dicebear.com')}
                                />
                            </div>
                            <div className={styles.headerInfo}>
                                <span className={styles.headerName}>{profileData.name}</span>
                                <span className={styles.headerEmail}>{profileData.email}</span>
                            </div>
                        </div>

                        <div className={styles.divider} />

                        {/* Menu items con stagger */}
                        <motion.nav
                            className={styles.menu}
                            variants={menuStagger}
                            initial="hidden"
                            animate="show"
                        >
                            <motion.div variants={menuItem}>
                                <Link
                                    href="/profile"
                                    className={styles.menuItem}
                                    role="menuitem"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <User size={15} />
                                    <span>Perfil</span>
                                </Link>
                            </motion.div>

                            {onAvatarClick && (
                                <motion.div variants={menuItem}>
                                    <button
                                        type="button"
                                        onClick={handleAvatarClick}
                                        className={styles.menuItem}
                                        role="menuitem"
                                    >
                                        <ImagePlus size={15} />
                                        <span>Cambiar Avatar</span>
                                    </button>
                                </motion.div>
                            )}

                            <motion.div variants={menuItem}>
                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    className={styles.menuItem}
                                    role="menuitem"
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={theme}
                                            initial={{ rotate: -45, scale: 0.5, opacity: 0 }}
                                            animate={{ rotate: 0, scale: 1, opacity: 1 }}
                                            exit={{ rotate: 45, scale: 0.5, opacity: 0 }}
                                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                            style={{ display: 'flex' }}
                                        >
                                            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                                        </motion.span>
                                    </AnimatePresence>
                                    <span>Tema</span>
                                    <span className={styles.themeBadge}>
                                        {theme === 'dark' ? 'Oscuro' : 'Claro'}
                                    </span>
                                </button>
                            </motion.div>
                        </motion.nav>

                        <div className={styles.divider} />

                        <motion.button
                            type="button"
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            className={styles.signOut}
                            role="menuitem"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.2 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <LogOut size={15} />
                            <span>{isSigningOut ? 'Cerrando...' : 'Cerrar Sesión'}</span>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}