"use client";

import { motion } from "framer-motion";
import { PlayCircle, Award, CheckCircle, Clock } from "lucide-react";
import styles from './CourseCard.module.css';

export default function CourseCard({ course, onClick }) {
    return (
        <motion.div
            className={styles.card}
            whileHover={{ y: -5 }}
            onClick={() => onClick(course)}
        >
            <div className={styles.imageContainer}>
                {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className={styles.image} />
                ) : (
                    <div className={styles.placeholderImage}>
                        <Award className={styles.placeholderIcon} />
                    </div>
                )}
                <div className={styles.overlay}>
                    <PlayCircle className={styles.playIcon} />
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.header}>
                    <span className={`${styles.status} ${styles[course.status]}`}>
                        {course.status === 'completed' ? 'Completado' : 'Pendiente'}
                    </span>
                    {course.duration && (
                        <span className={styles.duration}>
                            <Clock size={14} /> {course.duration}
                        </span>
                    )}
                </div>

                <h3 className={styles.title}>{course.title}</h3>
                <p className={styles.description}>{course.description}</p>

                {course.status === 'completed' && (
                    <div className={styles.completedBadge}>
                        <CheckCircle size={16} /> Completado el {new Date(course.completedAt).toLocaleDateString()}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
