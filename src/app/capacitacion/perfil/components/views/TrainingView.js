import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, BarChart } from 'lucide-react';
import styles from './TrainingView.module.css';

export default function TrainingView({ trainingStats, matrixCompliance, onBack }) {

    // Convert matrixCompliance to a number safely
    const complianceValue = typeof matrixCompliance === 'object'
        ? (matrixCompliance?.compliancePercentage ?? 0)
        : (matrixCompliance ?? 0);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            className="flex flex-col h-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
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
                <h2 className={styles.viewTitle}>Capacitación</h2>
            </div>

            <motion.div variants={itemVariants} className={styles.statsRow}>
                <div className={`${styles.statCard} ${styles.statGreen}`}>
                    <span className={styles.statNumber}>{trainingStats.approved.length}</span>
                    <span className={styles.statLabel}>Aprobados</span>
                </div>
                <div className={`${styles.statCard} ${styles.statRed}`}>
                    <span className={styles.statNumber}>{trainingStats.failed.length}</span>
                    <span className={styles.statLabel}>Reprobados</span>
                </div>
                <div className={`${styles.statCard} ${styles.statYellow}`}>
                    <span className={styles.statNumber}>{trainingStats.pending.length}</span>
                    <span className={styles.statLabel}>Pendientes</span>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className={styles.metricCard}>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                    <BarChart size={24} />
                </div>
                <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Cumplimiento de Matriz</span>
                    <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${complianceValue}%` }}
                            />
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{complianceValue}%</span>
                    </div>
                </div>
            </motion.div>

            {trainingStats.approved.length > 0 && (
                <motion.div variants={itemVariants} className={styles.courseSection}>
                    <h4 className={styles.sectionTitle}>
                        <CheckCircle size={18} className="text-green-500" />
                        Cursos Aprobados
                    </h4>
                    <div className={styles.courseList}>
                        {trainingStats.approved.map((c, i) => (
                            <div key={i} className={styles.courseItem}>
                                <span className={styles.courseName}>{c.name}</span>
                                <span className={styles.courseScore} style={{ color: '#22c55e' }}>{c.score}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {trainingStats.failed.length > 0 && (
                <motion.div variants={itemVariants} className={styles.courseSection}>
                    <h4 className={styles.sectionTitle}>
                        <XCircle size={18} className="text-red-500" />
                        Cursos Reprobados
                    </h4>
                    <div className={styles.courseList}>
                        {trainingStats.failed.map((c, i) => (
                            <div key={i} className={styles.courseItem}>
                                <span className={styles.courseName}>{c.name}</span>
                                <span className={styles.courseScore} style={{ color: '#ef4444' }}>{c.score}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {trainingStats.pending.length > 0 && (
                <motion.div variants={itemVariants} className={styles.courseSection}>
                    <h4 className={styles.sectionTitle}>
                        <Clock size={18} className="text-amber-500" />
                        Cursos Pendientes
                    </h4>
                    <div className={styles.courseList}>
                        {trainingStats.pending.map((c, i) => (
                            <div key={i} className={styles.courseItem}>
                                <span className={styles.courseName}>{c}</span>
                                <span className={styles.courseScore} style={{ color: '#f59e0b' }}>Pendiente</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
