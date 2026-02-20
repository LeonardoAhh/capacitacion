'use client';
import React from 'react';

const AnimatedLogo = ({ size = 64, className, style }) => {
    return (
        <div className={className} style={{ width: size, height: size, ...style }}>
            <svg
                viewBox="0 0 200 200"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
            >
                <defs>
                    {/* 1. Degradado Metálico Cromado (Para el tornillo) */}
                    <linearGradient id="chromeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8090a0" />
                        <stop offset="20%" stopColor="#ffffff" />
                        <stop offset="45%" stopColor="#8090a0" />
                        <stop offset="55%" stopColor="#506070" />
                        <stop offset="80%" stopColor="#ffffff" />
                        <stop offset="100%" stopColor="#8090a0" />
                    </linearGradient>

                    {/* 2. Degradado Azul Plástico/Vidrio (Para la V/Tolva) */}
                    <linearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(59, 130, 246, 0.9)" />
                        <stop offset="50%" stopColor="rgba(37, 99, 235, 0.6)" />
                        <stop offset="100%" stopColor="rgba(29, 78, 216, 0.9)" />
                    </linearGradient>

                    {/* 3. Mascara para el tornillo (recorte) */}
                    <clipPath id="screwClip">
                        {/* Forma de V truncada o tubo */}
                        <path d="M70 40 L130 40 L110 160 L90 160 Z" />
                    </clipPath>

                    {/* 4. Patrón de Roscas (Animado) */}
                    <pattern id="threadPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        {/* Dientes del tornillo */}
                        <path
                            d="M0 20 L40 0 L40 10 L0 30 Z"
                            fill="url(#chromeGradient)"
                            stroke="rgba(0,0,0,0.2)"
                            strokeWidth="1"
                        />
                    </pattern>

                    {/* Animación de rotación (Desplazamiento del patrón) */}
                    <style>{`
                        @keyframes screwRotate {
                            from { transform: translateY(0); }
                            to { transform: translateY(40px); }
                        }
                        .screw-threads {
                            animation: screwRotate 2s linear infinite;
                        }
                        /* Efecto Hover: Acelerar */
                        svg:hover .screw-threads {
                            animation-duration: 1s;
                        }
                        
                        /* Dark Mode Glow */
                        @media (prefers-color-scheme: dark) {
                             .glow-filter { filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.5)); }
                        }
                        /* Explicit Dark Mode Support via class/attribute if needed */
                        :global([data-theme="dark"]) .glow-filter { 
                            filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.6)); 
                        }
                    `}</style>
                </defs>

                {/* --- ESTRUCTURA 3D --- */}

                {/* 1. Sombra base (Perspectiva) */}
                <ellipse cx="100" cy="170" rx="30" ry="10" fill="rgba(0,0,0,0.3)" filter="blur(5px)" />

                {/* 2. El Tornillo Giratorio (Núcleo) */}
                <g clipPath="url(#screwClip)" className="glow-filter">
                    {/* Fondo del cilindro */}
                    <rect x="70" y="40" width="60" height="140" fill="#334155" />

                    {/* Roscas Animadas */}
                    {/* Usamos un rectángulo gigante con el patrón y lo movemos */}
                    <rect
                        x="60" y="-40" width="80" height="240"
                        fill="url(#threadPattern)"
                        className="screw-threads"
                    />

                    {/* Brillo especular cilíndrico (Overlay estático) */}
                    <rect x="70" y="40" width="60" height="140" fill="url(#chromeGradient)" style={{ mixBlendMode: 'overlay', opacity: 0.4 }} />
                </g>

                {/* 3. La Estructura "V" (Tolva de Cristal/Plástico) - Overlay semitransparente */}
                <path
                    d="M50 20 L80 140 C80 140 85 160 100 160 C115 160 120 140 120 140 L150 20 H130 L110 130 C110 130 108 140 100 140 C92 140 90 130 90 130 L70 20 H50 Z"
                    fill="url(#glassGradient)"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="2"
                    className="glow-filter"
                    style={{ backdropFilter: 'blur(4px)' }}
                />

                {/* 4. Bordes de alta luz (Highligts) para efecto 3D */}
                <path d="M50 20 L70 20" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
                <path d="M130 20 L150 20" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

                {/* Partículas saliendo (Detalle sutil) */}
                <circle cx="100" cy="165" r="3" fill="#60a5fa">
                    <animate attributeName="cy" from="160" to="190" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0" dur="1.5s" repeatCount="indefinite" />
                </circle>

            </svg>
        </div>
    );
};

export default AnimatedLogo;
