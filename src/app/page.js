'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (user) {
                // Si ya está autenticado, ir al dashboard
                router.push('/dashboard');
            } else {
                // Si no está autenticado, ir al login
                router.push('/login');
            }
        }
    }, [user, loading, router]);

    // Mostrar nada mientras redirige
    return null;
}
