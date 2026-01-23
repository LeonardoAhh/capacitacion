/**
 * Utility function to combine class names
 * Simple implementation without external dependencies
 */
export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
