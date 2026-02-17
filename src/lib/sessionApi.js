/**
 * Utilidades para manejar la cookie de sesión HTTP-only.
 * Usada por los 3 flujos de login (admin, candidatos, training) y logout.
 */

/**
 * Crea una cookie de sesión server-side.
 * @param {'admin' | 'candidate' | 'training'} type - Tipo de sesión
 * @returns {Promise<boolean>} true si se creó exitosamente
 */
export async function createSession(type) {
    try {
        const res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type }),
        });
        return res.ok;
    } catch (error) {
        console.error('Error creating session:', error);
        return false;
    }
}

/**
 * Elimina la cookie de sesión server-side.
 * @returns {Promise<boolean>} true si se eliminó exitosamente
 */
export async function destroySession() {
    try {
        const res = await fetch('/api/auth/session', {
            method: 'DELETE',
        });
        return res.ok;
    } catch (error) {
        console.error('Error destroying session:', error);
        return false;
    }
}
