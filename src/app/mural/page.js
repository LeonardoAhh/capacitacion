'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import styles from './page.module.css';
import { Search, Award, Star, Calendar, CheckCircle2, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';

const CONFETTI_COLORS = ['#fcd34d', '#10b981', '#3b82f6', '#f472b6', '#a855f7'];

const Confetti = () => {
    const particles = useMemo(() =>
        Array.from({ length: 40 }, (_, i) => ({
            id: i,
            width: i % 2 === 0 ? '8px' : '6px',
            height: i % 3 === 0 ? '12px' : '8px',
            color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            left: `${(i * 2.5) % 100}%`,
            opacity: 0.5 + (i % 5) * 0.1,
            rotation: (i * 37) % 360,
            duration: 2 + (i % 3),
            delay: (i % 5) * 0.4,
            isCircle: i % 2 === 0,
        })), []
    );

    return (
        <div
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}
        >
            {particles.map((p) => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        width: p.width,
                        height: p.height,
                        background: p.color,
                        left: p.left,
                        top: '-10%',
                        opacity: p.opacity,
                        transform: `rotate(${p.rotation}deg)`,
                        animation: `confettiFall ${p.duration}s linear ${p.delay}s infinite`,
                        borderRadius: p.isCircle ? '50%' : '2px',
                    }}
                />
            ))}
        </div>
    );
};

const DEFAULT_CONFIG = {
    successMessage: '¡Felicidades! Has aprobado tu examen teórico. Estás un paso más cerca de tu promoción.',
    motivationalMessage: 'El aprendizaje es un proceso constante. Te invitamos a repasar y prepararte para tu siguiente intento. ¡Confiamos en ti!',
};

