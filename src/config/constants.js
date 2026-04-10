export const APP_CONFIG = {
    name: 'Viñoplastic Training',
    version: '2.0.0',
    description: 'Plataforma de capacitación Viñoplastic',
};

export const AUTH_CONFIG = {
    SESSION_COOKIE_NAME: '__session',
    MAX_LOGIN_ATTEMPTS: 5,
    BLOCK_DURATION_MS: 30 * 1000,
    SESSION_DURATION: {
        ADMIN: 24 * 60 * 60 * 1000,
        CANDIDATE: 2 * 60 * 60 * 1000,
        TRAINING: 2 * 60 * 60 * 1000,
    },
    ACCESS_CODE: {
        MAX_USES: 5,
        EXPIRY_DAYS: 3,
    },
};

export const EMPLOYEE_CONFIG = {
    DEFAULT_ITEMS_PER_PAGE: 10,
    MAX_PHOTO_SIZE: 5 * 1024 * 1024,
    ALLOWED_PHOTO_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    CONTRACT_DURATION_DAYS: 90,
    EVALUATION_DAYS: {
        FIRST: 30,
        SECOND: 60,
        THIRD: 75,
    },
};

export const PWA_CONFIG = {
    UPDATE_CHECK_INTERVAL: 60 * 60 * 1000,
    OFFLINE_QUEUE_MAX_ITEMS: 100,
    CACHE_TTL: {
        EMPLOYEES: 5 * 60 * 1000,
        CATALOGS: 30 * 60 * 1000,
        USER_DATA: 10 * 60 * 1000,
    },
};

export const VALIDATION_CONFIG = {
    CURP_LENGTH: 18,
    PHONE_MIN_LENGTH: 10,
    NAME_MAX_LENGTH: 100,
    ID_MAX_LENGTH: 20,
};

export const ROUTES = {
    PUBLIC: ['/', '/login', '/training/login'],
    ADMIN: ['/dashboard', '/capacitacion', '/reports', '/profile', '/modulos', '/iluo-manager', '/induccion', '/complete-profile'],
};

export const THEME_CONFIG = {
    DEFAULT: 'light',
    AVAILABLE: ['light', 'dark', 'vinoplastic', 'forest', 'ocean', 'sunset'],
};

export const RATE_LIMITS = {
    AUTH_LOGIN: { maxRequests: 5, windowMs: 60 * 1000 },
    AUTH_GOOGLE: { maxRequests: 10, windowMs: 60 * 1000 },
    API_DEFAULT: { maxRequests: 100, windowMs: 60 * 1000 },
    API_UPLOAD: { maxRequests: 10, windowMs: 60 * 1000 },
    API_WRITE: { maxRequests: 50, windowMs: 60 * 1000 },
};

export const FIRESTORE_COLLECTIONS = {
    EMPLOYEES: 'employees',
    USERS: 'users',
    COURSES: 'courses',
    CATALOGS: 'catalogs',
    POSITIONS: 'positions',
    DEPARTMENTS: 'departments',
    AREAS: 'areas',
};

export const ERROR_MESSAGES = {
    NOT_FOUND: 'El recurso solicitado no existe',
    UNAUTHORIZED: 'No tienes autorización para acceder a este recurso',
    FORBIDDEN: 'Acceso denegado',
    VALIDATION_ERROR: 'Los datos proporcionados no son válidos',
    NETWORK_ERROR: 'Error de conexión. Intenta de nuevo.',
    UNKNOWN: 'Ha ocurrido un error inesperado',
};
