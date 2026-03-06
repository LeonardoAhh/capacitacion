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
                    {isCompleted ? <CheckCircle size={20} /> : <BookOpen size={20} />}
                </div>
                <div className={styles.courseContent}>
                    <h3 className={styles.courseCardTitle}>
                        {course.title || course.nombre}
                    </h3>
                    {course.duration && (
                        <span className={styles.courseDuration}>
                            {course.duration} min
                        </span>
                    )}
                </div>
            </div>

        </div>
    );
};

export default function CoursesGrid({ courses, candidate, onViewCourse, onToggleCompletion }) {
    if (!courses || courses.length === 0) {
        return (
            <section className={styles.menuSection}>
                <div className={styles.sectionHeaderContainer}>
                    <h3 className={styles.sectionHeader}>Cursos de Inducción</h3>
                </div>
                <div className={styles.emptyState}>
                    <BookOpen size={32} />
                    <p>No hay cursos asignados</p>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.menuSection}>
            <div className={styles.sectionHeaderContainer}>
                <h3 className={styles.sectionHeader}>Cursos de Inducción</h3>
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
