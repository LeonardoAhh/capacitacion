'use client';

import { Wrench, Clock, AlertTriangle } from 'lucide-react';

export default function MaintenanceScreen({ message }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '2rem',
            textAlign: 'center',
            color: '#1e293b'
        }}>
            <div style={{
                backgroundColor: '#eff6ff',
                padding: '2rem',
                borderRadius: '50%',
                marginBottom: '2rem',
                boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.15)'
            }}>
                <Wrench size={64} color="#3b82f6" strokeWidth={1.5} />
            </div>

            <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '800',
                marginBottom: '1rem',
                background: 'linear-gradient(45deg, #1e293b, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                Plataforma en Mantenimiento
            </h1>

            <p style={{
                fontSize: '1.1rem',
                maxWidth: '600px',
                lineHeight: '1.6',
                color: '#64748b',
                marginBottom: '2.5rem'
            }}>
                {message || 'Estamos realizando mejoras importantes en nuestra plataforma para brindarte un mejor servicio. Por favor, vuelve a intentarlo más tarde.'}
            </p>

            <div style={{
                display: 'flex',
                gap: '2rem',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                    <Clock size={20} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Tiempo estimado: Indefinido</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                    <AlertTriangle size={20} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Disculpa las molestias</span>
                </div>
            </div>

            <div style={{
                position: 'absolute',
                bottom: '2rem',
                fontSize: '0.8rem',
                color: '#94a3b8'
            }}>
                &copy; {new Date().getFullYear()} Viñoplastic Training. Todos los derechos reservados.
            </div>
        </div>
    );
}
