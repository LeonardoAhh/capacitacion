'use client';

import styles from './ExamBuilder.module.css';

/**
 * Sección de metadatos auditables del examen:
 * ID del documento, revisión, título y puntaje mínimo.
 */
export default function ExamHeader({ exam, onChange }) {
    return (
        <div className={styles.metaCard}>
            <h2 className={styles.metaTitle}>Datos del Examen</h2>
            <div className={styles.metaGrid}>
                {/* ID del documento */}
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>ID del Documento</label>
                    <input
                        className={styles.input}
                        value={exam.documentId}
                        onChange={e => onChange('documentId', e.target.value)}
                        placeholder="RG-GER-015"
                    />
                </div>

                {/* Revisión */}
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Revisión</label>
                    <input
                        className={styles.input}
                        value={exam.revision}
                        onChange={e => onChange('revision', e.target.value)}
                        placeholder="Rev. 2"
                    />
                </div>

                {/* Título (ocupa espacio extra) */}
                <div className={`${styles.fieldGroup} ${styles.fieldGrow}`}>
                    <label className={styles.fieldLabel}>Título del Examen</label>
                    <input
                        className={styles.input}
                        value={exam.title}
                        onChange={e => onChange('title', e.target.value)}
                        placeholder="Alerta de calidad y catálogo de fallas"
                    />
                </div>

                {/* Puntaje mínimo para aprobar */}
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Puntaje mínimo (/ 10)</label>
                    <input
                        type="number"
                        className={styles.input}
                        value={exam.passingScore}
                        min={1}
                        max={10}
                        step={0.5}
                        onChange={e => onChange('passingScore', +e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
