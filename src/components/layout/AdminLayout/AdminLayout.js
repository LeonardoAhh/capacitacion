'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import MainSidebar from '@/components/layout/MainSidebar/MainSidebar';
import CandidateMobileHeader from '@/components/features/CandidateSidebar/CandidateMobileHeader';
import { destroySession } from '@/lib/sessionApi';
import styles from './AdminLayout.module.css';
import { PanelLeft } from 'lucide-react';

export default function AdminLayout({ children, title = 'Viñoplastic RH' }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // Estado exclusivo de desktop: colapsa el sidebar lateral
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
            {/* Header móvil — solo visible en <768px */}
            <CandidateMobileHeader
                user={user}
                onOpenSidebar={() => setIsSidebarOpen(true)}
                title={title}
            />

            {/* Sidebar maestro */}
            <MainSidebar
                user={user}
                handleLogout={handleLogout}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                isCollapsed={isSidebarCollapsed}
            />

            {/* Contenedor principal scrollable */}
            <div className={`${styles.scrollContent} ${isSidebarCollapsed ? styles.scrollContentExpanded : ''}`}>

                {/* Header desktop — solo visible en ≥768px */}
                <header className={styles.desktopHeader} aria-label={`Sección: ${title}`}>
                    <button
                        className={styles.sidebarToggle}
                        onClick={() => setIsSidebarCollapsed(prev => !prev)}
                        aria-label={isSidebarCollapsed ? 'Mostrar menú lateral' : 'Ocultar menú lateral'}
                        aria-expanded={!isSidebarCollapsed}
                        type="button"
                    >
                        <PanelLeft size={18} strokeWidth={1.8} />
                    </button>
                    <div className={styles.headerDivider} aria-hidden="true" />
                    <span className={styles.pageTitle}>{title.toUpperCase()}</span>
                </header>

                {children}
            </div>
        </div>
    );
}
