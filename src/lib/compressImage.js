/**
 * compressImage — Client-side image compression via canvas.
 *
 * Resizes the image so its longest side is ≤ maxDimension,
 * then re-encodes as WebP (fallback JPEG) at the given quality.
 * Returns a new File ready for upload.
 *
 * @param {File}   file           Original image file
 * @param {Object} opts
 * @param {number} opts.maxWidth  Max width in px  (default 1400)
 * @param {number} opts.maxHeight Max height in px (default 1400)
 * @param {number} opts.quality   0–1 encoding quality (default 0.82)
 * @param {string} opts.type      Output MIME ('image/webp' | 'image/jpeg')
 * @returns {Promise<File>}       Compressed File (or original if already small)
 */
export async function compressImage(file, opts = {}) {
    const {
        maxWidth = 1400,
        maxHeight = 1400,
        quality = 0.82,
        type = 'image/webp',
    } = opts;

    // Skip non-raster or already tiny files (< 200KB)
    if (!file.type.startsWith('image/') || file.size < 200 * 1024) {
        return file;
    }

    // Skip SVG, GIF (animated)
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        return file;
    }

    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let { width, height } = img;

            // Only downscale, never upscale
            if (width <= maxWidth && height <= maxHeight && file.size < 500 * 1024) {
                resolve(file);
                return;
            }

            // Calculate new dimensions preserving aspect ratio
            const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            // Enable high-quality downsampling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (!blob || blob.size >= file.size) {
                        // Compression didn't help — return original
                        resolve(file);
                        return;
                    }

                    // Derive new filename
                    const ext = type === 'image/webp' ? '.webp' : '.jpg';
                    const baseName = file.name.replace(/\.[^.]+$/, '');
                    const newFile = new File([blob], `${baseName}${ext}`, {
                        type: blob.type,
                        lastModified: Date.now(),
                    });
                    resolve(newFile);
                },
                type,
                quality,
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            // If canvas fails, return original
            resolve(file);
        };

        img.src = url;
    });
}
