import { useState, useCallback, useEffect, useRef } from 'react';
import { isBrowser } from '@/utils/storage';

/**
 * Hook reutilizable para sincronizar estado con localStorage.
 * Maneja SSR, serialización JSON, y sincronización entre tabs.
 *
 * @param {string} key - Clave de localStorage
 * @param {*} initialValue - Valor por defecto si no hay dato guardado
 * @returns {[*, Function, Function]} [storedValue, setValue, removeValue]
 */
export function useLocalStorage(key, initialValue) {
    // Lazy initializer — solo lee localStorage 1 vez
    const [storedValue, setStoredValue] = useState(() => {
        if (!isBrowser()) return initialValue;
        try {
            const item = localStorage.getItem(key);
            return item !== null ? JSON.parse(item) : initialValue;
        } catch {
            return initialValue;
        }
    });

    // Ref para evitar re-renders innecesarios en el listener de storage
    const keyRef = useRef(key);
    keyRef.current = key;

    const setValue = useCallback((value) => {
        try {
            // Soporta updater function como useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            if (isBrowser()) {
                localStorage.setItem(key, JSON.stringify(valueToStore));
            }
        } catch (error) {
            console.error(`useLocalStorage: Error setting "${key}"`, error);
        }
    }, [key, storedValue]);

    const removeValue = useCallback(() => {
        try {
            setStoredValue(initialValue);
            if (isBrowser()) {
                localStorage.removeItem(key);
            }
        } catch (error) {
            console.error(`useLocalStorage: Error removing "${key}"`, error);
        }
    }, [key, initialValue]);

    // Sincronizar entre tabs/ventanas
    useEffect(() => {
        if (!isBrowser()) return;

        const handleStorageChange = (e) => {
            if (e.key === keyRef.current) {
                try {
                    setStoredValue(e.newValue !== null ? JSON.parse(e.newValue) : initialValue);
                } catch {
                    setStoredValue(initialValue);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [initialValue]);

    return [storedValue, setValue, removeValue];
}
