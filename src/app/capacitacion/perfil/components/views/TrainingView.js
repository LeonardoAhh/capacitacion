import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, BarChart, Download } from 'lucide-react';
import BackButton from '@/components/ui/BackButton/BackButton';
import styles from './TrainingView.module.css';

import { generateTrainingReportHTML } from '@/utils/pdfGenerator';

export default function TrainingView({ trainingStats, matrixCompliance, onBack, employee }) {

    const complianceValue = typeof matrixCompliance === 'object'
        ? (matrixCompliance?.compliancePercentage ?? 0)
        : (matrixCompliance ?? 0);

    const handleDownload = useCallback(() => {
        const htmlContent = generateTrainingReportHTML(employee, trainingStats, complianceValue);
        const win = window.open('', '_blank', 'width=900,height=700');
        if (!win) return;
        win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Historial de Capacitación — ${employee?.name || 'Empleado'}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; }
  .report-page { padding: 32px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
  .logo { font-size: 1.4rem; font-weight: 800; color: #3b82f6; letter-spacing: -0.5px; }
  .emp-info h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 4px; }
  .emp-info p { font-size: 0.9rem; color: #64748b; }
  .meta { text-align: right; font-size: 0.85rem; color: #64748b; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .stat { padding: 16px; border-radius: 10px; text-align: center; }
  .stat .num { font-size: 2rem; font-weight: 800; }
  .stat .lbl { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
  .green { background: #f0fdf4; } .green .num { color: #16a34a; } .green .lbl { color: #16a34a; }
  .red   { background: #fef2f2; } .red .num { color: #dc2626; }   .red .lbl { color: #dc2626; }
  .yellow{ background: #fffbeb; } .yellow .num { color: #003ccc; } .yellow .lbl { color: #003ccc; }
  .purple{ background: #f5f3ff; } .purple .num { color: #7c3aed; } .purple .lbl { color: #7c3aed; }
  h3 { font-size: 1rem; font-weight: 700; margin: 20px 0 10px; display: flex; align-items: center; gap: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.875rem; }
  th { background: #f8fafc; padding: 10px 14px; text-align: left; font-weight: 600; color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
  tr:last-child td { border-bottom: none; }
  .score { font-weight: 700; }
  .approved { color: #16a34a; } .failed { color: #dc2626; } .pending { color: #003ccc; }
  .badge { padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-red   { background: #fee2e2; color: #dc2626; }
  .badge-yellow{ background: #fef9c3; color: #003ccc; }
  footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 0.8rem; color: #94a3b8; text-align: center; }
  @media print { body { padding: 16px; } button { display: none !important; } }
</style>
</head>
<body>
${htmlContent}
</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
    }, [employee, trainingStats, complianceValue]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
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
            {/* Header con botón de descarga */}
            <div className={styles.viewHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <BackButton onClick={onBack} />
                </div>
                <button
                    className={styles.downloadBtn}
                    onClick={handleDownload}
                    title="Descargar historial como PDF"
                >
                    <Download size={16} strokeWidth={2.5} />
                    <span>Descargar</span>
                </button>
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
                <div className={styles.metricIcon}>
                    <BarChart size={24} />
                </div>
                <div className={styles.metricContent}>
                    <span className={styles.metricLabel}>Cumplimiento de Matriz</span>
                    <div className={styles.metricBarContainer}>
                        <div className={styles.metricBarTrack}>
                            <div
                                className={styles.metricBarFill}
                                style={{ width: `${complianceValue}%` }}
                            />
                        </div>
                        <span className={styles.metricValue}>{complianceValue}%</span>
                    </div>
                </div>
            </motion.div>

            {trainingStats.pending.length > 0 && (
                <motion.div variants={itemVariants} className={styles.courseSection}>
                    <h4 className={styles.sectionTitle}>
                        <Clock size={18} color="var(--c-primary, #003ccc)" />
                        Cursos Pendientes
                    </h4>
                    <div className={styles.courseList}>
                        {trainingStats.pending.map((c, i) => (
                            <div key={i} className={styles.courseItem}>
                                <span className={styles.courseName}>{typeof c === 'string' ? c : c.name}</span>
                                <span className={styles.courseScore} style={{ color: 'var(--c-primary, #003ccc)' }}>Pendiente</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {trainingStats.approved.length > 0 && (
                <motion.div variants={itemVariants} className={styles.courseSection}>
                    <h4 className={styles.sectionTitle}>
                        <CheckCircle size={18} color="var(--c-success, #16a34a)" />
                        Cursos Aprobados
                    </h4>
                    <div className={styles.courseList}>
                        {trainingStats.approved.map((c, i) => (
                            <div key={i} className={styles.courseItem}>
                                <span className={styles.courseName}>{c.name}</span>
                                <span className={styles.courseScore} style={{ color: 'var(--c-success, #16a34a)' }}>{c.score}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {trainingStats.failed.length > 0 && (
                <motion.div variants={itemVariants} className={styles.courseSection}>
                    <h4 className={styles.sectionTitle}>
                        <XCircle size={18} color="var(--c-danger, #ef4444)" />
                        Cursos Reprobados
                    </h4>
                    <div className={styles.courseList}>
                        {trainingStats.failed.map((c, i) => (
                            <div key={i} className={styles.courseItem}>
                                <span className={styles.courseName}>{c.name}</span>
                                <span className={styles.courseScore} style={{ color: 'var(--c-danger, #ef4444)' }}>{c.score}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
