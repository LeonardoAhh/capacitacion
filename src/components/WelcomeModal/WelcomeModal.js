'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { Button } from '@/components/ui/Button/Button';
import styles from './WelcomeModal.module.css';

export default function WelcomeModal({ open, onOpenChange }) {
    const [mounted, setMounted] = useState(false);
    const [activeSection, setActiveSection] = useState(null);

    useEffect(() => {
        if (open) {
            setMounted(false);
            const timer = setTimeout(() => setMounted(true), 100);
            return () => clearTimeout(timer);
        }
    }, [open]);

    if (!open) return null;

    const sections = [
        {
            id: 'gestion',
            icon: '👥',
            title: 'Gestión de Personal',
            items: ['Perfiles y datos', 'Desempeño', "Contratos"]
        },
        {
            id: 'capacitacion',
            icon: '🎓',
            title: 'Capacitación',
            items: ['Registros', 'Categorías', 'Matriz']
        },
        {
            id: 'promociones',
            icon: '📈',
            title: 'Promociones',
            items: ['Seguimiento de elegibilidad', 'Criterios automáticos', 'Reportes Excel']
        },
        {
            id: 'analytics',
            icon: '📊',
            title: 'Analytics',
            items: ['KPIs en tiempo real', 'Dashboards interactivos', 'Alertas inteligentes']
        }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <div className={`${styles.modalOverlay} ${mounted ? styles.overlayVisible : ''}`}>
                <div className={`${styles.modalContainer} ${mounted ? styles.containerVisible : ''}`}>
                    {/* Decorative elements */}
                    <div className={styles.glowOrb1}></div>
                    <div className={styles.glowOrb2}></div>
                    <div className={styles.gridPattern}></div>

                    {/* Header */}
                    <div className={styles.header}>
                        <div className={styles.logoContainer}>
                            <div className={styles.logo}>
                                <span className={styles.logoIcon}>◆</span>
                            </div>
                            <div className={styles.logoText}>
                                <h1>Sistema Vertex</h1>
                                <span className={styles.version}>v2.0</span>
                            </div>
                        </div>
                        <button
                            className={styles.closeBtn}
                            onClick={() => onOpenChange(false)}
                            aria-label="Cerrar"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Welcome Message */}
                    <div className={`${styles.welcomeSection} ${mounted ? styles.fadeInUp : ''}`}>
                        <p className={styles.greeting}>Bienvenido al futuro de la gestión</p>
                        <h2 className={styles.headline}>
                            Plataforma integral de
                            <span className={styles.gradientText}> Capacitación</span>
                        </h2>
                    </div>

                    {/* Feature Cards */}
                    <div className={styles.featuresGrid}>
                        {sections.map((section, index) => (
                            <div
                                key={section.id}
                                className={`${styles.featureCard} ${mounted ? styles.cardVisible : ''} ${activeSection === section.id ? styles.cardActive : ''}`}
                                style={{ animationDelay: `${150 + index * 100}ms` }}
                                onMouseEnter={() => setActiveSection(section.id)}
                                onMouseLeave={() => setActiveSection(null)}
                            >
                                <div className={styles.cardIcon}>{section.icon}</div>
                                <h3>{section.title}</h3>
                                <ul className={styles.cardList}>
                                    {section.items.map((item, i) => (
                                        <li key={i}>
                                            <span className={styles.bullet}>›</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <div className={styles.cardGlow}></div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <div className={`${styles.footer} ${mounted ? styles.footerVisible : ''}`}>
                        <div className={styles.footerInfo}>
                            <span className={styles.statusDot}></span>
                            ¡Y mucho más!... Descubrelo por ti mismo
                        </div>
                        <button
                            className={styles.ctaButton}
                            onClick={() => onOpenChange(false)}
                        >
                            <span>Comenzar</span>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
