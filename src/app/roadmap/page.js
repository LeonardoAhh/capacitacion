'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Roadmap data
const roadmapItems = [
    {
        id: 1,
        category: 'Integración',
        title: 'Conexión con SAP/ERP',
        description: 'Sincronización automática de datos de empleados, puestos y departamentos desde sistemas empresariales.',
        status: 'planned',
        priority: 'high',
        effort: 'Alto',
        impact: 'Alto',
        icon: '🔗'
    },
    {
        id: 2,
        category: 'Automatización',
        title: 'Notificaciones por Email/SMS',
        description: 'Alertas automáticas de vencimientos, recordatorios de evaluaciones y notificaciones de promociones.',
        status: 'planned',
        priority: 'high',
        effort: 'Medio',
        impact: 'Alto',
        icon: '📧'
    },
    {
        id: 3,
        category: 'Reportes',
        title: 'Exportación a PDF Profesional',
        description: 'Generación de reportes en PDF con diseño corporativo, gráficas y firma digital.',
        status: 'in-progress',
        priority: 'medium',
        effort: 'Medio',
        impact: 'Alto',
        icon: '📄'
    },
    {
        id: 4,
        category: 'Móvil',
        title: 'Aplicación Móvil Nativa',
        description: 'App para iOS y Android que permita consultar información, aprobar capacitaciones y recibir alertas.',
        status: 'planned',
        priority: 'medium',
        effort: 'Alto',
        impact: 'Alto',
        icon: '📱'
    },
    {
        id: 5,
        category: 'IA',
        title: 'Análisis Predictivo con IA',
        description: 'Predicción de necesidades de capacitación, detección de brechas y recomendaciones automáticas.',
        status: 'research',
        priority: 'low',
        effort: 'Alto',
        impact: 'Muy Alto',
        icon: '🤖'
    },
    {
        id: 6,
        category: 'E-Learning',
        title: 'Plataforma de Cursos Online',
        description: 'Módulo integrado para crear, asignar y dar seguimiento a cursos de capacitación en línea.',
        status: 'planned',
        priority: 'high',
        effort: 'Alto',
        impact: 'Muy Alto',
        icon: '🎓'
    },
    {
        id: 7,
        category: 'Evaluaciones',
        title: 'Exámenes en Línea',
        description: 'Sistema de evaluación digital con banco de preguntas, tiempo límite y calificación automática.',
        status: 'in-progress',
        priority: 'high',
        effort: 'Medio',
        impact: 'Alto',
        icon: '✅'
    },
    {
        id: 8,
        category: 'Seguridad',
        title: 'Autenticación SSO/LDAP',
        description: 'Inicio de sesión único integrado con Active Directory o proveedores de identidad corporativos.',
        status: 'planned',
        priority: 'medium',
        effort: 'Medio',
        impact: 'Medio',
        icon: '🔐'
    },
    {
        id: 9,
        category: 'Gestión',
        title: 'Gestión de Proveedores de Capacitación',
        description: 'Registro de instructores externos, control de costos y evaluación de calidad de servicios.',
        status: 'research',
        priority: 'low',
        effort: 'Bajo',
        impact: 'Medio',
        icon: '👥'
    },
    {
        id: 10,
        category: 'Documentos',
        title: 'Almacenamiento en la Nube',
        description: 'Integración con OneDrive/Google Drive para guardar certificados, diplomas y evidencias.',
        status: 'planned',
        priority: 'medium',
        effort: 'Medio',
        impact: 'Alto',
        icon: '☁️'
    },
    {
        id: 11,
        category: 'Reportes',
        title: 'Dashboard Ejecutivo',
        description: 'Panel de control para directivos con KPIs, comparativas entre plantas y tendencias.',
        status: 'planned',
        priority: 'high',
        effort: 'Medio',
        impact: 'Alto',
        icon: '📊'
    },
    {
        id: 12,
        category: 'Compliance',
        title: 'Auditoría y Trazabilidad',
        description: 'Registro completo de cambios, versiones de documentos y evidencia para auditorías ISO/IATF.',
        status: 'research',
        priority: 'high',
        effort: 'Alto',
        impact: 'Muy Alto',
        icon: '📋'
    }
];

const statusLabels = {
    'in-progress': { label: 'En Desarrollo', color: '#007AFF' },
    'planned': { label: 'Planeado', color: '#FF9F0A' },
    'research': { label: 'Investigación', color: '#5856D6' }
};

