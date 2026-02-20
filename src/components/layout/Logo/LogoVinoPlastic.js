'use client';
import React from 'react';

const LogoVinoPlastic = (props) => {
    return (
        <svg
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Logo Vino Plastic"
            {...props}
        >
            <defs>
                {/* Gradiente Principal (Azul Neón/Tech) */}
                <linearGradient id="primaryGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" /> {/* Blue 500 */}
                    <stop offset="100%" stopColor="#1d4ed8" /> {/* Blue 700 */}
                </linearGradient>

                {/* Gradiente Secundario (Luz/Brillo) */}
                <linearGradient id="lightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#93c5fd" /> {/* Blue 300 */}
                    <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>

                {/* Gradiente Sombra (Profundidad) */}
                <linearGradient id="shadowGrad" x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e3a8a" /> {/* Blue 900 */}
                    <stop offset="100%" stopColor="#172554" /> {/* Blue 950 */}
                </linearGradient>

                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* --- FORMA GEOMÉTRICA 3D (Abstracta) --- */}
            {/* Es una composición de prismas isométricos formando una estructura sólida */}

            {/* Sombra base suave */}
            <ellipse cx="50" cy="90" rx="30" ry="6" fill="black" fillOpacity="0.15" filter="blur(4px)" />

            <g filter="url(#glow)">
                {/* 1. Cara Lateral Izquierda (Oscura/Profunda) */}
                <path
                    d="M50 85 L20 65 L20 35 L50 55 Z"
                    fill="url(#shadowGrad)"
                />

                {/* 2. Cara Lateral Derecha (Media) */}
                <path
                    d="M50 85 L80 65 L80 35 L50 55 Z"
                    fill="url(#primaryGrad)"
                />

                {/* 3. Cara Superior (Brillante) - Sugiere la 'V' en negativo o un bloque tech */}
                <path
                    d="M50 55 L80 35 L50 15 L20 35 Z"
                    fill="url(#lightGrad)"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1"
                />

                {/* Detalle interno (Núcleo) */}
                <path
                    d="M50 55 L50 25"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="1"
                />
            </g>

        </svg>
    );
};

export default LogoVinoPlastic;
