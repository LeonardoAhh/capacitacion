'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { uploadCourseAsset } from '@/lib/upload';
import { useToast } from '@/components/ui/Toast/Toast';
import styles from './CourseConfigModal.module.css';

const builtInTracks = [
    {
        label: 'Melodía suave',
        description: 'Fondo tranquilo para presentación',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    {
        label: 'Ritmo ligero',
        description: 'Música ligera y relajada',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    },
    {
        label: 'Acordes ambientales',
        description: 'Acompañamiento ambiental discreto',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
];

export default function CourseConfigModal({ course, onSave, onCancel }) {
    const { toast } = useToast();
    const [enabled, setEnabled] = useState(Boolean(course?.backgroundMusic?.enabled ?? false));
    const [url, setUrl] = useState(String(course?.backgroundMusic?.url ?? ''));
    const [uploading, setUploading] = useState(false);

    const handleSave = () => {
        // Asegurar que url sea un string
        const cleanUrl = typeof url === 'string' ? url.trim() : '';

        // Validar URL si está habilitada la música
        if (enabled && cleanUrl) {
            const invalidDomains = ['bensound.com', 'example.com'];
            if (invalidDomains.some(domain => cleanUrl.includes(domain))) {
                toast.error('Error', 'Esta URL no está permitida. Usa otra fuente de música.');
                return;
            }

            // Validar que sea una URL válida
            try {
                new URL(cleanUrl);
            } catch {
                toast.error('Error', 'La URL no es válida');
                return;
            }
        }

        onSave({ enabled, url: cleanUrl });
    };

    const handleTestUrl = async () => {
        if (!url.trim()) {
            toast.error('Error', 'Ingresa una URL primero');
            return;
        }

        const invalidDomains = ['bensound.com', 'example.com'];
        if (invalidDomains.some(domain => url.includes(domain))) {
            toast.error('Error', 'Esta URL tiene problemas de certificado SSL o no está permitida. Usa otra fuente.');
            return;
        }

        // Validar que sea una URL válida
        try {
            new URL(url);
        } catch {
            toast.error('Error', 'La URL no es válida');
            return;
        }

        try {
            const audio = new Audio();
            audio.volume = 0.1; // Muy bajo para la prueba

            const canPlay = await new Promise((resolve, reject) => {
                audio.addEventListener('canplay', () => resolve(true));
                audio.addEventListener('error', () => reject(false));
                audio.src = url;
                setTimeout(() => reject(false), 5000); // Timeout de 5 segundos
            });

            if (canPlay) {
                toast.success('Éxito', 'La URL de música funciona correctamente');
                // Reproducir un segundo para confirmar
                audio.play().then(() => {
                    setTimeout(() => audio.pause(), 1000);
                }).catch(() => {});
            }
        } catch (error) {
            toast.error('Error', 'No se pudo cargar la música desde esta URL');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('audio/')) {
            toast.error('Error', 'Por favor selecciona un archivo de audio válido.');
            return;
        }

        setUploading(true);
        try {
            const result = await uploadCourseAsset(file);
            if (result.success) {
                setUrl(String(result.data.viewLink));
                toast.success('Subido', 'Archivo de audio subido correctamente.');
            } else {
                toast.error('Error', result.error || 'No se pudo subir el archivo.');
            }
        } catch (error) {
            toast.error('Error', 'Error al subir el archivo.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open onOpenChange={open => !open && onCancel()} aria-labelledby="course-config-title">
            <DialogHeader>
                <DialogTitle id="course-config-title">Configurar Música de Fondo</DialogTitle>
                <DialogClose onClick={onCancel} />
            </DialogHeader>
            <DialogBody>
                <div className={styles.formGroup}>
                    <label>
                        <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setEnabled(e.target.checked)}
                        />
                        <span>Habilitar música de fondo</span>
                    </label>
                </div>
                {enabled && (
                    <>
                        <div className={styles.formGroup}>
                            <label>Seleccionar canción integrada</label>
                            <select
                                value={builtInTracks.some(track => track.url === url) ? url : ''}
                                onChange={(e) => setUrl(e.target.value)}
                            >
                                <option value="">-- Elegir canción integrada --</option>
                                {builtInTracks.map((track) => (
                                    <option key={track.url} value={track.url}>
                                        {track.label}
                                    </option>
                                ))}
                            </select>
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                                Canciones integradas confiables para usar directamente sin upload.
                            </small>
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="music-url">O ingresa tu propia URL</label>
                            <Input
                                id="music-url"
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value || '')}
                                placeholder="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                            />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <Button variant="secondary" size="sm" onClick={handleTestUrl}>
                                    Probar URL
                                </Button>
                            </div>
                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                                Usa URLs de música royalty-free o sube tu propio archivo MP3/WAV.
                            </small>
                        </div>
                        <div className={styles.formGroup}>
                            <label>O subir archivo de audio</label>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                            {uploading && <p>Subiendo...</p>}
                        </div>
                    </>
                )}
            </DialogBody>
            <DialogFooter>
                <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar</Button>
            </DialogFooter>
        </Dialog>
    );
}