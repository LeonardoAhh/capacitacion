'use client';

import { forwardRef, useEffect, useState } from 'react';
import { IconAlertCircle, IconCheckCircle2, IconEye, IconEyeOff } from '@/lib/icons';
import styles from './FormField.module.css';

const FormField = forwardRef(function FormField(
    {
        label,
        name,
        type = 'text',
        error,
        touched,
        value,
        onChange,
        onBlur,
        placeholder,
        required,
        disabled,
        className,
        helpText,
        showValidState = true,
        autoComplete,
        maxLength,
        min,
        max,
        step,
        ...props
    },
    ref
) {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const hasError = touched && error;
    const isValid = touched && !error && value;
    const inputType = type === 'password' && showPassword ? 'text' : type;

    const handleFocus = (e) => {
        setIsFocused(true);
        props.onFocus?.(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    return (
        <div className={`${styles.container} ${className || ''}`}>
            {label && (
                <label htmlFor={name} className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}

            <div className={`${styles.inputWrapper} ${hasError ? styles.error : ''} ${isValid && showValidState ? styles.valid : ''} ${isFocused ? styles.focused : ''}`}>
                {type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={styles.passwordToggle}
                        tabIndex={-1}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                        {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                )}

                <input
                    ref={ref}
                    id={name}
                    name={name}
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    autoComplete={autoComplete}
                    maxLength={maxLength}
                    min={min}
                    max={max}
                    step={step}
                    className={styles.input}
                    aria-invalid={hasError ? 'true' : undefined}
                    aria-describedby={hasError ? `${name}-error` : helpText ? `${name}-help` : undefined}
                    {...props}
                />

                {hasError && (
                    <div className={styles.statusIcon} aria-hidden="true">
                        <IconAlertCircle size={18} />
                    </div>
                )}

                {isValid && showValidState && (
                    <div className={styles.statusIcon} aria-hidden="true">
                        <IconCheckCircle2 size={18} />
                    </div>
                )}
            </div>

            {helpText && !hasError && (
                <p id={`${name}-help`} className={styles.helpText}>
                    {helpText}
                </p>
            )}

            {hasError && (
                <p id={`${name}-error`} className={styles.errorText} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
});

export default FormField;
