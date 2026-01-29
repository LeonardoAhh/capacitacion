'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

// Roadmap data updated 2026
const roadmapItems = [
    // --- COMPLETADO (LO QUE YA HICIMOS) ---
    {
        id: 101,
        category: 'Core',
        title: 'Sistema ILUO Digital',
        description: 'Digitalización completa de la matriz de habilidades con evaluación de 4 niveles (I, L, U, O).',
        status: 'completed',
        priority: 'critical',
        effort: 'Alto',
        impact: 'Muy Alto',
        icon: '🚀'
    },
    {
        id: 102,
        category: 'Estrategia',
        title: 'Gestión por Clientes (Clusters)',
        description: 'Capacidad de agrupar competencias por Cliente (VW, Nissan) para cumplimiento específico de auditorías.',
        status: 'completed',
        priority: 'high',
        effort: 'Medio',
        impact: 'Alto',
        icon: '🌐'
    },

    // --- EN PROCESO / CORTO PLAZO ---
    {
        id: 3,
        category: 'Reportes',
        title: 'Exportación a PDF Profesional',
        description: 'Generación de reportes en PDF con diseño corporativo, gráficas de araña y firma digital.',
        status: 'in-progress',
        priority: 'medium',
        effort: 'Medio',
        impact: 'Alto',
        icon: '📄'
    },
    {
        id: 7,
        category: 'Evaluaciones',
        title: 'Exámenes con Banco de Preguntas',
        description: 'Sistema de evaluación teórica con calificación automática y randomización de preguntas.',
        status: 'in-progress',
        priority: 'high',
        effort: 'Medio',
        impact: 'Alto',
        icon: '📝'
    },

    // --- FUTURO (HORIZONTE 2026) ---
    {
        id: 5,
        category: 'Inteligencia Artificial',
        title: 'IA Predictiva de Talento',
        description: 'Algoritmo que predice vacíos de habilidades 3 meses antes basándose en rotación y desempeño.',
        status: 'research',
        priority: 'low',
        effort: 'Muy Alto',
        impact: 'Muy Alto',
        icon: '🧠'
    },
    {
        id: 12,
        category: 'Industria 4.0',
        title: 'Candado Digital IoT',
        description: 'Bloqueo físico de maquinaria si el operador logueado no tiene certificación "Nivel U" vigente.',
        status: 'research',
        priority: 'high',
        effort: 'Extremo',
        impact: 'Critico',
        icon: '🔒'
    },
    {
        id: 13,
        category: 'Cultura',
        title: 'Gamificación & Badges',
        description: 'Sistema de insignias (ej. "Experto BMW") y leaderboards para incentivar la polivalencia.',
        status: 'planned',
        priority: 'medium',
        effort: 'Medio',
        impact: 'Alto',
        icon: '🏆'
    },
    {
        id: 14,
        category: 'Compliance',
        title: 'Auditoría IATF Instantánea',
        description: 'Portal para auditores externos con acceso "solo lectura" a matrices y evidencias en tiempo real.',
        status: 'planned',
        priority: 'high',
        effort: 'Alto',
        impact: 'Muy Alto',
        icon: '📱'
    },
    {
        id: 1,
        category: 'Integración',
        title: 'Conexión SAP/SuccessFactors',
        description: 'Sincronización bidireccional de empleados y movimientos de puesto con el ERP corporativo.',
        status: 'planned',
        priority: 'high',
        effort: 'Alto',
        impact: 'Alto',
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
                        <span>Roadmap de Innovación 2026</span>
                    </div>

                    <h1 className={styles.headline}>
                        El Futuro de la <span className={styles.gradient}>Capacitación</span>
                    </h1>
                    <p className={styles.subheadline}>
                        De la gestión digital (ILUO 2.0) a la Inteligencia Artificial y IoT.
                        Así estamos construyendo la Planta Inteligente.
                    </p>
                </div>
            </header>

            {/* Stats */}
            <section className={styles.statsSection}>
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <span className={styles.statNumber} style={{ color: '#32D74B' }}>{stats.completed}</span>
                        <span className={styles.statLabel}>Entregados</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statNumber} style={{ color: '#007AFF' }}>{stats.inProgress}</span>
                        <span className={styles.statLabel}>En Desarrollo</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statNumber} style={{ color: '#FF9F0A' }}>{stats.planned}</span>
                        <span className={styles.statLabel}>Planeados</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statNumber} style={{ color: '#BF5AF2' }}>{stats.research}</span>
                        <span className={styles.statLabel}>Visión 4.0</span>
                    </div>
                </div>
            </section>

            {/* Filters */}
            <section className={styles.filtersSection}>
                <div className={styles.filterGroup}>
                    <label>Fases del Proyecto</label>
                    <div className={styles.filterTabs}>
                        <button
                            className={`${styles.filterTab} ${selectedStatus === 'Todos' ? styles.active : ''}`}
                            onClick={() => setSelectedStatus('Todos')}
                        >
                            Todo
                        </button>
                        <button
                            className={`${styles.filterTab} ${selectedStatus === 'completed' ? styles.active : ''}`}
                            onClick={() => setSelectedStatus('completed')}
                        >
                            ✅ Hecho
                        </button>
                        <button
                            className={`${styles.filterTab} ${selectedStatus === 'in-progress' ? styles.active : ''}`}
                            onClick={() => setSelectedStatus('in-progress')}
                        >
                            🔵 Desarrollo
                        </button>
                        <button
                            className={`${styles.filterTab} ${selectedStatus === 'research' ? styles.active : ''}`}
                            onClick={() => setSelectedStatus('research')}
                        >
                            🟣 Futuro 4.0
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
                            style={{ animationDelay: `${index * 0.05}s`, borderColor: item.status === 'completed' ? 'rgba(50, 215, 75, 0.3)' : '' }}
                        >
                            <div className={styles.cardHeader}>
                                <span className={styles.cardIcon}>{item.icon}</span>
                                <span
                                    className={styles.statusBadge}
                                    style={{
                                        background: `${statusLabels[item.status].color}15`,
                                        color: statusLabels[item.status].color,
                                        border: `1px solid ${statusLabels[item.status].color}30`
                                    }}
                                >
                                    {statusLabels[item.status].label}
                                </span>
                            </div>
                            <span className={styles.cardCategory} style={{ color: statusLabels[item.status].color }}>{item.category}</span>
                            <h3 className={styles.cardTitle}>{item.title}</h3>
                            <p className={styles.cardDescription}>{item.description}</p>
                        </div>
                    ))}
                </div>

                {filteredItems.length === 0 && (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🔍</span>
                        <h3>No hay ítems en esta fase</h3>
                    </div>
                )}
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <p>© 2026 Vertx. Evolucionando hacia la Excelencia Operacional.</p>
            </footer>
        </div>
    );
}
