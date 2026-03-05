'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, getDocs, collection, query, limit } from 'firebase/firestore';
import styles from './page.module.css';

import { Search, Award, Star, Target, Calendar, CheckCircle2, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';

// Lightweight component for confetti (optional, can use a real library if requested later)
// Creating a simple CSS-based particle emitter for Success Card
const Confetti = () => {
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1 }}>
            {[...Array(40)].map((_, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    width: Math.random() > 0.5 ? '8px' : '6px',
                    height: Math.random() > 0.5 ? '8px' : '12px',
                    background: ['#fcd34d', '#10b981', '#3b82f6', '#f472b6', '#a855f7'][Math.floor(Math.random() * 5)],
                    left: `${Math.random() * 100}%`,
                    top: `-10%`,
                    opacity: Math.random() + 0.4,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    animation: `fall ${Math.random() * 3 + 2}s linear infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px'
                }} />
            ))}
            <style jsx>{`
                @keyframes fall {
                    to { transform: translateY(120vh) rotate(720deg); }
                }
            `}</style>
        </div>
    );
};

export default function MuralPage() {
    const [employeeId, setEmployeeId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // { found: bool, data: obj }
    const [errorMsg, setErrorMsg] = useState('');
    const [config, setConfig] = useState({
        successMessage: '¡Felicidades! Has aprobado tu examen teórico. Estás un paso más cerca de tu promoción.',
        motivationalMessage: 'El aprendizaje es un proceso constante. Te invitamos a repasar y prepararte para tu siguiente intento. ¡Confiamos en ti!'
    });

    // 1. Fetch Global Mural Config (Messages)
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const configSnap = await getDoc(doc(db, 'app_config', 'mural'));
                if (configSnap.exists()) {
                    setConfig(prev => ({ ...prev, ...configSnap.data() }));
                }
            } catch (err) {
                console.error("Error loading config:", err);
            }
        };
        fetchConfig();
    }, []);

    // 2. Handle Search
    const handleSearch = async (e) => {
        e?.preventDefault();
        const id = employeeId.trim();

        if (!id) return;

        setLoading(true);
        setErrorMsg('');
        setResult(null);

        try {
            // Buscamos directamente en la colección pública /mural_exams
            const examRef = doc(db, 'mural_exams', id);
            const examSnap = await getDoc(examRef);

            if (examSnap.exists()) {
                const data = examSnap.data();
                if (data.active !== false) {
                    setResult({ found: true, data });
                } else {
                    setErrorMsg('Tu resultado se encuentra inactivo o bajo revisión.');
                }
            } else {
                setResult({ found: false });
                setErrorMsg(`No encontramos ningún resultado reciente para el ID: ${id}`);
            }
        } catch (error) {
            console.error(error);
            setErrorMsg('Ocurrió un error al buscar. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setEmployeeId('');
        setErrorMsg('');
    };

    return (
        <main className={styles.main}>
            {/* Ambient Background Modern */}
            <div className={styles.bgDecoration}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
                <div className={`${styles.blob} ${styles.blob3}`}></div>
                <div className={styles.noiseOverlay}></div>
            </div>

            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerIconWrapper}>
                        <Award size={48} className={styles.headerIcon} />
                    </div>
                    <h1>Mural de Reconocimiento</h1>
                </div>

                {!result && (
                    <form onSubmit={handleSearch} className={styles.searchBox}>
                        <div className={styles.inputWrapper}>
                            <Search className={styles.searchIcon} size={24} />
                            <input
                                type="text"
                                placeholder="Ingresa tu Número de Empleado"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value.replace(/[^0-9mM]/g, ''))}
                                className={styles.searchInput}
                                autoFocus
                                maxLength={10}
                            />
                        </div>
                        <button
                            type="submit"
                            className={styles.searchBtn}
                            disabled={loading || employeeId.length < 2}
                        >
                            {loading ? <RefreshCw className={styles.spinIcon} size={20} /> : 'Consultar'}
                        </button>
                    </form>
                )}

                {loading && (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Buscando en los registros...</p>
                    </div>
                )}

                {errorMsg && (
                    <div className={styles.notFound}>
                        <AlertCircle size={32} className={styles.errorIcon} />
                        <p>{errorMsg}</p>
                        <button className={styles.resetBtnMinimal} onClick={handleReset}>
                            <RefreshCw size={16} /> Volver a intentar
                        </button>
                    </div>
                )}

                {/* RESULT DISPLAY PREMIUM */}
                {result?.found && (
                    <div className={`${styles.resultCard} ${result.data.passed ? styles.cardSuccess : styles.cardMotivational}`}>
                        {result.data.passed && <Confetti />}

                        <div className={styles.cardHeader}>
                            <div className={styles.statusBadge}>
                                {result.data.passed ? (
                                    <><CheckCircle2 size={16} /> ¡Examen Aprobado!</>
                                ) : (
                                    <><Star size={16} /> Sigue Preparándote</>
                                )}
                            </div>

                            <div className={styles.scoreCircle}>
                                <span className={styles.scoreValue}>{result.data.score}</span>
                                <span className={styles.scoreUnit}>%</span>
                            </div>

                            <h2 className={styles.employeeName}>
                                {result.data.firstName || `Empleado M${employeeId}`}
                            </h2>
                            <h3 className={styles.employeePosition}>
                                {result.data.currentPosition || 'Colaborador'}
                            </h3>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.messageBox}>
                                <p>
                                    {result.data.passed
                                        ? config.successMessage.replace('[Nombre]', result.data.firstName || '')
                                        : config.motivationalMessage.replace('[Nombre]', result.data.firstName || '')
                                    }
                                </p>
                            </div>

                            <div className={styles.metricsGrid}>
                                <div className={styles.metricItem}>
                                    <Award size={20} className={styles.metricIcon} />
                                    <div>
                                        <div className={styles.metricLabel}>Aplica Para</div>
                                        <div className={styles.metricValueHighlight}>{result.data.promotionTo || 'Siguiente Nivel'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* FEEDBACK / RECOMENDACIONES (SOLO SI NO APROBÓ Y EXISTE) */}
                            {!result.data.passed && result.data.recommendations && (
                                <div style={{
                                    marginTop: '1.2rem',
                                    padding: '1rem',
                                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: '8px',
                                    textAlign: 'left'
                                }}>
                                    <h4 style={{
                                        color: '#ef4444',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        margin: '0 0 8px 0',
                                        fontWeight: '600'
                                    }}>
                                        <BookOpen size={16} /> Recomendaciones de Estudio
                                    </h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {Array.isArray(result.data.recommendations) && result.data.recommendations.length > 0
                                            ? result.data.recommendations.map((rec, i) => (
                                                <span key={i} style={{
                                                    padding: '2px 8px',
                                                    background: '#fee2e2',
                                                    color: '#991b1b',
                                                    borderRadius: '12px',
                                                    fontSize: '0.75rem',
                                                    border: '1px solid #fecaca',
                                                    fontWeight: '500'
                                                }}>
                                                    {rec}
                                                </span>
                                            ))
                                            : (
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                                    {result.data.recommendations}
                                                </p>
                                            )
                                        }
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.cardFooter}>
                            <div className={styles.dateInfo}>
                                <Calendar size={14} /> Evaluación: {result.data.date || 'Reciente'}
                            </div>
                            <button className={styles.resetBtnAction} onClick={handleReset}>
                                Nueva Consulta
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
