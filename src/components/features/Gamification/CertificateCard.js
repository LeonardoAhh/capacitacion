'use client';

import { useRef, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, Award } from 'lucide-react';
import { CERTIFICATE_TIERS } from '@/utils/gamificationConfig';
import styles from './CertificateCard.module.css';

function CertificatePreview({ certificate, userName, tier, certRef }) {
    const tierData = useMemo(
        () => CERTIFICATE_TIERS[tier] || CERTIFICATE_TIERS.bronze,
        [tier]
    );

    const today = useMemo(() => {
        return new Date().toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    }, []);

    return (
        <div
            ref={certRef}
            className={styles.certificatePreview}
            style={{
                background: tierData.bgGradient,
                borderColor: tierData.borderColor,
            }}
        >
            <div className={styles.cornerTL} style={{ borderColor: tierData.borderColor }} />
            <div className={styles.cornerTR} style={{ borderColor: tierData.borderColor }} />
            <div className={styles.cornerBL} style={{ borderColor: tierData.borderColor }} />
            <div className={styles.cornerBR} style={{ borderColor: tierData.borderColor }} />

            <div className={styles.innerBorder} style={{ borderColor: `${tierData.borderColor}44` }}>
                <div className={styles.certHeaderLine} style={{ backgroundColor: tierData.borderColor }} />

                <div className={styles.certLogo} style={{ color: tierData.accentColor }}>
                    ✦
                </div>

                <p className={styles.certCompany} style={{ color: tierData.accentColor }}>
                    VIÑOPLASTIC
                </p>

                <h2 className={styles.certTitle}>CERTIFICADO</h2>

                <p className={styles.certSubheading}>{certificate.subtitle}</p>

                <div className={styles.certDivider} style={{ backgroundColor: tierData.borderColor }} />

                <p className={styles.certAwardedTo}>Se otorga a:</p>

                <h3 className={styles.certName} style={{ color: tierData.accentColor }}>
                    {userName}
                </h3>

                <p className={styles.certDescription}>{certificate.description}</p>

                <div className={styles.certDivider} style={{ backgroundColor: tierData.borderColor }} />

                <div className={styles.certFooter}>
                    <div className={styles.certFooterItem}>
                        <span className={styles.certFooterLabel}>Fecha</span>
                        <span className={styles.certFooterValue}>{today}</span>
                    </div>
                    <div
                        className={styles.certSeal}
                        style={{ borderColor: tierData.borderColor, color: tierData.accentColor }}
                    >
                        ★
                    </div>
                    <div className={styles.certFooterItem}>
                        <span className={styles.certFooterLabel}>Nivel</span>
                        <span className={styles.certFooterValue} style={{ color: tierData.accentColor }}>
                            {tierData.label}
                        </span>
                    </div>
                </div>

                <div className={styles.certFooterLine} style={{ backgroundColor: tierData.borderColor }} />
            </div>
        </div>
    );
}

function CertificateModal({ certificate, userName, onClose }) {
    const certRef = useRef(null);
    const [downloading, setDownloading] = useState(false);

    const handleDownload = useCallback(async () => {
        if (!certRef.current || downloading) return;
        setDownloading(true);

        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(certRef.current, {
                scale: 3,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                allowTaint: true,
                foreignObjectRendering: false,
                removeContainer: true,
            });

            const link = document.createElement('a');
            const fileName = `certificado_${certificate.id}_${userName.replace(/\s+/g, '_')}.png`;
            link.download = fileName;
            link.href = canvas.toDataURL('image/png', 1.0);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error al generar certificado:', err);
            alert('Error al generar el certificado. Por favor, intenta de nuevo.');
        } finally {
            setDownloading(false);
        }
    }, [certificate.id, userName, downloading]);

    const handleContentClick = useCallback((e) => {
        e.stopPropagation();
    }, []);

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={handleContentClick}>
                <div className={styles.modalHeader}>
                    <h3>{certificate.title}</h3>
                    <button
                        className={styles.modalClose}
                        onClick={onClose}
                        aria-label="Cerrar modal"
                        type="button"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <CertificatePreview
                        certificate={certificate}
                        userName={userName}
                        tier={certificate.tier}
                        certRef={certRef}
                    />
                </div>

                <div className={styles.modalFooter}>
                    <button
                        className={styles.downloadBtn}
                        onClick={handleDownload}
                        disabled={downloading}
                        type="button"
                    >
                        {downloading ? (
                            <span className={styles.spinner} />
                        ) : (
                            <Download size={16} />
                        )}
                        {downloading ? 'Generando...' : 'Descargar Certificado'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CertificateCard({ certificates = [], userName = 'Usuario' }) {
    const [selectedCert, setSelectedCert] = useState(null);

    const { earned, locked } = useMemo(() => {
        if (!certificates || certificates.length === 0) {
            return { earned: [], locked: [] };
        }
        return {
            earned: certificates.filter(c => c.unlocked),
            locked: certificates.filter(c => !c.unlocked)
        };
    }, [certificates]);

    const handleOpenCert = useCallback((cert) => {
        setSelectedCert(cert);
    }, []);

    const handleCloseCert = useCallback(() => {
        setSelectedCert(null);
    }, []);

    if (!certificates || certificates.length === 0) {
        return null;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h3>Mis Certificados</h3>
                    <span className={styles.subtitle}>
                        {earned.length} de {certificates.length} desbloqueados
                    </span>
                </div>
                <Award size={20} className={styles.headerIcon} />
            </div>

            <div className={styles.grid}>
                {earned.map((cert) => {
                    const tierData = CERTIFICATE_TIERS[cert.tier] || CERTIFICATE_TIERS.bronze;
                    return (
                        <button
                            key={cert.id}
                            className={styles.certCard}
                            onClick={() => handleOpenCert(cert)}
                            style={{ '--cert-color': tierData.borderColor }}
                            type="button"
                            aria-label={`Ver certificado ${cert.title}`}
                        >
                            <div
                                className={styles.certCardIcon}
                                style={{
                                    background: tierData.bgGradient,
                                    borderColor: tierData.borderColor
                                }}
                            >
                                <Award size={20} style={{ color: tierData.accentColor }} />
                            </div>
                            <div className={styles.certCardInfo}>
                                <h4>{cert.title}</h4>
                                <span className={styles.certTierLabel} style={{ color: tierData.accentColor }}>
                                    {tierData.label}
                                </span>
                            </div>
                        </button>
                    );
                })}

                {locked.map((cert) => (
                    <div
                        key={cert.id}
                        className={`${styles.certCard} ${styles.certCardLocked}`}
                        role="button"
                        aria-disabled="true"
                        aria-label={`Certificado ${cert.title} bloqueado`}
                    >
                        <div className={styles.certCardIconLocked}>
                            <Award size={20} />
                        </div>
                        <div className={styles.certCardInfo}>
                            <h4>{cert.title}</h4>
                            <span className={styles.certTierLocked}>Bloqueado</span>
                        </div>
                    </div>
                ))}
            </div>

            {typeof document !== 'undefined' && createPortal(
                selectedCert && (
                    <CertificateModal
                        certificate={selectedCert}
                        userName={userName}
                        onClose={handleCloseCert}
                    />
                ),
                document.body
            )}
        </div>
    );
}
