import styles from './slides.module.css';

export default function ContentSlide({ data, accentColor }) {
    const { heading, body, bullets, image, tag } = data;

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
                    />
                </div>
            )}
        </article>
    );
}
