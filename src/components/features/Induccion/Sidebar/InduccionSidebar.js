import React from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { LogOut, User, Zap, BookOpen, FileText, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';
import styles from './InduccionSidebar.module.css';

export default function InduccionSidebar({
    activeTab,
    setActiveTab,
    canEdit,
    user,
    nativeCoursesCount,
    candidateCoursesCount,
    coursesCount,
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
                    <Link href="/dashboard" className={styles.sidebarBrand} style={{ textDecoration: 'none', gap: '8px', padding: '6px 8px', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', transition: 'background-color var(--t)' }}>
                        <ArrowLeft size={18} style={{ color: 'var(--c-muted)', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--c-ink)' }}>Volver</span>
                    </Link>

                    {/* Botón de cierre — solo visible en móvil vía CSS */}
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

                    {canEdit && (
                        <button
                            type="button"
                            className={`${styles.sidebarItem} ${activeTab === 'candidatos' ? styles.active : ''}`}
                            onClick={() => { setActiveTab('candidatos'); onClose(); }}
                            aria-current={activeTab === 'candidatos' ? 'page' : undefined}
                        >
                            <span className={styles.sidebarItemLeft}>
                                <span className={styles.sidebarItemIcon} aria-hidden="true">
                                    <BookOpen size={15} />
                                </span>
                                Candidatos
                            </span>
                            <span
                                className={styles.sidebarBadge}
                                aria-label={`${candidateCoursesCount} candidatos`}
                            >
                                {candidateCoursesCount}
                            </span>
                        </button>
                    )}

                    <button
                        type="button"
                        className={`${styles.sidebarItem} ${activeTab === 'material' ? styles.active : ''}`}
                        onClick={() => { setActiveTab('material'); onClose(); }}
                        aria-current={activeTab === 'material' ? 'page' : undefined}
                    >
                        <span className={styles.sidebarItemLeft}>
                            <span className={styles.sidebarItemIcon} aria-hidden="true">
                                <FileText size={15} />
                            </span>
                            Material
                        </span>
                        <span
                            className={styles.sidebarBadge}
                            aria-label={`${coursesCount} materiales`}
                        >
                            {coursesCount}
                        </span>
                    </button>

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
                    {/* Avatar — display only, no interacción */}
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
                            {/* Fallback visible únicamente si la imagen falla — controlado por CSS */}
                            <span className={styles.sidebarAvatarFallback} aria-hidden="true">
                                {getInitials(user?.name || user?.displayName)}
                            </span>
                        </div>
                        <div className={styles.sidebarUserDetails}>
                            <span className={styles.sidebarUserName}>
                                {user?.name?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Usuario'}
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