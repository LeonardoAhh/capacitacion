import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadFile } from '@/lib/upload';
import styles from '@/app/induccion/cursos/[id]/editar/editor.module.css';

export default function ImageUploader({ currentImage, onImageChange, label = "Imagen" }) {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tipo
        if (!file.type.startsWith('image/')) {
            setError('Solo se permiten archivos de imagen');
            return;
        }

        // Validar tamaño (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('La imagen no debe superar los 5MB');
            return;
        }

        setError(null);
        setUploading(true);

        try {
            // Usamos docType='course_assets' para organizar en Drive/Storage
            const result = await uploadFile(file, { docType: 'course_assets' });

            if (result.success) {
                // Devolvemos la URL pública (viewLink o downloadLink)
                onImageChange(result.data.viewLink || result.data.downloadLink);
            } else {
                setError(result.error || 'Error al subir la imagen');
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
        onImageChange('');
        setError(null);
    };

    return (
        <div className={styles.formGroup}>
            <label className={styles.label}>{label}</label>

            {currentImage ? (
                <div className={styles.imagePreviewContainer} style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '300px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)'
                }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={currentImage}
                        alt="Preview"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                    <button
                        onClick={handleRemove}
                        style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Eliminar imagen"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: '2px dashed var(--border-color)',
                        borderRadius: '8px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: uploading ? 'wait' : 'pointer',
                        background: 'var(--bg-secondary)',
                        transition: 'all 0.2s',
                        minHeight: '120px'
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploading}
                        style={{ display: 'none' }}
                    />

                    {uploading ? (
                        <>
                            <Loader2 size={24} className={styles.spin} style={{ animation: 'spin 1s linear infinite' }} />
                            <span style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Subiendo...</span>
                        </>
                    ) : (
                        <>
                            <ImageIcon size={24} style={{ color: 'var(--text-tertiary)', marginBottom: '8px' }} />
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                                Click para subir imagen
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                JPG, PNG, WEBP (Max 5MB)
                            </span>
                        </>
                    )}
                </div>
            )}

            {error && (
                <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '6px' }}>
                    {error}
                </p>
            )}

            <style jsx global>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
