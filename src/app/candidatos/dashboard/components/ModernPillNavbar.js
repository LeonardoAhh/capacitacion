'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { User, LogOut, ChevronDown, Clock, Contrast, Camera } from 'lucide-react';
import styles from './ModernPillNavbar.module.css';
import { extractFirstName, getCandidatePhotoUrl } from '../utils/helpers';

const DEFAULT_NAME = 'Candidato';
const DEFAULT_ROLE = 'Puesto';

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function ModernPillNavbar({
    candidate,
    onLogout,
    timeLeft,
    onAvatarClick,
    onThemeClick,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [coords, setCoords] = useState({ top: 0, right: 0 });
    const [mounted, setMounted] = useState(false);
    const pillRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const displayName = useMemo(() => {
        if (candidate?.nickname?.trim()) {
            return candidate.nickname.trim();
        }
        const fullName = candidate?.name || candidate?.nombre;
        if (!fullName) return DEFAULT_NAME;
        return extractFirstName(fullName);
    }, [candidate?.nickname, candidate?.name, candidate?.nombre]);

    const displayRole = useMemo(() =>
        candidate?.position || candidate?.puesto || DEFAULT_ROLE,
        [candidate?.position, candidate?.puesto]
    );

    const photoUrl = useMemo(() => getCandidatePhotoUrl(candidate), [candidate]);
    const formattedTime = useMemo(() =>
        timeLeft !== undefined ? formatTime(timeLeft) : null,
        [timeLeft]
    );
    const lowTime = timeLeft !== undefined && timeLeft < 60;

    const toggle = useCallback(() => setIsOpen(v => !v), []);
    const close = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        if (!isOpen) return;
        const onEsc = (e) => { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', onEsc);
        return () => document.removeEventListener('keydown', onEsc);
    }, [isOpen, close]);

    useEffect(() => {
        if (!isOpen || !pillRef.current) return;

        function calculate() {
            const rect = pillRef.current.getBoundingClientRect();
            const vw = window.innerWidth;
            const DROPDOWN_WIDTH = vw < 640 ? Math.min(280, vw - 32) : 220;

            let rightVal = vw - rect.right;
            const maxRight = vw - DROPDOWN_WIDTH - 16;
            if (rightVal > maxRight) rightVal = maxRight;
            if (rightVal < 16) rightVal = 16;

            setCoords({
                top: rect.bottom + 8,
                right: rightVal,
            });
        }

        calculate();
        window.addEventListener('resize', calculate);
        window.addEventListener('scroll', calculate, true);
        return () => {
            window.removeEventListener('resize', calculate);
            window.removeEventListener('scroll', calculate, true);
        };
    }, [isOpen]);

    const handleAvatar = useCallback(() => { onAvatarClick?.(); close(); }, [onAvatarClick, close]);
    const handleTheme = useCallback(() => { onThemeClick?.(); close(); }, [onThemeClick, close]);
    const handleLogout = useCallback(() => { onLogout?.(); close(); }, [onLogout, close]);

    return (
        <nav className={styles.navbar}>
            <div className={styles.pill} ref={pillRef}>
                <div className={styles.userInfo}>
                    <span className={styles.userName}>{displayName}</span>
                    <span className={styles.userRole}>{displayRole}</span>
                </div>

                <button
                    className={styles.avatarWrapper}
                    onClick={toggle}
                    aria-label={`Menú de ${displayName}`}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    type="button"
                >
                    <div className={styles.avatar}>
                        {photoUrl && !imgError ? (
                            <img
                                src={photoUrl}
                                alt={displayName}
                                className={styles.avatarImg}
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <User size={18} />
                        )}
                    </div>
                    <span className={styles.onlineDot} />
                </button>

                <button
                    className={styles.chevron}
                    onClick={toggle}
                    aria-hidden="true"
                    tabIndex={-1}
                    type="button"
                >
                    <ChevronDown size={16} className={isOpen ? styles.chevronOpen : ''} />
                </button>
            </div>

            {mounted && isOpen && createPortal(
                <>
                    <div className={styles.backdrop} onClick={close} aria-hidden="true" />
                    <div
                        className={styles.dropdown}
                        role="menu"
                        aria-label="Opciones de usuario"
                        style={{ top: coords.top, right: coords.right }}
                    >
                        <div className={styles.dropdownHeader}>
                            <span className={styles.dropdownName}>{displayName}</span>
                            <span className={styles.dropdownRole}>{displayRole}</span>
                        </div>

                        {formattedTime && (
                            <div
                                className={`${styles.menuItem} ${styles.timerItem} ${lowTime ? styles.timerLow : ''}`}
                                role="status"
                            >
                                <Clock size={14} />
                                <span>{formattedTime}</span>
                            </div>
                        )}

                        <div className={styles.separator} />

                        <button
                            type="button"
                            onClick={handleAvatar}
                            className={styles.menuItem}
                            role="menuitem"
                        >
                            <Camera size={16} className={styles.menuItemIcon} />
                            <span>Cambiar Avatar</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleTheme}
                            className={styles.menuItem}
                            role="menuitem"
                        >
                            <Contrast size={16} className={styles.menuItemIcon} />
                            <span>Cambiar Tema</span>
                        </button>

                        <div className={styles.separator} />

                        <button
                            type="button"
                            onClick={handleLogout}
                            className={`${styles.menuItem} ${styles.logoutItem}`}
                            role="menuitem"
                        >
                            <LogOut size={16} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </>,
                document.body
            )}
        </nav>
    );
}
