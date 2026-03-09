'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Building2, Layers, CalendarDays, Clock, CheckCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from './TrainingPlanModal.module.css';

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

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

export default function TrainingPlanModal({ isOpen, onClose, plan, onSaved }) {
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');

    if (!isOpen || !plan) return null;

    const handleMarkDelivered = async () => {
        if (!plan.firestoreId) {
            setError('No se encontró el ID del empleado en Firestore.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await updateDoc(doc(db, 'employees', plan.firestoreId), {
                trainingPlanDelivered: true,
            });
            onSaved?.(plan.firestoreId);
            onClose();
        } catch (err) {
            console.error('Error marcando plan como entregado:', err);
            setError('No se pudo guardar. Intenta de nuevo.');
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
                            <span className={styles.headerLabel}>Plan de Formación</span>
                            <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
                                <X size={18} />
                            </button>
                        </div>

                        {/* ── Empleado ───────────────────────────── */}
                        <div className={styles.employeeCard}>
                            <div className={styles.avatar}>
                                {(plan.employeeName || plan.employeeId || '?')[0].toUpperCase()}
                            </div>
                            <div className={styles.employeeInfo}>
                                <span className={styles.employeeName}>
                                    {plan.employeeName || plan.employeeId}
                                </span>
                                {plan.department && (
                                    <span className={styles.employeeSub}>{plan.department}</span>
                                )}
                            </div>
                        </div>

                        {/* ── Datos ──────────────────────────────── */}
                        <div className={styles.infoGrid}>
                            <InfoRow icon={User}         label="ID Empleado"  value={plan.employeeId} />
                            <InfoRow icon={Layers}       label="Departamento" value={plan.department} />
                            <InfoRow icon={Clock}        label="Turno"        value={plan.shift} />
                            <InfoRow icon={CalendarDays} label="Fecha de entrega" value={formatDate(plan.dueDate)} />
                        </div>

                        {/* ── Estado urgencia ─────────────────────── */}
                        <div className={styles.statusRow}>
                            {plan.daysOverdue ? (
                                <span className={styles.badgeUrgent}>
                                    Vencido hace {plan.daysOverdue} día{plan.daysOverdue !== 1 ? 's' : ''}
                                </span>
                            ) : (
                                <span className={styles.badgeWarning}>
                                    Vence en {plan.daysUntil} día{plan.daysUntil !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {/* ── Acción ─────────────────────────────── */}
                        <div className={styles.actions}>
                            {error && <p className={styles.errorMsg}>{error}</p>}
                            <button
                                type="button"
                                className={styles.cancelBtn}
                                onClick={onClose}
                                disabled={saving}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                className={styles.confirmBtn}
                                onClick={handleMarkDelivered}
                                disabled={saving}
                            >
                                <CheckCircle size={16} />
                                {saving ? 'Guardando…' : 'Marcar como entregado'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
