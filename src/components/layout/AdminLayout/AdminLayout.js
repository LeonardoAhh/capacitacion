'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import MainSidebar from '@/components/layout/MainSidebar/MainSidebar';
import CandidateMobileHeader from '@/components/features/CandidateSidebar/CandidateMobileHeader';
import { destroySession } from '@/lib/sessionApi';
import styles from './AdminLayout.module.css';

export default function AdminLayout({ children, title = 'Viñoplastic RH' }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await destroySession();
            router.push('/');
        } catch (error) {
            console.error('Error cerrando sesión:', error);
            router.push('/');
        }
    };

    if (loading || !user) {
        return (
            <div className={styles.layoutPage}>
                <div className={styles.loading}>Cargando entorno...</div>
            </div>
        );
    }

    return (
        <div className={styles.layoutPage}>
            {/* Header móvil adaptativo */}
            <CandidateMobileHeader
                user={user}
                onOpenSidebar={() => setIsSidebarOpen(true)}
                title={title}
            />

            {/* Sidebar maestro responsivo (oculto en móvil, pegado en PC) */}
            <MainSidebar
                user={user}
                handleLogout={handleLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Contenedor principal scrollable que envuelve a los sub-módulos */}
            <div className={styles.scrollContent}>
                {children}
            </div>
        </div>
    );
}
