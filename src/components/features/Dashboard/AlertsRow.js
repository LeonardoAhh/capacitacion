"use client";

import { motion } from "framer-motion";
import { Clock, AlertCircle, Calendar, ArrowUpRight } from "lucide-react";
import EmployeeDrawer from "./EmployeeDrawer";
import styles from "./DashboardBentoGrid.module.css";

/**
 * Convierte un string YYYY-MM-DD a Date en hora LOCAL (no UTC).
 * Sin esto, "2026-02-20" se interpreta como medianoche UTC, que en México (UTC-6)
 * es el 19/02 → muestra un día menos o "Invalid Date".
 */
function parseLocalDate(str) {
    if (!str) return null;
    const s = String(str);
    // Si ya tiene T (ISO completo) o es un objeto, parsear directo
    if (s.includes('T') || s.includes(' ')) return new Date(s);
    // Solo YYYY-MM-DD → agregar T00:00:00 para forzar hora local
    const d = new Date(s + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
}


/**
 * Helpers para transformar datos en items de drawer.
 */
function mapExpiringItems(employees) {
    return (employees || []).map(emp => ({
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
    }));
}

function mapEvaluationItems(evaluations, labelDate, labelDays) {
    return (evaluations || []).map(ev => ({
        name: ev.employeeName || 'Nombre no disponible',
        position: ev.position || 'Puesto no especificado',
        badge: ev.daysOverdue != null
            ? `Vencida ${ev.daysOverdue}d`
            : ev.daysUntil === 0 ? 'Hoy' : ev.daysUntil === 1 ? 'Mañana' : `En ${ev.daysUntil}d`,
        details: [
            { label: 'ID Empleado', value: ev.employeeId || 'N/A' },
            { label: 'Evaluación', value: ev.evaluationType || `Evaluación ${ev.evalNum}` },
            { label: 'Área', value: ev.area || 'No especificada' },
            { label: 'Departamento', value: ev.department || 'No especificado' },
            { label: 'Turno', value: ev.shift ? `Turno ${ev.shift}` : 'No especificado' },
            { label: labelDate, value: (() => { const f = parseLocalDate(ev.dueDate || ev.scheduledDate); return f ? f.toLocaleDateString('es-MX') : 'No disponible'; })() },
            {
                label: labelDays, value: ev.daysOverdue != null
                    ? `${ev.daysOverdue} día${ev.daysOverdue !== 1 ? 's' : ''}`
                    : ev.daysUntil === 0 ? 'Hoy' : `${ev.daysUntil} día${ev.daysUntil !== 1 ? 's' : ''}`
            },
        ]
    }));
}

/**
 * Fila de alertas con drawers para contratos y evaluaciones.
 */
export default function AlertsRow({ stats, evaluations }) {
    return (
        <div className={styles.alertsRow}>
            {/* Expiring Contracts */}
            {stats?.expiringContracts > 0 && (
                <EmployeeDrawer
                    title="Contratos por Vencer"
                    description={`${stats.expiringContracts} empleado${stats.expiringContracts > 1 ? 's tienen' : ' tiene'} contrato${stats.expiringContracts > 1 ? 's' : ''} próximos a vencer en los próximos 30 días.`}
                    type="warning"
                    items={mapExpiringItems(stats.expiringEmployees)}
                    actionLink="/dashboard"
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
                    items={mapEvaluationItems(evaluations.overdue, 'Fecha límite', 'Días vencidos')}
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
                    items={mapEvaluationItems(evaluations.upcoming, 'Fecha programada', 'Días restantes')}
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
    );
}
