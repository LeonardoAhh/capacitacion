'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import styles from './Toast.module.css';

// Toast Context
const ToastContext = createContext(null);

let toastId = 0;
const generateId = () => ++toastId;

// Toast Component
function Toast({ id, message, type = 'info', onClose, duration = 3000 }) {
    const [isClosing, setIsClosing] = useState(false);
    const timeoutRef = useRef(null);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => onClose(id), 200); // Wait for animation
    }, [id, onClose]);

    // Auto-dismiss effect
    useEffect(() => {
        if (duration > 0) {
            timeoutRef.current = setTimeout(handleClose, duration);
        }

        // Cleanup timeout on unmount or duration change
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [duration, handleClose]);

    const icons = {
        success: <CheckCircle size={20} />,
        error: <AlertCircle size={20} />,
        warning: <AlertTriangle size={20} />,
        info: <Info size={20} />
    };

    return (
        <div
            className={`${styles.toast} ${styles[type]} ${isClosing ? styles.closing : ''}`}
            role="alert"
            aria-live={type === 'error' ? 'assertive' : 'polite'}
        >
            <div className={styles.icon}>
                {icons[type]}
            </div>
            <div className={styles.message}>{message}</div>
            <button
                onClick={handleClose}
                className={styles.closeBtn}
                aria-label="Cerrar notificación"
                type="button"
            >
                <X size={16} />
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

    // Memoize toast helpers to prevent recreation on each render
    const toastHelpers = useMemo(() => ({
        success: (message, options = {}) =>
            showToast(message, 'success', options.duration ?? 3000),
        error: (message, options = {}) =>
            showToast(message, 'error', options.duration ?? 5000), // Longer for errors
        warning: (message, options = {}) =>
            showToast(message, 'warning', options.duration ?? 4000),
        info: (message, options = {}) =>
            showToast(message, 'info', options.duration ?? 3000),
        // Raw access
        show: showToast,
        clear: clearAllToasts
    }), [showToast, clearAllToasts]);

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