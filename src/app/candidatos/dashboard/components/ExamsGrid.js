'use client';

import { FileText, CheckCircle } from 'lucide-react';
import styles from './CoursesGrid.module.css'; // Usamos los mismos estilos del grid de cursos

const ExamCard = ({ exam, isCompleted, onView }) => {
    return (
        <div
            className={styles.courseCard}
            onClick={() => onView(exam)}
            tabIndex={0}
            role="button"
            aria-label={`Ver examen ${exam.title}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onView(exam);
                }
            }}
        >
            <div className={styles.courseCardHeader}>
                <div className={`${styles.courseIcon} ${isCompleted ? styles.courseIconCompleted : ''}`}>
                    {isCompleted ? <CheckCircle size={20} /> : <FileText size={20} />}
                </div>
                <div className={styles.courseContent}>
                    <h3 className={styles.courseCardTitle}>
                        {exam.title}
                    </h3>
                    <span className={styles.courseDuration}>
                        Requerido · Mín. {exam.passingScore ?? 7}/10
                    </span>
                </div>
            </div>
        </div>
    );
};

export default function ExamsGrid({ exams, candidate, onViewExam }) {
    if (!exams || exams.length === 0) {
        return (
            <section className={styles.menuSection}>
                <div className={styles.sectionHeaderContainer}>
                    <h3 className={styles.sectionHeader}>Exámenes de Inducción</h3>
                </div>
                <div className={styles.emptyState}>
                    <FileText size={32} />
                    <p>No hay exámenes asignados</p>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.menuSection}>
            <div className={styles.sectionHeaderContainer}>
                <h3 className={styles.sectionHeader}>Exámenes de Inducción</h3>
            </div>

            <div className={styles.coursesGrid}>
                {exams.map((exam) => {
                    // TODO: Mapear contra la metadata del candidato real cuando guarde los dictámenes
                    const isCompleted = candidate?.examenesCompletados?.includes(exam.id) || 
                                        candidate?.coursesProgress?.[exam.id]?.passed;
                                        
                    return (
                        <ExamCard
                            key={exam.id}
                            exam={exam}
                            isCompleted={isCompleted}
                            onView={onViewExam}
                        />
                    );
                })}
            </div>
        </section>
    );
}
