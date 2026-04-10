'use client';

import { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import styles from './PWAPrompt.module.css';

export default function PWAPrompt() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone ||
            document.referrer.includes('android-app://');

        setIsStandalone(isStandaloneMode);

        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        const dismissedTime = localStorage.getItem('pwa_prompt_dismissed');
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (isStandaloneMode || (dismissedTime && (now - parseInt(dismissedTime)) < oneDay)) {
            return;
        }

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        if (isIosDevice && !isStandaloneMode) {
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') setShowPrompt(false);
        setInstallPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    };

    if (!showPrompt || isStandalone) return null;

    return (
        <div className={styles.promptContainer}>
            <div className={styles.promptCard}>
                {/* Header: icon + text + close */}
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <Download size={18} />
                    </div>
                    <div className={styles.textColumn}>
                        <h4 className={styles.title}>Instala la App</h4>
                        <p className={styles.description}>
                            {isIOS
                                ? 'Agrega a pantalla de inicio para una mejor experiencia.'
                                : 'Accede más rápido sin abrir el navegador.'}
                        </p>
                    </div>
                    <button onClick={handleDismiss} className={styles.closeBtn} aria-label="Cerrar">
                        <X size={15} />
                    </button>
                </div>

                {/* iOS instructions */}
                {isIOS && (
                    <div className={styles.iosInstructions}>
                        <span>1. Toca <Share size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Compartir</span>
                        <span>2. Selecciona &quot;Agregar a Inicio&quot; <PlusSquare size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
                    </div>
                )}

                {/* Android install button */}
                {!isIOS && installPrompt && (
                    <button onClick={handleInstallClick} className={styles.installButton}>
                        Instalar ahora
                    </button>
                )}
            </div>
        </div>
    );
}
