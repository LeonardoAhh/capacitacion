import styles from './slides.module.css';

export default function DefinitionSlide({ data }) {
    return (
        <div className={`${styles.slide} ${styles.definitionSlide}`}>
            {data.label && (
                <span className={styles.slideLabel}>{data.label}</span>
            )}

            <h2>{data.heading}</h2>

            <p className={styles.definitionBody}>{data.body}</p>

            {data.highlights && data.highlights.length > 0 && (
                <div className={styles.highlights}>
                    {data.highlights.map((h, i) => (
                        <span key={i} className={styles.highlight}>{h}</span>
                    ))}
                </div>
            )}
        </div>
    );
}
