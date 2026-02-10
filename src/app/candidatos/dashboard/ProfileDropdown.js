'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { User, LogOut, ChevronDown, Clock, Contrast } from 'lucide-react';
import styles from './ProfileDropdown.module.css';
import { extractFirstName, getCandidatePhotoUrl } from './utils/helpers';

// Constants
const DEFAULT_NAME = 'CANDIDATO';
const MENU_ITEMS = {
    THEME: 'theme',
    LOGOUT: 'logout'
};

/**
 * ProfileDropdown Component
 * Accessible dropdown menu for user profile actions
 * 
 * @param {Object} props
 * @param {Object} props.candidate - Candidate data
 * @param {Function} props.onLogout - Logout handler
 * @param {number} props.timeLeft - Session time remaining in seconds
 * @param {Function} props.toggleTheme - Theme toggle handler
 */
export default function ProfileDropdown({ candidate, onLogout, timeLeft, toggleTheme }) {
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [imgError, setImgError] = useState(false);
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);
    const menuItemRefs = useRef([]);

    // Memoized display values using helpers
    const displayName = useMemo(() => {
        const fullName = candidate?.name || candidate?.nombre;
        if (!fullName) return DEFAULT_NAME;

        const firstName = extractFirstName(fullName);
        const parts = fullName.trim().split(/\s+/);
        const lastName = parts[0] || '';

        return `${firstName} ${lastName}`.toUpperCase();
    }, [candidate?.name, candidate?.nombre]);

    const displaySubtitle = useMemo(() => {
        const displayId = candidate?.employeeId || candidate?.id || '--';
        const displayPosition = candidate?.position || candidate?.puesto || 'PUESTO';
        return `${displayId} - ${displayPosition}`.toUpperCase();
    }, [candidate?.employeeId, candidate?.id, candidate?.position, candidate?.puesto]);

    const photoUrl = useMemo(() => getCandidatePhotoUrl(candidate), [candidate]);

    // Memoized time formatter
    const formattedTime = useMemo(() => {
        if (timeLeft === undefined) return null;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }, [timeLeft]);

    // Close dropdown
    const closeDropdown = useCallback(() => {
        setIsOpen(false);
        setFocusedIndex(-1);
    }, []);

    // Toggle dropdown
    const toggleDropdown = useCallback(() => {
        setIsOpen(prev => !prev);
        setFocusedIndex(-1);
    }, []);

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, closeDropdown]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((event) => {
        if (!isOpen) {
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
                event.preventDefault();
                setIsOpen(true);
                setFocusedIndex(0);
            }
            return;
        }

        switch (event.key) {
            case 'Escape':
                event.preventDefault();
                closeDropdown();
                triggerRef.current?.focus();
                break;
            case 'ArrowDown':
                event.preventDefault();
                setFocusedIndex(prev => Math.min(prev + 1, menuItemRefs.current.length - 1));
                break;
            case 'ArrowUp':
                event.preventDefault();
                setFocusedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Tab':
                closeDropdown();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                menuItemRefs.current[focusedIndex]?.click();
                break;
            default:
                break;
        }
    }, [isOpen, closeDropdown, focusedIndex]);

    // Focus management
    useEffect(() => {
        if (isOpen && focusedIndex >= 0 && menuItemRefs.current[focusedIndex]) {
            menuItemRefs.current[focusedIndex].focus();
        }
    }, [isOpen, focusedIndex]);

    // Handle menu item click
    const handleThemeClick = useCallback(() => {
        toggleTheme();
        closeDropdown();
    }, [toggleTheme, closeDropdown]);

    const handleLogoutClick = useCallback(() => {
        onLogout();
        closeDropdown();
    }, [onLogout, closeDropdown]);

    // Register menu item refs
    const setMenuItemRef = useCallback((index) => (el) => {
        menuItemRefs.current[index] = el;
    }, []);

    return (
        <div
            className={styles.dropdownContainer}
            ref={dropdownRef}
            onKeyDown={handleKeyDown}
        >
            <button
                ref={triggerRef}
                className={styles.triggerButton}
                onClick={toggleDropdown}
                type="button"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-label={`Menú de usuario para ${displayName}`}
            >
                <div className={styles.userInfo}>
                    <span className={styles.userName}>{displayName}</span>
                    <span className={styles.userEmail}>
                        {displaySubtitle}
                    </span>
                </div>

                <div className={styles.avatarContainer}>
                    <div className={styles.avatar}>
                        {photoUrl && !imgError ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={photoUrl}
                                alt=""
                                className={styles.avatarImg}
                                aria-hidden="true"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <User size={20} color="#1c1c1e" aria-hidden="true" />
                        )}
                    </div>
                </div>

                <ChevronDown
                    size={14}
                    className={styles.chevron}
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    aria-hidden="true"
                />
            </button>

            {isOpen && (
                <div
                    className={styles.dropdownMenu}
                    role="menu"
                    aria-label="Opciones de usuario"
                >
                    {/* Mobile user info */}
                    <div className={styles.mobileUserInfo} aria-hidden="true">
                        <div className={styles.mobileUserName}>{displayName}</div>
                        <div className={styles.mobileUserSubtitle}>{displaySubtitle}</div>
                    </div>

                    {/* Timer display */}
                    {formattedTime && (
                        <div
                            className={`${styles.menuItem} ${styles.timerItem}`}
                            role="status"
                            aria-live="polite"
                            aria-label={`Tiempo restante: ${formattedTime}`}
                        >
                            <Clock size={16} aria-hidden="true" />
                            <span>Tiempo: {formattedTime}</span>
                        </div>
                    )}

                    {/* Theme toggle */}
                    <button
                        ref={setMenuItemRef(0)}
                        className={styles.menuItem}
                        onClick={handleThemeClick}
                        role="menuitem"
                        tabIndex={focusedIndex === 0 ? 0 : -1}
                        aria-label="Cambiar tema de color"
                    >
                        <Contrast size={16} aria-hidden="true" />
                        <span>Cambiar Tema</span>
                    </button>

                    <div className={styles.separator} role="separator" aria-hidden="true" />

                    {/* Logout button */}
                    <button
                        ref={setMenuItemRef(1)}
                        className={`${styles.menuItem} ${styles.logoutButton}`}
                        onClick={handleLogoutClick}
                        role="menuitem"
                        tabIndex={focusedIndex === 1 ? 0 : -1}
                        aria-label="Cerrar sesión"
                    >
                        <LogOut size={16} aria-hidden="true" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            )}
        </div>
    );
}
