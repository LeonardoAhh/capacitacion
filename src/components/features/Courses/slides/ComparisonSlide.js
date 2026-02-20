import styles from './slides.module.css';

export default function ComparisonSlide({ data }) {
    return (
        <article 
            className={`${styles.slide} ${styles.comparisonSlide}`}
            role="region"
            aria-label={data.heading || 'Comparación'}
        >
            {data.heading && (
                <h2 className={styles.comparisonHeading}>{data.heading}</h2>
            )}
            {data.description && (
                <p className={styles.comparisonDesc}>{data.description}</p>
            )}

            <div className={styles.comparisonGrid} role="list">
                <div 
                    className={`${styles.comparisonCol} ${styles.comparisonLeft}`}
                    role="listitem"
                    aria-label={data.left?.label || 'Opción 1'}
                >
                    <div className={styles.comparisonColHeader}>
                        <span className={styles.comparisonColLabel}>{data.left?.label}</span>
                    </div>
                    <div className={styles.comparisonColBody}>
                        {data.left?.items?.length > 0 && (
                            <ul className={styles.comparisonList}>
                                {data.left.items.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        )}
                        {data.left?.description && (
                            <p className={styles.comparisonColDesc}>{data.left.description}</p>
                        )}
                    </div>
                </div>

                <div className={styles.comparisonDivider} aria-hidden="true">VS</div>

                <div 
                    className={`${styles.comparisonCol} ${styles.comparisonRight}`}
                    role="listitem"
                    aria-label={data.right?.label || 'Opción 2'}
                >
                    <div className={styles.comparisonColHeader}>
                        <span className={styles.comparisonColLabel}>{data.right?.label}</span>
                    </div>
                    <div className={styles.comparisonColBody}>
                        {data.right?.items?.length > 0 && (
                            <ul className={styles.comparisonList}>
                                {data.right.items.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        )}
                        {data.right?.description && (
                            <p className={styles.comparisonColDesc}>{data.right.description}</p>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}
