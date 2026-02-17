'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_PREFIX = 'offline_data_';

export function useOfflineStorage(key, initialValue = null) {
    const [data, setData] = useState(initialValue);
    const [lastSync, setLastSync] = useState(null);
    const [isStale, setIsStale] = useState(false);

    const storageKey = useMemo(() => `${STORAGE_PREFIX}${key}`, [key]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                setData(parsed.data);
                setLastSync(parsed.timestamp);
                setIsStale(Date.now() - parsed.timestamp > 5 * 60 * 1000);
            }
        } catch (error) {
            console.error(`Error loading offline data for ${key}:`, error);
        }
    }, [storageKey, key]);

    const saveData = useCallback((newData) => {
        if (typeof window === 'undefined') return;

        const payload = {
            data: newData,
            timestamp: Date.now(),
        };

        try {
            localStorage.setItem(storageKey, JSON.stringify(payload));
            setData(newData);
            setLastSync(payload.timestamp);
            setIsStale(false);
        } catch (error) {
            console.error(`Error saving offline data for ${key}:`, error);

            if (error.name === 'QuotaExceededError') {
                clearOldData();
                try {
                    localStorage.setItem(storageKey, JSON.stringify(payload));
                    setData(newData);
                    setLastSync(payload.timestamp);
                    setIsStale(false);
                } catch (retryError) {
                    console.error('Failed to save after clearing old data:', retryError);
                }
            }
        }
    }, [storageKey, key]);

    const clearData = useCallback(() => {
        if (typeof window === 'undefined') return;

        try {
            localStorage.removeItem(storageKey);
            setData(initialValue);
            setLastSync(null);
            setIsStale(false);
        } catch (error) {
            console.error(`Error clearing offline data for ${key}:`, error);
        }
    }, [storageKey, initialValue, key]);

    return {
        data,
        lastSync,
        isStale,
        saveData,
        clearData,
    };
}

function clearOldData() {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage);
    const offlineKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));

    const items = offlineKeys.map(storageKey => {
        try {
            const storedData = JSON.parse(localStorage.getItem(storageKey));
            return { key: storageKey, timestamp: storedData?.timestamp || 0 };
        } catch {
            return { key: storageKey, timestamp: 0 };
        }
    });

    items.sort((a, b) => b.timestamp - a.timestamp);

    const toRemove = items.slice(10);
    toRemove.forEach(item => {
        try {
            localStorage.removeItem(item.key);
        } catch {
            // ignore
        }
    });
}

export function useOfflineQueue(queueName) {
    const [queue, setQueue] = useState([]);

    const queueKey = useMemo(() => `${STORAGE_PREFIX}queue_${queueName}`, [queueName]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const stored = localStorage.getItem(queueKey);
            if (stored) {
                setQueue(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading offline queue:', error);
        }
    }, [queueKey]);

    const addToQueue = useCallback((item) => {
        const newItem = {
            ...item,
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            attempts: 0,
        };

        setQueue(prev => {
            const updated = [...prev, newItem];
            try {
                localStorage.setItem(queueKey, JSON.stringify(updated));
            } catch (error) {
                console.error('Error saving to offline queue:', error);
            }
            return updated;
        });

        return newItem.id;
    }, [queueKey]);

    const removeFromQueue = useCallback((itemId) => {
        setQueue(prev => {
            const updated = prev.filter(item => item.id !== itemId);
            try {
                localStorage.setItem(queueKey, JSON.stringify(updated));
            } catch (error) {
                console.error('Error removing from offline queue:', error);
            }
            return updated;
        });
    }, [queueKey]);

    const incrementAttempts = useCallback((itemId) => {
        setQueue(prev => {
            const updated = prev.map(item =>
                item.id === itemId
                    ? { ...item, attempts: item.attempts + 1 }
                    : item
            );
            try {
                localStorage.setItem(queueKey, JSON.stringify(updated));
            } catch (error) {
                console.error('Error updating offline queue:', error);
            }
            return updated;
        });
    }, [queueKey]);

    const clearQueue = useCallback(() => {
        setQueue([]);
        try {
            localStorage.removeItem(queueKey);
        } catch (error) {
            console.error('Error clearing offline queue:', error);
        }
    }, [queueKey]);

    return {
        queue,
        addToQueue,
        removeFromQueue,
        incrementAttempts,
        clearQueue,
        pendingCount: queue.length,
    };
}
