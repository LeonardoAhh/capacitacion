'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NextImage from 'next/image';
import {
    LogOut, X, ChevronDown,
    Users, CheckSquare, Calendar, BarChart2, BookOpen,
    UserCheck, Briefcase, FileText, FileCheck, Layers,
    Zap, CalendarRange, LayoutDashboard, Award, GraduationCap,
} from 'lucide-react';
import styles from './MainSidebar.module.css';

const NAV_SECTIONS = [
    {
        id: 'ingresos',
        label: 'Nuevos Ingresos',
        icon: LayoutDashboard,
        items: [
            { id: 'empleados', label: 'Candidatos', href: '/employees', icon: Users },
            { id: 'candidates', label: 'Control App', href: '/candidates', icon: Users },
            { id: 'programacion', label: 'Programar Curso', href: '/programacion', icon: CalendarRange },
            { id: 'contratos', label: 'Contratos', href: '/contratos', icon: FileText },
        ],
    },
    {
        id: 'capacitacion',
        label: 'Capacitación',
        icon: Award,
        items: [
            { id: 'registro', label: 'Registro Cursos', href: '/capacitacion/registro', icon: CheckSquare },
            { id: 'plantilla', label: 'Personal Activo', href: '/capacitacion/empleados', icon: Users },
            { id: 'matriz', label: 'Matriz de Habilidades', href: '/capacitacion/matriz', icon: Layers },
            { id: 'catalogo', label: 'Catálogo Cursos', href: '/capacitacion/catalogo', icon: BookOpen },
            { id: 'analisis', label: 'Cumplimiento Gral.', href: '/capacitacion/analisis', icon: BarChart2 },
            { id: 'cumplimiento', label: 'Detalle Curso', href: '/capacitacion/cumplimiento', icon: FileCheck },
            { id: 'perfil', label: 'Detalle Individual', href: '/capacitacion/perfil', icon: UserCheck },
            { id: 'categorias', label: 'Control Categorías', href: '/capacitacion/promociones', icon: Briefcase },
            { id: 'examenes', label: 'Exámenes', href: '/capacitacion/examen', icon: FileText },
            { id: 'calendario', label: 'Calendario', href: '/capacitacion/calendario', icon: Calendar },
        ],
    },
    {
        id: 'recursos',
        label: 'Inducción',
        icon: GraduationCap,
        items: [
            { id: 'induccion', label: 'Material Cursos', href: '/induccion', icon: Zap },
            { id: 'prototipo', label: 'Exámen Digital', href: '/prototipo', icon: Zap },
            { id: 'mural', label: 'Resultados Mural', href: '/mural', icon: Zap },
        ],
    },
];

const INSTRUCTOR_SECTIONS = [
    {
        id: 'recursos',
        label: 'Inducción',
        icon: GraduationCap,
        items: [
            { id: 'induccion', label: 'Material Cursos', href: '/induccion', icon: Zap },
            { id: 'prototipo', label: 'Exámen Digital', href: '/prototipo', icon: Zap },
        ],
    },
];

function getInitials(name = '') {
    const words = name.trim().split(' ');
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase() || 'A';
}

function getRoleLabel(rol) {
    const map = { super_admin: 'Super Admin', rh: 'RRHH', instructor: 'Instructor', demo: 'Demo' };
    return map[rol] || rol || 'Usuario';
}

