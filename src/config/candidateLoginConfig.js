/**
 * Configuración para el login de candidatos.
 * Constantes separadas del componente para mantener la lógica limpia.
 */

export const CANDIDATE_LOGIN_CONFIG = {
    /** Máximo de intentos de login antes de bloquear */
    MAX_ATTEMPTS: 10,

    /** Duración del bloqueo en milisegundos (15 minutos) */
    BLOCK_DURATION_MS: 15 * 60 * 1000,

    /** Delay de redirección tras login exitoso en milisegundos */
    SUCCESS_REDIRECT_DELAY_MS: 2000,

    /** Máximo de usos por código de acceso */
    MAX_CODE_USES: 10,

    /** Claves de almacenamiento */
    STORAGE_KEYS: {
        BLOCK: 'candidate_login_blocked',
        SESSION: 'candidate_session',
    },
};
