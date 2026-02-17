'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, Eye, Inbox, BookOpen, Calendar } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import MonitoringStatsRow from './MonitoringStatsRow';
import MonitoringControls from './MonitoringControls';
import styles from './MonitoringTable.module.css';

// ─── Animation variants ───────────────────────────────────────────────────────

const FADE_IN = {
    hidden: { opacity: 0, y: 10 },
    visible: (i = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.3, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] },
    }),
};

// ─── MonitoringTable ──────────────────────────────────────────────────────────

export default function MonitoringTable() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // ── Fetch data ────────────────────────────────────────────────────────────

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setRefreshing(true);
        try {
            const [progSnap, empSnap, courseSnap] = await Promise.all([
                getDocs(collection(db, 'programacion')),
                getDocs(collection(db, 'employees_programacion')),
                getDocs(collection(db, 'cursos_induccion')),
            ]);

            const employeesMap = {};
            empSnap.docs.forEach(d => { employeesMap[d.id] = d.data(); });

            const coursesMap = {};
            courseSnap.docs.forEach(d => { coursesMap[d.id] = d.data(); });

            const fullData = progSnap.docs.map(d => {
                const item = { id: d.id, ...d.data() };
                const emp = employeesMap[item.employeeId] || { name: 'Desconocido', area: '-' };
                const course = coursesMap[item.courseId] || { nombre: 'Curso eliminado' };

                return {
                    ...item,
                    employeeName: emp.name,
                    employeeArea: emp.area,
                    courseTitle: course.nombre || course.title || 'Sin título',
                };
            });

            setAssignments(fullData);
        } catch (error) {
            console.error("Error fetching monitoring data:", error);
        } finally {
            if (!silent) setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => fetchData(true), 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // ── Filtered data ─────────────────────────────────────────────────────────

    const filteredData = useMemo(() =>
        assignments.filter(item => {
            const matchesSearch =
                item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesFilter = filter === 'all' || item.status === filter;
            return matchesSearch && matchesFilter;
        }),
        [assignments, searchTerm, filter]
    );

    // ── Stats counters ────────────────────────────────────────────────────────

    const stats = useMemo(() => ({
        pending: assignments.filter(a => a.status === 'pending' || a.status === 'assigned').length,
        viewed: assignments.filter(a => a.status === 'viewed').length,
        completed: assignments.filter(a => a.status === 'completed').length,
    }), [assignments]);

    // ── Helpers ────────────────────────────────────────────────────────────────

    const formatDate = useCallback((timestamp) => {
        if (!timestamp) return '-';
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }, []);

    const getStatusBadge = useCallback((status) => {
        switch (status) {
            case 'completed':
                return (
                    <span className={`${styles.badge} ${styles.badgeCompleted}`}>
                        <CheckCircle size={12} /> Completado
                    </span>
                );
            case 'viewed':
                return (
                    <span className={`${styles.badge} ${styles.badgeViewed}`}>
                        <Eye size={12} /> En Progreso
                    </span>
                );
            case 'assigned':
            case 'pending':
            default:
                return (
                    <span className={`${styles.badge} ${styles.badgePending}`}>
                        <Clock size={12} /> Pendiente
                    </span>
                );
        }
    }, []);

    const handleFilterClick = useCallback((key) => {
        setFilter(prev => prev === key ? 'all' : key);
    }, []);

    const handleRefresh = useCallback(() => {
        fetchData();
    }, [fetchData]);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h2 className={styles.title}>Avance de Capacitación</h2>
                <div className={styles.liveIndicator}>
                    <span className={styles.liveDot} />
                    En vivo
                </div>
            </div>

            {/* Extracted subcomponents */}
            <MonitoringStatsRow stats={stats} filter={filter} onFilterClick={handleFilterClick} />
            <MonitoringControls
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filter={filter}
                onFilterChange={setFilter}
                refreshing={refreshing}
                onRefresh={handleRefresh}
            />

            {/* Desktop table */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead className={styles.thead}>
                        <tr>
                            <th className={styles.th}>Empleado</th>
                            <th className={styles.th}>Área</th>
                            <th className={styles.th}>Curso</th>
                            <th className={styles.th}>Estado</th>
                            <th className={styles.th}>Fecha Asignación</th>
                            <th className={styles.th}>Fecha Completado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6">
                                    <div className={styles.loadingWrap}>
                                        <span className={styles.loadingDot} />
                                        <span className={styles.loadingDot} />
                                        <span className={styles.loadingDot} />
                                    </div>
                                </td>
                            </tr>
                        ) : filteredData.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    <div className={styles.emptyWrap}>
                                        <Inbox size={32} opacity={0.3} />
                                        <span>No se encontraron registros</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((item, i) => (
                                <motion.tr
                                    key={item.id}
                                    className={styles.tr}
                                    variants={FADE_IN}
                                    custom={i}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <td className={`${styles.td} ${styles.tdName}`}>{item.employeeName}</td>
                                    <td className={`${styles.td} ${styles.tdSecondary}`}>{item.employeeArea}</td>
                                    <td className={styles.td}>{item.courseTitle}</td>
                                    <td className={styles.td}>{getStatusBadge(item.status)}</td>
                                    <td className={`${styles.td} ${styles.tdSecondary}`}>{formatDate(item.assignedAt)}</td>
                                    <td className={`${styles.td} ${styles.tdSecondary}`}>
                                        {item.status === 'completed' ? formatDate(item.completedAt) : '-'}
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile card list */}
            <div className={styles.cardList}>
                {loading ? (
                    <div className={styles.loadingWrap}>
                        <span className={styles.loadingDot} />
                        <span className={styles.loadingDot} />
                        <span className={styles.loadingDot} />
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className={styles.emptyWrap}>
                        <Inbox size={32} opacity={0.3} />
                        <span>No se encontraron registros</span>
                    </div>
                ) : (
                    <AnimatePresence>
                        {filteredData.map((item, i) => (
                            <motion.div
                                key={item.id}
                                className={styles.card}
                                variants={FADE_IN}
                                custom={i}
                                initial="hidden"
                                animate="visible"
                                layout
                            >
                                <div className={styles.cardTop}>
                                    <span className={styles.cardName}>{item.employeeName}</span>
                                    {getStatusBadge(item.status)}
                                </div>

                                <div className={styles.cardCourse}>
                                    <BookOpen size={14} />
                                    {item.courseTitle}
                                </div>

                                <div className={styles.cardMeta}>
                                    <span className={styles.cardMetaItem}>
                                        <Calendar size={11} />
                                        {formatDate(item.assignedAt)}
                                    </span>
                                    {item.employeeArea && item.employeeArea !== '-' && (
                                        <span className={styles.cardMetaItem}>
                                            {item.employeeArea}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Count badge */}
            {!loading && filteredData.length > 0 && (
                <div className={styles.countBadge}>
                    Mostrando <strong>{filteredData.length}</strong> de <strong>{assignments.length}</strong> registros
                </div>
            )}
        </div>
    );
}
