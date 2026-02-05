"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
// Ajuste de ruta: Input esta en components/ui/Input/Input
import Input from "@/components/ui/Input/Input";
import { motion, AnimatePresence } from "framer-motion"; // Usando framer-motion que es estandar
import {
    Search,
    Send,
    BarChart2,
    Video,
    PlaneTakeoff,
    AudioLines,
    LayoutGrid,
} from "lucide-react";
// Ajuste de ruta y nombre: useDebounce esta en hooks/useDebounce
import useDebounce from "@/hooks/useDebounce";

const ANIMATION_VARIANTS = {
    container: {
        hidden: { opacity: 0, height: 0 },
        show: {
            opacity: 1,
            height: "auto",
            transition: {
                height: { duration: 0.4 },
                staggerChildren: 0.1,
            },
        },
        exit: {
            opacity: 0,
            height: 0,
            transition: {
                height: { duration: 0.3 },
                opacity: { duration: 0.2 },
            },
        },
    },
    item: {
        hidden: { opacity: 0, y: 20 },
        show: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 },
        },
        exit: {
            opacity: 0,
            y: -10,
            transition: { duration: 0.2 },
        },
    },
};

// Acciones de ejemplo (si no se pasan props)
const allActionsSample = [
    {
        id: "1",
        label: "Filtrar por Área",
        icon: <LayoutGrid className="h-4 w-4 text-blue-500" />,
        description: "Dashboard",
        short: "⌘K",
    },
    {
        id: "2",
        label: "Nuevo Empleado",
        icon: <BarChart2 className="h-4 w-4 text-orange-500" />,
        description: "Acción",
        short: "⌘N",
    }
];

