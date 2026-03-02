import styles from './slides.module.css';

export default function ObjectiveSlide({ data }) {
    return (
        <article
            className={`${styles.slide} ${styles.objectiveSlide}`}
            role="region"
            aria-label="Objetivo del curso"
        >
            <span className={styles.slideLabel}>Objetivo General</span>

            <h2>{data.heading}</h2>

            <p className={styles.objectiveBody}>{data.body}</p>

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
}
