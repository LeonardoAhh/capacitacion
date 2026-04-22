'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './useConfirm.module.css';

/* ── Iconos inline (sin dependencias) ───────────────────── */
const IconCheck = (props) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
        <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IconX = (props) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
        <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
);
const IconTrash = (props) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
        <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9a1.5 1.5 0 0 0 1.5 1.4h3.6a1.5 1.5 0 0 0 1.5-1.4L12 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IconAlert = (props) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
        <path d="M8 2.5L1.5 13.5h13L8 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 6.5v3M8 11.5v.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
);

/**
 * useConfirm — Dialog moderno, minimalista.
 * Acciones (Cancelar / Confirmar) en la parte superior.
 *
 * Uso:
 *   const { confirmDialog, showConfirm } = useConfirm();
 *   {confirmDialog}
 *
 *   const ok = await showConfirm('¿Eliminar curso?', { variant: 'delete' });
 *   if (!ok) return;
 *
 * Opciones:
 *   - title?: string                       → si se omite, el primer arg es el título
 *   - description?: string                 → texto secundario opcional
 *   - variant?: 'default' | 'delete' | 'warning'
 *   - confirmLabel?: string                → default según variante
 *   - cancelLabel?: string                 → default 'Cancelar'
 *   - danger?: boolean                     → alias legacy de variant='delete'
 */
export function useConfirm() {
    const [state, setState] = useState({
        open: false,
        closing: false,
        title: '',
        description: '',
        variant: 'default',
        confirmLabel: '',
        cancelLabel: 'Cancelar',
    });

    const resolveRef = useRef(null);
    const confirmBtnRef = useRef(null);
    const closeTimerRef = useRef(null);

    const showConfirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            const variant = options.variant
                ?? (options.danger === false ? 'default' : (options.danger ? 'delete' : 'default'));
            const defaultConfirm =
                variant === 'delete'  ? 'Eliminar' :
                variant === 'warning' ? 'Continuar' :
                                        'Confirmar';
            setState({
                open: true,
                closing: false,
                // Si options.title presente → message va a description; si no, message es título
                title: options.title || message,
                description: options.title ? message : (options.description || ''),
                variant,
                confirmLabel: options.confirmLabel || defaultConfirm,
                cancelLabel: options.cancelLabel || 'Cancelar',
            });
        });
    }, []);

    /* Cierre con animación de salida (180ms) antes de desmontar */
    const closeWith = useCallback((result) => {
        setState(s => ({ ...s, closing: true }));
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => {
            setState(s => ({ ...s, open: false, closing: false }));
            resolveRef.current?.(result);
        }, 180);
    }, []);

    const handleConfirm = useCallback(() => closeWith(true), [closeWith]);
    const handleCancel  = useCallback(() => closeWith(false), [closeWith]);

    useEffect(() => () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    }, []);

    /* Esc → cancela, Enter → confirma. Focus inicial en confirm. */
    useEffect(() => {
        if (!state.open) return;
        confirmBtnRef.current?.focus();
        const onKey = (e) => {
            if (e.key === 'Escape') { e.stopPropagation(); handleCancel(); }
            else if (e.key === 'Enter') { e.stopPropagation(); handleConfirm(); }
        };
        document.addEventListener('keydown', onKey, true);
        return () => document.removeEventListener('keydown', onKey, true);
    }, [state.open, handleCancel, handleConfirm]);

    const VariantIcon =
        state.variant === 'delete'  ? IconTrash :
        state.variant === 'warning' ? IconAlert :
                                      IconCheck;

    const confirmDialog = state.open
        ? createPortal(
            <div className={`${styles.root} ${state.closing ? styles.closing : ''}`} role="presentation">
                <div className={styles.overlay} onClick={handleCancel} aria-hidden="true" />
                <div
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="confirm-title"
                    aria-describedby={state.description ? 'confirm-desc' : undefined}
                    className={`${styles.dialog} ${styles[`v_${state.variant}`]}`}
                >
                    {/* Icono centrado superior */}
                    <div className={styles.iconWrap} aria-hidden="true">
                        <span className={`${styles.iconBadge} ${styles[`badge_${state.variant}`]}`}>
                            <VariantIcon />
                        </span>
                    </div>

                    {/* Contenido */}
                    <div className={styles.content}>
                        <h2 id="confirm-title" className={styles.title}>
                            {state.title}
                        </h2>
                        {state.description && (
                            <p id="confirm-desc" className={styles.description}>
                                {state.description}
                            </p>
                        )}
                    </div>

                    {/* Acciones inferiores — etiquetadas */}
                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={`${styles.btn} ${styles.btnCancel}`}
                            onClick={handleCancel}
                        >
                            {state.cancelLabel}
                        </button>
                        <button
                            ref={confirmBtnRef}
                            type="button"
                            className={`${styles.btn} ${styles.btnConfirm} ${styles[`btn_${state.variant}`]}`}
                            onClick={handleConfirm}
                        >
                            {state.confirmLabel}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )
        : null;

    return { showConfirm, confirmDialog };
}
