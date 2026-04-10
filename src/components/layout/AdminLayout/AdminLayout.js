'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NextImage from 'next/image';
import MainSidebar from '@/components/layout/MainSidebar/MainSidebar';
import { destroySession } from '@/lib/sessionApi';
import styles from './AdminLayout.module.css';
import { Menu, PanelLeft, LayoutDashboard } from 'lucide-react';

function getRoleLabel(rol) {
    const map = { super_admin: 'Super Admin', rh: 'RRHH', instructor: 'Instructor', demo: 'Demo' };
    return map[rol] || rol || 'Usuario';
}

export default function AdminLayout({ children, title = 'Dashboard' }) {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut();
            await destroySession();
        } catch { /* ignorar errores de cierre */ }
        router.push('/');
    };

    useEffect(() => {
        if (!loading && !user) router.replace('/login');
    }, [loading, user, router]);

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
            <MainSidebar
                user={user}
                handleLogout={handleLogout}
                isOpen={isMobileOpen}
                onClose={() => setIsMobileOpen(false)}
                isCollapsed={isCollapsed}
            />

            <div className={styles.main}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerLeft}>
                        {/* Desktop: toggle collapse */}
                        <button
                            className={`${styles.iconBtn} ${styles.desktopOnly}`}
                            onClick={() => setIsCollapsed(p => !p)}
                            aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
                            type="button"
                        >
                            <PanelLeft size={18} />
                        </button>
                        {/* Mobile: open drawer */}
                        <button
                            className={`${styles.iconBtn} ${styles.mobileOnly}`}
                            onClick={() => setIsMobileOpen(true)}
                            aria-label="Abrir menú"
                            type="button"
                        >
                            <Menu size={18} />
                        </button>

                        <div className={styles.headerDivider} />

                        {/* Breadcrumb */}
                        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                            <Link href="/dashboard" className={styles.breadcrumbHome}>
                                <LayoutDashboard size={14} />
                            </Link>
                            {title !== 'Dashboard' && (
                                <>
                                    <span className={styles.breadcrumbSep}>/</span>
                                    <span className={styles.breadcrumbCurrent}>{title}</span>
                                </>
                            )}
                        </nav>
                    </div>

                    <div className={styles.headerRight}>
                        <Link href="/profile" className={styles.userChip}>
                            <div className={styles.chipAvatar}>
                                <NextImage
                                    src={avatarSrc}
                                    alt={firstName}
                                    width={24}
                                    height={24}
                                    className={styles.chipAvatarImg}
                                    unoptimized
                                />
                            </div>
                            <span className={styles.chipName}>{firstName}</span>
                        </Link>
                    </div>
                </header>

                {/* Page content */}
                <main className={styles.content}>
                    {children}
                </main>
            </div>
        </div>
    );
}
