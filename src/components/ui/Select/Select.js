'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './Select.module.css';
import { cn } from '@/lib/utils';

/**
 * Custom Select component
 */
export function Select({
    value,
    onChange,
    options = [],
    placeholder = 'Seleccionar...',
    disabled = false,
    searchable = false,
    className,
    ...props
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const selectRef = useRef(null);
    const inputRef = useRef(null);

    // Find selected option
    const selectedOption = options.find(opt => opt.value === value);

    // Filter options based on search
    const filteredOptions = searchable && search
        ? options.filter(opt =>
            opt.label.toLowerCase().includes(search.toLowerCase())
        )
        : options;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (selectRef.current && !selectRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearch('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && searchable && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, searchable]);

    const handleSelect = (option) => {
        onChange?.(option.value);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div
            ref={selectRef}
            className={cn(
                styles.selectWrapper,
                disabled && styles.disabled,
                isOpen && styles.open,
                className
            )}
            {...props}
        >
            <button
                type="button"
                className={styles.trigger}
                onClick={() => !disabled && setIsOpen(!isOpen)}
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

            {isOpen && (
                <div className={styles.dropdown}>
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
                                        option.value === value && styles.selected
                                    )}
                                    onClick={() => handleSelect(option)}
                                >
                                    {option.label}
                                    {option.value === value && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Select;
