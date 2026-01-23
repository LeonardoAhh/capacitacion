'use client';

import styles from './Badge.module.css';
import { cn } from '@/lib/utils';

/**
 * Badge component for status indicators
 * @param {Object} props
 * @param {'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'white'} props.variant
 * @param {'sm' | 'md' | 'lg'} props.size
 * @param {boolean} props.dot - Show a dot indicator
 * @param {React.ReactNode} props.children
 */
export function Badge({
    children,
    variant = 'default',
    size = 'md',
    dot = false,
    className,
    ...props
}) {
    return (
        <span
            className={cn(
                styles.badge,
                styles[variant],
                styles[size],
                dot && styles.withDot,
                className
            )}
            {...props}
        >
            {dot && <span className={styles.dot} />}
            {children}
        </span>
    );
}

export default Badge;
