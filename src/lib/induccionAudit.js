import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Guarda una entrada en la colección `audit_logs` para acciones en /induccion.
 * @param {Object} params
 * @param {string} params.userId   - UID del usuario que hace la acción
 * @param {string} params.userName - Nombre o email del usuario
 * @param {string} params.action   - 'create' | 'update' | 'delete' | 'publish' | 'rename' | 'import'
 * @param {string} params.target   - Nombre del recurso afectado (título del curso, etc.)
 * @param {string} [params.detail] - Detalle adicional opcional
 */
export async function logInduccionAction({ userId, userName, action, target, detail = '' }) {
    try {
        await addDoc(collection(db, 'audit_logs'), {
            module: 'induccion',
            userId,
            userName,
            action,
            target,
            detail,
            timestamp: serverTimestamp(),
        });
    } catch (err) {
        // No bloquear la acción principal si el log falla
        console.warn('[audit] No se pudo guardar el log:', err.message);
    }
}
