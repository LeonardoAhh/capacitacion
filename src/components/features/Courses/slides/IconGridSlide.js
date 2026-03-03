'use client';

import styles from './slides.module.css';
import { AiOutlineEye, AiOutlineSearch, AiOutlineMessage, AiOutlineStar, AiOutlineCheckCircle, AiOutlineBulb, AiOutlineTrophy, AiOutlineThunderbolt, AiOutlineUser, AiOutlineTeam, AiOutlineSafety, AiOutlineRise, AiOutlineGlobal, AiOutlineHeart, AiOutlineBook, AiOutlineTool, AiOutlineCalendar, AiOutlineBell, AiOutlineLock, AiOutlineSmile } from 'react-icons/ai';

// Mapa de íconos disponibles para icon grid slides.
// Mapea nombres semánticos (heredados de lucide) a react-icons/ai.
const ICON_MAP = {
    Eye: AiOutlineEye,
    Search: AiOutlineSearch,
    MessageCircle: AiOutlineMessage,
    Star: AiOutlineStar,
    CheckCircle: AiOutlineCheckCircle,
    Lightbulb: AiOutlineBulb,
    Bulb: AiOutlineBulb,
    Trophy: AiOutlineTrophy,
    Zap: AiOutlineThunderbolt,
    Thunderbolt: AiOutlineThunderbolt,
    User: AiOutlineUser,
    Users: AiOutlineTeam,
    Shield: AiOutlineSafety,
    Safety: AiOutlineSafety,
    TrendingUp: AiOutlineRise,
    Globe: AiOutlineGlobal,
    Heart: AiOutlineHeart,
    Book: AiOutlineBook,
    Tool: AiOutlineTool,
    Calendar: AiOutlineCalendar,
    Bell: AiOutlineBell,
    Lock: AiOutlineLock,
    Smile: AiOutlineSmile,
};

/** Número máximo de ítems permitidos en un IconGridSlide */
const MAX_ITEMS = 6;

/**
 * IconGridSlide — Grid de íconos con máximo 6 ítems
 * Layout responsivo inteligente:
 *   1 ítem  → 1 col
 *   2 ítems → 2 col
 *   3 ítems → 3 col
 *   4 ítems → 2 col × 2 filas
 *   5-6 ítems → 3 col × 2 filas
 *
 * @param {Object} props
 * @param {Object} props.data - { heading, description, items[] }
 * @param {boolean} [props.inline] - Modo preview del editor
 */
export default function IconGridSlide({ data, inline = false, hasBgMedia }) {
    const { heading, description, items = [] } = data;

    // Aplicar límite de 6 ítems
    const visibleItems = items.slice(0, MAX_ITEMS);
    const count = visibleItems.length;

    // Determinar columnas óptimas según cantidad
    const getGridCols = (n) => {
        if (n <= 1) return 'cols1';
        if (n <= 2) return 'cols2';
        if (n <= 3) return 'cols3';
        if (n <= 4) return 'cols2';   // 2×2
        return 'cols3';                // 3×2 (5 o 6)
    };

    const colsClass = styles[getGridCols(count)] || '';

    return (
        <article
            className={`${styles.slide} ${styles.iconGridSlide} ${hasBgMedia ? styles.slideOverBg : ''} ${inline ? styles.slideInline : ''}`}
            role="region"
            aria-label={heading || 'Íconos del contenido'}
        >
            <h2 className={styles.slideTitle}>{heading}</h2>
            {description && <p className={styles.slideDescription}>{description}</p>}

            <div
                className={`${styles.iconGrid} ${colsClass}`}
                role="list"
                data-count={count}
            >
                {visibleItems.map((item, idx) => {
                    const IconComponent = ICON_MAP[item.icon] || AiOutlineBulb;

                    return (
                        <div
                            key={idx}
                            className={styles.gridItem}
                            role="listitem"
                        >
                            <div className={styles.iconWrapper} aria-hidden="true">
                                {item.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={item.image}
                                        alt=""
                                        className={styles.gridItemImage}
                                        loading="lazy"
                                    />
                                ) : (
                                    <IconComponent size={32} />
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

            {/* Aviso si se truncaron ítems (solo visible para el editor/admin) */}
            {inline && items.length > MAX_ITEMS && (
                <p style={{ fontSize: '0.72rem', color: 'var(--color-danger)', textAlign: 'center', marginTop: 8 }}>
                    ⚠️ Solo se muestran los primeros {MAX_ITEMS} iconos (máx. permitido)
                </p>
            )}
        </article>
    );
}
