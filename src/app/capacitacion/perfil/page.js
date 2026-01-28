'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { checkPromotionCriteria, calculateMonthsInPosition, formatDate } from '@/lib/promotionUtils';
import styles from './page.module.css';

export default function PerfilPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [searchId, setSearchId] = useState('');
    const [employee, setEmployee] = useState(null);
    const [positionData, setPositionData] = useState(null);
    const [promotionRule, setPromotionRule] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [activeTab, setActiveTab] = useState('personal');

    // Calculate seniority from startDate
    const calculateSeniority = (startDate) => {
        if (!startDate) return { text: 'N/A', years: 0, months: 0 };
        const start = new Date(startDate);
        const now = new Date();
        const diffMs = now - start;
        const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
        const months = Math.floor((diffMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));

        if (years > 0) {
            return { text: `${years}a ${months}m`, years, months };
        }
        return { text: `${months} meses`, years: 0, months };
    };

    // Get initials for avatar
    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Search employee by ID
    const handleSearch = useCallback(async () => {
        if (!searchId.trim()) {
            toast.warning('Atención', 'Ingresa un ID de empleado');
            return;
        }

        setLoading(true);
        setEmployee(null);
        setPositionData(null);
        setPromotionRule(null);
        setNotFound(false);

        try {
            const directRef = doc(db, 'training_records', searchId.trim());
            let empDoc = await getDoc(directRef);
            let empData = null;

            if (empDoc.exists()) {
                empData = { id: empDoc.id, ...empDoc.data() };
            } else {
                const q = query(
                    collection(db, 'training_records'),
                    where('employeeId', '==', searchId.trim())
                );
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const docData = snapshot.docs[0];
                    empData = { id: docData.id, ...docData.data() };
                }
            }

            if (empData) {
                setEmployee(empData);

                if (empData.position) {
                    const posName = empData.position.toUpperCase().trim();
                    const posQuery = query(
                        collection(db, 'positions'),
                        where('name', '==', posName)
                    );
                    const posSnap = await getDocs(posQuery);
                    if (!posSnap.empty) {
                        setPositionData({ id: posSnap.docs[0].id, ...posSnap.docs[0].data() });
                    }

                    const rulesSnap = await getDocs(collection(db, 'promotion_rules'));
                    const rule = rulesSnap.docs.find(d =>
                        d.data().currentPosition === posName
                    );
                    if (rule) {
                        setPromotionRule({ id: rule.id, ...rule.data() });
                    }
                }

                toast.success('✓', empData.name);
            } else {
                setNotFound(true);
                toast.error('No Encontrado', 'No existe empleado con ese ID');
            }
        } catch (error) {
            console.error('Error searching employee:', error);
            toast.error('Error', 'Error al buscar el empleado');
        } finally {
            setLoading(false);
        }
    }, [searchId, toast]);

    // Analyze training history
    const analyzeTraining = () => {
        if (!employee) return { approved: [], failed: [], pending: [], all: [] };

        const history = employee.history || [];
        const requiredCourses = positionData?.requiredCourses || [];

        const approved = [];
        const failed = [];

        history.forEach(record => {
            const courseName = record.courseName || record.course;
            const score = parseFloat(record.score) || parseFloat(record.qualification) || 0;
            const isApproved = record.status === 'approved' || (record.status === undefined && score >= 80);

            if (isApproved) {
                approved.push({ name: courseName, date: record.date, score });
            } else {
                failed.push({ name: courseName, date: record.date, score });
            }
        });

        const normalizeForMatch = (str) => (str || '')
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toUpperCase().trim();

        const passedNames = approved.map(c => normalizeForMatch(c.name));
        const pending = requiredCourses.filter(c =>
            !passedNames.includes(normalizeForMatch(c))
        );

        return { approved, failed, pending, all: history };
    };

    const getPromotionInfo = () => {
        if (!employee || !promotionRule) return null;
        return checkPromotionCriteria(employee, promotionRule);
    };

    const training = analyzeTraining();
    const promotionInfo = getPromotionInfo();
    const seniority = employee ? calculateSeniority(employee.startDate) : null;
    const monthsInPosition = employee?.promotionData?.positionStartDate
        ? calculateMonthsInPosition(employee.promotionData.positionStartDate)
        : 0;

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    {/* Minimal Header */}
                    <div className={styles.header}>
                        <Link href="/capacitacion" className={styles.backBtn}>
                            ← Capacitación
                        </Link>
                    </div>

                    {/* Search Section - Centered */}
                    <div className={styles.searchSection}>
                        <h1 className={styles.title}>Perfil de Empleado</h1>
                        <p className={styles.subtitle}>Ingresa el ID para consultar información</p>
                        <div className={styles.searchBox}>
                            <div className={styles.searchInputWrapper}>
                                <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="M21 21l-4.35-4.35" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="ID Empleado..."
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className={styles.searchInput}
                                />
                            </div>
                            <Button onClick={handleSearch} disabled={loading} className={styles.searchBtn}>
                                {loading ? '...' : 'Buscar'}
                            </Button>
                        </div>
                    </div>

                    {/* Not Found */}
                    {notFound && (
                        <div className={styles.notFound}>
                            <span className={styles.notFoundIcon}>🔍</span>
                            <p>No se encontró empleado con ID: <strong>{searchId}</strong></p>
                        </div>
                    )}

                    {/* Profile Content */}
                    {employee && (
                        <div className={styles.profileContent}>
                            {/* Profile Header Card */}
                            <div className={styles.profileHeader}>
                                <div className={styles.avatar}>
                                    {getInitials(employee.name)}
                                </div>
                                <div className={styles.profileInfo}>
                                    <h2 className={styles.employeeName}>{employee.name}</h2>
                                    <p className={styles.employeeId}>ID: {employee.employeeId || employee.id}</p>
                                    <div className={styles.positionBadge}>
                                        {employee.position || 'Sin Puesto'}
                                    </div>
                                </div>
                                {promotionInfo && (
                                    <div className={`${styles.eligibilityBadge} ${promotionInfo.overall?.eligible ? styles.eligible : styles.notEligible}`}>
                                        {promotionInfo.overall?.eligible ? '✨ Elegible' : `${promotionInfo.overall?.metCount}/4`}
                                    </div>
                                )}
                            </div>

                            {/* Quick Metrics */}
                            <div className={styles.metricsGrid}>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricIcon}>📅</span>
                                    <span className={styles.metricValue}>{seniority?.text || 'N/A'}</span>
                                    <span className={styles.metricLabel}>Antigüedad</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricIcon}>📊</span>
                                    <span className={styles.metricValue}>{employee.matrix?.compliancePercentage ?? 0}%</span>
                                    <span className={styles.metricLabel}>Matriz</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricIcon}>⭐</span>
                                    <span className={styles.metricValue}>
                                        {employee.performanceScore ?? employee.promotionData?.performanceScore ?? 'N/A'}
                                        {(employee.performanceScore || employee.promotionData?.performanceScore) ? '%' : ''}
                                    </span>
                                    <span className={styles.metricLabel}>Desempeño</span>
                                </div>
                                <div className={styles.metricCard}>
                                    <span className={styles.metricIcon}>⏱️</span>
                                    <span className={styles.metricValue}>{monthsInPosition}</span>
                                    <span className={styles.metricLabel}>Meses en Puesto</span>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className={styles.tabs}>
                                <button
                                    className={`${styles.tab} ${activeTab === 'personal' ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab('personal')}
                                >
                                    👤 Datos
                                </button>
                                <button
                                    className={`${styles.tab} ${activeTab === 'training' ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab('training')}
                                >
                                    📚 Capacitación
                                </button>
                                <button
                                    className={`${styles.tab} ${activeTab === 'promotion' ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab('promotion')}
                                >
                                    🎯 Promoción
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className={styles.tabContent}>
                                {/* Personal Data Tab */}
                                {activeTab === 'personal' && (
                                    <div className={styles.dataSection}>
                                        <div className={styles.dataGrid}>
                                            <div className={styles.dataItem}>
                                                <label>CURP</label>
                                                <span>{employee.curp || 'N/A'}</span>
                                            </div>
                                            <div className={styles.dataItem}>
                                                <label>Escolaridad</label>
                                                <span>{employee.education || 'N/A'}</span>
                                            </div>
                                            <div className={styles.dataItem}>
                                                <label>Especialidad</label>
                                                <span>{employee.specialty || 'N/A'}</span>
                                            </div>
                                            <div className={styles.dataItem}>
                                                <label>Fecha Ingreso</label>
                                                <span>{formatDate(employee.startDate) || 'N/A'}</span>
                                            </div>
                                            <div className={styles.dataItem}>
                                                <label>Departamento</label>
                                                <span>{employee.department || 'N/A'}</span>
                                            </div>
                                            <div className={styles.dataItem}>
                                                <label>Área</label>
                                                <span>{employee.area || 'N/A'}</span>
                                            </div>
                                            <div className={styles.dataItem}>
                                                <label>Turno</label>
                                                <span>{employee.shift || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Training Tab */}
                                {activeTab === 'training' && (
                                    <div className={styles.trainingSection}>
                                        {/* Stats */}
                                        <div className={styles.trainingStats}>
                                            <div className={`${styles.trainingStat} ${styles.statGreen}`}>
                                                <span>{training.approved.length}</span>
                                                <label>Aprobados</label>
                                            </div>
                                            <div className={`${styles.trainingStat} ${styles.statRed}`}>
                                                <span>{training.failed.length}</span>
                                                <label>Reprobados</label>
                                            </div>
                                            <div className={`${styles.trainingStat} ${styles.statYellow}`}>
                                                <span>{training.pending.length}</span>
                                                <label>Pendientes</label>
                                            </div>
                                        </div>

                                        {/* Course Lists */}
                                        {training.approved.length > 0 && (
                                            <div className={styles.courseGroup}>
                                                <h4>✓ Aprobados</h4>
                                                {training.approved.map((c, i) => (
                                                    <div key={i} className={`${styles.courseRow} ${styles.courseApproved}`}>
                                                        <span className={styles.courseName}>{c.name}</span>
                                                        <span className={styles.courseScore}>{c.score}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {training.failed.length > 0 && (
                                            <div className={styles.courseGroup}>
                                                <h4>✗ Reprobados</h4>
                                                {training.failed.map((c, i) => (
                                                    <div key={i} className={`${styles.courseRow} ${styles.courseFailed}`}>
                                                        <span className={styles.courseName}>{c.name}</span>
                                                        <span className={styles.courseScore}>{c.score}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {training.pending.length > 0 && (
                                            <div className={styles.courseGroup}>
                                                <h4>⏳ Pendientes</h4>
                                                {training.pending.map((c, i) => (
                                                    <div key={i} className={`${styles.courseRow} ${styles.coursePending}`}>
                                                        <span className={styles.courseName}>{c}</span>
                                                        <span className={styles.courseStatus}>Pendiente</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Promotion Tab */}
                                {activeTab === 'promotion' && (
                                    <div className={styles.promotionSection}>
                                        {promotionRule ? (
                                            <>
                                                <div className={styles.promotionPath}>
                                                    <span className={styles.currentPos}>{employee.position}</span>
                                                    <span className={styles.arrow}>→</span>
                                                    <span className={styles.nextPos}>{promotionRule.promotionTo}</span>
                                                </div>

                                                <div className={styles.criteriaList}>
                                                    <div className={`${styles.criteriaItem} ${promotionInfo?.temporality?.met ? styles.met : styles.notMet}`}>
                                                        <span className={styles.criteriaCheck}>
                                                            {promotionInfo?.temporality?.met ? '✓' : '✗'}
                                                        </span>
                                                        <div className={styles.criteriaInfo}>
                                                            <span className={styles.criteriaName}>Temporalidad</span>
                                                            <span className={styles.criteriaDetail}>
                                                                {monthsInPosition} / {promotionRule.temporalityMonths || 6} meses
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className={`${styles.criteriaItem} ${promotionInfo?.matrix?.met ? styles.met : styles.notMet}`}>
                                                        <span className={styles.criteriaCheck}>
                                                            {promotionInfo?.matrix?.met ? '✓' : '✗'}
                                                        </span>
                                                        <div className={styles.criteriaInfo}>
                                                            <span className={styles.criteriaName}>Matriz de Capacitación</span>
                                                            <span className={styles.criteriaDetail}>
                                                                {employee.matrix?.compliancePercentage ?? 0}% / {promotionRule.matrixMinCoverage || 60}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className={`${styles.criteriaItem} ${promotionInfo?.performance?.met ? styles.met : styles.notMet}`}>
                                                        <span className={styles.criteriaCheck}>
                                                            {promotionInfo?.performance?.met ? '✓' : '✗'}
                                                        </span>
                                                        <div className={styles.criteriaInfo}>
                                                            <span className={styles.criteriaName}>Evaluación Desempeño</span>
                                                            <span className={styles.criteriaDetail}>
                                                                {employee.promotionData?.performanceScore || 0}% / {promotionRule.performanceMinScore || 80}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className={`${styles.criteriaItem} ${promotionInfo?.exam?.met ? styles.met : styles.notMet}`}>
                                                        <span className={styles.criteriaCheck}>
                                                            {promotionInfo?.exam?.met ? '✓' : '✗'}
                                                        </span>
                                                        <div className={styles.criteriaInfo}>
                                                            <span className={styles.criteriaName}>Examen de Promoción</span>
                                                            <span className={styles.criteriaDetail}>
                                                                {employee.promotionData?.examAttempts?.length > 0
                                                                    ? `${employee.promotionData.examAttempts[employee.promotionData.examAttempts.length - 1].score}%`
                                                                    : 'Sin aplicar'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className={styles.noRules}>
                                                <span className={styles.noRulesIcon}>ℹ️</span>
                                                <p>Este puesto no tiene reglas de promoción configuradas</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
