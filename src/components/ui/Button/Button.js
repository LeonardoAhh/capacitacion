'use client';

import { forwardRef } from 'react';
import styles from './Button.module.css';
import { cn } from '@/lib/utils';

/**
 * Button component with variants and sizes
 */
export const Button = forwardRef(function Button({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    icon,
    iconPosition = 'left',
    className,
    disabled,
    ...props
}, ref) {
    return (
        <button
            ref={ref}
            className={cn(
                styles.button,
                styles[variant],
                styles[size],
                fullWidth && styles.fullWidth,
                loading && styles.loading,
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <span className={styles.spinner} />
            )}
            {icon && iconPosition === 'left' && !loading && (
                <span className={styles.icon}>{icon}</span>
            )}
            <span className={styles.content}>{children}</span>
            {icon && iconPosition === 'right' && !loading && (
                <span className={styles.icon}>{icon}</span>
            )}
        </button>
    );
});

/**
 * Icon-only button
 */
export const IconButton = forwardRef(function IconButton({
    children,
    variant = 'ghost',
    size = 'md',
    className,
    ...props
}, ref) {
    return (
        <button
            ref={ref}
            className={cn(
                styles.iconButton,
                styles[`icon${variant.charAt(0).toUpperCase() + variant.slice(1)}`],
                styles[`icon${size.charAt(0).toUpperCase() + size.slice(1)}`],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
});

export default Button;
