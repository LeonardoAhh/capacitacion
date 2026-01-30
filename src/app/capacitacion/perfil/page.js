'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Badge } from '@/components/ui/Badge/Badge';
import { useToast } from '@/components/ui/Toast/Toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
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

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

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
            <main className={styles.main} id="main-content">
                <div className={styles.container}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div>
                            <h1 className={styles.title}>Perfil de Empleado</h1>
                            <p className={styles.subtitle}>Buscar y consultar información detallada</p>
                        </div>
                        <Link href="/capacitacion" className={styles.backBtn}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Capacitación
                        </Link>
                    </div>

                    {/* Search */}
                    <div className={styles.searchCard}>
                        <div className={styles.searchInputWrapper}>
                            <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Ingresa ID de empleado..."
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className={styles.searchInput}
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={loading}>
                            {loading ? 'Buscando...' : 'Buscar'}
                        </Button>
                    </div>

                    {/* Not Found */}
                    {notFound && (
                        <div className={styles.notFound}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                                <path d="M8 8l6 6M14 8l-6 6" />
                            </svg>
                            <p>No se encontró empleado con ID: <strong>{searchId}</strong></p>
                        </div>
                    )}

                    {/* Profile Content */}
                    {employee && (
                        <div className={styles.profileContent}>
                            {/* Profile Header */}
                            <div className={styles.profileHeader}>
                                <div className={styles.profileLeft}>
                                    <Avatar name={employee.name} src={employee.photoUrl} size="lg" />
                                    <div className={styles.profileInfo}>
                                        <h2>{employee.name}</h2>
                                        <p className={styles.employeeId}>ID: {employee.employeeId || employee.id}</p>
                                        <span className={styles.positionBadge}>{employee.position || 'Sin Puesto'}</span>
                                    </div>
                                </div>
                                {promotionInfo && (
                                    <div className={`${styles.eligibilityBadge} ${promotionInfo.overall?.eligible ? styles.eligible : styles.notEligible}`}>
                                        {promotionInfo.overall?.eligible ? (
                                            <>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                                Elegible
                                            </>
                                        ) : (
                                            `${promotionInfo.overall?.metCount}/4 criterios`
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Quick Metrics */}
                            <div className={styles.metricsGrid}>
                                <div className={styles.metricCard}>
                                    <div className={`${styles.metricIcon} ${styles.iconBlue}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                    </div>
                                    <div className={styles.metricContent}>
                                        <span className={styles.metricValue}>{seniority?.text || 'N/A'}</span>
                                        <span className={styles.metricLabel}>Antigüedad</span>
                                    </div>
                                </div>
                                <div className={styles.metricCard}>
                                    <div className={`${styles.metricIcon} ${styles.iconPurple}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                                            <path d="M22 12A10 10 0 0 0 12 2v10z" />
                                        </svg>
                                    </div>
                                    <div className={styles.metricContent}>
                                        <span className={styles.metricValue}>{employee.matrix?.compliancePercentage ?? 0}%</span>
                                        <span className={styles.metricLabel}>Matriz</span>
                                    </div>
                                </div>
                                <div className={styles.metricCard}>
                                    <div className={`${styles.metricIcon} ${styles.iconGreen}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                        </svg>
                                    </div>
                                    <div className={styles.metricContent}>
                                        <span className={styles.metricValue}>
                                            {employee.performanceScore ?? employee.promotionData?.performanceScore ?? 'N/A'}
                                            {(employee.performanceScore || employee.promotionData?.performanceScore) ? '%' : ''}
                                        </span>
                                        <span className={styles.metricLabel}>Desempeño</span>
                                    </div>
                                </div>
                                <div className={styles.metricCard}>
                                    <div className={`${styles.metricIcon} ${styles.iconOrange}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                    </div>
                                    <div className={styles.metricContent}>
                                        <span className={styles.metricValue}>{monthsInPosition}</span>
                                        <span className={styles.metricLabel}>Meses en Puesto</span>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className={styles.tabs}>
                                <button
                                    className={`${styles.tab} ${activeTab === 'personal' ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab('personal')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Datos
                                </button>
                                <button
                                    className={`${styles.tab} ${activeTab === 'training' ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab('training')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                    Capacitación
                                </button>
                                <button
                                    className={`${styles.tab} ${activeTab === 'promotion' ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab('promotion')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
                                    </svg>
                                    Promoción
                                </button>
                                <button
                                    className={`${styles.tab} ${activeTab === 'iluo' ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab('iluo')}
                                    style={activeTab === 'iluo' ? { color: '#AF52DE', borderColor: '#AF52DE', background: 'rgba(175, 82, 222, 0.05)' } : {}}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                    </svg>
                                    Habilidades
                                </button>
                                <button
                                    className={`${styles.tab} ${activeTab === 'documents' ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab('documents')}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                    Documentos
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className={styles.tabContent}>
                                {/* Personal Data Tab */}
                                {activeTab === 'personal' && (
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
                                )}

                                {/* Training Tab */}
                                {activeTab === 'training' && (
                                    <div className={styles.trainingSection}>
                                        <div className={styles.trainingStats}>
                                            <div className={`${styles.trainingStat} ${styles.statGreen}`}>
                                                <span className={styles.statValue}>{training.approved.length}</span>
                                                <span className={styles.statLabel}>Aprobados</span>
                                            </div>
                                            <div className={`${styles.trainingStat} ${styles.statRed}`}>
                                                <span className={styles.statValue}>{training.failed.length}</span>
                                                <span className={styles.statLabel}>Reprobados</span>
                                            </div>
                                            <div className={`${styles.trainingStat} ${styles.statYellow}`}>
                                                <span className={styles.statValue}>{training.pending.length}</span>
                                                <span className={styles.statLabel}>Pendientes</span>
                                            </div>
                                        </div>

                                        {training.approved.length > 0 && (
                                            <div className={styles.courseGroup}>
                                                <h4>Aprobados</h4>
                                                <div className={styles.courseList}>
                                                    {training.approved.map((c, i) => (
                                                        <div key={i} className={`${styles.courseRow} ${styles.courseApproved}`}>
                                                            <span className={styles.courseName}>{c.name}</span>
                                                            <span className={styles.courseScore}>{c.score}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {training.failed.length > 0 && (
                                            <div className={styles.courseGroup}>
                                                <h4>Reprobados</h4>
                                                <div className={styles.courseList}>
                                                    {training.failed.map((c, i) => (
                                                        <div key={i} className={`${styles.courseRow} ${styles.courseFailed}`}>
                                                            <span className={styles.courseName}>{c.name}</span>
                                                            <span className={styles.courseScore}>{c.score}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {training.pending.length > 0 && (
                                            <div className={styles.courseGroup}>
                                                <h4>Pendientes</h4>
                                                <div className={styles.courseList}>
                                                    {training.pending.map((c, i) => (
                                                        <div key={i} className={`${styles.courseRow} ${styles.coursePending}`}>
                                                            <span className={styles.courseName}>{c}</span>
                                                            <span className={styles.courseStatus}>Pendiente</span>
                                                        </div>
                                                    ))}
                                                </div>
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
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                                    </svg>
                                                    <span className={styles.nextPos}>{promotionRule.promotionTo}</span>
                                                </div>

                                                <div className={styles.criteriaList}>
                                                    <div className={`${styles.criteriaItem} ${promotionInfo?.temporality?.met ? styles.met : styles.notMet}`}>
                                                        <div className={styles.criteriaCheck}>
                                                            {promotionInfo?.temporality?.met ? '✓' : '✗'}
                                                        </div>
                                                        <div className={styles.criteriaInfo}>
                                                            <span className={styles.criteriaName}>Temporalidad</span>
                                                            <span className={styles.criteriaDetail}>
                                                                {monthsInPosition} / {promotionRule.temporalityMonths || 6} meses
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className={`${styles.criteriaItem} ${promotionInfo?.matrix?.met ? styles.met : styles.notMet}`}>
                                                        <div className={styles.criteriaCheck}>
                                                            {promotionInfo?.matrix?.met ? '✓' : '✗'}
                                                        </div>
                                                        <div className={styles.criteriaInfo}>
                                                            <span className={styles.criteriaName}>Matriz de Capacitación</span>
                                                            <span className={styles.criteriaDetail}>
                                                                {employee.matrix?.compliancePercentage ?? 0}% / {promotionInfo?.matrix?.required ?? promotionRule.matrixMinCoverage ?? 90}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className={`${styles.criteriaItem} ${promotionInfo?.performance?.met ? styles.met : styles.notMet}`}>
                                                        <div className={styles.criteriaCheck}>
                                                            {promotionInfo?.performance?.met ? '✓' : '✗'}
                                                        </div>
                                                        <div className={styles.criteriaInfo}>
                                                            <span className={styles.criteriaName}>Evaluación Desempeño</span>
                                                            <span className={styles.criteriaDetail}>
                                                                {employee.promotionData?.performanceScore || 0}% / {promotionRule.performanceMinScore || 80}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className={`${styles.criteriaItem} ${promotionInfo?.exam?.met ? styles.met : styles.notMet}`}>
                                                        <div className={styles.criteriaCheck}>
                                                            {promotionInfo?.exam?.met ? '✓' : '✗'}
                                                        </div>
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
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="8" x2="12" y2="12" />
                                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                                </svg>
                                                <p>Este puesto no tiene reglas de promoción configuradas</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Documents Tab */}
                                {activeTab === 'documents' && (
                                    <div className={styles.documentsSection}>
                                        {employee.documents && employee.documents.length > 0 ? (
                                            <div className={styles.gridDocs}>
                                                {employee.documents.map((doc, index) => {
                                                    // Determinar tipo de documento basado en el nombre
                                                    const name = doc.name.toLowerCase();
                                                    let icon, bgColor, color;

                                                    if (name.includes('dc-3') || name.includes('dc3') || name.includes('dc 3')) {
                                                        // DC-3: Naranja - Estilo Oficial
                                                        bgColor = 'rgba(249, 115, 22, 0.1)';
                                                        color = '#f97316';
                                                        icon = (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                <path d="M14 2v6h6" />
                                                                <path d="M16 13H8" />
                                                                <path d="M16 17H8" />
                                                                <path d="M10 9H8" />
                                                            </svg>
                                                        );
                                                    } else if (name.includes('diploma') || name.includes('constancia') || name.includes('certificado') || name.includes('reconocimiento')) {
                                                        // Diploma: Dorado - Estilo Premio
                                                        bgColor = 'rgba(234, 179, 8, 0.1)';
                                                        color = '#eab308';
                                                        icon = (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <circle cx="12" cy="8" r="7" />
                                                                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                                                            </svg>
                                                        );
                                                    } else if (name.includes('examen') || name.includes('evaluacion') || name.includes('lista') || name.includes('kardex')) {
                                                        // Listas/Examenes: Azul/Verde - Estilo Check
                                                        bgColor = 'rgba(34, 197, 94, 0.1)';
                                                        color = '#22c55e';
                                                        icon = (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M9 11l3 3L22 4" />
                                                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                                            </svg>
                                                        );
                                                    } else {
                                                        // Default: Azul - Estilo Archivo
                                                        bgColor = 'rgba(59, 130, 246, 0.1)';
                                                        color = '#3b82f6';
                                                        icon = (
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                <path d="M14 2v6h6" />
                                                            </svg>
                                                        );
                                                    }

                                                    return (
                                                        <div key={index} className={styles.documentCard}>
                                                            <div className={styles.documentIcon} style={{ background: bgColor, color: color }}>
                                                                {icon}
                                                            </div>
                                                            <div className={styles.documentInfo}>
                                                                <p className={styles.documentName} title={doc.name}>{doc.name}</p>
                                                                <p className={styles.documentDate}>{new Date(doc.uploadDate).toLocaleDateString()}</p>
                                                            </div>
                                                            <a
                                                                href={doc.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={styles.documentLink}
                                                                style={{ color: color, background: bgColor }}
                                                            >
                                                                Ver
                                                            </a>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className={styles.emptyStateDocs}>
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <path d="M14 2v6h6" />
                                                </svg>
                                                <p>No hay documentos cargados para este empleado.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ILUO Skills Tab Content */}
                                {activeTab === 'iluo' && (
                                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                                        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h2 className={styles.cardTitle}>Matriz de Habilidades Prácticas</h2>
                                            {positionData?.iluoSkills?.length > 0 && (
                                                <Badge variant="purple">{positionData.iluoSkills.length} Habilidades</Badge>
                                            )}
                                        </div>

                                        {!positionData?.iluoSkills || positionData.iluoSkills.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                                                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📋</div>
                                                <h3 style={{ margin: '0 0 10px 0' }}>Matriz No Configurada</h3>
                                                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                                                    El puesto <strong>{employee.position}</strong> aún no tiene habilidades ILUO definidas.
                                                </p>
                                                <Link href="/iluo-manager">
                                                    <Button variant="secondary">Ir al Configurador</Button>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="iluo-grouped-container">
                                                {(() => {
                                                    /* Agrupación ILUO v2 */
                                                    const groups = {};
                                                    positionData.iluoSkills.forEach(s => {
                                                        const g = s.group || 'General';
                                                        if (!groups[g]) groups[g] = [];
                                                        groups[g].push(s);
                                                    });

                                                    const sortedKeys = Object.keys(groups).sort((a, b) =>
                                                        a === 'General' ? -1 : b === 'General' ? 1 : a.localeCompare(b));

                                                    return sortedKeys.map(groupName => (
                                                        <div key={groupName} style={{ marginBottom: '40px' }}>
                                                            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span style={{ width: '4px', height: '20px', background: '#AF52DE', borderRadius: '2px' }}></span>
                                                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{groupName}</h3>
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                                                {groups[groupName].map((skill) => {
                                                                    /* Fin Agrupación - Contenido Original Modificado */
                                                                    const currentRating = employee.iluoRatings?.[skill.id] || null;

                                                                    // Map colors
                                                                    const colors = {
                                                                        I: { bg: '#fee2e2', text: '#ef4444', label: 'Aprendiz' },
                                                                        L: { bg: '#fef9c3', text: '#eab308', label: 'En Desarrollo' },
                                                                        U: { bg: '#dcfce7', text: '#22c55e', label: 'Autónomo' },
                                                                        O: { bg: '#dbeafe', text: '#3b82f6', label: 'Experto' }
                                                                    };

                                                                    return (
                                                                        <div key={skill.id} style={{
                                                                            background: 'var(--bg-secondary)',
                                                                            borderRadius: '16px',
                                                                            padding: '20px',
                                                                            border: '1px solid var(--border-color)',
                                                                            display: 'flex', flexDirection: 'column', gap: '15px'
                                                                        }}>
                                                                            <div>
                                                                                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#AF52DE', fontWeight: 'bold' }}>{skill.category}</span>
                                                                                <h4 style={{ margin: '5px 0 0 0', fontSize: '1.05rem' }}>{skill.name}</h4>
                                                                                {skill.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>{skill.description}</p>}
                                                                            </div>

                                                                            {/* Rating Buttons */}
                                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px', background: 'var(--bg-primary)', padding: '5px', borderRadius: '10px' }}>
                                                                                {['I', 'L', 'U', 'O'].map((level) => {
                                                                                    const isActive = currentRating === level;
                                                                                    const color = colors[level];
                                                                                    return (
                                                                                        <button
                                                                                            key={level}
                                                                                            onClick={async () => {
                                                                                                // 1. Optimistic Update
                                                                                                const newRatings = { ...employee.iluoRatings, [skill.id]: level };
                                                                                                setEmployee({ ...employee, iluoRatings: newRatings });

                                                                                                // 2. Save
                                                                                                try {
                                                                                                    const empRef = doc(db, 'training_records', employee.id);
                                                                                                    await updateDoc(empRef, {
                                                                                                        [`iluoRatings.${skill.id}`]: level
                                                                                                    });
                                                                                                    toast.success('Guardado');
                                                                                                } catch (e) {
                                                                                                    toast.error('Error');
                                                                                                    console.error(e);
                                                                                                }
                                                                                            }}
                                                                                            style={{
                                                                                                background: isActive ? color.bg : 'transparent',
                                                                                                color: isActive ? color.text : 'var(--text-secondary)',
                                                                                                border: 'none',
                                                                                                borderRadius: '6px',
                                                                                                padding: '8px 0',
                                                                                                cursor: 'pointer',
                                                                                                fontWeight: 'bold',
                                                                                                transition: 'all 0.2s'
                                                                                            }}
                                                                                        >
                                                                                            {level}
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>

                                                                            {/* Legend */}
                                                                            <div style={{
                                                                                textAlign: 'center',
                                                                                fontSize: '0.8rem',
                                                                                color: currentRating ? colors[currentRating].text : 'var(--text-tertiary)',
                                                                                fontWeight: '500',
                                                                                minHeight: '1.2em'
                                                                            }}>
                                                                                {currentRating ? colors[currentRating].label : '-- Sin Evaluar --'}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
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
