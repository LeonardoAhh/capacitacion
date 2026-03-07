import React from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { LogOut, User, Zap, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';
import styles from './InduccionSidebar.module.css';

export default function InduccionSidebar({
    activeTab,
    setActiveTab,
    canEdit,
    user,
    nativeCoursesCount,
    galleryItemsCount,
    handleLogout,
    getInitials,
    isOpen,
    onClose
}) {
    return (
        <>
            {/* Overlay para la versión móvil — siempre en DOM, visible vía clase */}
            <div
                className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
                aria-label="Navegación principal"
            >
                <div className={styles.sidebarTop}>
                    {(user?.rol !== 'Instructor' && user?.rol !== 'instructor') && (
                        <Link href="/dashboard" className={styles.sidebarBrand} style={{ textDecoration: 'none', gap: '8px', padding: '6px 8px', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', transition: 'background-color var(--t)' }}>
                            <ArrowLeft size={18} style={{ color: 'var(--c-muted)', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--c-ink)' }}>Volver</span>
                        </Link>
                    )}

                    <button
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Cerrar menú"
                        type="button"
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>

                <nav className={styles.sidebarNav} aria-label="Secciones de Inducción">
                    <span className={styles.sidebarLabel} aria-hidden="true">Inducción</span>

                    {canEdit && (
                        <button
                            type="button"
                            className={`${styles.sidebarItem} ${activeTab === 'interactivos' ? styles.active : ''}`}
                            onClick={() => { setActiveTab('interactivos'); onClose(); }}
                            aria-current={activeTab === 'interactivos' ? 'page' : undefined}
                        >
                            <span className={styles.sidebarItemLeft}>
                                <span className={styles.sidebarItemIcon} aria-hidden="true">
                                    <Zap size={15} />
                                </span>
                                Interactivos
                            </span>
                            <span
                                className={styles.sidebarBadge}
                                aria-label={`${nativeCoursesCount} cursos interactivos`}
                            >
                                {nativeCoursesCount}
                            </span>
                        </button>
                    )}

                    <button
                        type="button"
                        className={`${styles.sidebarItem} ${activeTab === 'galeria' ? styles.active : ''}`}
                        onClick={() => { setActiveTab('galeria'); onClose(); }}
                        aria-current={activeTab === 'galeria' ? 'page' : undefined}
                    >
                        <span className={styles.sidebarItemLeft}>
                            <span className={styles.sidebarItemIcon} aria-hidden="true">
                                <ImageIcon size={15} />
                            </span>
                            Galería
                        </span>
                        <span
                            className={styles.sidebarBadge}
                            aria-label={`${galleryItemsCount} elementos en galería`}
                        >
                            {galleryItemsCount}
                        </span>
                    </button>
                </nav>

                <div className={styles.sidebarProfile}>
                    <div
                        className={styles.sidebarAvatarBtn}
                        title={user?.name || user?.displayName || 'Usuario'}
                    >
                        <div className={styles.sidebarAvatar} aria-hidden="true">
                            <NextImage
                                src={
                                    user?.photoURL ||
                                    user?.avatar ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'default')}`
                                }
                                alt=""
                                width={32}
                                height={32}
                                className={styles.sidebarAvatarImage}
                                unoptimized
                            />
                            <span className={styles.sidebarAvatarFallback} aria-hidden="true">
                                {getInitials(user?.nombre || user?.nickname || user?.name || user?.displayName)}
                            </span>
                        </div>
                        <div className={styles.sidebarUserDetails}>
                            <span className={styles.sidebarUserName}>
                                {(user?.nombre || user?.nickname || user?.name || user?.displayName || 'Usuario').split(' ')[0]}
                            </span>
                        </div>
                    </div>

                    <div className={styles.sidebarProfileActions}>
                        <Link
                            href="/profile"
                            className={styles.sidebarIconBtn}
                            aria-label="Ir a perfil"
                            title="Perfil"
                        >
                            <User size={16} aria-hidden="true" />
                        </Link>
                        <button
                            type="button"
                            className={`${styles.sidebarIconBtn} ${styles.sidebarLogoutBtn}`}
                            onClick={handleLogout}
                            aria-label="Cerrar sesión"
                            title="Cerrar sesión"
                        >
                            <LogOut size={16} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
