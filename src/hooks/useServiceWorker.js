'use client';

import { useState, useEffect, useCallback } from 'react';
import { swManager } from '@/lib/pwa/serviceWorkerManager';

export function useServiceWorker() {
    const [isRegistered, setIsRegistered] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        swManager.register().then(registered => {
            setIsRegistered(registered);
        });

        const unsubscribe = swManager.subscribe(event => {
            if (event.type === 'UPDATE_AVAILABLE') {
                setUpdateAvailable(true);
            }
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsubscribe();
        };
    }, []);

    const applyUpdate = useCallback(async () => {
        await swManager.applyUpdate();
        window.location.reload();
    }, []);

    const getCacheStats = useCallback(() => swManager.getCacheStats(), []);
    const clearCache = useCallback(() => swManager.clearCache(), []);

    return {
        isRegistered,
        updateAvailable,
        isOnline,
        applyUpdate,
        getCacheStats,
        clearCache,
    };
}

export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        setIsOnline(navigator.onLine);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}