export default function MuralPage() {
    const [employeeId, setEmployeeId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [config, setConfig] = useState(DEFAULT_CONFIG);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const configSnap = await getDoc(doc(db, 'app_config', 'mural'));
                if (configSnap.exists()) {
                    setConfig((prev) => ({ ...prev, ...configSnap.data() }));
                }
            } catch (err) {
                console.error('Error loading mural config:', err);
            }
        };
        fetchConfig();
    }, []);

    const handleSearch = useCallback(async (e) => {
        e?.preventDefault();
        const id = employeeId.trim();
        if (!id) return;

        setLoading(true);
        setErrorMsg('');
        setResult(null);

        try {
            const examSnap = await getDoc(doc(db, 'mural_exams', id));

            if (examSnap.exists()) {
                const data = examSnap.data();
                if (data.active !== false) {
                    setResult({ found: true, data });
                } else {
                    setErrorMsg('Tu resultado se encuentra inactivo o bajo revisión.');
                }
            } else {
                setErrorMsg(`No encontramos ningún resultado reciente para el ID: ${id}`);
            }
        } catch (error) {
            console.error('Error buscando resultado:', error);
            setErrorMsg('Ocurrió un error al buscar. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    }, [employeeId]);

    const handleReset = useCallback(() => {
        setResult(null);
        setEmployeeId('');
        setErrorMsg('');
    }, []);

    const handleIdChange = useCallback((e) => {
        setEmployeeId(e.target.value.replace(/[^0-9mM]/g, ''));
    }, []);

    const renderRecommendations = (recommendations) => {
        if (!recommendations) return null;
        const isArray = Array.isArray(recommendations) && recommendations.length > 0;

        return (
            <div className={styles.recommendations}>
                <h4 className={styles.recommendationsTitle}>
                    <BookOpen size={16} aria-hidden="true" /> Recomendaciones de Estudio
                </h4>
                {isArray ? (
                    <div className={styles.recommendationTags}>
                        {recommendations.map((rec, i) => (
                            <span key={i} className={styles.recommendationTag}>{rec}</span>
                        ))}
                    </div>
                ) : (
                    <p className={styles.recommendationText}>{recommendations}</p>
                )}
            </div>
        );
    };

    const getMessage = (passed, name) => {
        const msg = passed ? config.successMessage : config.motivationalMessage;
        return msg.replace('[Nombre]', name || '');
    };

    // El formulario se muestra siempre que no haya un resultado exitoso visible
    const showForm = !result?.found;

    return (
        <main className={styles.main}>
            <div className={styles.bgDecoration} aria-hidden="true">
                <div className={`${styles.blob} ${styles.blob1}`} />
                <div className={`${styles.blob} ${styles.blob2}`} />
                <div className={`${styles.blob} ${styles.blob3}`} />
                <div className={styles.noiseOverlay} />
            </div>

            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.headerIconWrapper}>
                        <Award size={40} aria-hidden="true" />
                    </div>
                    <h1>Mural de Reconocimiento</h1>
                </header>

                {showForm && (
                    <form onSubmit={handleSearch} className={styles.searchBox} noValidate>
                        <div className={styles.inputWrapper}>
                            <Search className={styles.searchIcon} size={22} aria-hidden="true" />
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Ingresa tu Número de Empleado"
                                value={employeeId}
                                onChange={handleIdChange}
                                className={styles.searchInput}
                                autoComplete="off"
                                autoFocus
                                maxLength={10}
                                aria-label="Número de empleado"
                            />
                        </div>
                        <button
                            type="submit"
                            className={styles.searchBtn}
                            disabled={loading || employeeId.length < 2}
                            aria-label="Consultar resultado"
                        >
                            {loading
                                ? <RefreshCw className={styles.spinIcon} size={18} aria-hidden="true" />
                                : 'Consultar'
                            }
                        </button>
                    </form>
                )}

                {loading && (
                    <div className={styles.loadingState} role="status" aria-live="polite">
                        <div className={styles.spinner} aria-hidden="true" />
                        <p>Buscando en los registros...</p>
                    </div>
                )}

                {errorMsg && (
                    <div className={styles.notFound} role="alert">
                        <AlertCircle size={30} className={styles.errorIcon} aria-hidden="true" />
                        <p>{errorMsg}</p>
                        <button className={styles.resetBtnMinimal} onClick={handleReset}>
                            <RefreshCw size={15} aria-hidden="true" /> Limpiar búsqueda
                        </button>
                    </div>
                )}

                {result?.found && (
                    <div
                        className={`${styles.resultCard} ${result.data.passed ? styles.cardSuccess : styles.cardMotivational}`}
                        role="region"
                        aria-label="Resultado del examen"
                    >
                        {result.data.passed && <Confetti />}

                        <div className={styles.cardHeader}>
                            <div className={styles.statusBadge}>
                                {result.data.passed ? (
                                    <><CheckCircle2 size={14} aria-hidden="true" /> ¡Examen Aprobado!</>
                                ) : (
                                    <><Star size={14} aria-hidden="true" /> Sigue Preparándote</>
                                )}
                            </div>

                            <div className={styles.scoreCircle} aria-label={`Puntaje: ${result.data.score} por ciento`}>
                                <span className={styles.scoreValue}>{result.data.score}</span>
                                <span className={styles.scoreUnit} aria-hidden="true">%</span>
                            </div>

                            <h2 className={styles.employeeName}>
                                {result.data.firstName || `Empleado ${employeeId}`}
                            </h2>
                            <p className={styles.employeePosition}>
                                {result.data.currentPosition || 'Colaborador'}
                            </p>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.messageBox}>
                                <p>{getMessage(result.data.passed, result.data.firstName)}</p>
                            </div>

                            <div className={styles.metricsGrid}>
                                <div className={styles.metricItem}>
                                    <Award size={20} className={styles.metricIcon} aria-hidden="true" />
                                    <div>
                                        <div className={styles.metricLabel}>Aplica Para</div>
                                        <div className={styles.metricValueHighlight}>
                                            {result.data.promotionTo || 'Siguiente Nivel'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!result.data.passed && renderRecommendations(result.data.recommendations)}
                        </div>

                        <div className={styles.cardFooter}>
                            <div className={styles.dateInfo}>
                                <Calendar size={13} aria-hidden="true" />
                                Evaluación: {result.data.date || 'Reciente'}
                            </div>
                            <button
                                className={styles.resetBtnAction}
                                onClick={handleReset}
                                aria-label="Realizar nueva consulta"
                            >
                                Nueva Consulta
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
