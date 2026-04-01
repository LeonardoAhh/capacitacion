'use client';
import { IconPlus, IconTrash2 } from '@/lib/icons';

// Opciones de ícono para cada escenario
const ICON_OPTIONS = [
    { value: 'factory',  label: '🏭 Fábrica'    },
    { value: 'trash',    label: '🗑️ Residuos'   },
    { value: 'zap',      label: '⚡ Energía'     },
    { value: 'droplets', label: '💧 Líquidos'    },
    { value: 'wind',     label: '🌬️ Gases/Aire'  },
    { value: 'leaf',     label: '🍃 Ambiental'   },
];

function makeId() {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 11);
}

const EMPTY_SCENARIO = () => ({
    id:       makeId(),
    activity: '',
    aspect:   '',
    impact:   '',
    iconName: 'factory',
});

export default function EnvSimSlideEditor({ formData, handleChange, styles }) {
    const scenarios = formData.scenarios || [];

    const updateScenario = (idx, field, value) => {
        const next = scenarios.map((s, i) => i === idx ? { ...s, [field]: value } : s);
        handleChange('scenarios', next);
    };

    const addScenario = () => {
        if (scenarios.length >= 8) return;
        handleChange('scenarios', [...scenarios, EMPTY_SCENARIO()]);
    };

    const removeScenario = (idx) => {
        handleChange('scenarios', scenarios.filter((_, i) => i !== idx));
    };

    return (
        <>
            {/* Título y subtítulo del slide */}
            <div className={styles.formGroup}>
                <label className={styles.label}>Título del Simulador</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={e => handleChange('heading', e.target.value)}
                    placeholder="Ej. Simulador: Matriz Causa-Efecto Ambiental"
                    maxLength={120}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>Subtítulo / Instrucción</label>
                <input
                    className={styles.input}
                    value={formData.subtitle || ''}
                    onChange={e => handleChange('subtitle', e.target.value)}
                    placeholder="Ej. Identifica el Aspecto e Impacto de cada actividad."
                    maxLength={200}
                />
            </div>

            {/* Escenarios */}
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Escenarios ({scenarios.length}/8)
                    {scenarios.length === 0 && (
                        <span style={{ fontWeight: 400, color: 'var(--color-warning, #f59e0b)', marginLeft: 8, fontSize: '0.75rem' }}>
                            — se usarán los 4 escenarios por defecto si no agregas ninguno
                        </span>
                    )}
                </label>

                <div className={styles.itemsList}>
                    {scenarios.map((scenario, idx) => (
                        <div
                            key={scenario.id}
                            style={{
                                background: 'var(--bg-secondary, #fafaf8)',
                                border: '1px solid var(--border-light, #e5e5e5)',
                                borderRadius: 10,
                                padding: '0.9rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                marginBottom: '0.75rem',
                            }}
                        >
                            {/* Encabezado del escenario */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary, #555)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Escenario {idx + 1}
                                </span>
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => removeScenario(idx)}
                                    type="button"
                                    title="Eliminar escenario"
                                    aria-label={`Eliminar escenario ${idx + 1}`}
                                >
                                    <IconTrash2 size={14} />
                                </button>
                            </div>

                            {/* Ícono */}
                            <div>
                                <label className={styles.label} style={{ fontSize: '0.75rem' }}>Ícono</label>
                                <select
                                    className={styles.input}
                                    value={scenario.iconName || 'factory'}
                                    onChange={e => updateScenario(idx, 'iconName', e.target.value)}
                                >
                                    {ICON_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Actividad */}
                            <div>
                                <label className={styles.label} style={{ fontSize: '0.75rem' }}>Actividad (lo que se hace en planta)</label>
                                <input
                                    className={styles.input}
                                    value={scenario.activity || ''}
                                    onChange={e => updateScenario(idx, 'activity', e.target.value)}
                                    placeholder="Ej. Purgado de inyectora (Material degradado)"
                                    maxLength={200}
                                />
                            </div>

                            {/* Aspecto */}
                            <div>
                                <label className={styles.label} style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Aspecto Ambiental (Causa)</label>
                                <input
                                    className={styles.input}
                                    value={scenario.aspect || ''}
                                    onChange={e => updateScenario(idx, 'aspect', e.target.value)}
                                    placeholder="Ej. Generación de residuos sólidos no peligrosos"
                                    maxLength={200}
                                />
                            </div>

                            {/* Impacto */}
                            <div>
                                <label className={styles.label} style={{ fontSize: '0.75rem', color: '#f87171' }}>Impacto Ambiental (Efecto)</label>
                                <input
                                    className={styles.input}
                                    value={scenario.impact || ''}
                                    onChange={e => updateScenario(idx, 'impact', e.target.value)}
                                    placeholder="Ej. Contaminación del suelo / Agotamiento de recursos"
                                    maxLength={200}
                                />
                            </div>
                        </div>
                    ))}

                    {scenarios.length < 8 && (
                        <button className={styles.addItemBtn} onClick={addScenario} type="button">
                            <IconPlus size={14} /> Agregar Escenario
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
