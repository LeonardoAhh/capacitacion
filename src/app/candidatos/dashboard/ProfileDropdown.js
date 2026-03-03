'use client';

import { useMemo, useCallback, useState } from 'react';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import styles from './ProfileDropdown.module.css';
import { extractFirstName, getCandidatePhotoUrl } from './utils/helpers';

/**
 * ProfileDropdown — Pill permanente iOS Glass
 * Props mantenidos para compatibilidad con page.js:
 *   candidate, onLogout, timeLeft, toggleTheme, onAvatarClick, onThemeClick
 */
export default function ProfileDropdown({
    candidate,
    onLogout,
    toggleTheme,
    onAvatarClick,
    onThemeClick,
}) {
    const [imgError, setImgError] = useState(false);
    const [isDark, setIsDark] = useState(() =>
        typeof document !== 'undefined'
            ? document.documentElement.getAttribute('data-theme') === 'dark'
            : false
    );

    const displayName = useMemo(() => {
        const fullName = candidate?.name || candidate?.nombre;
        if (!fullName) return 'CANDIDATO';
        const firstName = extractFirstName(fullName);
        const parts = fullName.trim().split(/\s+/);
        const lastName = parts[0] || '';
        return `${firstName} ${lastName}`.toUpperCase();
    }, [candidate?.name, candidate?.nombre]);

    const photoUrl = useMemo(() => getCandidatePhotoUrl(candidate), [candidate]);

    const handleTheme = useCallback(() => {
        const fn = onThemeClick || toggleTheme;
        if (fn) fn();
        setIsDark(prev => !prev);
    }, [onThemeClick, toggleTheme]);

    const handleLogout = useCallback(() => {
        if (onLogout) onLogout();
    }, [onLogout]);

    const getInitials = (name) =>
        name ? name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U';

    return (
        <nav className={styles.pill} aria-label="Acciones de usuario">

            {/* Avatar + nombre */}
            <button
                type="button"
                className={styles.avatarBtn}
                onClick={onAvatarClick || undefined}
                aria-label={`Perfil de ${displayName}`}
                title={displayName}
                style={{ cursor: onAvatarClick ? 'pointer' : 'default' }}
            >
                <div className={styles.avatar}>
                    {photoUrl && !imgError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={photoUrl}
                            alt=""
                            className={styles.avatarImage}
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <span className={styles.avatarFallback}>{getInitials(displayName)}</span>
                    )}
                </div>
                <span className={styles.name}>{displayName}</span>
            </button>

            <span className={styles.divider} aria-hidden="true" />

            {/* Tema */}
            <button
                type="button"
                className={styles.iconBtn}
                onClick={handleTheme}
                aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
                title="Cambiar tema"
            >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Perfil */}
            <Link
                href="/profile"
                className={styles.iconBtn}
                aria-label="Ir a perfil"
                title="Perfil"
            >
                <User size={17} />
            </Link>

            <span className={styles.divider} aria-hidden="true" />

            {/* Cerrar sesión */}
            <button
                type="button"
                className={`${styles.iconBtn} ${styles.signOutBtn}`}
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
            >
                <LogOut size={17} />
            </button>
        </nav>
    );
}
