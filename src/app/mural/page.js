'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import styles from './page.module.css';
import { Search, Award, Star, Calendar, CheckCircle2, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';


const CONFETTI_COLORS = ['#fbbf24', '#f59e0b', '#10b981', '#34d399', '#d1fae5'];

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
                    <BookOpen size={15} aria-hidden="true" /> Recomendaciones de Estudio
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

    return (
        <main className={styles.page}>
            <div className={styles.wrapper}>

                {/* Brand header */}
                <div className={styles.brand}>
                    <div className={styles.brandIcon}>
                        <Award size={18} aria-hidden="true" />
                    </div>
                    <span className={styles.brandName}>Vertx · Mural de Resultados</span>
                </div>

                {/* Search card — visible when no result yet */}
                {!result?.found && (
                    <div className={styles.searchCard}>
                        <div className={styles.searchCardHeader}>
                            <h1 className={styles.pageTitle}>Consulta tu resultado</h1>
                            <p className={styles.pageSubtitle}>
                                Ingresa tu número de empleado para ver tu calificación
                            </p>
                        </div>

                        <form onSubmit={handleSearch} noValidate className={styles.searchForm}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="employeeId" className={styles.inputLabel}>
                                    Número de Empleado
                                </label>
                                <div className={styles.inputRow}>
                                    <Search className={styles.inputIcon} size={15} aria-hidden="true" />
                                    <input
                                        id="employeeId"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="Ej. 12345"
                                        value={employeeId}
                                        onChange={handleIdChange}
                                        className={styles.searchInput}
                                        autoComplete="off"
                                        autoFocus
                                        maxLength={10}
                                        aria-label="Número de empleado"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={styles.searchBtn}
                                disabled={loading || employeeId.length < 2}
                            >
                                {loading ? (
                                    <><RefreshCw className={styles.spinIcon} size={15} aria-hidden="true" /> Buscando...</>
                                ) : (
                                    <><Search size={15} aria-hidden="true" /> Consultar resultado</>
                                )}
                            </button>
                        </form>

                        {errorMsg && (
                            <div className={styles.errorBox} role="alert">
                                <AlertCircle size={15} className={styles.errorIcon} aria-hidden="true" />
                                <p className={styles.errorMsg}>{errorMsg}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Result card */}
                {result?.found && (
                    <div
                        className={`${styles.resultCard} ${result.data.passed ? styles.resultCardSuccess : styles.resultCardFail}`}
                        role="region"
                        aria-label="Resultado del examen"
                    >
                        {result.data.passed && <Confetti />}

                        {/* Colored header section */}
                        <div className={`${styles.resultHeader} ${result.data.passed ? styles.resultHeaderSuccess : styles.resultHeaderFail}`}>
                            <div className={`${styles.statusBadge} ${result.data.passed ? styles.statusBadgeSuccess : styles.statusBadgeFail}`}>
                                {result.data.passed ? (
                                    <><CheckCircle2 size={12} aria-hidden="true" /> Examen Aprobado</>
                                ) : (
                                    <><Star size={12} aria-hidden="true" /> Sigue Preparándote</>
                                )}
                            </div>

                            <div
                                className={styles.scoreArea}
                                aria-label={`Puntaje: ${result.data.score} por ciento`}
                            >
                                <span className={`${styles.scoreNumber} ${result.data.passed ? styles.scoreNumberSuccess : styles.scoreNumberFail}`}>
                                    {result.data.score}
                                </span>
                                <span className={styles.scorePercent} aria-hidden="true">%</span>
                            </div>

                            <h2 className={styles.employeeName}>
                                {result.data.firstName || `Empleado ${employeeId}`}
                            </h2>
                            <p className={styles.employeePosition}>
                                {result.data.currentPosition || 'Colaborador'}
                            </p>
                        </div>

                        {/* Body */}
                        <div className={styles.resultBody}>
                            <p className={styles.messageText}>
                                {getMessage(result.data.passed, result.data.firstName)}
                            </p>

                            <div className={styles.metricItem}>
                                <Award
                                    size={18}
                                    className={`${styles.metricIcon} ${result.data.passed ? styles.metricIconSuccess : styles.metricIconFail}`}
                                    aria-hidden="true"
                                />
                                <div>
                                    <div className={styles.metricLabel}>Aplicaste para</div>
                                    <div className={`${styles.metricValue} ${result.data.passed ? styles.metricValueSuccess : styles.metricValueFail}`}>
                                        {result.data.promotionTo || 'Siguiente Nivel'}
                                    </div>
                                </div>
                            </div>

                            {!result.data.passed && renderRecommendations(result.data.recommendations)}
                        </div>

                        {/* Footer */}
                        <div className={styles.resultFooter}>
                            <div className={styles.dateRow}>
                                <Calendar size={13} aria-hidden="true" />
                                <span>Evaluación: {result.data.date || 'Reciente'}</span>
                            </div>
                            <button
                                className={`${styles.newSearchBtn} ${result.data.passed ? styles.newSearchBtnSuccess : styles.newSearchBtnFail}`}
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
