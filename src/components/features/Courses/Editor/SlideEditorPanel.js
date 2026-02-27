import { useState, useEffect, useRef, useCallback } from 'react';
import { IconSave, IconPlus, IconTrash2, IconArrowLeft, IconCheckCircle2, Loader2 } from '@/lib/icons';
import ImageUploader from './ImageUploader';
import MediaUploader from './MediaUploader';
import IconPicker from './IconPicker';
import styles from '@/app/induccion/cursos/[id]/editar/editor.module.css';

/** Límite de ítems para slides de tipo icon_grid */
const ICON_GRID_MAX = 6;
/** Límite de caracteres recomendado para campos de texto largo */
const BODY_MAX_CHARS = 600;
const TEXTAREA_MAX_CHARS = 400;

/**
 * CharCounter — Contador de caracteres inline con warning cuando se acerca al límite
 * @param {number} current
 * @param {number} max
 */
function CharCounter({ current = 0, max }) {
    const pct = current / max;
    const color = pct >= 1
        ? 'var(--color-danger)'
        : pct >= 0.85
            ? 'var(--color-warning, #f59e0b)'
            : 'var(--text-tertiary)';

    return (
        <span style={{ fontSize: '0.68rem', color, float: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {current}/{max}
        </span>
    );
}

/**
 * SlideEditorPanel — Panel de edición de un slide individual.
 * Incluye: auto-save con debounce, IconPicker visual, validación max 6 en IconGrid,
 * contador de caracteres en textareas y UI mejorada de respuesta correcta en Quiz.
 *
 * @param {Object}   props
 * @param {Object}   props.slide        - Slide actualmente seleccionado
 * @param {Function} props.onSave       - Callback async (slideId, data) => void
 * @param {Function} props.onDelete     - Callback (slideId) => void
 * @param {Function} [props.onFormChange] - Callback en tiempo real (newData) => void (live preview)
 */
export default function SlideEditorPanel({ slide, onSave, onDelete, onFormChange }) {
    const [formData, setFormData] = useState({});
    const [savingState, setSavingState] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
    const timerRef = useRef(null);

    // Carga inicial del slide
    useEffect(() => {
        if (slide) {
            setFormData(JSON.parse(JSON.stringify(slide.data || {})));
            setSavingState('idle');
        }
    }, [slide]);

    // Auto-save con debounce
    useEffect(() => {
        if (!slide || Object.keys(formData).length === 0) return;

        const originalDataStr = JSON.stringify(slide.data || {});
        const currentDataStr = JSON.stringify(formData);

        if (originalDataStr !== currentDataStr) {
            setSavingState('saving');
            if (timerRef.current) clearTimeout(timerRef.current);

            timerRef.current = setTimeout(async () => {
                try {
                    await onSave(slide.id, formData);
                    setSavingState('saved');
                    setTimeout(() => {
                        setSavingState(curr => curr === 'saved' ? 'idle' : curr);
                    }, 2000);
                } catch (error) {
                    console.error('Auto-save failed', error);
                    setSavingState('error');
                }
            }, 800);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [formData, slide, onSave]);

    const handleChange = useCallback((field, value) => {
        setFormData(prev => {
            const next = { ...prev, [field]: value };
            if (onFormChange) onFormChange(next);
            return next;
        });
    }, [onFormChange]);

    if (!slide) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><IconArrowLeft size={32} /></div>
                <p>Selecciona un slide para editar</p>
            </div>
        );
    }

    // ── Renders por tipo ──────────────────────────────────────────────────────

    const renderTitleSlide = () => (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Título Principal</label>
                <input
                    className={styles.input}
                    value={formData.title || ''}
                    onChange={e => handleChange('title', e.target.value)}
                    maxLength={120}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Subtítulo</label>
                <input
                    className={styles.input}
                    value={formData.subtitle || ''}
                    onChange={e => handleChange('subtitle', e.target.value)}
                    maxLength={200}
                />
            </div>
        </>
    );

    const renderContentSlide = () => {
        const images = formData.images
            ? formData.images
            : formData.image ? [formData.image] : [];

        const handleAddImage = (url) => {
            const updated = [...images, url];
            setFormData(prev => ({ ...prev, images: updated, image: updated[0] || '' }));
        };

        const handleRemoveImage = (idx) => {
            const updated = images.filter((_, i) => i !== idx);
            setFormData(prev => ({ ...prev, images: updated, image: updated[0] || '' }));
        };

        return (
            <>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Encabezado</label>
                    <input
                        className={styles.input}
                        value={formData.heading || ''}
                        onChange={e => handleChange('heading', e.target.value)}
                        maxLength={120}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        Cuerpo de texto
                        <CharCounter current={formData.body?.length ?? 0} max={BODY_MAX_CHARS} />
                    </label>
                    <textarea
                        className={styles.textarea}
                        value={formData.body || ''}
                        onChange={e => handleChange('body', e.target.value)}
                        maxLength={BODY_MAX_CHARS}
                    />
                </div>

                {/* Galería de imágenes */}
                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        Imágenes ({images.length}/6)
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: 8 }}>
                            Se mostrarán en diseño optimizado tipo galería.
                        </span>
                    </label>

                    {images.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 10 }}>
                            {images.map((url, idx) => (
                                <div key={idx} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt={`Imagen ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                        onClick={() => handleRemoveImage(idx)}
                                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
                                        title="Quitar imagen"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {images.length < 6 && (
                        <ImageUploader
                            currentImage={null}
                            onImageChange={handleAddImage}
                            label={images.length === 0 ? 'Agregar imagen' : '+ Agregar otra imagen'}
                        />
                    )}
                </div>

                {/* Bullets opcionales */}
                {formData.bullets && (
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Viñetas (Bullets)</label>
                        <div className={styles.itemsList}>
                            {formData.bullets.map((txt, idx) => (
                                <div key={idx} className={styles.itemRow}>
                                    <input
                                        className={styles.input}
                                        value={txt}
                                        onChange={e => {
                                            const newBullets = [...formData.bullets];
                                            newBullets[idx] = e.target.value;
                                            handleChange('bullets', newBullets);
                                        }}
                                        maxLength={200}
                                    />
                                    <button
                                        className={styles.removeBtn}
                                        onClick={() => {
                                            const newBullets = formData.bullets.filter((_, i) => i !== idx);
                                            handleChange('bullets', newBullets);
                                        }}
                                    >
                                        <IconTrash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                className={styles.addItemBtn}
                                onClick={() => handleChange('bullets', [...(formData.bullets || []), ''])}
                            >
                                <IconPlus size={14} /> Agregar viñeta
                            </button>
                        </div>
                    </div>
                )}
            </>
        );
    };

    const renderIconGridSlide = () => {
        const items = formData.items || [];
        const atMax = items.length >= ICON_GRID_MAX;

        return (
            <>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Encabezado</label>
                    <input
                        className={styles.input}
                        value={formData.heading || ''}
                        onChange={e => handleChange('heading', e.target.value)}
                        maxLength={100}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        Descripción
                        <CharCounter current={formData.description?.length ?? 0} max={TEXTAREA_MAX_CHARS} />
                    </label>
                    <textarea
                        className={styles.textarea}
                        value={formData.description || ''}
                        onChange={e => handleChange('description', e.target.value)}
                        maxLength={TEXTAREA_MAX_CHARS}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        Íconos
                        <span style={{
                            float: 'right',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: atMax ? 'var(--color-danger)' : 'var(--text-tertiary)',
                        }}>
                            {items.length}/{ICON_GRID_MAX} máx.
                        </span>
                    </label>
                    <div className={styles.itemsList}>
                        {items.map((item, idx) => (
                            <div key={idx} className={styles.itemRow} style={{ flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', width: '100%', gap: 8, alignItems: 'flex-start' }}>
                                    {/* Número de ícono */}
                                    <span style={{
                                        flexShrink: 0, width: 24, height: 24,
                                        borderRadius: '50%', background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border-color)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)',
                                        marginTop: 8,
                                    }}>
                                        {idx + 1}
                                    </span>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {/* Etiqueta */}
                                        <input
                                            className={styles.input}
                                            placeholder="Etiqueta del ícono"
                                            value={item.label || ''}
                                            maxLength={50}
                                            onChange={e => {
                                                const newItems = [...items];
                                                newItems[idx] = { ...item, label: e.target.value };
                                                handleChange('items', newItems);
                                            }}
                                        />
                                        {/* IconPicker visual */}
                                        <IconPicker
                                            value={item.icon || ''}
                                            onChange={(iconName) => {
                                                const newItems = [...items];
                                                newItems[idx] = { ...item, icon: iconName };
                                                handleChange('items', newItems);
                                            }}
                                        />
                                    </div>
                                    <button
                                        className={styles.removeBtn}
                                        onClick={() => {
                                            const newItems = items.filter((_, i) => i !== idx);
                                            handleChange('items', newItems);
                                        }}
                                        title="Eliminar ícono"
                                        style={{ marginTop: 6 }}
                                    >
                                        <IconTrash2 size={16} />
                                    </button>
                                </div>

                                {/* Imagen alternativa (opcional) */}
                                <div style={{ paddingLeft: 32, borderLeft: '2px solid var(--border-color)' }}>
                                    <ImageUploader
                                        currentImage={item.image}
                                        onImageChange={(url) => {
                                            const newItems = [...items];
                                            newItems[idx] = { ...item, image: url };
                                            handleChange('items', newItems);
                                        }}
                                        label="Imagen (reemplaza ícono)"
                                    />
                                </div>

                                {/* Descripción del ítem */}
                                <textarea
                                    className={styles.input}
                                    placeholder="Descripción del ícono (opcional)"
                                    rows={2}
                                    style={{ paddingLeft: 32, marginLeft: 0, resize: 'vertical' }}
                                    value={item.description || ''}
                                    maxLength={200}
                                    onChange={e => {
                                        const newItems = [...items];
                                        newItems[idx] = { ...item, description: e.target.value };
                                        handleChange('items', newItems);
                                    }}
                                />
                            </div>
                        ))}

                        {/* Botón añadir — deshabilitado al llegar al máximo */}
                        <button
                            className={styles.addItemBtn}
                            onClick={() => {
                                if (atMax) return;
                                handleChange('items', [...items, { label: '', icon: 'Bulb', description: '' }]);
                            }}
                            disabled={atMax}
                            title={atMax ? `Máximo ${ICON_GRID_MAX} íconos permitidos` : undefined}
                            style={{ opacity: atMax ? 0.4 : 1, cursor: atMax ? 'not-allowed' : 'pointer' }}
                        >
                            <IconPlus size={14} />
                            {atMax ? `Máximo ${ICON_GRID_MAX} íconos` : 'Agregar Ícono'}
                        </button>
                    </div>
                </div>
            </>
        );
    };

    const renderComparisonSlide = () => (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Encabezado</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={e => handleChange('heading', e.target.value)}
                    maxLength={100}
                />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Lado Izquierdo */}
                <div>
                    <h4 className={styles.label} style={{ color: 'var(--color-danger)' }}>
                        🔴 Lado Izquierdo
                    </h4>
                    <div className={styles.formGroup}>
                        <input
                            className={styles.input}
                            placeholder="Título"
                            value={formData.left?.title || ''}
                            onChange={e => handleChange('left', { ...formData.left, title: e.target.value })}
                            maxLength={80}
                        />
                    </div>
                    <div className={styles.itemsList}>
                        {formData.left?.items?.map((txt, idx) => (
                            <div key={idx} className={styles.itemRow}>
                                <input
                                    className={styles.input}
                                    value={txt}
                                    maxLength={200}
                                    onChange={e => {
                                        const newItems = [...formData.left.items];
                                        newItems[idx] = e.target.value;
                                        handleChange('left', { ...formData.left, items: newItems });
                                    }}
                                />
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => {
                                        const newItems = formData.left.items.filter((_, i) => i !== idx);
                                        handleChange('left', { ...formData.left, items: newItems });
                                    }}
                                >
                                    <IconTrash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            className={styles.addItemBtn}
                            onClick={() => handleChange('left', { ...formData.left, items: [...(formData.left?.items || []), ''] })}
                        >
                            <IconPlus size={14} /> Agregar
                        </button>
                    </div>
                </div>

                {/* Lado Derecho */}
                <div>
                    <h4 className={styles.label} style={{ color: 'var(--color-success)' }}>
                        🟢 Lado Derecho
                    </h4>
                    <div className={styles.formGroup}>
                        <input
                            className={styles.input}
                            placeholder="Título"
                            value={formData.right?.title || ''}
                            onChange={e => handleChange('right', { ...formData.right, title: e.target.value })}
                            maxLength={80}
                        />
                    </div>
                    <div className={styles.itemsList}>
                        {formData.right?.items?.map((txt, idx) => (
                            <div key={idx} className={styles.itemRow}>
                                <input
                                    className={styles.input}
                                    value={txt}
                                    maxLength={200}
                                    onChange={e => {
                                        const newItems = [...formData.right.items];
                                        newItems[idx] = e.target.value;
                                        handleChange('right', { ...formData.right, items: newItems });
                                    }}
                                />
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => {
                                        const newItems = formData.right.items.filter((_, i) => i !== idx);
                                        handleChange('right', { ...formData.right, items: newItems });
                                    }}
                                >
                                    <IconTrash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            className={styles.addItemBtn}
                            onClick={() => handleChange('right', { ...formData.right, items: [...(formData.right?.items || []), ''] })}
                        >
                            <IconPlus size={14} /> Agregar
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    const renderDynamicSlide = () => (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Título de la Dinámica</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={e => handleChange('heading', e.target.value)}
                    maxLength={100}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Instrucciones
                    <CharCounter current={formData.instructions?.length ?? 0} max={TEXTAREA_MAX_CHARS} />
                </label>
                <textarea
                    className={styles.textarea}
                    placeholder="Instrucciones para el facilitador..."
                    value={formData.instructions || ''}
                    onChange={e => handleChange('instructions', e.target.value)}
                    maxLength={TEXTAREA_MAX_CHARS}
                />
            </div>
            <div className={styles.formGroup}>
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                        <label className={styles.label}>Tipo</label>
                        <input
                            className={styles.input}
                            placeholder="Ej. Roleplay, Debate"
                            value={formData.type || ''}
                            onChange={e => handleChange('type', e.target.value)}
                            maxLength={60}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className={styles.label}>Duración</label>
                        <input
                            className={styles.input}
                            placeholder="Ej. 15 min"
                            value={formData.duration || ''}
                            onChange={e => handleChange('duration', e.target.value)}
                            maxLength={30}
                        />
                    </div>
                </div>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Escenario (Opcional)
                    <CharCounter current={formData.scenario?.length ?? 0} max={TEXTAREA_MAX_CHARS} />
                </label>
                <textarea
                    className={styles.textarea}
                    placeholder="Descripción del caso o escenario..."
                    value={formData.scenario || ''}
                    onChange={e => handleChange('scenario', e.target.value)}
                    maxLength={TEXTAREA_MAX_CHARS}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Reflexión (Debrief)
                    <CharCounter current={formData.debrief?.length ?? 0} max={TEXTAREA_MAX_CHARS} />
                </label>
                <textarea
                    className={styles.textarea}
                    placeholder="Preguntas para el cierre..."
                    value={formData.debrief || ''}
                    onChange={e => handleChange('debrief', e.target.value)}
                    maxLength={TEXTAREA_MAX_CHARS}
                />
            </div>
        </>
    );

    const renderQuizSlide = () => (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Pregunta</label>
                <input
                    className={styles.input}
                    value={formData.question || ''}
                    onChange={e => handleChange('question', e.target.value)}
                    maxLength={300}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Explicación (Feedback al responder)
                    <CharCounter current={formData.explanation?.length ?? 0} max={TEXTAREA_MAX_CHARS} />
                </label>
                <textarea
                    className={styles.textarea}
                    placeholder="Explicación que aparece al responder..."
                    value={formData.explanation || ''}
                    onChange={e => handleChange('explanation', e.target.value)}
                    maxLength={TEXTAREA_MAX_CHARS}
                />
            </div>

            <div className={styles.formGroup}>
                <label className={styles.label}>
                    Opciones
                    <span style={{ float: 'right', fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                        Selecciona la respuesta correcta →
                    </span>
                </label>

                {/* Hint cuando no hay opción correcta seleccionada */}
                {!formData.correctOptionId && (formData.options?.length ?? 0) > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 10px', marginBottom: 8,
                        background: 'color-mix(in srgb, var(--color-warning, #f59e0b) 10%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--color-warning, #f59e0b) 30%, transparent)',
                        borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)',
                    }}>
                        ⚠️ Selecciona cuál es la respuesta correcta haciendo clic en el círculo
                    </div>
                )}

                <div className={styles.itemsList}>
                    {formData.options?.map((opt, idx) => {
                        const isCorrect = formData.correctOptionId === opt.id;
                        return (
                            <div
                                key={idx}
                                className={styles.itemRow}
                                style={{
                                    alignItems: 'center',
                                    background: isCorrect
                                        ? 'color-mix(in srgb, var(--color-success, #22c55e) 8%, transparent)'
                                        : 'transparent',
                                    border: `1px solid ${isCorrect ? 'color-mix(in srgb, var(--color-success, #22c55e) 35%, transparent)' : 'transparent'}`,
                                    borderRadius: 8,
                                    padding: '4px 6px',
                                    transition: 'background 0.15s, border-color 0.15s',
                                }}
                            >
                                {/* Radio con tooltip claro */}
                                <button
                                    type="button"
                                    onClick={() => handleChange('correctOptionId', opt.id)}
                                    title={isCorrect ? 'Respuesta correcta ✓' : 'Marcar como respuesta correcta'}
                                    style={{
                                        width: 22, height: 22, borderRadius: '50%',
                                        border: `2px solid ${isCorrect ? 'var(--color-success, #22c55e)' : 'var(--border-color)'}`,
                                        background: isCorrect ? 'var(--color-success, #22c55e)' : 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                        transition: 'all 0.15s',
                                        color: '#fff',
                                        fontSize: 12, fontWeight: 900,
                                    }}
                                    aria-pressed={isCorrect}
                                    aria-label={`Opción ${idx + 1}: ${isCorrect ? 'correcta' : 'incorrecta'}`}
                                >
                                    {isCorrect ? '✓' : ''}
                                </button>

                                <input
                                    className={styles.input}
                                    style={{ flex: 1 }}
                                    value={opt.text || ''}
                                    maxLength={200}
                                    onChange={e => {
                                        const newOptions = [...formData.options];
                                        newOptions[idx] = { ...opt, text: e.target.value };
                                        handleChange('options', newOptions);
                                    }}
                                    placeholder={`Opción ${idx + 1}`}
                                />
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => {
                                        const newOptions = formData.options.filter((_, i) => i !== idx);
                                        handleChange('options', newOptions);
                                        if (isCorrect) handleChange('correctOptionId', '');
                                    }}
                                >
                                    <IconTrash2 size={16} />
                                </button>
                            </div>
                        );
                    })}
                    <button
                        className={styles.addItemBtn}
                        onClick={() => {
                            const newId = `opt-${Date.now()}`;
                            handleChange('options', [...(formData.options || []), { id: newId, text: '' }]);
                        }}
                    >
                        <IconPlus size={14} /> Agregar Opción
                    </button>
                </div>
            </div>
        </>
    );

    // ── Despacho de render por tipo ───────────────────────────────────────────
    const renderFields = () => {
        switch (slide.type) {
            case 'title': return renderTitleSlide();
            case 'content': return renderContentSlide();
            case 'icon_grid': return renderIconGridSlide();
            case 'comparison': return renderComparisonSlide();
            case 'objective':
            case 'definition':
                return (
                    <>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Encabezado</label>
                            <input
                                className={styles.input}
                                value={formData.heading || ''}
                                onChange={e => handleChange('heading', e.target.value)}
                                maxLength={120}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Cuerpo de texto
                                <CharCounter current={formData.body?.length ?? 0} max={BODY_MAX_CHARS} />
                            </label>
                            <textarea
                                className={styles.textarea}
                                value={formData.body || ''}
                                onChange={e => handleChange('body', e.target.value)}
                                maxLength={BODY_MAX_CHARS}
                            />
                        </div>
                    </>
                );
            case 'benefits':
                return (
                    <>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Encabezado</label>
                            <input
                                className={styles.input}
                                value={formData.heading || ''}
                                onChange={e => handleChange('heading', e.target.value)}
                                maxLength={100}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Beneficios</label>
                            <div className={styles.itemsList}>
                                {formData.items?.map((item, idx) => (
                                    <div key={idx} className={styles.itemRow}>
                                        <input
                                            className={styles.input}
                                            value={item.text || item}
                                            maxLength={200}
                                            onChange={e => {
                                                const newItems = [...formData.items];
                                                newItems[idx] = typeof item === 'object'
                                                    ? { ...item, text: e.target.value }
                                                    : e.target.value;
                                                handleChange('items', newItems);
                                            }}
                                        />
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => {
                                                const newItems = formData.items.filter((_, i) => i !== idx);
                                                handleChange('items', newItems);
                                            }}
                                        >
                                            <IconTrash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    className={styles.addItemBtn}
                                    onClick={() => handleChange('items', [...(formData.items || []), { text: 'Nuevo beneficio' }])}
                                >
                                    <IconPlus size={14} /> Agregar Beneficio
                                </button>
                            </div>
                        </div>
                    </>
                );
            case 'group_dynamic':
            case 'dynamic':
                return renderDynamicSlide();
            case 'group_quiz':
            case 'quiz':
                return renderQuizSlide();
            default:
                return <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Editor no disponible para tipo: {slide.type}</p>;
        }
    };

    // ── Etiqueta del estado de guardado ─────────────────────────────────────────
    const SLIDE_TYPE_LABELS = {
        title: 'Portada', objective: 'Objetivo', definition: 'Definición',
        content: 'Contenido', benefits: 'Beneficios', icon_grid: 'Íconos',
        comparison: 'Comparación', quiz: 'Quiz', group_quiz: 'Quiz',
        dynamic: 'Dinámica', group_dynamic: 'Dinámica',
    };

    return (
        <div className={styles.formContainer}>
            {/* Cabecera del panel con estado de guardado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 className={styles.formTitle}>
                    Slide {slide.order} — {SLIDE_TYPE_LABELS[slide.type] || slide.type}
                </h2>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: '0.8rem',
                        color: savingState === 'error' ? 'var(--color-danger)' : 'var(--text-tertiary)',
                        background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 20,
                    }}>
                        {savingState === 'saving' && <><Loader2 size={14} className={styles.spin} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</>}
                        {savingState === 'saved' && <><IconCheckCircle2 size={14} style={{ color: 'var(--color-success, #22c55e)' }} /> Guardado</>}
                        {savingState === 'error' && <>Error al guardar</>}
                        {savingState === 'idle' && <span style={{ opacity: 0.7 }}>Auto-guardado activo</span>}
                    </div>
                    <button
                        className={styles.secondaryBtn}
                        style={{
                            padding: '8px 12px', borderRadius: 8,
                            border: '1px solid var(--border-color)',
                            background: 'transparent', cursor: 'pointer',
                            color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 6,
                        }}
                        onClick={() => onDelete(slide.id)}
                        disabled={savingState === 'saving'}
                        title="Eliminar este slide"
                    >
                        <IconTrash2 size={16} />
                    </button>
                </div>
            </div>

            {renderFields()}

            {/* Multimedia Global del Slide (Fondo o apoyo visual) */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginTop: 20 }}>
                {formData.bgMedia?.url && (
                    <div className={styles.formGroup} style={{ marginBottom: 15 }}>
                        <label className={styles.label}>Layout del Multimedia</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                style={{
                                    flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                                    border: formData.bgMedia.layout !== 'split' ? 'none' : '1px solid var(--border-color)',
                                    background: formData.bgMedia.layout !== 'split' ? 'var(--color-primary)' : 'transparent',
                                    color: formData.bgMedia.layout !== 'split' ? '#fff' : 'var(--text-primary)',
                                    fontWeight: 600, fontSize: '0.82rem',
                                }}
                                onClick={() => handleChange('bgMedia', { ...formData.bgMedia, layout: 'full' })}
                            >
                                Fondo Completo
                            </button>
                            <button
                                style={{
                                    flex: 1, padding: '8px', borderRadius: 8, cursor: 'pointer',
                                    border: formData.bgMedia.layout === 'split' ? 'none' : '1px solid var(--border-color)',
                                    background: formData.bgMedia.layout === 'split' ? 'var(--color-primary)' : 'transparent',
                                    color: formData.bgMedia.layout === 'split' ? '#fff' : 'var(--text-primary)',
                                    fontWeight: 600, fontSize: '0.82rem',
                                }}
                                onClick={() => handleChange('bgMedia', { ...formData.bgMedia, layout: 'split' })}
                            >
                                Mitad Pantalla
                            </button>
                        </div>
                    </div>
                )}

                <MediaUploader
                    currentMedia={formData.bgMedia || null}
                    onMediaChange={(mediaObj) => {
                        if (!mediaObj) handleChange('bgMedia', null);
                        else handleChange('bgMedia', { ...mediaObj, layout: formData.bgMedia?.layout || 'full' });
                    }}
                    label="Fondo / Apoyo Multimedia (Opcional)"
                />
            </div>
        </div>
    );
}
