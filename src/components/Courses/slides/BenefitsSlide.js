import styles from './slides.module.css';

export default function BenefitsSlide({ data }) {
    const accentColor = data.accent || 'var(--player-accent, var(--color-primary))';

    return (
        <div className={`${styles.slide} ${styles.benefitsSlide}`}>
            <div className={styles.accentBar} style={{ backgroundColor: accentColor }} />

            {data.tag && (
                <span className={styles.slideLabel}>{data.tag}</span>
            )}

            <h2>{data.heading}</h2>

            <div className={styles.benefitsList}>
                {data.items && data.items.map((item, i) => (
                    <div key={i} className={styles.benefitItem}>
                        <span className={styles.benefitIcon}>{item.icon}</span>
                        <span className={styles.benefitText}>{item.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
