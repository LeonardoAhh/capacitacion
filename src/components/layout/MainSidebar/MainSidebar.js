'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NextImage from 'next/image';
import {
    Users, Zap, FileCheck, UserCheck, LayoutDashboard,
    LogOut, X, GraduationCap, Trophy,
} from 'lucide-react';
import styles from './MainSidebar.module.css';

const NAV_ITEMS = [
    // { id: 'empleados',    label: 'Plantilla Activa',    href: '/plantilla',    icon: Users },
    // { id: 'perfil',       label: 'Detalle Empleado',  href: '/detalle',       icon: UserCheck },
    { id: 'induccion',    label: 'Presentaciones Cursos', href: '/induccion',                 icon: GraduationCap },
    { id: 'mural',        label: 'Mural Resultados',    href: '/mural',                     icon: Trophy },
    { id: 'asistencia',   label: 'Registro de Asistencia',         href: '/asistencia',          icon: LayoutDashboard },
];

const INSTRUCTOR_ITEMS = [
    { id: 'induccion', label: 'Presentaciones Cursos', href: '/induccion', icon: GraduationCap },
];

function getRoleLabel(rol) {
    const map = { super_admin: 'Super Admin', admin: 'Admin', instructor: 'Instructor' };
    return map[rol] || rol || 'Usuario';
}

export default function MainSidebar({ user, handleLogout, isOpen, onClose, isCollapsed }) {
    const pathname = usePathname();
    const isInstructor = user?.rol === 'instructor' || user?.rol === 'Instructor';

    const items = isInstructor ? INSTRUCTOR_ITEMS : NAV_ITEMS;

    const firstName = (user?.nombre || user?.nickname || user?.name || 'Admin').split(' ')[0];
    const avatarSeed = user?.avatarSeed || user?.email || 'admin';
    const avatarStyle = user?.avatarStyle || 'lorelei';
    const avatarSrc = user?.photoURL || user?.avatar ||
        `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    const puesto = user?.puesto || getRoleLabel(user?.rol);

    return (
        <>
            <div
                className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />
            <aside
                className={[
                    styles.sidebar,
                    isOpen ? styles.open : '',
                    isCollapsed ? styles.collapsed : '',
                ].join(' ')}
                aria-label="Navegación"
            >
                {/* Brand */}
                <div className={styles.brand}>
                    <div className={styles.brandInner}>
                        <div className={styles.brandDot} aria-hidden="true" />
                        {!isCollapsed && (
                            <span className={styles.brandName}>Viñoplastic</span>
                        )}
                    </div>
                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Cerrar menú"
                        type="button"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Nav */}
                <nav className={styles.nav} aria-label="Módulos">
                    {items.map(item => {
                        const Icon = item.icon;
                        const active = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={[
                                    styles.navItem,
                                    active ? styles.active : '',
                                ].join(' ')}
                                onClick={() => onClose?.()}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <span className={styles.navIcon}>
                                    <Icon size={16} />
                                </span>
                                <span className={styles.navLabel}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className={styles.footer}>
                    <div className={styles.separator} />
                    <button
                        className={styles.logoutBtn}
                        onClick={handleLogout}
                        aria-label="Cerrar sesión"
                        title="Cerrar sesión"
                        type="button"
                    >
                        <LogOut size={15} />
                        {!isCollapsed && <span>Cerrar sesión</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
