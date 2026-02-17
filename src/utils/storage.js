/**
 * Utilidades seguras para acceder a localStorage/sessionStorage.
 * Protegen contra errores de SSR (Server-Side Rendering) y excepciones de storage.
 */

/**
 * Verifica si estamos en un entorno de navegador (no SSR).
 * @returns {boolean}
 */
export function isBrowser() {
    return typeof window !== 'undefined';
}

/**
 * Obtiene un valor de localStorage de forma segura.
 * @param {string} key - Clave a buscar
 * @returns {string|null} El valor o null si no existe o hay error
 */
export function safeGetLocalStorage(key) {
    if (!isBrowser()) return null;
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

/**
 * Guarda un valor en localStorage de forma segura.
 * @param {string} key - Clave
 * @param {string} value - Valor a guardar
 */
export function safeSetLocalStorage(key, value) {
    if (!isBrowser()) return;
    try {
        localStorage.setItem(key, value);
    } catch {
        console.error('Failed to set localStorage:', key);
    }
}

/**
 * Elimina un valor de localStorage de forma segura.
 * @param {string} key - Clave a eliminar
 */
export function safeRemoveLocalStorage(key) {
    if (!isBrowser()) return;
    try {
        localStorage.removeItem(key);
    } catch {
        console.error('Failed to remove localStorage:', key);
    }
}

/**
 * Obtiene un valor de sessionStorage de forma segura.
 * @param {string} key - Clave a buscar
 * @returns {string|null} El valor o null si no existe o hay error
 */
export function safeGetSessionStorage(key) {
    if (!isBrowser()) return null;
    try {
        return sessionStorage.getItem(key);
    } catch {
        return null;
    }
}

/**
 * Guarda un valor en sessionStorage de forma segura.
 * @param {string} key - Clave
 * @param {string} value - Valor a guardar
 */
export function safeSetSessionStorage(key, value) {
    if (!isBrowser()) return;
    try {
        sessionStorage.setItem(key, value);
    } catch {
        console.error('Failed to set sessionStorage:', key);
    }
}
