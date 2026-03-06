import React from 'react';
import styles from './slides.module.css';

const ComparisonSlide = React.memo(function ComparisonSlide({ data, hasBgMedia }) {
    // Soporte para múltiples formatos de datos:
    // Nuevo: { left: { title, items }, right: { title, items } }
    // Legado: { col1Title, col1Items, col2Title, col2Items }
    // Mixto: { left: { label, items }, right: { label, items } }
    const leftTitle = data.left?.title || data.left?.label || data.col1Title || '';
    const rightTitle = data.right?.title || data.right?.label || data.col2Title || '';
    const leftItems = data.left?.items || data.col1Items || [];
    const rightItems = data.right?.items || data.col2Items || [];
    const leftDesc = data.left?.description || '';
    const rightDesc = data.right?.description || '';

    return (
        <article
            className={`${styles.slide} ${styles.comparisonSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}
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
                {/* Columna Izquierda */}
                <div
                    className={`${styles.comparisonCol} ${styles.comparisonLeft}`}
                    role="listitem"
                    aria-label={leftTitle || 'Opción 1'}
                >
                    <div className={styles.comparisonColHeader}>
                        <span className={styles.comparisonColLabel}>{leftTitle}</span>
                    </div>
                    <div className={styles.comparisonColBody}>
                        {leftItems.length > 0 && (
                            <ul className={styles.comparisonList}>
                                {leftItems.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        )}
                        {leftDesc && (
                            <p className={styles.comparisonColDesc}>{leftDesc}</p>
                        )}
                    </div>
                </div>

                <div className={styles.comparisonDivider} aria-hidden="true">VS</div>

                {/* Columna Derecha */}
                <div
                    className={`${styles.comparisonCol} ${styles.comparisonRight}`}
                    role="listitem"
                    aria-label={rightTitle || 'Opción 2'}
                >
                    <div className={styles.comparisonColHeader}>
                        <span className={styles.comparisonColLabel}>{rightTitle}</span>
                    </div>
                    <div className={styles.comparisonColBody}>
                        {rightItems.length > 0 && (
                            <ul className={styles.comparisonList}>
                                {rightItems.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        )}
                        {rightDesc && (
                            <p className={styles.comparisonColDesc}>{rightDesc}</p>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
});

export default ComparisonSlide;
