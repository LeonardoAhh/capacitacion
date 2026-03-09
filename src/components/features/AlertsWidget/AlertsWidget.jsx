'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertCircle, Clock, BookOpen,
    ChevronRight, User, Building2, CalendarDays,
} from 'lucide-react';
import styles from './AlertsWidget.module.css';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Formatea fecha YYYY-MM-DD a formato legible en español */
const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
};

/** Etiqueta de días para urgencia */
const daysLabel = (days, overdue = false) => {
    if (overdue) {
        if (days === 0) return 'Vence hoy';
        return `Vencido hace ${days} día${days !== 1 ? 's' : ''}`;
    }
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Mañana';
    return `En ${days} día${days !== 1 ? 's' : ''}`;
};

/** Clase CSS de urgencia según días restantes */
const urgencyClass = (days, overdue = false, styles) => {
    if (overdue || days === 0) return styles.urgent;
    if (days <= 3)  return styles.warning;
    return styles.ok;
};

// ─── TabButton ─────────────────────────────────────────────────────────────────

function TabButton({ id, label, icon: Icon, count, active, onClick }) {
    return (
        <button
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            onClick={() => onClick(id)}
            aria-selected={active}
            role="tab"
        >
            <Icon size={15} className={styles.tabIcon} />
            <span className={styles.tabLabel}>{label}</span>
            {count > 0 && (
                <span className={`${styles.tabCount} ${active ? styles.tabCountActive : ''}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

// ─── EvalRow ───────────────────────────────────────────────────────────────────

function EvalRow({ item, onEdit }) {
    const isOverdue = !!item.daysOverdue;
    const days = isOverdue ? item.daysOverdue : item.daysUntil;
    const cls = urgencyClass(days, isOverdue, styles);
    const dateStr = item.dueDate || item.scheduledDate || item.date;

    return (
        <div
            className={`${styles.row} ${onEdit ? styles.rowClickable : ''}`}
            onClick={onEdit ? () => onEdit(item) : undefined}
        >
            {/* Indicador de urgencia */}
            <span className={`${styles.urgencyDot} ${cls}`} aria-hidden="true" />

            {/* Info principal */}
            <div className={styles.rowMain}>
                <span className={styles.rowName}>
                    {item.employeeName || item.employeeId}
                </span>
                <div className={styles.rowMeta}>
                    {item.position && (
                        <span className={styles.metaChip}>
                            <User size={11} /> {item.position}
                        </span>
                    )}
                    {item.area && (
                        <span className={styles.metaChip}>
                            <Building2 size={11} /> {item.area}
                        </span>
                    )}
                    <span className={styles.metaChip}>
                        <CalendarDays size={11} /> Eval. {item.evalNum} · {formatDate(dateStr)}
                    </span>
                </div>
            </div>

            {/* Badge días */}
            <span className={`${styles.daysBadge} ${cls}`}>
                {daysLabel(days, isOverdue)}
            </span>

            {onEdit && <ChevronRight size={14} className={styles.chevron} />}
        </div>
    );
}

// ─── ContractRow ───────────────────────────────────────────────────────────────

function ContractRow({ emp }) {
    const days = emp.daysUntilExpiry ?? 0;
    const cls  = urgencyClass(days, false, styles);

    return (
        <div className={styles.row}>
            <span className={`${styles.urgencyDot} ${cls}`} aria-hidden="true" />
            <div className={styles.rowMain}>
                <span className={styles.rowName}>
                    {emp.name || emp.employeeId}
                </span>
                <div className={styles.rowMeta}>
                    {emp.position && (
                        <span className={styles.metaChip}>
                            <User size={11} /> {emp.position}
                        </span>
                    )}
                    {emp.department && (
                        <span className={styles.metaChip}>
                            <Building2 size={11} /> {emp.department}
                        </span>
                    )}
                    <span className={styles.metaChip}>
                        <CalendarDays size={11} /> Vence: {formatDate(emp.contractEndDate)}
                    </span>
                </div>
            </div>
            <span className={`${styles.daysBadge} ${cls}`}>
                {days === 0 ? 'Hoy' : `En ${days} día${days !== 1 ? 's' : ''}`}
            </span>
        </div>
    );
}

// ─── TrainingRow ───────────────────────────────────────────────────────────────

function TrainingRow({ plan }) {
    const isOverdue = !!plan.daysOverdue;
    const days = isOverdue ? plan.daysOverdue : plan.daysUntil;
    const cls  = urgencyClass(days, isOverdue, styles);

    return (
        <div className={styles.row}>
            <span className={`${styles.urgencyDot} ${cls}`} aria-hidden="true" />
            <div className={styles.rowMain}>
                <span className={styles.rowName}>
                    {plan.employeeName || plan.employeeId}
                </span>
                <div className={styles.rowMeta}>
                    {plan.department && (
                        <span className={styles.metaChip}>
                            <Building2 size={11} /> {plan.department}
                        </span>
                    )}
                    <span className={styles.metaChip}>
                        <CalendarDays size={11} /> Entrega: {formatDate(plan.dueDate)}
                    </span>
                </div>
            </div>
            <span className={`${styles.daysBadge} ${cls}`}>
                {daysLabel(days, isOverdue)}
            </span>
        </div>
    );
}

// ─── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState({ label }) {
    return (
        <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>✓</span>
            <p className={styles.emptyText}>Sin {label} pendientes</p>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AlertsWidget({
    evaluations = { overdue: [], upcoming: [] },
    expiringEmployees = [],
    trainingPlans = { overdue: [], upcoming: [] },
    onEditEvaluation,
}) {
    const [activeTab, setActiveTab] = useState('evaluaciones');

    // Totales por tab para los badges
    const counts = useMemo(() => ({
        evaluaciones: evaluations.overdue.length + evaluations.upcoming.length,
        contratos:    expiringEmployees.length,
        formacion:    trainingPlans.overdue.length + trainingPlans.upcoming.length,
    }), [evaluations, expiringEmployees, trainingPlans]);

    const tabs = [
        { id: 'evaluaciones', label: 'Evaluaciones', icon: AlertCircle },
        { id: 'contratos',    label: 'Contratos',    icon: Clock       },
        { id: 'formacion',    label: 'Formación',    icon: BookOpen    },
    ];

    const totalAlerts = counts.evaluaciones + counts.contratos + counts.formacion;

    return (
        <section className={styles.widget} aria-label="Alertas de seguimiento">

            {/* ── Header ─────────────────────────────── */}
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.title}>Alertas</h2>
                    {totalAlerts > 0 && (
                        <span className={styles.totalBadge}>{totalAlerts} pendiente{totalAlerts !== 1 ? 's' : ''}</span>
                    )}
                </div>
            </div>

            {/* ── Tabs ───────────────────────────────── */}
            <div className={styles.tabBar} role="tablist" aria-label="Categorías de alertas">
                {tabs.map(tab => (
                    <TabButton
                        key={tab.id}
                        id={tab.id}
                        label={tab.label}
                        icon={tab.icon}
                        count={counts[tab.id]}
                        active={activeTab === tab.id}
                        onClick={setActiveTab}
                    />
                ))}
            </div>

            {/* ── Content ────────────────────────────── */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    className={styles.tabContent}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                    role="tabpanel"
                >
                    {/* Evaluaciones */}
                    {activeTab === 'evaluaciones' && (
                        <div className={styles.list}>
                            {evaluations.overdue.length === 0 && evaluations.upcoming.length === 0 ? (
                                <EmptyState label="evaluaciones" />
                            ) : (
                                <>
                                    {evaluations.overdue.length > 0 && (
                                        <div className={styles.group}>
                                            <span className={styles.groupLabel}>Vencidas</span>
                                            {evaluations.overdue.map((ev, i) => (
                                                <EvalRow key={`ov-${i}`} item={ev} onEdit={onEditEvaluation} />
                                            ))}
                                        </div>
                                    )}
                                    {evaluations.upcoming.length > 0 && (
                                        <div className={styles.group}>
                                            <span className={styles.groupLabel}>Próximas</span>
                                            {evaluations.upcoming.map((ev, i) => (
                                                <EvalRow key={`up-${i}`} item={ev} onEdit={onEditEvaluation} />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Contratos */}
                    {activeTab === 'contratos' && (
                        <div className={styles.list}>
                            {expiringEmployees.length === 0 ? (
                                <EmptyState label="contratos por vencer" />
                            ) : (
                                <div className={styles.group}>
                                    <span className={styles.groupLabel}>Próximos a vencer (30 días)</span>
                                    {expiringEmployees.map((emp, i) => (
                                        <ContractRow key={i} emp={emp} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Plan de Formación */}
                    {activeTab === 'formacion' && (
                        <div className={styles.list}>
                            {trainingPlans.overdue.length === 0 && trainingPlans.upcoming.length === 0 ? (
                                <EmptyState label="planes de formación" />
                            ) : (
                                <>
                                    {trainingPlans.overdue.length > 0 && (
                                        <div className={styles.group}>
                                            <span className={styles.groupLabel}>Vencidos</span>
                                            {trainingPlans.overdue.map((plan, i) => (
                                                <TrainingRow key={`tv-${i}`} plan={plan} />
                                            ))}
                                        </div>
                                    )}
                                    {trainingPlans.upcoming.length > 0 && (
                                        <div className={styles.group}>
                                            <span className={styles.groupLabel}>Próximos (7 días)</span>
                                            {trainingPlans.upcoming.map((plan, i) => (
                                                <TrainingRow key={`tu-${i}`} plan={plan} />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </section>
    );
}
