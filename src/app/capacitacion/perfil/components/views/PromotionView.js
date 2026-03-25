import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, AlertCircle } from 'lucide-react';
import BackButton from '@/components/ui/BackButton/BackButton';
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
                style={{ display: 'flex', flexDirection: 'column' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <div className={styles.headerRow}>
                    <BackButton onClick={onBack} />
                </div>
                
                <div className={styles.emptyState}>
                    <AlertCircle size={48} style={{ marginBottom: '16px', color: 'var(--c-muted, #6b7280)' }} />
                    <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--c-ink, #111827)', marginBottom: '8px' }}>Este puesto no tiene reglas de promoción configuradas</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--c-muted, #6b7280)', margin: 0 }}>Contacta al administrador para definir un plan de carrera</p>
                </div>
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
                <BackButton onClick={onBack} />
            </div>

            {/* Path Visualization */}
            <motion.div variants={itemVariants} className={styles.promotionPath}>
                <div className={styles.positionBadge}>{employee.position}</div>
                <ArrowRight className={styles.pathArrow} size={24} />
                <div className={`${styles.positionBadge} ${styles.positionBadgeTarget}`}>
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
