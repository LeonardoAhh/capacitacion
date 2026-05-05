'use client';
import React from 'react';
import { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import styles from './slides.module.css';

/**
 * Imagen con fallback visual cuando src está vacío o falla la carga.
 * Muestra el ícono ImageOff + texto "Imagen no disponible".
 */
function ImgWithFallback({ src, alt, className, style, onClick }) {
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'var(--ds-bg)',
          borderRadius: 8,
          border: '1px dashed var(--ds-border-hairline)',
          color: 'var(--ds-text-tertiary)',
          fontSize: '0.75rem',
          minHeight: 80,
          ...style,
        }}
      >
        <ImageOff size={28} />
        <span>Imagen no disponible</span>
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
      onClick={onClick}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
}

const ContentSlide = React.memo(function ContentSlide({ data, accentColor, hasBgMedia }) {
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
      className={`${styles.slide} ${styles.contentSlide} ${hasImages ? styles.contentSlideWithImage : ''} ${hasBgMedia ? styles.slideOverBg : ''}`}
      role="region"
      aria-label={heading || 'Contenido del slide'}
    >
      {/* Texto */}
      <div className={styles.contentTextBlock}>
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

        {/* Bloque Alerta / Snippet */}
        {data.snippet && (
          <div
            role="note"
            aria-label={`Alerta de tipo ${data.snippet.type}`}
            style={{
              marginTop: 24, padding: '16px 20px', borderRadius: 12,
              backgroundColor: data.snippet.type === 'danger' ? 'color-mix(in srgb, var(--color-danger) 8%, transparent)' :
                data.snippet.type === 'warning' ? 'color-mix(in srgb, var(--color-warning) 8%, transparent)' :
                  data.snippet.type === 'success' ? 'color-mix(in srgb, var(--color-success) 8%, transparent)' :
                    'color-mix(in srgb, var(--color-primary) 8%, transparent)',
              borderLeft: `5px solid ${data.snippet.type === 'danger' ? 'var(--color-danger)' :
                data.snippet.type === 'warning' ? 'var(--color-warning)' :
                  data.snippet.type === 'success' ? 'var(--color-success)' :
                    'var(--color-primary)'
                }`
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }} aria-hidden="true">
                {data.snippet.type === 'danger' ? '🚨' :
                  data.snippet.type === 'warning' ? '⚠️' :
                    data.snippet.type === 'success' ? '✅' : 'ℹ️'}
              </span>
              <strong style={{
                fontSize: '1.05rem',
                color: data.snippet.type === 'danger' ? 'var(--color-danger)' :
                  data.snippet.type === 'warning' ? 'var(--color-warning)' :
                    data.snippet.type === 'success' ? 'var(--color-success)' :
                      'var(--color-primary)'
              }}>
                {data.snippet.title || 'Atención'}
              </strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {data.snippet.text}
            </p>
          </div>
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
              gridAutoRows: 'minmax(80px, 130px)',
              gap: 10,
              width: '100%',
              maxHeight: '450px',
              overflow: 'hidden',
            }}>
              {gallery.map((url, idx) => {
                // Configurar layout dinámico para 5 imágenes (2 grandes arriba, 3 abajo)
                let gridStyle = {};
                if (gallery.length === 5) {
                  if (idx < 2) gridStyle = { gridColumn: 'span 3' };
                  else gridStyle = { gridColumn: 'span 2' };
                }

                return (
                  <ImgWithFallback
                    key={idx}
                    src={url}
                    alt={`${heading || 'Imagen'} ${idx + 1}`}
                    onClick={() => setLightboxIdx(idx)}
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
                  />
                );
              })}
            </div>
          ) : (
            /* Imagen única */
            <ImgWithFallback
              src={gallery[0]}
              alt={heading || 'Imagen del contenido'}
              className={styles.slideImage}
              onClick={() => setLightboxIdx(0)}
              style={{ cursor: 'zoom-in' }}
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
});

export default ContentSlide;
