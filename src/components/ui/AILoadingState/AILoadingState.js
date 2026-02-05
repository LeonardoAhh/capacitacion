"use client";

/**
 * @author: @kokonutui
 * @description: AI Loading State
 * @version: 1.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import { useEffect, useState, useRef } from "react";

// Customized sequences for Login/Auth context
const TASK_SEQUENCES = [
    {
        status: "Verificando credenciales",
        lines: [
            "Iniciando conexión segura...",
            "Encriptando datos...",
            "Verificando identidad...",
            "Validando permisos...",
            "Acceso autorizado...",
        ],
    },
    {
        status: "Iniciando sesión",
        lines: [
            "Cargando perfil de usuario...",
            "Recuperando preferencias...",
            "Sincronizando configuraciones...",
            "Estableciendo sesión segura...",
            "Verificando estado del sistema...",
            "Preparando entorno...",
            "Optimizando recursos...",
            "Finalizando inicio de sesión...",
        ],
    },
    {
        status: "Preparando Dashboard",
        lines: [
            "Cargando módulos disponibles...",
            "Verificando notificaciones...",
            "Analizando métricas recientes...",
            "Configurando interfaz...",
            "Cargando tema personalizado...",
            "Verificando permisos de acceso...",
            "Validando rutas...",
            "Todo listo...",
            "Redirigiendo...",
        ],
    },
];

const LoadingAnimation = ({ progress }) => (
    <div className="relative w-6 h-6" style={{ width: '24px', height: '24px' }}>
        <svg
            viewBox="0 0 240 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '100%', height: '100%' }}
            aria-label={`Loading progress: ${Math.round(progress)}%`}
        >
            <title>Loading Progress Indicator</title>

            <defs>
                <mask id="progress-mask">
                    <rect width="240" height="240" fill="black" />
                    <circle
                        r="120"
                        cx="120"
                        cy="120"
                        fill="white"
                        strokeDasharray={`${(progress / 100) * 754}, 754`}
                        transform="rotate(-90 120 120)"
                    />
                </mask>
            </defs>

            <style>
                {`
                    @keyframes rotate-cw {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes rotate-ccw {
                        from { transform: rotate(360deg); }
                        to { transform: rotate(0deg); }
                    }
                    .g-spin circle {
                        transform-origin: 120px 120px;
                    }
                    .g-spin circle:nth-child(1) { animation: rotate-cw 8s linear infinite; }
                    .g-spin circle:nth-child(2) { animation: rotate-ccw 8s linear infinite; }
                    .g-spin circle:nth-child(3) { animation: rotate-cw 8s linear infinite; }
                    .g-spin circle:nth-child(4) { animation: rotate-ccw 8s linear infinite; }
                    .g-spin circle:nth-child(5) { animation: rotate-cw 8s linear infinite; }
                    .g-spin circle:nth-child(6) { animation: rotate-ccw 8s linear infinite; }

                    .g-spin circle:nth-child(2n) { animation-delay: 0.2s; }
                    .g-spin circle:nth-child(3n) { animation-delay: 0.3s; }
                `}
            </style>

            <g
                className="g-spin"
                strokeWidth="16"
                strokeDasharray="18% 40%"
                mask="url(#progress-mask)"
            >
                <circle r="150" cx="120" cy="120" stroke="#FF2E7E" opacity="0.95" />
                <circle r="130" cx="120" cy="120" stroke="#00E5FF" opacity="0.95" />
                <circle r="110" cx="120" cy="120" stroke="#4ADE80" opacity="0.95" />
                <circle r="90" cx="120" cy="120" stroke="#FFA726" opacity="0.95" />
                <circle r="70" cx="120" cy="120" stroke="#FFEB3B" opacity="0.95" />
                <circle r="50" cx="120" cy="120" stroke="#FF4081" opacity="0.95" />
            </g>
        </svg>
    </div>
);

export default function AILoadingState() {
    const [sequenceIndex, setSequenceIndex] = useState(0);
    const [visibleLines, setVisibleLines] = useState([]);
    const [scrollPosition, setScrollPosition] = useState(0);
    const codeContainerRef = useRef(null);
    const lineHeight = 28;

    const currentSequence = TASK_SEQUENCES[sequenceIndex];
    const totalLines = currentSequence.lines.length;

    useEffect(() => {
        const initialLines = [];
        for (let i = 0; i < Math.min(5, totalLines); i++) {
            initialLines.push({
                text: currentSequence.lines[i],
                number: i + 1,
            });
        }
        setVisibleLines(initialLines);
        setScrollPosition(0);
    }, [sequenceIndex, currentSequence.lines, totalLines]);

    // Handle line advancement
    useEffect(() => {
        const advanceTimer = setInterval(() => {
            // Get the current first visible line index
            const firstVisibleLineIndex = Math.floor(
                scrollPosition / lineHeight
            );
            const nextLineIndex = (firstVisibleLineIndex + 3) % totalLines;

            // If we're about to wrap around, move to next sequence
            if (nextLineIndex < firstVisibleLineIndex && nextLineIndex !== 0) {
                setSequenceIndex(
                    (prevIndex) => (prevIndex + 1) % TASK_SEQUENCES.length
                );
                return;
            }

            // Add the next line if needed
            if (
                nextLineIndex >= visibleLines.length &&
                nextLineIndex < totalLines
            ) {
                setVisibleLines((prevLines) => [
                    ...prevLines,
                    {
                        text: currentSequence.lines[nextLineIndex],
                        number: nextLineIndex + 1,
                    },
                ]);
            }

            // Scroll to the next line
            setScrollPosition((prevPosition) => prevPosition + lineHeight);
        }, 1200); // Slower for extended duration (was 800)

        return () => clearInterval(advanceTimer);
    }, [
        scrollPosition,
        visibleLines,
        totalLines,
        sequenceIndex,
        currentSequence.lines,
        lineHeight,
    ]);

    // Apply scroll position
    useEffect(() => {
        if (codeContainerRef.current) {
            codeContainerRef.current.scrollTop = scrollPosition;
        }
    }, [scrollPosition]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100%',
            width: '100%',
            color: 'var(--text-primary)'
        }}>
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)'
                }}>
                    <LoadingAnimation
                        progress={(sequenceIndex / TASK_SEQUENCES.length) * 100}
                    />
                    <span style={{ fontSize: '0.875rem' }}>{currentSequence.status}...</span>
                </div>

                <div style={{
                    position: 'relative',
                    background: '#0f172a', // Force dark terminal background
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '12px'
                }}>
                    <div
                        ref={codeContainerRef}
                        style={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            overflow: 'hidden',
                            width: '100%',
                            height: '84px',
                            position: 'relative',
                            scrollBehavior: 'smooth'
                        }}
                    >
                        <div>
                            {visibleLines.map((line, index) => (
                                <div
                                    key={`${line.number}-${line.text}`}
                                    style={{
                                        display: 'flex',
                                        height: '28px',
                                        alignItems: 'center',
                                        padding: '0 8px'
                                    }}
                                >
                                    <div style={{
                                        color: '#64748b', // Fixed slate-500
                                        paddingRight: '12px',
                                        userSelect: 'none',
                                        width: '24px',
                                        textAlign: 'right'
                                    }}>
                                        {line.number}
                                    </div>

                                    <div style={{
                                        color: '#f8fafc', // Fixed slate-50
                                        flex: 1,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {line.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            pointerEvents: 'none',
                            borderRadius: '8px',
                            background: 'linear-gradient(to bottom, transparent 0%, transparent 60%, #0f172a 100%)'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
