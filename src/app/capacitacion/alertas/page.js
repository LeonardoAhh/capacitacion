'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import styles from './page.module.css';

export default function AlertsPage() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const coursesSnap = await getDocs(collection(db, 'courses'));
            const courseValidityMap = {};
            coursesSnap.forEach(doc => {
                const data = doc.data();
                if (data.validityYears && data.validityYears > 0) {
                    courseValidityMap[data.name] = data.validityYears * 12;
                }
            });

            const recordsSnap = await getDocs(collection(db, 'training_records'));
            const processedAlerts = [];

            recordsSnap.forEach(doc => {
                const emp = doc.data();
                const history = emp.history || [];

                const latestCourses = {};
                history.forEach(h => {
                    if (h.status === 'approved') {
                        const [d, m, y] = h.date.split('/');
                        const dateObj = new Date(y, m - 1, d);

                        if (!latestCourses[h.courseName] || dateObj > latestCourses[h.courseName].dateObj) {
                            latestCourses[h.courseName] = { ...h, dateObj };
                        }
                    }
                });

                Object.values(latestCourses).forEach(record => {
                    const validity = courseValidityMap[record.courseName];
                    if (validity) {
                        const expirationDate = new Date(record.dateObj);
                        expirationDate.setMonth(expirationDate.getMonth() + validity);

                        const today = new Date();
                        const warningDate = new Date();
                        warningDate.setDate(today.getDate() + 60);

                        let status = 'OK';
                        if (expirationDate < today) status = 'EXPIRED';
                        else if (expirationDate < warningDate) status = 'WARNING';

                        if (status !== 'OK') {
                            processedAlerts.push({
                                id: `${doc.id}-${record.courseName}`,
                                employeeName: emp.name,
                                employeeId: emp.employeeId || doc.id,
                                department: emp.department || 'N/A',
                                position: emp.position || 'N/A',
                                courseName: record.courseName,
                                dateTaken: record.date,
                                expirationDate: expirationDate.toLocaleDateString('es-MX'),
                                status,
                                score: record.score
                            });
                        }
                    }
                });
            });

            processedAlerts.sort((a, b) => {
                if (a.status === b.status) return 0;
                return a.status === 'EXPIRED' ? -1 : 1;
            });

            setAlerts(processedAlerts);

        } catch (error) {
            console.error("Error loading alerts:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAlerts = alerts.filter(a => {
        if (filterStatus === 'ALL') return true;
        return a.status === filterStatus;
    });

    const stats = {
        expired: alerts.filter(a => a.status === 'EXPIRED').length,
        warning: alerts.filter(a => a.status === 'WARNING').length
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <>
            <Navbar />
            <main className={styles.main} id="main-content">
                {/* Background Effects */}
                <div className={styles.bgDecoration}>
                    <div className={`${styles.blob} ${styles.blob1}`}></div>
                    <div className={`${styles.blob} ${styles.blob2}`}></div>
                </div>

                <div className={styles.container}>
                    <div className={styles.header}>
                        <Link href="/capacitacion" className={styles.backBtn}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Volver
                        </Link>
                        <div className={styles.titleRow}>
                            <h1>Alertas de Vencimiento</h1>
                        </div>
                        <p className={styles.subtitle}>Monitoreo de vigencias de certificaciones y cursos regulatorios.</p>
                    </div>

                    {/* Stats Cards */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <span className={`${styles.statValue} ${styles.textRed}`}>{stats.expired}</span>
                            <span className={styles.statLabel}>Vencidos</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={`${styles.statValue} ${styles.textYellow}`}>{stats.warning}</span>
                            <span className={styles.statLabel}>Por Vencer (60 días)</span>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className={styles.filters}>
                        <select
                            className={styles.select}
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="ALL">Todos los avisos</option>
                            <option value="EXPIRED">Vencidos</option>
                            <option value="WARNING">Por Vencer</option>
                        </select>
                    </div>

                    {/* Alerts List */}
                    {loading ? (
                        <div className={styles.loadingState}>Cargando alertas...</div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🎉</div>
                            <div className={styles.emptyTitle}>¡Todo en orden!</div>
                            <p className={styles.emptyText}>No hay cursos vencidos ni próximos a vencer.</p>
                        </div>
                    ) : (
                        <div className={styles.alertsList}>
                            {filteredAlerts.map(alert => (
                                <div
                                    key={alert.id}
                                    className={`${styles.alertCard} ${alert.status === 'EXPIRED' ? styles.expired : styles.warning}`}
                                >
                                    <div className={styles.alertRow} onClick={() => toggleExpand(alert.id)}>
                                        <div className={`${styles.alertIcon} ${alert.status === 'EXPIRED' ? styles.expiredIcon : styles.warningIcon}`}>
                                            {alert.status === 'EXPIRED' ? '⚠️' : '⏰'}
                                        </div>
                                        <div className={styles.alertInfo}>
                                            <div className={styles.alertEmployee}>{alert.employeeName}</div>
                                            <div className={styles.alertCourse}>{alert.courseName}</div>
                                        </div>
                                        <div className={styles.alertMeta}>
                                            <div className={styles.alertDate}>
                                                <div className={styles.alertDateLabel}>Vence</div>
                                                <div className={styles.alertDateValue}>{alert.expirationDate}</div>
                                            </div>
                                            <span className={`${styles.badge} ${alert.status === 'EXPIRED' ? styles.badgeExpired : styles.badgeWarning}`}>
                                                {alert.status === 'EXPIRED' ? 'VENCIDO' : 'POR VENCER'}
                                            </span>
                                            <button className={`${styles.expandBtn} ${expandedId === alert.id ? styles.expanded : ''}`}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {expandedId === alert.id && (
                                        <div className={styles.expandedContent}>
                                            <div className={styles.detailsGrid}>
                                                <div className={styles.detailItem}>
                                                    <span className={styles.detailLabel}>ID Empleado</span>
                                                    <span className={styles.detailValue}>{alert.employeeId}</span>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <span className={styles.detailLabel}>Departamento</span>
                                                    <span className={styles.detailValue}>{alert.department}</span>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <span className={styles.detailLabel}>Puesto</span>
                                                    <span className={styles.detailValue}>{alert.position}</span>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <span className={styles.detailLabel}>Fecha Tomada</span>
                                                    <span className={styles.detailValue}>{alert.dateTaken}</span>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <span className={styles.detailLabel}>Calificación</span>
                                                    <span className={styles.detailValue}>{alert.score}%</span>
                                                </div>
                                                <div className={styles.detailItem}>
                                                    <span className={styles.detailLabel}>Estado</span>
                                                    <span className={styles.detailValue}>{alert.status === 'EXPIRED' ? 'Vencido' : 'Por Vencer'}</span>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/capacitacion/registro?emp=${encodeURIComponent(alert.employeeName)}&course=${encodeURIComponent(alert.courseName)}`}
                                                className={styles.actionBtn}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                                                </svg>
                                                Recertificar
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
