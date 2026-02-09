"use client";

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
import styles from './CandidateDrawer.module.css';
import induccionEmpresaExam from '../../../public/examenes/induccion_empresa.json';

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
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .trim();
    };

    // If we are closed or no candidate, we might still need to render the Drawer wrapper if controlled externally,
    // usually the parent handles "if (!candidate) return null" or passes open={false}

    const completedIds = candidate?.cursosCompletados || [];
    const requiredCourseNames = candidate?.requiredCourseNames || [];



    // Calculate status for each course
    const getCourseStatus = (courseName) => {
        if (!candidate) return 'notStarted';

        const targetNameNormalized = normalizeString(courseName);

        // 1. Get List of Completed Course Names (Normalized)
        const completedNamesNormalized = completedIds.map(id => {
            const course = coursesMap[id];
            const name = course?.name || course?.nombre || course?.title;
            return name ? normalizeString(name) : null;
        }).filter(Boolean);

        // 2. Check overlap by NAME (Primary robust check)
        const isCompletedByName = completedNamesNormalized.includes(targetNameNormalized);

        // 3. Check overlap by ID (Secondary precise check)
        // Find the ID of the course we are looking for
        let targetCourseId = null;
        for (const [id, course] of Object.entries(coursesMap)) {
            if (
                normalizeString(course.name) === targetNameNormalized ||
                normalizeString(course.title) === targetNameNormalized ||
                normalizeString(course.nombre) === targetNameNormalized
            ) {
                targetCourseId = id;
                break;
            }
        }
        const isCompletedById = targetCourseId && completedIds.includes(targetCourseId);

        const isCompleted = isCompletedByName || isCompletedById;

        // Get progress for this course
        const progress = targetCourseId ? (candidate.coursesProgress?.[targetCourseId] || null) : null;
        const hasProgress = progress?.presentationCompleted || progress?.examDownloaded;

        if (isCompleted) return 'completed';
        if (hasProgress) return 'inProgress';
        return 'notStarted';
    };

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

    const handlePrintExam = (courseId, courseName, examData) => {
        if (!candidate || !courseId) return;

        const progress = candidate.coursesProgress?.[courseId];
        const answers = progress?.examAnswers || {};
        const score = progress?.examScore || 0;
        const examDate = progress?.examDate ? new Date(progress.examDate).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX');

        const printWindow = window.open('', '_blank');

        let questionsHtml = '';
        const questions = induccionEmpresaExam.cuestionario || [];

        questions.forEach((q, index) => {
            const userAnswer = answers[q.id];

            let optionsHtml = '';
            q.opciones.forEach(opt => {
                const isSelected = userAnswer === opt;
                const style = isSelected ? 'font-weight: bold; text-decoration: underline;' : '';
                const check = isSelected ? '[X]' : '[ ]';
                optionsHtml += `<div style="${style} margin-bottom: 4px;">${check} ${opt}</div>`;
            });

            questionsHtml += `
                <div style="margin-bottom: 20px; page-break-inside: avoid;">
                    <p style="font-weight: bold; margin-bottom: 8px;">${index + 1}. ${q.pregunta}</p>
                    <div style="margin-left: 20px;">
                        ${optionsHtml}
                    </div>
                </div>
            `;
        });

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Examen - ${candidate.name}</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; margin: 0; padding: 20px; }
                    .header { display: flex; align-items: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                    .logo { width: 100px; margin-right: 20px; }
                    .title-container { flex: 1; text-align: center; }
                    .title { font-size: 18px; font-weight: bold; margin: 0; }
                    .info-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .info-table td { border: 1px solid #ccc; padding: 6px; }
                    .info-label { font-weight: bold; background-color: #f5f5f5; width: 120px; }
                    .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px; display: flex; justify-content: space-between; font-size: 10px; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/logo.png" class="logo" alt="Viñoplastic" />
                    <div class="title-container">
                        <h1 class="title">${induccionEmpresaExam.exámen.courseName}</h1>
                    </div>
                </div>

                <table class="info-table">
                    <tr>
                        <td class="info-label">Nombre:</td>
                        <td>${candidate.name}</td>
                        <td class="info-label">No. Empleado:</td>
                        <td>${candidate.employeeId || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Puesto:</td>
                        <td>${candidate.position || 'N/A'}</td>
                        <td class="info-label">Departamento:</td>
                        <td>${candidate.department || candidate.area || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Fecha:</td>
                        <td>${examDate}</td>
                        <td class="info-label">Turno:</td>
                        <td>${candidate.shift || 'N/A'}</td>
                    </tr>
                     <tr>
                        <td class="info-label">Calificación:</td>
                        <td colspan="3"><strong>${score.toFixed(1)}%</strong></td>
                    </tr>
                </table>

                <div class="questions">
                    ${questionsHtml}
                </div>

                <div class="footer">
                    <span>RG-ADM-060</span>
                    <span>REV.1</span>
                </div>

                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
            <DrawerContent className={styles.drawerContent}>
                {candidate && (
                    <motion.div
                        initial="hidden"
                        animate="visible"
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
                                    <DrawerTitle>{candidate.name}</DrawerTitle>
                                    <DrawerDescription>{candidate.position}</DrawerDescription>
                                </div>
                                <span className={`${styles.progressBadge} ${progressBadge.class}`}>
                                    {progressBadge.text}
                                </span>

                            </motion.div>
                        </DrawerHeader>

                        <div className={styles.body}>
                            {/* Candidate Info */}
                            <motion.div variants={itemVariants} className={styles.infoSection}>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>ID Empleado</span>
                                        <span className={styles.infoValue}>{candidate.employeeId || 'N/A'}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Último acceso</span>
                                        <span className={styles.infoValue}>{candidate.lastLogin || 'Nunca'}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Cursos completados</span>
                                        <span className={styles.infoValue}>{candidate.completedCount} de {candidate.requiredCount}</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Progress Bar */}
                            <motion.div variants={itemVariants} className={styles.progressSection}>
                                <div className={styles.progressHeader}>
                                    <GraduationCap size={18} />
                                    <span>Progreso de Capacitación</span>
                                </div>
                                <div className={styles.progressBarContainer}>
                                    <div
                                        className={styles.progressBar}
                                        style={{ width: `${Math.min(candidate.progress, 100)}%` }}
                                    />
                                </div>
                                <div className={styles.progressStats}>
                                    <span>{candidate.progress}% completado</span>
                                </div>
                            </motion.div>

                            {/* Courses List */}
                            <motion.div variants={itemVariants} className={styles.coursesSection}>
                                <h3 className={styles.sectionTitle}>Cursos Requeridos</h3>
                                <div className={styles.coursesList}>
                                    {candidate.requiredCourseIds && candidate.requiredCourseIds.length > 0 ? (
                                        candidate.requiredCourseIds.map((courseId, index) => {
                                            const courseObj = coursesMap[courseId];
                                            const courseName = courseObj?.name || courseObj?.nombre || courseObj?.title || 'Curso Desconocido';

                                            // Status Logic by ID (Direct & Robust)
                                            const isCompleted = completedIds.includes(courseId);
                                            const progress = candidate.coursesProgress?.[courseId] || null;
                                            const hasProgress = progress?.presentationCompleted || progress?.examDownloaded;

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
                                                            <div className={styles.courseDetails}>
                                                                {progress?.presentationCompleted && (
                                                                    <span className={styles.courseDetail}>
                                                                        <FileText size={12} /> Presentación
                                                                    </span>
                                                                )}
                                                                {progress?.examDownloaded && (
                                                                    <span className={styles.courseDetail}>
                                                                        <FileCheck size={12} /> Examen
                                                                    </span>
                                                                )}
                                                                {/* Print Button for Induction Exam */}
                                                                {(courseName.toUpperCase().includes('INDUCCIÓN A LA EMPRESA') && (progress?.examScore !== undefined || progress?.examDownloaded)) && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handlePrintExam(courseId, courseName);
                                                                        }}
                                                                        className={styles.printButton}
                                                                        style={{
                                                                            marginLeft: '8px',
                                                                            padding: '2px 8px',
                                                                            fontSize: '11px',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px',
                                                                            border: '1px solid #ccc',
                                                                            borderRadius: '4px',
                                                                            background: 'white',
                                                                            cursor: 'pointer'
                                                                        }}
                                                                    >
                                                                        <Printer size={10} /> Imprimir
                                                                    </button>
                                                                )}
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
                        </div>

                        <DrawerFooter>
                            <motion.div variants={itemVariants} className={styles.footerActions}>
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
    );
}
