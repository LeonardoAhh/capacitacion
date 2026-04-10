'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { IconX, IconCheckCircle, IconAlertCircle, IconInfo, IconAlertTriangle } from '@/lib/icons';
import styles from './Toast.module.css';

// Toast Context
const ToastContext = createContext(null);

let toastId = 0;
const generateId = () => ++toastId;

// Toast Component
// `message` puede ser un string simple o un objeto { title, body }
function Toast({ id, message, type = 'info', onClose, duration = 3000 }) {
    const [isClosing, setIsClosing] = useState(false);
    const timeoutRef = useRef(null);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => onClose(id), 200);
    }, [id, onClose]);

    useEffect(() => {
        if (duration > 0) {
            timeoutRef.current = setTimeout(handleClose, duration);
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [duration, handleClose]);

    const icons = {
        success: <IconCheckCircle size={16} />,
        error: <IconAlertCircle size={16} />,
        warning: <IconAlertTriangle size={16} />,
        info: <IconInfo size={16} />
    };

    // Soporte para { title, body } o string plano
    const isRich = message && typeof message === 'object';
    const title = isRich ? message.title : null;
    const body = isRich ? message.body : message;

    return (
        <div
            className={`${styles.toast} ${styles[type]} ${isClosing ? styles.closing : ''}`}
            role="alert"
            aria-live={type === 'error' ? 'assertive' : 'polite'}
        >
            <div className={`${styles.icon} ${styles[type]}`} aria-hidden="true">
                {icons[type]}
            </div>
            <div className={styles.message}>
                {title && <strong className={styles.messageTitle}>{title}</strong>}
                {body && <span className={styles.messageBody}>{body}</span>}
            </div>
            <button
                onClick={handleClose}
                className={styles.closeBtn}
                aria-label="Cerrar notificación"
                type="button"
            >
                <IconX size={16} />
            </button>
        </div>
    );
}

// Toast Provider Component
export function ToastProvider({ children, maxToasts = 5 }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = generateId();

        setToasts(prev => {
            const newToasts = [...prev, { id, message, type, duration }];
            // Limit the number of toasts
            return newToasts.slice(-maxToasts);
        });

        return id; // Return ID for manual dismissal if needed
    }, [maxToasts]);

    const closeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const clearAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

    // Convierte la firma (title, body) o (message) en un objeto { title, body } o string
    const buildMessage = useCallback((titleOrMsg, maybeBody) => {
        if (typeof maybeBody === 'string') {
            // Firma: toast.success('Título', 'Descripción')
            return { title: titleOrMsg, body: maybeBody };
        }
        // Firma: toast.success('Mensaje') → string plano
        return titleOrMsg;
    }, []);

    // Memoize toast helpers to prevent recreation on each render
    const toastHelpers = useMemo(() => ({
        success: (titleOrMsg, maybeBodyOrOpts = {}) =>
            showToast(buildMessage(titleOrMsg, maybeBodyOrOpts), 'success',
                typeof maybeBodyOrOpts === 'object' && !Array.isArray(maybeBodyOrOpts)
                    ? (maybeBodyOrOpts.duration ?? 3000) : 3000),
        error: (titleOrMsg, maybeBodyOrOpts = {}) =>
            showToast(buildMessage(titleOrMsg, maybeBodyOrOpts), 'error',
                typeof maybeBodyOrOpts === 'object' && !Array.isArray(maybeBodyOrOpts)
                    ? (maybeBodyOrOpts.duration ?? 5000) : 5000),
        warning: (titleOrMsg, maybeBodyOrOpts = {}) =>
            showToast(buildMessage(titleOrMsg, maybeBodyOrOpts), 'warning',
                typeof maybeBodyOrOpts === 'object' && !Array.isArray(maybeBodyOrOpts)
                    ? (maybeBodyOrOpts.duration ?? 4000) : 4000),
        info: (titleOrMsg, maybeBodyOrOpts = {}) =>
            showToast(buildMessage(titleOrMsg, maybeBodyOrOpts), 'info',
                typeof maybeBodyOrOpts === 'object' && !Array.isArray(maybeBodyOrOpts)
                    ? (maybeBodyOrOpts.duration ?? 3000) : 3000),
        show: showToast,
        clear: clearAllToasts
    }), [showToast, clearAllToasts, buildMessage]);

    const contextValue = useMemo(() => ({
        toast: toastHelpers,
        showToast,
        clearAllToasts
    }), [toastHelpers, showToast, clearAllToasts]);

    return (
        <ToastContext.Provider value={contextValue}>
            {children}
            <div className={styles.toastContainer}>
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={closeToast}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

// Hook to use toast
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

// Export default Toast for standalone use
export default Toast;