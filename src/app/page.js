'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './page.module.css';
import {
    Menu, X, Moon, Sun, ChevronRight,
    Factory, Cog, Layers, Wrench,
    Zap, Truck, Cpu, PenTool
} from 'lucide-react';

export default function LandingPage() {
    const { theme, toggleTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Efecto para detectar scroll y ajustar el navbar
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Inicio', href: '#home' },
        { name: 'Servicios', href: '#services' },
        { name: 'Empresa', href: '#about' },
        { name: 'Maquinaria', href: '#machinery' },
        { name: 'Productos', href: '#products' },
    ];

    return (
        <div className={styles.main}>

            {/* --- Navigation --- */}
            <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
                <div className={styles.navContainer}>

                    {/* Logo */}
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>
                            V
                        </div>
                        <span>
                            Viño<span className={styles.logoHighlight}>plastic</span>
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className={styles.desktopMenu}>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className={styles.themeToggle}
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun size={20} color="#facc15" /> : <Moon size={20} />}
                        </button>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link href="/login" className={styles.ctaButton}>
                                Portal Colaboradores
                            </Link>
                            <Link href="/candidatos" className={styles.ctaButton} style={{ background: 'var(--color-primary, #2563eb)' }}>
                                Candidatos
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className={styles.mobileMenuBtn}>
                        <button
                            onClick={toggleTheme}
                            className={styles.themeToggle}
                        >
                            {theme === 'dark' ? <Sun size={20} color="#facc15" /> : <Moon size={20} />}
                        </button>
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={styles.themeToggle}>
                            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown */}
                {mobileMenuOpen && (
                    <div className={styles.mobileDropdown}>
                        <Link href="/login" className={styles.mobileNavLink} style={{ color: '#2563eb' }}>
                            Portal Colaboradores
                        </Link>
                        <Link href="/candidatos" className={styles.mobileNavLink} style={{ color: '#2563eb' }}>
                            Portal Candidatos
                        </Link>
                    </div>
                )}
            </nav>

            {/* --- Hero Section --- */}
            <section id="home" className={styles.heroSection}>
                {/* Background Elements */}
                <div className={`${styles.blob} ${styles.blobBlue}`}></div>
                <div className={`${styles.blob} ${styles.blobRed}`}></div>

                <div className={styles.heroContent}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <div className={styles.badge}>
                                <span className={styles.pulseDot}></span>
                                Innovación Industrial
                            </div>

                            <h1 className={styles.heroTitle}>
                                Excelencia en <br />
                                <span className={styles.gradientText}>
                                    Inyección de Plásticos
                                </span>
                            </h1>

                            <p className={styles.heroSubtitle}>
                                Transformamos plásticos de ingeniería con precisión milimétrica desde 1970. Soluciones integrales para la industria nacional e internacional.
                            </p>
                        </div>

                        <div className={styles.heroButtons}>
                            <a href="#services" className={styles.primaryBtn}>
                                Nuestros Servicios <ChevronRight size={18} />
                            </a>
                        </div>
                    </div>

                    <div>
                        {/* Abstract 3D-like representation */}
                        <div className={styles.visualContainer}>
                            {/* Floating Cards */}
                            <div className={`${styles.floatingCard} ${styles.cardTop}`}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                    <div style={{ padding: '0.5rem', background: '#ef4444', borderRadius: '0.5rem', color: 'white' }}><Zap size={20} /></div>
                                    <div style={{ height: '0.5rem', width: '6rem', background: 'var(--border-color)', borderRadius: '9999px' }}></div>
                                </div>
                                <div style={{ height: '0.5rem', width: '100%', background: 'var(--border-color)', borderRadius: '9999px', marginBottom: '0.5rem' }}></div>
                                <div style={{ height: '0.5rem', width: '66%', background: 'var(--border-color)', borderRadius: '9999px' }}></div>
                            </div>

                            <div className={`${styles.floatingCard} ${styles.cardBottom}`}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold' }}>Calidad Certificada</span>
                                    <span style={{ fontSize: '1.5rem', fontFamily: 'monospace' }}>100%</span>
                                </div>
                            </div>

                            <Factory size={150} color="var(--text-tertiary)" style={{ opacity: 0.1 }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Services Section --- */}
            <section id="services" className={`${styles.section} ${styles.bgAlt}`}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Nuestros Servicios</h2>
                        <p className={styles.sectionDesc}>Soluciones integrales de manufactura</p>
                    </div>

                    <div className={styles.grid4}>
                        <ServiceCard
                            icon={<Factory />}
                            title="Maquila de Inyección"
                            desc="Producción de alto volumen con maquinaria de última generación."
                        />
                        <ServiceCard
                            icon={<PenTool />}
                            title="Decorado y Tampografía"
                            desc="Acabados estéticos y funcionales de alta precisión."
                        />
                        <ServiceCard
                            icon={<Layers />}
                            title="Sub-ensambles"
                            desc="Integración de componentes para entregar productos semiterminados."
                        />
                        <ServiceCard
                            icon={<Wrench />}
                            title="Moldes"
                            desc="Diseño, fabricación y mantenimiento preventivo de moldes."
                        />
                    </div>
                </div>
            </section>

            {/* --- About / Company Section --- */}
            <section id="about" className={styles.section}>
                <div className={`${styles.container} ${styles.gridSplit}`}>
                    <div style={{ order: 2 }}>
                        <div className={styles.aboutImage}>
                            <div className={styles.aboutOverlay}></div>
                            <div className={styles.aboutStats}>
                                <span className={styles.bigStat}>1970</span>
                                <span className={styles.statLabel}>Fundación</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', order: 1 }}>
                        <div>
                            <h2 className={styles.sectionTitle}>La Empresa</h2>
                            <div className={styles.divider}></div>
                        </div>
                        <p style={{ fontSize: '1.125rem', lineHeight: 1.6 }}>
                            <span style={{ color: '#2563eb', fontWeight: 600 }}>Viñoplastic</span> es una empresa fundada en 1970, dedicada a la transformación de plásticos por el proceso de inyección.
                        </p>
                        <p className={styles.sectionDesc}>
                            Satisfacemos las necesidades de la industria nacional e internacional con estándares de calidad rigurosos. Nuestra trayectoria nos permite abordar proyectos complejos con la seguridad de la experiencia.
                        </p>
                    </div>
                </div>
            </section>

            {/* --- Machinery & Capabilities --- */}
            <section id="machinery" className={styles.darkSection}>
                <div className={styles.darkBg}></div>

                <div className={styles.container} style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem' }}>
                        <h2 className={styles.sectionTitle} style={{ marginBottom: '0.5rem' }}>Maquinaria y Equipo</h2>
                        <p style={{ color: '#94a3b8' }}>Tecnología auxiliar para procesos perfectos</p>
                    </div>

                    <div className={styles.machineryGrid}>
                        {['Secadores', 'Cargadores', 'Montacargas', 'Termoreguladores', 'Enfriadores', 'Controladores de colada'].map((item, idx) => (
                            <div key={idx} className={styles.machineryCard}>
                                <Cog className={styles.gearIcon} />
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#e2e8f0' }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- Products / Industries --- */}
            <section id="products" className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Industrias y Productos</h2>
                        <p className={styles.sectionDesc}>
                            Nuestra versatilidad nos permite servir a sectores clave con precisión.
                        </p>
                    </div>

                    <div className={styles.grid4} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                        <IndustryCard title="Automotriz" icon={<Truck />} items={['Piezas interiores', 'Componentes de motor', 'Clips y sujeciones']} />
                        <IndustryCard title="Electrodomésticos" icon={<Zap />} items={['Carcasas', 'Botones', 'Mecanismos internos']} />
                        <IndustryCard title="Electrónica" icon={<Cpu />} items={['Conectores', 'Aislantes', 'Soportes de PCB']} />
                    </div>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className={styles.footer}>
                <div className={styles.container}>
                    <div className={styles.footerGrid}>
                        <div>
                            <div className={styles.logo} style={{ marginBottom: '1.5rem' }}>
                                <span>
                                    Viño<span className={styles.logoHighlight}>plastic</span>
                                </span>
                            </div>
                            <p className={styles.sectionDesc} style={{ maxWidth: '20rem' }}>
                                Excelencia en inyección de plásticos de ingeniería. Transformando ideas en productos tangibles desde 1970.
                            </p>
                        </div>


                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <p>&copy; {new Date().getFullYear()} Viñoplastic. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// --- Subcomponents ---

const ServiceCard = ({ icon, title, desc }) => (
    <div className={styles.serviceCard}>
        <div className={styles.serviceIcon}>
            {React.cloneElement(icon, { size: 28 })}
        </div>
        <h3 className={styles.serviceTitle}>{title}</h3>
        <p className={styles.serviceDesc}>{desc}</p>
        <div style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '1rem' }}>
            Ver detalle <ChevronRight size={14} />
        </div>
    </div>
);

const IndustryCard = ({ title, icon, items }) => (
    <div className={styles.serviceCard} style={{ overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, padding: '1rem', opacity: 0.05, transform: 'scale(1.5)' }}>
            {React.cloneElement(icon, { size: 100 })}
        </div>

        <div style={{ position: 'relative', zIndex: 10 }}>
            <div className={styles.serviceIcon} style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem' }}>
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <h3 className={styles.serviceTitle}>{title}</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {items.map((item, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        <div style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', background: '#ef4444' }}></div>
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    </div>
);
