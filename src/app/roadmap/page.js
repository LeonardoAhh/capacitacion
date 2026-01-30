'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Roadmap data updated 2026
const roadmapItems = [
    // --- COMPLETADO ---
    {
        id: 101,
        category: 'Core',
        title: 'Sistema ILUO Digital',
        description: 'Digitalización completa de la matriz de habilidades con evaluación de 4 niveles (I, L, U, O).',
        status: 'completed',
        icon: '🚀'
    },
    {
        id: 102,
        category: 'Estrategia',
        title: 'Gestión por Clientes (Clusters)',
        description: 'Capacidad de agrupar competencias por Cliente (VW, Nissan) para cumplimiento específico de auditorías.',
        status: 'completed',
        icon: '🌐'
    },
    // --- EN PROCESO ---
    {
        id: 3,
        category: 'Reportes',
        title: 'Exportación a PDF Profesional',
        description: 'Generación de reportes en PDF con diseño corporativo, gráficas de araña y firma digital.',
        status: 'in-progress',
        icon: '📄'
    },
    {
        id: 7,
        category: 'Evaluaciones',
        title: 'Exámenes con Banco de Preguntas',
        description: 'Sistema de evaluación teórica con calificación automática y randomización de preguntas.',
        status: 'in-progress',
        icon: '📝'
    },
    // --- FUTURO ---
    {
        id: 5,
        category: 'Inteligencia Artificial',
        title: 'IA Predictiva de Talento',
        description: 'Algoritmo que predice vacíos de habilidades 3 meses antes basándose en rotación y desempeño.',
        status: 'research',
        icon: '🧠'
    },
    {
        id: 12,
        category: 'Industria 4.0',
        title: 'Candado Digital IoT',
        description: 'Bloqueo físico de maquinaria si el operador logueado no tiene certificación "Nivel U" vigente.',
        status: 'research',
        icon: '🔒'
    },
    {
        id: 13,
        category: 'Cultura',
        title: 'Gamificación & Badges',
        description: 'Sistema de insignias (ej. "Experto BMW") y leaderboards para incentivar la polivalencia.',
        status: 'planned',
        icon: '🏆'
    },
    {
        id: 14,
        category: 'Compliance',
        title: 'Auditoría IATF Instantánea',
        description: 'Portal para auditores externos con acceso "solo lectura" a matrices y evidencias en tiempo real.',
        status: 'planned',
        icon: '📱'
    },
    {
        id: 1,
        category: 'Integración',
        title: 'Conexión SAP/SuccessFactors',
        description: 'Sincronización bidireccional de empleados y movimientos de puesto con el ERP corporativo.',
        status: 'planned',
        icon: '🔗'
    }
];

const statusLabels = {
    'completed': { label: 'Completado', color: '#32D74B' },
    'in-progress': { label: 'En Desarrollo', color: '#007AFF' },
    'planned': { label: 'Planeado', color: '#FF9F0A' },
    'research': { label: 'Investigación 4.0', color: '#BF5AF2' }
};

export default function RoadmapPage() {
    const [selectedStatus, setSelectedStatus] = useState('Todos');

    const filteredItems = roadmapItems.filter(item => {
        return selectedStatus === 'Todos' || item.status === selectedStatus;
    });

    const stats = {
        total: roadmapItems.length,
        completed: roadmapItems.filter(i => i.status === 'completed').length,
        inProgress: roadmapItems.filter(i => i.status === 'in-progress').length,
        planned: roadmapItems.filter(i => i.status === 'planned').length,
        research: roadmapItems.filter(i => i.status === 'research').length
    };

    return (
        <div className={styles.container}>
            {/* Floating Pill Navbar */}
            <nav className={styles.navbar}>
                <div className={styles.navPill}>
                    {/* Logo */}
                    <Link href="/" className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className={styles.logoText}>Vertx</span>
                    </Link>

                    {/* Nav Links */}
                    <div className={styles.navLinks}>
                        <Link href="/" className={styles.navLink}>Inicio</Link>
                    </div>

                    {/* Actions */}
                    <div className={styles.navActions}>
                        <Link href="/login" className={styles.loginBtn}>
                            Iniciar Sesión
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Background Effects */}
            <div className={styles.bgDecoration}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
            </div>

            <div className={styles.content}>
                {/* Hero Section */}
                <header className={styles.hero}>
                    <div className={styles.badge}>
                        <span>Roadmap de Innovación 2026</span>
                    </div>

                    <h1 className={styles.headline}>
                        El Futuro de la <span className={styles.gradient}>Capacitación</span>
                    </h1>
                    <p className={styles.subheadline}>
                        De la gestión digital (ILUO 2.0) a la Inteligencia Artificial y IoT.
                        Así estamos construyendo la Planta Inteligente.
                    </p>
                </header>

                {/* Stats */}
                <section className={styles.statsSection}>
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard} style={{ borderColor: '#32D74B' }}>
                            <span className={styles.statNumber} style={{ color: '#32D74B' }}>{stats.completed}</span>
                            <span className={styles.statLabel}>Entregados</span>
                        </div>
                        <div className={styles.statCard} style={{ borderColor: '#007AFF' }}>
                            <span className={styles.statNumber} style={{ color: '#007AFF' }}>{stats.inProgress}</span>
                            <span className={styles.statLabel}>En Desarrollo</span>
                        </div>
                        <div className={styles.statCard} style={{ borderColor: '#FF9F0A' }}>
                            <span className={styles.statNumber} style={{ color: '#FF9F0A' }}>{stats.planned}</span>
                            <span className={styles.statLabel}>Planeados</span>
                        </div>
                        <div className={styles.statCard} style={{ borderColor: '#BF5AF2' }}>
                            <span className={styles.statNumber} style={{ color: '#BF5AF2' }}>{stats.research}</span>
                            <span className={styles.statLabel}>Visión 4.0</span>
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
                                style={{
                                    animationDelay: `${index * 0.05}s`,
                                    borderColor: statusLabels[item.status].color + '30'
                                }}
                            >
                                <div className={styles.cardHeader}>
                                    <div className={styles.cardIcon}>{item.icon}</div>
                                    <span
                                        className={styles.statusBadge}
                                        style={{
                                            background: `${statusLabels[item.status].color}20`,
                                            color: statusLabels[item.status].color,
                                            border: `1px solid ${statusLabels[item.status].color}40`
                                        }}
                                    >
                                        {statusLabels[item.status].label}
                                    </span>
                                </div>

                                <span
                                    className={styles.cardCategory}
                                    style={{ color: statusLabels[item.status].color }}
                                >
                                    {item.category}
                                </span>

                                <h3 className={styles.cardTitle}>{item.title}</h3>
                                <p className={styles.cardDescription}>{item.description}</p>

                                <div className={styles.cardFooter}>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{
                                                width: item.status === 'completed' ? '100%' :
                                                    item.status === 'in-progress' ? '60%' :
                                                        item.status === 'planned' ? '20%' : '10%',
                                                background: statusLabels[item.status].color
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredItems.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            <p>No hay proyectos en esta categoría.</p>
                        </div>
                    )}
                </section>

                {/* Footer */}
                <footer style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    <p>© 2026 Vertx. Evolucionando hacia la Excelencia Operacional.</p>
                </footer>
            </div>
        </div >
    );
}