function ActionSearchBar({
    actions = allActionsSample,
    defaultOpen = false,
    onSearch, // Prop para comunicar la búsqueda al padre
    placeholder = "Buscar..."
}) {
    const [query, setQuery] = useState("");
    const [result, setResult] = useState(null);
    const [isFocused, setIsFocused] = useState(defaultOpen);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const [activeIndex, setActiveIndex] = useState(-1);

    // Usamos el hook useDebounce existente
    const debouncedQuery = useDebounce(query, 200);

    // Efecto para propagar el cambio de búsqueda al padre
    useEffect(() => {
        if (onSearch) {
            onSearch(debouncedQuery);
        }
    }, [debouncedQuery, onSearch]);

    const filteredActions = useMemo(() => {
        if (!debouncedQuery) return actions;

        const normalizedQuery = debouncedQuery.toLowerCase().trim();
        return actions.filter((action) => {
            const searchableText =
                `${action.label} ${action.description || ""}`.toLowerCase();
            return searchableText.includes(normalizedQuery);
        });
    }, [debouncedQuery, actions]);

    useEffect(() => {
        if (!isFocused) {
            setResult(null);
            setActiveIndex(-1);
            return;
        }

        setResult({ actions: filteredActions });
        setActiveIndex(-1);
    }, [filteredActions, isFocused]);

    const handleInputChange = useCallback(
        (e) => {
            setQuery(e.target.value);
            setIsTyping(true);
            setActiveIndex(-1);
        },
        []
    );

    const handleKeyDown = useCallback(
        (e) => {
            if (!result?.actions.length) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setActiveIndex((prev) =>
                        prev < result.actions.length - 1 ? prev + 1 : 0
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setActiveIndex((prev) =>
                        prev > 0 ? prev - 1 : result.actions.length - 1
                    );
                    break;
                case "Enter":
                    e.preventDefault();
                    if (activeIndex >= 0 && result.actions[activeIndex]) {
                        setSelectedAction(result.actions[activeIndex]);
                        handleActionClick(result.actions[activeIndex]);
                    }
                    break;
                case "Escape":
                    setIsFocused(false);
                    setActiveIndex(-1);
                    break;
            }
        },
        [result?.actions, activeIndex]
    );

    const handleActionClick = useCallback((action) => {
        setSelectedAction(action);
        // Aquí podrías disparar la acción si fuera un comando real
        console.log("Acción seleccionada:", action);
    }, []);

    const handleFocus = useCallback(() => {
        setSelectedAction(null);
        setIsFocused(true);
        setActiveIndex(-1);
    }, []);

    const handleBlur = useCallback(() => {
        setTimeout(() => {
            setIsFocused(false);
            setActiveIndex(-1);
        }, 200);
    }, []);

    return (
        <div className="w-full max-w-xl mx-auto" style={{ width: '100%', maxWidth: '600px' }}>
            <div className="relative flex flex-col justify-start items-center" style={{ minHeight: 'auto' }}>
                <div className="w-full max-w-sm sticky top-0 bg-background z-10 pt-4 pb-1" style={{ width: '100%', maxWidth: '100%' }}>

                    <div className="relative">
                        <Input
                            type="text"
                            placeholder={placeholder}
                            value={query}
                            onChange={handleInputChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            role="combobox"
                            aria-expanded={isFocused && !!result}
                            aria-autocomplete="list"
                            aria-activedescendant={
                                activeIndex >= 0
                                    ? `action-${result?.actions[activeIndex]?.id}`
                                    : undefined
                            }
                            id="search"
                            autoComplete="off"
                            // Estilos inline para asegurar compatibilidad si Tailwind no está full configurado en este archivo
                            style={{
                                paddingLeft: '3rem',
                                paddingRight: '2.5rem',
                                height: '3rem',
                                borderRadius: '12px',
                                width: '100%',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-primary)'
                            }}
                        />
                        <div className="absolute top-1/2 -translate-y-1/2 h-4 w-4" style={{ left: '1rem', top: '50%', transform: 'translateY(-50%)' }}>
                            <AnimatePresence mode="popLayout">
                                {query.length > 0 ? (
                                    <motion.div
                                        key="send"
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 20, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Search className="w-4 h-4 text-gray-400" size={18} style={{ color: 'var(--text-secondary)' }} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="search"
                                        initial={{ y: -20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 20, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Search className="w-4 h-4 text-gray-400" size={18} style={{ color: 'var(--text-secondary)' }} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Dropdown de resultados (opcional si solo se usa como buscador) */}
                <div className="w-full max-w-sm" style={{ width: '100%', position: 'absolute', top: '100%', left: 0, zIndex: 50 }}>
                    <AnimatePresence>
                        {isFocused && result && query.length > 0 && (
                            <motion.div
                                className="w-full border rounded-md shadow-xs overflow-hidden dark:border-gray-800 bg-white dark:bg-black mt-1"
                                style={{
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    marginTop: '0.5rem',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                                }}
                                variants={ANIMATION_VARIANTS.container}
                                role="listbox"
                                aria-label="Search results"
                                initial="hidden"
                                animate="show"
                                exit="exit"
                            >
                                {/* Por ahora solo mostramos si hay acciones explicitas que coincidan, 
                                    pero para este caso de uso quizas queramos quitar esto si interfiere con la lista principal 
                                    o mostrar "Presiona Enter para buscar..." 
                                */}
                                {result.actions.length > 0 && (
                                    <motion.ul role="none" style={{ padding: '0.5rem', listStyle: 'none', margin: 0 }}>
                                        {result.actions.map((action, index) => (
                                            <motion.li
                                                key={action.id}
                                                id={`action-${action.id}`}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    cursor: 'pointer',
                                                    borderRadius: '8px',
                                                    background: activeIndex === index ? 'var(--bg-tertiary)' : 'transparent',
                                                    color: 'var(--text-primary)'
                                                }}
                                                variants={ANIMATION_VARIANTS.item}
                                                layout
                                                onClick={() => handleActionClick(action)}
                                                onMouseEnter={() => setActiveIndex(index)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{ color: 'var(--text-secondary)' }}>
                                                        {action.icon}
                                                    </span>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                                        {action.label}
                                                    </span>
                                                </div>
                                            </motion.li>
                                        ))}
                                    </motion.ul>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default ActionSearchBar;
