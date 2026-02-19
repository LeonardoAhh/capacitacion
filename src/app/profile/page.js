'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProfileDropdown from '@/components/ProfileDropdown/ProfileDropdown';
import styles from './page.module.css';
import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';
import { Eye, EyeOff } from 'lucide-react';
import BackButton from '@/components/ui/BackButton/BackButton';

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
            <div className={styles.profileContainer}>
                <ProfileDropdown />
            </div>



            <main className={styles.container}>

                <BackButton onClick={() => router.back()} />

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
                        </div>
                    </div>
                </div>

                {/* Details Card */}
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>
                        <svg className={styles.cardIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Detalles del Perfil
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

                {/* Administration Section (Only for Admins) */}
                {(
                    ['admin', 'superadmin', 'super_admin'].includes(user.rol?.toLowerCase()) ||
                    ['ADMIN', 'SUPER_ADMIN'].includes(user.rol)
                ) && (
                        <AdminSection />
                    )}
            </main>
        </div>
    );
}

// Subcomponente para evitar re-renders innecesarios y organizar código
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shield, AlertTriangle } from 'lucide-react';

function AdminSection() {
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const configRef = doc(db, 'app_config', 'general');
        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                setIsMaintenance(docSnap.data().maintenanceMode || false);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const toggleMaintenance = async () => {
        const newState = !isMaintenance;
        // Optimistic update
        setIsMaintenance(newState);
        try {
            await setDoc(doc(db, 'app_config', 'general'), {
                maintenanceMode: newState,
                maintenanceMessage: "Estamos realizando mejoras en la plataforma. Volveremos pronto."
            }, { merge: true });
        } catch (error) {
            console.error("Error updating maintenance mode:", error);
            setIsMaintenance(!newState); // Revert on error
            alert("Error al actualizar el modo mantenimiento");
        }
    };

    if (loading) return null;

    return (
        <div className={styles.card} style={{ borderColor: isMaintenance ? '#ef4444' : 'var(--border-color)' }}>
            <h3 className={styles.cardTitle} style={{ color: isMaintenance ? '#ef4444' : 'inherit' }}>
                <Shield className={styles.cardIcon} />
                Administración del Sistema
            </h3>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                backgroundColor: isMaintenance ? '#fef2f2' : 'var(--bg-secondary)',
                borderRadius: '8px',
                marginTop: '1rem'
            }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                        padding: '0.5rem',
                        borderRadius: '50%',
                        backgroundColor: isMaintenance ? '#fee2e2' : '#e2e8f0',
                        color: isMaintenance ? '#ef4444' : '#64748b'
                    }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Modo Mantenimiento
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {isMaintenance
                                ? 'La plataforma está bloqueada para usuarios.'
                                : 'La plataforma está accesible para todos.'}
                        </p>
                    </div>
                </div>

                <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={isMaintenance}
                        onChange={toggleMaintenance}
                        style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: isMaintenance ? '#ef4444' : '#ccc',
                        transition: '.4s',
                        borderRadius: '34px'
                    }}>
                        <span style={{
                            position: 'absolute',
                            content: '""',
                            height: '20px', width: '20px',
                            left: isMaintenance ? '26px' : '4px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            transition: '.4s',
                            borderRadius: '50%'
                        }}></span>
                    </span>
                </label>
            </div>

            {isMaintenance && (
                <div style={{ marginTop: '10px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 500 }}>
                    ⚠ Tú sigues teniendo acceso por ser Administrador.
                </div>
            )}
        </div>
    );
}
