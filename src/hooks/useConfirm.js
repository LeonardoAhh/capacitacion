'use client';

import { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './useConfirm.module.css';

/**
 * Hook global para reemplazar window.confirm() con un modal estilo AlertDialog.
 *
 * Uso:
 *   const { confirmDialog, showConfirm } = useConfirm();
 *
 *   // En el JSX raíz del componente:
 *   {confirmDialog}
 *
 *   // En handlers async:
 *   const ok = await showConfirm('¿Eliminar este elemento?', { danger: true });
 *   if (!ok) return;
 */
export function useConfirm() {
    const [state, setState] = useState({
        open: false,
        message: '',
        title: '',
        danger: false,
        confirmLabel: 'Confirmar',
        cancelLabel: 'Cancelar',
    });

    const resolveRef = useRef(null);

    const showConfirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            setState({
                open: true,
                message,
                title: options.title || '¿Confirmar acción?',
                danger: options.danger ?? true,
                confirmLabel: options.confirmLabel || 'Confirmar',
                cancelLabel: options.cancelLabel || 'Cancelar',
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setState(s => ({ ...s, open: false }));
        resolveRef.current?.(true);
    }, []);

    const handleCancel = useCallback(() => {
        setState(s => ({ ...s, open: false }));
        resolveRef.current?.(false);
    }, []);

    const confirmDialog = state.open
        ? createPortal(
            <>
                <div className={styles.overlay} onClick={handleCancel} aria-hidden="true" />
                <div className={styles.wrapper}>
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="confirm-title"
                        aria-describedby="confirm-message"
                        className={styles.dialog}
                    >
                        <div className={styles.header}>
                            <h2 id="confirm-title" className={styles.title}>
                                {state.title}
                            </h2>
                        </div>

                        <p id="confirm-message" className={styles.message}>
                            {state.message}
                        </p>

                        <div className={styles.footer}>
                            <button className={styles.cancelBtn} onClick={handleCancel} type="button">
                                {state.cancelLabel}
                            </button>
                            <button
                                className={`${styles.confirmBtn} ${state.danger ? styles.danger : styles.default}`}
                                onClick={handleConfirm}
                                type="button"
                            >
                                {state.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </>,
            document.body
        )
        : null;

    return { showConfirm, confirmDialog };
}
