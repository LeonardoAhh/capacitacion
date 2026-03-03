"use client";

import * as React from "react";
import { LogOut, User, Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import styles from './ProfileDropdown.module.css';

/**
 * ProfileDropdown — Pill permanente iOS Glass
 *
 * Props opcionales para override (útil en /candidatos/dashboard):
 *   @param {string}   userName    — Sobreescribe user.name del contexto
 *   @param {string}   userAvatar  — Sobreescribe user.photoURL del contexto
 *   @param {function} onLogout    — Override del signOut del contexto
 *   @param {boolean}  showProfile — Si false, oculta el botón de /profile (default true)
 *   @param {function} onAvatarClick — Abre selector de avatar
 */
export default function ProfileDropdown({
    className = '',
    onAvatarClick,
    userName: userNameProp,
    userAvatar: userAvatarProp,
    onLogout: onLogoutProp,
    onToggleTheme,        // override para candidatos (persiste en Firestore)
    showProfile = true,
    quickAction,          // { icon, label, onClick } — acción extra de página (ej. iluo-manager)
}) {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = React.useState(false);
    const { theme, toggleTheme } = useTheme();
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => { setIsMounted(true); }, []);

    const profileData = React.useMemo(() => {
        // Props override → datos de AuthContext → fallback
        const rawName = userNameProp || user?.name || user?.displayName || "Usuario";
        // Solo el primer nombre
        const firstName = rawName.split(/\s+/)[0];
        const name = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

        return {
            name,
            avatar: userAvatarProp || user?.photoURL || user?.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'default')}`,
        };
    }, [userNameProp, userAvatarProp, user]);

    const handleSignOut = React.useCallback(async () => {
        if (isSigningOut) return;
        try {
            setIsSigningOut(true);
            if (onLogoutProp) {
                await onLogoutProp();
            } else {
                await signOut();
                router.push('/login');
            }
        } catch (err) {
            console.error('Error signing out:', err);
            setIsSigningOut(false);
        }
    }, [signOut, router, isSigningOut, onLogoutProp]);

    const getInitials = (name) =>
        name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

    if (!isMounted) {
        return (
            <div className={`${styles.pill} ${className}`}>
                <div className={styles.skeleton} />
            </div>
        );
    }

    return (
        <nav className={`${styles.pill} ${className}`} aria-label="Acciones de usuario">

            {/* Avatar + nombre */}
            <button
                type="button"
                className={styles.avatarBtn}
                onClick={onAvatarClick || undefined}
                aria-label={`Perfil de ${profileData.name}`}
                title={profileData.name}
                style={{ cursor: onAvatarClick ? 'pointer' : 'default' }}
            >
                <div className={styles.avatar}>
                    <Image
                        src={profileData.avatar}
                        alt=""
                        width={30}
                        height={30}
                        className={styles.avatarImage}
                        unoptimized={profileData.avatar.includes('dicebear.com')}
                    />
                    <span className={styles.avatarFallback}>{getInitials(profileData.name)}</span>
                </div>
                <span className={styles.triggerName}>{profileData.name}</span>
            </button>

            <span className={styles.divider} aria-hidden="true" />

            {/* Tema */}
            <button
                type="button"
                className={styles.iconBtn}
                onClick={onToggleTheme || toggleTheme}
                aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                title="Cambiar tema"
            >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Perfil — solo si showProfile=true */}
            {showProfile && (
                <Link
                    href="/profile"
                    className={styles.iconBtn}
                    aria-label="Ir a perfil"
                    title="Perfil"
                >
                    <User size={17} />
                </Link>
            )}

            {/* Acción rápida de página (ej. Nueva Competencia en iluo-manager) */}
            {quickAction && (
                <>
                    <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={quickAction.onClick}
                        aria-label={quickAction.label}
                        title={quickAction.label}
                    >
                        {quickAction.icon}
                    </button>
                </>
            )}

            <span className={styles.divider} aria-hidden="true" />

            {/* Cerrar sesión */}
            <button
                type="button"
                className={`${styles.iconBtn} ${styles.signOutBtn}`}
                onClick={handleSignOut}
                disabled={isSigningOut}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
            >
                <LogOut size={17} />
            </button>
        </nav>
    );
}