export default function MainSidebar({ user, handleLogout, isOpen, onClose, isCollapsed }) {
    const pathname = usePathname();
    const isDemo = user?.rol === 'demo' || user?.email?.includes('demo');
    const isInstructor = user?.rol === 'instructor' || user?.rol === 'Instructor';

    const sections = isInstructor ? INSTRUCTOR_SECTIONS : NAV_SECTIONS;

    const getDefaultOpen = () => {
        if (pathname.startsWith('/capacitacion')) return 'capacitacion';
        if (pathname.startsWith('/employees') || pathname.startsWith('/candidates') || pathname.startsWith('/programacion') || pathname.startsWith('/contratos')) return 'ingresos';
        if (pathname.startsWith('/induccion') || pathname.startsWith('/prototipo') || pathname.startsWith('/mural')) return 'recursos';
        return null;
    };

    const [openSection, setOpenSection] = useState(getDefaultOpen);

    const toggle = (id) => setOpenSection(prev => prev === id ? null : id);

    const firstName = (user?.nombre || user?.nickname || user?.name || 'Admin').split(' ')[0];
    const avatarSeed = user?.avatarSeed || user?.email || 'admin';
    const avatarSrc = user?.photoURL || user?.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`;
    const puesto = user?.puesto || getRoleLabel(user?.rol);
    const departamento = user?.departamento;

    return (
        <>
            {/* Overlay mobile */}
            <div
                className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${isCollapsed ? styles.collapsed : ''}`}
                aria-label="Navegación Principal"
            >
                {/* ── Brand ── */}
                <div className={styles.brand}>
                    <div className={styles.brandLogo}>
                        <span className={styles.brandAccent} aria-hidden="true" />
                        <span className={styles.brandName}>VIÑOPLASTIC</span>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar menú" type="button">
                        <X size={18} />
                    </button>
                </div>

                {/* ── Nav ── */}
                <nav className={styles.nav} aria-label="Módulos">
                    {sections.map((section, idx) => {
                        const SectionIcon = section.icon;
                        const isOpen_ = openSection === section.id;
                        const sectionActive = section.items.some(
                            i => pathname === i.href || pathname.startsWith(i.href + '/')
                        );
                        const disabled = isDemo && section.id !== 'recursos';

                        return (
                            <div key={section.id} className={styles.section}>
                                {/* Section divider (except first) */}
                                {idx > 0 && <div className={styles.divider} />}

                                {/* Section label */}
                                <span className={styles.sectionLabel}>{section.label}</span>

                                {/* Parent toggle button */}
                                <button
                                    className={`${styles.parentItem} ${sectionActive ? styles.parentActive : ''} ${disabled ? styles.disabled : ''}`}
                                    onClick={() => !disabled && toggle(section.id)}
                                    aria-expanded={isOpen_}
                                    title={isCollapsed ? section.label : undefined}
                                    type="button"
                                >
                                    <span className={styles.parentLeft}>
                                        <span className={styles.parentIcon}>
                                            <SectionIcon size={17} />
                                        </span>
                                        <span className={styles.parentLabel}>{section.label}</span>
                                    </span>
                                    <span className={`${styles.chevron} ${isOpen_ ? styles.chevronOpen : ''}`}>
                                        <ChevronDown size={14} />
                                    </span>
                                </button>

                                {/* Sub-items */}
                                <div className={`${styles.subMenu} ${isOpen_ ? styles.subMenuOpen : ''}`}>
                                    {section.items.map(item => {
                                        const ItemIcon = item.icon;
                                        const active = pathname === item.href || pathname.startsWith(item.href + '/');
                                        return (
                                            <Link
                                                key={item.id}
                                                href={item.href}
                                                className={`${styles.subItem} ${active ? styles.subActive : ''}`}
                                                onClick={() => onClose?.()}
                                                title={item.label}
                                            >
                                                <span className={styles.subIcon}>
                                                    <ItemIcon size={14} />
                                                </span>
                                                <span className={styles.subLabel}>{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* ── Footer / Profile ── */}
                <div className={styles.footer}>
                    <Link
                        href="/profile"
                        className={styles.profileCard}
                        onClick={() => onClose?.()}
                        title="Mi perfil"
                    >
                        <div className={styles.avatarWrap}>
                            <NextImage
                                src={avatarSrc}
                                alt={firstName}
                                width={44}
                                height={44}
                                className={styles.avatarImg}
                                unoptimized
                            />
                        </div>
                        <div className={styles.profileInfo}>
                            <span className={styles.profileName}>{firstName}</span>
                            <span className={styles.profilePuesto}>{puesto}</span>
                            {departamento && (
                                <span className={styles.profileDept}>{departamento}</span>
                            )}
                        </div>
                    </Link>
                    <button
                        className={styles.logoutBtn}
                        onClick={handleLogout}
                        aria-label="Cerrar sesión"
                        title="Cerrar sesión"
                        type="button"
                    >
                        <LogOut size={15} />
                    </button>
                </div>
            </aside>
        </>
    );
}
