'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import ImageUploader from '../ImageUploader';
import RichTextEditor from '../RichTextEditor';
import { uploadCourseAsset } from '@/lib/upload';
import styles from './freeformEditor.module.css';

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeId() {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 11);
}

function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// Aplica redimensionado según el handle (nw, n, ne, e, se, s, sw, w)
function applyResize(el, handleId, dx, dy) {
    let { x, y, w, h } = el;
    if (handleId.includes('n')) { y = clamp(y + dy, 0, y + h - 5); h = clamp(h - dy, 5, 100); }
    if (handleId.includes('s')) { h = clamp(h + dy, 5, 100 - y); }
    if (handleId.includes('w')) { x = clamp(x + dx, 0, x + w - 5); w = clamp(w - dx, 5, 100); }
    if (handleId.includes('e')) { w = clamp(w + dx, 5, 100 - x); }
    return { ...el, x, y, w, h };
}

// 8 handles de redimensionado: px/py = posición relativa [0-1] dentro del elemento
const RESIZE_HANDLES = [
    { id: 'nw', px: 0,   py: 0,   cursor: 'nw-resize' },
    { id: 'n',  px: 0.5, py: 0,   cursor: 'n-resize'  },
    { id: 'ne', px: 1,   py: 0,   cursor: 'ne-resize' },
    { id: 'e',  px: 1,   py: 0.5, cursor: 'e-resize'  },
    { id: 'se', px: 1,   py: 1,   cursor: 'se-resize' },
    { id: 's',  px: 0.5, py: 1,   cursor: 's-resize'  },
    { id: 'sw', px: 0,   py: 1,   cursor: 'sw-resize' },
    { id: 'w',  px: 0,   py: 0.5, cursor: 'w-resize'  },
];

// ── Sub-componente: elemento sobre el canvas ─────────────────────────────────
function CanvasElement({ el, isSelected, onPointerDownMove, onPointerDownResize, onDoubleClick }) {
    const { x, y, w, h } = el;

    const elStyle = {
        position:  'absolute',
        left:      `${x}%`,
        top:       `${y}%`,
        width:     `${w}%`,
        height:    `${h}%`,
        boxSizing: 'border-box',
        border:    isSelected ? '2px solid var(--color-primary, #003ccc)' : '1.5px dashed transparent',
        outline:   isSelected ? '0 solid transparent' : 'none',
        cursor:    'move',
        userSelect: 'none',
        // overflow:visible cuando seleccionado → handles E/SE/S no se cortan
        overflow:  isSelected ? 'visible' : 'hidden',
    };

    // Renderiza contenido de solo-lectura (no interactivo) para vista previa en canvas
    const inner = el.kind === 'text'
        ? <div
            style={{
                width: '100%', height: '100%',
                fontSize:   `${el.fontSize || 16}px`,
                fontWeight: el.fontWeight || 400,
                textAlign:  el.align || 'left',
                color:      el.color || 'var(--ds-text, #26251e)',
                fontFamily: 'var(--font-body, sans-serif)',
                lineHeight: 1.4,
                wordBreak:  'break-word',
                overflow:   'hidden',
                padding:    '2px',
            }}
            dangerouslySetInnerHTML={{
                __html: /<[a-z][\s\S]*>/i.test(el.content || '')
                    ? el.content
                    : (el.content || '').split('\n').map(p => `<p style="margin:0 0 0.2em">${p || '&nbsp;'}</p>`).join(''),
            }}
          />
        : el.kind === 'image'
            // eslint-disable-next-line @next/next/no-img-element -- dynamic external Drive URLs, no known dimensions
            ? <img
                src={el.src}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: el.fit || 'contain',
                         borderRadius: `${el.radius ?? 8}px`, display: 'block', pointerEvents: 'none' }}
              />
            : null;

    return (
        <div
            style={elStyle}
            onPointerDown={e => { e.stopPropagation(); onPointerDownMove(e, el.id); }}
            onDoubleClick={e => { e.stopPropagation(); onDoubleClick(el.id); }}
        >
            {inner}

            {/* Handles de redimensionado — solo visibles cuando está seleccionado */}
            {isSelected && RESIZE_HANDLES.map(h => (
                <div
                    key={h.id}
                    style={{
                        position:        'absolute',
                        left:            `calc(${h.px * 100}% - 7px)`,
                        top:             `calc(${h.py * 100}% - 7px)`,
                        width:           14,
                        height:          14,
                        background:      'var(--color-primary, #003ccc)',
                        border:          '2px solid #fff',
                        borderRadius:    3,
                        cursor:          h.cursor,
                        zIndex:          10,
                        pointerEvents:   'all',
                        touchAction:     'none',  // evita scroll/zoom en touch
                        boxShadow:       '0 1px 3px rgba(0,0,0,0.25)',
                    }}
                    onPointerDown={e => { e.stopPropagation(); onPointerDownResize(e, el.id, h.id); }}
                />
            ))}
        </div>
    );
}

