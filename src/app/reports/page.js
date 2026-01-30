'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import styles from './page.module.css';

// UI Components
import { Badge } from '@/components/ui/Badge/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { Progress, CircularProgress } from '@/components/ui/Progress/Progress';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line,
    Area,
    AreaChart
} from 'recharts';

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

// Colores vibrantes para gráficos
const CHART_COLORS = [
    '#3b82f6', // Blue
    '#22c55e', // Green  
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#6366f1', // Indigo
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
        if (!authLoading) {
            if (!user) {
                router.push('/');
                return;
            }
            // Block demo users
            if (user.rol === 'demo' || user.email?.includes('demo')) {
                router.push('/induccion');
            }
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            loadReports();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // Show access restricted screen for demo users
    const isDemo = user?.rol === 'demo' || user?.email?.includes('demo');
    if (isDemo) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                textAlign: 'center',
                padding: '20px'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px'
                }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5 }}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
                <h2 style={{ margin: '0 0 10px', fontSize: '1.5rem' }}>Acceso Restringido</h2>
                <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                    Esta sección no está disponible en modo Demo.
                </p>
                <button
                    onClick={() => router.push('/induccion')}
                    style={{
                        padding: '12px 30px',
                        background: '#007AFF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    Ir a Inducción
                </button>
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

                            {/* Sección de Gráficos Interactivos */}
                            <div className={styles.chartsGrid}>
                                {/* Gráfico de Barras - Cumplimiento Mensual */}
                                <div className={styles.chartCard}>
                                    <div className={styles.chartHeader}>
                                        <div>
                                            <h3 className={styles.chartTitle}>Cumplimiento Mensual</h3>
                                            <p className={styles.chartSubtitle}>Programados vs Entregados por mes</p>
                                        </div>
                                    </div>
                                    <div className={styles.chartWrapper}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={monthlyStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                                                <XAxis
                                                    dataKey="monthName"
                                                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                                                    tickFormatter={(value) => value.substring(0, 3)}
                                                    axisLine={{ stroke: 'var(--border-color)' }}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                                                    axisLine={{ stroke: 'var(--border-color)' }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'var(--bg-primary)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px',
                                                        boxShadow: 'var(--shadow-lg)'
                                                    }}
                                                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                                                />
                                                <Bar dataKey="scheduled" name="Programados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="delivered" name="Entregados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className={styles.chartLegend}>
                                        <div className={styles.legendItem}>
                                            <span className={styles.legendDot} style={{ backgroundColor: '#3b82f6' }}></span>
                                            <span>Programados</span>
                                        </div>
                                        <div className={styles.legendItem}>
                                            <span className={styles.legendDot} style={{ backgroundColor: '#22c55e' }}></span>
                                            <span>Entregados</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Gráfico de Pie - Distribución General */}
                                <div className={styles.chartCard}>
                                    <div className={styles.chartHeader}>
                                        <div>
                                            <h3 className={styles.chartTitle}>Distribución General</h3>
                                            <p className={styles.chartSubtitle}>Estado actual de entregas</p>
                                        </div>
                                    </div>
                                    <div className={styles.chartWrapper}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Entregados', value: totals.delivered },
                                                        { name: 'Pendientes', value: totals.pending }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    labelLine={{ stroke: 'var(--text-secondary)' }}
                                                >
                                                    <Cell fill="#22c55e" />
                                                    <Cell fill="#f59e0b" />
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'var(--bg-primary)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px',
                                                        boxShadow: 'var(--shadow-lg)'
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className={styles.chartLegend}>
                                        <div className={styles.legendItem}>
                                            <span className={styles.legendDot} style={{ backgroundColor: '#22c55e' }}></span>
                                            <span>Entregados ({totals.delivered})</span>
                                        </div>
                                        <div className={styles.legendItem}>
                                            <span className={styles.legendDot} style={{ backgroundColor: '#f59e0b' }}></span>
                                            <span>Pendientes ({totals.pending})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Gráfico de Área - Tendencia de Cumplimiento */}
                                <div className={`${styles.chartCard} ${styles.fullWidth}`}>
                                    <div className={styles.chartHeader}>
                                        <div>
                                            <h3 className={styles.chartTitle}>Tendencia de Cumplimiento Acumulado</h3>
                                            <p className={styles.chartSubtitle}>Evolución del porcentaje de cumplimiento mensual</p>
                                        </div>
                                    </div>
                                    <div className={styles.chartWrapper}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart
                                                data={monthlyStats.map(m => ({
                                                    ...m,
                                                    cumPercentage: m.scheduled > 0 ? Math.round((m.delivered / m.scheduled) * 100) : 0
                                                }))}
                                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                            >
                                                <defs>
                                                    <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                                                <XAxis
                                                    dataKey="monthName"
                                                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                                                    tickFormatter={(value) => value.substring(0, 3)}
                                                    axisLine={{ stroke: 'var(--border-color)' }}
                                                />
                                                <YAxis
                                                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                                                    axisLine={{ stroke: 'var(--border-color)' }}
                                                    domain={[0, 100]}
                                                    tickFormatter={(value) => `${value}%`}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'var(--bg-primary)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px',
                                                        boxShadow: 'var(--shadow-lg)'
                                                    }}
                                                    formatter={(value) => [`${value}%`, 'Cumplimiento']}
                                                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="cumPercentage"
                                                    stroke="#8b5cf6"
                                                    strokeWidth={3}
                                                    fill="url(#colorPercentage)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Gráfico de Barras Horizontal - Top Departamentos */}
                                <div className={`${styles.chartCard} ${styles.fullWidth}`}>
                                    <div className={styles.chartHeader}>
                                        <div>
                                            <h3 className={styles.chartTitle}>Cumplimiento por Departamento</h3>
                                            <p className={styles.chartSubtitle}>Porcentaje de planes entregados por área</p>
                                        </div>
                                    </div>
                                    <div className={styles.chartWrapper}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={departmentStats.slice(0, 8)}
                                                layout="vertical"
                                                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                                                <XAxis
                                                    type="number"
                                                    domain={[0, 100]}
                                                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                                                    tickFormatter={(value) => `${value}%`}
                                                    axisLine={{ stroke: 'var(--border-color)' }}
                                                />
                                                <YAxis
                                                    type="category"
                                                    dataKey="name"
                                                    tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                                                    axisLine={{ stroke: 'var(--border-color)' }}
                                                    width={75}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'var(--bg-primary)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px',
                                                        boxShadow: 'var(--shadow-lg)'
                                                    }}
                                                    formatter={(value, name, props) => [
                                                        `${value}%`,
                                                        `Cumplimiento (${props.payload.delivered}/${props.payload.scheduled})`
                                                    ]}
                                                    labelStyle={{ color: 'var(--text-primary)', fontWeight: 600 }}
                                                />
                                                <Bar
                                                    dataKey="percentage"
                                                    radius={[0, 4, 4, 0]}
                                                >
                                                    {departmentStats.slice(0, 8).map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.percentage >= 80 ? '#22c55e' : entry.percentage >= 50 ? '#f59e0b' : '#ef4444'}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
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
                                                <Badge
                                                    variant={month.percentage >= 80 ? 'success' : month.percentage >= 50 ? 'warning' : 'danger'}
                                                    size="sm"
                                                >
                                                    {month.percentage}%
                                                </Badge>
                                            </div>
                                            <Progress
                                                value={month.percentage}
                                                variant={month.percentage >= 80 ? 'success' : month.percentage >= 50 ? 'warning' : 'danger'}
                                                size="sm"
                                            />
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
                                        <Badge variant="secondary" size="sm">Turno {emp.shift}</Badge>
                                        <span className={styles.empDate}>{formatDate(emp.deliveryDate)}</span>
                                        <Badge
                                            variant={status.label === 'Entregado' ? 'success' : status.label === 'Pendiente' ? 'warning' : 'danger'}
                                            size="sm"
                                            dot={status.label !== 'Entregado'}
                                        >
                                            {status.label}
                                        </Badge>
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
