import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { uploadCourseAsset } from '@/lib/upload';
import styles from '@/app/induccion/cursos/[id]/editar/editor.module.css';

export default function MediaUploader({ currentMedia, onMediaChange, label = "Fondo Multimedia (Opcional)" }) {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) {
            setError('Solo se permiten imágenes (JPG, PNG, WEBP) o videos (MP4, WEBM)');
            return;
        }

        const maxMb = isVideo ? 50 : 5;
        if (file.size > maxMb * 1024 * 1024) {
            setError(`El archivo no debe superar los ${maxMb}MB`);
            return;
        }

        setError(null);
        setUploading(true);

        try {
            const result = await uploadCourseAsset(file);
            if (result.success) {
                const url = result.data.viewLink || '';
                onMediaChange({ url, type: isVideo ? 'video' : 'image' });
            } else {
                setError(result.error || 'Error al subir archivo');
            }
        } catch (err) {
            setError('Error de conexión al subir');
            console.error(err);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemove = () => {
        onMediaChange(null);
        setError(null);
    };

    return (
        <div className={styles.formGroup} style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 20 }}>
            <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {label}
                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-tertiary)' }}>(Se mostrará a un lado o fondo)</span>
            </label>

            {currentMedia?.url ? (
                <div style={{ position: 'relative', width: '100%', maxWidth: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                    {currentMedia.type === 'video' ? (
                        <video src={currentMedia.url} controls style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 200, objectFit: 'cover' }} />
                    ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={currentMedia.url} alt="Media Preview" style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 200, objectFit: 'cover' }} />
                    )}
                    <button
                        onClick={handleRemove}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                        title="Eliminar media"
                    ><X size={16} /></button>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: uploading ? 'wait' : 'pointer', background: 'var(--bg-secondary)', transition: 'all 0.2s', minHeight: '120px' }}
                >
                    <input ref={fileInputRef} type="file" accept="image/*,video/mp4,video/webm" onChange={handleFileChange} disabled={uploading} style={{ display: 'none' }} />
                    {uploading ? (
                        <>
                            <Loader2 size={24} className={styles.spin} style={{ animation: 'spin 1s linear infinite' }} />
                            <span style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Subiendo...</span>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', color: 'var(--text-tertiary)', marginBottom: 8 }}>
                                <ImageIcon size={24} /> <Video size={24} />
                            </div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 500, display: 'block' }}>Click para subir Imagen o Video</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>Max: Imagen 5MB / Video 50MB</span>
                        </div>
                    )}
                </div>
            )}
            {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>{error}</p>}
        </div>
    );
}
