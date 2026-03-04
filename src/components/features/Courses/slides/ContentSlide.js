'use client';
import { useState } from 'react';
import styles from './slides.module.css';

export default function ContentSlide({ data, accentColor, hasBgMedia }) {
    const { heading, body, bullets, image, images, tag } = data;
    const [lightboxIdx, setLightboxIdx] = useState(null);

    // Normalizar: preferir array `images`, fallback a `image` string
    const gallery = Array.isArray(images) && images.length > 0
        ? images
        : image
            ? [image]
            : [];

    const hasImages = gallery.length > 0;
    const isMulti = gallery.length > 1;

    // Navegación en lightbox
    const prev = () => setLightboxIdx(i => (i - 1 + gallery.length) % gallery.length);
    const next = () => setLightboxIdx(i => (i + 1) % gallery.length);

    return (
        <article
            className={`${styles.slide} ${styles.contentSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}
            style={{ flexDirection: hasImages ? 'row' : 'column', gap: hasImages ? '3rem' : '1rem', alignItems: 'center' }}
            role="region"
            aria-label={heading || 'Contenido del slide'}
        >
            {/* Texto */}
            <div style={{ flex: 1, width: '100%' }}>
                {accentColor && (
                    <div className={styles.accentBar} style={{ backgroundColor: accentColor }} aria-hidden="true" />
                )}
                {tag && <span className={styles.slideLabel}>{tag}</span>}
                {heading && <h2>{heading}</h2>}
                {body && (
                    <div
                        className={styles.contentBody}
                        dangerouslySetInnerHTML={{
                            // Si contiene etiquetas HTML (rich text), renderizar directamente.
                            // Si es texto plano, convertir saltos de línea a <br>.
                            __html: /<[a-z][\s\S]*>/i.test(body)
                                ? body
                                : body.split('\n').map(p => `<p>${p}</p>`).join('')
                        }}
                    />
                )}
                {bullets && bullets.length > 0 && (
                    <ul className={styles.bulletList} role="list">
                        {bullets.map((bullet, i) => (
                            <li key={i} className={styles.bulletItem}>
                                <span className={styles.bulletDot} style={{ backgroundColor: accentColor || 'var(--course-accent)' }} aria-hidden="true" />
                                <span>{bullet}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Galería de imágenes */}
            {hasImages && (
                <div className={styles.slideImageContainer}>
                    {isMulti ? (
                        /* Grid para múltiples imágenes Premium (hasta 6) */
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: gallery.length === 2 ? '1fr 1fr' :
                                gallery.length === 3 ? '1fr 1fr 1fr' :
                                    gallery.length === 4 ? '1fr 1fr' :
                                        gallery.length === 5 ? 'repeat(6, 1fr)' :
                                            'repeat(3, 1fr)',
                            gridAutoRows: 'minmax(100px, 150px)',
                            gap: 12,
                            width: '100%',
                        }}>
                            {gallery.map((url, idx) => {
                                // Configurar layout dinámico para 5 imágenes (2 grandes arriba, 3 abajo)
                                let gridStyle = {};
                                if (gallery.length === 5) {
                                    if (idx < 2) gridStyle = { gridColumn: 'span 3' };
                                    else gridStyle = { gridColumn: 'span 2' };
                                }

                                return (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        key={idx}
                                        src={url}
                                        alt={`${heading || 'Imagen'} ${idx + 1}`}
                                        onClick={() => setLightboxIdx(idx)}
                                        loading="lazy"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            borderRadius: 12,
                                            cursor: 'zoom-in',
                                            border: '1px solid var(--border-color)',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s',
                                            ...gridStyle
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.opacity = '0.95'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.opacity = '1'; }}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        /* Imagen única */
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={gallery[0]}
                            alt={heading || 'Imagen del contenido'}
                            className={styles.slideImage}
                            loading="lazy"
                            onClick={() => setLightboxIdx(0)}
                            style={{ cursor: 'zoom-in' }}
                            title="Clic para ampliar"
                        />
                    )}
                </div>
            )}

            {/* Lightbox */}
            {lightboxIdx !== null && (
                <div
                    onClick={() => setLightboxIdx(null)}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.90)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 99999, cursor: 'zoom-out', padding: 20,
                    }}
                >
                    {/* Imagen */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={gallery[lightboxIdx]}
                        alt={`${heading || 'Imagen'} ${lightboxIdx + 1}`}
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '88vw', maxHeight: '88vh',
                            objectFit: 'contain', borderRadius: 12,
                            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
                            userSelect: 'none',
                        }}
                    />

                    {/* Cerrar */}
                    <button onClick={() => setLightboxIdx(null)} style={{ position: 'fixed', top: 18, right: 18, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 300 }}>×</button>

                    {/* Flechas navegación (solo si hay más de 1) */}
                    {isMulti && (
                        <>
                            <button onClick={e => { e.stopPropagation(); prev(); }} style={{ position: 'fixed', left: 18, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22 }}>‹</button>
                            <button onClick={e => { e.stopPropagation(); next(); }} style={{ position: 'fixed', right: 18, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22 }}>›</button>
                            {/* Contador */}
                            <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                                {lightboxIdx + 1} / {gallery.length}
                            </div>
                        </>
                    )}
                </div>
            )}
        </article>
    );
}
