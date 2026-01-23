'use client';

import { forwardRef } from 'react';
import styles from './Input.module.css';
import { cn } from '@/lib/utils';

/**
 * Input component with label and error support
 */
export const Input = forwardRef(function Input({
    label,
    error,
    helperText,
    icon,
    iconPosition = 'left',
    size = 'md',
    className,
    wrapperClassName,
    ...props
}, ref) {
    return (
        <div className={cn(styles.inputWrapper, wrapperClassName)}>
            {label && (
                <label className={styles.label} htmlFor={props.id}>
                    {label}
                    {props.required && <span className={styles.required}>*</span>}
                </label>
            )}
            <div className={cn(
                styles.inputContainer,
                styles[size],
                icon && styles[`icon${iconPosition.charAt(0).toUpperCase() + iconPosition.slice(1)}`],
                error && styles.hasError
            )}>
                {icon && iconPosition === 'left' && (
                    <span className={styles.iconWrapper}>{icon}</span>
                )}
                <input
                    ref={ref}
                    className={cn(styles.input, className)}
                    {...props}
                />
                {icon && iconPosition === 'right' && (
                    <span className={styles.iconWrapper}>{icon}</span>
                )}
            </div>
            {(error || helperText) && (
                <span className={cn(styles.helperText, error && styles.errorText)}>
                    {error || helperText}
                </span>
            )}
        </div>
    );
});

/**
 * Textarea component
 */
export const Textarea = forwardRef(function Textarea({
    label,
    error,
    helperText,
    className,
    wrapperClassName,
    ...props
}, ref) {
    return (
        <div className={cn(styles.inputWrapper, wrapperClassName)}>
            {label && (
                <label className={styles.label} htmlFor={props.id}>
                    {label}
                    {props.required && <span className={styles.required}>*</span>}
                </label>
            )}
            <textarea
                ref={ref}
                className={cn(
                    styles.input,
                    styles.textarea,
                    error && styles.hasErrorInput,
                    className
                )}
                {...props}
            />
            {(error || helperText) && (
                <span className={cn(styles.helperText, error && styles.errorText)}>
                    {error || helperText}
                </span>
            )}
        </div>
    );
});

export default Input;
