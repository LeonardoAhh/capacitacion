import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Award, Target, ChevronRight, TrendingUp, AlertCircle, Sparkles, Trophy, Info } from 'lucide-react';

// Utility function for date formatting
const formatDate = (dateValue) => {
    if (!dateValue) return 'S/D';
    try {
        if (dateValue && typeof dateValue.toDate === 'function') {
            return dateValue.toDate().toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return 'S/D';
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        console.error("Error al formatear fecha:", e);
        return 'S/D';
    }
};

// Check if position is maximum category
const isMaxCategory = (position) => {
    if (!position) return false;
    const positionName = position.trim();
    return positionName.endsWith(' A') || positionName === 'A' || positionName === 'Categoría A';
};

// Loading component
const LoadingState = () => (
    <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '20px',
        padding: '1.5rem',
        border: '1px solid var(--border-color)',
        marginTop: '1.5rem',
        height: '140px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }}>
        <div style={{
            width: '2rem',
            height: '2rem',
            border: '3px solid var(--color-primary)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }} />
    </div>
);

// No Category State component
const NoCategoryState = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
            background: 'var(--bg-secondary)',
            borderRadius: '20px',
            padding: '2rem',
            border: '1px solid var(--border-color)',
            marginTop: '1.5rem',
            marginBottom: '3rem',
            textAlign: 'center'
        }}
    >
        <div style={{
            width: '48px',
            height: '48px',
            background: 'rgba(var(--color-primary-rgb), 0.1)',
            borderRadius: '12px',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
        }}>
            <Sparkles size={24} />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>
            ¡Tu camino comienza aquí!
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto', fontFamily: 'var(--font-body)' }}>
            Estás listo para iniciar tu desarrollo profesional. Completa tus cursos para desbloquear nuevas oportunidades.
        </p>
    </motion.div>
);

// No Plan State component
const NoPlanState = ({ position }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
            background: 'var(--bg-secondary)',
            borderRadius: '20px',
            padding: '2rem',
            border: '1px solid var(--border-color)',
            marginTop: '1.5rem',
            marginBottom: '3rem',
            textAlign: 'center'
        }}
    >
        <div style={{
            width: '48px',
            height: '48px',
            background: 'rgba(var(--color-primary-rgb), 0.08)',
            borderRadius: '12px',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
        }}>
            <Info size={24} />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>
            Desarrollo Profesional
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto', fontFamily: 'var(--font-body)' }}>
            Tu puesto <strong>{position}</strong> sigue un programa de capacitación especializado.
        </p>
    </motion.div>
);

// Max Category State component
const MaxCategoryState = () => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
            background: 'rgba(var(--color-primary-rgb), 0.06)',
            borderRadius: '20px',
            padding: '2rem',
            marginTop: '1.5rem',
            marginBottom: '3rem',
            textAlign: 'center',
            border: '1px solid rgba(var(--color-primary-rgb), 0.2)',
        }}
    >
        <div style={{
            width: '56px',
            height: '56px',
            background: 'rgba(var(--color-primary-rgb), 0.1)',
            borderRadius: '50%',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem auto'
        }}>
            <Trophy size={28} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--color-secondary)', fontFamily: 'var(--font-serif)' }}>
            ¡Eres Categoría A!
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '450px', margin: '0 auto', fontWeight: 500, fontFamily: 'var(--font-body)' }}>
            Has alcanzado el máximo nivel de excelencia. Tu dedicación y liderazgo inspiran a todo el equipo. ¡Sigue brillando!
        </p>
    </motion.div>
);

