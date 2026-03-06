import React from 'react';
import { Menu } from 'lucide-react';
import styles from './CandidateMobileHeader.module.css';

export default function CandidateMobileHeader({ onOpenSidebar }) {
    return (
        <header className={styles.header} aria-label="Cabecera Móvil">
            <div className={styles.brand}>
                <div className={styles.brandDot} aria-hidden="true" />
                Viñoplastic
            </div>
            <button
                type="button"
                className={styles.menuBtn}
                onClick={onOpenSidebar}
                aria-label="Abrir menú"
            >
                <Menu size={24} />
            </button>
        </header>
    );
}
