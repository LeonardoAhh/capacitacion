'use client';

import { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dialog.module.css';
import { cn } from '@/lib/utils';

/**
 * Dialog/Modal component
 */
export function Dialog({
    open,
    onOpenChange,
    children,
    className,
    ...props
}) {
    const [mounted, setMounted] = useState(false);

    // Only render portal after component mounts on client
    useEffect(() => {
        setMounted(true);
    }, []);

    // Close on Escape key
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape' && open) {
            onOpenChange?.(false);
        }
    }, [open, onOpenChange]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Prevent body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open || !mounted) return null;

    return createPortal(
        <div className={styles.dialogRoot} {...props}>
            <div
                className={styles.overlay}
                onClick={() => onOpenChange?.(false)}
                aria-hidden="true"
            />
            <div className={cn(styles.content, className)}>
                {children}
            </div>
        </div>,
        document.body
    );
}

/**
 * Dialog header
 */
export function DialogHeader({ children, className, ...props }) {
    return (
        <div className={cn(styles.header, className)} {...props}>
            {children}
        </div>
    );
}

/**
 * Dialog title
 */
export function DialogTitle({ children, className, ...props }) {
    return (
        <h2 className={cn(styles.title, className)} {...props}>
            {children}
        </h2>
    );
}

/**
 * Dialog description
 */
export function DialogDescription({ children, className, ...props }) {
    return (
        <p className={cn(styles.description, className)} {...props}>
            {children}
        </p>
    );
}

/**
 * Dialog body content
 */
export function DialogBody({ children, className, ...props }) {
    return (
        <div className={cn(styles.body, className)} {...props}>
            {children}
        </div>
    );
}

/**
 * Dialog footer with actions
 */
export function DialogFooter({ children, className, ...props }) {
    return (
        <div className={cn(styles.footer, className)} {...props}>
            {children}
        </div>
    );
}

/**
 * Dialog close button
 */
export function DialogClose({ onClose, className, ...props }) {
    return (
        <button
            className={cn(styles.closeButton, className)}
            onClick={onClose}
            aria-label="Cerrar"
            {...props}
        >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
        </button>
    );
}

export default Dialog;
