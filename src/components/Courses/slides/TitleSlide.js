import styles from './slides.module.css';

export default function TitleSlide({ data }) {
    return (
        <div className={`${styles.slide} ${styles.titleSlide}`}>
            {/* Badge de categoría */}
            <span className={styles.categoryBadge}>
                <span className={styles.categoryDot} />
                Capacitación
            </span>

            <h1>{data.title}</h1>

            {data.subtitle && (
                <p className={styles.titleSubtitle}>{data.subtitle}</p>
            )}

            {data.tags && data.tags.length > 0 && (
                <div className={styles.tagsContainer}>
                    {data.tags.map((tag, i) => (
                        <span key={i} className={styles.tag}>{tag}</span>
                    ))}
                </div>
            )}
        </div>
    );
}
