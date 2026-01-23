'use client';

import styles from './Card.module.css';
import { cn } from '@/lib/utils';

/**
 * Card container component
 */
export function Card({ children, className, hover = true, ...props }) {
    return (
        <div
            className={cn(styles.card, hover && styles.hover, className)}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * Card header with title and optional description
 */
export function CardHeader({ children, className, ...props }) {
    return (
        <div className={cn(styles.cardHeader, className)} {...props}>
            {children}
        </div>
    );
}

/**
 * Card title
 */
export function CardTitle({ children, className, as: Component = 'h3', ...props }) {
    return (
        <Component className={cn(styles.cardTitle, className)} {...props}>
            {children}
        </Component>
    );
}

/**
 * Card description
 */
export function CardDescription({ children, className, ...props }) {
    return (
        <p className={cn(styles.cardDescription, className)} {...props}>
            {children}
        </p>
    );
}

/**
 * Card content area
 */
export function CardContent({ children, className, ...props }) {
    return (
        <div className={cn(styles.cardContent, className)} {...props}>
            {children}
        </div>
    );
}

/**
 * Card footer
 */
export function CardFooter({ children, className, ...props }) {
    return (
        <div className={cn(styles.cardFooter, className)} {...props}>
            {children}
        </div>
    );
}

export default Card;
