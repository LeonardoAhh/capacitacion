/**
 * Shared utility functions for employee-related components.
 * Centralizes date formatting, initials, and date calculation logic.
 */

const DATE_FORMAT_OPTIONS = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
};

/**
 * Formats a date string or timestamp for display in es-MX locale.
 * Handles plain YYYY-MM-DD strings as local time to avoid UTC offset shifts.
 * @param {string|number} dateString
 * @returns {string}
 */
export function formatDate(dateString) {
    if (!dateString) return '—';
    try {
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(year, month - 1, day).toLocaleDateString('es-MX', DATE_FORMAT_OPTIONS);
        }
        const date = typeof dateString === 'number' ? new Date(dateString) : new Date(dateString);
        return date.toLocaleDateString('es-MX', DATE_FORMAT_OPTIONS);
    } catch {
        return String(dateString);
    }
}

/**
 * Converts a date value to YYYY-MM-DD string for <input type="date">.
 * @param {string|number} dateString
 * @returns {string}
 */
export function formatDateForInput(dateString) {
    if (!dateString) return '';
    try {
        return new Date(dateString).toISOString().split('T')[0];
    } catch {
        return '';
    }
}

/**
 * Returns up to 2 uppercase initials from a full name.
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name) {
    if (!name) return 'EM';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

/**
 * Calculates contract end date and evaluation dates from a start date.
 * Contract ends at 90 days; evaluations at 30, 60, and 75 days.
 * @param {string|Date} startDate
 * @returns {{ contractEndDate?: string, eval1Date?: string, eval2Date?: string, eval3Date?: string }}
 */
export function calculateDatesFromStart(startDate) {
    if (!startDate) return {};

    const start = new Date(startDate);
    const addDays = (d, days) => {
        const result = new Date(d);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0];
    };

    return {
        contractEndDate: addDays(start, 90),
        eval1Date: addDays(start, 30),
        eval2Date: addDays(start, 60),
        eval3Date: addDays(start, 75),
    };
}
