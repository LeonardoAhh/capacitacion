'use client';

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

export default function VideoSlideEditor({ formData, handleChange, styles }) {
    const rawUrl   = formData.videoUrl || '';
    const embedUrl = toYouTubeEmbed(rawUrl);
    const isYT     = isYouTubeEmbed(embedUrl);
    const isDirect = isDirectVideo(rawUrl);

    const handleUrlChange = (val) => {
        const embed = toYouTubeEmbed(val.trim());
        handleChange('videoUrl', embed);
    };

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
        </>
    );
}
