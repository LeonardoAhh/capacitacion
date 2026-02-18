'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

// Toast Context
const ToastContext = createContext(null);

// Toast types configuration
const TOAST_CONFIG = {
    success: {
        icon: CheckCircle,
        className: 'success',
        duration: 3000
    },
    error: {
        icon: AlertCircle,
        className: 'error',
        duration: 5000
    },
    warning: {
        icon: AlertTriangle,
        className: 'warning',
        duration: 4000
    },
    info: {
        icon: Info,
        className: 'info',
        duration: 3000
    }
};

// Individual Toast Component
function Toast({ id, type, message, onClose }) {
    const config = TOAST_CONFIG[type] || TOAST_CONFIG.info;
    const Icon = config.icon;

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, config.duration);

        return () => clearTimeout(timer);
    }, [id, config.duration, onClose]);

    return (
        <motion.div
            className={`${styles.toast} ${styles[config.className]}`}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            layout
            role="alert"
            aria-live="polite"
        >
            <Icon size={20} className={styles.icon} />
            <span className={styles.message}>{message}</span>
            <button
                className={styles.closeButton}
                onClick={() => onClose(id)}
                aria-label="Cerrar notificación"
            >
                <X size={16} />
            </button>
        </motion.div>
    );
}

// Toast Container Component
function ToastContainer({ toasts, removeToast }) {
    return (
        <div className={styles.container} aria-label="Notificaciones">
            <AnimatePresence mode="popLayout">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        {...toast}
                        onClose={removeToast}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

// Toast Provider
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((type, message) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, type, message }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const toast = useMemo(() => ({
        success: (message) => addToast('success', message),
        error: (message) => addToast('error', message),
        warning: (message) => addToast('warning', message),
        info: (message) => addToast('info', message)
    }), [addToast]);

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

// Hook to use toast
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

