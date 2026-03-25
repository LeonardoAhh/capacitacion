import React from 'react';
import { PanelLeft } from 'lucide-react';
import styles from './CandidateMobileHeader.module.css';

export default function CandidateMobileHeader({ onOpenSidebar, title }) {
    return (
        <header className={styles.header} aria-label="Cabecera Móvil">
            <button
                type="button"
                className={styles.menuBtn}
                onClick={onOpenSidebar}
                aria-label="Abrir menú"
            >
                <PanelLeft size={20} strokeWidth={1.8} />
            </button>
            <div className={styles.divider} aria-hidden="true" />
            <span className={styles.title}>{title || 'INICIO'}</span>
        </header>
    );
}
