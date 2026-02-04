'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import MFASetup from '@/components/Profile/MFASetup';
import AdminManager from '@/components/Profile/AdminManager';
import styles from './page.module.css';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
    const { user, loading, updateUserProfile } = useAuth();
    const router = useRouter();
    const [avatarSeed, setAvatarSeed] = useState('');

    // Email Reveal State
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        if (user) {
            // Prioritize saved avatarSeed, otherwise use email as default seed
            setAvatarSeed(user.avatarSeed || user.email);
        }
    }, [user]);

    const avatarSvg = useMemo(() => {
        return createAvatar(lorelei, {
            seed: avatarSeed || 'placeholder',
            size: 120,
            backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9'],
        }).toString();
    }, [avatarSeed]);

    const handleRandomizeAvatar = async () => {
        const newSeed = Math.random().toString(36).substring(7);
        // Optimistically update local state
        setAvatarSeed(newSeed);

        // Save to Firestore
        if (user && user.uid) {
            await updateUserProfile(user.uid, { avatarSeed: newSeed });
        }
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
                <span>Cargando perfil...</span>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
            <Navbar />



            <main className={styles.container}>

                <button
                    onClick={() => router.back()}
                    className={styles.backButton}
                >
                    <ArrowLeft size={18} />
                    <span>Volver</span>
                </button>

                {/* Header Card (Avatar + Info) */}
                <div className={styles.headerCard}>

                    {/* Avatar */}
                    <div className={styles.avatarContainer}>
                        <div
                            className={styles.avatar}
                            dangerouslySetInnerHTML={{ __html: avatarSvg }}
                            style={{ overflow: 'hidden' }}
                        />
                        <button
                            onClick={handleRandomizeAvatar}
                            className={styles.changeAvatarBtn}
                            title="Cambiar Avatar"
                        >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                        <div className={styles.statusIndicator} title="Activo"></div>
                    </div>

                    {/* Basic Info */}
                    <div className={styles.userInfo}>
                        <h1 className={styles.userName}>
                            {user.name || user.displayName || 'Usuario'}
                        </h1>

                        {/* Email Reveal Section */}
                        <div className={styles.emailSection}>
                            <div
                                className={styles.emailWrapper}
                                onClick={() => setIsRevealed(!isRevealed)}
                                style={{ cursor: 'pointer' }}
                                title={isRevealed ? "Click para ocultar" : "Click para ver"}
                            >
                                <span className={styles.revealIcon}>
                                    {isRevealed ? <Eye size={18} /> : <EyeOff size={18} />}
                                </span>

                                <span className={`${styles.emailText} ${isRevealed ? styles.noBlur : styles.blur}`}>
                                    {user.email || 'correo@ejemplo.com'}
                                </span>
                            </div>
                        </div>

                        <div className={styles.badgeContainer}>
                            <span className={`${styles.badge} ${styles.badgePrimary}`}>
                                {user.rol || 'Empleado'}
                            </span>
                            <span className={`${styles.badge} ${styles.badgeSecondary}`}>
                                {user.mfaEnabled ? '2FA Activo' : 'Sin 2FA'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={styles.grid}>
                    {/* Left Column: Details */}
                    <div>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>
                                <svg className={styles.cardIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Detalles
                            </h3>
                            <ul className={styles.detailsList}>
                                <li className={styles.detailsItem}>
                                    <span className={styles.label}>Puesto</span>
                                    <span className={styles.value}>{user.puesto || 'No definido'}</span>
                                </li>
                                <li className={styles.detailsItem}>
                                    <span className={styles.label}>Departamento</span>
                                    <span className={styles.value}>{user.departamento || 'No definido'}</span>
                                </li>
                                <li className={styles.detailsItem}>
                                    <span className={styles.label}>Fecha Ingreso</span>
                                    <span className={styles.value}>{user.fechaIngreso || 'No definida'}</span>
                                </li>
                                <li className={styles.detailsItem}>
                                    <span className={styles.label}>Género</span>
                                    <span className={styles.value}>{user.genero || 'No definido'}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Security */}
                    <div>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>
                                <svg className={styles.cardIcon} style={{ color: 'var(--color-success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Seguridad y Autenticación
                            </h3>

                            <MFASetup />
                        </div>
                    </div>
                </div>

                {/* Admin Management Section - Only for Super Admins */}
                {user.rol === 'super_admin' && (
                    <div style={{ marginTop: '24px' }}>
                        <AdminManager />
                    </div>
                )}
            </main>
        </div>
    );
}
