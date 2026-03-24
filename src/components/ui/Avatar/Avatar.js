'use client';

import styles from './Avatar.module.css';
import { cn } from '@/lib/utils';
import { UserRound } from 'lucide-react';

/**
 * Avatar component — shows initials derived from name, or a generic icon as fallback.
 * Drive image loading has been removed.
 */
export function Avatar({
    src: _src,
    alt = '',
    name = '',
    size = 'md',
    className,
    ...props
}) {
    // Get initials from name
    const getInitials = (name) => {
        if (!name) return null;
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Generate consistent color from name
    const getColorFromName = (name) => {
        if (!name) return 0;
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % 360;
    };

    const initials = getInitials(name);
    const hue = getColorFromName(name);

    return (
        <div
            className={cn(styles.avatar, styles[size], className)}
            style={{
                background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue + 30}, 70%, 40%))`
            }}
            role="img"
            aria-label={alt || name || 'Avatar de usuario'}
            {...props}
        >
            <span className={styles.fallback} aria-hidden="true">
                {initials ?? <UserRound size={size === 'sm' ? 14 : size === 'lg' ? 22 : 18} strokeWidth={1.5} />}
            </span>
        </div>
    );
}

/**
 * Avatar group for displaying multiple avatars
 */
export function AvatarGroup({ children, max = 4, className, ...props }) {
    const childArray = Array.isArray(children) ? children : [children];
    const visible = childArray.slice(0, max);
    const remaining = childArray.length - max;

    return (
        <div className={cn(styles.avatarGroup, className)} {...props}>
            {visible}
            {remaining > 0 && (
                <div className={cn(styles.avatar, styles.md, styles.remaining)}>
                    <span className={styles.fallback}>+{remaining}</span>
                </div>
            )}
        </div>
    );
}

export default Avatar;
