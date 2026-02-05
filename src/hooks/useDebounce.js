import { useState, useEffect } from 'react';

/**
 * Hook personalizado para aplicar debounce a un valor
 * @param {any} value - Valor a aplicar debounce
 * @param {number} delay - Delay en milisegundos (default: 500)
 * @returns {any} - Valor con debounce aplicado
 */
export default function useDebounce(value, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Crear timer que actualizará el valor después del delay
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Limpiar el timeout si el valor cambia antes del delay
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