export default function RoadmapPage() {
    const [selectedStatus, setSelectedStatus] = useState('Todos');

    const filteredItems = roadmapItems.filter(item => {
        return selectedStatus === 'Todos' || item.status === selectedStatus;
    });

    const stats = {
        total: roadmapItems.length,
        inProgress: roadmapItems.filter(i => i.status === 'in-progress').length,
        planned: roadmapItems.filter(i => i.status === 'planned').length,
        research: roadmapItems.filter(i => i.status === 'research').length
    };

    return (
        <div className={styles.container}>
            {/* Navbar */}
            <nav className={styles.navbar}>
                <div className={styles.navContent}>
                    <Link href="/" className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className={styles.logoText}>Vertx</span>
                    </Link>
                    <Link href="/login" className={styles.loginLink}>
                        Iniciar Sesión
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <header className={styles.hero}>
                <div className={styles.bgMesh}></div>

                {/* Back button - top left */}
                <div className={styles.heroNav}>
                    <Link href="/" className={styles.backBtn}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Volver al Inicio
                    </Link>
                </div>

                <div className={styles.heroContent}>
                    <div className={styles.badge}>
                        <span className={styles.badgeDot}>
                            <span className={styles.badgePing}></span>
                            <span className={styles.badgeCore}></span>
                        </span>
                        <span>Roadmap de Desarrollo</span>
                    </div>

                    <h1 className={styles.headline}>
                        Mejoras <span className={styles.gradient}>Futuras</span>
                    </h1>
                    <p className={styles.subheadline}>
                        Explora las funcionalidades que estamos desarrollando para hacer de Vertx
                        la plataforma de capacitación más completa del mercado.
                    </p>
                </div>
            </header>

            {/* Stats */}
            <section className={styles.statsSection}>
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statNumber}>{stats.total}</span>
                        <span className={styles.statLabel}>Mejoras Totales</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statNumber} style={{ color: '#007AFF' }}>{stats.inProgress}</span>
                        <span className={styles.statLabel}>En Desarrollo</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statNumber} style={{ color: '#FF9F0A' }}>{stats.planned}</span>
                        <span className={styles.statLabel}>Planeadas</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statNumber} style={{ color: '#5856D6' }}>{stats.research}</span>
                        <span className={styles.statLabel}>En Investigación</span>
                    </div>
                </div>
            </section>

            {/* Filters */}
            <section className={styles.filtersSection}>
                <div className={styles.filterGroup}>
                    <label>Filtrar por estado</label>
                    <div className={styles.filterTabs}>
                        <button
                            className={`${styles.filterTab} ${selectedStatus === 'Todos' ? styles.active : ''}`}
                            onClick={() => setSelectedStatus('Todos')}
                        >
                            Todos
                        </button>
                        <button
                            className={`${styles.filterTab} ${selectedStatus === 'in-progress' ? styles.active : ''}`}
                            onClick={() => setSelectedStatus('in-progress')}
                        >
                            🔵 En Desarrollo
                        </button>
                        <button
                            className={`${styles.filterTab} ${selectedStatus === 'planned' ? styles.active : ''}`}
                            onClick={() => setSelectedStatus('planned')}
                        >
                            🟠 Planeado
                        </button>
                        <button
                            className={`${styles.filterTab} ${selectedStatus === 'research' ? styles.active : ''}`}
                            onClick={() => setSelectedStatus('research')}
                        >
                            🟣 Investigación
                        </button>
                    </div>
                </div>
            </section>

            {/* Roadmap Grid */}
            <section className={styles.roadmapSection}>
                <div className={styles.roadmapGrid}>
                    {filteredItems.map((item, index) => (
                        <div
                            key={item.id}
                            className={styles.roadmapCard}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <div className={styles.cardHeader}>
                                <span className={styles.cardIcon}>{item.icon}</span>
                                <span
                                    className={styles.statusBadge}
                                    style={{
                                        background: `${statusLabels[item.status].color}15`,
                                        color: statusLabels[item.status].color
                                    }}
                                >
                                    {statusLabels[item.status].label}
                                </span>
                            </div>
                            <span className={styles.cardCategory}>{item.category}</span>
                            <h3 className={styles.cardTitle}>{item.title}</h3>
                            <p className={styles.cardDescription}>{item.description}</p>
                        </div>
                    ))}
                </div>

                {filteredItems.length === 0 && (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🔍</span>
                        <h3>No hay mejoras con estos filtros</h3>
                        <p>Intenta con otra combinación de categoría y estado.</p>
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <p>© 2026 Vertx. Plataforma Integral de Capacitación.</p>
            </footer>
        </div>
    );
}
