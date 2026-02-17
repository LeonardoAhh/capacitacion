'use client';

import Link from 'next/link';
import {
    Users, GraduationCap, BarChart3, Calendar, Shield, Smartphone,
    Palette, Zap, FileText, Award, Clock, CheckCircle, ArrowLeft,
    TrendingUp, UserCheck, Layers, Bell
} from 'lucide-react';
import styles from './page.module.css';

const features = [
    {
        icon: Users,
        title: 'Gestión de Empleados',
        description: 'Administra perfiles, documentos y datos laborales con importación masiva desde Excel.'
    },
    {
        icon: GraduationCap,
        title: 'Capacitación Continua',
        description: 'Registra y da seguimiento a cursos, certificaciones y planes de formación.'
    },
    {
        icon: BarChart3,
        title: 'Reportes en Tiempo Real',
        description: 'Visualiza métricas de cumplimiento con gráficos interactivos por departamento.'
    },
    {
        icon: Calendar,
        title: 'Calendario Inteligente',
        description: 'Programa evaluaciones y recibe alertas automáticas de fechas próximas.'
    },
    {
        icon: Shield,
        title: 'Seguridad Avanzada',
        description: 'Rate limiting, protección CSRF y sanitización de datos integrados.'
    },
    {
        icon: Smartphone,
        title: 'PWA Instalable',
        description: 'Funciona offline como app nativa en cualquier dispositivo.'
    },
    {
        icon: Palette,
        title: 'Temas Personalizables',
        description: '8 temas visuales para adaptar la interfaz a tu preferencia.'
    },
    {
        icon: Zap,
        title: 'Alto Rendimiento',
        description: 'Paginación server-side, lazy loading y cache inteligente.'
    },
    {
        icon: FileText,
        title: 'Matriz de Habilidades',
        description: 'Visualiza competencias por puesto y detecta brechas de capacitación.'
    }
];

const benefits = [
    {
        title: 'Cumplimiento Normativo',
        text: 'Asegura el seguimiento de capacitaciones obligatorias y evaluaciones.'
    },
    {
        title: 'Reducción de Tiempo',
        text: 'Automatiza notificaciones y recordatorios de contratos y evaluaciones.'
    },
    {
        title: 'Decisiones Informadas',
        text: 'Datos precisos para identificar áreas de mejora y promociones.'
    },
    {
        title: 'Acceso Universal',
        text: 'Disponible desde cualquier dispositivo, online u offline.'
    }
];

export default function FeaturesPage() {
    return (
        <div className={styles.page}>
            <Link href="/" className={styles.backLink}>
                <ArrowLeft size={16} />
                Inicio
            </Link>

            <div className={styles.container}>
                <section className={styles.hero}>
                    <span className={styles.portal}>Plataforma de Capacitación</span>
                    <h1 className={styles.title}>Todo lo que necesitas para gestionar talento</h1>
                    <p className={styles.subtitle}>
                        Herramientas modernas para RRHH: empleados, capacitación, reportes y más en un solo lugar.
                    </p>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Características Principales</h2>
                        <p className={styles.sectionSubtitle}>Funcionalidades diseñadas para optimizar la gestión de talento humano</p>
                    </div>
                    <div className={styles.featuresGrid}>
                        {features.map((feature, index) => (
                            <div key={index} className={styles.featureCard}>
                                <div className={styles.featureIcon}>
                                    <feature.icon size={24} />
                                </div>
                                <h3 className={styles.featureTitle}>{feature.title}</h3>
                                <p className={styles.featureDescription}>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.statsSection}>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>3</span>
                        <span className={styles.statLabel}>Módulos Principales</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>8</span>
                        <span className={styles.statLabel}>Temas Visuales</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>2</span>
                        <span className={styles.statLabel}>Roles de Usuario</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statValue}>100%</span>
                        <span className={styles.statLabel}>Responsive</span>
                    </div>
                </section>

                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Beneficios</h2>
                        <p className={styles.sectionSubtitle}>¿Por qué elegir nuestra plataforma?</p>
                    </div>
                    <div className={styles.benefitsGrid}>
                        {benefits.map((benefit, index) => (
                            <div key={index} className={styles.benefitItem}>
                                <div className={styles.benefitIcon}>
                                    <CheckCircle size={18} />
                                </div>
                                <div className={styles.benefitContent}>
                                    <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                                    <p className={styles.benefitText}>{benefit.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>


            </div>
        </div>
    );
}
