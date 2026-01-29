'use client';

import styles from './RoleAvatar.module.css';

// --- CONFIGURACIÓN: Iconos ---
const ICONS = {
    superadmin: (
        <g>
            <path d="M6 3h12l4 6-10 13L2 9z" />
            <path d="M11 3v8l-6.5 4" strokeOpacity="0.5" />
            <path d="M13 3v8l6.5 4" strokeOpacity="0.5" />
        </g>
    ),
    super_admin: (
        <g>
            <path d="M6 3h12l4 6-10 13L2 9z" />
            <path d="M11 3v8l-6.5 4" strokeOpacity="0.5" />
            <path d="M13 3v8l6.5 4" strokeOpacity="0.5" />
        </g>
    ),
    admin: (
        <g>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
        </g>
    ),
    demo: (
        <g>
            <circle cx="12" cy="12" r="10" />
            <path d="M16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z" />
        </g>
    ),
    default: (
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
    )
};

const ROLE_LABELS = {
    superadmin: 'Super Admin',
    super_admin: 'Super Admin',
    admin: 'Administrador',
    demo: 'Demo',
    default: 'Usuario'
};

/**
 * RoleIcon: Solo el SVG vectorizado
 */
export const RoleIcon = ({ role, size = 24, className = '' }) => {
    const roleKey = role?.toLowerCase().replace(/\s+/g, '_') || 'default';
    const iconPath = ICONS[roleKey] || ICONS.default;

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {iconPath}
        </svg>
    );
};

/**
 * RoleAvatar: Círculo contenedor con el icono
 */
export const RoleAvatar = ({ role, size = 40 }) => {
    const roleKey = role?.toLowerCase().replace(/\s+/g, '_') || 'default';
    const label = ROLE_LABELS[roleKey] || ROLE_LABELS.default;
    const iconSize = Math.floor(size * 0.5);

    // Determine style class based on role
    const getStyleClass = () => {
        if (roleKey === 'superadmin' || roleKey === 'super_admin') return styles.superadmin;
        if (roleKey === 'admin') return styles.admin;
        if (roleKey === 'demo') return styles.demo;
        return styles.default;
    };

    return (
        <div
            title={label}
            className={`${styles.avatar} ${getStyleClass()}`}
            style={{ width: size, height: size }}
        >
            <RoleIcon role={roleKey} size={iconSize} />
        </div>
    );
};

export default RoleAvatar;