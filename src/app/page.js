'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import styles from './page.module.css';

export default function LandingPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // If already logged in, redirect to dashboard
        if (!loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

    // Generate particles for background
    const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        size: Math.random() * 4 + 2,
        posX: Math.random() * 100,
        posY: Math.random() * 100,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.5 + 0.1,
        color: Math.random() > 0.5 ? '#3b82f6' : '#8b5cf6'
    }));

    if (!mounted) return null;

    return (
        <div className={styles.container}>
            {/* Floating Pill Navbar */}
            <nav className={styles.navbar}>
                <div className={styles.navPill}>
                    {/* Logo */}
                    <div className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <span className={styles.logoText}>Vertx</span>
                    </div>

                    {/* Nav Links */}
                    <div className={styles.navLinks}>
                        <Link href="/roadmap" className={styles.navLink}>Roadmap</Link>
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

            {/* Hero Section */}
            <main className={styles.hero} id="main-content">
                {/* Background Elements */}
                <div className={styles.bgMesh}></div>
                <div className={styles.gridBg}></div>

                {/* Particles */}
                <div className={styles.particlesContainer}>
                    {particles.map(p => (
                        <div
                            key={p.id}
                            className={styles.particle}
                            style={{
                                width: p.size,
                                height: p.size,
                                left: `${p.posX}%`,
                                top: `${p.posY}%`,
                                backgroundColor: p.color,
                                opacity: p.opacity,
                                animationDuration: `${p.duration}s`,
                                animationDelay: `-${p.delay}s`
                            }}
                        />
                    ))}
                </div>

                <div className={styles.heroContent}>
                    {/* Left Column */}
                    <div className={styles.heroText}>
                        {/* Badge */}
                        <div className={styles.badge}>
                            <span className={styles.badgeDot}>
                                <span className={styles.badgePing}></span>
                                <span className={styles.badgeCore}></span>
                            </span>
                            <span>Plataforma Integral de Capacitación v2.0</span>
                        </div>

                        {/* Headline */}
                        <h1 className={styles.headline}>
                            El fin de los <br />
                            <span className={styles.strikethrough}>Excel</span> dispersos.
                            <br />
                            <span className={styles.gradient}>Control Total.</span>
                        </h1>

                        {/* Subheadline */}
                        <p className={styles.subheadline}>
                            Objetivo: Asegurar el cumplimiento{' '}
                            <span className={styles.highlight}>ISO/IATF</span>, gestiona vencimientos y
                            promueve talento basado en datos reales, no en papeles.
                        </p>

                        {/* Features */}
                        <ul className={styles.features}>
                            <li>
                                <span className={styles.checkIcon}>✓</span>
                                Matriz de habilidades automatizada por puesto.
                            </li>
                            <li>
                                <span className={styles.checkIcon}>✓</span>
                                Alertas de vencimiento de certificaciones.
                            </li>
                            <li>
                                <span className={styles.checkIcon}>✓</span>
                                Expediente digital único por empleado.
                            </li>
                        </ul>

                        {/* CTAs */}
                        <div className={styles.ctaGroup}>
                            <Link href="/login" className={styles.ctaPrimary}>
                                Empezar Ahora
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <Link href="/roadmap" className={styles.ctaSecondary}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                    <line x1="12" y1="22.08" x2="12" y2="12" />
                                </svg>
                                Ver Roadmap
                            </Link>
                        </div>
                    </div>

                    {/* Right Column - Dashboard Mockup */}
                    <div className={styles.heroVisual}>
                        <div className={styles.dashboardCard}>
                            {/* Window Header */}
                            <div className={styles.windowHeader}>
                                <div className={styles.windowDots}>
                                    <span className={styles.dotRed}></span>
                                    <span className={styles.dotYellow}></span>
                                    <span className={styles.dotGreen}></span>
                                </div>
                                <div className={styles.windowUrl}></div>
                            </div>

                            {/* Dashboard Content */}
                            <div className={styles.dashboardContent}>
                                {/* Sidebar */}
                                <div className={styles.sidebar}>
                                    <div className={`${styles.sidebarIcon} ${styles.active}`}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="3" width="7" height="7" />
                                            <rect x="14" y="3" width="7" height="7" />
                                            <rect x="14" y="14" width="7" height="7" />
                                            <rect x="3" y="14" width="7" height="7" />
                                        </svg>
                                    </div>
                                    <div className={styles.sidebarIcon}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                        </svg>
                                    </div>
                                    <div className={styles.sidebarIcon}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <path d="M9 15l2 2 4-4" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Main Area */}
                                <div className={styles.mainArea}>
                                    {/* Header */}
                                    <div className={styles.dashHeader}>
                                        <div>
                                            <div className={styles.skeletonTitle}></div>
                                            <div className={styles.skeletonSubtitle}></div>
                                        </div>
                                        <div className={styles.plantBadge}>Planta A - Turno 2</div>
                                    </div>

                                    {/* Widgets */}
                                    <div className={styles.widgetsGrid}>
                                        {/* Widget 1 */}
                                        <div className={styles.widget}>
                                            <div className={styles.widgetHeader}>
                                                <span>Cumplimiento Global</span>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                                                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                                                    <polyline points="17 6 23 6 23 12" />
                                                </svg>
                                            </div>
                                            <div className={styles.widgetValue}>
                                                <span className={styles.bigNumber}>87%</span>
                                                <span className={styles.change}>+2.4% vs mes anterior</span>
                                            </div>
                                            <div className={styles.progressBar}>
                                                <div className={styles.progressFill} style={{ width: '87%' }}></div>
                                            </div>
                                        </div>

                                        {/* Widget 2 */}
                                        <div className={styles.widget}>
                                            <div className={styles.widgetHeader}>
                                                <span>Certificaciones por Vencer</span>
                                                <span className={styles.alertDot}></span>
                                            </div>
                                            <div className={styles.alertList}>
                                                <div className={styles.alertItem}>
                                                    <span className={styles.alertIcon}>⚠</span>
                                                    <div className={styles.alertSkeleton}></div>
                                                    <span className={styles.alertTime}>2d</span>
                                                </div>
                                                <div className={styles.alertItemYellow}>
                                                    <span className={styles.clockIcon}>⏱</span>
                                                    <div className={styles.alertSkeleton}></div>
                                                    <span className={styles.alertTimeYellow}>14d</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table Mockup */}
                                    <div className={styles.tableMockup}>
                                        <div className={styles.tableHeader}>
                                            <div className={styles.thSkeleton}></div>
                                            <div className={styles.thSkeleton}></div>
                                            <div className={styles.thSkeleton}></div>
                                        </div>
                                        <div className={styles.tableRows}>
                                            <div className={styles.tableRow}>
                                                <div className={styles.avatar}></div>
                                                <div className={styles.nameSkeleton}></div>
                                                <div className={`${styles.statusBadge} ${styles.blue}`}></div>
                                            </div>
                                            <div className={`${styles.tableRow} ${styles.faded}`}>
                                                <div className={styles.avatar}></div>
                                                <div className={styles.nameSkeleton}></div>
                                                <div className={`${styles.statusBadge} ${styles.green}`}></div>
                                            </div>
                                            <div className={`${styles.tableRow} ${styles.moreFaded}`}>
                                                <div className={styles.avatar}></div>
                                                <div className={styles.nameSkeleton}></div>
                                                <div className={`${styles.statusBadge} ${styles.purple}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Card - Promotion */}
                        <div className={`${styles.floatingCard} ${styles.floatRight}`}>
                            <div className={styles.floatingHeader}>
                                <div className={styles.floatingIcon}>🏆</div>
                                <div>
                                    <p className={styles.floatingLabel}>PROMOCIÓN</p>
                                    <p className={styles.floatingTitle}>Listo para ascender</p>
                                </div>
                            </div>
                            <div className={styles.floatingUser}>
                                <div className={styles.userAvatar}></div>
                                <span>Juan P.</span>
                                <span className={styles.checkGreen}>✓</span>
                            </div>
                        </div>

                        {/* Floating Card - Notification */}
                        <div className={`${styles.floatingCard} ${styles.floatLeft}`}>
                            <div className={styles.notifIcon}>
                                🔔
                                <span className={styles.notifDot}></span>
                            </div>
                            <div>
                                <p className={styles.notifTitle}>Inyección Nvl 2</p>
                                <p className={styles.notifDesc}>Vence en 5 días (3 ops)</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
