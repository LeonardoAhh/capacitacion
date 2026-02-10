'use client';

import { User, Download, FileText, Phone } from 'lucide-react';
import styles from './ImportantInfoCards.module.css';

export default function ImportantInfoCards({ className }) {
    return (
        <section className={`${className}`} style={{ marginBottom: '24px', marginTop: '40px' }}>
            <h3 className={styles.sectionHeader}>ℹ️ Información Importante</h3>
            <div className={styles.importantGrid}>
                {/* Card 1 */}
                <div className={styles.importantCard}>
                    <div className={styles.importantCardIcon}>
                        <User size={20} />
                    </div>
                    <p className={styles.importantCardText}>
                        Solo tienes <span style={{ fontWeight: 800, color: '#007aff' }}>10 inicios de sesión</span> disponibles.
                    </p>
                </div>
                {/* Card 2 */}
                <div className={styles.importantCard}>
                    <div className={styles.importantCardIcon}>
                        <Download size={20} />
                    </div>
                    <p className={styles.importantCardText}>
                        Puedes descargar el examen y contestarlo o solo anotar las respuestas.
                    </p>
                </div>
                {/* Card 3 */}
                <div className={styles.importantCard}>
                    <div className={styles.importantCardIcon}>
                        <FileText size={20} />
                    </div>
                    <p className={styles.importantCardText}>
                        Presenta tus respuestas en tu <span style={{ fontWeight: 700 }}>primer día</span> de trabajo.
                    </p>
                </div>
                {/* Card 4 */}
                <div className={styles.importantCard}>
                    <div className={styles.importantCardIcon}>
                        <Phone size={20} />
                    </div>
                    <p className={styles.importantCardText}>
                        Si agotaste tus oportunidades, contacta a <span style={{ fontWeight: 700 }}>RH</span> para un nuevo código.
                    </p>
                </div>
            </div>
        </section>
    );
}
