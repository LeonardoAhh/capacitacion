'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './LazyIframe.module.css';

/**
 * LazyIframe - Componente optimizado para cargar iframes solo cuando son visibles
 * Usa IntersectionObserver para detectar cuando el iframe entra al viewport
 * 
 * @param {string} src - URL del iframe
 * @param {string} title - Título descriptivo del iframe
 * @param {string} className - Clase CSS adicional
 * @param {object} style - Estilos inline adicionales
 */
export default function LazyIframe({ src, title, className = '', style = {}, ...props }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef(null);

    useEffect(() => {
        // Solo crear el observer si el elemento existe
        if (!containerRef.current || !src) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Cuando el elemento es visible (aunque sea un 10%)
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    // Desconectar el observer una vez que ya cargamos
                    observer.disconnect();
                }
            },
            {
                threshold: 0.1, // Activar cuando 10% sea visible
                rootMargin: '50px' // Empezar a cargar 50px antes de ser visible
            }
        );

        observer.observe(containerRef.current);

        // Cleanup
        return () => {
            observer.disconnect();
        };
    }, [src]);

    const handleLoad = () => {
        setIsLoading(false);
    };

    return (
        <div
            ref={containerRef}
            className={`${styles.lazyIframeContainer} ${className}`}
            style={style}
        >
            {isVisible ? (
                <>
                    {isLoading && (
                        <div className={styles.skeleton}>
                            <div className={styles.spinner} />
                            <p className={styles.loadingText}>Cargando contenido...</p>
                        </div>
                    )}
                    <iframe
                        src={src}
                        title={title}
                        className={styles.iframe}
                        style={{ display: isLoading ? 'none' : 'block' }}
                        onLoad={handleLoad}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        {...props}
                    />
                </>
            ) : (
                <div className={styles.placeholder}>
                    <div className={styles.placeholderIcon}>📹</div>
                    <p className={styles.placeholderText}>Preparando contenido...</p>
                </div>
            )}
        </div>
    );
}
