'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, Users } from 'lucide-react';
import styles from './RadarSupervisorSimSlide.module.css';

const ANSWER_LABELS = {
    full: 'Lo conozco bien',
    partial: 'Parcialmente',
    none: 'No lo se',
};

const ANSWER_POINTS = {
    full: 2,
    partial: 1,
    none: 0,
};

const LEVEL_LABELS = {
    1: 'Nivel 1: Datos operativos',
    2: 'Nivel 2: Contexto personal',
    3: 'Nivel 3: Motivadores profundos',
};

const RadarSupervisorSimSlide = React.memo(function RadarSupervisorSimSlide({ data }) {
    const {
        heading = 'Simulador: El Radar del Supervisor',
        subtitle = 'Evalua que tanto conoces a tu gente y detecta vacios de informacion.',
        items = [],
    } = data || {};

    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const totalItems = items.length;

    const grouped = useMemo(() => {
        return [1, 2, 3].map((level) => ({
            level,
            label: LEVEL_LABELS[level],
            items: items.filter((it) => Number(it.level) === level),
        }));
    }, [items]);

    const isComplete = totalItems > 0 && Object.keys(answers).length === totalItems;

    const report = useMemo(() => {
        if (!submitted || totalItems === 0) return null;

        const maxPoints = totalItems * 2;
        const totalPoints = items.reduce((acc, item) => acc + (ANSWER_POINTS[answers[item.id]] || 0), 0);
        const percent = Math.round((totalPoints / maxPoints) * 100);

        const byLevel = grouped.map((group) => {
            const groupMax = group.items.length * 2;
            const groupPoints = group.items.reduce((acc, item) => acc + (ANSWER_POINTS[answers[item.id]] || 0), 0);
            return {
                level: group.level,
                label: group.label,
                percent: groupMax > 0 ? Math.round((groupPoints / groupMax) * 100) : 0,
            };
        });

        let diagnosis = 'Gestionas informacion operativa con solidez, pero aun hay oportunidades para profundizar en el lado humano.';
        let tone = 'high';

        if (percent < 50) {
            diagnosis = 'Hay puntos ciegos importantes: estas liderando desde indicadores, no desde conocimiento real de las personas.';
            tone = 'low';
        } else if (percent < 75) {
            diagnosis = 'Conoces parte de tu equipo, pero tu radar aun es intermedio. Fortalece conversaciones uno a uno.';
            tone = 'mid';
        }

        return { percent, byLevel, diagnosis, tone };
    }, [submitted, totalItems, items, grouped, answers]);

    const onSelect = (itemId, value) => {
        setAnswers((prev) => ({ ...prev, [itemId]: value }));
    };

    const onRestart = () => {
        setAnswers({});
        setSubmitted(false);
    };

    return (
        <article className={styles.slide} role="region" aria-label={heading}>
            <header className={styles.header}>
                <div>
                    <h2>{heading}</h2>
                    <p>{subtitle}</p>
                </div>
                <div className={styles.pill}>
                    <Users size={16} aria-hidden="true" />
                    <span>{Object.keys(answers).length}/{totalItems} reactivos</span>
                </div>
            </header>

            <div className={styles.grid}>
                {grouped.map((group) => (
                    <section key={group.level} className={styles.levelCard}>
                        <h3>{group.label}</h3>
                        <div className={styles.items}>
                            {group.items.map((item) => (
                                <div key={item.id} className={styles.itemRow}>
                                    <p>{item.prompt}</p>
                                    <div className={styles.choiceRow}>
                                        {Object.entries(ANSWER_LABELS).map(([value, label]) => (
                                            <button
                                                key={value}
                                                type="button"
                                                className={`${styles.choiceBtn} ${answers[item.id] === value ? styles.choiceBtnActive : ''}`}
                                                onClick={() => onSelect(item.id, value)}
                                                aria-pressed={answers[item.id] === value}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
            </div>

            <div className={styles.actions}>
                {!submitted ? (
                    <button
                        type="button"
                        className={`${styles.primaryBtn} ${!isComplete ? styles.disabledBtn : ''}`}
                        disabled={!isComplete}
                        onClick={() => setSubmitted(true)}
                    >
                        Ver diagnostico
                    </button>
                ) : (
                    <button type="button" className={styles.secondaryBtn} onClick={onRestart}>
                        <RefreshCw size={16} aria-hidden="true" />
                        Reiniciar simulador
                    </button>
                )}
            </div>

            {report && (
                <section className={`${styles.report} ${styles[`report_${report.tone}`]}`}>
                    <div className={styles.reportHead}>
                        {report.tone === 'high' ? (
                            <CheckCircle2 size={20} aria-hidden="true" />
                        ) : (
                            <AlertTriangle size={20} aria-hidden="true" />
                        )}
                        <strong>Resultado general: {report.percent}%</strong>
                    </div>
                    <p>{report.diagnosis}</p>

                    <div className={styles.bars}>
                        {report.byLevel.map((row) => (
                            <div key={row.level} className={styles.barRow}>
                                <span>{row.label}</span>
                                <div className={styles.track}>
                                    <div className={styles.fill} style={{ width: `${row.percent}%` }} />
                                </div>
                                <span>{row.percent}%</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </article>
    );
});

export default RadarSupervisorSimSlide;
