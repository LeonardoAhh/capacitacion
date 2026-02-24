'use client';

import { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button/Button';

/**
 * Hook global para reemplazar window.confirm() con un modal estilizado.
 *
 * Uso:
 *   const { confirmDialog, showConfirm } = useConfirm();
 *
 *   // En el JSX raíz del componente:
 *   {confirmDialog}
 *
 *   // En handlers async:
 *   const ok = await showConfirm('¿Eliminar este elemento?', { danger: true });
 *   if (!ok) return;
 */
export function useConfirm() {
    const [state, setState] = useState({
        open: false,
        message: '',
        title: '',
        danger: false,
        confirmLabel: 'Confirmar',
        cancelLabel: 'Cancelar',
    });

    // Ref para resolver la promesa desde fuera del render
    const resolveRef = useRef(null);

    const showConfirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            resolveRef.current = resolve;
            setState({
                open: true,
                message,
                title: options.title || '¿Confirmar acción?',
                danger: options.danger ?? true,
                confirmLabel: options.confirmLabel || 'Confirmar',
                cancelLabel: options.cancelLabel || 'Cancelar',
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setState(s => ({ ...s, open: false }));
        resolveRef.current?.(true);
    }, []);

    const handleCancel = useCallback(() => {
        setState(s => ({ ...s, open: false }));
        resolveRef.current?.(false);
    }, []);

    const confirmDialog = state.open
        ? createPortal(
            <div
                style={{
                    position: 'fixed', inset: 0, zIndex: 100000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                }}
            >
                {/* Overlay */}
                <div
                    onClick={handleCancel}
                    style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                    }}
                />

                {/* Modal */}
                <div
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="confirm-title"
                    aria-describedby="confirm-message"
                    style={{
                        position: 'relative',
                        background: 'var(--bg-card, #1a1a2e)',
                        border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                        borderRadius: 14,
                        padding: '1.75rem',
                        maxWidth: 420,
                        width: '100%',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        animation: 'confirmFadeIn 0.18s ease',
                    }}
                >
                    {/* Icono */}
                    <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: state.danger ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '1rem',
                    }}>
                        {state.danger ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        )}
                    </div>

                    <h2
                        id="confirm-title"
                        style={{ margin: '0 0 0.5rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}
                    >
                        {state.title}
                    </h2>
                    <p
                        id="confirm-message"
                        style={{ margin: '0 0 1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}
                    >
                        {state.message}
                    </p>

                    <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                        <Button variant="secondary" onClick={handleCancel}>
                            {state.cancelLabel}
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            style={state.danger ? { background: '#ef4444', borderColor: '#ef4444' } : {}}
                        >
                            {state.confirmLabel}
                        </Button>
                    </div>
                </div>

                {/* Animación */}
                <style>{`
                    @keyframes confirmFadeIn {
                        from { opacity: 0; transform: scale(0.95) translateY(8px); }
                        to   { opacity: 1; transform: scale(1)   translateY(0); }
                    }
                `}</style>
            </div>,
            document.body
        )
        : null;

    return { showConfirm, confirmDialog };
}
