import styles from './slides.module.css';

/**
 * ComparisonSlide — Slide de dos columnas comparativas.
 *
 * Estructura del data esperada:
 * {
 *   heading: string,
 *   description?: string,
 *   left:  { label: string, items?: string[], description?: string },
 *   right: { label: string, items?: string[], description?: string }
 * }
 */
export default function ComparisonSlide({ data, isDark }) {
    return (
        <div className={`${styles.slide} ${styles.comparisonSlide}`}>
            {data.heading && (
                <h2 className={styles.comparisonHeading}>{data.heading}</h2>
            )}
            {data.description && (
                <p className={styles.comparisonDesc}>{data.description}</p>
            )}

            <div className={styles.comparisonGrid}>
                {/* Columna izquierda */}
                <div className={`${styles.comparisonCol} ${styles.comparisonLeft}`}>
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

                {/* Divider */}
                <div className={styles.comparisonDivider} aria-hidden="true">VS</div>

                {/* Columna derecha */}
                <div className={`${styles.comparisonCol} ${styles.comparisonRight}`}>
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
        </div>
    );
}
