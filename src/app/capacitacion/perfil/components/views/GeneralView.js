import { motion } from 'framer-motion';
import {
    User, GraduationCap, Calendar, Briefcase,
    MapPin, Clock, Award, TrendingUp, BookOpen,
    FileText, CheckCircle, AlertCircle, ChevronRight
} from 'lucide-react';
import styles from './GeneralView.module.css';

export default function GeneralView({ employee, seniority, trainingStats, promotionInfo, onNavigate, documentsCount, iluoCount }) {

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    const InfoItem = ({ icon: Icon, colorClass, label, value }) => (
        <div className={styles.infoItem}>
            <div className={`${styles.iconBox} ${styles[colorClass]}`}>
                <Icon size={20} />
            </div>
            <div className={styles.infoContent}>
                <span className={styles.label}>{label}</span>
                <span className={styles.value}>{value}</span>
            </div>
        </div>
    );

    const NavButton = ({ title, subtitle, icon: Icon, colorClass, onClick }) => (
        <button className={styles.navButton} onClick={onClick}>
            <div className={styles.navContent}>
                <div className={`${styles.iconBox} ${styles[colorClass]}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <div className={styles.navTitle}>{title}</div>
                    <div className={styles.navSubtitle}>{subtitle}</div>
                </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
        </button>
    );

    return (
        <motion.div
            className={styles.container}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            {/* Personal Information */}
            <motion.div variants={itemVariants} className={styles.section}>
                <h3 className={styles.sectionTitle}>Información Personal</h3>
                <div className={styles.grid}>
                    <InfoItem
                        icon={User}
                        colorClass="iconBlue"
                        label="CURP"
                        value={employee.curp || 'N/A'}
                    />
                    <InfoItem
                        icon={GraduationCap}
                        colorClass="iconPurple"
                        label="Escolaridad"
                        value={employee.education || 'N/A'}
                    />
                    <InfoItem
                        icon={Calendar}
                        colorClass="iconGreen"
                        label="Fecha Ingreso"
                        value={new Date(employee.startDate).toLocaleDateString() || 'N/A'}
                    />
                </div>
            </motion.div>

            {/* Work Information */}
            <motion.div variants={itemVariants} className={styles.section}>
                <h3 className={styles.sectionTitle}>Información Laboral</h3>
                <div className={styles.grid}>
                    <InfoItem icon={Briefcase} colorClass="iconOrange" label="Puesto" value={employee.position || 'N/A'} />
                    <InfoItem icon={MapPin} colorClass="iconBlue" label="Departamento" value={employee.department || 'N/A'} />
                    <InfoItem icon={MapPin} colorClass="iconPink" label="Área" value={employee.area || 'N/A'} />
                    <InfoItem icon={Clock} colorClass="iconTeal" label="Turno" value={employee.shift || 'N/A'} />
                    <InfoItem icon={Award} colorClass="iconGreen" label="Antigüedad" value={seniority?.text || 'N/A'} />
                    <InfoItem
                        icon={TrendingUp}
                        colorClass="iconPurple"
                        label="Desempeño"
                        value={employee.promotionData?.performanceScore ? `${employee.promotionData.performanceScore}%` : 'N/A'}
                    />
                </div>
            </motion.div>

            {/* Quick Navigation / Summary */}
            <motion.div variants={itemVariants} className={styles.section}>
                <h3 className={styles.sectionTitle}>Detalles y Acciones</h3>
                <div className={styles.grid}>
                    <NavButton
                        title="Capacitación"
                        subtitle={`${trainingStats.approved.length} cursos aprobados`}
                        icon={BookOpen}
                        colorClass="iconBlue"
                        onClick={() => onNavigate('training')}
                    />
                    <NavButton
                        title="Promoción"
                        subtitle={promotionInfo?.overall?.eligible ? 'Elegible para ascenso' : 'En progreso'}
                        icon={TrendingUp}
                        colorClass="iconGreen"
                        onClick={() => onNavigate('promotion')}
                    />
                    <NavButton
                        title="Habilidades ILUO"
                        subtitle={`${iluoCount} habilidades evaluadas`}
                        icon={Award}
                        colorClass="iconPurple"
                        onClick={() => onNavigate('iluo')}
                    />
                    <NavButton
                        title="Documentos"
                        subtitle={`${documentsCount} archivos cargados`}
                        icon={FileText}
                        colorClass="iconOrange"
                        onClick={() => onNavigate('documents')}
                    />
                </div>
            </motion.div>
        </motion.div>
    );
}
