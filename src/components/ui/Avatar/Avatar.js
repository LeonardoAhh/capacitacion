'use client';

import styles from './Avatar.module.css';
import { cn } from '@/lib/utils';

/**
 * Avatar component for displaying user photos or initials
 */
export function Avatar({
    src,
    alt = '',
    name = '',
    size = 'md',
    className,
    ...props
}) {
    // Get initials from name
    const getInitials = (name) => {
        if (!name) return '?';
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

    const hue = getColorFromName(name);

    return (
        <div
            className={cn(styles.avatar, styles[size], className)}
            style={!src ? {
                background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue + 30}, 70%, 40%))`
            } : undefined}
            {...props}
        >
            {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt={alt || name}
                    className={styles.image}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
            ) : null}
            <span
                className={styles.fallback}
                style={{ display: src ? 'none' : 'flex' }}
            >
                {getInitials(name)}
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
