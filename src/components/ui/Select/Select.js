'use client';

import { useState, useRef, useEffect, useCallback, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import styles from './Select.module.css';
import { cn } from '@/lib/utils';

export function Select({
    value,
    onChange,
    options = [],
    placeholder = 'Seleccionar...',
    label,
    disabled = false,
    searchable = false,
    className,
    ...props
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [dropdownStyle, setDropdownStyle] = useState({});

    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const optionsRef = useRef(null);

    // FIX: IDs únicos por instancia para ARIA correcta con múltiples Selects en la misma página
    const uid = useId();
    const listboxId = `select-listbox-${uid}`;
    const labelId = `select-label-${uid}`;
    const triggerId = `select-trigger-${uid}`;

    // FIX: memoizar selectedOption y filteredOptions para evitar recálculos en cada render
    const selectedOption = useMemo(
        () => options.find(opt => String(opt.value) === String(value)),
        [options, value]
    );

    const filteredOptions = useMemo(
        () =>
            searchable && search
                ? options.filter(opt =>
                    opt.label.toLowerCase().includes(search.toLowerCase())
                )
                : options,
        [options, search, searchable]
    );

    // FIX: dependencia estable; el cálculo de altura ya no depende de filteredOptions.length
    // porque se lee del DOM real en el momento de abrir
    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        // Leer altura real del dropdown si ya está montado, si no usar estimación
        const dropdownEl = dropdownRef.current;
        const dropdownHeight = dropdownEl ? dropdownEl.offsetHeight : 240;
        const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

        setDropdownStyle({
            position: 'fixed',
            left: rect.left,
            width: rect.width,
            ...(openUpward
                ? { bottom: window.innerHeight - rect.top + 6 }
                : { top: rect.bottom + 6 }
            ),
            zIndex: 99999,
        });
    }, []); // sin dependencias externas — lee del DOM directamente

    const open = useCallback(() => {
        if (disabled) return;
        updatePosition();
        setIsOpen(true);
    }, [disabled, updatePosition]);

    const close = useCallback(() => {
        setIsOpen(false);
        setSearch('');
        setFocusedIndex(-1);
    }, []);

    // FIX: scroll automático al elemento enfocado durante navegación con teclado
    useEffect(() => {
        if (!isOpen || focusedIndex < 0 || !optionsRef.current) return;
        const container = optionsRef.current;
        const focused = container.children[focusedIndex];
        if (!focused) return;
        focused.scrollIntoView({ block: 'nearest' });
    }, [focusedIndex, isOpen]);

    // Cerrar al hacer click fuera
    useEffect(() => {
        if (!isOpen) return;
        const handle = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) {
                close();
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [isOpen, close]);

    // Reposicionar al hacer scroll o resize
    useEffect(() => {
        if (!isOpen) return;
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, updatePosition]);

    // Enfocar el input de búsqueda al abrir
    useEffect(() => {
        if (isOpen && searchable && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, searchable]);

    // Reposicionar una vez el dropdown esté en el DOM (para leer su altura real)
    useEffect(() => {
        if (isOpen) {
            // Defer para que el DOM haya pintado el dropdown
            requestAnimationFrame(updatePosition);
        }
    }, [isOpen, updatePosition]);

    const handleSelect = useCallback((option) => {
        onChange?.(option.value);
        close();
        triggerRef.current?.focus();
    }, [onChange, close]);

    // FIX: handler de teclado también usado por el searchInput para mantener
    // la navegación con flechas mientras se escribe
    const handleKeyDown = useCallback((e) => {
        if (disabled) return;

        if (!isOpen) {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
                e.preventDefault();
                open();
                setFocusedIndex(0);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev =>
                    filteredOptions.length === 0 ? -1 : (prev + 1) % filteredOptions.length
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev =>
                    filteredOptions.length === 0
                        ? -1
                        : (prev - 1 + filteredOptions.length) % filteredOptions.length
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
                    handleSelect(filteredOptions[focusedIndex]);
                }
                break;
            // FIX: Espacio solo actúa como selección si no es el searchInput
            case ' ':
                if (document.activeElement !== inputRef.current) {
                    e.preventDefault();
                    if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
                        handleSelect(filteredOptions[focusedIndex]);
                    }
                }
                break;
            case 'Escape':
                e.preventDefault();
                close();
                triggerRef.current?.focus();
                break;
            case 'Tab':
                close();
                break;
            default:
                break;
        }
    }, [disabled, isOpen, open, close, focusedIndex, filteredOptions, handleSelect]);

    return (
        <div className={cn(styles.wrapper, className)}>
            {/* FIX: label conectado al trigger con htmlFor/id */}
            {label && (
                <label
                    id={labelId}
                    htmlFor={triggerId}
                    className={styles.label}
                >
                    {label}
                </label>
            )}
            <div
                className={cn(
                    styles.selectWrapper,
                    disabled && styles.disabled,
                    isOpen && styles.open,
                )}
            >
                <button
                    ref={triggerRef}
                    id={triggerId}
                    type="button"
                    className={styles.trigger}
                    onClick={() => isOpen ? close() : open()}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    // FIX: aria-labelledby usa el id del label cuando existe,
                    // aria-label solo si no hay label visual
                    aria-labelledby={label ? labelId : undefined}
                    aria-label={!label ? props['aria-label'] : undefined}
                    // FIX: apunta al listbox para que screen readers anuncien la opción activa
                    aria-controls={isOpen ? listboxId : undefined}
                    aria-activedescendant={
                        isOpen && focusedIndex >= 0 && filteredOptions[focusedIndex]
                            ? `${listboxId}-option-${focusedIndex}`
                            : undefined
                    }
                >
                    <span className={cn(styles.value, !selectedOption && styles.placeholder)}>
                        {selectedOption?.label || placeholder}
                    </span>
                    <svg
                        className={cn(styles.chevron, isOpen && styles.chevronOpen)}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>

                {isOpen && typeof document !== 'undefined' && createPortal(
                    // FIX: onKeyDown en el contenedor del dropdown captura teclas desde searchInput
                    <div
                        ref={dropdownRef}
                        className={styles.dropdown}
                        style={dropdownStyle}
                        onKeyDown={handleKeyDown}
                    >
                        {searchable && (
                            <div className={styles.searchWrapper}>
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    aria-hidden="true"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="Buscar..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setFocusedIndex(0); // reset al filtrar
                                    }}
                                    // FIX: aria para el input de búsqueda
                                    aria-label="Buscar opciones"
                                    aria-controls={listboxId}
                                    autoComplete="off"
                                />
                            </div>
                        )}

                        {/* FIX: role="listbox" con estructura ARIA válida.
                            Los hijos deben tener role="option", no ser <button>.
                            Usamos <div> con role="option" para cumplir la spec.
                            El click/teclado se maneja igual. */}
                        <div
                            ref={optionsRef}
                            id={listboxId}
                            className={styles.options}
                            role="listbox"
                            aria-label={label || props['aria-label'] || 'Opciones'}
                            // Permite que el listbox sea focusable para AT si es necesario
                            tabIndex={-1}
                        >
                            {filteredOptions.length === 0 ? (
                                <div className={styles.noResults} role="status" aria-live="polite">
                                    No hay resultados
                                </div>
                            ) : (
                                filteredOptions.map((option, index) => {
                                    const isSelected = String(option.value) === String(value);
                                    const isFocused = focusedIndex === index;
                                    return (
                                        // FIX: <div role="option"> es la estructura correcta para listbox
                                        // Se añade tabIndex={-1} para que scrollIntoView funcione
                                        <div
                                            key={option.value}
                                            id={`${listboxId}-option-${index}`}
                                            className={cn(
                                                styles.option,
                                                isSelected && styles.selected,
                                                isFocused && styles.focused
                                            )}
                                            role="option"
                                            aria-selected={isSelected}
                                            tabIndex={-1}
                                            onClick={() => handleSelect(option)}
                                            onMouseEnter={() => setFocusedIndex(index)}
                                            // FIX: onMouseDown con preventDefault evita que el
                                            // trigger pierda foco antes de que handleSelect dispare
                                            onMouseDown={(e) => e.preventDefault()}
                                        >
                                            <span>{option.label}</span>
                                            {isSelected && (
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    aria-hidden="true"
                                                >
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
}

export default Select;