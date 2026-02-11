"use client";

import {
    Users,
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    Calendar,
    ArrowUpRight,
    TrendingUp,
    Award,
    GitCompareArrows,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from './DashboardBentoGrid.module.css';
import EmployeeDrawer from './EmployeeDrawer';

const CounterAnimation = ({ start, end, duration = 2000 }) => {
    const [count, setCount] = useState(start);

    useEffect(() => {
        const frameRate = 1000 / 60;
        const totalFrames = Math.round(duration / frameRate);
        let currentFrame = 0;

        const counter = setInterval(() => {
            currentFrame++;
            const progress = currentFrame / totalFrames;
            const easedProgress = 1 - (1 - progress) ** 3;
            const current = start + (end - start) * easedProgress;

            setCount(Math.min(current, end));

            if (currentFrame === totalFrames) {
                clearInterval(counter);
            }
        }, frameRate);

        return () => clearInterval(counter);
    }, [start, end, duration]);

    return Math.round(count);
};

export default function DashboardBentoGrid({ stats, evaluations }) {
    return (
        <div className={styles.dashboard}>
            {/* Hero Stats Row */}
            <div className={styles.heroRow}>
                {/* Large Feature Card */}
                <motion.div
                    className={styles.featureCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className={styles.featureContent}>
                        <div className={styles.featureBadge}>
                            <Award className={styles.badgeIcon} />
                            <span>Sistema Vertx</span>
                        </div>
                        <h2 className={styles.featureTitle}>
                            Gestión de Capacitación
                        </h2>
                        <p className={styles.featureDescription}>
                            Plataforma completa para administrar empleados, contratos, capacitación y evaluaciones con tecnología moderna.
                        </p>
                        <div className={styles.featureStats}>
                            <div className={styles.featureStat}>
                                <Users className={styles.featureStatIcon} />
                                <div className={styles.featureStatText}>
                                    <div className={styles.featureStatValue}>
                                        <CounterAnimation start={0} end={stats?.totalEmployees || 0} />
                                    </div>
                                    <div className={styles.featureStatLabel}>Empleados</div>
                                </div>
                            </div>
                            <div className={styles.featureStat}>
                                <FileText className={styles.featureStatIcon} />
                                <div className={styles.featureStatText}>
                                    <div className={styles.featureStatValue}>
                                        <CounterAnimation start={0} end={stats?.activeContracts || 0} />
                                    </div>
                                    <div className={styles.featureStatLabel}>Contratos</div>
                                </div>
                            </div>
                            <div className={styles.featureStat}>
                                <TrendingUp className={styles.featureStatIcon} />
                                <div className={styles.featureStatText}>
                                    <div className={styles.featureStatValue}>+30%</div>
                                    <div className={styles.featureStatLabel}>Objetivo Cumplimiento</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.featureGradient}></div>
                </motion.div>

                {/* Quick Stats Cards */}
                <div className={styles.quickStats}>
                    <Link href="/employees" className={styles.statCard}>
                        <motion.div
                            className={styles.statCardInner}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            whileHover={{ y: -4 }}
                        >
                            <div className={`${styles.statIconWrapper} ${styles.statIconBlue}`}>
                                <Users className={styles.statIcon} />
                            </div>
                            <div className={styles.statContent}>
                                <div className={styles.statLabel}>Empleados Activos</div>
                                <div className={styles.statValue}>
                                    <CounterAnimation start={0} end={stats?.totalEmployees || 0} />
                                </div>
                                <div className={styles.statChange}>
                                    <TrendingUp className={styles.statChangeIcon} />
                                    <span>Ver detalles</span>
                                </div>
                            </div>
                            <ArrowUpRight className={styles.statArrow} />
                        </motion.div>
                    </Link>

                    <Link href="/employees" className={styles.statCard}>
                        <motion.div
                            className={styles.statCardInner}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            whileHover={{ y: -4 }}
                        >
                            <div className={`${styles.statIconWrapper} ${styles.statIconGreen}`}>
                                <CheckCircle2 className={styles.statIcon} />
                            </div>
                            <div className={styles.statContent}>
                                <div className={styles.statLabel}>Contratos Vigentes</div>
                                <div className={styles.statValue}>
                                    <CounterAnimation start={0} end={stats?.activeContracts || 0} />
                                </div>
                                <div className={styles.statChange}>
                                    <span className={styles.statChangePositive}>Todos al día</span>
                                </div>
                            </div>
                            <ArrowUpRight className={styles.statArrow} />
                        </motion.div>
                    </Link>
                </div>
            </div>

            {/* Alerts & Actions Row */}
            <div className={styles.alertsRow}>
                {/* Expiring Contracts */}
                {stats?.expiringContracts > 0 && (
                    <EmployeeDrawer
                        title="Contratos por Vencer"
                        description={`${stats.expiringContracts} empleado${stats.expiringContracts > 1 ? 's tienen' : ' tiene'} contrato${stats.expiringContracts > 1 ? 's' : ''} próximos a vencer en los próximos 30 días.`}
                        type="warning"
                        items={(stats.expiringEmployees || []).map(emp => ({
                            name: emp.name || 'Nombre no disponible',
                            position: emp.position || 'Puesto no especificado',
                            badge: emp.daysUntilExpiry === 0 ? 'Hoy' : emp.daysUntilExpiry === 1 ? 'Mañana' : `En ${emp.daysUntilExpiry}d`,
                            details: [
                                { label: 'ID Empleado', value: emp.employeeId || 'N/A' },
                                { label: 'Área', value: emp.area || 'No especificada' },
                                { label: 'Departamento', value: emp.department || 'No especificado' },
                                { label: 'Turno', value: emp.shift ? `Turno ${emp.shift}` : 'No especificado' },
                                { label: 'Fecha de vencimiento', value: emp.contractEndDate ? new Date(emp.contractEndDate).toLocaleDateString('es-MX') : 'No disponible' },
                                { label: 'Días restantes', value: `${emp.daysUntilExpiry} día${emp.daysUntilExpiry !== 1 ? 's' : ''}` },
                            ]
                        }))}
                        actionLink="/employees"
                        actionText="Ver todos los contratos"
                    >
                        <motion.div
                            className={`${styles.alertCard} ${styles.alertWarning}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.alertIcon}>
                                <Clock className={styles.alertIconSvg} />
                            </div>
                            <div className={styles.alertContent}>
                                <div className={styles.alertTitle}>Contratos por vencer</div>
                                <div className={styles.alertDescription}>
                                    {stats.expiringContracts} contrato{stats.expiringContracts > 1 ? 's' : ''} próximo{stats.expiringContracts > 1 ? 's' : ''} a vencer
                                </div>
                            </div>
                            <div className={styles.alertAction}>
                                <span>Revisar</span>
                                <ArrowUpRight className={styles.alertActionIcon} />
                            </div>
                        </motion.div>
                    </EmployeeDrawer>
                )}

                {/* Overdue Evaluations */}
                {evaluations?.overdue?.length > 0 && (
                    <EmployeeDrawer
                        title="Evaluaciones Vencidas"
                        description={`${evaluations.overdue.length} empleado${evaluations.overdue.length > 1 ? 's tienen' : ' tiene'} evaluaciones vencidas que requieren atención inmediata.`}
                        type="danger"
                        items={evaluations.overdue.map(ev => ({
                            name: ev.employeeName || 'Nombre no disponible',
                            position: ev.position || 'Puesto no especificado',
                            badge: `Vencida ${ev.daysOverdue || 0}d`,
                            details: [
                                { label: 'ID Empleado', value: ev.employeeId || 'N/A' },
                                { label: 'Evaluación', value: ev.evaluationType || `Evaluación ${ev.evalNum}` },
                                { label: 'Área', value: ev.area || 'No especificada' },
                                { label: 'Departamento', value: ev.department || 'No especificado' },
                                { label: 'Turno', value: ev.shift ? `Turno ${ev.shift}` : 'No especificado' },
                                { label: 'Fecha límite', value: ev.dueDate ? new Date(ev.dueDate).toLocaleDateString('es-MX') : 'No disponible' },
                                { label: 'Días vencidos', value: `${ev.daysOverdue || 0} día${ev.daysOverdue !== 1 ? 's' : ''}` },
                            ]
                        }))}
                        actionLink="/reports"
                        actionText="Ver todas las evaluaciones"
                    >
                        <motion.div
                            className={`${styles.alertCard} ${styles.alertDanger}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.alertIcon}>
                                <AlertCircle className={styles.alertIconSvg} />
                            </div>
                            <div className={styles.alertContent}>
                                <div className={styles.alertTitle}>Evaluaciones vencidas</div>
                                <div className={styles.alertDescription}>
                                    {evaluations.overdue.length} evaluación{evaluations.overdue.length > 1 ? 'es' : ''} pendiente{evaluations.overdue.length > 1 ? 's' : ''}
                                </div>
                            </div>
                            <div className={styles.alertAction}>
                                <span>Ver ahora</span>
                                <ArrowUpRight className={styles.alertActionIcon} />
                            </div>
                        </motion.div>
                    </EmployeeDrawer>
                )}

                {/* Upcoming Evaluations */}
                {evaluations?.upcoming?.length > 0 && (
                    <EmployeeDrawer
                        title="Próximas Evaluaciones"
                        description={`${evaluations.upcoming.length} evaluación${evaluations.upcoming.length > 1 ? 'es programadas' : ' programada'} para los próximos 3 días.`}
                        type="info"
                        items={evaluations.upcoming.map(ev => ({
                            name: ev.employeeName || 'Nombre no disponible',
                            position: ev.position || 'Puesto no especificado',
                            badge: ev.daysUntil === 0 ? 'Hoy' : ev.daysUntil === 1 ? 'Mañana' : `En ${ev.daysUntil}d`,
                            details: [
                                { label: 'ID Empleado', value: ev.employeeId || 'N/A' },
                                { label: 'Evaluación', value: ev.evaluationType || `Evaluación ${ev.evalNum}` },
                                { label: 'Área', value: ev.area || 'No especificada' },
                                { label: 'Departamento', value: ev.department || 'No especificado' },
                                { label: 'Turno', value: ev.shift ? `Turno ${ev.shift}` : 'No especificado' },
                                { label: 'Fecha programada', value: ev.scheduledDate ? new Date(ev.scheduledDate).toLocaleDateString('es-MX') : 'No disponible' },
                                { label: 'Días restantes', value: ev.daysUntil === 0 ? 'Hoy' : `${ev.daysUntil} día${ev.daysUntil !== 1 ? 's' : ''}` },
                            ]
                        }))}
                        actionLink="/reports"
                        actionText="Planificar evaluaciones"
                    >
                        <motion.div
                            className={`${styles.alertCard} ${styles.alertInfo}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.alertIcon}>
                                <Calendar className={styles.alertIconSvg} />
                            </div>
                            <div className={styles.alertContent}>
                                <div className={styles.alertTitle}>Próximas evaluaciones</div>
                                <div className={styles.alertDescription}>
                                    {evaluations.upcoming.length} evaluación{evaluations.upcoming.length > 1 ? 'es' : ''} en los próximos 3 días
                                </div>
                            </div>
                            <div className={styles.alertAction}>
                                <span>Planificar</span>
                                <ArrowUpRight className={styles.alertActionIcon} />
                            </div>
                        </motion.div>
                    </EmployeeDrawer>
                )}
            </div>

            {/* Quick Actions Grid */}
            <motion.div
                className={styles.actionsGrid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
            >
                <h3 className={styles.sectionTitle}>Accesos Rápidos</h3>
                <div className={styles.actionsContainer}>
                    <Link href="/dashboard/candidates" className={styles.actionCard} title="Candidatos">
                        <div className={`${styles.actionIcon} ${styles.actionIconOrange}`}>
                            <Users className={styles.actionIconSvg} />
                        </div>
                    </Link>

                    <Link href="/dashboard/programacion" className={styles.actionCard} title="Programación">
                        <div className={`${styles.actionIcon} ${styles.actionIconBlue}`}>
                            <FileText className={styles.actionIconSvg} />
                        </div>
                    </Link>

                    <Link href="/capacitacion" className={styles.actionCard} title="Capacitación">
                        <div className={`${styles.actionIcon} ${styles.actionIconPurple}`}>
                            <Award className={styles.actionIconSvg} />
                        </div>
                    </Link>

                    <Link href="/reports" className={styles.actionCard} title="Reportes">
                        <div className={`${styles.actionIcon} ${styles.actionIconGreen}`}>
                            <TrendingUp className={styles.actionIconSvg} />
                        </div>
                    </Link>

                    <Link href="/capacitacion/comparacion" className={styles.actionCard} title="Comparación">
                        <div className={`${styles.actionIcon} ${styles.actionIconCyan}`}>
                            <GitCompareArrows className={styles.actionIconSvg} />
                        </div>
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
