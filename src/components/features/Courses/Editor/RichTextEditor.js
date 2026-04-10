'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import styles from './RichTextEditor.module.css';

// Colores de texto disponibles
const TEXT_COLORS = [
    { label: 'Negro',    value: '#111827' },
    { label: 'Gris',     value: '#6b7280' },
    { label: 'Azul',     value: '#003ccc' },
    { label: 'Cian',     value: '#0891b2' },
    { label: 'Verde',    value: '#16a34a' },
    { label: 'Amarillo', value: '#ca8a04' },
    { label: 'Naranja',  value: '#ea580c' },
    { label: 'Rojo',     value: '#dc2626' },
    { label: 'Morado',   value: '#7c3aed' },
    { label: 'Rosa',     value: '#db2777' },
    { label: 'Blanco',   value: '#ffffff' },
];

/**
 * RichTextEditor — Editor de texto enriquecido con toolbar PowerPoint-style
 * Soporta: B / I / U / Tachado / Alineación / Color de texto / Tamaño / Limpiar formato
 */
export default function RichTextEditor({
    value = '',
    onChange,
    placeholder = 'Escribe aquí...',
    maxLength,
    minRows = 3,
}) {
    const editorRef = useRef(null);
    const onChangeRef = useRef(onChange);
    const isComposingRef = useRef(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [activeColor, setActiveColor] = useState('#111827');
    const colorBtnRef = useRef(null);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

    // Inicializar innerHTML solo en mount
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = value || '';
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Paste nativo: solo texto plano
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        function handleNativePaste(e) {
            e.preventDefault();
            const text = e.clipboardData?.getData('text/plain') || '';
            document.execCommand('insertText', false, text);
        }
        el.addEventListener('paste', handleNativePaste);
        return () => el.removeEventListener('paste', handleNativePaste);
    }, []);

    // Cerrar color picker al click fuera
    useEffect(() => {
        if (!showColorPicker) return;
        function handleClickOutside(e) {
            if (colorBtnRef.current && !colorBtnRef.current.contains(e.target)) {
                setShowColorPicker(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColorPicker]);

    // Emitir cambio al padre
    const emitChange = useCallback(() => {
        const el = editorRef.current;
        if (!el || isComposingRef.current) return;
        const text = el.textContent || '';
        const html = el.innerHTML;
        onChangeRef.current(text.trim() ? html : '');
    }, []);

    // Evitar que el padre capture teclas
    const handleKeyDown = useCallback((e) => {
        const captured = [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
        if (captured.includes(e.key)) e.stopPropagation();
    }, []);

    const handleInput = useCallback(() => {
        if (isComposingRef.current) return;
        if (maxLength && editorRef.current) {
            const textLen = editorRef.current.textContent?.length || 0;
            if (textLen > maxLength) {
                document.execCommand('undo');
                return;
            }
        }
        emitChange();
    }, [emitChange, maxLength]);

    // Aplicar formato genérico
    const applyFormat = useCallback((command, value = null) => {
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        document.execCommand(command, false, value);
        emitChange();
    }, [emitChange]);

    // Aplicar color de texto
    const applyColor = useCallback((color) => {
        setActiveColor(color);
        setShowColorPicker(false);
        applyFormat('foreColor', color);
    }, [applyFormat]);

    const minHeight = `${minRows * 1.6}rem`;

    return (
        <div className={styles.wrapper}>
            {/* ── Toolbar ── */}
            <div className={styles.toolbar} role="toolbar" aria-label="Formato de texto">

                {/* Grupo: Estilo de caracteres */}
                <div className={styles.toolGroup}>
                    <button type="button" className={styles.toolBtn}
                        onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }}
                        title="Negrita (Ctrl+B)" aria-label="Negrita">
                        <strong>B</strong>
                    </button>
                    <button type="button" className={styles.toolBtn}
                        onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }}
                        title="Cursiva (Ctrl+I)" aria-label="Cursiva">
                        <em>I</em>
                    </button>
                    <button type="button" className={styles.toolBtn}
                        onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }}
                        title="Subrayado (Ctrl+U)" aria-label="Subrayado">
                        <u>U</u>
                    </button>
                    <button type="button" className={styles.toolBtn}
                        onMouseDown={(e) => { e.preventDefault(); applyFormat('strikeThrough'); }}
                        title="Tachado" aria-label="Tachado">
                        <s>S</s>
                    </button>
                </div>

                <div className={styles.toolDivider} aria-hidden="true" />

                {/* Grupo: Alineación */}
                <div className={styles.toolGroup}>
                    <button type="button" className={styles.toolBtn}
                        onMouseDown={(e) => { e.preventDefault(); applyFormat('justifyLeft'); }}
                        title="Alinear izquierda" aria-label="Alinear izquierda">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="7" x2="9" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="1" y1="11" x2="11" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                    <button type="button" className={styles.toolBtn}
                        onMouseDown={(e) => { e.preventDefault(); applyFormat('justifyCenter'); }}
                        title="Centrar" aria-label="Centrar">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                    <button type="button" className={styles.toolBtn}
                        onMouseDown={(e) => { e.preventDefault(); applyFormat('justifyRight'); }}
                        title="Alinear derecha" aria-label="Alinear derecha">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="5" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                </div>

                <div className={styles.toolDivider} aria-hidden="true" />

                {/* Color de texto */}
                <div className={styles.toolGroup} ref={colorBtnRef} style={{ position: 'relative' }}>
                    <button
                        type="button"
                        className={styles.toolBtnColor}
                        onMouseDown={(e) => { e.preventDefault(); setShowColorPicker(v => !v); }}
                        title="Color de texto"
                        aria-label="Color de texto"
                        aria-haspopup="true"
                        aria-expanded={showColorPicker}
                    >
                        <span className={styles.colorIcon}>
                            <strong style={{ color: activeColor === '#ffffff' ? '#111827' : activeColor }}>A</strong>
                            <span className={styles.colorBar} style={{ background: activeColor }} />
                        </span>
                    </button>
                    {showColorPicker && (
                        <div className={styles.colorPicker} role="dialog" aria-label="Elegir color de texto">
                            {TEXT_COLORS.map(c => (
                                <button
                                    key={c.value}
                                    type="button"
                                    className={styles.colorSwatch}
                                    style={{ background: c.value, outline: c.value === activeColor ? '2px solid #003ccc' : undefined, outlineOffset: '2px' }}
                                    onMouseDown={(e) => { e.preventDefault(); applyColor(c.value); }}
                                    title={c.label}
                                    aria-label={c.label}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.toolDivider} aria-hidden="true" />

                {/* Limpiar formato */}
                <button type="button" className={styles.toolBtn}
                    onMouseDown={(e) => { e.preventDefault(); applyFormat('removeFormat'); }}
                    title="Quitar todo el formato"
                    aria-label="Quitar formato">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 11L7 6M5 2l4 4-3 3-4-4 3-3zM9 9l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
            </div>

            {/* Área editable */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className={styles.editor}
                style={{ minHeight }}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                onCompositionStart={() => { isComposingRef.current = true; }}
                onCompositionEnd={() => { isComposingRef.current = false; emitChange(); }}
                data-placeholder={placeholder}
                role="textbox"
                aria-multiline="true"
                aria-label={placeholder}
                spellCheck
            />

            {maxLength && (
                <div className={styles.counter}>
                    <span>{value ? value.replace(/<[^>]*>/g, '').length : 0}</span>
                    &nbsp;/ {maxLength}
                </div>
            )}
        </div>
    );
}
