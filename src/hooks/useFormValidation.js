'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

const DEBOUNCE_MS = 300;

const validators = {
    required: (value, message = 'Este campo es requerido') => {
        if (value === null || value === undefined) return message;
        if (typeof value === 'string' && !value.trim()) return message;
        if (Array.isArray(value) && value.length === 0) return message;
        return null;
    },

    email: (value) => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Email inválido. Ejemplo: nombre@dominio.com' : null;
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
        const cleaned = value.replace(/[\s\-\(\)]/g, '');
        const phoneRegex = /^\+?\d{10,15}$/;
        return !phoneRegex.test(cleaned)
            ? 'Teléfono inválido. Ejemplo: 4421234567'
            : null;
    },

    minLength: (min) => (value) => {
        if (!value) return null;
        return value.length < min
            ? `Mínimo ${min} caracteres (actual: ${value.length})`
            : null;
    },

    maxLength: (max) => (value) => {
        if (!value) return null;
        return value.length > max
            ? `Máximo ${max} caracteres (actual: ${value.length})`
            : null;
    },

    numeric: (value) => {
        if (!value && value !== 0) return null;
        return isNaN(Number(value)) ? 'Debe ser un número válido' : null;
    },

    positiveNumber: (value) => {
        if (!value && value !== 0) return null;
        const num = Number(value);
        if (isNaN(num)) return 'Debe ser un número válido';
        if (num < 0) return 'Debe ser un número positivo';
        return null;
    },

    date: (value) => {
        if (!value) return null;
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'Fecha inválida';
        return null;
    },

    futureDate: (value) => {
        if (!value) return null;
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date <= today) return 'La fecha debe ser futura';
        return null;
    },

    pastDate: (value) => {
        if (!value) return null;
        const date = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (date > today) return 'La fecha no puede ser futura';
        return null;
    },

    match: (otherFieldName, otherFieldLabel) => (value, formData) => {
        if (!value) return null;
        return value !== formData?.[otherFieldName]
            ? `Debe coincidir con ${otherFieldLabel || otherFieldName}`
            : null;
    },

    pattern: (regex, message = 'Formato inválido') => (value) => {
        if (!value) return null;
        return !regex.test(value) ? message : null;
    },
};

export function useFormValidation(initialRules = {}) {
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [isValidating, setIsValidating] = useState(false);
    const debounceTimers = useRef({});

    const validateField = useCallback((field, value, formData, rules) => {
        const fieldRules = rules[field];
        if (!fieldRules) return null;

        const rulesArray = Array.isArray(fieldRules) ? fieldRules : [fieldRules];

        for (const rule of rulesArray) {
            let error = null;

            if (typeof rule === 'string') {
                error = validators[rule]?.(value);
            } else if (typeof rule === 'function') {
                error = rule(value, formData);
            } else if (typeof rule === 'object' && rule !== null) {
                const { type, param, message, ...options } = rule;
                const validator = validators[type];

                if (validator) {
                    if (param !== undefined) {
                        error = validator(param)(value, formData);
                    } else {
                        error = validator(value, message);
                    }
                }
            }

            if (error) return error;
        }

        return null;
    }, []);

    const validate = useCallback((formData, rules = initialRules) => {
        setIsValidating(true);
        const newErrors = {};

        Object.keys(rules).forEach(field => {
            const error = validateField(field, formData[field], formData, rules);
            if (error) newErrors[field] = error;
        });

        setErrors(newErrors);
        setIsValidating(false);
        return Object.keys(newErrors).length === 0;
    }, [initialRules, validateField]);

    const validateSingleField = useCallback((field, value, formData, rules = initialRules) => {
        if (debounceTimers.current[field]) {
            clearTimeout(debounceTimers.current[field]);
        }

        debounceTimers.current[field] = setTimeout(() => {
            const error = validateField(field, value, formData, rules);
            setErrors(prev => {
                const newErrors = { ...prev };
                if (error) {
                    newErrors[field] = error;
                } else {
                    delete newErrors[field];
                }
                return newErrors;
            });
        }, DEBOUNCE_MS);
    }, [initialRules, validateField]);

    const handleFieldBlur = useCallback((field, value, formData, rules = initialRules) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        const error = validateField(field, value, formData, rules);
        setErrors(prev => {
            const newErrors = { ...prev };
            if (error) {
                newErrors[field] = error;
            } else {
                delete newErrors[field];
            }
            return newErrors;
        });
    }, [initialRules, validateField]);

    const handleFieldChange = useCallback((field, value, formData, rules = initialRules) => {
        if (touched[field]) {
            validateSingleField(field, value, formData, rules);
        }
    }, [initialRules, touched, validateSingleField]);

    const clearError = useCallback((field) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    }, []);

    const clearAllErrors = useCallback(() => {
        setErrors({});
        setTouched({});
    }, []);

    const setFieldError = useCallback((field, error) => {
        setErrors(prev => ({
            ...prev,
            [field]: error,
        }));
    }, []);

    const getFieldState = useCallback((field) => ({
        error: errors[field],
        touched: touched[field],
        invalid: !!errors[field] && touched[field],
    }), [errors, touched]);

    useEffect(() => {
        const timers = debounceTimers.current;
        return () => {
            Object.values(timers).forEach(clearTimeout);
        };
    }, []);

    return {
        errors,
        touched,
        isValidating,
        validate,
        validateField: validateSingleField,
        handleFieldBlur,
        handleFieldChange,
        clearError,
        clearAllErrors,
        setErrors,
        setFieldError,
        getFieldState,
        hasErrors: Object.keys(errors).length > 0,
    };
}

export { validators };
