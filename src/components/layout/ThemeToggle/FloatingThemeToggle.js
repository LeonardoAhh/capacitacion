'use client';

import ThemeToggle from './ThemeToggle';
import styles from './FloatingThemeToggle.module.css';

/**
 * Wrapper flotante (top-right) para el ThemeToggle global.
 * Usar en páginas que no tienen su propio header con menú de usuario:
 *   <FloatingThemeToggle />
 *
 * Props:
 *   - position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
 *                (default 'top-right')
 *   - className?: string (extra para casos puntuales)
 */
export default function FloatingThemeToggle({ position = 'top-right', className = '' }) {
    const posClass = styles[`pos_${position.replace('-', '_')}`] || styles.pos_top_right;
    return (
        <div className={`${styles.fab} ${posClass} ${className}`}>
            <ThemeToggle />
        </div>
    );
}
