import { useState } from 'react';

/**
 * Validation rules
 */
const validators = {
    required: (value, message = 'Este campo es requerido') => {
        return !value || !value.trim() ? message : null;
    },

    email: (value) => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Email inválido' : null;
    },

    curp: (value) => {
        if (!value) return null;
        const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
        return !curpRegex.test(value.toUpperCase())
            ? 'CURP inválido. Formato: AAAA######HXXXXXX#'
            : null;
    },

    phone: (value) => {
        if (!value) return null;
        const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
        return !phoneRegex.test(value)
            ? 'Teléfono inválido. Mínimo 10 dígitos'
            : null;
    },

    minLength: (min) => (value) => {
        if (!value) return null;
        return value.length < min
            ? `Mínimo ${min} caracteres`
            : null;
    },

    maxLength: (max) => (value) => {
        if (!value) return null;
        return value.length > max
            ? `Máximo ${max} caracteres`
            : null;
    },

    numeric: (value) => {
        if (!value) return null;
        return isNaN(value) ? 'Debe ser un número' : null;
    }
};

/**
 * Custom hook for form validation
 */
export function useFormValidation(initialRules = {}) {
    const [errors, setErrors] = useState({});

    const validate = (formData, rules = initialRules) => {
        const newErrors = {};

        Object.keys(rules).forEach(field => {
            const fieldRules = Array.isArray(rules[field]) ? rules[field] : [rules[field]];
            const value = formData[field];

            for (const rule of fieldRules) {
                let error = null;

                if (typeof rule === 'string') {
                    // Predefined rule
                    error = validators[rule]?.(value);
                } else if (typeof rule === 'function') {
                    // Custom validator function
                    error = rule(value, formData);
                } else if (typeof rule === 'object') {
                    // Rule with options
                    const { type, ...options } = rule;
                    if (validators[type]) {
                        error = typeof validators[type] === 'function'
                            ? (options.param !== undefined
                                ? validators[type](options.param)(value)
                                : validators[type](value, options.message))
                            : validators[type](value);
                    }
                }

                if (error) {
                    newErrors[field] = error;
                    break; // Stop at first error for this field
                }
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const clearError = (field) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    };

    const clearAllErrors = () => {
        setErrors({});
    };

    return {
        errors,
        validate,
        clearError,
        clearAllErrors,
        setErrors
    };
}

// Export validators for direct use
export { validators };
