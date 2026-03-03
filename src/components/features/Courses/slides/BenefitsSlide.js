import styles from './slides.module.css';

export default function BenefitsSlide({ data, hasBgMedia }) {
    const accentColor = data.accent || 'var(--course-accent)';

    return (
        <article
            className={`${styles.slide} ${styles.benefitsSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}
            role="region"
            aria-label="Beneficios del curso"
        >
            <div
                className={styles.accentBar}
                style={{ backgroundColor: accentColor }}
                aria-hidden="true"
            />

            {data.tag && (
                <span className={styles.slideLabel}>{data.tag}</span>
            )}

            <h2>{data.heading}</h2>

            <ul className={styles.benefitsList} role="list">
                {data.items && data.items.map((item, i) => {
                    const text = typeof item === 'object' ? item.text : item;
                    const icon = typeof item === 'object' ? item.icon : null;

                    return (
                        <li key={i} className={styles.benefitItem} role="listitem">
                            <span className={styles.benefitIcon} aria-hidden="true">
                                {icon || '✓'}
                            </span>
                            <span className={styles.benefitText}>{text}</span>
                        </li>
                    );
                })}
            </ul>
        </article>
    );
}
