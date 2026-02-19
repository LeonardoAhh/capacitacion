import styles from './slides.module.css';

export default function IconGridSlide({ data }) {
    return (
        <div className={`${styles.slide} ${styles.iconGridSlide}`}>
            <h2>{data.heading}</h2>
            <div className={styles.iconGrid}>
                {data.items && data.items.map((item, i) => (
                    <div
                        key={i}
                        className={styles.iconCard}
                    >
                        <span className={styles.iconEmoji}>{item.icon}</span>
                        <span className={styles.iconLabel} style={{ color: item.color || 'var(--player-accent)' }}>
                            {item.label}
                        </span>
                        {item.sublabel && (
                            <span className={styles.iconSublabel}>{item.sublabel}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
