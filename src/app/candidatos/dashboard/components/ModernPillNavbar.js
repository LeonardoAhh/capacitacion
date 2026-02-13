'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { User, LogOut, ChevronDown, Clock, Contrast, Camera } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './ModernPillNavbar.module.css';
import { extractFirstName, getCandidatePhotoUrl } from '../utils/helpers';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_NAME = 'CANDIDATO';
const DEFAULT_ROLE = 'PUESTO';

// ─── Animation variants ───────────────────────────────────────────────────────

const DROPDOWN_VARIANTS = {
    hidden: { opacity: 0, scale: 0.94, y: -6, filter: 'blur(4px)' },
    visible: {
        opacity: 1, scale: 1, y: 0, filter: 'blur(0px)',
        transition: {
            duration: 0.22, ease: [0.22, 1, 0.36, 1],
            staggerChildren: 0.04, delayChildren: 0.04,
        },
    },
    exit: {
        opacity: 0, scale: 0.96, y: -4, filter: 'blur(3px)',
        transition: { duration: 0.15, ease: 'easeIn' },
    },
};

const ITEM_VARIANTS = {
    hidden: { opacity: 0, x: -5 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ─── MenuItem ─────────────────────────────────────────────────────────────────

const MenuItem = ({ onClick, icon: Icon, label, variant }) => (
    <motion.button
        className={`${styles.menuItem} ${variant ? styles[variant] : ''}`}
        variants={ITEM_VARIANTS}
        onClick={onClick}
        type="button"
        whileTap={{ scale: 0.97 }}
    >
        <Icon size={17} className={styles.menuItemIcon} aria-hidden="true" />
        <span>{label}</span>
    </motion.button>
);

const Separator = () => (
    <motion.div className={styles.separator} variants={ITEM_VARIANTS} />
);

// ─── DropdownPortal ───────────────────────────────────────────────────────────
// Renders the dropdown at document.body level so it's never clipped
// by any parent with overflow, transform, or stacking context issues.

function DropdownPortal({ isOpen, anchorRef, onClose, children }) {
    const [coords, setCoords] = useState({ top: 0, right: 0 });
    const [mounted, setMounted] = useState(false);

    // Only mount portal on client
    useEffect(() => { setMounted(true); }, []);

    // Recalculate position whenever dropdown opens
    useEffect(() => {
        if (!isOpen || !anchorRef.current) return;

        function calculate() {
            const rect = anchorRef.current.getBoundingClientRect();
            const vw = window.innerWidth;
            const MARGIN = 12; // minimum gap from viewport edges
            const DROPDOWN_WIDTH = vw < 640 ? Math.min(300, vw - 24) : 230;

            // Ideal: right-align dropdown with pill's right edge
            let rightVal = vw - rect.right;

            // Clamp so dropdown doesn't overflow past left edge
            const maxRight = vw - DROPDOWN_WIDTH - MARGIN;
            if (rightVal > maxRight) rightVal = maxRight;

            // Also ensure it doesn't overflow past right edge
            if (rightVal < MARGIN) rightVal = MARGIN;

            setCoords({
                top: rect.bottom + 8,
                right: rightVal,
            });
        }

        calculate();
        // Recalculate on scroll or resize (e.g. PWA address bar hide/show)
        window.addEventListener('resize', calculate);
        window.addEventListener('scroll', calculate, true);
        return () => {
            window.removeEventListener('resize', calculate);
            window.removeEventListener('scroll', calculate, true);
        };
    }, [isOpen, anchorRef]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Invisible full-screen overlay to catch outside clicks */}
                    <div
                        className={styles.portalBackdrop}
                        onClick={onClose}
                        aria-hidden="true"
                    />
                    <motion.div
                        className={styles.dropdownMenu}
                        role="menu"
                        aria-label="Opciones de usuario"
                        variants={DROPDOWN_VARIANTS}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        style={{
                            position: 'fixed',
                            top: coords.top,
                            right: coords.right,
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}

// ─── ModernPillNavbar ─────────────────────────────────────────────────────────

export default function ModernPillNavbar({
    candidate,
    onLogout,
    timeLeft,
    onAvatarClick,
    onThemeClick,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [imgError, setImgError] = useState(false);
    const pillRef = useRef(null);

    // ── Derived values ──
    const displayName = useMemo(() => {
        const fullName = candidate?.name || candidate?.nombre;
        if (!fullName) return DEFAULT_NAME;
        const firstName = extractFirstName(fullName);
        const parts = fullName.trim().split(/\s+/);
        const lastName = parts[0] || '';
        return `${firstName} ${lastName}`.toUpperCase();
    }, [candidate?.name, candidate?.nombre]);

    const displayRole = useMemo(() =>
        candidate?.position || candidate?.puesto || DEFAULT_ROLE,
        [candidate?.position, candidate?.puesto]
    );

    const photoUrl = useMemo(() => getCandidatePhotoUrl(candidate), [candidate]);
    const formattedTime = useMemo(() =>
        timeLeft !== undefined ? formatTime(timeLeft) : null,
        [timeLeft]
    );
    const lowTime = timeLeft !== undefined && timeLeft < 60;

    // ── Handlers ──
    const toggle = useCallback(() => setIsOpen(v => !v), []);
    const close = useCallback(() => setIsOpen(false), []);

    // Escape key to close
    useEffect(() => {
        if (!isOpen) return;
        const onEsc = (e) => { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', onEsc);
        return () => document.removeEventListener('keydown', onEsc);
    }, [isOpen, close]);

    const handleAvatar = useCallback(() => { onAvatarClick?.(); close(); }, [onAvatarClick, close]);
    const handleTheme = useCallback(() => { onThemeClick?.(); close(); }, [onThemeClick, close]);
    const handleLogout = useCallback(() => { onLogout?.(); close(); }, [onLogout, close]);

    return (
        <>
            {/* ── Pill ── */}
            <div className={styles.navbarContainer} ref={pillRef}>

                {/* User info — hidden on mobile via CSS */}
                <div className={styles.userInfo} aria-hidden="true">
                    <span className={styles.userName}>{displayName}</span>
                    <span className={styles.userRole}>{displayRole}</span>
                </div>

                {/* Avatar button */}
                <button
                    className={styles.avatarWrapper}
                    onClick={toggle}
                    aria-label={`Menú de ${displayName}`}
                    aria-expanded={isOpen}
                    aria-haspopup="menu"
                    type="button"
                >
                    <div className={styles.avatar}>
                        {photoUrl && !imgError ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={photoUrl}
                                alt={displayName}
                                className={styles.avatarImg}
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <User size={19} aria-hidden="true" />
                        )}
                    </div>
                    <span className={styles.onlineDot} aria-hidden="true" />
                </button>

                {/* Chevron */}
                <motion.button
                    className={styles.menuTrigger}
                    onClick={toggle}
                    aria-hidden="true"
                    tabIndex={-1}
                    type="button"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                    <ChevronDown size={16} />
                </motion.button>
            </div>

            {/* ── Dropdown — rendered at body level via portal ── */}
            <DropdownPortal isOpen={isOpen} anchorRef={pillRef} onClose={close}>

                {/* Name + role summary */}
                <motion.div className={styles.menuHeader} variants={ITEM_VARIANTS}>
                    <span className={styles.menuHeaderName}>{displayName}</span>
                    <span className={styles.menuHeaderRole}>{displayRole}</span>
                </motion.div>

                {/* Timer */}
                {formattedTime && (
                    <motion.div
                        className={`${styles.menuItem} ${styles.timerItem} ${lowTime ? styles.timerLow : ''}`}
                        variants={ITEM_VARIANTS}
                        role="status"
                        aria-live="polite"
                    >
                        <Clock size={15} aria-hidden="true" />
                        <span>{formattedTime}</span>
                    </motion.div>
                )}

                <Separator />
                <MenuItem onClick={handleAvatar} icon={Camera} label="Cambiar Avatar" />
                <MenuItem onClick={handleTheme} icon={Contrast} label="Cambiar Tema" />
                <Separator />
                <MenuItem onClick={handleLogout} icon={LogOut} label="Cerrar Sesión" variant="logoutItem" />

            </DropdownPortal>
        </>
    );
}