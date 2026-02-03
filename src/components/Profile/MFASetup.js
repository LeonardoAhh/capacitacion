'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import QRCode from 'qrcode';
import Image from 'next/image';
import styles from './MFASetup.module.css';

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
