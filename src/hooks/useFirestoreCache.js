'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const CACHE_PREFIX = 'firestore_cache_';
const DEFAULT_TTL = 5 * 60 * 1000;

export function useFirestoreCache(collectionName, options = {}) {
    const {
        ttl = DEFAULT_TTL,
        enabled = true,
        onCacheHit,
        onCacheMiss,
    } = options;

    const [cachedData, setCachedData] = useState(null);
    const [cacheStatus, setCacheStatus] = useState('idle');
    const lastFetchRef = useRef(null);

    const getCacheKey = useCallback((key) => {
        return `${CACHE_PREFIX}${collectionName}_${key}`;
    }, [collectionName]);

    const getFromCache = useCallback((key) => {
        if (typeof window === 'undefined' || !enabled) return null;

        try {
            const cacheKey = getCacheKey(key);
            const cached = localStorage.getItem(cacheKey);

            if (!cached) return null;

            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();

            if (now - timestamp > ttl) {
                localStorage.removeItem(cacheKey);
                return null;
            }

            return data;
        } catch {
            return null;
        }
    }, [enabled, getCacheKey, ttl]);

    const setToCache = useCallback((key, data) => {
        if (typeof window === 'undefined' || !enabled) return false;

        try {
            const cacheKey = getCacheKey(key);
            const payload = {
                data,
                timestamp: Date.now(),
            };

            localStorage.setItem(cacheKey, JSON.stringify(payload));
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                clearOldCache();
                try {
                    localStorage.setItem(cacheKey, JSON.stringify(payload));
                    return true;
                } catch {
                    return false;
                }
            }
            return false;
        }
    }, [enabled, getCacheKey]);

    const invalidateCache = useCallback((key) => {
        if (typeof window === 'undefined') return;

        try {
            const cacheKey = getCacheKey(key);
            localStorage.removeItem(cacheKey);
        } catch {
            // ignore
        }
    }, [getCacheKey]);

    const clearCollectionCache = useCallback(() => {
        if (typeof window === 'undefined') return;

        const keys = Object.keys(localStorage);
        const prefix = `${CACHE_PREFIX}${collectionName}_`;

        keys.forEach(key => {
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        });
    }, [collectionName]);

    const wrapQuery = useCallback(async (queryKey, queryFn, forceRefresh = false) => {
        if (!forceRefresh) {
            const cached = getFromCache(queryKey);

            if (cached !== null) {
                setCachedData(cached);
                setCacheStatus('hit');
                onCacheHit?.(queryKey);
                return cached;
            }
        }

        setCacheStatus('miss');
        onCacheMiss?.(queryKey);

        const data = await queryFn();

        setToCache(queryKey, data);
        setCachedData(data);
        lastFetchRef.current = Date.now();

        return data;
    }, [getFromCache, setToCache, onCacheHit, onCacheMiss]);

    const isStale = useCallback((key) => {
        if (typeof window === 'undefined') return true;

        try {
            const cacheKey = getCacheKey(key);
            const cached = localStorage.getItem(cacheKey);

            if (!cached) return true;

            const { timestamp } = JSON.parse(cached);
            return Date.now() - timestamp > ttl;
        } catch {
            return true;
        }
    }, [getCacheKey, ttl]);

    return {
        cachedData,
        cacheStatus,
        getFromCache,
        setToCache,
        invalidateCache,
        clearCollectionCache,
        wrapQuery,
        isStale,
        lastFetch: lastFetchRef.current,
    };
}

function clearOldCache() {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));

    const items = cacheKeys.map(key => {
        try {
            const data = JSON.parse(localStorage.getItem(key));
            return { key, timestamp: data?.timestamp || 0 };
        } catch {
            return { key, timestamp: 0 };
        }
    });

    items.sort((a, b) => b.timestamp - a.timestamp);

    const toRemove = items.slice(50);
    toRemove.forEach(item => {
        try {
            localStorage.removeItem(item.key);
        } catch {
            // ignore
        }
    });
}

export function useCacheInvalidation() {
    const invalidateAll = useCallback(() => {
        if (typeof window === 'undefined') return;

        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }, []);

    const getCacheSize = useCallback(() => {
        if (typeof window === 'undefined') return 0;

        let total = 0;
        const keys = Object.keys(localStorage);

        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                const value = localStorage.getItem(key);
                if (value) {
                    total += value.length * 2;
                }
            }
        });

        return total;
    }, []);

    return {
        invalidateAll,
        getCacheSize,
    };
}
