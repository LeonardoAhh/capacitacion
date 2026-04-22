'use client';

import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import styles from './DriveImage.module.css';

/**
 * Wrapper de <img> con fallback visual cohesivo cuando la imagen no carga
 * (404 de Drive, token expirado, archivo borrado, sin red, etc.).
 *
 * Usa tokens del sistema de diseño (var(--bg-secondary), var(--text-tertiary),
 * var(--border-color), var(--font-body)). Sin colores ni fuentes hardcoded.
 */
export default function DriveImage({
    src,
    alt = '',
    className = '',
    style,
    fallbackLabel = 'Imagen no disponible',
    showLabel = true,
    onError,
    onLoad,
    ...rest
}) {
    const [errored, setErrored] = useState(false);

    // Reset estado si cambia la URL
    useEffect(() => {
        setErrored(false);
    }, [src]);

    if (!src || errored) {
        return (
            <div
                className={`${styles.fallback} ${className}`}
                style={style}
                role="img"
                aria-label={alt || fallbackLabel}
                title={fallbackLabel}
            >
                <ImageOff
                    size={28}
                    className={styles.fallbackIcon}
                    aria-hidden="true"
                />
                {showLabel && (
                    <span className={styles.fallbackLabel}>{fallbackLabel}</span>
                )}
            </div>
        );
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            className={className}
            style={style}
            onError={(e) => {
                setErrored(true);
                onError?.(e);
            }}
            onLoad={onLoad}
            loading="lazy"
            {...rest}
        />
    );
}