// ── Editor principal ──────────────────────────────────────────────────────────
export default function FreeformSlideEditor({ formData, setFormData }) {
    const [selectedId, setSelectedId]   = useState(null);
    const [livePos, setLivePos]         = useState({});     // override visual durante drag
    const [uploading, setUploading]     = useState(false);
    const canvasRef                     = useRef(null);
    const dragRef                       = useRef(null);     // estado del drag en progreso
    const imgInputRef                   = useRef(null);

    const elements    = useMemo(() => formData.elements || [], [formData.elements]);
    const selectedEl  = elements.find(e => e.id === selectedId) ?? null;

    // Fusión de posiciones reales + override del drag en curso
    const displayElements = elements.map(el =>
        livePos[el.id] ? { ...el, ...livePos[el.id] } : el
    );

    // ── Coordenadas del puntero en % del canvas ──────────────────────────────
    const toPct = useCallback((clientX, clientY) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { px: 0, py: 0 };
        return {
            px: ((clientX - rect.left) / rect.width)  * 100,
            py: ((clientY - rect.top)  / rect.height) * 100,
        };
    }, []);

    // ── Iniciar movimiento ───────────────────────────────────────────────────
    const handlePointerDownMove = useCallback((e, elId) => {
        e.preventDefault();
        setSelectedId(elId);
        const { px, py } = toPct(e.clientX, e.clientY);
        const orig = elements.find(el => el.id === elId);
        dragRef.current = { type: 'move', elId, startPx: px, startPy: py, origEl: { ...orig } };
        canvasRef.current?.setPointerCapture(e.pointerId);
    }, [elements, toPct]);

    // ── Iniciar redimensionado ───────────────────────────────────────────────
    const handlePointerDownResize = useCallback((e, elId, handleId) => {
        e.preventDefault();
        // Defensivo: garantiza selección por si por algún motivo el elemento
        // estaba deseleccionado (race con click sintético previo).
        setSelectedId(elId);
        const { px, py } = toPct(e.clientX, e.clientY);
        const orig = elements.find(el => el.id === elId);
        if (!orig) return;
        dragRef.current = { type: 'resize', elId, handleId, startPx: px, startPy: py, origEl: { ...orig } };
        canvasRef.current?.setPointerCapture(e.pointerId);
    }, [elements, toPct]);

    // ── Mover / redimensionar (solo actualiza estado visual, sin guardar) ────
    const handlePointerMove = useCallback((e) => {
        if (!dragRef.current) return;
        const { type, elId, handleId, startPx, startPy, origEl } = dragRef.current;
        const { px, py } = toPct(e.clientX, e.clientY);
        const dx = px - startPx;
        const dy = py - startPy;

        if (type === 'move') {
            setLivePos(prev => ({
                ...prev,
                [elId]: {
                    x: clamp(origEl.x + dx, 0, 100 - origEl.w),
                    y: clamp(origEl.y + dy, 0, 100 - origEl.h),
                },
            }));
        } else if (type === 'resize') {
            const resized = applyResize({ ...origEl }, handleId, dx, dy);
            setLivePos(prev => ({
                ...prev,
                [elId]: { x: resized.x, y: resized.y, w: resized.w, h: resized.h },
            }));
        }
    }, [toPct]);

    // ── Confirmar posición final en formData ─────────────────────────────────
    const handlePointerUp = useCallback(() => {
        if (!dragRef.current) return;
        const { elId } = dragRef.current;
        const finalOverride = livePos[elId];
        dragRef.current = null;

        if (!finalOverride) return;

        setFormData(prev => ({
            ...prev,
            elements: prev.elements.map(el =>
                el.id === elId ? { ...el, ...finalOverride } : el
            ),
        }));
        setLivePos(prev => {
            const next = { ...prev };
            delete next[elId];
            return next;
        });
    }, [livePos, setFormData]);

    // ── Agregar elemento texto ───────────────────────────────────────────────
    const addText = useCallback(() => {
        const newEl = {
            id: makeId(), kind: 'text',
            x: 10, y: 10, w: 50, h: 20,
            content: 'Texto nuevo', fontSize: 18, fontWeight: 400, align: 'left', color: '',
        };
        setFormData(prev => ({ ...prev, elements: [...(prev.elements || []), newEl] }));
        setSelectedId(newEl.id);
    }, [setFormData]);

    // ── Agregar imagen ───────────────────────────────────────────────────────
    const addImage = useCallback((url) => {
        const newEl = {
            id: makeId(), kind: 'image',
            x: 20, y: 20, w: 40, h: 50,
            src: url, fit: 'contain', radius: 8,
        };
        setFormData(prev => ({ ...prev, elements: [...(prev.elements || []), newEl] }));
        setSelectedId(newEl.id);
    }, [setFormData]);

    // ── Agregar imagen (file input nativo → uploadCourseAsset) ───────────────
    const handleImgFileChange = useCallback(async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) return;
        setUploading(true);
        try {
            const result = await uploadCourseAsset(file);
            if (result.success) {
                addImage(result.data.viewLink || result.data.downloadLink || '');
            }
        } catch { /* silent */ } finally {
            setUploading(false);
            if (imgInputRef.current) imgInputRef.current.value = '';
        }
    }, [addImage]);

    // ── Eliminar elemento seleccionado ───────────────────────────────────────
    const deleteSelected = useCallback(() => {
        if (!selectedId) return;
        setFormData(prev => ({
            ...prev,
            elements: prev.elements.filter(el => el.id !== selectedId),
        }));
        setSelectedId(null);
    }, [selectedId, setFormData]);

    // ── Actualizar propiedad de elemento seleccionado ────────────────────────
    const updateEl = useCallback((key, value) => {
        if (!selectedId) return;
        setFormData(prev => ({
            ...prev,
            elements: prev.elements.map(el =>
                el.id === selectedId ? { ...el, [key]: value } : el
            ),
        }));
    }, [selectedId, setFormData]);

    // ── Actualizar posición/tamaño desde inputs numéricos ────────────────────
    const updateElPos = useCallback((key, raw) => {
        const val = clamp(parseFloat(raw) || 0, key === 'w' || key === 'h' ? 5 : 0, 100);
        updateEl(key, val);
    }, [updateEl]);

    // ── Doble clic: seleccionar y llevar foco al panel de propiedades ────────
    const handleDoubleClick = useCallback((elId) => {
        setSelectedId(elId);
    }, []);

    // ── Cambio de fondo ──────────────────────────────────────────────────────
    const handleBg = useCallback((e) => {
        setFormData(prev => ({ ...prev, background: e.target.value }));
    }, [setFormData]);

    // Atajos de teclado: Delete para borrar seleccionado
    useEffect(() => {
        const onKey = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.isContentEditable) return;
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
                e.preventDefault();
                deleteSelected();
            }
            if (e.key === 'Escape') setSelectedId(null);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedId, deleteSelected]);

    return (
        <div className={styles.freeformEditorRoot}>

            {/* ── Barra de herramientas ─────────────────────────────────── */}
            <div className={styles.toolbar}>
                <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={addText}
                    title="Agregar cuadro de texto"
                >
                    + Texto
                </button>

                <button
                    type="button"
                    className={styles.toolBtn}
                    onClick={() => imgInputRef.current?.click()}
                    disabled={uploading}
                    title="Agregar imagen al canvas"
                >
                    {uploading ? 'Subiendo...' : '+ Imagen'}
                </button>

                {/* Input file nativo oculto para subida de imágenes */}
                <input
                    ref={imgInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImgFileChange}
                    aria-hidden="true"
                    tabIndex={-1}
                />

                <div className={styles.bgControl}>
                    <label className={styles.bgLabel}>Fondo</label>
                    <input
                        type="color"
                        className={styles.bgInput}
                        value={formData.background || '#ffffff'}
                        onChange={handleBg}
                        title="Color de fondo del slide"
                        aria-label="Color de fondo"
                    />
                    <button
                        type="button"
                        className={styles.toolBtnGhost}
                        onClick={() => setFormData(prev => ({ ...prev, background: '' }))}
                        title="Restablecer fondo por defecto"
                    >
                        ↩
                    </button>
                </div>

                {selectedId && (
                    <button
                        type="button"
                        className={`${styles.toolBtn} ${styles.toolBtnDanger}`}
                        onClick={deleteSelected}
                        title="Eliminar elemento seleccionado (Supr)"
                    >
                        Eliminar
                    </button>
                )}
            </div>

            {/* ── Canvas 16:9 ───────────────────────────────────────────── */}
            <div className={styles.canvasWrapper}>
                <div
                    ref={canvasRef}
                    className={styles.canvas}
                    style={formData.background ? { background: formData.background } : undefined}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onClick={(e) => {
                        // Deseleccionar SOLO al hacer clic en el canvas vacío.
                        // Sin esta guarda, click sintético tras pointer-capture
                        // de un handle de resize deselecciona el elemento.
                        if (e.target === e.currentTarget) setSelectedId(null);
                    }}
                >
                    {displayElements.map(el => (
                        <CanvasElement
                            key={el.id}
                            el={el}
                            isSelected={selectedId === el.id}
                            onPointerDownMove={handlePointerDownMove}
                            onPointerDownResize={handlePointerDownResize}
                            onDoubleClick={handleDoubleClick}
                        />
                    ))}

                    {elements.length === 0 && (
                        <div className={styles.canvasEmpty}>
                            Haz clic en <strong>+ Texto</strong> o <strong>+ Imagen</strong> para comenzar
                        </div>
                    )}
                </div>
            </div>

            {/* ── Panel de propiedades ──────────────────────────────────── */}
            {selectedEl && (
                <div className={styles.propsPanel}>
                    <p className={styles.propsPanelTitle}>
                        {selectedEl.kind === 'text' ? 'Texto' : 'Imagen'} — Propiedades
                    </p>

                    {/* Posición y tamaño */}
                    <div className={styles.propsGrid}>
                        {['x', 'y', 'w', 'h'].map(key => (
                            <label key={key} className={styles.propField}>
                                <span className={styles.propLabel}>
                                    {key === 'x' ? 'Izq %' : key === 'y' ? 'Top %' : key === 'w' ? 'Ancho %' : 'Alto %'}
                                </span>
                                <input
                                    type="number"
                                    className={styles.propInput}
                                    min={key === 'w' || key === 'h' ? 5 : 0}
                                    max={100}
                                    step={0.5}
                                    value={Math.round((selectedEl[key] ?? 0) * 10) / 10}
                                    onChange={e => updateElPos(key, e.target.value)}
                                />
                            </label>
                        ))}
                    </div>

                    {/* Propiedades específicas de texto */}
                    {selectedEl.kind === 'text' && (
                        <>
                            <div className={styles.propsRow}>
                                <label className={styles.propField} style={{ flex: '0 0 80px' }}>
                                    <span className={styles.propLabel}>Tamaño px</span>
                                    <input
                                        type="number"
                                        className={styles.propInput}
                                        min={8} max={120} step={1}
                                        value={selectedEl.fontSize || 16}
                                        onChange={e => updateEl('fontSize', parseInt(e.target.value, 10) || 16)}
                                    />
                                </label>

                                <label className={styles.propField} style={{ flex: '0 0 90px' }}>
                                    <span className={styles.propLabel}>Peso</span>
                                    <select
                                        className={styles.propSelect}
                                        value={selectedEl.fontWeight || 400}
                                        onChange={e => updateEl('fontWeight', parseInt(e.target.value, 10))}
                                    >
                                        <option value={300}>Ligero</option>
                                        <option value={400}>Normal</option>
                                        <option value={600}>Semi-bold</option>
                                        <option value={700}>Bold</option>
                                        <option value={900}>Black</option>
                                    </select>
                                </label>

                                <label className={styles.propField} style={{ flex: '0 0 90px' }}>
                                    <span className={styles.propLabel}>Alineación</span>
                                    <select
                                        className={styles.propSelect}
                                        value={selectedEl.align || 'left'}
                                        onChange={e => updateEl('align', e.target.value)}
                                    >
                                        <option value="left">Izquierda</option>
                                        <option value="center">Centro</option>
                                        <option value="right">Derecha</option>
                                    </select>
                                </label>

                                <label className={styles.propField} style={{ flex: '0 0 50px' }}>
                                    <span className={styles.propLabel}>Color</span>
                                    <input
                                        type="color"
                                        className={styles.bgInput}
                                        value={selectedEl.color || '#26251e'}
                                        onChange={e => updateEl('color', e.target.value)}
                                        title="Color del texto"
                                    />
                                </label>
                            </div>

                            <div className={styles.textEditorWrap}>
                                <span className={styles.propLabel}>Contenido</span>
                                <RichTextEditor
                                    value={selectedEl.content || ''}
                                    onChange={html => updateEl('content', html)}
                                    placeholder="Escribe el contenido..."
                                    minRows={3}
                                />
                            </div>
                        </>
                    )}

                    {/* Propiedades específicas de imagen */}
                    {selectedEl.kind === 'image' && (
                        <div className={styles.propsRow}>
                            <label className={styles.propField}>
                                <span className={styles.propLabel}>Ajuste</span>
                                <select
                                    className={styles.propSelect}
                                    value={selectedEl.fit || 'contain'}
                                    onChange={e => updateEl('fit', e.target.value)}
                                >
                                    <option value="contain">Contener</option>
                                    <option value="cover">Cubrir</option>
                                    <option value="fill">Rellenar</option>
                                </select>
                            </label>

                            <label className={styles.propField}>
                                <span className={styles.propLabel}>Radio px</span>
                                <input
                                    type="number"
                                    className={styles.propInput}
                                    min={0} max={100} step={1}
                                    value={selectedEl.radius ?? 8}
                                    onChange={e => updateEl('radius', parseInt(e.target.value, 10) || 0)}
                                />
                            </label>

                            <div className={styles.imgReplaceWrap}>
                                <span className={styles.propLabel}>Reemplazar imagen</span>
                                <ImageUploader
                                    currentImage={selectedEl.src}
                                    onImageChange={url => updateEl('src', url)}
                                    label="Cambiar imagen"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!selectedEl && elements.length > 0 && (
                <p className={styles.hintText}>
                    Haz clic en un elemento para seleccionarlo · Arrastra para mover · Usa las esquinas para redimensionar
                </p>
            )}
        </div>
    );
}
