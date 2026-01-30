import { useState, useEffect } from 'react';

export function useNotifications() {
    const [permission, setPermission] = useState('default');
    const [registration, setRegistration] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
            // Register SW if not already (or just get reg)
            navigator.serviceWorker.register('/sw.js')
                .then(reg => {
                    console.log('SW registred:', reg);
                    setRegistration(reg);
                })
                .catch(err => console.error('SW reg failed:', err));

            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return false;
        }

        const result = await Notification.requestPermission();
        setPermission(result);
        return result === 'granted';
    };

    const sendNotification = (title, options = {}) => {
        if (permission !== 'granted') return;

        // Try using SW registration first (for persistent notifications on mobile)
        if (registration && registration.showNotification) {
            registration.showNotification(title, {
                icon: '/icon.svg',
                badge: '/icon.svg',
                vibrate: [200, 100, 200],
                ...options
            });
        } else {
            // Fallback to standard Notification API
            new Notification(title, {
                icon: '/icon.svg',
                ...options
            });
        }
    };

    return {
        permission,
        requestPermission,
        sendNotification
    };
}
