"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Upload,
    Download,
    UserPlus,
    FileJson,
} from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import styles from './EmployeeSearchBar.module.css';

const ANIMATION_VARIANTS = {
    container: {
        hidden: { opacity: 0, height: 0 },
        show: {
            opacity: 1,
            height: "auto",
            transition: {
                height: { duration: 0.3 },
                staggerChildren: 0.05,
            },
        },
        exit: {
            opacity: 0,
            height: 0,
            transition: {
                height: { duration: 0.2 },
                opacity: { duration: 0.1 },
            },
        },
    },
    item: {
        hidden: { opacity: 0, x: -10 },
        show: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.2 },
        },
        exit: {
            opacity: 0,
            x: -10,
            transition: { duration: 0.15 },
        },
    },
};

/**
 * Modern search bar component for Employees page
 * @param {Object} props
 * @param {string} props.searchTerm - Current search term
 * @param {Function} props.onSearchChange - Callback when search changes
 * @param {Function} props.onUpload - Callback for upload action
 * @param {Function} props.onDownload - Callback for download action  
 * @param {Function} props.onAddEmployee - Callback for add employee action
 * @param {boolean} props.canWrite - Whether user can write/edit
 */
function EmployeeSearchBar({
    searchTerm = "",
    onSearchChange,
    onUpload,
    onDownload,
    onAddEmployee,
    canWrite = false,
}) {
    const [query, setQuery] = useState(searchTerm);
    const [isFocused, setIsFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const debouncedQuery = useDebounce(query, 300);

    // Sync with external searchTerm
    useEffect(() => {
        setQuery(searchTerm);
    }, [searchTerm]);

    // Notify parent of debounced search
    useEffect(() => {
        if (onSearchChange) {
            onSearchChange(debouncedQuery);
        }
    }, [debouncedQuery, onSearchChange]);

    // Define available actions
    const actions = useMemo(() => {
        const baseActions = [];

        if (canWrite && onAddEmployee) {
            baseActions.push({
                id: "add",
                label: "Agregar Empleado",
                icon: <UserPlus className="h-4 w-4" style={{ color: 'var(--color-primary, #007aff)' }} />,
                description: "Crear nuevo",
                shortcut: "⌘N",
                onClick: onAddEmployee,
            });
        }

        if (canWrite && onUpload) {
            baseActions.push({
                id: "upload",
                label: "Cargar JSON",
                icon: <Upload className="h-4 w-4" style={{ color: 'var(--color-success, #34c759)' }} />,
                description: "Bulk upload",
                onClick: onUpload,
            });
        }

        if (onDownload) {
            baseActions.push({
                id: "download",
                label: "Descargar Plantilla",
                icon: <Download className="h-4 w-4" style={{ color: 'var(--color-secondary, #5856d6)' }} />,
                description: "JSON template",
                onClick: onDownload,
            });
        }

        return baseActions;
    }, [canWrite, onAddEmployee, onUpload, onDownload]);

    const handleInputChange = useCallback((e) => {
        setQuery(e.target.value);
        setActiveIndex(-1);
    }, []);

    const handleKeyDown = useCallback(
        (e) => {
            if (!isFocused || actions.length === 0) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setActiveIndex((prev) =>
                        prev < actions.length - 1 ? prev + 1 : 0
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setActiveIndex((prev) =>
                        prev > 0 ? prev - 1 : actions.length - 1
                    );
                    break;
                case "Enter":
                    e.preventDefault();
                    if (activeIndex >= 0 && actions[activeIndex]) {
                        actions[activeIndex].onClick?.();
                        setIsFocused(false);
                    }
                    break;
                case "Escape":
                    setIsFocused(false);
                    setActiveIndex(-1);
                    break;
            }
        },
        [actions, activeIndex, isFocused]
    );

    const handleActionClick = useCallback((action) => {
        action.onClick?.();
        setIsFocused(false);
        setActiveIndex(-1);
    }, []);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
        setTimeout(() => {
            setIsFocused(false);
            setActiveIndex(-1);
        }, 200);
    }, []);

    const showActions = isFocused && actions.length > 0;

    return (
        <div className={styles.container}>
            <div className={styles.searchWrapper}>
                <div className={styles.inputContainer}>
                    <div className={styles.iconWrapper}>
                        <AnimatePresence mode="wait">
                            {query.length > 0 ? (
                                <motion.div
                                    key="searching"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <FileJson className={styles.icon} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="search"
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Search className={styles.icon} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, ID, CURP..."
                        value={query}
                        onChange={handleInputChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className={styles.input}
                        role="combobox"
                        aria-expanded={showActions}
                        aria-autocomplete="list"
                        aria-controls="employee-actions"
                        autoComplete="off"
                    />
                </div>

                <AnimatePresence>
                    {showActions && (
                        <motion.div
                            id="employee-actions"
                            className={styles.actionsPanel}
                            variants={ANIMATION_VARIANTS.container}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            role="listbox"
                            aria-label="Acciones rápidas"
                        >
                            <div className={styles.actionsHeader}>
                                <span className={styles.actionsTitle}>Acciones Rápidas</span>
                            </div>
                            <ul className={styles.actionsList}>
                                {actions.map((action, index) => (
                                    <motion.li
                                        key={action.id}
                                        className={`${styles.actionItem} ${activeIndex === index ? styles.actionItemActive : ''
                                            }`}
                                        variants={ANIMATION_VARIANTS.item}
                                        onClick={() => handleActionClick(action)}
                                        role="option"
                                        aria-selected={activeIndex === index}
                                    >
                                        <div className={styles.actionContent}>
                                            <span className={styles.actionIcon}>
                                                {action.icon}
                                            </span>
                                            <div className={styles.actionText}>
                                                <span className={styles.actionLabel}>
                                                    {action.label}
                                                </span>
                                                {action.description && (
                                                    <span className={styles.actionDescription}>
                                                        {action.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {action.shortcut && (
                                            <span className={styles.actionShortcut}>
                                                {action.shortcut}
                                            </span>
                                        )}
                                    </motion.li>
                                ))}
                            </ul>
                            <div className={styles.actionsFooter}>
                                <span className={styles.footerText}>
                                    ↑↓ para navegar • Enter para seleccionar • ESC para cancelar
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default EmployeeSearchBar;
