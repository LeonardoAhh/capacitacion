'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceLine, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import styles from './ThermalSimSlide.module.css';

// ── Modelo de disipación térmica ─────────────────────────────────────────────
// T(t) = T_env + (T_op - T_env) * e^(-t / tau)
const T_ENV = 25;     // °C ambiente
const T_SAFE = 50;    // °C umbral seguro para LOTO
const MINUTES = 120;  // puntos de la gráfica

const COMPONENTS = [
    { value: 'molde_s',    label: 'Molde Pequeño',  tau: 12,  massKg: '< 50 kg'  },
    { value: 'molde_m',    label: 'Molde Mediano',   tau: 28,  massKg: '50-500 kg' },
    { value: 'molde_l',    label: 'Molde Grande',    tau: 55,  massKg: '> 500 kg' },
    { value: 'canon',      label: 'Cañón',           tau: 8,   massKg: '~10 kg'   },
    { value: 'hotrunner',  label: 'Hot Runner',      tau: 40,  massKg: '~80 kg'   },
];

function tempAt(tOp, tau, minutes) {
    return T_ENV + (tOp - T_ENV) * Math.exp(-minutes / tau);
}

function safeMinutes(tOp, tau) {
    if (tOp <= T_SAFE) return 0;
    // t_safe = tau * ln((T_op - T_env) / (T_safe - T_env))
    return tau * Math.log((tOp - T_ENV) / (T_SAFE - T_ENV));
}

