/**
 * useEmployees — Barrel hook que compone paginación, CRUD, y búsqueda.
 * Mantiene la misma API pública para no romper imports existentes.
 *
 * Para uso granular, importar directamente:
 * - useEmployeePagination — paginación y carga
 * - useEmployeeCRUD — crear, actualizar, eliminar
 * - useEmployeeSearch — búsqueda por texto
 */

import { useEmployeePagination } from './useEmployeePagination';
import { useEmployeeCRUD } from './useEmployeeCRUD';
import { useEmployeeSearch } from './useEmployeeSearch';

const ITEMS_PER_PAGE = 4;

export const useEmployees = (itemsPerPage = ITEMS_PER_PAGE) => {
    const {
        employees,
        setEmployees,
        loading,
        error,
        page,
        hasMore,
        hasPrevious,
        nextPage,
        prevPage,
        refresh,
        loadEmployees,
    } = useEmployeePagination(itemsPerPage);

    const { createEmployee, updateEmployee, deleteEmployee } = useEmployeeCRUD({
        refresh,
        setEmployees,
        employeesLength: employees.length,
        page,
        prevPage,
    });

    const { searchEmployees } = useEmployeeSearch(loadEmployees);

    return {
        employees,
        loading,
        error,
        page,
        hasMore,
        hasPrevious,
        nextPage,
        prevPage,
        searchEmployees,
        refresh,
        createEmployee,
        updateEmployee,
        deleteEmployee,
    };
};
