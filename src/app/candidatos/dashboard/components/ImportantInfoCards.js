'use client';

import { User, FileText, Phone } from 'lucide-react';
import styles from './ImportantInfoCards.module.css';

export default function ImportantInfoCards({ className }) {
    return (
        <section className={className}>
            <h3 className={styles.sectionHeader}>Información Importante</h3>
            <div className={styles.importantGrid}>
                <div className={styles.importantCard}>
                    <div className={styles.importantCardIcon}>
                        <User size={18} />
                    </div>
                    <p className={styles.importantCardText}>
                        Solo tienes <span>5 oportunidades</span> disponibles para iniciar sesión.
                    </p>
                </div>

                <div className={styles.importantCard}>
                    <div className={styles.importantCardIcon}>
                        <FileText size={18} />
                    </div>
                    <p className={styles.importantCardText}>
                        Entrega tus evaluaciones en los <span>próximos 7 días</span> después de tu ingreso.
                    </p>
                </div>

                <div className={styles.importantCard}>
                    <div className={styles.importantCardIcon}>
                        <Phone size={18} />
                    </div>
                    <p className={styles.importantCardText}>
                        Si agotaste tus oportunidades, contacta a{' '}
                        <a href="https://wa.me/524211265940" target="_blank" rel="noopener noreferrer" className={styles.importantCardLink}>
                            Soporte
                        </a>{' '}
                        para un nuevo código.
                    </p>
                </div>
            </div>
        </section>
    );
}
