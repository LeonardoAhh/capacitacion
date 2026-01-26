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
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, EXPIRED, WARNING

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Courses to get Validity
            const coursesSnap = await getDocs(collection(db, 'courses'));
            const courseValidityMap = {};
            coursesSnap.forEach(doc => {
                const data = doc.data();
                if (data.validityMonths) {
                    courseValidityMap[data.name] = data.validityMonths;
                }
            });

            // 2. Fetch Records
            const recordsSnap = await getDocs(collection(db, 'training_records'));
            const processedAlerts = [];

            recordsSnap.forEach(doc => {
                const emp = doc.data();
                const history = emp.history || [];

                // For each course taken, check if it expires
                // Note: Only check the LATEST instance of a course? 
                // Or all? Usually latest.
                // Let's group by course name first.
                const latestCourses = {};
                history.forEach(h => {
                    // Only approved courses count for validity? Yes usually.
                    if (h.status === 'approved') {
                        // Assuming newer dates come later or we sort.
                        // History isn't guaranteed sorted, let's parse date.
                        const [d, m, y] = h.date.split('/');
                        const dateObj = new Date(y, m - 1, d);

                        if (!latestCourses[h.courseName] || dateObj > latestCourses[h.courseName].dateObj) {
                            latestCourses[h.courseName] = { ...h, dateObj };
                        }
                    }
                });

                // Check Expiration
                Object.values(latestCourses).forEach(record => {
                    const validity = courseValidityMap[record.courseName];
                    if (validity) {
                        const expirationDate = new Date(record.dateObj);
                        expirationDate.setMonth(expirationDate.getMonth() + validity);

                        const today = new Date();
                        const warningDate = new Date();
                        warningDate.setDate(today.getDate() + 60); // Warn 60 days ahead

                        let status = 'OK';
                        if (expirationDate < today) status = 'EXPIRED';
                        else if (expirationDate < warningDate) status = 'WARNING';

                        if (status !== 'OK') {
                            processedAlerts.push({
                                id: `${doc.id}-${record.courseName}`,
                                employeeName: emp.name,
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

            // Sort by status (Expired first) then date
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

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <Link href="/capacitacion" className={styles.backBtn}>← Volver</Link>
                        <div className={styles.titleRow}>
                            <h1>Alertas de Vencimiento</h1>
                        </div>
                        <p style={{ color: 'var(--text-secondary)' }}>Monitoreo de vigencias de certificaciones y cursos regulatorios.</p>
                    </div>

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

                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Empleado</th>
                                    <th>Curso</th>
                                    <th>Fecha Tomada</th>
                                    <th>Vence</th>
                                    <th>Estado</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Cargando alertas...</td></tr>
                                ) : filteredAlerts.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                            🎉 ¡Todo en orden! No hay cursos vencidos ni próximos a vencer.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAlerts.map(alert => (
                                        <tr key={alert.id}>
                                            <td style={{ fontWeight: 500 }}>{alert.employeeName}</td>
                                            <td>{alert.courseName}</td>
                                            <td>{alert.dateTaken}</td>
                                            <td>{alert.expirationDate}</td>
                                            <td>
                                                {alert.status === 'EXPIRED' ? (
                                                    <span className={`${styles.badge} ${styles.badgeExpired}`}>VENCIDO</span>
                                                ) : (
                                                    <span className={`${styles.badge} ${styles.badgeWarning}`}>POR VENCER</span>
                                                )}
                                            </td>
                                            <td>
                                                <Link href={`/capacitacion/registro?emp=${encodeURIComponent(alert.employeeName)}&course=${encodeURIComponent(alert.courseName)}`} style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>
                                                    Recertificar
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </>
    );
}
