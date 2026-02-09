'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import styles from './Toast.module.css';

// Toast Context
const ToastContext = createContext(null);

// Toast Component
function Toast({ message, type = 'info', onClose, duration = 3000 }) {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 200); // Wait for animation
    };

    // Auto-dismiss
    if (duration > 0) {
        setTimeout(handleClose, duration);
    }

    const icons = {
        success: <CheckCircle size={20} />,
        error: <AlertCircle size={20} />,
        info: <Info size={20} />
    };

    return (
        <div
            className={`${styles.toast} ${styles[type]} ${isClosing ? styles.closing : ''}`}
            role="alert"
            aria-live="polite"
        >
            <div className={styles.icon}>
                {icons[type]}
            </div>
            <div className={styles.message}>{message}</div>
            <button
                onClick={handleClose}
                className={styles.closeBtn}
                aria-label="Cerrar notificación"
            >
                <X size={16} />
            </button>
        </div>
    );
}

// Toast Provider Component
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const closeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className={styles.toastContainer}>
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onClose={() => closeToast(toast.id)}
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
