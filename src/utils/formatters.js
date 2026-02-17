/**
 * Utilidades de formateo compartidas.
 * Centralizadas aquí para evitar duplicación en múltiples archivos.
 */

/**
 * Convierte una fecha ISO (YYYY-MM-DD) a formato legible (DD/MM/YYYY).
 * @param {string} dateString - Fecha en formato YYYY-MM-DD
 * @returns {string} Fecha formateada o cadena vacía si es inválida
 */
export function formatDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
}

/**
 * Genera un saludo personalizado basado en género.
 * Prioridad: campo de base de datos → heurística por nombre.
 *
 * @param {string} name - Nombre del usuario
 * @param {string|null} gender - Género del usuario (de la DB)
 * @returns {string} "Bienvenida" o "Bienvenido"
 */
export function getGreeting(name, gender) {
    // 1. Prioridad: Campo de Base de Datos
    if (gender) {
        const g = String(gender).toLowerCase().trim();
        if (['mujer', 'femenino', 'f', 'woman', 'female'].includes(g)) return 'Bienvenida';
        if (['hombre', 'masculino', 'm', 'man', 'male'].includes(g)) return 'Bienvenido';
    }

    // 2. Fallback: Detección por terminación de nombre 'a'
    if (!name) return 'Bienvenido';
    const firstName = name.trim().split(' ')[0].toLowerCase();
    // Excepciones comunes de nombres terminados en 'a' que son masculinos
    const exceptions = ['nicolas', 'jonas', 'elias', 'matias', 'lukas', 'abba', 'luca'];

    if (firstName.endsWith('a') && !exceptions.includes(firstName)) {
        return 'Bienvenida';
    }
    return 'Bienvenido';
}

/**
 * Convierte segundos restantes de bloqueo a minutos (redondeado arriba).
 * @param {number} seconds - Segundos restantes
 * @returns {number} Minutos redondeados
 */
export function formatBlockTime(seconds) {
    return Math.ceil(seconds / 60);
}
