"use client";

import { useState, useEffect } from 'react';
import { User, GraduationCap, FileText, FileCheck, ArrowRight, CheckCircle2, Clock, Circle, Printer } from "lucide-react";
import { motion } from "framer-motion";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/Drawer/Drawer";
import ExamResultPrint, { loadAllExamResults } from '@/components/features/Dashboard/ExamResultPrint';
import styles from './CandidateDrawer.module.css';

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
        },
    },
};

export default function CandidateDrawer({
    children,
    candidate,
    coursesMap = {},
    open,
    onOpenChange
}) {
    // If no candidate provided and it's controlled, don't render content or render empty
    // But we need to render the Drawer root if we want to control it.

    // Normalization helper
    const normalizeString = (str) => {
        if (!str) return '';
        return str
            .toString()
            .toLowerCase()
            .normalize("NFD").replace(/[-]/g, "") // Remove accents
            .trim();
    };

    // If we are closed or no candidate, we might still need to render the Drawer wrapper if controlled externally,
    // usually the parent handles "if (!candidate) return null" or passes open={false}

    const completedIds = candidate?.cursosCompletados || [];
    const requiredCourseNames = candidate?.requiredCourseNames || [];

    // Estado para resultados de exámenes
    const [examResults, setExamResults] = useState([]);
    const [printExamId, setPrintExamId] = useState(null);
    const [activeTab, setActiveTab] = useState('resumen');

    useEffect(() => {
        if (!candidate?.id) return;
        setExamResults([]);
        loadAllExamResults(candidate.id).then(setExamResults);
        setActiveTab('resumen'); // Reset tab when candidate changes
    }, [candidate?.id]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return { text: 'Completado', class: styles.badgeCompleted, icon: <CheckCircle2 size={14} /> };
            case 'inProgress':
                return { text: 'En progreso', class: styles.badgeProgress, icon: <Clock size={14} /> };
            default:
                return { text: 'Sin iniciar', class: styles.badgeNotStarted, icon: <Circle size={14} /> };
        }
    };

    const getProgressBadge = () => {
        if (!candidate) return { text: '', class: '' };
        if (candidate.progress >= 100) return { text: 'Completado', class: styles.typePrimary };
        if (candidate.progress > 0) return { text: `${candidate.progress}%`, class: styles.typeProgress };
        return { text: 'Sin iniciar', class: styles.typeNotStarted };
    };

    const progressBadge = getProgressBadge();

    return (
        <>
        <Drawer open={open} onOpenChange={onOpenChange}>
            {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
            <DrawerContent className={styles.drawerContent}>
                {candidate && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
                        variants={{
                            visible: {
                                transition: {
                                    staggerChildren: 0.05,
                                    delayChildren: 0.1,
                                },
                            },
                        }}
                    >
                        <DrawerHeader>
                            <motion.div variants={itemVariants} className={styles.headerContent}>
                                <div className={styles.iconWrapper}>
                                    <User className={styles.icon} />
                                </div>
                                <div className={styles.headerText}>
                                    <DrawerTitle className={styles.headerTitle}>{candidate.name}</DrawerTitle>
                                    <DrawerDescription className={styles.headerDesc}>{candidate.position}</DrawerDescription>
                                </div>
                                <span className={`${styles.progressBadge} ${progressBadge.class}`}>
                                    {progressBadge.text}
                                </span>
                            </motion.div>
                        </DrawerHeader>

                        {/* Tabs Navigation */}
                        <motion.div variants={itemVariants} className={styles.tabsContainer}>
                            <button 
                                className={`${styles.tab} ${activeTab === 'resumen' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('resumen')}
                            >
                                Resumen
                            </button>
                            <button 
                                className={`${styles.tab} ${activeTab === 'cursos' ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab('cursos')}
                            >
                                Cursos
                            </button>
                            {examResults.length > 0 && (
                                <button 
                                    className={`${styles.tab} ${activeTab === 'examenes' ? styles.tabActive : ''}`}
                                    onClick={() => setActiveTab('examenes')}
                                >
                                    Exámenes
                                </button>
                            )}
                        </motion.div>

                        <div className={styles.body}>
                            {activeTab === 'resumen' && (
                                <>
                                    {/* Candidate Info Card */}
                                    <motion.div variants={itemVariants} className={`${styles.infoSection} ${styles.card}`}>
                                        <div className={styles.infoGrid}>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>ID Empleado</span>
                                                <span className={styles.infoValue}>{candidate.employeeId || 'N/A'}</span>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.infoLabel}>Último acceso</span>
                                                <span className={styles.infoValue}>{candidate.lastLogin || 'Nunca'}</span>
                                            </div>
                                            <div className={styles.infoItem} style={{ gridColumn: 'span 2', marginTop: '4px' }}>
                                                <span className={styles.infoLabel}>Cursos completados</span>
                                                <span className={styles.infoValue}>{candidate.completedCount} de {candidate.requiredCount}</span>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Progress Section Card */}
                                    <motion.div variants={itemVariants} className={`${styles.progressSection} ${styles.card}`}>
                                        <div className={styles.progressLabel}>
                                            <GraduationCap size={18} />
                                            <span>Progreso de Capacitación</span>
                                        </div>
                                        <div className={styles.progressBarContainer}>
                                            <div
                                                className={styles.progressBar}
                                                style={{ width: `${Math.min(candidate.progress, 100)}%` }}
                                            />
                                        </div>
                                        <div className={styles.progressDetail}>
                                            {candidate.progress}% completado
                                        </div>
                                    </motion.div>
                                </>
                            )}

                            {activeTab === 'cursos' && (
                                <motion.div variants={itemVariants} className={styles.coursesSection}>
                                    <h3 className={styles.sectionTitle}>Cursos Requeridos</h3>
                                    <div className={styles.coursesList}>
                                        {candidate.requiredCourseIds && candidate.requiredCourseIds.length > 0 ? (
                                            candidate.requiredCourseIds.map((courseId, index) => {
                                                const courseObj = coursesMap[courseId];
                                                const courseName = courseObj?.name || courseObj?.nombre || courseObj?.title || 'Curso Desconocido';
                                                
                                                const isCompleted = completedIds.includes(courseId);
                                                const progress = candidate.coursesProgress?.[courseId] || null;
                                                const hasProgress = progress?.presentationCompleted;

                                                let status = 'notStarted';
                                                if (isCompleted) status = 'completed';
                                                else if (hasProgress) status = 'inProgress';

                                                const statusBadge = getStatusBadge(status);

                                                return (
                                                    <motion.div
                                                        key={courseId}
                                                        variants={itemVariants}
                                                        className={`${styles.courseItem} ${styles[status]}`}
                                                    >
                                                        <div className={styles.courseMain}>
                                                            <div className={styles.courseIcon}>
                                                                {statusBadge.icon}
                                                            </div>
                                                            <div className={styles.courseInfo}>
                                                                <span className={styles.courseName}>{courseName}</span>
                                                                <div className={styles.courseType}>
                                                                    <FileText size={12} /> Presentación
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span className={`${styles.statusBadge} ${statusBadge.class}`}>
                                                            {statusBadge.text}
                                                        </span>
                                                    </motion.div>
                                                );
                                            })
                                        ) : (
                                            <div className={styles.emptyState}>
                                                <p>No hay cursos asignados para este puesto</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'examenes' && examResults.length > 0 && (
                                <motion.div variants={itemVariants} className={styles.coursesSection}>
                                    <h3 className={styles.sectionTitle}>Exámenes Contestados</h3>
                                    <div className={styles.coursesList}>
                                        {examResults.map(result => (
                                            <motion.div
                                                key={result.id}
                                                variants={itemVariants}
                                                className={`${styles.courseItem} ${result.passed ? styles.completed : styles.inProgress}`}
                                            >
                                                <div className={styles.courseMain}>
                                                    <div className={styles.courseIcon}>
                                                        {result.passed ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                                    </div>
                                                    <div className={styles.courseInfo}>
                                                        <span className={styles.courseName}>{result.examTitle}</span>
                                                        <div className={styles.courseType}>
                                                            Calificación: <strong>{result.score10}/10</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    className={styles.btnPrint}
                                                    onClick={() => setPrintExamId(result.id)}
                                                >
                                                    <Printer size={14} /> Imprimir
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                        </div>

                        <DrawerFooter className={styles.footerActions}>
                            <motion.div variants={itemVariants} style={{ width: '100%' }}>
                                <DrawerClose asChild>
                                    <button className={styles.closeButton}>
                                        Cerrar
                                    </button>
                                </DrawerClose>
                            </motion.div>
                        </DrawerFooter>
                    </motion.div>
                )}
            </DrawerContent>
        </Drawer>

        {/* Modal de impresión de examen contestado */}
        {printExamId && candidate && (
            <ExamResultPrint
                candidate={candidate}
                examId={printExamId}
                onClose={() => setPrintExamId(null)}
            />
        )}
        </>
    );
}
