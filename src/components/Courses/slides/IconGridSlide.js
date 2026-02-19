import styles from './slides.module.css';
import * as LucideIcons from 'lucide-react';

export default function IconGridSlide({ data }) {
    const { heading, description, items } = data;

    return (
        <article 
            className={`${styles.slide} ${styles.iconGridSlide}`}
            role="region"
            aria-label={heading || 'Iconos del contenido'}
        >
            <h2 className={styles.slideTitle}>{heading}</h2>
            {description && <p className={styles.slideDescription}>{description}</p>}

            <div className={styles.iconGrid} role="list">
                {items && items.map((item, idx) => {
                    const IconComponent = LucideIcons[item.icon] || LucideIcons.Circle;

                    return (
                        <div 
                            key={idx} 
                            className={styles.gridItem}
                            role="listitem"
                        >
                            <div className={styles.iconWrapper} aria-hidden="true">
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt=""
                                        className={styles.gridItemImage}
                                        loading="lazy"
                                    />
                                ) : (
                                    <IconComponent size={32} strokeWidth={1.5} />
                                )}
                            </div>
                            <h3 className={styles.iconLabel}>{item.label}</h3>
                            {item.description && (
                                <p className={styles.iconSublabel}>{item.description}</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </article>
    );
}
