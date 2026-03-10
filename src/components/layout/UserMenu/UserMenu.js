'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { IconLogOut, IconChevronDown, IconCheck, IconUser } from '@/lib/icons';
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

                <IconChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.rotate : ''}`} />
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
                            <IconUser size={16} />
                            <span>Cambiar Avatar</span>
                        </button>
                    </div>


                    <div className={styles.menuSection}>
                        <button onClick={onLogout} className={styles.logoutBtn}>
                            <IconLogOut size={16} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
