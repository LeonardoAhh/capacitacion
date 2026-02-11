export const getOptimizedImageUrl = (url, size = 200) => {
    if (!url) return null;
    if (!url.includes('drive.google.com')) return url;

    // Remove existing size params if any
    let cleanUrl = url.replace(/&sz=[^&]+/, '');

    // Add new size param (s = square crop, w = width, h = height)
    // Using 's' creates a square thumbnail which is perfect for avatars
    return `${cleanUrl}&sz=s${size}`;
};
