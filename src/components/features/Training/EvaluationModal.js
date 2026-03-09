import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Building2, Layers, CalendarDays, Clock, Hash, Star } from 'lucide-react';
import styles from './EvaluationModal.module.css';

/**
 * Convierte cualquier formato de fecha a un Date local sin desfase UTC.
 * Soporta: strings YYYY-MM-DD, ISO completo, Timestamps de Firebase.
 */
function parseFecha(valor) {
    if (!valor) return null;
    if (typeof valor === 'object' && valor.seconds !== undefined)
        return new Date(valor.seconds * 1000);
    const s = String(valor);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const d = new Date(s + 'T00:00:00');
        return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

const formatDate = (raw) => {
    const d = parseFecha(raw);
    return d ? d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
};

/** Badge de urgencia según días vencidos / restantes */
function UrgencyBadge({ evaluation }) {
    const isOverdue = !!evaluation.daysOverdue;
    const days = isOverdue ? evaluation.daysOverdue : evaluation.daysUntil;

    if (isOverdue) {
        return (
            <span className={`${styles.urgencyBadge} ${styles.urgent}`}>
                Vencida hace {days} día{days !== 1 ? 's' : ''}
            </span>
        );
    }
    if (days === 0) return <span className={`${styles.urgencyBadge} ${styles.urgent}`}>Vence hoy</span>;
    if (days <= 3)  return <span className={`${styles.urgencyBadge} ${styles.warning}`}>En {days} día{days !== 1 ? 's' : ''}</span>;
    return <span className={`${styles.urgencyBadge} ${styles.ok}`}>En {days} días</span>;
}

/** Fila de dato */
function InfoRow({ icon: Icon, label, value }) {
    if (!value) return null;
    return (
        <div className={styles.infoRow}>
            <div className={styles.infoIconWrap}><Icon size={15} /></div>
            <div className={styles.infoTexts}>
                <span className={styles.infoLabel}>{label}</span>
                <span className={styles.infoValue}>{value}</span>
            </div>
        </div>
    );
}

export default function EvaluationModal({ isOpen, onClose, evaluation, onSave }) {
    const [score, setScore] = useState('');
    const [saving, setSaving] = useState(false);

    if (!isOpen || !evaluation) return null;

    const rawDate = evaluation.dueDate || evaluation.scheduledDate || evaluation.date;

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(evaluation, `Puntaje: ${score}`);
            onClose();
        } catch (err) {
            console.error('Error guardando evaluación:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={styles.overlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={onClose}
                >
                    <motion.div
                        className={styles.modal}
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* ── Header ─────────────────────────────── */}
                        <div className={styles.header}>
                            <div className={styles.headerContent}>
                                <span className={styles.evalLabel}>{evaluation.evaluationType || 'Evaluación'}</span>
                                <UrgencyBadge evaluation={evaluation} />
                            </div>
                            <button
                                className={styles.closeBtn}
                                onClick={onClose}
                                aria-label="Cerrar"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* ── Empleado highlight ─────────────────── */}
                        <div className={styles.employeeCard}>
                            <div className={styles.employeeAvatar}>
                                {(evaluation.employeeName || evaluation.employeeId || '?')[0].toUpperCase()}
                            </div>
                            <div className={styles.employeeInfo}>
                                <span className={styles.employeeName}>
                                    {evaluation.employeeName || evaluation.employeeId}
                                </span>
                                {evaluation.position && (
                                    <span className={styles.employeeRole}>{evaluation.position}</span>
                                )}
                            </div>
                        </div>

                        {/* ── Info grid ─────────────────────────── */}
                        <div className={styles.infoGrid}>
                            <InfoRow icon={Hash}         label="ID Empleado"  value={evaluation.employeeId} />
                            <InfoRow icon={Building2}    label="Área"         value={evaluation.area} />
                            <InfoRow icon={Layers}       label="Departamento" value={evaluation.department} />
                            <InfoRow icon={Clock}        label="Turno"        value={evaluation.shift} />
                            <InfoRow icon={CalendarDays} label="Fecha programada" value={formatDate(rawDate)} />
                        </div>

                        {/* ── Formulario ──────────────────────── */}
                        <form className={styles.form} onSubmit={handleSave}>
                            <div className={styles.formSection}>
                                <label className={styles.formLabel}>
                                    <Star size={14} className={styles.formLabelIcon} />
                                    Puntaje obtenido
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    className={styles.scoreInput}
                                    placeholder="0 – 100"
                                    value={score}
                                    onChange={(e) => setScore(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={onClose}>
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className={styles.saveBtn}
                                    disabled={saving || !score.toString().trim()}
                                >
                                    {saving ? 'Guardando…' : 'Guardar resultado'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
