import React from 'react';
import { Menu, PanelLeft } from 'lucide-react';
import styles from './CandidateMobileHeader.module.css';

export default function CandidateMobileHeader({ onOpenSidebar, title }) {
    return (
        <header className={styles.header} aria-label="Cabecera Móvil">
            <button 
                type="button" 
                onClick={onOpenSidebar}
                aria-label="Abrir menú"
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    background: 'transparent', 
                    border: 'none', 
                    padding: '0', 
                    cursor: 'pointer',
                    outline: 'none'
                }}
            >
                <PanelLeft size={24} strokeWidth={1.5} color="#4b5563" />
                <span style={{ fontWeight: 600, fontSize: '0.90rem', letterSpacing: '0.02em', color: '#111827', textTransform: 'uppercase' }}>
                    {title || 'INICIO'}
                </span>
            </button>
        </header>
    );
}
