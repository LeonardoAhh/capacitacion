'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { User, LogOut, ChevronDown, Clock, Contrast, Camera } from 'lucide-react';
import styles from './ModernPillNavbar.module.css';
import { extractFirstName, getCandidatePhotoUrl } from '../utils/helpers';

const DEFAULT_NAME = 'CANDIDATO';

export default function ModernPillNavbar({
    candidate,
    onLogout,
    timeLeft,
    onAvatarClick,
    onThemeClick
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const dropdownRef = useRef(null);

    // Display Name Logic
    const displayName = useMemo(() => {
        const fullName = candidate?.name || candidate?.nombre;
        if (!fullName) return DEFAULT_NAME;
        const firstName = extractFirstName(fullName);
        const parts = fullName.trim().split(/\s+/);
        const lastName = parts[0] || '';
        return `${firstName} ${lastName}`.toUpperCase();
    }, [candidate?.name, candidate?.nombre]);

    const displayRole = useMemo(() => {
        return candidate?.position || candidate?.puesto || 'PUESTO';
    }, [candidate?.position, candidate?.puesto]);

    const photoUrl = useMemo(() => getCandidatePhotoUrl(candidate), [candidate]);

    // Time Formatter
    const formattedTime = useMemo(() => {
        if (timeLeft === undefined) return null;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }, [timeLeft]);

    // Close logic
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className={styles.navbarContainer} ref={dropdownRef}>
            {/* User Info (Desktop) */}
            <div className={styles.userInfo}>
                <span className={styles.userName}>{displayName}</span>
                <span className={styles.userRole}>{displayRole}</span>
            </div>

            {/* Avatar Pill */}
            <div className={styles.avatarWrapper} onClick={() => setIsOpen(!isOpen)}>
                <div className={styles.avatar}>
                    {photoUrl && !imgError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={photoUrl}
                            alt="Profile"
                            className={styles.avatarImg}
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <User size={20} color="var(--text-primary)" />
                    )}
                </div>
            </div>

            {/* Dropdown Trigger */}
            <button
                className={styles.menuTrigger}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
            >
                <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {/* Dropdown Menu */}
            {/* Shared Menu Content to avoid duplication */}
            {isOpen && (
                <>
                    {/* Desktop Menu (Inline) */}
                    <div className={styles.desktopMenu}>
                        <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                            {/* Timer */}
                            {formattedTime && (
                                <div className={`${styles.menuItem} ${styles.timerItem}`}>
                                    <Clock size={16} />
                                    <span>{formattedTime}</span>
                                </div>
                            )}
                            <div className={styles.separator} />

                            <button className={styles.menuItem} onClick={() => {
                                onAvatarClick && onAvatarClick();
                                setIsOpen(false);
                            }}>
                                <Camera size={18} className={styles.menuItemIcon} />
                                <span>Cambiar Avatar</span>
                            </button>
                            <button className={styles.menuItem} onClick={() => {
                                onThemeClick && onThemeClick();
                                setIsOpen(false);
                            }}>
                                <Contrast size={18} className={styles.menuItemIcon} />
                                <span>Cambiar Tema</span>
                            </button>
                            <div className={styles.separator} />
                            <button className={`${styles.menuItem} ${styles.logoutItem}`} onClick={() => {
                                onLogout && onLogout();
                                setIsOpen(false);
                            }}>
                                <LogOut size={18} className={styles.menuItemIcon} />
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu (Portal) */}
                    {createPortal(
                        <div className={styles.mobilePortal}>
                            <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
                            <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                                {/* Timer */}
                                {formattedTime && (
                                    <div className={`${styles.menuItem} ${styles.timerItem}`}>
                                        <Clock size={16} />
                                        <span>{formattedTime}</span>
                                    </div>
                                )}
                                <div className={styles.separator} />

                                <button className={styles.menuItem} onClick={() => {
                                    onAvatarClick && onAvatarClick();
                                    setIsOpen(false);
                                }}>
                                    <Camera size={18} className={styles.menuItemIcon} />
                                    <span>Cambiar Avatar</span>
                                </button>
                                <button className={styles.menuItem} onClick={() => {
                                    onThemeClick && onThemeClick();
                                    setIsOpen(false);
                                }}>
                                    <Contrast size={18} className={styles.menuItemIcon} />
                                    <span>Cambiar Tema</span>
                                </button>
                                <div className={styles.separator} />
                                <button className={`${styles.menuItem} ${styles.logoutItem}`} onClick={() => {
                                    onLogout && onLogout();
                                    setIsOpen(false);
                                }}>
                                    <LogOut size={18} className={styles.menuItemIcon} />
                                    <span>Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>,
                        document.body
                    )}
                </>
            )}
        </div>
    );
}
