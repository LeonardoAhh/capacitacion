'use client';
import React, { useState, useCallback, useEffect } from 'react';
import styles from './slides.module.css';

/**
 * ChecklistSlide — Lista interactiva de verificación.
 * Puede bloquear la navegación hasta que todos los ítems estén marcados.
 *
 * @param {{ heading, items: Array<{id, text}>, requireAll: boolean }} props.data
 * @param {Function} [props.onAllChecked] - Llamado cuando todos están marcados
 * @param {Function} [props.onCheckChange] - Llamado con (allDone: bool) en cada cambio
 */
const ChecklistSlide = React.memo(function ChecklistSlide({ data, hasBgMedia, onAllChecked, onCheckChange }) {
    const { heading, items = [], requireAll = false } = data;
    const [checked, setChecked] = useState(() => new Set());

    const total        = items.length;
    const checkedCount = checked.size;
    const allDone      = checkedCount === total && total > 0;
    const progress     = total > 0 ? Math.round((checkedCount / total) * 100) : 0;

    useEffect(() => {
        if (onCheckChange) onCheckChange(allDone);
        if (allDone && onAllChecked) onAllChecked();
    }, [allDone, onAllChecked, onCheckChange]);

    const toggle = useCallback((id) => {
        setChecked(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    return (
        <article
            className={`${styles.slide} ${styles.checklistSlide} ${hasBgMedia ? styles.slideOverBg : ''}`}
            role="region"
            aria-label={heading || 'Checklist'}
        >
            <span className={styles.slideLabel}>Checklist</span>
            {heading && <h2>{heading}</h2>}

            {/* Barra de progreso */}
            {total > 0 && (
                <div
                    className={styles.checklistProgress}
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${checkedCount} de ${total} completados`}
                >
                    <div
                        className={styles.checklistProgressBar}
                        style={{ width: `${progress}%` }}
                    />
                    <span className={styles.checklistProgressLabel}>
                        {checkedCount}/{total} completados
                    </span>
                </div>
            )}

            {/* Lista de ítems */}
            <ul className={styles.checklistItems} role="list">
                {items.map(item => {
                    const isChecked = checked.has(item.id);
                    return (
                        <li
                            key={item.id}
                            className={`${styles.checklistItem} ${isChecked ? styles.checklistItemDone : ''}`}
                        >
                            <button
                                role="checkbox"
                                aria-checked={isChecked}
                                onClick={() => toggle(item.id)}
                                className={`${styles.checklistBox} ${isChecked ? styles.checklistBoxChecked : ''}`}
                                aria-label={`${isChecked ? 'Desmarcar' : 'Marcar'}: ${item.text}`}
                            >
                                {isChecked && (
                                    <span className={styles.checklistCheckmark} aria-hidden="true">✓</span>
                                )}
                            </button>
                            <span className={styles.checklistText}>{item.text}</span>
                        </li>
                    );
                })}
            </ul>

            {/* Mensaje de completado */}
            {allDone && (
                <div className={styles.checklistDone} role="status" aria-live="polite">
                    ¡Lista completa! ✅
                    {requireAll && <span> Ya puedes avanzar al siguiente slide.</span>}
                </div>
            )}

            {/* Aviso si requireAll y faltan ítems */}
            {requireAll && !allDone && (
                <p className={styles.checklistRequireNote} role="note" aria-live="polite">
                    Marca todos los ítems para poder continuar
                </p>
            )}
        </article>
    );
});

export default ChecklistSlide;
