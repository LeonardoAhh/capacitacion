'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ModernLogin from '@/components/ModernLogin/ModernLogin';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaSecret, setMfaSecret] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const { signIn, verifyOtp } = useAuth();
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
            }, 15000);
        } else if (result.mfaRequired) {
            setMfaRequired(true);
            setMfaSecret(result.secret);
            setLoading(false);
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    const handleMfaSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await verifyOtp(verificationCode, mfaSecret);
        if (result.success) {
            sessionStorage.setItem('showWelcome', 'true');
            setLoading(false);
            setIsSuccess(true);
            setTimeout(() => {
                router.push('/modulos');
            }, 4500);
        } else {
            setError(result.error || 'Código incorrecto. Intenta de nuevo.');
            setLoading(false);
        }
    };

    return (
        <ModernLogin
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            verificationCode={verificationCode}
            setVerificationCode={setVerificationCode}
            mfaRequired={mfaRequired}
            error={error}
            loading={loading}
            onSubmit={handleEmployeeSubmit}
            onMfaSubmit={handleMfaSubmit}
            isSuccess={isSuccess}
        />
    );
}
