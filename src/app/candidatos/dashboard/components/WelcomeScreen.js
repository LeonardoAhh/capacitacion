'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, ArrowRight } from 'lucide-react';
import styles from './WelcomeScreen.module.css';
import { extractFirstName, getCandidatePhotoUrl } from '../utils/helpers';

export default function WelcomeScreen({ candidate, onStart }) {
    const [imgError, setImgError] = useState(false);

    const firstName = candidate?.nickname?.trim() || extractFirstName(candidate?.name || candidate?.nombre);
    const photoUrl = getCandidatePhotoUrl(candidate);

    return (
        <div className={styles.overlay} role="main">
            <div className={styles.card}>
                <div className={styles.avatar}>
                    {photoUrl && !imgError ? (
                        <Image
                            src={photoUrl}
                            alt={`Foto de ${firstName}`}
                            className={styles.avatarImg}
                            width={80}
                            height={80}
                            unoptimized
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <User size={40} />
                    )}
                </div>

                <h1 className={styles.title}>
                    ¡Bienvenido a <span className={styles.brand}>ViñoPlastic</span>!
                </h1>
                <p className={styles.subtitle}>{firstName}</p>

                <div className={styles.message}>
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

                <button
                    className={styles.button}
                    onClick={onStart}
                    aria-label="Iniciar sesión de inducción"
                    type="button"
                >
                    <span>Iniciar</span>
                    <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
}
