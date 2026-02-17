import { useCallback } from 'react';

/**
 * Hook de búsqueda de empleados.
 * Delega al loadEmployees del hook de paginación con term de búsqueda.
 *
 * @param {Function} loadEmployees - Función del hook de paginación
 * @returns {object} Función de búsqueda
 */
export function useEmployeeSearch(loadEmployees) {
    const searchEmployees = useCallback((term) => {
        loadEmployees('initial', term);
    }, [loadEmployees]);

    return { searchEmployees };
}
