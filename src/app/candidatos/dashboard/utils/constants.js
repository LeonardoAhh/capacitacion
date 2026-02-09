// Dashboard Constants
// Extracted for maintainability and reusability

// ==================== TIME CONSTANTS ====================
export const TIMEOUT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours
export const ONE_MINUTE_MS = 60 * 1000;
export const FIVE_MINUTES_MS = 5 * 60 * 1000;

// ==================== EXAM CONSTANTS ====================
export const PASSING_SCORE = 70;
export const INDUCTION_COURSE_NAME = 'INDUCCIÓN A LA EMPRESA';

// ==================== TIMER COLORS ====================
export const TIMER_COLORS = {
    DANGER: '#ef4444',   // Red - last minute
    WARNING: '#f59e0b',  // Orange - last 5 minutes
    DEFAULT: 'inherit'
};

// ==================== COURSE STATUS ====================
export const COURSE_STATUS = {
    COMPLETED: 'completed',
    IN_PROGRESS: 'inProgress',
    NOT_STARTED: 'notStarted'
};

// ==================== SESSION KEYS ====================
export const SESSION_KEYS = {
    CANDIDATE_SESSION: 'candidate_session',
    SESSION_EXPIRY: 'candidate_session_expiry'
};

// ==================== ROUTES ====================
export const ROUTES = {
    HOME: '/',
    CANDIDATES_LOGIN: '/candidatos',
    CANDIDATES_DASHBOARD: '/candidatos/dashboard'
};
