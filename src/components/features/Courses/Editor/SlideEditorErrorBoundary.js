import React from 'react';

/**
 * Error Boundary para el panel de edición de slides.
 * Captura errores de render causados por data corrupta en Firestore.
 * Ofrece un botón para restaurar el slide a sus datos por defecto.
 */
export default class SlideEditorErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[SlideEditorErrorBoundary] Render error en slide:', error, info.componentStack);
    }

    handleReset() {
        this.setState({ hasError: false, error: null });
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div style={{
                padding: '32px',
                background: 'var(--bg-secondary, #fafaf8)',
                borderRadius: '16px',
                border: '1.5px solid rgba(239,68,68,0.25)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                textAlign: 'center',
                maxWidth: '500px',
                margin: '0 auto',
            }}>
                <div style={{ fontSize: '2rem' }}>⚠️</div>
                <div>
                    <h3 style={{
                        margin: '0 0 8px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                    }}>
                        Error al cargar el editor
                    </h3>
                    <p style={{
                        margin: 0,
                        fontSize: '0.84rem',
                        color: 'var(--text-secondary)',
                        fontFamily: 'var(--font-body)',
                        lineHeight: 1.5,
                    }}>
                        Los datos de este slide están en un formato inesperado.
                        Puedes intentar restaurarlo o eliminarlo.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                        onClick={() => this.handleReset()}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            border: '1.5px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            fontFamily: 'var(--font-body)',
                        }}
                    >
                        Reintentar
                    </button>
                    {this.props.onRestoreDefault && (
                        <button
                            onClick={() => {
                                this.props.onRestoreDefault();
                                this.handleReset();
                            }}
                            style={{
                                padding: '8px 18px',
                                borderRadius: '8px',
                                border: 'none',
                                background: '#ef4444',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                                fontFamily: 'var(--font-body)',
                            }}
                        >
                            Restaurar datos por defecto
                        </button>
                    )}
                </div>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details style={{ width: '100%', textAlign: 'left' }}>
                        <summary style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                            Detalle del error (solo en desarrollo)
                        </summary>
                        <pre style={{ fontSize: '0.70rem', color: '#ef4444', marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {this.state.error.message}
                        </pre>
                    </details>
                )}
            </div>
        );
    }
}