// ── Tooltip personalizado ─────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const temp = payload[0]?.value;
    return (
        <div className={styles.tooltip}>
            <p className={styles.tooltipTime}>{label} min</p>
            <p className={styles.tooltipTemp}>{temp != null ? temp.toFixed(1) : '—'} °C</p>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────
const ThermalSimSlide = React.memo(function ThermalSimSlide({ data }) {
    const { heading, subtitle, safeTemp: customSafeTemp } = data || {};
    const safeLimit = customSafeTemp ?? T_SAFE;

    const [opTemp, setOpTemp] = useState(280);
    const [compKey, setCompKey] = useState('molde_m');

    const comp = COMPONENTS.find(c => c.value === compKey) || COMPONENTS[1];

    // Tiempo para enfriar a temperatura segura
    const waitTime = useMemo(() => safeMinutes(opTemp, comp.tau), [opTemp, comp.tau]);
    const waitMin = Math.ceil(waitTime);

    // Temperatura actual en t=0 (al apagar la máquina)
    const currentTemp = opTemp;

    // Estado de seguridad
    const isSafe = currentTemp <= safeLimit;
    const statusLabel = isSafe ? 'Liberado' : 'En espera';
    const statusClass = isSafe ? styles.statusSafe : styles.statusWait;

    // Generar puntos de la curva (resolución por minuto)
    const chartData = useMemo(() => {
        return Array.from({ length: MINUTES + 1 }, (_, t) => ({
            t,
            temp: parseFloat(tempAt(opTemp, comp.tau, t).toFixed(2)),
        }));
    }, [opTemp, comp.tau]);

    // Tick de la línea de seguridad
    const safeLineLabel = `Límite Seguro (${safeLimit}°C)`;

    const handleTempChange = useCallback((e) => setOpTemp(Number(e.target.value)), []);
    const handleCompChange = useCallback((e) => setCompKey(e.target.value), []);

    return (
        <article className={styles.slide} role="region" aria-label={heading || 'Simulador LOTO Térmico'}>
            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h2 className={styles.heading}>{heading || 'Seguridad LOTO: Disipación Térmica'}</h2>
                    <p className={styles.subtitle}>{subtitle || 'Componente a temperatura segura para mantenimiento.'}</p>
                </div>
                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>TEMP. ACTUAL</span>
                        <span className={styles.statValue} style={{ color: currentTemp > 100 ? 'var(--c-danger)' : currentTemp > safeLimit ? 'var(--c-amber)' : 'var(--c-success)' }}>
                            {currentTemp}°C
                        </span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>TIEMPO DE ESPERA</span>
                        <span className={styles.statValue}>{waitMin} min</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>ESTADO</span>
                        <span className={`${styles.statValue} ${statusClass}`}>{statusLabel}</span>
                    </div>
                </div>
            </div>

            {/* ── Main panel ── */}
            <div className={styles.panel}>
                {/* Status badge */}
                <div className={styles.statusBadge}>
                    <div className={`${styles.statusIcon} ${isSafe ? styles.iconSafe : styles.iconWait}`}>
                        {isSafe ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <rect x="2" y="7" width="20" height="14" rx="2" />
                                <path d="M16 7V5a4 4 0 0 0-8 0v2" />
                                <line x1="12" y1="12" x2="12" y2="16" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                        )}
                    </div>
                    <span className={`${styles.statusText} ${statusClass}`}>
                        {isSafe ? 'SEGURO PARA LOTO' : `ESPERAR ${waitMin} MIN`}
                    </span>
                    {!isSafe && (
                        <span className={styles.statusHint}>
                            NOM-004: Verificar en pirómetro &lt; {safeLimit}°C antes de intervenir
                        </span>
                    )}
                </div>

                {/* Chart */}
                <div className={styles.chartWrap} aria-label="Gráfica de disipación térmica">
                    <div className={styles.chartInner}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 28, right: 16, left: 0, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--c-primary-sim)" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="var(--c-primary-sim)" stopOpacity={0.03} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                                <XAxis
                                    dataKey="t"
                                    label={{ value: 'Tiempo (Minutos) →', position: 'insideBottomRight', offset: -4, fontSize: 11, fill: 'var(--c-text-dim)' }}
                                    tick={{ fontSize: 11, fill: 'var(--c-text-dim)' }}
                                    tickLine={false}
                                    interval={9}
                                />
                                <YAxis
                                    label={{ value: '↑ Temperatura (°C)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11, fill: 'var(--c-text-dim)' }}
                                    tick={{ fontSize: 11, fill: 'var(--c-text-dim)' }}
                                    tickLine={false}
                                    domain={[0, Math.max(opTemp + 20, 120)]}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <ReferenceLine
                                    y={safeLimit}
                                    stroke="var(--c-safe-line)"
                                    strokeWidth={1.5}
                                    strokeDasharray="6 3"
                                    label={{ value: safeLineLabel, position: 'insideTopLeft', fontSize: 11, fill: 'var(--c-safe-line)' }}
                                />
                                {/* Área de tiempo de espera */}
                                {waitMin > 0 && (
                                    <ReferenceLine
                                        x={waitMin}
                                        stroke="var(--c-amber-line)"
                                        strokeWidth={1.5}
                                        strokeDasharray="4 4"
                                        label={{ value: `${waitMin} min`, position: 'top', fontSize: 11, fill: 'var(--c-amber-line)' }}
                                    />
                                )}
                                <Area
                                    type="monotone"
                                    dataKey="temp"
                                    stroke="var(--c-primary-sim)"
                                    strokeWidth={2}
                                    fill="url(#tempGrad)"
                                    dot={false}
                                    activeDot={{ r: 4, fill: 'var(--c-primary-sim)' }}
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ── Controls ── */}
            <div className={styles.controls}>
                <div className={styles.controlGroup}>
                    <label className={styles.controlLabel} htmlFor="sim-temp">
                        Temp. Operación (°C)
                    </label>
                    <div className={styles.sliderRow}>
                        <input
                            id="sim-temp"
                            type="range"
                            min={50}
                            max={400}
                            step={5}
                            value={opTemp}
                            onChange={handleTempChange}
                            className={styles.slider}
                            aria-label="Temperatura de operación"
                        />
                        <span className={styles.sliderValue}>{opTemp}</span>
                    </div>
                </div>

                <div className={styles.controlGroup}>
                    <label className={styles.controlLabel} htmlFor="sim-comp">
                        Componente
                    </label>
                    <select
                        id="sim-comp"
                        value={compKey}
                        onChange={handleCompChange}
                        className={styles.select}
                        aria-label="Tipo de componente"
                    >
                        {COMPONENTS.map(c => (
                            <option key={c.value} value={c.value}>
                                {c.label} ({c.massKg})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </article>
    );
});

export default ThermalSimSlide;
