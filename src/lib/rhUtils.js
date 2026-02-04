/**
 * Utilidades para RRHH - Gestión de Candidatos
 * Generación de códigos de acceso temporales
 */

import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Genera un código de acceso aleatorio de 6 dígitos
 * @returns {string} Código de 6 dígitos
 */
export function generateAccessCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Asigna un código de acceso a un candidato con fecha de expiración
 * @param {string} employeeId - ID del empleado/candidato
 * @param {number} expirationDays - Días hasta expiración (default: 7)
 * @returns {Promise<{success: boolean, code?: string, expiresAt?: Date, error?: string}>}
 */
export async function assignAccessCodeToCandidate(employeeId, expirationDays = 7) {
    try {
        // Verificar si el empleado existe primero
        const employeeRef = doc(db, 'employees', employeeId);
        const employeeSnap = await getDoc(employeeRef);

        if (!employeeSnap.exists()) {
            return {
                success: false,
                error: 'Empleado no encontrado. Asegúrate de que el empleado esté registrado.'
            };
        }

        const accessCode = generateAccessCode();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expirationDays);

        // Usar setDoc con merge para actualizar sin sobrescribir
        await setDoc(employeeRef, {
            accessCode,
            accessCodeExpires: expiresAt.getTime(),
            isCandidato: true,
            accessCodeGeneratedAt: new Date().getTime(),
            accessCodeUses: 0 // RESET USAGE COUNTER
        }, { merge: true });

        return {
            success: true,
            code: accessCode,
            expiresAt: expiresAt.toISOString()
        };
    } catch (error) {
        console.error('Error assigning access code:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Regenera un código de acceso (útil cuando expira)
 * @param {string} employeeId - ID del empleado/candidato
 * @param {number} expirationDays - Días hasta expiración (default: 7)
 * @returns {Promise<{accessCode: string, expiresAt: Date}>}
 */
export async function regenerateAccessCode(employeeId, expirationDays = 7) {
    return await assignAccessCodeToCandidate(employeeId, expirationDays);
}

/**
 * Verifica si un código de acceso es válido y no ha expirado
 * @param {string} accessCode - Código a verificar
 * @param {number} accessCodeExpires - Timestamp de expiración
 * @returns {boolean}
 */
export function isAccessCodeValid(accessCode, accessCodeExpires) {
    if (!accessCode || !accessCodeExpires) return false;
    return Date.now() < accessCodeExpires;
}

/**
 * Formatea la fecha de expiración para mostrar
 * @param {number} timestamp - Timestamp en milisegundos
 * @returns {string} Fecha formateada
 */
export function formatExpirationDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
