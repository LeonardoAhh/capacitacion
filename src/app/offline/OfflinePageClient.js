'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import styles from './offline.module.css';

export default function OfflinePageClient() {
    const router = useRouter();

    useEffect(() => {
        const handleOnline = () => {
            router.push('/');
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [router]);

    const handleRetry = () => {
        if (navigator.onLine) {
            router.push('/');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.iconWrapper}>
                    <WifiOff size={64} />
                </div>
                <h1 className={styles.pageTitle}>Sin conexión</h1>
                <p className={styles.message}>
                    No tienes acceso a internet en este momento. 
                    Verifica tu conexión e intenta de nuevo.
                </p>
                <div className={styles.actions}>
                    <button onClick={handleRetry} className={styles.retryBtn}>
                        <RefreshCw size={18} />
                        Reintentar
                    </button>
                    <button onClick={() => router.push('/')} className={styles.homeBtn}>
                        <Home size={18} />
                        Ir al inicio
                    </button>
                </div>
            </div>
        </div>
    );
}
