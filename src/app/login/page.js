'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ModernLogin from '@/components/ModernLogin/ModernLogin';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const { signIn, signInWithGoogle } = useAuth();
    const router = useRouter();

    const handleEmployeeSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await signIn(email, password);

        if (result.success) {
            sessionStorage.setItem('showWelcome', 'true');
            setLoading(false);
            setIsSuccess(true);
            setTimeout(() => {
                router.push('/modulos');
            }, 2000);
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);

        const result = await signInWithGoogle();

        if (result.success) {
            sessionStorage.setItem('showWelcome', 'true');
            setLoading(false);
            setIsSuccess(true);
            setTimeout(() => {
                router.push('/modulos');
            }, 2000);
        } else {
            setError(result.error || 'Error al iniciar sesión con Google');
            setLoading(false);
        }
    };

    return (
        <>
            <Link href="/" style={{
                position: 'fixed',
                top: '20px',
                left: '20px',
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: '50px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                textDecoration: 'none',
                color: '#333',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
            }}>
                <ArrowLeft size={18} />
                <span>Volver</span>
            </Link>
            <ModernLogin
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                error={error}
                loading={loading}
                onSubmit={handleEmployeeSubmit}
                onGoogleSignIn={handleGoogleSignIn}
                isSuccess={isSuccess}
            />
        </>
    );
}
