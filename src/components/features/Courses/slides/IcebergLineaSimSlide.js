'use client';

import React, { useMemo, useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import styles from './IcebergLineaSimSlide.module.css';

const CLASS_LABELS = {
    visible: 'Parte visible',
    submerged: 'Parte sumergida',
};

const IcebergLineaSimSlide = React.memo(function IcebergLineaSimSlide({ data }) {
    const {
        heading = 'Simulador: El Iceberg en la Linea',
        subtitle = 'Clasifica cada situacion como parte visible o parte sumergida.',
        cards = [],
    } = data || {};

    const [index, setIndex] = useState(0);
    const [selected, setSelected] = useState('');
    const [revealed, setRevealed] = useState(false);
    const [score, setScore] = useState(0);
    const [results, setResults] = useState([]);

    const total = cards.length;
    const current = cards[index] || null;
    const isLast = index === total - 1;
    const finished = total > 0 && results.length === total;

    const final = useMemo(() => {
        if (!finished) return null;
        const correctCount = results.filter((r) => r.correct).length;
        const percent = Math.round((correctCount / total) * 100);

        let message = 'Buen nivel de lectura del contexto humano. Mantener conversaciones periodicas consolidara este resultado.';
        let tone = 'high';

        if (percent < 50) {
            message = 'Tu foco esta en la punta del iceberg. Necesitas profundizar en causas personales para resolver problemas de raiz.';
            tone = 'low';
        } else if (percent < 75) {
            message = 'Identificas parcialmente la parte sumergida. Incrementa conversaciones uno a uno y seguimiento.';
            tone = 'mid';
        }

        return { percent, message, tone };
    }, [finished, results, total]);

    const verify = () => {
        if (!selected || !current) return;
        const correct = selected === current.kind;
        setResults((prev) => [...prev, { id: current.id, correct }]);
        setScore((prev) => prev + (correct ? 100 : 0));
        setRevealed(true);
    };

    const next = () => {
        if (isLast) return;
        setIndex((prev) => prev + 1);
        setSelected('');
        setRevealed(false);
    };

    const restart = () => {
        setIndex(0);
        setSelected('');
        setRevealed(false);
        setScore(0);
        setResults([]);
    };

    return (
        <article className={styles.slide} role="region" aria-label={heading}>
            <header className={styles.header}>
                <h2>{heading}</h2>
                <p>{subtitle}</p>
                <div className={styles.meta}>Reactivo {Math.min(index + 1, total)}/{total} · {score} pts</div>
            </header>

            {!finished && current && (
                <section className={styles.card}>
                    <span className={styles.badge}>{CLASS_LABELS[current.kind] === 'Parte visible' ? 'Comportamiento/Indicador' : 'Factor humano'}</span>
                    <h3>{current.text}</h3>
                    {current.hint && <p className={styles.hint}>{current.hint}</p>}

                    <div className={styles.choiceRow}>
                        <button
                            type="button"
                            className={`${styles.choiceBtn} ${selected === 'visible' ? styles.choiceBtnActive : ''}`}
                            onClick={() => setSelected('visible')}
                            aria-pressed={selected === 'visible'}
                            disabled={revealed}
                        >
                            Parte visible
                        </button>
                        <button
                            type="button"
                            className={`${styles.choiceBtn} ${selected === 'submerged' ? styles.choiceBtnActive : ''}`}
                            onClick={() => setSelected('submerged')}
                            aria-pressed={selected === 'submerged'}
                            disabled={revealed}
                        >
                            Parte sumergida
                        </button>
                    </div>

                    {!revealed ? (
                        <button
                            type="button"
                            className={`${styles.primaryBtn} ${!selected ? styles.disabledBtn : ''}`}
                            disabled={!selected}
                            onClick={verify}
                        >
                            Verificar
                        </button>
                    ) : (
                        <div className={styles.feedbackWrap}>
                            <div className={`${styles.feedback} ${selected === current.kind ? styles.ok : styles.error}`}>
                                {selected === current.kind ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertTriangle size={18} aria-hidden="true" />}
                                <p>
                                    {selected === current.kind
                                        ? 'Correcto. Clasificacion adecuada.'
                                        : `No corresponde. Este caso pertenece a: ${current.kind === 'visible' ? 'Parte visible' : 'Parte sumergida'}.`}
                                </p>
                            </div>
                            {!isLast && (
                                <button type="button" className={styles.secondaryBtn} onClick={next}>
                                    Siguiente reactivo
                                </button>
                            )}
                        </div>
                    )}
                </section>
            )}

            {final && (
                <section className={`${styles.result} ${styles[`result_${final.tone}`]}`}>
                    <h3>Resultado final: {final.percent}%</h3>
                    <p>{final.message}</p>
                    <button type="button" className={styles.secondaryBtn} onClick={restart}>
                        <RefreshCw size={16} aria-hidden="true" />
                        Reintentar simulador
                    </button>
                </section>
            )}
        </article>
    );
});

export default IcebergLineaSimSlide;
