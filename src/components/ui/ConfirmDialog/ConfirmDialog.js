'use client';

import { useState, useEffect, useRef } from 'react';
import { IconAlertTriangle, IconAlertCircle, IconInfo, IconTrash } from '@/lib/icons';
import styles from './ConfirmDialog.module.css';

const VARIANT_CONFIG = {
    danger: {
        Icon: IconTrash,
        iconColor: 'var(--color-danger)',
        confirmClass: 'danger',
    },
    warning: {
        Icon: IconAlertTriangle,
        iconColor: 'var(--color-warning)',
        confirmClass: 'warning',
    },
    info: {
        Icon: IconInfo,
        iconColor: 'var(--color-info)',
        confirmClass: 'info',
    },
};

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    variant = 'danger',
    requireConfirmation = false,
    confirmationText = '',
    loading = false,
}) {
    const [confirmationInput, setConfirmationInput] = useState('');
    const inputRef = useRef(null);

    const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.danger;
    const Icon = config.Icon;

    const canConfirm = requireConfirmation
        ? confirmationInput === confirmationText
        : true;

    useEffect(() => {
        if (isOpen && requireConfirmation && inputRef.current) {
            inputRef.current.focus();
        }
        if (!isOpen) {
            setConfirmationInput('');
        }
    }, [isOpen, requireConfirmation]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel?.();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <>
            <div className={styles.overlay} onClick={onCancel} aria-hidden="true" />
            <div
                className={styles.dialog}
                role="alertdialog"
                aria-labelledby="dialog-title"
                aria-describedby="dialog-description"
                aria-modal="true"
            >
                <div className={`${styles.iconContainer} ${styles[variant]}`}>
                    <Icon size={32} style={{ color: config.iconColor }} />
                </div>

                <h2 id="dialog-title" className={styles.title}>
                    {title}
                </h2>

                <p id="dialog-description" className={styles.message}>
                    {message}
                </p>

                {requireConfirmation && (
                    <div className={styles.confirmationWrapper}>
                        <p className={styles.confirmationHint}>
                            Escribe <strong>{confirmationText}</strong> para confirmar:
                        </p>
                        <input
                            ref={inputRef}
                            type="text"
                            value={confirmationInput}
                            onChange={(e) => setConfirmationInput(e.target.value)}
                            className={styles.confirmationInput}
                            placeholder={confirmationText}
                            autoComplete="off"
                        />
                    </div>
                )}

                <div className={styles.actions}>
                    <button
                        onClick={onCancel}
                        className={styles.cancelBtn}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`${styles.confirmBtn} ${styles[config.confirmClass]}`}
                        disabled={!canConfirm || loading}
                        aria-busy={loading}
                    >
                        {loading ? (
                            <span className={styles.spinner} aria-hidden="true" />
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </>
    );
}
