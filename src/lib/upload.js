import { auth } from '@/lib/firebase';

/**
 * Sube un archivo a la API con autenticación
 * @param {File} file - El archivo a subir
 * @param {Object} options - Opciones adicionales
 * @param {string} options.employeeId - ID del empleado (opcional)
 * @param {string} options.docType - Tipo de documento (opcional)
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function uploadFile(file, options = {}) {
    try {
        // Obtener token de autenticación
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return {
                success: false,
                error: 'Usuario no autenticado'
            };
        }

        // Obtener ID Token para autenticación
        const idToken = await currentUser.getIdToken();

        // Preparar FormData
        const formData = new FormData();
        formData.append('file', file);

        if (options.employeeId) {
            formData.append('employeeId', options.employeeId);
        }

        if (options.docType) {
            formData.append('docType', options.docType);
        }

        // Hacer la llamada con autenticación
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`
            },
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Upload Debug] Error API:', result); // Log full response including debug info
            if (result.debug) console.warn('[Upload Debug] Info:', result.debug);

            return {
                success: false,
                error: result.message || result.error || 'Error al subir archivo',
                code: result.code,
                debug: result.debug // Pass debug info up
            };
        }

        return {
            success: true,
            data: result.data
        };

    } catch (error) {
        console.error('Error en uploadFile (Catch):', error);
        return {
            success: false,
            error: error.message || 'Error de conexión'
        };
    }
}

/**
 * Sube una imagen de perfil
 * @param {File} file - Archivo de imagen
 * @param {string} employeeId - ID del empleado
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function uploadProfileImage(file, employeeId) {
    return uploadFile(file, { employeeId, docType: 'profile' });
}

/**
 * Sube un documento/certificado
 * @param {File} file - Archivo a subir
 * @param {string} employeeId - ID del empleado
 * @param {string} docType - Tipo de documento
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function uploadDocument(file, employeeId, docType) {
    return uploadFile(file, { employeeId, docType });
}
