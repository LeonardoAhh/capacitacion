'use client';

import styles from './DashboardComponents.module.css';

/**
 * Banner para solicitar activación de notificaciones push.
 * @param {{ onEnable: () => void }} props
 */
export default function NotificationBanner({ onEnable }) {
    return (
        <div className={styles.notifBanner}>
            <div className={styles.notifBannerContent}>
                <span className={styles.notifIcon}>🔔</span>
                <div>
                    <h3 className={styles.notifTitle}>Activar Notificaciones</h3>
                    <p className={styles.notifDescription}>
                        Recibe alertas sobre contratos vencidos y evaluaciones pendientes.
                    </p>
                </div>
            </div>
            <button onClick={onEnable} className={styles.notifButton}>
                Activar
            </button>
        </div>
    );
}
