import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import ImageUploader from './ImageUploader';
import styles from '@/app/induccion/cursos/[id]/editar/editor.module.css';

export default function SlideEditorPanel({ slide, onSave }) {
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (slide) {
            setFormData(JSON.parse(JSON.stringify(slide.data || {})));
        }
    }, [slide]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        await onSave(slide.id, formData);
        setSaving(false);
    };

    if (!slide) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}><ArrowLeft size={32} /></div>
                <p>Selecciona un slide para editar</p>
            </div>
        );
    }

    // ── Renders por Tipo ──

    const renderTitleSlide = () => (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Título Principal</label>
                <input
                    className={styles.input}
                    value={formData.title || ''}
                    onChange={e => handleChange('title', e.target.value)}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Subtítulo</label>
                <input
                    className={styles.input}
                    value={formData.subtitle || ''}
                    onChange={e => handleChange('subtitle', e.target.value)}
                />
            </div>
        </>
    );

    const renderContentSlide = () => (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Encabezado</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={e => handleChange('heading', e.target.value)}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Cuerpo de texto</label>
                <textarea
                    className={styles.textarea}
                    value={formData.body || ''}
                    onChange={e => handleChange('body', e.target.value)}
                />
            </div>

            {/* Imagen Principal */}
            <ImageUploader
                currentImage={formData.image}
                onImageChange={(url) => handleChange('image', url)}
                label="Imagen de apoyo (Opcional)"
            />

            {/* Lista de bullets opcionales */}
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
                                />
                                <button
                                    className={styles.removeBtn}
                                    onClick={() => {
                                        const newBullets = formData.bullets.filter((_, i) => i !== idx);
                                        handleChange('bullets', newBullets);
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            className={styles.addItemBtn}
                            onClick={() => handleChange('bullets', [...(formData.bullets || []), ''])}
                        >
                            <Plus size={14} /> Agregar viñeta
                        </button>
                    </div>
                </div>
            )}
        </>
    );

    const renderIconGridSlide = () => (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Encabezado</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={e => handleChange('heading', e.target.value)}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Descripción</label>
                <textarea
                    className={styles.textarea}
                    value={formData.description || ''}
                    onChange={e => handleChange('description', e.target.value)}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Items de Grid ({formData.items?.length || 0})</label>
                <div className={styles.itemsList}>
                    {formData.items?.map((item, idx) => (
                        <div key={idx} className={styles.itemRow} style={{ flexDirection: 'column' }}>
                            <div style={{ display: 'flex', width: '100%', gap: 10 }}>
                                <input
                                    className={styles.input}
                                    placeholder="Etiqueta"
                                    value={item.label || ''}
                                    onChange={e => {
                                        const newItems = [...formData.items];
                                        newItems[idx] = { ...item, label: e.target.value };
                                        handleChange('items', newItems);
                                    }}
                                />
                                <input
                                    className={styles.input}
                                    placeholder="Icono (Nombre Lucide)"
                                    value={item.icon || ''}
                                    onChange={e => {
                                        const newItems = [...formData.items];
                                        newItems[idx] = { ...item, icon: e.target.value };
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
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div style={{ paddingLeft: 10, borderLeft: '2px solid var(--border-color)', marginTop: 8 }}>
                                <ImageUploader
                                    currentImage={item.image}
                                    onImageChange={(url) => {
                                        const newItems = [...formData.items];
                                        newItems[idx] = { ...item, image: url };
                                        handleChange('items', newItems);
                                    }}
                                    label="Imagen (reemplaza icono)"
                                />
                            </div>

                            <textarea
                                className={styles.input}
                                placeholder="Descripción del item"
                                rows={2}
                                value={item.description || ''}
                                onChange={e => {
                                    const newItems = [...formData.items];
                                    newItems[idx] = { ...item, description: e.target.value };
                                    handleChange('items', newItems);
                                }}
                            />
                        </div>
                    ))}
                    <button
                        className={styles.addItemBtn}
                        onClick={() => handleChange('items', [...(formData.items || []), { label: '', icon: 'Circle', description: '' }])}
                    >
                        <Plus size={14} /> Agregar Item
                    </button>
                </div>
            </div>
        </>
    );

    const renderComparisonSlide = () => (
        <>
            <div className={styles.formGroup}>
                <label className={styles.label}>Encabezado</label>
                <input
                    className={styles.input}
                    value={formData.heading || ''}
                    onChange={e => handleChange('heading', e.target.value)}
                />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Lado Izquierdo */}
                <div>
                    <h4 className={styles.label} style={{ color: '#ef4444' }}>Lado Izquierdo (Rojo)</h4>
                    <div className={styles.formGroup}>
                        <input
                            className={styles.input}
                            placeholder="Título Izquierdo"
                            value={formData.left?.title || ''}
                            onChange={e => handleChange('left', { ...formData.left, title: e.target.value })}
                        />
                    </div>
                    <div className={styles.itemsList}>
                        {formData.left?.items?.map((txt, idx) => (
                            <div key={idx} className={styles.itemRow}>
                                <input
                                    className={styles.input}
                                    value={txt}
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
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            className={styles.addItemBtn}
                            onClick={() => handleChange('left', { ...formData.left, items: [...(formData.left?.items || []), ''] })}
                        >
                            <Plus size={14} /> Agregar Item
                        </button>
                    </div>
                </div>

                {/* Lado Derecho */}
                <div>
                    <h4 className={styles.label} style={{ color: '#22c55e' }}>Lado Derecho (Verde)</h4>
                    <div className={styles.formGroup}>
                        <input
                            className={styles.input}
                            placeholder="Título Derecho"
                            value={formData.right?.title || ''}
                            onChange={e => handleChange('right', { ...formData.right, title: e.target.value })}
                        />
                    </div>
                    <div className={styles.itemsList}>
                        {formData.right?.items?.map((txt, idx) => (
                            <div key={idx} className={styles.itemRow}>
                                <input
                                    className={styles.input}
                                    value={txt}
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
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <button
                            className={styles.addItemBtn}
                            onClick={() => handleChange('right', { ...formData.right, items: [...(formData.right?.items || []), ''] })}
                        >
                            <Plus size={14} /> Agregar Item
                        </button>
                    </div>
                </div>
            </div>
        </>
    );

    // Selección del render
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
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Cuerpo de texto</label>
                            <textarea
                                className={styles.textarea}
                                value={formData.body || ''}
                                onChange={e => handleChange('body', e.target.value)}
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
                                            onChange={e => {
                                                const newItems = [...formData.items];
                                                newItems[idx] = typeof item === 'object' ? { ...item, text: e.target.value } : e.target.value;
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
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    className={styles.addItemBtn}
                                    onClick={() => handleChange('items', [...(formData.items || []), { text: 'Nuevo beneficio' }])}
                                >
                                    <Plus size={14} /> Agregar Item
                                </button>
                            </div>
                        </div>
                    </>
                );
            default:
                return <p>Editor no disponible para tipo: {slide.type}</p>;
        }
    };

    return (
        <div className={styles.formContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 className={styles.formTitle}>Editar Slide {slide.order} — {slide.type}</h2>
                <button
                    className={styles.primaryBtn}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={handleSave}
                    disabled={saving}
                >
                    <Save size={16} />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            {renderFields()}
        </div>
    );
}
