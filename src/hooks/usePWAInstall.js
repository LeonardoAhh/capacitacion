'use client';

import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Detectar si ya está en modo app
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone ||
            document.referrer.includes('android-app://');

        setIsStandalone(isStandaloneMode);

        // Detectar si es iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIosDevice);

        if (isStandaloneMode) {
            return;
        }

        // Listener para Android/Desktop prompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Para iOS, es instalable si no estamos en standalone
        if (isIosDevice && !isStandaloneMode) {
            setIsInstallable(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const promptInstall = async () => {
        if (!installPrompt) {
            if (isIOS) {
                alert('Para instalar en iOS: Toca el icono de Compartir en tu navegador y selecciona "Agregar a inicio".');
            }
            return false;
        }

        installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstallable(false);
            setInstallPrompt(null);
            return true;
        }
        return false;
    };

    return {
        isInstallable,
        isIOS,
        isStandalone,
        promptInstall
    };
}
