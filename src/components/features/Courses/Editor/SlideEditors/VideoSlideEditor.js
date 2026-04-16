'use client';

import { useState, useRef, useCallback } from 'react';
import { uploadCourseAsset } from '@/lib/upload';

/**
 * Helper: convierte cualquier URL de YouTube al formato embed.
 * - https://www.youtube.com/watch?v=ID → https://www.youtube.com/embed/ID
 * - https://youtu.be/ID               → https://www.youtube.com/embed/ID
 * - https://www.youtube.com/embed/ID  → sin cambio
 * - Otro (MP4, etc.)                  → sin cambio
 */
export function toYouTubeEmbed(url) {
    if (!url) return url;
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) {
            return `https://www.youtube.com/embed${u.pathname}`;
        }
        if (u.hostname.includes('youtube.com') && u.pathname === '/watch') {
            const v = u.searchParams.get('v');
            if (v) return `https://www.youtube.com/embed/${v}`;
        }
    } catch { /* URL inválida — devolver tal cual */ }
    return url;
}

const isYouTubeEmbed = (url) => !!url && url.includes('youtube.com/embed');
const isDirectVideo  = (url) => !!url && /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const ACCEPTED_VIDEO = '.mp4,.webm,.ogg';

export default function VideoSlideEditor({ formData, handleChange, styles }) {
    const rawUrl   = formData.videoUrl || '';
    const embedUrl = toYouTubeEmbed(rawUrl);
    const isYT     = isYouTubeEmbed(embedUrl);
    const isDirect = isDirectVideo(rawUrl);

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [uploadError, setUploadError] = useState('');
    const fileInputRef = useRef(null);

    const handleUrlChange = (val) => {
        const embed = toYouTubeEmbed(val.trim());
        handleChange('videoUrl', embed);
    };

    const handleFileUpload = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset file input para poder seleccionar el mismo archivo de nuevo
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Validar tipo
        if (!/\.(mp4|webm|ogg)$/i.test(file.name)) {
            setUploadError('Solo se permiten archivos .mp4, .webm o .ogg');
            return;
        }

        // Validar tamaño
        if (file.size > MAX_VIDEO_SIZE) {
            setUploadError(`El archivo es muy grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo: 100 MB.`);
            return;
        }

        setUploadError('');
        setUploading(true);
        setUploadProgress(`Subiendo ${file.name}…`);

        try {
            const result = await uploadCourseAsset(file);
            if (result.success && result.data?.viewLink) {
                handleChange('videoUrl', result.data.viewLink);
                setUploadProgress('');
            } else {
                setUploadError(result.error || 'Error al subir el video');
                setUploadProgress('');
            }
        } catch (err) {
            setUploadError(err.message || 'Error al subir el video');
            setUploadProgress('');
        } finally {
            setUploading(false);
        }
    }, [handleChange]);

    return (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Título del Slide (Opcional)</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={e => handleChange('heading', e.target.value)}
                    placeholder="Ej. Procedimiento de carga"
                    maxLength={120}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>URL del Video</label>
                <input
                    className={styles.input}
                    value={rawUrl}
                    onChange={e => handleUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... o URL de MP4"
                />
                {rawUrl && !isYT && !isDirect && (
                    <p style={{ fontSize: '0.76rem', color: 'var(--color-warning, #f59e0b)', marginTop: 4 }}>
                        URL no reconocida. Usa un enlace de YouTube o un archivo .mp4/.webm.
                    </p>
                )}
                {isYT && (
                    <p style={{ fontSize: '0.76rem', color: 'var(--color-success, #16a34a)', marginTop: 4 }}>
                        ✓ Video de YouTube detectado
                    </p>
                )}
                {isDirect && (
                    <p style={{ fontSize: '0.76rem', color: 'var(--color-success, #16a34a)', marginTop: 4 }}>
                        ✓ Archivo de video directo detectado
                    </p>
                )}
            </div>

            {/* Subir archivo de video */}
            <div className={styles.formGroup}>
                <label className={styles.label}>O sube un archivo de video</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_VIDEO}
                        onChange={handleFileUpload}
                        disabled={uploading}
                        style={{ display: 'none' }}
                        id="video-upload-input"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: '1px solid var(--border-color, #d1d5db)',
                            background: uploading ? 'var(--bg-secondary, #f3f4f6)' : 'var(--bg-primary, #fff)',
                            color: 'var(--text-primary, #111)',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            fontSize: '0.84rem',
                            fontWeight: 500,
                            fontFamily: 'var(--font-body)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        {uploading ? '⏳ Subiendo…' : '📁 Seleccionar archivo MP4'}
                    </button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #6b7280)' }}>
                        Máx. 100 MB · .mp4, .webm, .ogg
                    </span>
                </div>
                {uploadProgress && (
                    <p style={{ fontSize: '0.76rem', color: 'var(--color-primary, #2563eb)', marginTop: 6 }}>
                        {uploadProgress}
                    </p>
                )}
                {uploadError && (
                    <p style={{ fontSize: '0.76rem', color: 'var(--color-danger, #dc2626)', marginTop: 6 }}>
                        {uploadError}
                    </p>
                )}
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Pie de Video (Opcional)</label>
                <input
                    className={styles.input}
                    value={formData.caption || ''}
                    onChange={e => handleChange('caption', e.target.value)}
                    placeholder="Ej. Demostración del procedimiento de seguridad"
                    maxLength={200}
                />
            </div>

            <div className={styles.formGroup}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    <input
                        type="checkbox"
                        checked={!!formData.autoplay}
                        onChange={e => handleChange('autoplay', e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
                    />
                    Reproducción automática al abrir el slide (silenciado)
                </label>
            </div>

            {/* Vista previa del video de YouTube */}
            {isYT && (
                <div className={styles.formGroup}>
                    <label className={styles.label}>Vista Previa</label>
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                        <iframe
                            src={`${embedUrl}?rel=0&modestbranding=1`}
                            title="Vista previa del video"
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                </div>
            )}

            {/* Vista previa del video directo (MP4/WebM) */}
            {isDirect && (
                <div className={styles.formGroup}>
                    <label className={styles.label}>Vista Previa</label>
                    <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-color)', background: '#000' }}>
                        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                        <video
                            src={rawUrl}
                            controls
                            playsInline
                            style={{ width: '100%', display: 'block', maxHeight: 300 }}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
