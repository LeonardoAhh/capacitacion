'use client';

import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown, Clock, Sparkles, Contrast } from 'lucide-react';
import styles from './ProfileDropdown.module.css';

export default function ProfileDropdown({ candidate, onLogout, timeLeft, toggleTheme }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Format Name (First Name + First Last Name, UPPERCASE)
    const formatName = (name) => {
        if (!name) return 'CANDIDATO';
        const parts = name.trim().split(/\s+/);

        if (parts.length <= 1) return parts[0].toUpperCase();

        // Heuristic: PATERNO MATERNO NOMBRE(S)
        // Surname is always at index 0
        const lastName = parts[0];

        // Name is at index 2 (if 2 surnames) or index 1 (if 1 surname)
        // We assume 2 surnames if length > 2
        const firstName = parts.length > 2 ? parts[2] : parts[1];

        return `${firstName} ${lastName}`.toUpperCase();
    };

    const displayName = formatName(candidate?.name || candidate?.nombre);

    // Show "ID - Position"
    const displayId = candidate?.employeeId || candidate?.id || 'ID: --';
    const displayPosition = candidate?.position || candidate?.puesto || 'PUESTO';
    // Format: "3204 - ANALISTA DE CAPACITACIÓN"
    const displaySubtitle = `${displayId} - ${displayPosition}`.toUpperCase();

    const photoUrl = candidate?.photoUrl || candidate?.photoURL || candidate?.photo || candidate?.foto;

    // Helper to format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
                className={styles.triggerButton}
                onClick={() => setIsOpen(!isOpen)}
                type="button"
            >
                <div className={styles.userInfo}>
                    <span className={styles.userName}>{displayName}</span>
                    <span className={styles.userEmail} style={{ fontSize: '11px', opacity: 0.8, textTransform: 'uppercase' }}>
                        {displaySubtitle}
                    </span>
                </div>

                <div className={styles.avatarContainer}>
                    <div className={styles.avatar}>
                        {photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={photoUrl} alt="Avatar" className={styles.avatarImg} />
                        ) : (
                            <User size={20} color="#1c1c1e" />
                        )}
                    </div>
                </div>

                <ChevronDown size={14} className={styles.chevron} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>

            {isOpen && (
                <div className={styles.dropdownMenu}>
                    <div className={styles.mobileUserInfo}>
                        <div className={styles.mobileUserName}>{displayName}</div>
                        <div className={styles.mobileUserSubtitle}>{displaySubtitle}</div>
                    </div>

                    {timeLeft !== undefined && (
                        <div className={`${styles.menuItem} ${styles.timerItem}`}>
                            <Clock size={16} />
                            <span>Tiempo: {formatTime(timeLeft)}</span>
                        </div>
                    )}

                    {/* (Profile and Config removed) */}

                    <button className={styles.menuItem} onClick={toggleTheme}>
                        <Contrast size={16} />
                        <span>Cambiar Tema</span>
                    </button>

                    <div className={styles.separator} />

                    <button className={`${styles.menuItem} ${styles.logoutButton}`} onClick={onLogout}>
                        <LogOut size={16} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            )}
        </div>
    );
}
