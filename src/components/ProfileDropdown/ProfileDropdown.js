"use client";

import * as React from "react";
import { Settings, CreditCard, FileText, LogOut, User } from "lucide-react";
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

export default function ProfileDropdown({ className, ...props }) {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = React.useState(false);

    // Usar datos del usuario autenticado
    const profileData = {
        name: user?.name || user?.displayName || "Usuario",
        email: user?.email || "",
        avatar: user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`,
        subscription: user?.rol === 'super_admin' ? 'ADMIN' : 'PRO',
        model: "Sistema Vertx",
    };

    const handleSignOut = async () => {
        await signOut();
        router.push('/login');
    };

    const menuItems = [
        {
            label: "Perfil",
            href: "/profile",
            icon: <User className={styles.menuItemIcon} />,
        },
        {
            label: "Sistema",
            value: profileData.model,
            href: "#",
            icon: <Gemini className={styles.menuItemIcon} />,
            badgeType: "blue"
        },
        {
            label: "Rol",
            value: profileData.subscription,
            href: "#",
            icon: <CreditCard className={styles.menuItemIcon} />,
            badgeType: "purple"
        },
    ];

    return (
        <div className={`${styles.container} ${className || ''}`} {...props}>
            <DropdownMenu onOpenChange={setIsOpen}>
                <div className="group relative">
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className={styles.triggerButton}
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
                                            alt={profileData.name}
                                            width={36}
                                            height={36}
                                            className={styles.avatarImage}
                                        />
                                    </div>
                                </div>
                            </div>
                        </button>
                    </DropdownMenuTrigger>

                    {/* Bending line indicator */}
                    <div className={`${styles.indicator} ${isOpen ? styles.indicatorOpen : ''}`}>
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
                    >
                        <div className={styles.menuItems}>
                            {menuItems.map((item) => (
                                <DropdownMenuItem key={item.label} asChild>
                                    <Link href={item.href} className={styles.menuItem}>
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
                                            >
                                                {item.value}
                                            </span>
                                        )}
                                    </Link>
                                </DropdownMenuItem>
                            ))}
                        </div>

                        <div className={styles.separator} />

                        <DropdownMenuItem asChild>
                            <button
                                type="button"
                                onClick={handleSignOut}
                                className={styles.signOutButton}
                            >
                                <LogOut className={styles.signOutIcon} />
                                <span className={styles.signOutText}>
                                    Cerrar Sesión
                                </span>
                            </button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </div>
            </DropdownMenu>
        </div>
    );
}
