import { useState, useRef, useEffect } from 'react';
import styles from './CourseSelect.module.css';

export default function CourseSelect({ courses, value, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const selected = courses.find(c => c.name === value);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const handleSelect = (name) => {
        onChange(name);
        setOpen(false);
    };

    return (
        <div className={styles.wrapper} ref={ref}>
            {/* Trigger */}
            <button
                type="button"
                className={styles.trigger}
                onClick={() => setOpen(prev => !prev)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={styles.triggerText}>
                    {selected ? selected.name : '-- Selecciona un curso --'}
                </span>
                <svg
                    className={`${styles.arrow} ${open ? styles.arrowOpen : ''}`}
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                        strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <ul className={styles.dropdown} role="listbox">
                    <li
                        className={styles.option}
                        role="option"
                        aria-selected={!value}
                        onClick={() => handleSelect('')}
                    >
                        -- Selecciona un curso --
                    </li>
                    {courses.map(c => (
                        <li
                            key={c.name}
                            className={`${styles.option} ${c.name === value ? styles.optionActive : ''}`}
                            role="option"
                            aria-selected={c.name === value}
                            onClick={() => handleSelect(c.name)}
                        >
                            {c.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
