'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dialog.module.css';
import { cn } from '@/lib/utils';

/**
 * Dialog/Modal component with accessibility features
 */
export function Dialog({
    open,
    onOpenChange,
    children,
    className,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    ...props
}) {
    const [mounted, setMounted] = useState(false);
    const dialogRef = useRef(null);
    const previousActiveElement = useRef(null);

    // Only render portal after component mounts on client
    useEffect(() => {
        setMounted(true);
    }, []);

    // Close on Escape key
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape' && open) {
            onOpenChange?.(false);
        }

        // Focus trap - Tab key handling
        if (e.key === 'Tab' && open && dialogRef.current) {
            const focusableElements = dialogRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
            }
        }
    }, [open, onOpenChange]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Prevent body scroll and manage focus when open
    useEffect(() => {
        if (open) {
            // Store currently focused element
            previousActiveElement.current = document.activeElement;
            document.body.style.overflow = 'hidden';

            // Focus first focusable element in dialog
            setTimeout(() => {
                if (dialogRef.current) {
                    const firstFocusable = dialogRef.current.querySelector(
                        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                    );
                    firstFocusable?.focus();
                }
            }, 10);
        } else {
            document.body.style.overflow = '';
            // Restore focus to previous element
            previousActiveElement.current?.focus();
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
            <div
                ref={dialogRef}
                className={cn(styles.content, className)}
                role="dialog"
                aria-modal="true"
                aria-labelledby={ariaLabelledBy}
                aria-describedby={ariaDescribedBy}
            >
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
