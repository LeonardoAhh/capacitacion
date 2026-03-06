import React from 'react';
import styles from './slides.module.css';

const DefinitionSlide = React.memo(function DefinitionSlide({ data, hasBgMedia }) {
    return (
        <article
            className={`${styles.slide} ${styles.definitionSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}
            role="region"
            aria-label={data.heading || 'Definición'}
        >
            {data.label && (
                <span className={styles.slideLabel}>{data.label}</span>
            )}

            <h2>{data.heading}</h2>

            <p
                className={styles.definitionBody}
                dangerouslySetInnerHTML={{
                    __html: /<[a-z][\s\S]*>/i.test(data.body || '')
                        ? data.body
                        : (data.body || '').split('\n').join('<br/>')
                }}
            />

            {data.highlights && data.highlights.length > 0 && (
                <div className={styles.highlights} role="list">
                    {data.highlights.map((h, i) => (
                        <span key={i} className={styles.highlight} role="listitem">{h}</span>
                    ))}
                </div>
            )}
        </article>
    );
});

export default DefinitionSlide;
