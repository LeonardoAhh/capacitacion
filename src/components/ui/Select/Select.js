'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
    const [dropdownStyle, setDropdownStyle] = useState({});
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    const selectedOption = options.find(opt => String(opt.value) === String(value));

    const filteredOptions = searchable && search
        ? options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
        : options;

    // Calculate dropdown position relative to viewport
    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = Math.min(filteredOptions.length * 42 + 16, 240);
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
    }, [filteredOptions.length]);

    const open = () => {
        if (disabled) return;
        updatePosition();
        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
        setSearch('');
    };

    // Close on outside click
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
    }, [isOpen]);

    // Reposition on scroll/resize
    useEffect(() => {
        if (!isOpen) return;
        const handle = () => updatePosition();
        window.addEventListener('scroll', handle, true);
        window.addEventListener('resize', handle);
        return () => {
            window.removeEventListener('scroll', handle, true);
            window.removeEventListener('resize', handle);
        };
    }, [isOpen, updatePosition]);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && searchable && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, searchable]);

    const handleSelect = (option) => {
        onChange?.(option.value);
        close();
    };

    return (
        <div className={cn(styles.wrapper, className)}>
            {label && <label className={styles.label}>{label}</label>}
            <div
                className={cn(
                    styles.selectWrapper,
                    disabled && styles.disabled,
                    isOpen && styles.open,
                )}
                {...props}
            >
                <button
                    ref={triggerRef}
                    type="button"
                    className={styles.trigger}
                    onClick={() => isOpen ? close() : open()}
                    disabled={disabled}
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
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </button>

                {isOpen && typeof document !== 'undefined' && createPortal(
                    <div
                        ref={dropdownRef}
                        className={styles.dropdown}
                        style={dropdownStyle}
                    >
                        {searchable && (
                            <div className={styles.searchWrapper}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="Buscar..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        )}
                        <div className={styles.options}>
                            {filteredOptions.length === 0 ? (
                                <div className={styles.noResults}>No hay resultados</div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={cn(
                                            styles.option,
                                            String(option.value) === String(value) && styles.selected
                                        )}
                                        onClick={() => handleSelect(option)}
                                    >
                                        {option.label}
                                        {String(option.value) === String(value) && (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </button>
                                ))
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
