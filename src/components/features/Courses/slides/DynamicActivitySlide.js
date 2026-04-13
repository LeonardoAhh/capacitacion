'use client';
import React from 'react';
import styles from './slides.module.css';

function normalizeList(items) {
    if (!Array.isArray(items)) return [];
    return items
        .map((item, index) => {
            if (typeof item === 'string') {
                return { id: `item-${index}`, text: item.trim() };
            }
            const text = `${item?.text || item?.title || ''}`.trim();
            if (!text) return null;
            return {
                id: item.id || `item-${index}`,
                text,
                note: `${item.note || item.desc || ''}`.trim(),
            };
        })
        .filter(Boolean);
}

const DynamicActivitySlide = React.memo(function DynamicActivitySlide({ data = {}, hasBgMedia, commitmentValue = '', onCommitmentChange }) {
    const heading = data.heading || 'Dinamica guiada';
    const instructions = data.instructions || '';
    const scenario = data.scenario || '';
    const modality = data.modality || data.type || '';
    const duration = data.duration || '';
    const participants = data.participants || {};
    const commitmentPrompt = data.commitmentPrompt || 'Compromiso de accion: escribe una accion unica y medible para la siguiente semana.';
    const commitmentPlaceholder = data.commitmentPlaceholder || 'Ej. Tomarme 5 minutos cada martes para escuchar a un operador diferente.';

    const materials = normalizeList(data.materials);
    const steps = normalizeList(data.steps);
    const debriefQuestions = normalizeList(data.debriefQuestions || data.debrief);

    return (
        <article
            className={`${styles.slide} ${styles.dynamicSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}
            role="region"
            aria-label={heading}
        >
            <span className={styles.slideLabel}>Dinamica</span>
            <header className={styles.dynamicHeader}>
                <h2>{heading}</h2>
                <div className={styles.dynamicMetaRow}>
                    {modality && <span className={styles.dynamicChip}>{modality}</span>}
                    {duration && <span className={styles.dynamicChip}>{duration}</span>}
                    {(participants.min || participants.max) && (
                        <span className={styles.dynamicChip}>
                            {participants.min || 1}-{participants.max || participants.min || 1} personas
                        </span>
                    )}
                </div>
            </header>

            {instructions && (
                <section className={styles.dynamicCard}>
                    <h3>Instrucciones</h3>
                    <p>{instructions}</p>
                </section>
            )}

            {scenario && (
                <section className={styles.dynamicCard}>
                    <h3>Escenario</h3>
                    <p>{scenario}</p>
                </section>
            )}

            <div className={styles.dynamicGrid}>
                {materials.length > 0 && (
                    <section className={styles.dynamicCard}>
                        <h3>Materiales</h3>
                        <ul className={styles.dynamicList} role="list">
                            {materials.map((material) => (
                                <li key={material.id}>
                                    <span>{material.text}</span>
                                    {material.note && <small>{material.note}</small>}
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {steps.length > 0 && (
                    <section className={styles.dynamicCard}>
                        <h3>Pasos</h3>
                        <ol className={styles.dynamicList}>
                            {steps.map((step) => (
                                <li key={step.id}>
                                    <span>{step.text}</span>
                                    {step.note && <small>{step.note}</small>}
                                </li>
                            ))}
                        </ol>
                    </section>
                )}
            </div>

            {debriefQuestions.length > 0 && (
                <section className={styles.dynamicCard}>
                    <h3>Preguntas de cierre</h3>
                    <ul className={styles.dynamicList} role="list">
                        {debriefQuestions.map((question) => (
                            <li key={question.id}>
                                <span>{question.text}</span>
                                {question.note && <small>{question.note}</small>}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {typeof onCommitmentChange === 'function' && (
                <section className={`${styles.dynamicCard} ${styles.dynamicCommitmentCard}`}>
                    <h3>Compromiso semanal</h3>
                    <p>{commitmentPrompt}</p>
                    <textarea
                        className={styles.dynamicCommitmentInput}
                        value={commitmentValue}
                        onChange={(e) => onCommitmentChange(e.target.value)}
                        placeholder={commitmentPlaceholder}
                        rows={4}
                        maxLength={280}
                        aria-label="Compromiso semanal del participante"
                    />
                    <small className={styles.dynamicCommitmentHint}>Se guarda automaticamente como evidencia de esta dinamica.</small>
                </section>
            )}
        </article>
    );
});

export default DynamicActivitySlide;