// Main Compliance Card component
const ComplianceCard = ({ complianceData }) => {
    const { percentage = 0, nextPosition, positionStartDate, performancePeriod, performanceScore, scheduledExam } = complianceData;

    const progressColor = useMemo(() => {
        if (percentage >= 80) return 'var(--color-success)';
        if (percentage >= 50) return 'var(--color-primary)';
        return 'var(--color-info)';
    }, [percentage]);

    const isHighCompliance = percentage >= 80;

    const getPerformanceBadgeStyle = (score) => {
        if (score >= 90) return { bg: 'rgba(var(--color-success-rgb), 0.12)', color: 'var(--color-success)' };
        if (score >= 70) return { bg: 'rgba(var(--color-primary-rgb), 0.10)', color: 'var(--color-secondary)' };
        return { bg: 'rgba(var(--color-danger-rgb), 0.10)', color: 'var(--color-danger)' };
    };

    const performanceBadge = performanceScore !== null && performanceScore !== undefined
        ? getPerformanceBadgeStyle(performanceScore)
        : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                background: 'var(--bg-secondary)',
                borderRadius: '20px',
                padding: '1.5rem',
                border: '1px solid var(--border-color)',
                marginTop: '1.5rem',
                marginBottom: '3rem',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1rem',
                position: 'relative',
                zIndex: 2
            }}>
                <div>
                    <h3 style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <Target size={20} style={{ color: progressColor }} />
                        Plan de Carrera
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Camino a <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{nextPosition}</span>
                    </p>
                </div>

                <div style={{
                    background: isHighCompliance
                        ? 'rgba(var(--color-success-rgb), 0.1)'
                        : 'rgba(var(--color-primary-rgb), 0.1)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    color: progressColor
                }}>
                    {percentage}% Completado
                </div>
            </div>

            {/* Progress Bar */}
            <div style={{
                height: '8px',
                background: 'var(--bg-tertiary)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '1rem'
            }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    style={{
                        height: '100%',
                        background: progressColor,
                        borderRadius: '4px'
                    }}
                />
            </div>

            {/* Decorative background accent */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-5%',
                width: '150px',
                height: '150px',
                background: `radial-gradient(circle, ${progressColor}20 0%, transparent 70%)`,
                filter: 'blur(20px)',
                zIndex: 1,
                pointerEvents: 'none'
            }} />

            {/* Additional Details Grid */}
            <div style={{
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-color)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '1rem',
                position: 'relative',
                zIndex: 2
            }}>
                {/* Last Position Change */}
                <div>
                    <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        display: 'block',
                        marginBottom: '0.25rem'
                    }}>
                        Último Cambio de Categoría
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatDate(positionStartDate)}
                    </span>
                </div>

                {/* Performance Evaluation */}
                <div>
                    <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        display: 'block',
                        marginBottom: '0.25rem'
                    }}>
                        Eval. Desempeño {performancePeriod || ''}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {performanceScore ?? 'S/D'}
                        </span>
                        {performanceBadge && (
                            <span style={{
                                fontSize: '0.7rem',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                background: performanceBadge.bg,
                                color: performanceBadge.color
                            }}>
                                Puntos
                            </span>
                        )}
                    </div>
                </div>

                {/* Scheduled Exam */}
                <div>
                    <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        display: 'block',
                        marginBottom: '0.25rem'
                    }}>
                        Examen Programado
                    </span>
                    <span style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        fontFamily: 'var(--font-body)',
                        color: scheduledExam ? 'var(--color-success)' : 'var(--text-primary)'
                    }}>
                        {scheduledExam === true ? 'Sí' : scheduledExam === false ? 'No' : 'S/D'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

// Main Component
const TrainingCompliance = ({ user }) => {
    const [complianceData, setComplianceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const fetchComplianceData = async () => {
            // Early validation
            if (!user?.employeeId) {
                console.log("TrainingCompliance: ID de empleado no disponible", user);
                if (isMounted) setLoading(false);
                return;
            }

            // Check for no category
            if (!user?.position) {
                if (isMounted) {
                    setComplianceData({ type: 'no_category' });
                    setLoading(false);
                }
                return;
            }

            // Check for max category
            if (isMaxCategory(user.position)) {
                if (isMounted) {
                    setComplianceData({ type: 'max_category' });
                    setLoading(false);
                }
                return;
            }

            try {
                // Fetch promotion rules
                const rulesRef = collection(db, 'promotion_rules');
                const qRules = query(rulesRef, where('currentPosition', '==', user.position));
                const rulesSnap = await getDocs(qRules);

                if (!isMounted) return;

                if (rulesSnap.empty) {
                    console.log("TrainingCompliance: No hay reglas de promoción para", user.position);
                    setComplianceData({ type: 'no_plan' });
                    setLoading(false);
                    return;
                }

                const ruleDoc = rulesSnap.docs[0].data();

                // Fetch training records
                const recordsRef = collection(db, 'training_records');
                const qRecords = query(recordsRef, where('employeeId', '==', user.employeeId));
                const recordsSnap = await getDocs(qRecords);

                if (!isMounted) return;

                if (recordsSnap.empty) {
                    setComplianceData({
                        percentage: 0,
                        completedCount: 0,
                        nextPosition: ruleDoc.nextPosition || 'Siguiente Categoría',
                        totalRequired: ruleDoc.requiredCoursesCount || 10,
                        positionStartDate: null,
                        performancePeriod: null,
                        performanceScore: null,
                        scheduledExam: null
                    });
                } else {
                    const recordData = recordsSnap.docs[0].data();
                    const matrix = recordData.matrix || {};
                    const promoData = recordData.promotionData || {};

                    setComplianceData({
                        percentage: matrix.compliancePercentage || 0,
                        completedCount: matrix.completedCount || 0,
                        nextPosition: ruleDoc.nextPosition || 'Siguiente Categoría',
                        totalRequired: ruleDoc.requiredCoursesCount || 10,
                        positionStartDate: recordData.positionStartDate || promoData.positionStartDate || matrix.positionStartDate,
                        performancePeriod: recordData.performancePeriod || promoData.performancePeriod || matrix.performancePeriod,
                        performanceScore: recordData.performanceScore ?? promoData.performanceScore ?? matrix.performanceScore,
                        scheduledExam: recordData.scheduledExam ?? promoData.scheduledExam ?? matrix.scheduledExam
                    });
                }
            } catch (err) {
                console.error("Error al cargar datos de cumplimiento:", err);
                if (isMounted) {
                    setError("No se pudo cargar la información de cumplimiento.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchComplianceData();

        return () => {
            isMounted = false;
        };
    }, [user, user?.employeeId, user?.position]);

    // Render states
    if (loading) return <LoadingState />;
    if (error) return null; // Could be replaced with error state component
    if (!complianceData || complianceData.type === 'no_category') return <NoCategoryState />;
    if (complianceData.type === 'no_plan') return <NoPlanState position={user.position} />;
    if (complianceData.type === 'max_category') return <MaxCategoryState />;

    return <ComplianceCard complianceData={complianceData} />;
};

export default TrainingCompliance;