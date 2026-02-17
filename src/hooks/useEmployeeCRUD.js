import { useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, setDoc, limit } from 'firebase/firestore';

/**
 * Hook CRUD para empleados.
 * Maneja crear, actualizar, y eliminar empleados en Firestore.
 *
 * @param {Function} refresh - Función para recargar la lista
 * @param {Function} setEmployees - Setter del estado de empleados
 * @param {number} employeesLength - Largo actual del array para manejar paginación post-delete
 * @param {number} page - Página actual
 * @param {Function} prevPage - Función para ir a la página anterior
 * @returns {object} Funciones CRUD
 */
export function useEmployeeCRUD({ refresh, setEmployees, employeesLength, page, prevPage }) {
    const createEmployee = useCallback(async (employeeData) => {
        try {
            // Validate unique employeeId
            if (employeeData.employeeId) {
                const directDocSnap = await getDocs(
                    query(collection(db, 'employees'), where('__name__', '==', employeeData.employeeId))
                );

                if (!directDocSnap.empty) {
                    return {
                        success: false,
                        error: 'ID_DUPLICADO',
                        message: `El ID de empleado "${employeeData.employeeId}" ya existe. Por favor usa un ID diferente.`
                    };
                }
            }

            await setDoc(doc(db, 'employees', employeeData.employeeId), {
                ...employeeData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            refresh();
            return { success: true, id: employeeData.employeeId };
        } catch (err) {
            console.error('Error creating employee:', err);
            return { success: false, error: err.message };
        }
    }, [refresh]);

    const updateEmployee = useCallback(async (id, employeeData) => {
        try {
            await updateDoc(doc(db, 'employees', id), {
                ...employeeData,
                updatedAt: new Date().toISOString()
            });
            refresh();
            return { success: true };
        } catch (err) {
            console.error('Error updating employee:', err);
            return { success: false, error: err.message };
        }
    }, [refresh]);

    const deleteEmployee = useCallback(async (id) => {
        try {
            await deleteDoc(doc(db, 'employees', id));
            setEmployees(prev => prev.filter(emp => emp.id !== id));
            if (employeesLength === 1 && page > 1) {
                prevPage();
            }
            return { success: true };
        } catch (err) {
            console.error('Error deleting employee:', err);
            refresh();
            return { success: false, error: err.message };
        }
    }, [employeesLength, page, prevPage, refresh, setEmployees]);

    return { createEmployee, updateEmployee, deleteEmployee };
}
