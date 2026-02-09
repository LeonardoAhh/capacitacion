/**
 * Dashboard Utility Functions
 * Common helper functions for the candidate dashboard
 */

/**
 * Convert Google Drive URL to embeddable preview URL
 * @param {Object} course - Course object with material info
 * @returns {string|null} Embeddable URL or null
 */
export function convertDriveUrl(course) {
    if (!course || !course.material) return null;

    let url = course.material.url;
    if (!url) return null;

    // Check if input is a raw IFRAME code (starts with <iframe)
    if (url.trim().startsWith('<iframe')) {
        const srcMatch = url.match(/src="([^"]+)"/);
        if (srcMatch && srcMatch[1]) {
            url = srcMatch[1];
        }
    }

    // Si es un enlace directo de Google Drive
    if (course.material.type === 'link') {
        // Google Drive
        const fileId = url.match(/\/d\/([^\/]+)/)?.[1];
        if (fileId) {
            return `https://drive.google.com/file/d/${fileId}/preview`;
        }

        // OneDrive logic
        if (url.includes('onedrive.live.com') || url.includes('1drv.ms')) {
            if (url.includes('view.aspx')) {
                return url.replace('view.aspx', 'embed');
            }
            return url;
        }

        return url;
    }

    return null;
}

/**
 * Extract first name from full name
 * Handles "PATERNO MATERNO NOMBRE(S)" format
 * @param {string} fullName - Full name string
 * @returns {string} Capitalized first name
 */
export function extractFirstName(fullName) {
    if (!fullName) return 'Nuevo Colaborador';

    const parts = fullName.trim().split(/\s+/);

    // Heuristic for "PATERNO MATERNO NOMBRE(S)" format
    let firstName = parts.length > 2 ? parts[2] : (parts[1] || parts[0]);

    // Capitalize nicely (Leonardo)
    if (firstName) {
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    }

    return firstName;
}

/**
 * Get photo URL from candidate object
 * Handles various field names used across the app
 * @param {Object} candidate - Candidate object
 * @returns {string|null} Photo URL or null
 */
export function getCandidatePhotoUrl(candidate) {
    if (!candidate) return null;
    return candidate.photoUrl || candidate.photoURL || candidate.photo || candidate.foto || null;
}

/**
 * Format position or area for display
 * Returns 'N/A' if not available
 * @param {string} value - Position or area value
 * @returns {string} Formatted value
 */
export function formatDisplayValue(value) {
    return value && value !== 'N/A' ? value : 'N/A';
}
