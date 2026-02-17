const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
};

const DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:/gi,
    /vbscript:/gi,
];

export function sanitizeString(input) {
    if (typeof input !== 'string') {
        return input;
    }

    let sanitized = input;

    DANGEROUS_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
    });

    sanitized = sanitized.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] || char);

    return sanitized.trim();
}

export function sanitizeObject(obj, options = {}) {
    const { excludeKeys = [], allowHtml = false } = options;

    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item, options));
    }

    if (typeof obj === 'object') {
        const sanitized = {};

        for (const [key, value] of Object.entries(obj)) {
            if (excludeKeys.includes(key)) {
                sanitized[key] = value;
                continue;
            }

            sanitized[key] = sanitizeObject(value, options);
        }

        return sanitized;
    }

    if (typeof obj === 'string') {
        return allowHtml ? obj : sanitizeString(obj);
    }

    return obj;
}

export function sanitizeEmail(email) {
    if (typeof email !== 'string') return '';

    const cleaned = email
        .toLowerCase()
        .trim()
        .replace(/[^\w.@+-]/g, '');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(cleaned) ? cleaned : '';
}

export function sanitizePhone(phone) {
    if (typeof phone !== 'string') return '';

    return phone
        .replace(/[^\d+\-\s()]/g, '')
        .trim();
}

export function sanitizeCURP(curp) {
    if (typeof curp !== 'string') return '';

    return curp
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 18);
}

export function sanitizeNumber(value, options = {}) {
    const { min, max, defaultValue = 0, integer = false } = options;

    let num = parseFloat(value);

    if (isNaN(num)) {
        return defaultValue;
    }

    if (integer) {
        num = Math.floor(num);
    }

    if (min !== undefined && num < min) {
        num = min;
    }

    if (max !== undefined && num > max) {
        num = max;
    }

    return num;
}

export function sanitizeDate(value) {
    if (!value) return null;

    const date = new Date(value);

    if (isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString().split('T')[0];
}

export function escapeHtml(str) {
    if (typeof str !== 'string') return '';

    return str.replace(/[&<>"']/g, char => HTML_ENTITIES[char] || char);
}

export function stripHtml(str) {
    if (typeof str !== 'string') return '';

    return str.replace(/<[^>]*>/g, '');
}

export function truncateText(str, maxLength, suffix = '...') {
    if (typeof str !== 'string') return '';

    if (str.length <= maxLength) {
        return str;
    }

    return str.slice(0, maxLength - suffix.length).trim() + suffix;
}

export function sanitizeFilename(filename) {
    if (typeof filename !== 'string') return '';

    return filename
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
        .replace(/^\.+/, '')
        .slice(0, 255);
}

export function sanitizeUrl(url) {
    if (typeof url !== 'string') return '';

    try {
        const parsed = new URL(url);

        const allowedProtocols = ['http:', 'https:'];
        if (!allowedProtocols.includes(parsed.protocol)) {
            return '';
        }

        return parsed.toString();
    } catch {
        return '';
    }
}

export function createSanitizedFormData(formData, schema) {
    const sanitized = {};

    for (const [key, config] of Object.entries(schema)) {
        const value = formData[key];

        if (value === undefined || value === null) {
            if (config.required) {
                throw new Error(`${key} is required`);
            }
            sanitized[key] = config.default ?? null;
            continue;
        }

        switch (config.type) {
            case 'string':
                sanitized[key] = sanitizeString(value);
                break;
            case 'email':
                sanitized[key] = sanitizeEmail(value);
                break;
            case 'phone':
                sanitized[key] = sanitizePhone(value);
                break;
            case 'curp':
                sanitized[key] = sanitizeCURP(value);
                break;
            case 'number':
                sanitized[key] = sanitizeNumber(value, config);
                break;
            case 'date':
                sanitized[key] = sanitizeDate(value);
                break;
            case 'boolean':
                sanitized[key] = Boolean(value);
                break;
            case 'array':
                sanitized[key] = Array.isArray(value) ? value.map(sanitizeString) : [];
                break;
            default:
                sanitized[key] = sanitizeString(value);
        }

        if (config.maxLength && typeof sanitized[key] === 'string') {
            sanitized[key] = sanitized[key].slice(0, config.maxLength);
        }

        if (config.enum && !config.enum.includes(sanitized[key])) {
            sanitized[key] = config.default ?? config.enum[0];
        }
    }

    return sanitized;
}
