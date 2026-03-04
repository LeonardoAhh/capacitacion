'use client';

import { useEffect, useRef, useCallback } from 'react';
import styles from './RichTextEditor.module.css';

/**
 * RichTextEditor — Editor de texto enriquecido liviano
 * Soporta: Negrita (B), Cursiva (I), Subrayado (U)
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

    // Emitir cambio al padre
    const emitChange = useCallback(() => {
        const el = editorRef.current;
        if (!el || isComposingRef.current) return;
        const text = el.textContent || '';
        const html = el.innerHTML;
        onChangeRef.current(text.trim() ? html : '');
    }, []);

    // ── FIX: evitar que el padre capture teclas de escritura y navegación ──
    const handleKeyDown = useCallback((e) => {
        const captured = [' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
        if (captured.includes(e.key)) {
            e.stopPropagation();
        }
    }, []);

    // Input con límite de caracteres
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

    // Botones de formato
    const applyFormat = useCallback((command) => {
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        document.execCommand(command, false, null);
        emitChange();
    }, [emitChange]);

    const minHeight = `${minRows * 1.6}rem`;

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar} role="toolbar" aria-label="Formato de texto">
                <button
                    type="button"
                    className={styles.toolBtn}
                    onMouseDown={(e) => { e.preventDefault(); applyFormat('bold'); }}
                    title="Negrita (Ctrl+B)"
                    aria-label="Negrita"
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    className={styles.toolBtn}
                    onMouseDown={(e) => { e.preventDefault(); applyFormat('italic'); }}
                    title="Cursiva (Ctrl+I)"
                    aria-label="Cursiva"
                >
                    <em>I</em>
                </button>
                <button
                    type="button"
                    className={styles.toolBtn}
                    onMouseDown={(e) => { e.preventDefault(); applyFormat('underline'); }}
                    title="Subrayado (Ctrl+U)"
                    aria-label="Subrayado"
                >
                    <u>U</u>
                </button>
                <div className={styles.toolbarDivider} aria-hidden="true" />
                <button
                    type="button"
                    className={styles.toolBtn}
                    onMouseDown={(e) => { e.preventDefault(); applyFormat('removeFormat'); }}
                    title="Quitar formato"
                    aria-label="Quitar formato"
                >
                    <span style={{ fontSize: '0.7rem', letterSpacing: '-1px' }}>A/</span>
                </button>
            </div>

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
