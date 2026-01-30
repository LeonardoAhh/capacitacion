'use client';

import { useState } from 'react';
import { uploadFile } from '@/lib/upload';

export default function TestUploadPage() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
            setResult(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Por favor selecciona un archivo primero');
            return;
        }

        setUploading(true);
        setError(null);
        setResult(null);

        try {
            const response = await uploadFile(file, {
                employeeId: 'TEST_USER_001',
                docType: 'pruebas'
            });

            if (!response.success) {
                setResult(response);
                throw new Error(response.error || 'Error en la subida');
            }

            setResult(response);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ padding: '50px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1>🧪 Prueba de Google Drive</h1>

            <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <input
                    type="file"
                    onChange={handleFileChange}
                    style={{ marginBottom: '10px', display: 'block' }}
                />

                <button
                    onClick={handleUpload}
                    disabled={uploading || !file}
                    style={{
                        padding: '10px 20px',
                        background: uploading ? '#ccc' : '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: uploading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {uploading ? 'Subiendo...' : 'Subir Archivo'}
                </button>
            </div>

            <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '5px', fontSize: '12px' }}>
                <strong>Estado Configuración (Debug):</strong>
                <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                    <li>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '✅ Configurado' : '❌ Falta'}</li>
                    <li>Drive Root ID: {result?.debug?.hasRootId ? '✅ Detectado en Server' : '❓ Probando...'}</li>
                </ul>
                <p style={{ color: '#666' }}>Si acabas de editar .env.local, <strong>reinicia la terminal</strong>.</p>
            </div>

            {error && (
                <div style={{ padding: '15px', background: '#ffebee', color: '#c62828', borderRadius: '5px' }}>
                    <strong>❌ Error:</strong> {error}
                    {result?.details && (
                        <div style={{ marginTop: '10px', fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                            {result.details}
                        </div>
                    )}
                </div>
            )}

            {result?.success && (
                <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '5px', border: '1px solid #c8e6c9' }}>
                    <h3 style={{ color: '#2e7d32', marginTop: 0 }}>✅ ¡Éxito!</h3>
                    <p>Archivo subido correctamente a Google Drive.</p>

                    <div style={{ background: 'white', padding: '10px', borderRadius: '4px', fontSize: '14px' }}>
                        <p><strong>ID:</strong> {result.data.id}</p>
                        <p>
                            <strong>Link:</strong> <br />
                            <a href={result.data.viewLink} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                                {result.data.viewLink}
                            </a>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
