import { auth, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

        // Obtener token CSRF fresco antes de subir
        let csrfToken = '';
        try {
            const csrfRes = await fetch('/api/upload', { method: 'GET' });
            csrfToken = csrfRes.headers.get('X-CSRF-Token') || '';
        } catch {
            // Si falla el GET, intentamos continuar sin token (puede que no sea necesario)
        }

        // Hacer la llamada con autenticación
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
            },
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('[Upload Debug] Error API:', result);
            if (result.debug) console.warn('[Upload Debug] Info:', result.debug);

            // Mensaje amigable según el tipo de error
            let userMessage = result.message || result.error || 'Error al subir archivo';
            if (result.code === 'DRIVE_TOKEN_EXPIRED') {
                userMessage = 'El servicio de almacenamiento de fotos no está disponible temporalmente. Contacta al administrador del sistema.';
            }

            return {
                success: false,
                error: userMessage,
                code: result.code,
                debug: result.debug
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

/**
 * Sube un asset de curso (imagen o video) directamente a Firebase Storage.
 * Evita el proxy de Drive y no requiere token OAuth.
 * @param {File} file
 * @returns {Promise<{success: boolean, data?: {viewLink: string}, error?: string}>}
 */
export async function uploadCourseAsset(file) {
    try {
        if (!auth.currentUser) {
            return { success: false, error: 'Usuario no autenticado' };
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `course_assets/${Date.now()}_${safeName}`;
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { success: true, data: { viewLink: downloadURL } };
    } catch (error) {
        console.error('Error en uploadCourseAsset:', error);
        return { success: false, error: error.message || 'Error al subir a Firebase Storage' };
    }
}
