import { useState, useCallback } from 'react';
import { recalculateComplianceFromFirestore } from '@/lib/seedHistorial';

/**
 * Hook para manejar el recálculo de compliance.
 * Extraído de capacitacion/page.js para separar lógica de negocio del componente.
 *
 * @param {object} toast - Instancia de toast para mostrar notificaciones
 * @returns {{ isRecalculating: boolean, handleRecalculateCompliance: Function }}
 */
export function useComplianceRecalc(toast) {
    const [isRecalculating, setIsRecalculating] = useState(false);

    const handleRecalculateCompliance = useCallback(async () => {
        setIsRecalculating(true);
        try {
            const result = await recalculateComplianceFromFirestore();
            if (result.success) {
                toast.success('Cumplimiento Recalculado', `Se procesaron ${result.processed} empleados`);
            } else {
                toast.error('Error', result.error);
            }
        } catch (error) {
            toast.error('Error', error.message);
        } finally {
            setIsRecalculating(false);
        }
    }, [toast]);

    return { isRecalculating, handleRecalculateCompliance };
}
