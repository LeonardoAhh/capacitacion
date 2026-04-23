'use client';

import { useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import styles from './UpdatePrompt.module.css';

export default function UpdatePrompt() {
    const { updateAvailable, applyUpdate } = useServiceWorker();
    const [dismissed, setDismissed] = useState(false);

    if (!updateAvailable || dismissed) return null;

    return (
        <div className={styles.pill} role="status" aria-live="polite">
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.label}>Nueva actualización disponible</span>
            <button onClick={applyUpdate} className={styles.action}>
                Actualizar
            </button>
            <button
                onClick={() => setDismissed(true)}
                className={styles.close}
                aria-label="Descartar"
            >
                <X size={12} strokeWidth={2.5} />
            </button>
        </div>
    );
}
