export const normalize = (str) => str?.trim().toUpperCase() || '';
export const normalizeForMatch = (str) =>
    normalize(str)
        .normalize("NFD")
        .replace(/[-]/g, "") // Remove accents
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();

/**
 * Calculates compliance for a single employee based on their history and position requirements.
 * 
 * @param {Array} history - Array of { courseName, status, ... }
 * @param {Array} requiredCourses - Array of course names (strings)
 * @returns {Object} Matrix object with { requiredCount, completedCount, missingCourses, compliancePercentage, ... }
 */
export const calculateEmployeeCompliance = (history, requiredCourses) => {
    if (!requiredCourses || requiredCourses.length === 0) {
        return {
            requiredCount: 0,
            completedCount: 0,
            missingCourses: [],
            failedCourses: [],
            pendingCourses: [],
            compliancePercentage: 100 // No requirements = 100% compliant
        };
    }

    // Filter approved courses and normalize for matching
    // We use a Map to handle potential duplicates or just Set for existence
    const approvedNormalized = new Set(
        (history || [])
            .filter(h => h.status === 'approved')
            .map(h => normalizeForMatch(h.courseName))
    );

    // Identify missing courses
    const missing = requiredCourses.filter(req => {
        const reqNormalized = normalizeForMatch(req);
        return !approvedNormalized.has(reqNormalized);
    });

    const completedCount = requiredCourses.length - missing.length;
    const complianceScore = (completedCount / requiredCourses.length) * 100;

    // Separate missing into Failed vs Pending
    // Failed means they took it but didn't match 'approved' status, OR they took it and failed. 
    // Wait, the logic in seedHistorial was: if it's in history but not approved? 
    // Let's check logic: 
    // "historyNames.has(req)" -> if they attempted it (status could be 'failed' or 'attended' etc) but it wasn't approved (since we filtered approved above).

    // Create set of ALL history (failed/approved/attended)
    const allHistoryNormalized = new Set(
        (history || []).map(h => normalizeForMatch(h.courseName))
    );

    const failedCourses = [];
    const pendingCourses = [];

    missing.forEach(req => {
        const reqNormalized = normalizeForMatch(req);
        if (allHistoryNormalized.has(reqNormalized)) {
            // It's in history, but since it's in 'missing', it means it wasn't approved.
            // So it counts as failed/reprobado.
            failedCourses.push(req);
        } else {
            // Not in history at all
            pendingCourses.push(req);
        }
    });

    return {
        requiredCount: requiredCourses.length,
        completedCount,
        missingCourses: missing,
        failedCourses,
        pendingCourses,
        compliancePercentage: parseFloat(complianceScore.toFixed(2))
    };
};
