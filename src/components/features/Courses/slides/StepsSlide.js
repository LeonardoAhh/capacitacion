'use client';
/* eslint-disable @next/next/no-img-element */

import { useState } from 'react';
import styles from './slides.module.css';

/**
 * StepsSlide — Slide de secuencia "Paso a Paso"
 * Muestra pasos numerados en formato timeline vertical.
 *
 * @param {{ heading, steps: Array<{title, desc, image}> }} data
 */
export default function StepsSlide({ data, hasBgMedia }) {
    const { heading, steps = [] } = data;
    const [lightboxSrc, setLightboxSrc] = useState(null);

    return (
        <article
            className={`${styles.slide} ${styles.stepsSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}
            role="region"
            aria-label={heading || 'Paso a Paso'}
        >
            {/* Encabezado */}
            {heading && (
                <h2 className={styles.stepsHeading}>{heading}</h2>
            )}

            {/* Lista de pasos */}
            <ol className={styles.stepsList} aria-label="Pasos">
                {steps.map((step, idx) => (
                    <li
                        key={idx}
                        className={styles.stepItem}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                        {/* Indicador numérico + línea conectora */}
                        <div className={styles.stepTrack}>
                            <div className={styles.stepNumber} aria-hidden="true">
                                {idx + 1}
                            </div>
                            {idx < steps.length - 1 && (
                                <div className={styles.stepConnector} aria-hidden="true" />
                            )}
                        </div>

                        {/* Contenido del paso */}
                        <div className={styles.stepBody}>
                            {step.title && (
                                <h3 className={styles.stepTitle}>{step.title}</h3>
                            )}
                            {step.desc && (
                                <p className={styles.stepDesc}>{step.desc}</p>
                            )}
                            {step.image && (
                                <img
                                    src={step.image}
                                    alt={step.title || `Paso ${idx + 1}`}
                                    className={styles.stepImage}
                                    loading="lazy"
                                    onClick={() => setLightboxSrc(step.image)}
                                    style={{ cursor: 'zoom-in' }}
                                />
                            )}
                        </div>
                    </li>
                ))}
            </ol>

            {/* Lightbox */}
            {lightboxSrc && (
                <div
                    onClick={() => setLightboxSrc(null)}
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(0,0,0,0.90)',
                        backdropFilter: 'blur(6px)',
                        WebkitBackdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 99999, cursor: 'zoom-out', padding: 20,
                    }}
                >
                    <img
                        src={lightboxSrc}
                        alt="Vista ampliada"
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '88vw', maxHeight: '88vh',
                            objectFit: 'contain', borderRadius: 12,
                            boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
                            userSelect: 'none',
                        }}
                    />
                    <button
                        onClick={() => setLightboxSrc(null)}
                        style={{
                            position: 'fixed', top: 18, right: 18,
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'white', borderRadius: '50%',
                            width: 40, height: 40,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', fontSize: 22, fontWeight: 300,
                        }}
                        aria-label="Cerrar imagen"
                    >×</button>
                </div>
            )}
        </article>
    );
}
