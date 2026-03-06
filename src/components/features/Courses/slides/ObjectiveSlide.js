import React from 'react';
import styles from './slides.module.css';

const ObjectiveSlide = React.memo(function ObjectiveSlide({ data, hasBgMedia }) {
    return (
        <article
            className={`${styles.slide} ${styles.objectiveSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}
            role="region"
            aria-label="Objetivo del curso"
        >
            <span className={styles.slideLabel}>Objetivo General</span>

            <h2>{data.heading}</h2>

            <p
                className={styles.objectiveBody}
                dangerouslySetInnerHTML={{
                    __html: /<[a-z][\s\S]*>/i.test(data.body || '')
                        ? data.body
                        : (data.body || '').split('\n').join('<br/>')
                }}
            />

            {data.badge && (
                <div className={styles.badgeRow}>
                    <span className={styles.badge}>{data.badge}</span>
                    {data.badgeSubtitle && (
                        <span className={styles.badgeSubtitle}>{data.badgeSubtitle}</span>
                    )}
                </div>
            )}
        </article>
    );
});

export default ObjectiveSlide;
