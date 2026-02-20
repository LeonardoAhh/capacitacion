'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, PlusSquare, X, Monitor } from 'lucide-react';
import styles from './PWAPrompt.module.css';

export default function PWAPrompt() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone ||
            document.referrer.includes('android-app://');

        setIsStandalone(isStandaloneMode);

        // Detect Platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        // Check if user dismissed it recently (e.g., in last 24 hours)
        const dismissedTime = localStorage.getItem('pwa_prompt_dismissed');
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (isStandaloneMode || (dismissedTime && (now - parseInt(dismissedTime)) < oneDay)) {
            return;
        }

        // Handle Android install prompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // For iOS, show it after a small delay if not standalone
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

        if (outcome === 'accepted') {
            setShowPrompt(false);
        }
        setInstallPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    };

    if (!showPrompt || isStandalone) return null;

    return (
        <AnimatePresence>
            <motion.div
                className={styles.promptContainer}
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
            >
                <div className={styles.promptCard}>
                    <button onClick={handleDismiss} className={styles.closeBtn}>
                        <X size={20} />
                    </button>

                    <div className={styles.content}>
                        <div className={styles.iconWrapper}>
                            <Download size={24} color="#007AFF" />
                        </div>

                        <div className={styles.textColumn}>
                            <h4 className={styles.title}>Instala la App</h4>
                            <p className={styles.description}>
                                {isIOS
                                    ? 'Agrega a pantalla de inicio para una mejor experiencia.'
                                    : 'Instala nuestra aplicación para un acceso más rápido.'}
                            </p>

                            {isIOS && (
                                <div className={styles.iosInstructions}>
                                    <span>1. Toca <Share size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
                                    <span>2. Selecciona &quot;Agregar a Inicio&quot; <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /></span>
                                </div>
                            )}
                        </div>

                        {!isIOS && installPrompt && (
                            <button onClick={handleInstallClick} className={styles.installButton}>
                                Instalar
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
