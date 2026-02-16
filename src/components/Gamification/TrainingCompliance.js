import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Award, Target, ChevronRight, TrendingUp, AlertCircle, Sparkles, Trophy, Info } from 'lucide-react';

const TrainingCompliance = ({ user }) => {
    const [complianceData, setComplianceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchComplianceData = async () => {
            // Validar ID de empleado
            if (!user?.employeeId) {
                console.log("TrainingCompliance: Falta ID de empleado", user);
                setLoading(false);
                return;
            }

            // Caso Especial: Sin Categoría
            if (!user?.position) {
                setComplianceData({ type: 'no_category' });
                setLoading(false);
                return;
            }


            // Caso Especial: Categoría A (Máxima)
            // Se asume que si el puesto termina en " A" es la categoría máxima
            const positionName = user.position ? user.position.trim() : '';
            if (positionName.endsWith(' A') || positionName === 'A' || positionName === 'Categoría A') {
                setComplianceData({ type: 'max_category' });
                setLoading(false);
                return;
            }

            try {
                // 1. Get promotion rules for current position
                const rulesRef = collection(db, 'promotion_rules');
                const qRules = query(rulesRef, where('currentPosition', '==', user.position));
                const rulesSnap = await getDocs(qRules);

                if (rulesSnap.empty) {
                    console.log("TrainingCompliance: No hay reglas para esta posición", user.position);
                    // Si no hay reglas y NO es categoría A, entonces el puesto no tiene plan gamificado (ej. Analistas, Gerentes)
                    setComplianceData({ type: 'no_plan' });
                    setLoading(false);
                    return;
                }

                // Assuming there might be multiple rules, we take the first one or logic to select best match
                const ruleDoc = rulesSnap.docs[0].data();

                // 2. Get training records for this employee
                const recordsRef = collection(db, 'training_records');
                const qRecords = query(recordsRef, where('employeeId', '==', user.employeeId));
                const recordsSnap = await getDocs(qRecords);

                if (recordsSnap.empty) {
                    setComplianceData({
                        percentage: 0,
                        completedCount: 0,
                        nextPosition: ruleDoc.nextPosition || 'Siguiente Categoría',
                        positionStartDate: null,
                        performancePeriod: null,
                        performanceScore: null,
                        scheduledExam: null
                    });
                } else {
                    const recordData = recordsSnap.docs[0].data();


                    const matrix = recordData.matrix || {};
                    const promoData = recordData.promotionData || {}; // Fallback if fields are nested

                    setComplianceData({
                        percentage: matrix.compliancePercentage || 0,
                        completedCount: matrix.completedCount || 0,
                        nextPosition: ruleDoc.nextPosition || 'Siguiente Categoría',
                        totalRequired: ruleDoc.requiredCoursesCount || 10,

                        // Try root, then promotionData, then matrix
                        positionStartDate: recordData.positionStartDate || promoData.positionStartDate || matrix.positionStartDate,
                        performancePeriod: recordData.performancePeriod || promoData.performancePeriod || matrix.performancePeriod,
                        performanceScore: recordData.performanceScore ?? promoData.performanceScore ?? matrix.performanceScore,
                        scheduledExam: recordData.scheduledExam ?? promoData.scheduledExam ?? matrix.scheduledExam
                    });
                }

            } catch (err) {
                console.error("Error fetching compliance data:", err);
                setError("No se pudo cargar la información de cumplimiento.");
            } finally {
                setLoading(false);
            }
        };

        fetchComplianceData();
    }, [user]);

    if (loading) {
        return (
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
                <div style={{ width: '2rem', height: '2rem', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    if (!complianceData || complianceData.type === 'no_category') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                    width: '48px', height: '48px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '12px',
                    color: '#6366f1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                }}>
                    <Sparkles size={24} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {complianceData?.type === 'no_category' ? '¡Tu camino comienza aquí!' : '¡Impulsa tu crecimiento!'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
                    {complianceData?.type === 'no_category'
                        ? 'Estás listo para iniciar tu desarrollo profesional. Prepárate para alcanzar grandes metas.'
                        : 'Completa tus cursos asignados para desbloquear nuevas oportunidades de crecimiento dentro de la empresa.'}
                </p>
            </motion.div>
        );
    }

    if (complianceData.type === 'no_plan') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
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
                    width: '48px', height: '48px',
                    background: 'rgba(100, 116, 139, 0.1)',
                    borderRadius: '12px',
                    color: '#64748b',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                }}>
                    <Info size={24} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Desarrollo Profesional
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
                    Tu puesto actual {user.position} sigue un programa de capacitación especializado.
                </p>
            </motion.div>
        );
    }

    if (complianceData.type === 'max_category') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    background: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)', // Gold-ish gradient
                    borderRadius: '20px',
                    padding: '2rem',
                    marginTop: '1.5rem',
                    marginBottom: '3rem',
                    textAlign: 'center',
                    border: '1px solid #fde047',
                    boxShadow: '0 4px 6px -1px rgba(250, 204, 21, 0.1), 0 2px 4px -1px rgba(250, 204, 21, 0.06)'
                }}
            >
                <div style={{
                    width: '56px', height: '56px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '50%',
                    color: '#854d0e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                }}>
                    <Trophy size={28} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#854d0e' }}>
                    ¡Eres Categoría A!
                </h3>
                <p style={{ color: '#a16207', fontSize: '1rem', maxWidth: '450px', margin: '0 auto', fontWeight: 500 }}>
                    Has alcanzado el máximo nivel de excelencia. Tu dedicación y liderazgo inspiran a todo el equipo. ¡Sigue brillando!
                </p>
            </motion.div>
        );
    }

    const isHighCompliance = complianceData.percentage >= 80;
    const isMediumCompliance = complianceData.percentage >= 50 && complianceData.percentage < 80;

    const progressColor = isHighCompliance ? '#22c55e' : isMediumCompliance ? '#f59e0b' : '#6366f1';

    const formatDate = (dateValue) => {
        if (!dateValue) return 'S/D';
        try {
            if (dateValue && typeof dateValue.toDate === 'function') {
                return dateValue.toDate().toLocaleDateString();
            }
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return 'S/D';
            return date.toLocaleDateString();
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'S/D';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', position: 'relative', zIndex: 2 }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Target size={20} style={{ color: progressColor }} />
                        Plan de Carrera
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Camino a <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{complianceData.nextPosition}</span>
                    </p>
                </div>

                <div style={{
                    background: isHighCompliance ? 'rgba(34, 197, 94, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: progressColor
                }}>
                    {complianceData.percentage}% Completado
                </div>
            </div>

            <div style={{
                height: '8px',
                background: 'var(--bg-tertiary)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '1rem'
            }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${complianceData.percentage}%` }}
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
                zIndex: 1
            }} />

            {/* Additional Details Section - Grid */}
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
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                        Ultimo Cambio Categoría
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {formatDate(complianceData.positionStartDate)}
                    </span>
                </div>

                {/* Performance Evaluation */}
                <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                        Eval. Desempeño {complianceData.performancePeriod || ''}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {complianceData.performanceScore ?? 'S/D'}
                        </span>
                        {(complianceData.performanceScore !== null && complianceData.performanceScore !== undefined) && (
                            <span style={{
                                fontSize: '0.7rem',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                background: complianceData.performanceScore >= 90 ? '#dcfce7' : complianceData.performanceScore >= 70 ? '#fef3c7' : '#fee2e2',
                                color: complianceData.performanceScore >= 90 ? '#166534' : complianceData.performanceScore >= 70 ? '#92400e' : '#991b1b'
                            }}>
                                Puntos
                            </span>
                        )}
                    </div>
                </div>

                {/* Scheduled Exam */}
                <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                        Examen Programado
                    </span>
                    <span style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: complianceData.scheduledExam ? '#22c55e' : 'var(--text-primary)'
                    }}>
                        {complianceData.scheduledExam === true ? 'Sí' : complianceData.scheduledExam === false ? 'No' : 'S/D'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default TrainingCompliance;
