import React from 'react';
import styles from './slides.module.css';

const TitleSlide = React.memo(function TitleSlide({ data, inline = false, hasBgMedia }) {
    return (
        <article
            className={`${styles.slide} ${styles.titleSlide} ${inline ? styles.slideInline : ''} ${hasBgMedia ? styles.slideOverBg : ''}`}
            role="region"
            aria-label={`Título del curso: ${data.title}`}
        >
            <span className={styles.categoryBadge}>
                <span className={styles.categoryDot} aria-hidden="true" />
                Capacitación
            </span>

            <h1>{data.title}</h1>

            {data.subtitle && (
                <p className={styles.titleSubtitle}>{data.subtitle}</p>
            )}

            {data.tags && data.tags.length > 0 && (
                <div className={styles.tagsContainer} role="list">
                    {data.tags.map((tag, i) => (
                        <span key={i} className={styles.tag} role="listitem">{tag}</span>
                    ))}
                </div>
            )}
        </article>
    );
});

export default TitleSlide;
