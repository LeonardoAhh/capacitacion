'use client';

import { useState, useMemo } from 'react';
import {
    AiOutlineEye, AiOutlineSearch, AiOutlineMessage, AiOutlineStar,
    AiOutlineCheckCircle, AiOutlineBulb, AiOutlineTrophy, AiOutlineThunderbolt,
    AiOutlineUser, AiOutlineTeam, AiOutlineSafety, AiOutlineRise,
    AiOutlineGlobal, AiOutlineHeart, AiOutlineBook, AiOutlineTool,
    AiOutlineCalendar, AiOutlineBell, AiOutlineLock, AiOutlineSmile,
    AiOutlineFlag, AiOutlineCrown, AiOutlineRocket, AiOutlineFire,
    AiOutlineAim, AiOutlineClockCircle, AiOutlineComment, AiOutlineLike,
    AiOutlineDislike, AiOutlineBarChart, AiOutlineLineChart,
    AiOutlineWifi, AiOutlineMail, AiOutlinePhone, AiOutlineEnvironment,
} from 'react-icons/ai';
import styles from './IconPicker.module.css';

/** Catálogo de íconos disponibles para slides de tipo icon_grid */
const ICON_CATALOG = [
    { name: 'Eye', label: 'Ojo', Icon: AiOutlineEye },
    { name: 'Search', label: 'Búsqueda', Icon: AiOutlineSearch },
    { name: 'Message', label: 'Mensaje', Icon: AiOutlineMessage },
    { name: 'Star', label: 'Estrella', Icon: AiOutlineStar },
    { name: 'CheckCircle', label: 'Check', Icon: AiOutlineCheckCircle },
    { name: 'Bulb', label: 'Idea', Icon: AiOutlineBulb },
    { name: 'Trophy', label: 'Trofeo', Icon: AiOutlineTrophy },
    { name: 'Thunderbolt', label: 'Impulso', Icon: AiOutlineThunderbolt },
    { name: 'User', label: 'Persona', Icon: AiOutlineUser },
    { name: 'Team', label: 'Equipo', Icon: AiOutlineTeam },
    { name: 'Safety', label: 'Escudo', Icon: AiOutlineSafety },
    { name: 'Rise', label: 'Crecimiento', Icon: AiOutlineRise },
    { name: 'Global', label: 'Global', Icon: AiOutlineGlobal },
    { name: 'Heart', label: 'Corazón', Icon: AiOutlineHeart },
    { name: 'Book', label: 'Libro', Icon: AiOutlineBook },
    { name: 'Tool', label: 'Herramienta', Icon: AiOutlineTool },
    { name: 'Calendar', label: 'Calendario', Icon: AiOutlineCalendar },
    { name: 'Bell', label: 'Alerta', Icon: AiOutlineBell },
    { name: 'Lock', label: 'Seguridad', Icon: AiOutlineLock },
    { name: 'Smile', label: 'Felicidad', Icon: AiOutlineSmile },
    { name: 'Flag', label: 'Meta', Icon: AiOutlineFlag },
    { name: 'Crown', label: 'Liderazgo', Icon: AiOutlineCrown },
    { name: 'Rocket', label: 'Lanzamiento', Icon: AiOutlineRocket },
    { name: 'Fire', label: 'Pasión', Icon: AiOutlineFire },
    { name: 'Aim', label: 'Objetivo', Icon: AiOutlineAim },
    { name: 'Clock', label: 'Tiempo', Icon: AiOutlineClockCircle },
    { name: 'Comment', label: 'Opinión', Icon: AiOutlineComment },
    { name: 'Like', label: 'Me gusta', Icon: AiOutlineLike },
    { name: 'Dislike', label: 'No gusta', Icon: AiOutlineDislike },
    { name: 'ThumbsUp', label: 'Aprobado', Icon: AiOutlineLike },
    { name: 'BarChart', label: 'Estadísticas', Icon: AiOutlineBarChart },
    { name: 'LineChart', label: 'Tendencia', Icon: AiOutlineLineChart },
    { name: 'Wifi', label: 'Conexión', Icon: AiOutlineWifi },
    { name: 'Mail', label: 'Correo', Icon: AiOutlineMail },
    { name: 'Phone', label: 'Teléfono', Icon: AiOutlinePhone },
    { name: 'Location', label: 'Ubicación', Icon: AiOutlineEnvironment },
];

/**
 * IconPicker — Selector visual de íconos para slides de tipo icon_grid
 *
 * @param {Object}   props
 * @param {string}   props.value      - Nombre del ícono actualmente seleccionado
 * @param {Function} props.onChange   - Callback (iconName: string) => void
 */
export default function IconPicker({ value, onChange }) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);

    const filtered = useMemo(() => {
        if (!search.trim()) return ICON_CATALOG;
        const q = search.toLowerCase();
        return ICON_CATALOG.filter(i =>
            i.name.toLowerCase().includes(q) ||
            i.label.toLowerCase().includes(q)
        );
    }, [search]);

    const selected = ICON_CATALOG.find(i => i.name === value);
    const SelectedIcon = selected?.Icon;

    const handleSelect = (name) => {
        onChange(name);
        setOpen(false);
        setSearch('');
    };

    return (
        <div className={styles.wrapper}>
            {/* Trigger — muestra el ícono actual */}
            <button
                type="button"
                className={styles.trigger}
                onClick={() => setOpen(v => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                {SelectedIcon ? (
                    <span className={styles.triggerIcon} aria-hidden="true">
                        <SelectedIcon size={18} />
                    </span>
                ) : (
                    <span className={styles.triggerPlaceholder} aria-hidden="true">⬜</span>
                )}
                <span className={styles.triggerLabel}>
                    {selected?.label || 'Elegir ícono'}
                </span>
                <span className={`${styles.caret} ${open ? styles.caretOpen : ''}`}>▾</span>
            </button>

            {/* Dropdown */}
            {open && (
                <div className={styles.dropdown} role="listbox" aria-label="Seleccionar ícono">
                    {/* Búsqueda */}
                    <div className={styles.searchWrap}>
                        <AiOutlineSearch size={14} className={styles.searchIcon} aria-hidden="true" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar ícono..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className={styles.searchInput}
                            aria-label="Buscar ícono"
                        />
                    </div>

                    {/* Grid de íconos */}
                    <div className={styles.grid} role="listbox">
                        {filtered.length === 0 && (
                            <p className={styles.empty}>Sin resultados para &quot;{search}&quot;</p>
                        )}
                        {filtered.map(({ name, label, Icon }) => (
                            <button
                                key={name}
                                type="button"
                                role="option"
                                aria-selected={value === name}
                                className={`${styles.iconBtn} ${value === name ? styles.iconBtnActive : ''}`}
                                onClick={() => handleSelect(name)}
                                title={label}
                            >
                                <Icon size={20} aria-hidden="true" />
                                <span className={styles.iconBtnLabel}>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Overlay para cerrar al hacer click afuera */}
            {open && (
                <div
                    className={styles.overlay}
                    onClick={() => { setOpen(false); setSearch(''); }}
                    aria-hidden="true"
                />
            )}
        </div>
    );
}

/** Exportar el catálogo para usarlo externamente (ej. en IconGridSlide) */
export { ICON_CATALOG };
