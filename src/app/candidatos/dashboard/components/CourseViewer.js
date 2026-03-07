import { ChevronLeft, CheckCircle, BookOpen, Lock, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './CourseViewer.module.css';
import LazyIframe from '@/components/ui/LazyIframe/LazyIframe';
import { convertDriveUrl } from '../utils/helpers';



/** Convierte a Title Case: "SERRANO" → "Serrano" */
const toTitle = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

/**
 * Retorna nickname si existe, o "Nombre Apellido" (1+1) del nombre completo.
 * Formato almacenado: "APELLIDO_PAT APELLIDO_MAT NOMBRE1 NOMBRE2..."
 */
function getDisplayName(c) {
    if (c?.nickname?.trim()) return c.nickname.trim();
    const full = (c?.name || c?.nombre || '').trim();
    if (!full) return 'Colaborador';
    const parts = full.split(/\s+/);
    if (parts.length >= 3) return `${toTitle(parts[2])} ${toTitle(parts[0])}`;
    return parts.slice(0, 2).map(toTitle).join(' ');
}

export default function CourseViewer({
    selectedCourse,
    onClose,
    candidate,
    courseProgress,
    isStepUnlocked,
    getCurrentStepNumber,
    markStepComplete,
    onOpenExamModal,
    onDownloadExam,
    onPlayNative,
}) {
    const progress = courseProgress[selectedCourse.id] || {};

    const courseTitle = selectedCourse.title || selectedCourse.nombre;
    const candidateName = getDisplayName(candidate);

    return (
        <div className={styles.overlayContainer}>
            <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-label={`Curso: ${courseTitle}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <button onClick={onClose} className={styles.modalBack} aria-label="Cerrar y volver">
                        <ChevronLeft size={20} aria-hidden="true" />
                        <span>Volver</span>
                    </button>
                    <h3 className={styles.modalTitle}>{courseTitle}</h3>
                    <div className={styles.modalBackSpacer} aria-hidden="true" />
                </div>

                <div className={styles.stepsContainer}>
                    <div className={styles.stepCard}>
                        <div className={styles.stepHeader}>
                            <h4 className={styles.stepTitle}>Material Interactivo</h4>
                        </div>
                        <div className={styles.stepContent} style={{ paddingLeft: 0 }}>
                            <p className={styles.stepText}>
                                Hola <strong>{candidateName}</strong>, visualiza el material a continuación y haz clic en Finalizar al concluir.
                            </p>

                            <div className={styles.viewerContainer}>
                                {selectedCourse.candidateView === 'url' && selectedCourse.contenidoUrl ? (
                                    /* Admin eligió mostrar URL/PDF para este curso nativo */
                                    <LazyIframe
                                        src={convertDriveUrl(selectedCourse) || selectedCourse.contenidoUrl}
                                        title={courseTitle}
                                        className={styles.iframe}
                                    />
                                ) : selectedCourse.tipo === 'link' ? (
                                    /* Recurso URL / PDF */
                                    selectedCourse.contenidoUrl ? (
                                        <LazyIframe
                                            src={convertDriveUrl(selectedCourse) || selectedCourse.contenidoUrl}
                                            title={courseTitle}
                                            className={styles.iframe}
                                        />
                                    ) : (
                                        <div className={styles.noContent} role="status">
                                            <BookOpen size={28} className={styles.noContentIcon} aria-hidden="true" />
                                            <p>No hay URL configurada</p>
                                        </div>
                                    )
                                ) : (
                                    /* Curso interactivo (nativo) — legacy con nativeCourseId o nuevo con id */
                                    <div className={styles.noContent}>
                                        <Zap size={32} style={{ color: 'var(--color-primary)', marginBottom: 12 }} />
                                        <p style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>
                                            Este es un curso interactivo con diapositivas animadas.
                                        </p>
                                        <button
                                            className={styles.stepButton}
                                            style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', gap: 8 }}
                                            onClick={() => onPlayNative && onPlayNative(selectedCourse.nativeCourseId || selectedCourse.id)}
                                        >
                                            <Zap size={16} />
                                            Abrir Curso Interactivo
                                        </button>
                                    </div>
                                )}
                            </div>

                            {progress.presentationCompleted || progress.step2Completed || progress.completed || progress.step1Completed ? (
                                <div className={styles.stepCompleted} role="status">
                                    <CheckCircle size={16} aria-hidden="true" />
                                    Curso Finalizado
                                </div>
                            ) : (
                                <button
                                    className={`${styles.stepButton} ${styles.stepButtonPrimary}`}
                                    onClick={() => markStepComplete(selectedCourse.id, 'presentationCompleted')}
                                >
                                    <CheckCircle size={16} aria-hidden="true" />
                                    Finalizar Curso
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
