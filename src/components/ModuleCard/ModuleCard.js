'use client';

import { ArrowRight, Repeat2, LucideIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import styles from './ModuleCard.module.css';

export default function ModuleCard({
    title = "Módulo",
    subtitle = "Descripción breve",
    description = "Descripción completa del módulo",
    features = [],
    icon: Icon,
    href = "#",
    disabled = false,
    locked = false,
}) {
    const [isFlipped, setIsFlipped] = useState(false);

    const CardContent = (
        <div
            className={styles.cardWrapper}
            onMouseEnter={() => !disabled && setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
            role={disabled ? "presentation" : undefined}
            aria-label={disabled ? `${title} - Bloqueado` : undefined}
        >
            <div
                className={`${styles.cardInner} ${isFlipped ? styles.flipped : ''}`}
            >
                {/* Front of card */}
                <div className={`${styles.cardFace} ${styles.cardFront} ${disabled ? styles.disabled : ''} ${isFlipped ? styles.hidden : ''}`}>
                    <div className={styles.frontGradient}>
                        <div className={styles.iconAnimation}>
                            {Icon && (
                                <div className={styles.iconWrapper}>
                                    <Icon className={styles.icon} size={40} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.frontContent}>
                        <div className={styles.textContainer}>
                            <h3 className={styles.title}>{title}</h3>
                            <p className={styles.subtitle}>{subtitle}</p>
                        </div>
                        <div className={styles.flipIndicator}>
                            {disabled ? (
                                <span className={styles.lockIcon}>🔒</span>
                            ) : (
                                <>
                                    <div className={styles.iconGlow} />
                                    <Repeat2 className={styles.repeatIcon} size={16} />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Back of card */}
                <div className={`${styles.cardFace} ${styles.cardBack} ${isFlipped ? styles.visible : ''}`}>
                    <div className={styles.backContent}>
                        <div className={styles.featuresList}>
                            {features.map((feature, index) => (
                                <div
                                    className={styles.featureItem}
                                    key={feature}
                                    style={{
                                        transform: isFlipped ? 'translateX(0)' : 'translateX(-10px)',
                                        opacity: isFlipped ? 1 : 0,
                                        transitionDelay: `${index * 100 + 200}ms`,
                                    }}
                                >
                                    <ArrowRight className={styles.featureArrow} size={14} />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.backFooter}>
                            <div className={styles.ctaButton}>
                                <span>Acceder al módulo</span>
                                <div className={styles.ctaIconWrapper}>
                                    <div className={styles.ctaIconGlow} />
                                    <ArrowRight className={styles.ctaArrow} size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (disabled) {
        return (
            <div
                className={styles.disabledWrapper}
                role="button"
                aria-disabled="true"
                aria-label={`${title} - No disponible`}
                tabIndex={-1}
            >
                {CardContent}
            </div>
        );
    }

    return (
        <Link
            href={href}
            className={styles.linkWrapper}
            aria-label={`Ir a ${title}`}
        >
            {CardContent}
        </Link>
    );
}
