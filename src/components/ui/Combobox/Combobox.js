'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './Combobox.module.css';
import { cn } from '@/lib/utils';

/**
 * Combobox component with search and selection
 */
export function Combobox({
    value,
    onChange,
    options = [],
    placeholder = 'Seleccionar...',
    searchPlaceholder = 'Buscar...',
    label,
    required = false,
    disabled = false,
    className,
    ...props
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const comboboxRef = useRef(null);
    const inputRef = useRef(null);

    // Find selected option label
    const selectedOption = options.find(opt =>
        (typeof opt === 'string' ? opt : opt.value) === value
    );
    const displayValue = selectedOption
        ? (typeof selectedOption === 'string' ? selectedOption : selectedOption.label)
        : '';

    // Filter options based on search
    const filteredOptions = options.filter(opt => {
        const label = typeof opt === 'string' ? opt : opt.label;
        return label.toLowerCase().includes(search.toLowerCase());
    });

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (comboboxRef.current && !comboboxRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (option) => {
        const optValue = typeof option === 'string' ? option : option.value;
        onChange?.(optValue);
        setIsOpen(false);
        setSearch('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
            setSearch('');
        }
    };

    return (
        <div className={cn(styles.comboboxWrapper, className)} {...props}>
            {label && (
                <label className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}
            <div
                ref={comboboxRef}
                className={cn(
                    styles.combobox,
                    disabled && styles.disabled,
                    isOpen && styles.open
                )}
            >
                <button
                    type="button"
                    className={styles.trigger}
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                >
                    <span className={cn(styles.value, !displayValue && styles.placeholder)}>
                        {displayValue || placeholder}
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

                {isOpen && (
                    <div className={styles.dropdown} onKeyDown={handleKeyDown}>
                        <div className={styles.searchWrapper}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                className={styles.searchInput}
                                placeholder={searchPlaceholder}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button
                                    type="button"
                                    className={styles.clearBtn}
                                    onClick={() => setSearch('')}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <div className={styles.options}>
                            {filteredOptions.length === 0 ? (
                                <div className={styles.noResults}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    No se encontraron resultados
                                </div>
                            ) : (
                                filteredOptions.map((option, index) => {
                                    const optValue = typeof option === 'string' ? option : option.value;
                                    const optLabel = typeof option === 'string' ? option : option.label;
                                    const isSelected = optValue === value;

                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            className={cn(
                                                styles.option,
                                                isSelected && styles.selected
                                            )}
                                            onClick={() => handleSelect(option)}
                                        >
                                            <span className={styles.optionLabel}>{optLabel}</span>
                                            {isSelected && (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Combobox;
