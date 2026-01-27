/**
 * Promotion Utilities
 * Handles promotion eligibility calculations and exam rules
 */

/**
 * Parse percentage string to number
 * @param {string} percentStr - e.g. "90%"
 * @returns {number} - e.g. 90
 */
export const parsePercent = (percentStr) => {
    if (!percentStr) return 0;
    return parseInt(percentStr.replace('%', '').trim()) || 0;
};

/**
 * Parse temporality string to months
 * @param {string} tempStr - e.g. "6 MESES" or "12 MESES"
 * @returns {number} - months
 */
export const parseTemporality = (tempStr) => {
    if (!tempStr) return 0;
    const match = tempStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
};

/**
 * Calculate months between two dates
 * @param {string} startDate - Date string (YYYY-MM-DD or DD/MM/YYYY)
 * @param {Date} endDate - End date (defaults to today)
 * @returns {number} - Months elapsed
 */
export const calculateMonthsInPosition = (startDate, endDate = new Date()) => {
    if (!startDate) return 0;

    let start;
    if (startDate.includes('/')) {
        // DD/MM/YYYY format
        const [d, m, y] = startDate.split('/');
        start = new Date(y, m - 1, d);
    } else {
        // YYYY-MM-DD format
        start = new Date(startDate);
    }

    const months = (endDate.getFullYear() - start.getFullYear()) * 12
        + (endDate.getMonth() - start.getMonth());

    return Math.max(0, months);
};

/**
 * Get current semester period string
 * @param {Date} date - Date to check
 * @returns {string} - e.g. "JUL-DIC 2025" or "ENE-JUN 2026"
 */
export const getSemesterPeriod = (date = new Date()) => {
    const month = date.getMonth(); // 0-11
    const year = date.getFullYear();

    if (month < 6) {
        return `ENE-JUN ${year}`;
    } else {
        return `JUL-DIC ${year}`;
    }
};

/**
 * Get next allowed exam date based on attempt history
 * Rules:
 * - First fail: Can retry in 1 month
 * - Second fail: Must wait until temporality is complete
 * 
 * @param {Array} examAttempts - Array of {date, score, passed}
 * @param {number} temporalityMonths - Required months in position
 * @param {string} positionStartDate - When employee started current position
 * @returns {Object} - { canTakeExam: boolean, nextDate: Date|null, reason: string }
 */
export const getExamEligibility = (examAttempts = [], temporalityMonths, positionStartDate) => {
    const today = new Date();

    // Count failed attempts
    const failedAttempts = examAttempts.filter(a => !a.passed);
    const lastAttempt = examAttempts.length > 0
        ? examAttempts[examAttempts.length - 1]
        : null;

    // If already passed, no need to retake
    if (lastAttempt?.passed) {
        return {
            canTakeExam: false,
            nextDate: null,
            reason: 'Examen aprobado',
            status: 'passed'
        };
    }

    // No attempts yet
    if (failedAttempts.length === 0) {
        return {
            canTakeExam: true,
            nextDate: null,
            reason: 'Sin intentos previos',
            status: 'available'
        };
    }

    // Parse last attempt date
    const lastAttemptDate = parseDate(lastAttempt.date);

    // First failure: wait 1 month
    if (failedAttempts.length === 1) {
        const nextDate = new Date(lastAttemptDate);
        nextDate.setMonth(nextDate.getMonth() + 1);

        if (today >= nextDate) {
            return {
                canTakeExam: true,
                nextDate: null,
                reason: 'Período de espera completado (1 mes)',
                status: 'available'
            };
        } else {
            return {
                canTakeExam: false,
                nextDate,
                reason: `Debe esperar 1 mes desde último intento`,
                status: 'waiting'
            };
        }
    }

    // Second+ failure: wait until temporality complete
    if (failedAttempts.length >= 2) {
        if (!positionStartDate) {
            return {
                canTakeExam: false,
                nextDate: null,
                reason: 'Fecha de inicio de puesto no registrada',
                status: 'blocked'
            };
        }

        const startDate = parseDate(positionStartDate);
        const nextDate = new Date(startDate);
        nextDate.setMonth(nextDate.getMonth() + temporalityMonths);

        if (today >= nextDate) {
            return {
                canTakeExam: true,
                nextDate: null,
                reason: 'Temporalidad completada',
                status: 'available'
            };
        } else {
            return {
                canTakeExam: false,
                nextDate,
                reason: `Debe completar temporalidad (${temporalityMonths} meses)`,
                status: 'blocked'
            };
        }
    }

    return {
        canTakeExam: true,
        nextDate: null,
        reason: 'Disponible',
        status: 'available'
    };
};

/**
 * Parse date string to Date object
 */
const parseDate = (dateStr) => {
    if (!dateStr) return new Date();

    if (dateStr.includes('/')) {
        const [d, m, y] = dateStr.split('/');
        return new Date(y, m - 1, d);
    }
    return new Date(dateStr);
};

/**
 * Check all promotion criteria for an employee
 * Priority order: 1. Desempeño, 2. Temporalidad, 3. Matriz, 4. Examen
 * @param {Object} employee - Employee data from Firebase
 * @param {Object} rule - Promotion rule (normalized format from Firebase)
 * @returns {Object} - Criteria status for each requirement
 */
