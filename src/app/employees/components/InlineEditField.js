'use client';

import { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import styles from './InlineEditField.module.css';

export default function InlineEditField({
    label,
    value,
    type = 'text',
    options = [], // For selects
    onSave,
    placeholder = '—',
    required = false,
    className = '',
    variant = 'default' // Add variant support
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value || '');
    const inputRef = useRef(null);

    useEffect(() => {
        setTempValue(value || '');
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (required && !tempValue && type !== 'checkbox') return;
        setIsEditing(false);
        if (tempValue !== value) {
            onSave(tempValue);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setTempValue(value || '');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && type !== 'textarea') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const displayValue = () => {
        if (type === 'checkbox') return value ? 'Sí' : 'No';
        if (type === 'select') {
            const opt = options.find(o => o.value === value);
            return opt ? opt.label : (value || placeholder);
        }
        if (type === 'date' && value) {
            try {
                // Return simple formatted date string for display if we want, or just fallback to value
                // For simplicity, we assume `value` is already a YYYY-MM-DD string that displays ok, 
                // or we let the parent format it before passing, but parent passes raw value for editing.
                // Let's assume parent passes `displayFormatter` if needed, but for now just raw or placeholder.
            } catch (e) {}
        }
        return value || placeholder;
    };

    return (
        <div className={`${styles.container} ${className}`}>
            <label className={`${styles.label} ${variant === 'hero' ? 'hero-label' : ''}`}>{label}</label>
            
            {isEditing ? (
                <div className={styles.editMode}>
                    {type === 'select' ? (
                        <select
                            ref={inputRef}
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            className={styles.input}
                        >
                            <option value="">Selecciona...</option>
                            {options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    ) : type === 'checkbox' ? (
                        <input
                            ref={inputRef}
                            type="checkbox"
                            checked={tempValue}
                            onChange={(e) => setTempValue(e.target.checked)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            className={styles.checkbox}
                        />
                    ) : (
                        <input
                            ref={inputRef}
                            type={type}
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            className={styles.input}
                            placeholder={placeholder}
                        />
                    )}
                    <div className={styles.actions}>
                        <button onMouseDown={(e) => { e.preventDefault(); handleSave(); }} className={styles.saveBtn} aria-label="Guardar">
                            <Check size={14} />
                        </button>
                        <button onMouseDown={(e) => { e.preventDefault(); handleCancel(); }} className={styles.cancelBtn} aria-label="Cancelar">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            ) : (
                <div 
                    className={styles.viewMode} 
                    onClick={() => setIsEditing(true)}
                    role="button"
                    tabIndex={0}
                >
                    <span className={`${styles.value} ${!value ? styles.empty : ''} ${variant === 'hero' ? 'hero-value' : ''}`}>
                        {displayValue()}
                    </span>
                    <Edit2 size={12} className={styles.editIcon} />
                </div>
            )}
        </div>
    );
}
