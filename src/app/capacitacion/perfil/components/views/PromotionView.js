import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, AlertCircle } from 'lucide-react';
import styles from './PromotionView.module.css';

export default function PromotionView({ employee, promotionRule, promotionInfo, monthsInPosition, onBack }) {

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 }
    };

    if (!promotionRule) {
        return (
            <motion.div
                className={styles.emptyState}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className={styles.headerRow}>
                    <button
                        onClick={onBack}
                        className={styles.backBtn}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Volver al Perfil
                    </button>
                    <h2 className={styles.viewTitle}>Promoción</h2>
                </div>
                <AlertCircle size={48} style={{ marginBottom: '1rem', color: '#94a3b8' }} />
                <p style={{ fontSize: '1.125rem', fontWeight: 500, color: '#94a3b8' }}>Este puesto no tiene reglas de promoción configuradas</p>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>Contacta al administrador para definir un plan de carrera</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            style={{ display: 'flex', flexDirection: 'column' }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            <div className={styles.headerRow}>
                <button
                    onClick={onBack}
                    className={styles.backBtn}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5" />
                        <polyline points="12 19 5 12 12 5" />
                    </svg>
                    Volver al Perfil
                </button>
                <h2 className={styles.viewTitle}>Plan de Promoción</h2>
            </div>

            {/* Path Visualization */}
            <motion.div variants={itemVariants} className={styles.promotionPath}>
                <div className={styles.positionBadge}>{employee.position}</div>
                <ArrowRight className="text-blue-500" size={24} />
                <div className={`${styles.positionBadge} ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900`}>
                    {promotionRule.promotionTo}
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className={styles.criteriaList}>
                {/* Temporality */}
                <div className={`${styles.criteriaItem} ${promotionInfo?.temporality?.met ? styles.criteriaMet : styles.criteriaNotMet}`}>
                    <div className={styles.criteriaCheck}>
                        {promotionInfo?.temporality?.met ? '✓' : '✗'}
                    </div>
                    <div className={styles.criteriaInfo}>
                        <span className={styles.criteriaName}>Temporalidad en el Puesto</span>
                        <span className={styles.criteriaDetail}>
                            {monthsInPosition} de {promotionRule.temporalityMonths || 6} meses requeridos
                        </span>
                    </div>
                </div>

                {/* Training Matrix via properties */}
                <div className={`${styles.criteriaItem} ${promotionInfo?.matrix?.met ? styles.criteriaMet : styles.criteriaNotMet}`}>
                    <div className={styles.criteriaCheck}>
                        {promotionInfo?.matrix?.met ? '✓' : '✗'}
                    </div>
                    <div className={styles.criteriaInfo}>
                        <span className={styles.criteriaName}>Cumplimiento de Matriz de Capacitación</span>
                        <span className={styles.criteriaDetail}>
                            {employee.matrix?.compliancePercentage ?? 0}% de {promotionRule.matrixMinCoverage ?? 90}% requerido
                        </span>
                    </div>
                </div>

                {/* Performance */}
                <div className={`${styles.criteriaItem} ${promotionInfo?.performance?.met ? styles.criteriaMet : styles.criteriaNotMet}`}>
                    <div className={styles.criteriaCheck}>
                        {promotionInfo?.performance?.met ? '✓' : '✗'}
                    </div>
                    <div className={styles.criteriaInfo}>
                        <span className={styles.criteriaName}>Evaluación de Desempeño</span>
                        <span className={styles.criteriaDetail}>
                            {employee.promotionData?.performanceScore || 0}% de {promotionRule.performanceMinScore || 80}% requerido
                        </span>
                    </div>
                </div>

                {/* Exam */}
                <div className={`${styles.criteriaItem} ${promotionInfo?.exam?.met ? styles.criteriaMet : styles.criteriaNotMet}`}>
                    <div className={styles.criteriaCheck}>
                        {promotionInfo?.exam?.met ? '✓' : '✗'}
                    </div>
                    <div className={styles.criteriaInfo}>
                        <span className={styles.criteriaName}>Examen de Promoción Técnico</span>
                        <span className={styles.criteriaDetail}>
                            {employee.promotionData?.examAttempts?.length > 0
                                ? `Calificación: ${employee.promotionData.examAttempts[employee.promotionData.examAttempts.length - 1].score}%`
                                : 'Aún no aplicado'}
                        </span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
