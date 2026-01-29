import React, { useState, useEffect } from 'react';

/* --- Estilos CSS (Inyectados directamente para evitar errores de importación) --- */
const styles = `
/* --- Variables & Base --- */
.modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background-color: rgba(15, 23, 42, 0.6); /* Slate 900 con opacidad */
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    opacity: 0;
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-overlay.visible {
    opacity: 1;
}

.modal-container {
    position: relative;
    width: 100%;
    max-width: 900px;
    background: #0f172a; /* Slate 900 (Fondo principal Vertx) */
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.5), 
        0 0 0 1px rgba(59, 130, 246, 0.1); /* Sombra sutil azul */
    overflow: hidden;
    transform: scale(0.95) translateY(10px);
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    color: white;
    font-family: 'Inter', sans-serif;
}

.modal-container.visible {
    transform: scale(1) translateY(0);
    opacity: 1;
}

.content-wrapper {
    position: relative;
    z-index: 2; /* Por encima del background */
    padding: 3rem;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
}

/* --- Background Effects --- */

.grid-pattern {
    position: absolute;
    inset: 0;
    background-size: 40px 40px;
    background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
    pointer-events: none;
    z-index: 0;
}

.glow-orb-1, .glow-orb-2 {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.25;
    z-index: 0;
    pointer-events: none;
}

.glow-orb-1 {
    width: 400px;
    height: 400px;
    background: #3b82f6; /* Vertx Primary */
    top: -150px;
    left: -100px;
}

.glow-orb-2 {
    width: 300px;
    height: 300px;
    background: #8b5cf6; /* Vertx Secondary */
    bottom: -50px;
    right: -50px;
}

/* --- Header --- */

.header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.logo-badge {
    display: flex;
    align-items: center;
    gap: 12px;
}

.logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.version-pill {
    font-size: 0.75rem;
    font-weight: 600;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.05);
    padding: 4px 10px;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.close-btn {
    background: transparent;
    border: none;
    color: #64748b;
    padding: 8px;
    cursor: pointer;
    border-radius: 50%;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

/* --- Welcome Text --- */

.welcome-section {
    margin-bottom: 1rem;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.6s ease 0.1s;
}

.fade-in-up {
    opacity: 1;
    transform: translateY(0);
}

.headline {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    letter-spacing: -0.02em;
    margin: 0 0 0.5rem 0;
}

.brand-text {
    background: linear-gradient(to right, #3b82f6, #8b5cf6, #06b6d4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.subheadline {
    font-size: 1.05rem;
    color: #94a3b8; /* Slate 400 */
    max-width: 600px;
    line-height: 1.6;
}

/* --- Features Grid --- */

.features-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
}

@media (max-width: 768px) {
    .features-grid {
        grid-template-columns: 1fr;
    }
}

.feature-card {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 24px;
    transition: all 0.3s ease;
    cursor: default;
    position: relative;
    overflow: hidden;
    animation: fadeUpCard 0.5s ease forwards;
    opacity: 0;
}

@keyframes fadeUpCard {
    to { opacity: 1; transform: translateY(0); }
}

.feature-card:hover, .feature-card.active {
    background: rgba(30, 41, 59, 0.7);
    border-color: rgba(59, 130, 246, 0.4);
    transform: translateY(-4px);
    box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.4);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.icon-box {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
}

.feature-card:hover .icon-box, .feature-card.active .icon-box {
    background: #3b82f6;
    color: white;
    transform: scale(1.1);
}

.feature-card h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: white;
}

.card-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
    margin-bottom: 16px;
    width: 100%;
}

.card-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.card-list li {
    font-size: 0.85rem;
    color: #cbd5e1; /* Slate 300 */
    display: flex;
    align-items: center;
}

.card-list li::before {
    content: "•";
    color: #06b6d4; /* Accent Cyan */
    margin-right: 8px;
    font-size: 1.2em;
    line-height: 0.5;
}

/* --- Footer --- */

.footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    opacity: 0;
    transition: opacity 0.5s ease 0.4s;
}

.footer.visible {
    opacity: 1;
}

.footer-status {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-dot {
    width: 8px;
    height: 8px;
    background-color: #10b981; /* Emerald 500 */
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
}

.status-text {
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.cta-button {
    background: white;
    color: #0f172a;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
}

.cta-button:hover {
    background: #f1f5f9;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}
`;

