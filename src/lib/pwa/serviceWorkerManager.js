'use client';

const SW_UPDATE_INTERVAL = 60 * 60 * 1000;

class ServiceWorkerManager {
    constructor() {
        this.registration = null;
        this.updateAvailable = false;
        this.listeners = new Set();
    }

    async register() {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
            return false;
        }

        try {
            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });

            this.setupUpdateCheck();
            this.handleControllerChange();

            return true;
        } catch (error) {
            console.error('SW registration failed:', error);
            return false;
        }
    }

    setupUpdateCheck() {
        if (!this.registration) return;

        this.registration.addEventListener('updatefound', () => {
            const newWorker = this.registration.installing;

            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.updateAvailable = true;
                        this.notifyListeners({ type: 'UPDATE_AVAILABLE' });
                    }
                });
            }
        });

        setInterval(() => {
            this.registration?.update?.();
        }, SW_UPDATE_INTERVAL);
    }

    handleControllerChange() {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            this.notifyListeners({ type: 'CONTROLLER_CHANGED' });
        });
    }

    async applyUpdate() {
        if (!this.registration?.waiting) return;

        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notifyListeners(event) {
        this.listeners.forEach(listener => listener(event));
    }

    async getCacheStats() {
        if (!('caches' in window)) return null;

        try {
            const cacheNames = await caches.keys();
            const stats = {};

            for (const name of cacheNames) {
                const cache = await caches.open(name);
                const keys = await cache.keys();
                stats[name] = keys.length;
            }

            return stats;
        } catch {
            return null;
        }
    }

    async clearCache() {
        if (!('caches' in window)) return false;

        try {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
            return true;
        } catch {
            return false;
        }
    }
}

export const swManager = new ServiceWorkerManager();
