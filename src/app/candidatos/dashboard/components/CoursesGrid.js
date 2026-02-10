'use client';

import { BookOpen, CheckCircle, ChevronRight } from 'lucide-react';
import styles from './CoursesGrid.module.css';

const CourseCard = ({ course, isCompleted, onView, onToggle }) => {
    return (
        <div
            className={styles.courseCard}
            onClick={() => onView(course)}
            tabIndex={0}
            role="button"
            aria-label={`Ver detalles del curso ${course.title || course.nombre}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onView(course);
                }
            }}
        >
            <div className={styles.courseCardHeader}>
                <div className={`${styles.courseIcon} ${isCompleted ? styles.courseIconCompleted : ''}`}>
                    {isCompleted ? <CheckCircle size={24} /> : <BookOpen size={24} />}
                </div>
                <div className={styles.courseContent}>
                    <span className={styles.courseCardTitle}>
                        {course.title || course.nombre}
                    </span>
                    {course.duration && (
                        <span className={styles.courseDuration} style={{ display: 'block', marginTop: '4px' }}>
                            {course.duration} min
                        </span>
                    )}
                </div>
            </div>

            <div className={styles.courseCardFooter}>
                <button
                    className={isCompleted ? styles.btnCompleted : styles.btnMarkComplete}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle(course.id, !isCompleted);
                    }}
                    aria-label={isCompleted ? "Marcar como no completado" : "Marcar como completado"}
                >
                    {isCompleted ? 'Completado' : 'Marcar Completado'}
                </button>
                <ChevronRight size={20} className={styles.chevron} />
            </div>
        </div>
    );
};

export default function CoursesGrid({ courses, candidate, onViewCourse, onToggleCompletion }) {
    if (!courses || courses.length === 0) {
        return (
            <div className={styles.emptyState}>
                <BookOpen size={40} />
                <p>No hay cursos asignados</p>
            </div>
        );
    }

    return (
        <section className={styles.menuSection} style={{ marginTop: '24px' }}>
            <div className={styles.sectionHeaderContainer}>
                <h3 className={styles.sectionHeader}>📚 Cursos de Inducción</h3>
            </div>

            <div className={styles.coursesGrid}>
                {courses.map((course) => {
                    const isCompleted = candidate?.cursosCompletados?.includes(course.id);
                    return (
                        <CourseCard
                            key={course.id}
                            course={course}
                            isCompleted={isCompleted}
                            onView={onViewCourse}
                            onToggle={onToggleCompletion}
                        />
                    );
                })}
            </div>
        </section>
    );
}
