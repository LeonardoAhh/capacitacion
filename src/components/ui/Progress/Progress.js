'use client';

import styles from './Progress.module.css';
import { cn } from '@/lib/utils';

/**
 * Progress bar component
 */
export function Progress({
    value = 0,
    max = 100,
    size = 'md',
    variant = 'default',
    showValue = false,
    animated = true,
    className,
    ...props
}) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
        <div className={cn(styles.progressWrapper, className)} {...props}>
            <div className={cn(styles.progress, styles[size])}>
                <div
                    className={cn(
                        styles.indicator,
                        styles[variant],
                        animated && styles.animated
                    )}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                />
            </div>
            {showValue && (
                <span className={styles.value}>{Math.round(percentage)}%</span>
            )}
        </div>
    );
}

/**
 * Circular progress component
 */
export function CircularProgress({
    value = 0,
    max = 100,
    size = 64,
    strokeWidth = 6,
    variant = 'default',
    showValue = true,
    className,
    ...props
}) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const colors = {
        default: 'var(--color-primary)',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
    };

    return (
        <div
            className={cn(styles.circularWrapper, className)}
            style={{ width: size, height: size }}
            {...props}
        >
            <svg width={size} height={size} className={styles.circularSvg}>
                <circle
                    className={styles.circularBg}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className={styles.circularIndicator}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ stroke: colors[variant] }}
                />
            </svg>
            {showValue && (
                <span className={styles.circularValue}>
                    {Math.round(percentage)}%
                </span>
            )}
        </div>
    );
}

export default Progress;
