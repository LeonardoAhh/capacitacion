'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import MaintenanceScreen from './MaintenanceScreen';

export default function MaintenanceGuard({ children }) {
    const { user, userRole } = useAuth();
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [maintenanceMessage, setMaintenanceMessage] = useState('');
    const [maintenanceUntil, setMaintenanceUntil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLocalhost, setIsLocalhost] = useState(false);

    useEffect(() => {
        // Verificar si es localhost
        if (typeof window !== 'undefined') {
            setIsLocalhost(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
        }

        // Suscribirse a cambios en la configuración global
        const configRef = doc(db, 'app_config', 'general');
        const unsubscribe = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setIsMaintenance(data.maintenanceMode || false);
                setMaintenanceMessage(data.maintenanceMessage || '');
                setMaintenanceUntil(data.maintenanceUntil || null);
            } else {
                setIsMaintenance(false);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error escuchando configuración de mantenimiento:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Si está cargando la configuración inicial, mostramos children (o un loader si se prefiere, pero children evita flickering en carga normal)
    // Sin embargo, para evitar leak de contenido si está bloqueado, mejor mostramos loading o nada hasta confirmar.
    if (loading) return null;

    // Lógica de Bloqueo
    // Bloquear SI: 
    // 1. El modo mantenimiento está activo
    // Y
    // 2. NO es localhost
    // Y
    // 3. El usuario NO es admin ni superadmin

    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    const shouldBlock = isMaintenance && !isLocalhost && !isAdmin;

    if (shouldBlock) {
        return <MaintenanceScreen message={maintenanceMessage} targetDate={maintenanceUntil} />;
    }

    return <>{children}</>;
}
