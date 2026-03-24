'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle, CheckCircle, Circle } from 'lucide-react';
import styles from './CourseDeadlineTimer.module.css';

const COURSE_DURATION_DAYS = 3;

export default function CourseDeadlineTimer({ startDate, fechaLimite, courses = [], completedCourses = [] }) {
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [isExpired, setIsExpired] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);

    const courseStatus = useMemo(() => {
        return courses.map(course => ({
            id: course.id,
            name: course.title || course.nombre || 'Curso',
            completed: completedCourses.includes(course.id)
        }));
    }, [courses, completedCourses]);

    const completedCount = courseStatus.filter(c => c.completed).length;
    const totalCount = courseStatus.length;

    useEffect(() => {
        if (!startDate) return;

        const calculateTimeRemaining = () => {
            // Si el admin extendió el plazo, usar fechaLimite directamente; si no, startDate + COURSE_DURATION_DAYS días hasta 23:59:59
            let deadline;
            if (fechaLimite) {
                deadline = new Date(fechaLimite);
            } else {
                const baseStr = String(startDate);
                let start;
                if (baseStr.includes('T')) {
                    start = new Date(startDate);
                } else if (baseStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    start = new Date(`${baseStr}T00:00:00`);
                } else {
                    start = new Date(startDate);
                }
                
                deadline = new Date(start.getTime());
                deadline.setDate(deadline.getDate() + COURSE_DURATION_DAYS);
                deadline.setHours(23, 59, 59, 0);
            }
            const now = new Date();
            const diff = deadline - now;

            if (diff <= 0) {
                setIsExpired(true);
                setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            setIsExpired(false);
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining({ days, hours, minutes, seconds });
            setIsUrgent(days === 0 && hours < 24);
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [startDate, fechaLimite]);

    if (!startDate) return null;

    if (isExpired) {
        return (
            <div className={`${styles.deadlineContainer} ${styles.expired}`}>
                <div className={styles.iconWrapper}>
                    <AlertTriangle size={24} />
                </div>
                <div className={styles.content}>
                    <h4 className={styles.title}>Tiempo agotado</h4>
                    <p className={styles.message}>
                        Tu plazo para completar los cursos ha terminado.
                        Por favor contacta a Recursos Humanos.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.deadlineContainer} ${isUrgent ? styles.urgent : ''}`}>
            <div className={styles.timerSide}>
                <div className={styles.iconWrapper}>
                    {isUrgent ? <AlertTriangle size={24} /> : <Clock size={24} />}
                </div>
                <div className={styles.content}>
                    <h4 className={styles.title}>
                        {isUrgent ? '¡Últimas horas!' : 'Tiempo restante para completar cursos'}
                    </h4>
                    <div className={styles.timerDisplay}>
                        <div className={styles.timeUnit}>
                            <span className={styles.timeValue}>{timeRemaining?.days || 0}</span>
                            <span className={styles.timeLabel}>Días</span>
                        </div>
                        <span className={styles.separator}>:</span>
                        <div className={styles.timeUnit}>
                            <span className={styles.timeValue}>
                                {String(timeRemaining?.hours || 0).padStart(2, '0')}
                            </span>
                            <span className={styles.timeLabel}>Hrs</span>
                        </div>
                        <span className={styles.separator}>:</span>
                        <div className={styles.timeUnit}>
                            <span className={styles.timeValue}>
                                {String(timeRemaining?.minutes || 0).padStart(2, '0')}
                            </span>
                            <span className={styles.timeLabel}>Min</span>
                        </div>
                        <span className={styles.separator}>:</span>
                        <div className={styles.timeUnit}>
                            <span className={styles.timeValue}>
                                {String(timeRemaining?.seconds || 0).padStart(2, '0')}
                            </span>
                            <span className={styles.timeLabel}>Seg</span>
                        </div>
                    </div>
                    <p className={styles.subtitle}>
                        {fechaLimite
                            ? 'Plazo personalizado asignado por Recursos Humanos.'
                            : `Tienes ${COURSE_DURATION_DAYS} días desde tu fecha de ingreso para completar la inducción.`
                        }
                    </p>
                </div>
            </div>

            {totalCount > 0 && (
                <div className={styles.courseSummary}>
                    <div className={styles.courseSummaryHeader}>
                        <span className={styles.courseSummaryTitle}>Progreso de cursos</span>
                        <span className={styles.courseSummaryCount}>
                            {completedCount}/{totalCount}
                        </span>
                    </div>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                        />
                    </div>
                    <ul className={styles.courseList}>
                        {courseStatus.map(course => (
                            <li key={course.id} className={`${styles.courseItem} ${course.completed ? styles.courseCompleted : ''}`}>
                                {course.completed
                                    ? <CheckCircle size={14} className={styles.courseIconDone} />
                                    : <Circle size={14} className={styles.courseIconPending} />
                                }
                                <span className={styles.courseName}>{course.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