export default function WelcomeModal() {
    // Nota: Eliminamos los props open/onOpenChange externos para esta demo standalone
    // para asegurar que se pueda visualizar inmediatamente.
    const [open, setOpen] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [activeSection, setActiveSection] = useState(null);

    useEffect(() => {
        if (open) {
            setMounted(false);
            const timer = setTimeout(() => setMounted(true), 100);
            return () => clearTimeout(timer);
        }
    }, [open]);

    const handleClose = () => {
        setMounted(false);
        setTimeout(() => setOpen(false), 300);
        // En una app real, aquí llamarías a onOpenChange(false)
        // Para demo, lo reiniciamos despues de un momento para que el usuario pueda verlo de nuevo si quiere
        setTimeout(() => { setOpen(true); }, 2000);
    };

    if (!open) return (
        <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
            <button onClick={() => setOpen(true)} className="px-4 py-2 bg-blue-600 rounded">Abrir Modal</button>
        </div>
    );

    const sections = [
        {
            id: 'gestion',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            ),
            title: 'Gestión de Personal',
            items: ['Perfiles y expedientes', 'Evaluación de desempeño', "Control de contratos"]
        },
        {
            id: 'capacitacion',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
            ),
            title: 'Capacitación',
            items: ['Registros DC-3', 'Matriz de Habilidades', 'Planes de carrera']
        },
        {
            id: 'promociones',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                </svg>
            ),
            title: 'Ascensos',
            items: ['Elegibilidad automática', 'Criterios objetivos', 'Reportes para auditoría']
        },
        {
            id: 'analytics',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
            ),
            title: 'Analytics 4.0',
            items: ['KPIs en tiempo real', 'Cumplimiento ISO', 'Alertas preventivas']
        }
    ];

    return (
        <>
            <style>{styles}</style>
            <div className={`modal-overlay ${mounted ? 'visible' : ''}`}>
                <div className={`modal-container ${mounted ? 'visible' : ''}`}>

                    {/* Background Effects */}
                    <div className="grid-pattern"></div>
                    <div className="glow-orb-1"></div>
                    <div className="glow-orb-2"></div>

                    {/* Content Wrapper */}
                    <div className="content-wrapper">

                        {/* Header */}
                        <div className="header">
                            <div className="logo-badge">
                                <div className="logo-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                    </svg>
                                </div>
                                <span className="version-pill">v2.4 Release</span>
                            </div>

                            <button
                                className="close-btn"
                                onClick={handleClose}
                                aria-label="Cerrar"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>

                        {/* Hero Text */}
                        <div className={`welcome-section ${mounted ? 'fade-in-up' : ''}`}>
                            <h2 className="headline">
                                Bienvenido a <span className="brand-text">Vertex</span>
                            </h2>
                            <p className="subheadline">
                                Tu centro de comando para la gestión de talento y cumplimiento industrial.
                            </p>
                        </div>

                        {/* Grid de Módulos */}
                        <div className="features-grid">
                            {sections.map((section, index) => (
                                <div
                                    key={section.id}
                                    className={`feature-card ${activeSection === section.id ? 'active' : ''}`}
                                    style={{ animationDelay: `${100 + index * 50}ms` }}
                                    onMouseEnter={() => setActiveSection(section.id)}
                                    onMouseLeave={() => setActiveSection(null)}
                                >
                                    <div className="card-header">
                                        <div className="icon-box">{section.icon}</div>
                                        <h3>{section.title}</h3>
                                    </div>
                                    <div className="card-divider"></div>
                                    <ul className="card-list">
                                        {section.items.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Footer Action */}
                        <div className={`footer ${mounted ? 'visible' : ''}`}>
                            <div className="footer-status">
                                <span className="status-dot"></span>
                                <span className="status-text">Sistema Operativo • Planta A</span>
                            </div>
                            <button
                                className="cta-button"
                                onClick={handleClose}
                            >
                                Ingresar al Dashboard
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}