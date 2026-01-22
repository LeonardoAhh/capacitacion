'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import styles from './Navbar.module.css';

export default function Navbar() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        const result = await signOut();
        if (result.success) {
            router.push('/login');
        }
    };

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                <div className={styles.logo}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Sistema de Empleados</span>
                </div>

                <div className={styles.actions}>
                    {user && (
                        <>
                            <span className={styles.userEmail}>{user.email}</span>
                            <button onClick={handleSignOut} className="btn btn-secondary">
                                Cerrar Sesión
                            </button>
                        </>
                    )}
                    <ThemeToggle />
                </div>
            </div>
        </nav>
    );
}
