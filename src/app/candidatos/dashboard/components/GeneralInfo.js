'use client';

import styles from './GeneralInfo.module.css';

export default function GeneralInfo({ candidate }) {
    return (
        <section>
            <h3 className={styles.sectionHeader}>Datos Generales</h3>
            <div className={styles.infoGrid}>
                <div className={styles.infoCard}>
                    <span className={styles.infoLabelSmall}>CURP</span>
                    <span className={styles.infoValueLarge}>{candidate?.curp || '---'}</span>
                </div>
                <div className={styles.infoCard}>
                    <span className={styles.infoLabelSmall}>Turno</span>
                    <span className={styles.infoValueLarge}>{candidate?.shift || '---'}</span>
                </div>
                <div className={styles.infoCard}>
                    <span className={styles.infoLabelSmall}>Fecha de Ingreso</span>
                    <span className={styles.infoValueLarge}>
                        {candidate?.startDate ? new Date(candidate.startDate).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }) : '---'}
                    </span>
                </div>
                <div className={styles.infoCard}>
                    <span className={styles.infoLabelSmall}>No. Empleado</span>
                    <span className={styles.infoValueLarge}>{candidate?.employeeId || candidate?.numero_empleado || '---'}</span>
                </div>
            </div>
        </section>
    );
}
