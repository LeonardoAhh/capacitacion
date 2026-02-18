import { motion } from 'framer-motion';
import { ChevronRight, File, FileText, Award } from 'lucide-react';
import BackButton from '@/components/ui/BackButton/BackButton';
import styles from './DocumentsView.module.css';

export default function DocumentsView({ documents, onBack }) {

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

    return (
        <motion.div
            className={styles.container}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            <div className={styles.headerRow}>
                <BackButton onClick={onBack} />
                <h2 className={styles.viewTitle}>Documentos del Empleado</h2>
            </div>

            {documents && documents.length > 0 ? (
                <motion.div className={styles.documentsGrid}>
                    {documents.map((docItem, index) => {
                        const name = docItem.name.toLowerCase();
                        let icon = <FileText size={24} />;
                        let bgColor = 'rgba(59, 130, 246, 0.1)';
                        let color = '#3b82f6';

                        if (name.includes('dc-3') || name.includes('dc3')) {
                            bgColor = 'rgba(249, 115, 22, 0.1)';
                            color = '#f97316';
                            icon = <Award size={24} />;
                        } else if (name.includes('diploma') || name.includes('constancia')) {
                            bgColor = 'rgba(234, 179, 8, 0.1)';
                            color = '#eab308';
                            icon = <Award size={24} />;
                        } else if (name.includes('examen') || name.includes('evaluacion')) {
                            bgColor = 'rgba(34, 197, 94, 0.1)';
                            color = '#22c55e';
                            icon = <FileText size={24} />;
                        }

                        return (
                            <motion.a
                                key={index}
                                variants={itemVariants}
                                href={docItem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.documentCard}
                            >
                                <div className={styles.documentIcon} style={{ background: bgColor, color }}>
                                    {icon}
                                </div>
                                <div className={styles.documentInfo}>
                                    <span className={styles.documentName}>{docItem.name}</span>
                                    <span className={styles.documentDate}>{new Date(docItem.uploadDate).toLocaleDateString()}</span>
                                </div>
                                <ChevronRight size={20} className="text-slate-400" />
                            </motion.a>
                        );
                    })}
                </motion.div>
            ) : (
                <motion.div
                    className={styles.emptyState}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <File size={48} className="mb-4 text-slate-300" />
                    <p className="text-lg font-medium text-slate-500">No hay documentos cargados</p>
                </motion.div>
            )}
        </motion.div>
    );
}
