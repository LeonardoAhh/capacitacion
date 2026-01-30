'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * DemoGuard Component
 * Redirects 'demo' users to /induccion
 * Wrap any page/layout that should be restricted for demo users
 */
export default function DemoGuard({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    const isDemo = user?.rol === 'demo' || user?.email?.includes('demo');

    useEffect(() => {
        if (!loading && isDemo) {
            router.replace('/induccion');
        }
    }, [loading, isDemo, router]);

    // Show nothing while checking or if demo user (will redirect)
    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)'
            }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (isDemo) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                textAlign: 'center',
                padding: '20px'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px'
                }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5 }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
                <h2 style={{ margin: '0 0 10px', fontSize: '1.5rem' }}>Acceso Restringido</h2>
                <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                    Esta sección no está disponible en modo Demo.
                </p>
                <button
                    onClick={() => router.push('/induccion')}
                    style={{
                        padding: '12px 30px',
                        background: '#007AFF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    Ir a Inducción
                </button>
            </div>
        );
    }

    return children;
}
