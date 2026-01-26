'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import SparklesText from '@/components/ui/SparklesText/SparklesText';
import styles from './Navbar.module.css';
import styles3d from './Navbar3D.module.css';

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
                    <SparklesText className={styles.sparklesText} sparklesCount={10}>Vertx</SparklesText>
                </div>

                <div className={styles.actions}>
                    {user && (
                        <>
                            <div className={styles3d.roleBadge} title="Rol de Usuario">
                                <div className={styles3d.scene}>
                                    <div className={styles3d.cube}>
                                        <div className={`${styles3d.cubeFace} ${styles3d.faceFront}`}></div>
                                        <div className={`${styles3d.cubeFace} ${styles3d.faceBack}`}></div>
                                        <div className={`${styles3d.cubeFace} ${styles3d.faceRight}`}></div>
                                        <div className={`${styles3d.cubeFace} ${styles3d.faceLeft}`}></div>
                                        <div className={`${styles3d.cubeFace} ${styles3d.faceTop}`}></div>
                                        <div className={`${styles3d.cubeFace} ${styles3d.faceBottom}`}></div>
                                    </div>
                                </div>
                                <span className={styles3d.roleText}>
                                    {user.rol ? user.rol.replace(/_/g, ' ') : 'Admin'}
                                </span>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className={styles.iconBtn}
                                title="Cerrar Sesión"
                                aria-label="Cerrar Sesión"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
