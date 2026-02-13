'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ModernLogin from '@/components/ModernLogin/ModernLogin';
import BackButton from '@/components/ui/BackButton/BackButton';

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
            <BackButton />
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
