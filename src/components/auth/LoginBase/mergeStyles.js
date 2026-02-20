/**
 * Combina clases de dos CSS Modules. Cuando ambos módulos tienen la misma clase,
 * se concatenan ambas (el elemento obtiene las dos clases). Esto permite que
 * LoginBase defina los estilos base y el componente específico añada sus
 * CSS custom properties y sobrescrituras.
 *
 * @param {Object} base      - CSS Module con estilos base (LoginBase)
 * @param {Object} component - CSS Module con estilos específicos del componente
 * @returns {Object} Objeto con las clases combinadas
 */
export function mergeStyles(base, component) {
    const merged = {};
    const allKeys = new Set([...Object.keys(base), ...Object.keys(component)]);
    for (const key of allKeys) {
        merged[key] = [base[key], component[key]].filter(Boolean).join(' ');
    }
    return merged;
}