export const checkPromotionCriteria = (employee, rule) => {
    if (!employee || !rule) {
        return {
            performance: { met: false, current: 0, required: 80, label: 'Desempeño' },
            temporality: { met: false, current: 0, required: 0, label: 'Temporalidad' },
            matrix: { met: false, current: 0, required: 90, label: 'Matriz' },
            exam: { met: false, current: null, required: 70, attempts: 0, label: 'Examen' },
            overall: { eligible: false, metCount: 0, total: 4 }
        };
    }

    const promotionData = employee.promotionData || {};
    const matrix = employee.matrix || {};

    // Get required values from rule (normalized format)
    const requiredMonths = rule.temporalityMonths || 0;
    const examMinScore = rule.examMinScore || 70;
    const matrixMinCoverage = rule.matrixMinCoverage || 90;
    const performanceMinScore = rule.performanceMinScore || 80;

    // 1. Performance Check (FIRST - must have passing performance evaluation)
    const currentPerformance = promotionData.performanceScore || 0;
    const performanceMet = currentPerformance >= performanceMinScore;

    // 2. Temporality Check (SECOND - must have required time in position)
    const monthsInPosition = calculateMonthsInPosition(promotionData.positionStartDate);
    const temporalityMet = monthsInPosition >= requiredMonths && requiredMonths > 0
        ? true
        : (requiredMonths === 0 ? true : false);

    // 3. Matrix Coverage Check (THIRD - must have completed required courses)
    // Use stored value, but also calculate dynamically if history is available
    let currentCoverage = matrix.compliancePercentage || 0;

    // Dynamic calculation based on history if available
    const history = employee.history || [];
    if (history.length > 0 && matrix.requiredCount > 0) {
        const requiredCourses = matrix.requiredCourses || matrix.missingCourses || [];
        if (requiredCourses.length > 0 || matrix.requiredCount > 0) {
            // Count approved courses from history
            const approvedCourses = new Set(
                history
                    .filter(h => h.status === 'approved' || (h.score && h.score >= 70))
                    .map(h => (h.courseName || '').toUpperCase().trim())
            );

            // Calculate how many required courses are completed
            let completedRequired = matrix.completedCount || 0;

            // If we have history but completedCount is 0, recalculate
            if (completedRequired === 0 && approvedCourses.size > 0) {
                // Use the number of approved courses vs required count
                completedRequired = Math.min(approvedCourses.size, matrix.requiredCount);
                currentCoverage = Math.round((completedRequired / matrix.requiredCount) * 100);
            }
        }
    }

    const matrixMet = currentCoverage >= matrixMinCoverage;

    // 4. Exam Check (FOURTH - must have passed exam with required score)
    const examAttempts = promotionData.examAttempts || [];
    const passedExam = examAttempts.find(a => a.passed && a.score >= examMinScore);
    const lastAttempt = examAttempts.length > 0 ? examAttempts[examAttempts.length - 1] : null;
    const examMet = !!passedExam;

    // Overall eligibility - ALL criteria must be met (no "in progress")
    const allMet = performanceMet && temporalityMet && matrixMet && examMet;
    const metCount = [performanceMet, temporalityMet, matrixMet, examMet].filter(Boolean).length;

    return {
        // Order by priority
        performance: {
            met: performanceMet,
            current: currentPerformance,
            required: performanceMinScore,
            period: promotionData.performancePeriod || null,
            label: 'Desempeño',
            order: 1
        },
        temporality: {
            met: temporalityMet,
            current: monthsInPosition,
            required: requiredMonths,
            startDate: promotionData.positionStartDate || null,
            label: 'Temporalidad',
            order: 2
        },
        matrix: {
            met: matrixMet,
            current: currentCoverage,
            required: matrixMinCoverage,
            label: 'Matriz',
            order: 3
        },
        exam: {
            met: examMet,
            current: passedExam?.score || lastAttempt?.score || null,
            required: examMinScore,
            attempts: examAttempts.length,
            lastPassed: !!passedExam,
            label: 'Examen',
            order: 4
        },
        overall: {
            eligible: allMet,
            metCount,
            total: 4
        }
    };
};

/**
 * Normalize promotion rule from JSON format
 */
export const normalizePromotionRule = (rawRule) => {
    return {
        currentPosition: rawRule["Puesto actual"]?.trim().toUpperCase() || '',
        promotionTo: rawRule["Promoción a"]?.trim().toUpperCase() || '',
        temporalityMonths: parseTemporality(rawRule["Temporalidad en el puesto"]),
        examMinScore: parsePercent(rawRule["Exámen Calificación Téorico"]),
        matrixMinCoverage: parsePercent(rawRule["% Cobertura Matriz (Cursos Asignados)"]),
        performanceMinScore: parsePercent(rawRule["Evaluación de Desempeño"])
    };
};

/**
 * Format date for display
 */
export const formatDate = (dateStr) => {
    if (!dateStr) return '-';

    const date = parseDate(dateStr);
    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};
