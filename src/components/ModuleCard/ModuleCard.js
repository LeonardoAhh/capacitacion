'use client';

import { memo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import styles from './ModuleCard.module.css';

function ModuleCard({
    title = 'Módulo',
    subtitle = 'Descripción breve',
    icon: Icon,
    href = '#',
    disabled = false,
}) {
    const CardContent = (
        <div className={`${styles.card} ${disabled ? styles.disabled : ''}`}>
            <div className={styles.iconWrapper}>
                {Icon && <Icon size={28} strokeWidth={1.5} />}
            </div>
            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.subtitle}>{subtitle}</p>
            </div>
            <div className={styles.arrow}>
                {disabled ? (
                    <span className={styles.lock}>Bloqueado</span>
                ) : (
                    <ChevronRight size={20} />
                )}
            </div>
        </div>
    );

    if (disabled) {
        return (
            <div className={styles.disabledWrapper} aria-disabled="true">
                {CardContent}
            </div>
        );
    }

    return (
        <Link href={href} className={styles.link} aria-label={`Ir a ${title}`}>
            {CardContent}
        </Link>
    );
}

export default memo(ModuleCard);
