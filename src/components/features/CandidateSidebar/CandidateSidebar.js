import React from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { LogOut, LayoutDashboard, X, MessageCircle, Download } from 'lucide-react';
import styles from './CandidateSidebar.module.css';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function CandidateSidebar({
    user,
    handleLogout,
    isOpen,
    onClose
}) {
    const { isInstallable, promptInstall } = usePWAInstall();

    const getInitialsLocal = (name) => {
        if (!name) return 'US';
        const words = name.trim().split(' ');
        if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const phoneNumber = '+524211265940';
    const candidateName = user?.name || user?.nombre || user?.nickname || 'Candidato';
    const candidateId = user?.numeroEmpleado || user?.id || 'Nuevo Ingreso';
    const whatsappMessage = `Hola RRHH, necesito ayuda con la plataforma de inducción. Soy ${candidateName} (Matrícula: ${candidateId}).`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;

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
                aria-label="Navegación del Candidato"
            >
                <div className={styles.sidebarTop}>
                    {/* Brand sin redirección (es la landing default) */}
                    <div className={styles.sidebarBrand}>
                        <div className={styles.sidebarBrandDot} aria-hidden="true" />
                        <span className={styles.sidebarBrandName}>Viñoplastic</span>
                    </div>

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

                <nav className={styles.sidebarNav} aria-label="Secciones Disponibles">
                    <span className={styles.sidebarLabel} aria-hidden="true">Candidatos</span>

                    <button
                        type="button"
                        className={`${styles.sidebarItem} ${styles.active}`}
                        onClick={onClose}
                        aria-current="page"
                    >
                        <span className={styles.sidebarItemLeft}>
                            <span className={styles.sidebarItemIcon} aria-hidden="true">
                                <LayoutDashboard size={15} />
                            </span>
                            Dashboard
                        </span>
                    </button>

                    {isInstallable && (
                        <button
                            type="button"
                            className={styles.sidebarItem}
                            onClick={promptInstall}
                            title="Instalar como Aplicación NATIVA"
                        >
                            <span className={styles.sidebarItemLeft}>
                                <span className={styles.sidebarItemIcon} aria-hidden="true">
                                    <Download size={15} />
                                </span>
                                Instalar App
                            </span>
                        </button>
                    )}
                </nav>

                <div className={styles.sidebarProfile}>
                    {/* Avatar — display only, no interacción de ruteo externo */}
                    <div
                        className={styles.sidebarAvatarBtn}
                        title={user?.name || user?.nickname || user?.nombre || 'Candidato'}
                    >
                        <div className={styles.sidebarAvatar} aria-hidden="true">
                            <NextImage
                                src={
                                    user?.photoURL ||
                                    user?.avatar ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || user?.id || 'default')}`
                                }
                                alt=""
                                width={32}
                                height={32}
                                className={styles.sidebarAvatarImage}
                                unoptimized
                            />
                            {/* Fallback visible únicamente si la imagen falla — controlado por CSS */}
                            <span className={styles.sidebarAvatarFallback} aria-hidden="true">
                                {getInitialsLocal(user?.name || user?.nickname || user?.nombre)}
                            </span>
                        </div>
                        <div className={styles.sidebarUserDetails}>
                            <span className={styles.sidebarUserName}>
                                {(user?.nickname || user?.name || user?.nombre || 'Candidato').split(' ')[0]}
                            </span>
                        </div>
                    </div>

                    <div className={styles.sidebarProfileActions}>
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.sidebarIconBtn}
                            aria-label="Contactar Recursos Humanos"
                            title="Ayuda RRHH"
                        >
                            <MessageCircle size={16} aria-hidden="true" />
                        </a>

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
