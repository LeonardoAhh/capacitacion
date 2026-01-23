'use client';

import styles from './Skeleton.module.css';
import { cn } from '@/lib/utils';

/**
 * Skeleton loading component
 */
export function Skeleton({
    width,
    height,
    variant = 'text',
    className,
    ...props
}) {
    return (
        <div
            className={cn(
                styles.skeleton,
                styles[variant],
                className
            )}
            style={{ width, height }}
            {...props}
        />
    );
}

/**
 * Skeleton for text lines
 */
export function SkeletonText({ lines = 3, className, ...props }) {
    return (
        <div className={cn(styles.textWrapper, className)} {...props}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    variant="text"
                    style={{
                        width: i === lines - 1 ? '60%' : '100%'
                    }}
                />
            ))}
        </div>
    );
}

/**
 * Skeleton for cards
 */
export function SkeletonCard({ className, ...props }) {
    return (
        <div className={cn(styles.cardWrapper, className)} {...props}>
            <Skeleton variant="rectangular" height={160} />
            <div className={styles.cardContent}>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
            </div>
        </div>
    );
}

/**
 * Skeleton for avatar with text
 */
export function SkeletonAvatar({ withText = true, className, ...props }) {
    return (
        <div className={cn(styles.avatarWrapper, className)} {...props}>
            <Skeleton variant="circular" width={40} height={40} />
            {withText && (
                <div className={styles.avatarText}>
                    <Skeleton variant="text" width={120} />
                    <Skeleton variant="text" width={80} />
                </div>
            )}
        </div>
    );
}

/**
 * Skeleton for table rows
 */
export function SkeletonTable({ rows = 5, columns = 4, className, ...props }) {
    return (
        <div className={cn(styles.tableWrapper, className)} {...props}>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className={styles.tableRow}>
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton
                            key={colIndex}
                            variant="text"
                            width={colIndex === 0 ? '40%' : '80%'}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export default Skeleton;
