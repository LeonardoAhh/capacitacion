"use client";

import * as React from "react";
import { LogOut, User, Moon, Sun, ChevronDown, ImagePlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import styles from './ProfileDropdown.module.css';

export default function ProfileDropdown({ className = '', onAvatarClick }) {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = React.useState(false);
    const [isSigningOut, setIsSigningOut] = React.useState(false);
    const { theme, toggleTheme } = useTheme();
    const [isMounted, setIsMounted] = React.useState(false);
    const dropdownRef = React.useRef(null);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    React.useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
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
        if (onAvatarClick) {
            onAvatarClick();
        }
    }, [onAvatarClick]);

    const getInitials = React.useCallback((name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();
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
            <button
                type="button"
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={`Menú de perfil de ${profileData.name}`}
                aria-expanded={isOpen}
                aria-haspopup="menu"
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
                <ChevronDown 
                    size={16} 
                    className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} 
                />
            </button>

            {isOpen && (
                <div className={styles.dropdown} role="menu">
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

                    <nav className={styles.menu}>
                        <Link
                            href="/profile"
                            className={styles.menuItem}
                            role="menuitem"
                            onClick={() => setIsOpen(false)}
                        >
                            <User size={16} />
                            <span>Perfil</span>
                        </Link>

                        {onAvatarClick && (
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                className={styles.menuItem}
                                role="menuitem"
                            >
                                <ImagePlus size={16} />
                                <span>Cambiar Avatar</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                toggleTheme();
                            }}
                            className={styles.menuItem}
                            role="menuitem"
                        >
                            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                            <span>Tema</span>
                            <span className={styles.themeBadge}>
                                {theme === 'dark' ? 'Oscuro' : 'Claro'}
                            </span>
                        </button>
                    </nav>

                    <div className={styles.divider} />

                    <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className={styles.signOut}
                        role="menuitem"
                    >
                        <LogOut size={16} />
                        <span>{isSigningOut ? 'Cerrando...' : 'Cerrar Sesión'}</span>
                    </button>
                </div>
            )}
        </div>
    );
}
