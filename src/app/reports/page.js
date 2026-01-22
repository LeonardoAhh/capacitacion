'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import styles from './page.module.css';

// Configuración de plazos del Plan de Formación
const TRAINING_PLAN_CONFIG = [
    { DEPARTAMENTO: "ALMACEN", ÁREA: "ALMACEN", DIAS: 60 },
    { DEPARTAMENTO: "CALIDAD", ÁREA: "A. CALIDAD 1ER TURNO", DIAS: 7 },
    { DEPARTAMENTO: "CALIDAD", ÁREA: "A. CALIDAD 2DO. TURNO", DIAS: 7 },
    { DEPARTAMENTO: "CALIDAD", ÁREA: "METROLOGÍA", DIAS: 7 },
    { DEPARTAMENTO: "CALIDAD", ÁREA: "CALIDAD ADMTVO", DIAS: 7 },
    { DEPARTAMENTO: "CALIDAD", ÁREA: "SGI", DIAS: 60 },
    { DEPARTAMENTO: "CALIDAD", ÁREA: "RESIDENTES DE CALIDAD", DIAS: 7 },
    { DEPARTAMENTO: "COMERCIAL", ÁREA: "VENTAS", DIAS: 60 },
    { DEPARTAMENTO: "GERENCIA DE PLANTA", ÁREA: "GERENCIA", DIAS: 60 },
    { DEPARTAMENTO: "LOGISTICA", ÁREA: "LOGISTICA", DIAS: 60 },
    { DEPARTAMENTO: "MANTENIMIENTO", ÁREA: "MANTENIMIENTO", DIAS: 90 },
    { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN ADMTVO", DIAS: 60 },
    { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN MONTAJE", DIAS: 60 },
    { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 1ER. TURNO", DIAS: 60 },
    { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 2o. TURNO", DIAS: 60 },
    { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 3ER. TURNO", DIAS: 60 },
    { DEPARTAMENTO: "PRODUCCIÓN", ÁREA: "PRODUCCIÓN 4o. TURNO", DIAS: 60 },
    { DEPARTAMENTO: "PROYECTOS", ÁREA: "PROYECTOS", DIAS: 60 },
    { DEPARTAMENTO: "RECURSOS HUMANOS", ÁREA: "RECURSOS HUMANOS", DIAS: 60 },
    { DEPARTAMENTO: "SISTEMAS", ÁREA: "SISTEMAS", DIAS: 60 },
    { DEPARTAMENTO: "TALLER DE MOLDES", ÁREA: "MOLDES", DIAS: 60 }
];

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ReportsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [departmentStats, setDepartmentStats] = useState([]);
    const [monthlyStats, setMonthlyStats] = useState([]);
    const [totals, setTotals] = useState({ scheduled: 0, delivered: 0, pending: 0 });
    const [selectedDept, setSelectedDept] = useState(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadReports();
        }
    }, [user, selectedYear]);

    const calculateTrainingPlanDate = (startDate, department, area) => {
        if (!startDate || !department || !area) return null;

        const config = TRAINING_PLAN_CONFIG.find(
            c => c.DEPARTAMENTO.toUpperCase() === department.toUpperCase() &&
                c.ÁREA.toUpperCase() === area.toUpperCase()
        );

        const configByDept = config || TRAINING_PLAN_CONFIG.find(
            c => c.DEPARTAMENTO.toUpperCase() === department.toUpperCase()
        );

        const days = configByDept?.DIAS || 60;

        const start = new Date(startDate);
        const deliveryDate = new Date(start);
        deliveryDate.setDate(deliveryDate.getDate() + days);

        return deliveryDate;
    };

    const loadReports = async () => {
        try {
            const employeesRef = collection(db, 'employees');
            const snapshot = await getDocs(employeesRef);
            const employees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Procesar datos por departamento
            const deptMap = {};
            const monthMap = {};

            // Inicializar meses
            for (let i = 0; i < 12; i++) {
                monthMap[i] = { scheduled: 0, delivered: 0 };
            }

            employees.forEach(emp => {
                if (!emp.startDate || !emp.department || !emp.area) return;

                const deliveryDate = calculateTrainingPlanDate(emp.startDate, emp.department, emp.area);
                if (!deliveryDate || deliveryDate.getFullYear() !== selectedYear) return;

                const month = deliveryDate.getMonth();
                const dept = emp.department.toUpperCase();

                // Actualizar estadísticas por mes
                monthMap[month].scheduled++;
                if (emp.trainingPlanDelivered) {
                    monthMap[month].delivered++;
                }

                // Actualizar estadísticas por departamento
                if (!deptMap[dept]) {
                    deptMap[dept] = { scheduled: 0, delivered: 0, employees: [] };
                }
                deptMap[dept].scheduled++;
                if (emp.trainingPlanDelivered) {
                    deptMap[dept].delivered++;
                }
                deptMap[dept].employees.push({
                    employeeId: emp.employeeId,
                    name: emp.name,
                    shift: emp.shift || 'N/A',
                    deliveryDate: deliveryDate.toISOString().split('T')[0],
                    delivered: emp.trainingPlanDelivered || false
                });
            });

            // Convertir a arrays
            const deptArray = Object.entries(deptMap)
                .map(([name, data]) => ({
                    name,
                    ...data,
                    percentage: data.scheduled > 0 ? Math.round((data.delivered / data.scheduled) * 100) : 0
                }))
                .sort((a, b) => b.scheduled - a.scheduled);

            const monthArray = Object.entries(monthMap)
                .map(([month, data]) => ({
                    month: parseInt(month),
                    monthName: MONTHS[parseInt(month)],
                    ...data,
                    percentage: data.scheduled > 0 ? Math.round((data.delivered / data.scheduled) * 100) : 0
                }));

            // Calcular totales
            const totalScheduled = deptArray.reduce((sum, d) => sum + d.scheduled, 0);
            const totalDelivered = deptArray.reduce((sum, d) => sum + d.delivered, 0);

            setDepartmentStats(deptArray);
            setMonthlyStats(monthArray);
            setTotals({
                scheduled: totalScheduled,
                delivered: totalDelivered,
                pending: totalScheduled - totalDelivered
            });
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    const getDeliveryStatus = (deliveryDate, delivered) => {
        if (delivered) return { status: 'delivered', label: 'Entregado', color: '#22c55e' };

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dueDate = new Date(deliveryDate + 'T00:00:00');
        const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) {
            return { status: 'overdue', label: `Vencido (${Math.abs(daysUntil)} días)`, color: '#ef4444' };
        } else if (daysUntil <= 7) {
            return { status: 'soon', label: `Próximo (${daysUntil} días)`, color: '#f59e0b' };
        } else {
            return { status: 'ontime', label: 'A tiempo', color: '#3b82f6' };
        }
    };

    if (authLoading || !user) {
        return (
            <div className={styles.loadingContainer}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <Link href="/dashboard" className={styles.backBtn}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                Volver
                            </Link>
                            <h1>Cumplimiento Plan de Formación</h1>
                        </div>
                        <div className={styles.yearSelector}>
                            <label>Año:</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="input-field"
                            >
                                {[2023, 2024, 2025, 2026, 2027].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <>
                            {/* Resumen General */}
                            <div className={styles.summaryCards}>
                                <div className={styles.summaryCard}>
                                    <div className={styles.summaryIcon} style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                    </div>
                                    <div className={styles.summaryContent}>
                                        <span className={styles.summaryNumber}>{totals.scheduled}</span>
                                        <span className={styles.summaryLabel}>Programados</span>
                                    </div>
                                </div>

                                <div className={styles.summaryCard}>
                                    <div className={styles.summaryIcon} style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    </div>
                                    <div className={styles.summaryContent}>
                                        <span className={styles.summaryNumber}>{totals.delivered}</span>
                                        <span className={styles.summaryLabel}>Entregados</span>
                                    </div>
                                </div>

                                <div className={styles.summaryCard}>
                                    <div className={styles.summaryIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                    </div>
                                    <div className={styles.summaryContent}>
                                        <span className={styles.summaryNumber}>{totals.pending}</span>
                                        <span className={styles.summaryLabel}>Pendientes</span>
                                    </div>
                                </div>

                                <div className={styles.summaryCard}>
                                    <div className={styles.summaryIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="20" x2="18" y2="10" />
                                            <line x1="12" y1="20" x2="12" y2="4" />
                                            <line x1="6" y1="20" x2="6" y2="14" />
                                        </svg>
                                    </div>
                                    <div className={styles.summaryContent}>
                                        <span className={styles.summaryNumber}>
                                            {totals.scheduled > 0 ? Math.round((totals.delivered / totals.scheduled) * 100) : 0}%
                                        </span>
                                        <span className={styles.summaryLabel}>Cumplimiento</span>
                                    </div>
                                </div>
                            </div>

                            {/* Estadísticas por Mes */}
                            <section className={styles.section}>
                                <h2>Cumplimiento por Mes - {selectedYear}</h2>
                                <div className={styles.monthGrid}>
                                    {monthlyStats.map((month) => (
                                        <div key={month.month} className={styles.monthCard}>
                                            <div className={styles.monthHeader}>
                                                <span className={styles.monthName}>{month.monthName}</span>
                                                <span className={styles.monthPercentage}>{month.percentage}%</span>
                                            </div>
                                            <div className={styles.progressBar}>
                                                <div
                                                    className={styles.progressFill}
                                                    style={{ width: `${month.percentage}%` }}
                                                ></div>
                                            </div>
                                            <div className={styles.monthStats}>
                                                <span>{month.delivered} / {month.scheduled}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Estadísticas por Departamento */}
                            <section className={styles.section}>
                                <h2>Cumplimiento por Departamento</h2>
                                {departmentStats.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <p>No hay datos de planes de formación para el año {selectedYear}</p>
                                    </div>
                                ) : (
                                    <div className={styles.deptTable}>
                                        <div className={styles.tableHeader}>
                                            <span>Departamento</span>
                                            <span>Programados</span>
                                            <span>Entregados</span>
                                            <span>Pendientes</span>
                                            <span>Cumplimiento</span>
                                        </div>
                                        {departmentStats.map((dept) => (
                                            <div
                                                key={dept.name}
                                                className={`${styles.tableRow} ${styles.clickable}`}
                                                onClick={() => setSelectedDept(dept)}
                                            >
                                                <span className={styles.deptName}>
                                                    {dept.name}
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="9 18 15 12 9 6" />
                                                    </svg>
                                                </span>
                                                <span className={styles.deptStat}>{dept.scheduled}</span>
                                                <span className={styles.deptStat} style={{ color: '#22c55e' }}>{dept.delivered}</span>
                                                <span className={styles.deptStat} style={{ color: '#f59e0b' }}>{dept.scheduled - dept.delivered}</span>
                                                <span className={styles.deptProgress}>
                                                    <div className={styles.miniProgressBar}>
                                                        <div
                                                            className={styles.miniProgressFill}
                                                            style={{
                                                                width: `${dept.percentage}%`,
                                                                background: dept.percentage >= 80 ? '#22c55e' : dept.percentage >= 50 ? '#f59e0b' : '#ef4444'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span>{dept.percentage}%</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </main>

            {/* Modal de Empleados por Departamento */}
            {selectedDept && (
                <div className={styles.modalOverlay} onClick={() => setSelectedDept(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>{selectedDept.name}</h2>
                            <button className={styles.closeBtn} onClick={() => setSelectedDept(null)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className={styles.modalStats}>
                            <span className={styles.modalStatItem}>
                                <strong>{selectedDept.scheduled}</strong> Programados
                            </span>
                            <span className={styles.modalStatItem} style={{ color: '#22c55e' }}>
                                <strong>{selectedDept.delivered}</strong> Entregados
                            </span>
                            <span className={styles.modalStatItem} style={{ color: '#f59e0b' }}>
                                <strong>{selectedDept.scheduled - selectedDept.delivered}</strong> Pendientes
                            </span>
                        </div>
                        <div className={styles.employeeList}>
                            <div className={styles.employeeHeader}>
                                <span>ID</span>
                                <span>Nombre</span>
                                <span>Turno</span>
                                <span>Fecha Entrega</span>
                                <span>Estado</span>
                            </div>
                            {selectedDept.employees.map((emp, idx) => {
                                const status = getDeliveryStatus(emp.deliveryDate, emp.delivered);
                                return (
                                    <div key={idx} className={styles.employeeRow}>
                                        <span className={styles.empId}>{emp.employeeId}</span>
                                        <span className={styles.empName}>{emp.name}</span>
                                        <span className={styles.empShift}>{emp.shift}</span>
                                        <span className={styles.empDate}>{formatDate(emp.deliveryDate)}</span>
                                        <span
                                            className={styles.empStatus}
                                            style={{ color: status.color, background: `${status.color}15` }}
                                        >
                                            {status.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
