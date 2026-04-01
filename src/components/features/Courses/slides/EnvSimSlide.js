'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, CheckCircle2, Factory, Droplets, Wind, Trash2, Zap, ArrowRight, RefreshCw, Leaf } from 'lucide-react';
import styles from './EnvSimSlide.module.css';

// ── Escenarios por defecto (usados si el slide no tiene datos configurados) ───
const DEFAULT_SCENARIOS = [
    {
        id: 'default-1',
        activity: 'Purgado de inyectora (Material degradado)',
        aspect: 'Generación de residuos sólidos no peligrosos (Plástico de purga)',
        impact: 'Contaminación del suelo / Agotamiento de recursos',
        iconName: 'trash',
    },
    {
        id: 'default-2',
        activity: 'Operación de bombas hidráulicas de la inyectora',
        aspect: 'Consumo de energía eléctrica',
        impact: 'Agotamiento de recursos naturales / Emisiones indirectas de GEI',
        iconName: 'zap',
    },
    {
        id: 'default-3',
        activity: 'Mantenimiento preventivo (Cambio de aceite hidráulico)',
        aspect: 'Generación de residuos peligrosos (Aceite gastado y estopas)',
        impact: 'Contaminación de suelo y cuerpos de agua subterránea',
        iconName: 'droplets',
    },
    {
        id: 'default-4',
        activity: 'Procesamiento de resinas con aditivos (Ej. PVC, POM)',
        aspect: 'Emisión de gases de combustión / vapores tóxicos',
        impact: 'Contaminación del aire / Efecto en salud respiratoria',
        iconName: 'wind',
    },
];

// ── Mapa de íconos por nombre ──────────────────────────────────────────────────
const ICON_MAP = {
    trash:    <Trash2    size={32} />,
    zap:      <Zap       size={32} />,
    droplets: <Droplets  size={32} />,
    wind:     <Wind      size={32} />,
    factory:  <Factory   size={32} />,
    leaf:     <Leaf      size={32} />,
};

function ScenarioIcon({ name, className }) {
    const icon = ICON_MAP[name] || <Factory size={32} />;
    return <span className={className}>{icon}</span>;
}

// ── Función de mezcla aleatoria ───────────────────────────────────────────────
function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
}

