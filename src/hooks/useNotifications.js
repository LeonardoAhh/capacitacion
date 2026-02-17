'use client';

import { useState, useEffect, useCallback } from 'react';

const NOTIFICATION_STORAGE_KEY = 'pwa_notifications_enabled';

export function useNotifications() {
    const [permission, setPermission] = useState('default');
    const [registration, setRegistration] = useState(null);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const supported = 'serviceWorker' in navigator && 'Notification' in window;
        setIsSupported(supported);

        if (!supported) return;

        setPermission(Notification.permission);

        navigator.serviceWorker.ready
            .then(reg => {
                setRegistration(reg);
            })
            .catch(err => {
                console.error('SW ready failed:', err);
            });
    }, []);

    const requestPermission = useCallback(async () => {
        if (!isSupported) {
            console.warn('Notifications not supported');
            return false;
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                localStorage.setItem(NOTIFICATION_STORAGE_KEY, 'true');
            }

            return result === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }, [isSupported]);

    const sendNotification = useCallback((title, options = {}) => {
        if (permission !== 'granted') return null;

        const defaultOptions = {
            icon: '/web-app-manifest-192x192.png',
            badge: '/web-app-manifest-192x192.png',
            vibrate: [200, 100, 200],
            requireInteraction: false,
            silent: false,
        };

        const mergedOptions = { ...defaultOptions, ...options };

        if (registration?.showNotification) {
            try {
                registration.showNotification(title, mergedOptions);
                return true;
            } catch (error) {
                console.warn('SW notification failed:', error);
            }
        }

        try {
            const { vibrate, requireInteraction, actions, ...safeOptions } = mergedOptions;
            new Notification(title, safeOptions);
            return true;
        } catch (error) {
            console.warn('Notification fallback failed:', error);
            return false;
        }
    }, [permission, registration]);

    const scheduleNotification = useCallback((title, options = {}, delayMs) => {
        if (permission !== 'granted') return null;

        const timeoutId = setTimeout(() => {
            sendNotification(title, options);
        }, delayMs);

        return () => clearTimeout(timeoutId);
    }, [permission, sendNotification]);

    const isEnabled = useCallback(() => {
        return permission === 'granted' && localStorage.getItem(NOTIFICATION_STORAGE_KEY) === 'true';
    }, [permission]);

    const disableNotifications = useCallback(() => {
        localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
    }, []);

    return {
        permission,
        isSupported,
        requestPermission,
        sendNotification,
        scheduleNotification,
        isEnabled,
        disableNotifications,
    };
}
