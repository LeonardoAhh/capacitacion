"use client";

import * as React from "react";
import { Settings, CreditCard, FileText, LogOut, User, Moon, Sun } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Gemini from "../icons/gemini";
import styles from './ProfileDropdown.module.css';

// Hook personalizado para manejo de temas
function useTheme() {
    const [theme, setTheme] = React.useState('dark');
    const [isLoaded, setIsLoaded] = React.useState(false);

    React.useEffect(() => {
        // Solo ejecutar en el cliente para evitar hydration mismatch
        if (typeof window === 'undefined') return;

        try {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

            setTheme(initialTheme);
            document.documentElement.setAttribute('data-theme', initialTheme);
            setIsLoaded(true);

            // Listener para cambios en preferencias del sistema
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                if (!localStorage.getItem('theme')) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    setTheme(newTheme);
                    document.documentElement.setAttribute('data-theme', newTheme);
                }
            };

            mediaQuery.addEventListener('change', handleChange);

            // Cleanup
            return () => mediaQuery.removeEventListener('change', handleChange);
        } catch (error) {
            console.warn('Error initializing theme:', error);
            setIsLoaded(true);
        }
    }, []);

    const toggleTheme = React.useCallback(() => {
        try {
            const newTheme = theme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        } catch (error) {
            console.warn('Error saving theme:', error);
        }
    }, [theme]);

    return { theme, toggleTheme, isLoaded };
}

export default function ProfileDropdown({ className = '', ...props }) {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = React.useState(false);
    const [isSigningOut, setIsSigningOut] = React.useState(false);
    const { theme, toggleTheme, isLoaded } = useTheme();

    // Memoizar datos del perfil para evitar recreación
    const profileData = React.useMemo(() => ({
        name: user?.name || user?.displayName || "Usuario",
        email: user?.email || "",
        avatar: user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'default')}`,
        subscription: user?.rol === 'super_admin' ? 'ADMIN' : 'PRO',
        model: "Sistema Vertx",
    }), [user]);

    // Manejar cierre de sesión con estados de carga y errores
    const handleSignOut = React.useCallback(async () => {
        if (isSigningOut) return;

        try {
            setIsSigningOut(true);
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
            // Aquí podrías mostrar un toast de error
        } finally {
            setIsSigningOut(false);
        }
    }, [signOut, router, isSigningOut]);

    // Memoizar items del menú
    const menuItems = React.useMemo(() => [
        {
            label: "Perfil",
            href: "/profile",
            icon: <User className={styles.menuItemIcon} />,
        },
        {
            label: "Rol",
            value: profileData.subscription,
            href: "/subscription",
            icon: <CreditCard className={styles.menuItemIcon} />,
            badgeType: "purple"
        },
    ], [profileData.subscription]);

    // No renderizar hasta que el tema esté cargado (evitar flash)
    if (!isLoaded) {
        return (
            <div className={`${styles.container} ${styles.loading} ${className || ''}`}>
                <div className={styles.loadingSkeleton} />
            </div>
        );
    }

    return (
        <div className={`${styles.container} ${className || ''}`} {...props}>
            <DropdownMenu onOpenChange={setIsOpen}>
                <div className="group relative">
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className={styles.triggerButton}
                            aria-label={`Menú de perfil de ${profileData.name}`}
                            aria-expanded={isOpen}
                            aria-haspopup="menu"
                        >
                            <div className={styles.userInfo}>
                                <div className={styles.userName}>
                                    {profileData.name}
                                </div>
                                <div className={styles.userEmail}>
                                    {profileData.email}
                                </div>
                            </div>
                            <div className={styles.avatarContainer}>
                                <div className={styles.avatarRing}>
                                    <div className={styles.avatarInner}>
                                        <Image
                                            src={profileData.avatar}
                                            alt={`Avatar de ${profileData.name}`}
                                            width={36}
                                            height={36}
                                            className={styles.avatarImage}
                                            priority={false}
                                            unoptimized={profileData.avatar.includes('dicebear.com')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </button>
                    </DropdownMenuTrigger>

                    {/* Indicador de línea curvada */}
                    <div
                        className={`${styles.indicator} ${isOpen ? styles.indicatorOpen : ''}`}
                        aria-hidden="true"
                    >
                        <svg
                            width="12"
                            height="24"
                            viewBox="0 0 12 24"
                            fill="none"
                            className={`${styles.indicatorIcon} ${isOpen ? styles.indicatorIconOpen : ''}`}
                        >
                            <path
                                d="M2 4C6 8 6 16 2 20"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                fill="none"
                            />
                        </svg>
                    </div>

                    <DropdownMenuContent
                        align="end"
                        sideOffset={4}
                        className={styles.menuContent}
                        role="menu"
                        aria-label="Menú de opciones del perfil"
                    >
                        <div className={styles.menuItems}>
                            {menuItems.map((item) => (
                                <DropdownMenuItem key={item.label} asChild>
                                    <Link
                                        href={item.href}
                                        className={styles.menuItem}
                                        role="menuitem"
                                    >
                                        <div className={styles.menuItemContent}>
                                            {item.icon}
                                            <span className={styles.menuItemLabel}>
                                                {item.label}
                                            </span>
                                        </div>
                                        {item.value && (
                                            <span
                                                className={`${styles.menuItemBadge} ${item.badgeType === 'blue' ? styles.badgeBlue : styles.badgePurple
                                                    }`}
                                                aria-label={`${item.label}: ${item.value}`}
                                            >
                                                {item.value}
                                            </span>
                                        )}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </div>

                        <DropdownMenuSeparator className={styles.separator} />

                        {/* Toggle de Tema */}
                        <DropdownMenuItem asChild>
                            <button
                                type="button"
                                onClick={toggleTheme}
                                className={styles.themeToggle}
                                role="menuitem"
                                aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
                            >
                                <div className={styles.menuItemContent}>
                                    {theme === 'dark' ? (
                                        <Sun className={styles.menuItemIcon} />
                                    ) : (
                                        <Moon className={styles.menuItemIcon} />
                                    )}
                                    <span className={styles.menuItemLabel}>
                                        Tema
                                    </span>
                                </div>
                                <div className={styles.themeIndicator}>
                                    <div
                                        className={`${styles.themeToggleSwitch} ${theme === 'dark' ? styles.themeDark : styles.themeLight
                                            }`}
                                        aria-hidden="true"
                                    >
                                        <div className={styles.themeToggleThumb} />
                                    </div>
                                </div>
                            </button>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className={styles.separator} />

                        <DropdownMenuItem asChild>
                            <button
                                type="button"
                                onClick={handleSignOut}
                                disabled={isSigningOut}
                                className={`${styles.signOutButton} ${isSigningOut ? styles.signOutButtonLoading : ''}`}
                                role="menuitem"
                                aria-label="Cerrar sesión"
                            >
                                <LogOut
                                    className={`${styles.signOutIcon} ${isSigningOut ? styles.spinning : ''}`}
                                />
                                <span className={styles.signOutText}>
                                    {isSigningOut ? 'Cerrando...' : 'Cerrar Sesión'}
                                </span>
                            </button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </div>
            </DropdownMenu>
        </div>
    );
}