// ── Componente principal ──────────────────────────────────────────────────────
const EnvSimSlide = React.memo(function EnvSimSlide({ data }) {
    const {
        heading  = 'Simulador: Matriz Causa-Efecto Ambiental',
        subtitle = 'Identifica el Aspecto e Impacto ambiental de cada actividad de planta.',
        scenarios: configScenarios,
    } = data || {};

    // Usar escenarios configurados o los por defecto
    const scenarios = (configScenarios && configScenarios.length > 0)
        ? configScenarios
        : DEFAULT_SCENARIOS;

    // ── Estado del juego ─────────────────────────────────────────────────────
    const [score, setScore] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [completed, setCompleted] = useState(false);
    const [shuffledAspects, setShuffledAspects] = useState([]);
    const [shuffledImpacts, setShuffledImpacts] = useState([]);
    const [selectedAspect, setSelectedAspect] = useState(null);
    const [selectedImpact, setSelectedImpact] = useState(null);
    const [feedback, setFeedback] = useState(null); // { text, type: 'success'|'error'|'warning' }

    // ── Inicializar nivel ────────────────────────────────────────────────────
    useEffect(() => {
        if (currentIndex < scenarios.length) {
            setShuffledAspects(shuffle(scenarios.map(s => s.aspect)));
            setShuffledImpacts(shuffle(scenarios.map(s => s.impact)));
            setSelectedAspect(null);
            setSelectedImpact(null);
            setFeedback(null);
        } else {
            setCompleted(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, scenarios.length]);

    // ── Verificar selección ──────────────────────────────────────────────────
    const handleVerify = useCallback(() => {
        if (!selectedAspect || !selectedImpact) {
            setFeedback({ text: 'Por favor, selecciona un Aspecto y un Impacto antes de verificar.', type: 'warning' });
            return;
        }

        const current = scenarios[currentIndex];
        const aspectOk = selectedAspect === current.aspect;
        const impactOk = selectedImpact === current.impact;

        if (aspectOk && impactOk) {
            setScore(prev => prev + 100);
            setFeedback({ text: '¡Excelente! Has identificado correctamente la causa y el efecto ambiental.', type: 'success' });
            setTimeout(() => setCurrentIndex(prev => prev + 1), 2000);
        } else {
            let msg = 'Incorrecto. ';
            if (!aspectOk) msg += 'El Aspecto Ambiental (la causa) no corresponde a esta actividad. ';
            if (!impactOk) msg += 'El Impacto Ambiental (la consecuencia) no es el correcto.';
            setScore(prev => Math.max(0, prev - 20));
            setFeedback({ text: msg, type: 'error' });
        }
    }, [selectedAspect, selectedImpact, currentIndex, scenarios]);

    // ── Reiniciar simulación ─────────────────────────────────────────────────
    const handleRestart = useCallback(() => {
        setScore(0);
        setCurrentIndex(0);
        setCompleted(false);
    }, []);

    // ── Pantalla de completado ───────────────────────────────────────────────
    if (completed) {
        return (
            <article className={styles.slide} role="region" aria-label="Simulación completada">
                <div className={styles.completedWrap}>
                    <CheckCircle2 size={64} className={styles.completedIcon} aria-hidden="true" />
                    <h2 className={styles.completedTitle}>¡Simulación Completada!</h2>
                    <p className={styles.completedBody}>
                        Has demostrado tu capacidad para identificar Aspectos e Impactos Ambientales en el área de moldeo.
                    </p>
                    <div className={styles.scoreBadge}>
                        <span className={styles.scoreLabel}>Puntuación Final</span>
                        <span className={styles.scoreValue}>{score} pts</span>
                    </div>
                    <button className={styles.restartBtn} onClick={handleRestart} type="button">
                        <RefreshCw size={18} aria-hidden="true" />
                        Reintentar Simulación
                    </button>
                </div>
            </article>
        );
    }

    const current = scenarios[currentIndex];

    return (
        <article className={styles.slide} role="region" aria-label={heading}>
            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Factory size={20} className={styles.headerIcon} aria-hidden="true" />
                    <div>
                        <h2 className={styles.heading}>{heading}</h2>
                        <p className={styles.subtitle}>{subtitle}</p>
                    </div>
                </div>
                <div className={styles.scorePill} aria-label={`Escenario ${currentIndex + 1} de ${scenarios.length}, puntos: ${score}`}>
                    <span className={styles.scoreProgress}>Escenario {currentIndex + 1}/{scenarios.length}</span>
                    <span className={styles.scoreDivider}>·</span>
                    <span className={styles.scorePoints}>{score} pts</span>
                </div>
            </div>

            {/* ── Instrucciones ── */}
            <p className={styles.instructions}>
                Analiza la <strong>Actividad</strong> y selecciona el{' '}
                <span className={styles.accentBlue}>Aspecto Ambiental</span> (causa) y el{' '}
                <span className={styles.accentRed}>Impacto Ambiental</span> (efecto) correctos.
            </p>

            {/* ── Panel 3 columnas ── */}
            <div className={styles.grid}>
                {/* Columna 1: Actividad */}
                <div className={styles.card}>
                    <div className={`${styles.cardBadge} ${styles.cardBadgeGray}`}>Paso 1: La Actividad</div>
                    <div className={styles.cardBody}>
                        <ScenarioIcon name={current.iconName} className={styles.activityIcon} />
                        <h3 className={styles.activityTitle}>{current.activity}</h3>
                        <p className={styles.activityHint}>Lo que realizamos en planta.</p>
                    </div>
                </div>

                {/* Flecha */}
                <div className={styles.arrowWrap} aria-hidden="true">
                    <ArrowRight size={36} className={styles.arrowIcon} />
                </div>

                {/* Columna 2: Aspecto */}
                <div className={`${styles.card} ${styles.cardBlue}`}>
                    <div className={`${styles.cardBadge} ${styles.cardBadgeBlue}`}>Paso 2: Aspecto Ambiental (Causa)</div>
                    <div className={styles.optionsList} role="group" aria-label="Opciones de aspecto ambiental">
                        {shuffledAspects.map((aspect, idx) => (
                            <button
                                key={`aspect-${idx}`}
                                type="button"
                                className={`${styles.optionBtn} ${selectedAspect === aspect ? styles.optionBtnBlueActive : ''}`}
                                onClick={() => setSelectedAspect(aspect)}
                                aria-pressed={selectedAspect === aspect}
                            >
                                {aspect}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Flecha */}
                <div className={styles.arrowWrap} aria-hidden="true">
                    <ArrowRight size={36} className={styles.arrowIcon} />
                </div>

                {/* Columna 3: Impacto */}
                <div className={`${styles.card} ${styles.cardRed}`}>
                    <div className={`${styles.cardBadge} ${styles.cardBadgeRed}`}>Paso 3: Impacto Ambiental (Efecto)</div>
                    <div className={styles.optionsList} role="group" aria-label="Opciones de impacto ambiental">
                        {shuffledImpacts.map((impact, idx) => (
                            <button
                                key={`impact-${idx}`}
                                type="button"
                                className={`${styles.optionBtn} ${selectedImpact === impact ? styles.optionBtnRedActive : ''}`}
                                onClick={() => setSelectedImpact(impact)}
                                aria-pressed={selectedImpact === impact}
                            >
                                {impact}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Feedback ── */}
            {feedback && (
                <div
                    className={`${styles.feedback} ${styles[`feedback_${feedback.type}`]}`}
                    role="alert"
                    aria-live="polite"
                >
                    {feedback.type === 'success'
                        ? <CheckCircle2 size={18} aria-hidden="true" />
                        : <AlertCircle  size={18} aria-hidden="true" />
                    }
                    <p className={styles.feedbackText}>{feedback.text}</p>
                </div>
            )}

            {/* ── Botón verificar ── */}
            <div className={styles.footer}>
                <button
                    type="button"
                    className={`${styles.verifyBtn} ${(!selectedAspect || !selectedImpact) ? styles.verifyBtnDisabled : ''}`}
                    onClick={handleVerify}
                    disabled={!selectedAspect || !selectedImpact}
                    aria-disabled={!selectedAspect || !selectedImpact}
                >
                    Verificar Conexión
                </button>
            </div>
        </article>
    );
});

export default EnvSimSlide;
