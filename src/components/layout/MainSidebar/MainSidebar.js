'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NextImage from 'next/image';
import { LogOut, LayoutDashboard, Settings, Award, GraduationCap, X, ChevronDown, ChevronRight, FileText, CheckSquare, Calendar, Users, BarChart2, BookOpen, UserCheck, Briefcase, List, FileCheck, Layers, Zap, CalendarRange } from 'lucide-react';
import styles from './MainSidebar.module.css';

export default function MainSidebar({ user, handleLogout, isOpen, onClose }) {
    const pathname = usePathname();
    const isSuperAdmin = user?.rol === 'super_admin';
    const isAdmin = user?.rol === 'admin' || user?.rol === 'super_admin';
    const isDemo = user?.rol === 'demo' || user?.email?.includes('demo');

    const [expandedMenu, setExpandedMenu] = useState(
        (pathname.startsWith('/capacitacion') || pathname.startsWith('/dashboard/candidates') || pathname.startsWith('/dashboard/programacion')) ? 'capacitacion' :
            ((pathname === '/dashboard' || pathname.startsWith('/employees')) ? 'nuevos_ingresos' : null)
    );

    const toggleMenu = (menuId) => {
        setExpandedMenu(prev => prev === menuId ? null : menuId);
    };

    const getInitialsLocal = (name) => {
        if (!name) return 'A';
        const words = name.trim().split(' ');
        if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const navItems = [
        {
            id: 'nuevos_ingresos',
            title: 'Nuevos Ingresos',
            icon: LayoutDashboard,
            href: '#',
            disabled: isDemo,
            subItems: [
                { id: 'dashboard', title: 'Dashboard', href: '/dashboard', icon: BarChart2 },
                { id: 'empleados', title: 'Empleados', href: '/employees', icon: Users },
                { id: 'postulantes', title: 'Seguimiento', href: '/dashboard/candidates', icon: Users },
                { id: 'programacion', title: 'Programación', href: '/dashboard/programacion', icon: CalendarRange }
            ]
        },
        {
            id: 'capacitacion',
            title: 'Capacitación',
            icon: Award,
            href: '#',
            disabled: isDemo,
            subItems: [
                { id: 'registro', title: 'Registro', href: '/capacitacion/registro', icon: CheckSquare },
                { id: 'plan-formacion', title: 'Plan de Formación', href: '/reports', icon: FileText },
                { id: 'empleados', title: 'Plantilla', href: '/capacitacion/empleados', icon: Users },
                { id: 'matriz', title: 'Matriz de Habilidades', href: '/capacitacion/matriz', icon: Layers },
                { id: 'catalogo', title: 'Catálogo Cursos', href: '/capacitacion/catalogo', icon: BookOpen },
                { id: 'grupos', title: 'Cursos/Grupos', href: '/capacitacion/grupos', icon: Users },
                { id: 'analisis', title: 'Cumplimiento Gral.', href: '/capacitacion/analisis', icon: BarChart2 },
                { id: 'cumplimiento', title: 'Detalle Curso', href: '/capacitacion/cumplimiento', icon: FileCheck },
                { id: 'comparacion', title: 'Puesto VS', href: '/capacitacion/comparacion', icon: List },
                { id: 'perfil', title: 'Perfil', href: '/capacitacion/perfil', icon: UserCheck },
                { id: 'promociones', title: 'Categorías', href: '/capacitacion/promociones', icon: Briefcase },
                { id: 'examen', title: 'Exámenes', href: '/capacitacion/examen', icon: FileText },
                { id: 'calendario', title: 'Calendario', href: '/capacitacion/calendario', icon: Calendar },
            ]
        },
        {
            id: 'induction',
            title: 'Más',
            icon: GraduationCap,
            href: '#',
            disabled: false,
            subItems: [
                { id: 'interactivos', title: 'Inducción', href: '/induccion', icon: Zap },
                { id: 'prototipo', title: 'Prototipo', href: '/prototipo', icon: Zap },
                { id: 'mural', title: 'Mural', href: '/mural', icon: Zap },
                { id: 'presentacion', title: 'Presentación', href: '/presentacion', icon: Zap },
            ]
        },
    ];

    if (isSuperAdmin) {
        navItems.push({
            id: 'iluo',
            title: 'ILUO Manager',
            icon: Settings,
            href: '/iluo-manager',
            disabled: false,
        });
    }

    // Filtrar para Instructores: solo ver Inducción y Prototipo (sin Mural ni Presentación)
    const isInstructor = user?.rol === 'instructor' || user?.rol === 'Instructor';
    let displayNavItems = navItems;

    if (isInstructor) {
        displayNavItems = navItems
            .filter(item => item.id === 'induction')
            .map(item => ({
                ...item,
                subItems: item.subItems?.filter(sub =>
                    sub.id !== 'mural' && sub.id !== 'presentacion'
                ),
            }));
    }

    const firstName = (user?.nombre || user?.nickname || user?.name || 'Admin').split(' ')[0];

    return (
        <>
            <div
                className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
                aria-label="Navegación Principal"
            >
                <div className={styles.sidebarTop}>
                    <div className={styles.sidebarBrand}>
                        <div className={styles.sidebarBrandDot} aria-hidden="true" />
                        <h2 className={styles.sidebarBrandName}>VIÑOPLASTIC</h2>
                    </div>

                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Cerrar menú"
                        type="button"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <nav className={styles.sidebarNav} aria-label="Módulos del Sistema">
                    <span className={styles.sidebarLabel} aria-hidden="true">Accesos</span>

                    {displayNavItems.map((item) => {
                        const Icon = item.icon;
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isExpanded = expandedMenu === item.id;
                        const isActive = pathname === item.href || (hasSubItems && pathname.startsWith(item.id === 'capacitacion' ? '/capacitacion' : item.href));

                        return (
                            <div key={item.id} className={styles.navGroup}>
                                <Link
                                    href={hasSubItems ? '#' : (item.disabled ? '#' : item.href)}
                                    onClick={(e) => {
                                        if (item.disabled) {
                                            e.preventDefault();
                                        } else if (hasSubItems) {
                                            e.preventDefault();
                                            toggleMenu(item.id);
                                        } else {
                                            onClose && onClose();
                                        }
                                    }}
                                    className={`
                                        ${styles.sidebarItem} 
                                        ${isActive && !hasSubItems ? styles.active : ''} 
                                        ${item.disabled ? styles.disabled : ''}
                                        ${hasSubItems && isExpanded ? styles.expandedParent : ''}
                                    `}
                                    aria-current={isActive && !hasSubItems ? 'page' : undefined}
                                    aria-disabled={item.disabled}
                                >
                                    <span className={styles.sidebarItemLeft}>
                                        <span className={styles.sidebarItemIcon} aria-hidden="true">
                                            <Icon size={16} />
                                        </span>
                                        {item.title}
                                    </span>
                                    {hasSubItems && (
                                        <span className={styles.chevronIcon}>
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </span>
                                    )}
                                </Link>

                                {hasSubItems && (
                                    <div className={`${styles.subMenu} ${isExpanded ? styles.subMenuOpen : ''}`}>
                                        {item.subItems.map(sub => {
                                            const SubIcon = sub.icon;
                                            const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                                            return (
                                                <Link
                                                    key={sub.id}
                                                    href={sub.href}
                                                    onClick={() => onClose && onClose()}
                                                    className={`
                                                        ${styles.subItem}
                                                        ${isSubActive ? styles.subItemActive : ''}
                                                    `}
                                                >
                                                    <span className={styles.subItemIcon}>
                                                        {SubIcon && <SubIcon size={14} />}
                                                    </span>
                                                    {sub.title}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className={styles.sidebarProfile}>
                    <Link
                        href="/profile"
                        className={styles.sidebarAvatarBtn}
                        title="Mi Perfil"
                        onClick={onClose}
                    >
                        <div className={styles.sidebarAvatar} aria-hidden="true">
                            <NextImage
                                src={
                                    user?.photoURL ||
                                    user?.avatar ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || user?.id || 'admin')}`
                                }
                                alt=""
                                width={32}
                                height={32}
                                className={styles.sidebarAvatarImage}
                                unoptimized
                            />
                            <span className={styles.sidebarAvatarFallback} aria-hidden="true">
                                {getInitialsLocal(user?.nombre || user?.nickname || user?.name)}
                            </span>
                        </div>
                        <div className={styles.sidebarUserDetails}>
                            <span className={styles.sidebarUserName}>{firstName}</span>
                        </div>
                    </Link>

                    <div className={styles.sidebarProfileActions}>
                        <button
                            type="button"
                            className={`${styles.sidebarIconBtn} ${styles.sidebarLogoutBtn}`}
                            onClick={handleLogout}
                            aria-label="Cerrar sesión"
                            title="Cerrar sesión"
                        >
                            <LogOut size={16} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
