import styles from './slides.module.css';

export default function ContentSlide({ data }) {
    const accentColor = data.accent || 'var(--player-accent, var(--color-primary))';

    return (
        <div className={`${styles.slide} ${styles.contentSlide}`}>
            <div className={styles.accentBar} style={{ backgroundColor: accentColor }} />

            {data.tag && (
                <span className={styles.slideLabel}>{data.tag}</span>
            )}

            <h2>{data.heading}</h2>

            {data.body && (
                <p className={styles.contentBody}>{data.body}</p>
            )}

            {data.bullets && data.bullets.length > 0 && (
                <ul className={styles.bulletList}>
                    {data.bullets.map((bullet, i) => (
                        <li key={i} className={styles.bulletItem}>
                            <span className={styles.bulletDot} style={{ backgroundColor: accentColor }} />
                            <span>{bullet}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
