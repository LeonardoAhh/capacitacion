'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import QRCode from 'qrcode';
import Image from 'next/image';
import styles from './MFASetup.module.css';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const MFASetup = () => {
    const { user, generateMfaSecret, enrollMfa } = useAuth();
    const [step, setStep] = useState('INIT'); // INIT, SHOW_QR, SUCCESS
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleStartSetup = async () => {
        setLoading(true);
        setError('');
        const res = await generateMfaSecret(user);
        if (res.success) {
            setSecretKey(res.secret);
            try {
                const url = await QRCode.toDataURL(res.qrCodeUrl);
                setQrDataUrl(url);
                setStep('SHOW_QR');
            } catch (err) {
                setError('Error generando código visual QR');
            }
        } else {
            setError(res.error);
        }
        setLoading(false);
    };

    const handleVerify = async () => {
        setLoading(true);
        setError('');
        const res = await enrollMfa(user, verificationCode, secretKey);
        if (res.success) {
            setStep('SUCCESS');
        } else {
            setError('Código incorrecto o expirado. Intenta de nuevo.');
        }
        setLoading(false);
    };

    const handleDisable2FA = async () => {
        if (!confirm('¿Estás seguro de que deseas deshabilitar la autenticación de dos factores? Tu cuenta será menos segura.')) {
            return;
        }

        setLoading(true);
        setError('');
        try {
            // Update Firestore
            await updateDoc(doc(db, 'users', user.uid || user.id), {
                mfaEnabled: false,
                mfaSecret: null
            });

            // Clear session storage
            sessionStorage.removeItem('mfa_verified');

            // Reload page to refresh user state
            window.location.reload();
        } catch (err) {
            console.error('Error disabling 2FA:', err);
            setError('Error al deshabilitar 2FA. Intenta de nuevo.');
        }
        setLoading(false);
    };

    // If 2FA is already enabled, show different UI
    if (user?.mfaEnabled && step === 'INIT') {
        return (
            <div className={styles.wrapper}>
                <div className={styles.introCard}>
                    <div className={styles.headerRow}>
                        <div className={styles.iconCircle} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className={styles.title}>2FA Activo ✓</h4>
                            <p className={styles.description}>Tu cuenta está protegida con autenticación de dos factores.</p>
                        </div>
                    </div>

                    {error && <div className={styles.errorBox}>{error}</div>}

                    <div className={styles.statusInfo}>
                        <div className={styles.statusItem}>
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#10b981' }}>
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Verificación de dos pasos activa</span>
                        </div>
                        <div className={styles.statusItem}>
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#10b981' }}>
                                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Máxima seguridad habilitada</span>
                        </div>
                    </div>

                    <button
                        onClick={handleDisable2FA}
                        disabled={loading}
                        className={styles.buttonDanger}
                    >
                        {loading ? 'Deshabilitando...' : 'Deshabilitar 2FA'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            {step === 'INIT' && (
                <div className={styles.introCard}>
                    <div className={styles.headerRow}>
                        <div className={styles.iconCircle}>
                            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className={styles.title}>Proteger mi cuenta</h4>
                            <p className={styles.description}>Habilita la verificación de dos pasos para mayor seguridad.</p>
                        </div>
                    </div>

                    {error && <div className={styles.errorBox}>{error}</div>}

                    <button
                        onClick={handleStartSetup}
                        disabled={loading}
                        className={styles.buttonPrimary}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Iniciando...
                            </>
                        ) : (
                            'Configurar 2FA Ahora'
                        )}
                    </button>
                </div>
            )}

            {step === 'SHOW_QR' && (
                <div className={styles.qrContainer}>
                    <h3 className={styles.qrTitle}>Escanea el código QR</h3>

                    <div className={styles.qrImageFrame}>
                        <Image src={qrDataUrl} alt="QR Code" width={180} height={180} className={styles.qrImage} />
                    </div>

                    <div style={{ textAlign: 'center', margin: '1rem 0', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                            <strong>O ingresa manualmente:</strong>
                        </p>
                        <code style={{
                            display: 'block',
                            padding: '0.75rem',
                            background: 'var(--bg-primary)',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            wordBreak: 'break-all',
                            fontFamily: 'monospace',
                            border: '1px solid var(--border-color)'
                        }}>
                            {secretKey}
                        </code>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                            Copia este código y agrégalo manualmente en Google Authenticator
                        </p>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label className={styles.label}>
                            Ingresa el código de 6 dígitos
                        </label>
                        <input
                            type="text"
                            placeholder="000 000"
                            maxLength={6}
                            className={styles.codeInput}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                        />

                        {error && <div className={styles.errorBox}>{error}</div>}

                        <div className={styles.actions}>
                            <button
                                onClick={() => setStep('INIT')}
                                className={styles.buttonSecondary}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleVerify}
                                disabled={loading || verificationCode.length !== 6}
                                className={styles.buttonVerify}
                            >
                                {loading ? 'Verificando...' : 'Verificar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'SUCCESS' && (
                <div className={styles.successContainer}>
                    <div className={styles.successIcon}>
                        <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className={styles.successTitle}>¡2FA Activado Correctamente!</h3>
                    <p className={styles.successText}>
                        Tu cuenta tiene ahora el máximo nivel de seguridad.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MFASetup;
