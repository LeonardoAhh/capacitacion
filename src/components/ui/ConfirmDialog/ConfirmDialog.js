'use client';

import { AlertTriangle } from 'lucide-react';
import styles from './ConfirmDialog.module.css';

export default function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    variant = 'danger' // 'danger' | 'warning' | 'info'
}) {
    if (!isOpen) return null;

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <>
            <div className={styles.overlay} onClick={onCancel} aria-hidden="true" />
            <div
                className={styles.dialog}
                role="alertdialog"
                aria-labelledby="dialog-title"
                aria-describedby="dialog-description"
                onKeyDown={handleKeyDown}
            >
                <div className={`${styles.iconContainer} ${styles[variant]}`}>
                    <AlertTriangle size={32} />
                </div>

                <h2 id="dialog-title" className={styles.title}>
                    {title}
                </h2>

                <p id="dialog-description" className={styles.message}>
                    {message}
                </p>

                <div className={styles.actions}>
                    <button
                        onClick={onCancel}
                        className={styles.cancelBtn}
                        autoFocus
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`${styles.confirmBtn} ${styles[variant]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </>
    );
}
