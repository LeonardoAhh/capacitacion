'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LogoVinoPlastic from '@/components/Logo/LogoVinoPlastic';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import MotivationalWidget from './MotivationalWidget';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        const result = await signOut();
        if (result.success) {
            router.push('/');
        }
    };

    return (
        <nav className={styles.navbar} role="navigation" aria-label="Navegación principal">
            <div className={styles.container}>
                {/* Logo */}
                <div className={styles.logo}>
                    <div className={styles.logoImageContainer}>
                        <LogoVinoPlastic
                            style={{
                                height: '45px',
                                width: 'auto',
                                color: 'var(--text-primary)',
                                minWidth: '100px'
                            }}
                        />
                    </div>
                </div>

                {/* Motivational Widget for Admins */}
                <MotivationalWidget />

                {/* Actions */}
                <div className={styles.actions}>
                    {user && (
                        <>
                            <button
                                onClick={() => router.push('/profile')}
                                className={styles.iconBtn}
                                title="Mi Perfil"
                                aria-label="Mi Perfil"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </button>
                            <button
                                onClick={handleSignOut}
                                className={styles.iconBtn}
                                title="Cerrar Sesión"
                                aria-label="Cerrar Sesión"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </button>
                        </>
                    )}
                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
}
