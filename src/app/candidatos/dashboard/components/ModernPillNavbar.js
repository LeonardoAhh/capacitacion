'use client';

import { useMemo, useCallback } from 'react';
import Image from 'next/image';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './ModernPillNavbar.module.css';
import { extractFirstName, getCandidatePhotoUrl } from '../utils/helpers';

const DEFAULT_NAME = 'Candidato';

export default function ModernPillNavbar({
    candidate,
    onLogout,
    onAvatarClick,
    toggleTheme: toggleThemeProp, // prop desde page.js
}) {
    // Usar siempre el ThemeContext como fuente de verdad
    const { isDark, toggleTheme: contextToggle } = useTheme();

    // Priorizar prop, fallback al contexto
    const handleTheme = useCallback(() => {
        if (toggleThemeProp) toggleThemeProp();
        else contextToggle();
    }, [toggleThemeProp, contextToggle]);

    const handleLogout = useCallback(() => { onLogout?.(); }, [onLogout]);

    const displayName = useMemo(() => {
        if (candidate?.nickname?.trim()) return candidate.nickname.trim();
        const fullName = candidate?.name || candidate?.nombre;
        if (!fullName) return DEFAULT_NAME;
        return extractFirstName(fullName);
    }, [candidate?.nickname, candidate?.name, candidate?.nombre]);

    const photoUrl = useMemo(() => getCandidatePhotoUrl(candidate), [candidate]);

    const getInitials = (name) =>
        name ? name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U';

    return (
        <nav className={styles.pill} aria-label="Acciones de usuario">

            {/* Avatar + nombre — click abre selector de avatar */}
            <button
                type="button"
                className={styles.avatarBtn}
                onClick={onAvatarClick}
                aria-label={`Cambiar avatar de ${displayName}`}
                title="Cambiar avatar"
            >
                <div className={styles.avatar}>
                    {photoUrl ? (
                        <Image
                            src={photoUrl}
                            alt=""
                            width={30}
                            height={30}
                            className={styles.avatarImage}
                            unoptimized
                            onError={() => { }}
                        />
                    ) : (
                        <span className={styles.avatarFallback}>{getInitials(displayName)}</span>
                    )}
                </div>
                <span className={styles.name}>{displayName}</span>
            </button>

            <span className={styles.divider} aria-hidden="true" />

            {/* Tema — Sun/Moon según isDark del contexto */}
            <button
                type="button"
                className={styles.iconBtn}
                onClick={handleTheme}
                aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                title="Cambiar tema"
            >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

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
