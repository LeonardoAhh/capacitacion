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

    // View state for slide navigation
    const [activeView, setActiveView] = useState('profile'); // 'profile' | 'training' | 'promotion' | 'iluo' | 'documents'

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
        setActiveView('profile');

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

    // Navigate to detail view with slide animation
    const navigateTo = (view) => {
        setActiveView(view);
    };

    const goBack = () => {
        setActiveView('profile');
    };

    // Chevron Icon Component
    const ChevronRight = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );

    return (
        <>
            <Navbar />
            <main className={styles.main} id="main-content">
                {/* Background */}
                <div className={styles.bgDecoration}>
                    <div className={`${styles.blob} ${styles.blob1}`}></div>
                    <div className={`${styles.blob} ${styles.blob2}`}></div>
                </div>

                <div className={styles.container}>
                    {/* Header with Back Button */}
                    <div className={styles.pageHeader}>
                        <Link href="/capacitacion" className={styles.headerBackLink}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Capacitación
                        </Link>
                        <h1 className={styles.pageTitle}>Perfil de Empleado</h1>
                    </div>

                    {/* Search Card - Always visible */}
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

                    {/* Not Found State */}
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

                    {/* Profile Content with Slide Navigation */}
                    {employee && (
                        <div className={`${styles.slideContainer} ${styles.twoColumnLayout}`}>
                            {/* Main Profile View */}
                            <div className={`${styles.slidePanel} ${styles.leftColumn} ${activeView === 'profile' ? styles.active : styles.slideOut}`}>
                                {/* iOS Style Profile Header */}
                                <div className={styles.profileHeaderCard}>
                                    <Link href="/capacitacion" className={styles.backLink}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 12H5" />
                                            <polyline points="12 19 5 12 12 5" />
                                        </svg>
                                        Capacitación
                                    </Link>

                                    <div className={styles.avatarSection}>
                                        <div className={styles.avatarLarge}>
                                            {employee.photoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={employee.photoUrl} alt={employee.name} referrerPolicy="no-referrer" />
                                            ) : (
                                                <span>{getInitials(employee.name)}</span>
                                            )}
                                        </div>
                                        <h1 className={styles.employeeName}>{employee.name}</h1>
                                        <p className={styles.employeeIdText}>ID: {employee.employeeId || employee.id}</p>
                                    </div>
                                </div>

                                {/* Settings Group: Información Personal */}
                                <div className={styles.settingsGroup}>
                                    <h3 className={styles.settingsGroupTitle}>Información Personal</h3>
                                    <div className={styles.settingsCard}>
                                        <div className={styles.settingsItem}>
                                            <div className={`${styles.settingsIcon} ${styles.iconBlue}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h4M7 12h10M7 16h6" /></svg>
                                            </div>
                                            <span className={styles.settingsLabel}>CURP</span>
                                            <span className={styles.settingsValue}>{employee.curp || 'N/A'}</span>
                                        </div>
                                        <div className={styles.settingsItem}>
                                            <div className={`${styles.settingsIcon} ${styles.iconPurple}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                                            </div>
                                            <span className={styles.settingsLabel}>Escolaridad</span>
                                            <span className={styles.settingsValue}>{employee.education || 'N/A'}</span>
                                        </div>
                                        <div className={styles.settingsItem}>
                                            <div className={`${styles.settingsIcon} ${styles.iconGreen}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                            </div>
                                            <span className={styles.settingsLabel}>Fecha Ingreso</span>
                                            <span className={styles.settingsValue}>{formatDate(employee.startDate) || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Settings Group: Información Laboral */}
                                <div className={styles.settingsGroup}>
                                    <h3 className={styles.settingsGroupTitle}>Información Laboral</h3>
                                    <div className={styles.settingsCard}>
                                        <div className={styles.settingsItem}>
                                            <div className={`${styles.settingsIcon} ${styles.iconOrange}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
                                            </div>
                                            <span className={styles.settingsLabel}>Puesto</span>
                                            <span className={styles.settingsValue}>{employee.position || 'N/A'}</span>
                                        </div>
                                        <div className={styles.settingsItem}>
                                            <div className={`${styles.settingsIcon} ${styles.iconBlue}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18" /><path d="M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1" /><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" /></svg>
                                            </div>
                                            <span className={styles.settingsLabel}>Departamento</span>
                                            <span className={styles.settingsValue}>{employee.department || 'N/A'}</span>
                                        </div>
                                        <div className={styles.settingsItem}>
                                            <div className={`${styles.settingsIcon} ${styles.iconPink}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                            </div>
                                            <span className={styles.settingsLabel}>Área</span>
                                            <span className={styles.settingsValue}>{employee.area || 'N/A'}</span>
                                        </div>
                                        <div className={styles.settingsItem}>
                                            <div className={`${styles.settingsIcon} ${styles.iconTeal}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            </div>
                                            <span className={styles.settingsLabel}>Turno</span>
                                            <span className={styles.settingsValue}>{employee.shift || 'N/A'}</span>
                                        </div>
                                        <div className={styles.settingsItem}>
                                            <div className={`${styles.settingsIcon} ${styles.iconGreen}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" /></svg>
                                            </div>
                                            <span className={styles.settingsLabel}>Antigüedad</span>
                                            <span className={styles.settingsValue}>{seniority?.text || 'N/A'}</span>
                                        </div>
                                        <div className={styles.settingsItem}>
                                            <div className={`${styles.settingsIcon} ${styles.iconPurple}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
                                            </div>
                                            <span className={styles.settingsLabel}>Desempeño</span>
                                            <span className={styles.settingsValue}>
                                                {employee.promotionData?.performanceScore ? `${employee.promotionData.performanceScore}%` : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Settings Group: Acciones Rápidas */}
                                <div className={styles.settingsGroup}>
                                    <h3 className={styles.settingsGroupTitle}>Información Detallada</h3>
                                    <div className={styles.settingsCard}>
                                        <button className={styles.settingsItem} onClick={() => navigateTo('training')}>
                                            <div className={`${styles.settingsIcon} ${styles.iconBlue}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                            </div>
                                            <span className={styles.settingsLabel}>Capacitación</span>
                                            <span className={styles.settingsValue}>
                                                {training.approved.length} aprobados
                                            </span>
                                            <ChevronRight />
                                        </button>
                                        <button className={styles.settingsItem} onClick={() => navigateTo('promotion')}>
                                            <div className={`${styles.settingsIcon} ${styles.iconGreen}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" /></svg>
                                            </div>
                                            <span className={styles.settingsLabel}>Promoción</span>
                                            <span className={styles.settingsValue}>
                                                {promotionInfo?.overall?.eligible ? 'Elegible' : `${promotionInfo?.overall?.metCount || 0}/4 criterios`}
                                            </span>
                                            <ChevronRight />
                                        </button>
                                        <button className={styles.settingsItem} onClick={() => navigateTo('iluo')}>
                                            <div className={`${styles.settingsIcon} ${styles.iconPurple}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                                            </div>
                                            <span className={styles.settingsLabel}>Habilidades ILUO</span>
                                            <span className={styles.settingsValue}>
                                                {positionData?.iluoSkills?.length || 0} habilidades
                                            </span>
                                            <ChevronRight />
                                        </button>
                                        <button className={styles.settingsItem} onClick={() => navigateTo('documents')}>
                                            <div className={`${styles.settingsIcon} ${styles.iconOrange}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                            </div>
                                            <span className={styles.settingsLabel}>Documentos</span>
                                            <span className={styles.settingsValue}>
                                                {employee.documents?.length || 0} archivos
                                            </span>
                                            <ChevronRight />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Detail View: Training */}
                            <div className={`${styles.slidePanel} ${activeView === 'training' ? styles.active : styles.slideIn}`}>
                                <div className={styles.detailHeader}>
                                    <button className={styles.backButton} onClick={goBack}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 12H5" />
                                            <polyline points="12 19 5 12 12 5" />
                                        </svg>
                                        Perfil
                                    </button>
                                    <h2 className={styles.detailTitle}>Capacitación</h2>
                                </div>

                                <div className={styles.detailContent}>
                                    {/* Training Stats */}
                                    <div className={styles.statsRow}>
                                        <div className={`${styles.statCard} ${styles.statGreen}`}>
                                            <span className={styles.statNumber}>{training.approved.length}</span>
                                            <span className={styles.statLabel}>Aprobados</span>
                                        </div>
                                        <div className={`${styles.statCard} ${styles.statRed}`}>
                                            <span className={styles.statNumber}>{training.failed.length}</span>
                                            <span className={styles.statLabel}>Reprobados</span>
                                        </div>
                                        <div className={`${styles.statCard} ${styles.statYellow}`}>
                                            <span className={styles.statNumber}>{training.pending.length}</span>
                                            <span className={styles.statLabel}>Pendientes</span>
                                        </div>
                                    </div>

                                    {/* Matrix Compliance */}
                                    <div className={styles.settingsCard} style={{ marginBottom: '16px' }}>
                                        <div className={styles.settingsItem}>
                                            <div className={`${styles.settingsIcon} ${styles.iconPurple}`}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
                                            </div>
                                            <span className={styles.settingsLabel}>Cumplimiento Matriz</span>
                                            <span className={styles.settingsValue}>{employee.matrix?.compliancePercentage ?? 0}%</span>
                                        </div>
                                    </div>

                                    {/* Course Lists */}
                                    {training.approved.length > 0 && (
                                        <div className={styles.courseSection}>
                                            <h4 className={styles.courseSectionTitle}>✓ Aprobados</h4>
                                            <div className={styles.settingsCard}>
                                                {training.approved.map((c, i) => (
                                                    <div key={i} className={styles.courseItem}>
                                                        <span className={styles.courseName}>{c.name}</span>
                                                        <span className={styles.courseScore} style={{ color: '#22c55e' }}>{c.score}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {training.failed.length > 0 && (
                                        <div className={styles.courseSection}>
                                            <h4 className={styles.courseSectionTitle}>✗ Reprobados</h4>
                                            <div className={styles.settingsCard}>
                                                {training.failed.map((c, i) => (
                                                    <div key={i} className={styles.courseItem}>
                                                        <span className={styles.courseName}>{c.name}</span>
                                                        <span className={styles.courseScore} style={{ color: '#ef4444' }}>{c.score}%</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {training.pending.length > 0 && (
                                        <div className={styles.courseSection}>
                                            <h4 className={styles.courseSectionTitle}>⏳ Pendientes</h4>
                                            <div className={styles.settingsCard}>
                                                {training.pending.map((c, i) => (
                                                    <div key={i} className={styles.courseItem}>
                                                        <span className={styles.courseName}>{c}</span>
                                                        <span className={styles.courseScore} style={{ color: '#f59e0b' }}>Pendiente</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detail View: Promotion */}
                            <div className={`${styles.slidePanel} ${activeView === 'promotion' ? styles.active : styles.slideIn}`}>
                                <div className={styles.detailHeader}>
                                    <button className={styles.backButton} onClick={goBack}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 12H5" />
                                            <polyline points="12 19 5 12 12 5" />
                                        </svg>
                                        Perfil
                                    </button>
                                    <h2 className={styles.detailTitle}>Promoción</h2>
                                </div>

                                <div className={styles.detailContent}>
                                    {promotionRule ? (
                                        <>
                                            {/* Promotion Path */}
                                            <div className={styles.promotionPath}>
                                                <div className={styles.positionBadge}>{employee.position}</div>
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2">
                                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                                </svg>
                                                <div className={styles.positionBadge}>{promotionRule.promotionTo}</div>
                                            </div>

                                            {/* Criteria List */}
                                            <div className={styles.settingsCard}>
                                                <div className={`${styles.criteriaItem} ${promotionInfo?.temporality?.met ? styles.criteriaMet : styles.criteriaNotMet}`}>
                                                    <div className={styles.criteriaCheck}>
                                                        {promotionInfo?.temporality?.met ? '✓' : '✗'}
                                                    </div>
                                                    <div className={styles.criteriaInfo}>
                                                        <span className={styles.criteriaName}>Temporalidad</span>
                                                        <span className={styles.criteriaDetail}>{monthsInPosition} / {promotionRule.temporalityMonths || 6} meses</span>
                                                    </div>
                                                </div>
                                                <div className={`${styles.criteriaItem} ${promotionInfo?.matrix?.met ? styles.criteriaMet : styles.criteriaNotMet}`}>
                                                    <div className={styles.criteriaCheck}>
                                                        {promotionInfo?.matrix?.met ? '✓' : '✗'}
                                                    </div>
                                                    <div className={styles.criteriaInfo}>
                                                        <span className={styles.criteriaName}>Matriz de Capacitación</span>
                                                        <span className={styles.criteriaDetail}>{employee.matrix?.compliancePercentage ?? 0}% / {promotionRule.matrixMinCoverage ?? 90}%</span>
                                                    </div>
                                                </div>
                                                <div className={`${styles.criteriaItem} ${promotionInfo?.performance?.met ? styles.criteriaMet : styles.criteriaNotMet}`}>
                                                    <div className={styles.criteriaCheck}>
                                                        {promotionInfo?.performance?.met ? '✓' : '✗'}
                                                    </div>
                                                    <div className={styles.criteriaInfo}>
                                                        <span className={styles.criteriaName}>Evaluación Desempeño</span>
                                                        <span className={styles.criteriaDetail}>{employee.promotionData?.performanceScore || 0}% / {promotionRule.performanceMinScore || 80}%</span>
                                                    </div>
                                                </div>
                                                <div className={`${styles.criteriaItem} ${promotionInfo?.exam?.met ? styles.criteriaMet : styles.criteriaNotMet}`}>
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
                                        <div className={styles.emptyState}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                            </svg>
                                            <p>Este puesto no tiene reglas de promoción configuradas</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detail View: ILUO */}
                            <div className={`${styles.slidePanel} ${activeView === 'iluo' ? styles.active : styles.slideIn}`}>
                                <div className={styles.detailHeader}>
                                    <button className={styles.backButton} onClick={goBack}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 12H5" />
                                            <polyline points="12 19 5 12 12 5" />
                                        </svg>
                                        Perfil
                                    </button>
                                    <h2 className={styles.detailTitle}>Habilidades ILUO</h2>
                                </div>

                                <div className={styles.detailContent}>
                                    {!positionData?.iluoSkills || positionData.iluoSkills.length === 0 ? (
                                        <div className={styles.emptyState}>
                                            <span style={{ fontSize: '3rem' }}>📋</span>
                                            <h3>Matriz No Configurada</h3>
                                            <p>El puesto <strong>{employee.position}</strong> no tiene habilidades ILUO definidas.</p>
                                            <Link href="/iluo-manager">
                                                <Button variant="secondary">Ir al Configurador</Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className={styles.iluoGrid}>
                                            {positionData.iluoSkills.map((skill) => {
                                                const currentRating = employee.iluoRatings?.[skill.id] || null;
                                                const colors = {
                                                    I: { bg: '#fee2e2', text: '#ef4444', label: 'Aprendiz' },
                                                    L: { bg: '#fef9c3', text: '#eab308', label: 'En Desarrollo' },
                                                    U: { bg: '#dcfce7', text: '#22c55e', label: 'Autónomo' },
                                                    O: { bg: '#dbeafe', text: '#3b82f6', label: 'Experto' }
                                                };

                                                return (
                                                    <div key={skill.id} className={styles.iluoCard}>
                                                        <div className={styles.iluoHeader}>
                                                            <span className={styles.iluoCategory}>{skill.category}</span>
                                                            <h4 className={styles.iluoName}>{skill.name}</h4>
                                                        </div>
                                                        <div className={styles.iluoButtons}>
                                                            {['I', 'L', 'U', 'O'].map((level) => {
                                                                const isActive = currentRating === level;
                                                                const color = colors[level];
                                                                return (
                                                                    <button
                                                                        key={level}
                                                                        onClick={async () => {
                                                                            const newRatings = { ...employee.iluoRatings, [skill.id]: level };
                                                                            setEmployee({ ...employee, iluoRatings: newRatings });
                                                                            try {
                                                                                const empRef = doc(db, 'training_records', employee.id);
                                                                                await updateDoc(empRef, { [`iluoRatings.${skill.id}`]: level });
                                                                                toast.success('Guardado');
                                                                            } catch (e) {
                                                                                toast.error('Error');
                                                                            }
                                                                        }}
                                                                        className={styles.iluoBtn}
                                                                        style={{
                                                                            background: isActive ? color.bg : 'transparent',
                                                                            color: isActive ? color.text : 'var(--text-tertiary)'
                                                                        }}
                                                                    >
                                                                        {level}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className={styles.iluoStatus} style={{ color: currentRating ? colors[currentRating].text : 'var(--text-tertiary)' }}>
                                                            {currentRating ? colors[currentRating].label : 'Sin Evaluar'}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detail View: Documents */}
                            <div className={`${styles.slidePanel} ${activeView === 'documents' ? styles.active : styles.slideIn}`}>
                                <div className={styles.detailHeader}>
                                    <button className={styles.backButton} onClick={goBack}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M19 12H5" />
                                            <polyline points="12 19 5 12 12 5" />
                                        </svg>
                                        Perfil
                                    </button>
                                    <h2 className={styles.detailTitle}>Documentos</h2>
                                </div>

                                <div className={styles.detailContent}>
                                    {employee.documents && employee.documents.length > 0 ? (
                                        <div className={styles.documentsGrid}>
                                            {employee.documents.map((docItem, index) => {
                                                const name = docItem.name.toLowerCase();
                                                let icon, bgColor, color;

                                                if (name.includes('dc-3') || name.includes('dc3')) {
                                                    bgColor = 'rgba(249, 115, 22, 0.1)';
                                                    color = '#f97316';
                                                } else if (name.includes('diploma') || name.includes('constancia')) {
                                                    bgColor = 'rgba(234, 179, 8, 0.1)';
                                                    color = '#eab308';
                                                } else if (name.includes('examen') || name.includes('evaluacion')) {
                                                    bgColor = 'rgba(34, 197, 94, 0.1)';
                                                    color = '#22c55e';
                                                } else {
                                                    bgColor = 'rgba(59, 130, 246, 0.1)';
                                                    color = '#3b82f6';
                                                }

                                                return (
                                                    <a key={index} href={docItem.url} target="_blank" rel="noopener noreferrer" className={styles.documentCard}>
                                                        <div className={styles.documentIcon} style={{ background: bgColor, color }}>
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                                <path d="M14 2v6h6" />
                                                            </svg>
                                                        </div>
                                                        <div className={styles.documentInfo}>
                                                            <span className={styles.documentName}>{docItem.name}</span>
                                                            <span className={styles.documentDate}>{new Date(docItem.uploadDate).toLocaleDateString()}</span>
                                                        </div>
                                                        <ChevronRight />
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className={styles.emptyState}>
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <path d="M14 2v6h6" />
                                            </svg>
                                            <p>No hay documentos cargados</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
