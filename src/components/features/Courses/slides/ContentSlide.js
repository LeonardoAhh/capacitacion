'use client';
import { useState } from 'react';
import styles from './slides.module.css';

export default function ContentSlide({ data, accentColor }) {
    const { heading, body, bullets, image, tag } = data;
    const [lightbox, setLightbox] = useState(false);

    return (
        <article
            className={`${styles.slide} ${styles.contentSlide}`}
            style={{ flexDirection: image ? 'row' : 'column', gap: image ? '3rem' : '1rem', alignItems: 'center' }}
            role="region"
            aria-label={heading || 'Contenido del slide'}
        >
            <div style={{ flex: 1, width: '100%' }}>
                {accentColor && (
                    <div
                        className={styles.accentBar}
                        style={{ backgroundColor: accentColor }}
                        aria-hidden="true"
                    />
                )}

                {tag && (
                    <span className={styles.slideLabel}>{tag}</span>
                )}

                {heading && <h2>{heading}</h2>}

                {body && (
                    <div className={styles.contentBody}>
                        {body.split('\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                        ))}
                    </div>
                )}

                {bullets && bullets.length > 0 && (
                    <ul className={styles.bulletList} role="list">
                        {bullets.map((bullet, i) => (
                            <li key={i} className={styles.bulletItem}>
                                <span
                                    className={styles.bulletDot}
                                    style={{ backgroundColor: accentColor || 'var(--course-accent)' }}
                                    aria-hidden="true"
                                />
                                <span>{bullet}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {image && (
                <div className={styles.slideImageContainer}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={image}
                        alt={heading || 'Imagen del contenido'}
                        className={styles.slideImage}
                        loading="lazy"
                        onClick={() => setLightbox(true)}
                        style={{ cursor: 'zoom-in' }}
                        title="Clic para ampliar"
                    />
                </div>
            )}

            {/* ── Lightbox ── */}
            {lightbox && (
                <div
                    onClick={() => setLightbox(false)}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.88)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 99999, cursor: 'zoom-out', padding: 20,
                    }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={image}
                        alt={heading || 'Imagen ampliada'}
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            objectFit: 'contain',
                            borderRadius: 12,
                            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
                        }}
                    />
                    <button
                        onClick={() => setLightbox(false)}
                        style={{
                            position: 'fixed', top: 20, right: 20,
                            background: 'rgba(255,255,255,0.15)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white', borderRadius: '50%',
                            width: 40, height: 40,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: 20, fontWeight: 300,
                        }}
                        title="Cerrar"
                    >
                        ×
                    </button>
                </div>
            )}
        </article>
    );
}
