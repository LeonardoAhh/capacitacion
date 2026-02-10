'use client';

import { useState } from 'react';
import { User, ArrowRight } from 'lucide-react';
import styles from './WelcomeScreen.module.css';
import { BackgroundLines } from '@/components/ui/BackgroundLines/BackgroundLines';
import { extractFirstName, getCandidatePhotoUrl } from '../utils/helpers';

export default function WelcomeScreen({ candidate, onStart }) {
    const [imgError, setImgError] = useState(false);
    // Extract first name using the helper function
    const firstName = extractFirstName(candidate?.name || candidate?.nombre);
    const photoUrl = getCandidatePhotoUrl(candidate);

    return (
        <div
            className={styles.welcomeOverlay}
            role="main"
            aria-labelledby="welcome-title"
        >
            {/* Background Gradient */}
            <div className={styles.backgroundGradient} aria-hidden="true" />

            {/* Background Shapes */}
            <div className={styles.shapesContainer} aria-hidden="true">
                <BackgroundLines />
            </div>

            <div className={styles.welcomeCard} role="article">
                {/* Welcome Header */}
                <header className={styles.welcomeHeader}>
                    <div
                        className={styles.welcomeAvatar}
                        role="img"
                        aria-label={photoUrl ? `Foto de perfil de ${firstName}` : 'Ícono de usuario'}
                    >
                        {photoUrl && !imgError ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={photoUrl}
                                alt={`Foto de perfil de ${firstName}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                loading="eager"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <User size={64} aria-hidden="true" />
                        )}
                    </div>
                </header>

                <h1 id="welcome-title" className={styles.welcomeTitle}>
                    ¡Bienvenido a <span>ViñoPlastic</span>!
                </h1>

                <p className={styles.welcomeSubtitle} aria-label={`Hola ${firstName}`}>
                    {firstName}
                </p>

                <div className={styles.welcomeMessage}>
                    <p>
                        Nos da mucho gusto que formes parte de nuestra familia.
                        A partir de hoy inicias un nuevo capítulo en tu carrera profesional.
                    </p>
                    <p>
                        En <strong>ViñoPlastic Inyección S.A. de C.V.</strong> valoramos tu talento
                        y estamos comprometidos con tu desarrollo.
                    </p>
                    <p>
                        A continuación encontrarás los cursos de inducción que deberás completar
                        para conocer nuestra empresa, políticas y tu puesto de trabajo.
                    </p>
                </div>

                <div className={styles.infoGrid} role="list" aria-label="Información del candidato">
                    <div className={styles.infoItem} role="listitem">
                        <span className={styles.infoLabel} id="position-label">Puesto:</span>
                        <span className={styles.infoValue} aria-labelledby="position-label">
                            {candidate?.position || candidate?.puesto || 'Por asignar'}
                        </span>
                    </div>
                    <div className={styles.infoItem} role="listitem">
                        <span className={styles.infoLabel} id="area-label">Área:</span>
                        <span className={styles.infoValue} aria-labelledby="area-label">
                            {candidate?.area || 'Por asignar'}
                        </span>
                    </div>
                </div>

                <button
                    className={styles.welcomeButton}
                    onClick={onStart}
                    aria-label="Iniciar sesión de inducción"
                    type="button"
                >
                    <span>Iniciar</span>
                    <ArrowRight size={20} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
