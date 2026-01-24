export const calculateCompliance = (history, requiredCourses) => {
    // history: Array of { courseName, status, score, date }
    // requiredCourses: Array of strings (course names)

    const approvedCourses = new Set(
        history
            .filter(h => h.status === 'approved')
            .map(h => h.courseName) // Assumes normalized uppercase upstream
    );

    const missing = requiredCourses.filter(req => !approvedCourses.has(req));

    const complianceScore = requiredCourses.length > 0
        ? ((requiredCourses.length - missing.length) / requiredCourses.length) * 100
        : 100;

    // Separate Failed vs Pending
    const historyNames = new Set(history.map(h => h.courseName));
    const failedCourses = [];
    const pendingCourses = [];

    missing.forEach(req => {
        if (historyNames.has(req)) {
            failedCourses.push(req);
        } else {
            pendingCourses.push(req);
        }
    });

    return {
        requiredCount: requiredCourses.length,
        completedCount: requiredCourses.length - missing.length,
        missingCourses: missing,
        failedCourses,
        pendingCourses,
        compliancePercentage: parseFloat(complianceScore.toFixed(2))
    };
};
