'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import styles from './ModuleCard.module.css';

function ModuleCard({
    title = 'Módulo',
    subtitle = 'Descripción breve',
    icon: Icon,
    href = '#',
    disabled = false,
}) {
    if (disabled) {
        return (
            <div
                className={`${styles.card} ${styles.disabled}`}
                aria-disabled="true"
                aria-label={`${title} — Bloqueado`}
            >
                <div className={styles.iconWrapper}>
                    <Lock size={26} strokeWidth={1.5} />
                </div>
                <span className={styles.tooltip}>{title}</span>
            </div>
        );
    }

    return (
        <Link
            href={href}
            className={styles.card}
            aria-label={title}
            title={title}
        >
            <div className={styles.iconWrapper}>
                {Icon && <Icon size={26} strokeWidth={1.5} />}
            </div>
            <span className={styles.tooltip}>{title}</span>
        </Link>
    );
}

export default memo(ModuleCard);
