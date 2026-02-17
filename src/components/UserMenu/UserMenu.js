'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { LogOut, ChevronDown, Check, User } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './UserMenu.module.css';
import { formatDisplayName } from '@/utils/nameUtils';

export default function UserMenu({ user, onLogout, onAvatarClick, onThemeChange }) {
    const { theme, setTheme, availableThemes } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleThemeSelect = (key) => {
        setTheme(key);
        if (onThemeChange) {
            onThemeChange(key);
        }
    };

    return (
        <div className={styles.container} ref={containerRef}>
            <button
                className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Menú de usuario"
                aria-expanded={isOpen}
            >
                <div className={styles.avatarWrapper}>
                    {user.avatar ? (
                        <Image
                            src={user.avatar}
                            alt="Avatar"
                            fill
                            sizes="36px"
                            style={{ objectFit: 'cover' }}
                            priority
                            unoptimized
                        />
                    ) : (
                        (user.nickname || user.name || 'U').charAt(0).toUpperCase()
                    )}
                </div>

                <div className={styles.userInfo}>
                    <span className={styles.userName}>
                        {user.nickname || formatDisplayName(user.name)}
                    </span>
                    <span className={styles.userRole}>{user.position}</span>
                </div>

                <ChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.rotate : ''}`} />
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.menuSection}>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                if (onAvatarClick) onAvatarClick();
                            }}
                            className={styles.menuItem}
                        >
                            <User size={16} />
                            <span>Cambiar Avatar</span>
                        </button>
                    </div>

                    <div className={styles.menuSection}>
                        <span className={styles.sectionTitle}>Apariencia</span>
                        <div className={styles.themeGrid}>
                            {Object.entries(availableThemes).map(([key, value]) => (
                                <button
                                    key={key}
                                    className={`${styles.themeOption} ${theme === key ? styles.active : ''}`}
                                    onClick={() => handleThemeSelect(key)}
                                >
                                    <div
                                        className={styles.colorPreview}
                                        style={{ backgroundColor: value.color }}
                                    >
                                        {theme === key && (
                                            <Check size={12} strokeWidth={3} color={key === 'dark' ? '#fff' : '#000'} />
                                        )}
                                    </div>
                                    <span className={styles.themeLabel}>{value.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.menuSection}>
                        <button onClick={onLogout} className={styles.logoutBtn}>
                            <LogOut size={16} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
