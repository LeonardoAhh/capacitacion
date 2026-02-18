import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/components/ui/Toast/Toast';
import BackButton from '@/components/ui/BackButton/BackButton';
import styles from './ILUOView.module.css';

export default function ILUOView({ employee, positionData, setEmployee, onBack }) {
    const { toast } = useToast();

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 }
    };

    const handleRatingUpdate = async (skillId, level) => {
        try {
            const newRatings = { ...employee.iluoRatings, [skillId]: level };

            // Optimistic update
            const updatedEmployee = { ...employee, iluoRatings: newRatings };
            setEmployee(updatedEmployee);

            // Database update
            const empRef = doc(db, 'training_records', employee.id);
            await updateDoc(empRef, { [`iluoRatings.${skillId}`]: level });

            toast.success('Calificación actualizada');
        } catch (error) {
            console.error("Error updating ILUO:", error);
            toast.error('Error al guardar cambios');
        }
    };

    const colors = {
        I: { bg: '#fee2e2', text: '#ef4444', label: 'Aprendiz' },
        L: { bg: '#fef9c3', text: '#eab308', label: 'En Desarrollo' },
        U: { bg: '#dcfce7', text: '#22c55e', label: 'Autónomo' },
        O: { bg: '#dbeafe', text: '#3b82f6', label: 'Experto' }
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
                <h2 className={styles.viewTitle}>Matriz de Habilidades ILUO</h2>
            </div>

            {!positionData?.iluoSkills || positionData.iluoSkills.length === 0 ? (
                <div className={styles.emptyState}>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📋</span>
                    <h3 className="text-xl font-bold mb-2">Matriz No Configurada</h3>
                    <p className="mb-4">El puesto <strong>{employee.position}</strong> no tiene habilidades ILUO definidas.</p>
                    <Link href="/iluo-manager">
                        <Button variant="secondary">Ir al Configurador de Puestos</Button>
                    </Link>
                </div>
            ) : (
                <div className={styles.iluoGrid}>
                    {positionData.iluoSkills.map((skill) => {
                        const currentRating = employee.iluoRatings?.[skill.id] || null;
                        const activeColor = currentRating ? colors[currentRating] : null;

                        return (
                            <motion.div key={skill.id} variants={itemVariants} className={styles.iluoCard}>
                                <div className={styles.iluoHeader}>
                                    <span className={styles.iluoCategory}>{skill.category}</span>
                                    <h4 className={styles.iluoName}>{skill.name}</h4>
                                </div>

                                <div className={styles.iluoButtons}>
                                    {['I', 'L', 'U', 'O'].map((level) => {
                                        const isActive = currentRating === level;
                                        const levelColor = colors[level];
                                        return (
                                            <button
                                                key={level}
                                                onClick={() => handleRatingUpdate(skill.id, level)}
                                                className={styles.iluoBtn}
                                                style={{
                                                    background: isActive ? levelColor.bg : 'transparent',
                                                    color: isActive ? levelColor.text : 'var(--text-tertiary)',
                                                    borderColor: isActive ? 'transparent' : 'rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                {level}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className={styles.iluoStatus} style={{ color: activeColor ? activeColor.text : '#94a3b8' }}>
                                    {activeColor ? activeColor.label : 'Sin Evaluar'}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
}
