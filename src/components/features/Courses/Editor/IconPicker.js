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
    // Nuevos
    AiOutlineFileText, AiOutlineFolder, AiOutlineCloud, AiOutlineCamera,
    AiOutlineVideoCamera, AiOutlineSound, AiOutlinePlayCircle,
    AiOutlineDownload, AiOutlineUpload, AiOutlineShareAlt,
    AiOutlineEdit, AiOutlineDelete, AiOutlinePlus, AiOutlineMinus,
    AiOutlineCheckSquare, AiOutlineInfoCircle, AiOutlineWarning,
    AiOutlineLoading, AiOutlineHome, AiOutlineAppstore,
    AiOutlineLayout, AiOutlineDashboard, AiOutlineColumnWidth,
    AiOutlineBars, AiOutlineTable, AiOutlineUnorderedList,
    AiOutlineOrderedList, AiOutlineLogin, AiOutlineLogout,
    AiOutlineSetting, AiOutlineControl, AiOutlineTag,
    AiOutlineIdcard, AiOutlineKey, AiOutlinePrinter,
    AiOutlineMonitor, AiOutlineMobile, AiOutlineTablet,
    AiOutlineDatabase, AiOutlineApi, AiOutlineCode,
    AiOutlineBug, AiOutlineExperiment, AiOutlineFormatPainter,
    AiOutlineGift, AiOutlineCoffee, AiOutlineMedicineBox,
    AiOutlineBank, AiOutlineBuild, AiOutlineApartment,
    AiOutlineShopping, AiOutlineShoppingCart, AiOutlineCreditCard,
    AiOutlineReconciliation, AiOutlineFileDone, AiOutlineFileSearch,
    AiOutlineContacts, AiOutlineSchedule,
    AiOutlineBoxPlot, AiOutlinePieChart, AiOutlineAreaChart,
    AiOutlineFundProjectionScreen,
    AiOutlineUserAdd, AiOutlineUserSwitch,
    AiOutlineDisconnect, AiOutlineInbox,
    AiOutlineSend,
} from 'react-icons/ai';
import styles from './IconPicker.module.css';

/**
 * Catálogo completo de íconos disponibles para slides de tipo icon_grid.
 * Agrupados por categoría para facilitar la búsqueda.
 * El campo `name` es el que se guarda en Firestore — DEBE coincidir con ICON_MAP de IconGridSlide.
 */
export const ICON_CATALOG = [
    // ── Personas / Equipo ──
    { name: 'User', label: 'Persona', Icon: AiOutlineUser },
    { name: 'Team', label: 'Equipo', Icon: AiOutlineTeam },
    { name: 'UserAdd', label: 'Nuevo usuario', Icon: AiOutlineUserAdd },
    { name: 'UserSwitch', label: 'Cambio rol', Icon: AiOutlineUserSwitch },
    { name: 'Contacts', label: 'Contactos', Icon: AiOutlineContacts },
    { name: 'Idcard', label: 'Credencial', Icon: AiOutlineIdcard },
    { name: 'Crown', label: 'Liderazgo', Icon: AiOutlineCrown },

    // ── Comunicación ──
    { name: 'Message', label: 'Mensaje', Icon: AiOutlineMessage },
    { name: 'Comment', label: 'Comentario', Icon: AiOutlineComment },
    { name: 'Mail', label: 'Correo', Icon: AiOutlineMail },
    { name: 'Bell', label: 'Notificación', Icon: AiOutlineBell },
    { name: 'Phone', label: 'Teléfono', Icon: AiOutlinePhone },
    { name: 'Send', label: 'Enviar', Icon: AiOutlineSend },
    { name: 'Share', label: 'Compartir', Icon: AiOutlineShareAlt },
    { name: 'Inbox', label: 'Bandeja', Icon: AiOutlineInbox },
    { name: 'Wifi', label: 'Conexión', Icon: AiOutlineWifi },

    // ── Logros / Motivación ──
    { name: 'Star', label: 'Estrella', Icon: AiOutlineStar },
    { name: 'Trophy', label: 'Trofeo', Icon: AiOutlineTrophy },
    { name: 'Fire', label: 'Pasión', Icon: AiOutlineFire },
    { name: 'Rocket', label: 'Lanzamiento', Icon: AiOutlineRocket },
    { name: 'Heart', label: 'Corazón', Icon: AiOutlineHeart },
    { name: 'Like', label: 'Me gusta', Icon: AiOutlineLike },
    { name: 'Gift', label: 'Regalo', Icon: AiOutlineGift },
    { name: 'Flag', label: 'Meta', Icon: AiOutlineFlag },
    { name: 'Smile', label: 'Bienestar', Icon: AiOutlineSmile },

    // ── Aprendizaje / Conocimiento ──
    { name: 'Bulb', label: 'Idea', Icon: AiOutlineBulb },
    { name: 'Book', label: 'Libro', Icon: AiOutlineBook },
    { name: 'Experiment', label: 'Experimento', Icon: AiOutlineExperiment },
    { name: 'Eye', label: 'Observar', Icon: AiOutlineEye },
    { name: 'Search', label: 'Buscar', Icon: AiOutlineSearch },
    { name: 'FileSearch', label: 'Buscar doc.', Icon: AiOutlineFileSearch },
    { name: 'Clipboard', label: 'Portapapeles', Icon: AiOutlineFileDone },
    { name: 'FileDone', label: 'Completado', Icon: AiOutlineFileDone },
    { name: 'Schedule', label: 'Agenda', Icon: AiOutlineSchedule },

    // ── Objetivos / Productividad ──
    { name: 'Aim', label: 'Objetivo', Icon: AiOutlineAim },
    { name: 'Thunderbolt', label: 'Impulso', Icon: AiOutlineThunderbolt },
    { name: 'Rise', label: 'Crecimiento', Icon: AiOutlineRise },
    { name: 'CheckCircle', label: 'Completado', Icon: AiOutlineCheckCircle },
    { name: 'CheckSquare', label: 'Verificado', Icon: AiOutlineCheckSquare },
    { name: 'Clock', label: 'Tiempo', Icon: AiOutlineClockCircle },
    { name: 'Calendar', label: 'Calendario', Icon: AiOutlineCalendar },
    { name: 'FundScreen', label: 'Presentación', Icon: AiOutlineFundProjectionScreen },

    // ── Seguridad / Salud ──
    { name: 'Safety', label: 'Seguridad', Icon: AiOutlineSafety },
    { name: 'Lock', label: 'Contraseña', Icon: AiOutlineLock },
    { name: 'Key', label: 'Acceso', Icon: AiOutlineKey },
    { name: 'Medicine', label: 'Salud', Icon: AiOutlineMedicineBox },
    { name: 'Warning', label: 'Advertencia', Icon: AiOutlineWarning },
    { name: 'Info', label: 'Información', Icon: AiOutlineInfoCircle },
    { name: 'Bug', label: 'Error/Bug', Icon: AiOutlineBug },
    { name: 'Disconnect', label: 'Sin conexión', Icon: AiOutlineDisconnect },

    // ── Tecnología / Sistemas ──
    { name: 'Monitor', label: 'Pantalla', Icon: AiOutlineMonitor },
    { name: 'Mobile', label: 'Móvil', Icon: AiOutlineMobile },
    { name: 'Tablet', label: 'Tablet', Icon: AiOutlineTablet },
    { name: 'Database', label: 'Base de datos', Icon: AiOutlineDatabase },
    { name: 'Api', label: 'API', Icon: AiOutlineApi },
    { name: 'Code', label: 'Código', Icon: AiOutlineCode },
    { name: 'Cloud', label: 'Nube', Icon: AiOutlineCloud },
    { name: 'Upload', label: 'Subir', Icon: AiOutlineUpload },
    { name: 'Download', label: 'Descargar', Icon: AiOutlineDownload },
    { name: 'Printer', label: 'Imprimir', Icon: AiOutlinePrinter },

    // ── Negocio / Operaciones ──
    { name: 'Tool', label: 'Herramienta', Icon: AiOutlineTool },
    { name: 'Build', label: 'Construcción', Icon: AiOutlineBuild },
    { name: 'Bank', label: 'Finanzas', Icon: AiOutlineBank },
    { name: 'Shopping', label: 'Compra', Icon: AiOutlineShopping },
    { name: 'Cart', label: 'Carrito', Icon: AiOutlineShoppingCart },
    { name: 'CreditCard', label: 'Pago', Icon: AiOutlineCreditCard },
    { name: 'Reconciliation', label: 'Registro', Icon: AiOutlineReconciliation },
    { name: 'Setting', label: 'Configuración', Icon: AiOutlineSetting },
    { name: 'Control', label: 'Control', Icon: AiOutlineControl },
    { name: 'Apartment', label: 'Empresa', Icon: AiOutlineApartment },
    { name: 'Location', label: 'Ubicación', Icon: AiOutlineEnvironment },
    { name: 'Global', label: 'Global', Icon: AiOutlineGlobal },

    // ── Datos / Análisis ──
    { name: 'BarChart', label: 'Barras', Icon: AiOutlineBarChart },
    { name: 'LineChart', label: 'Tendencia', Icon: AiOutlineLineChart },
    { name: 'PieChart', label: 'Pastel', Icon: AiOutlinePieChart },
    { name: 'AreaChart', label: 'Área', Icon: AiOutlineAreaChart },
    { name: 'BoxPlot', label: 'Distribución', Icon: AiOutlineBoxPlot },

    // ── Archivos / Contenido ──
    { name: 'FileText', label: 'Documento', Icon: AiOutlineFileText },
    { name: 'Folder', label: 'Carpeta', Icon: AiOutlineFolder },
    { name: 'Tag', label: 'Etiqueta', Icon: AiOutlineTag },

    // ── Multimedia ──
    { name: 'Camera', label: 'Foto', Icon: AiOutlineCamera },
    { name: 'Video', label: 'Video', Icon: AiOutlineVideoCamera },
    { name: 'Sound', label: 'Audio', Icon: AiOutlineSound },
    { name: 'Play', label: 'Reproducir', Icon: AiOutlinePlayCircle },

    // ── UI / Navegación ──
    { name: 'Home', label: 'Inicio', Icon: AiOutlineHome },
    { name: 'Dashboard', label: 'Tablero', Icon: AiOutlineDashboard },
    { name: 'Appstore', label: 'Aplicaciones', Icon: AiOutlineAppstore },
    { name: 'Layout', label: 'Diseño', Icon: AiOutlineLayout },
    { name: 'List', label: 'Lista', Icon: AiOutlineBars },
    { name: 'Edit', label: 'Editar', Icon: AiOutlineEdit },
    { name: 'FormatPainter', label: 'Formato', Icon: AiOutlineFormatPainter },
    { name: 'Login', label: 'Ingreso', Icon: AiOutlineLogin },
    { name: 'Logout', label: 'Salida', Icon: AiOutlineLogout },
    { name: 'Coffee', label: 'Descanso', Icon: AiOutlineCoffee },
    { name: 'Dislike', label: 'No válido', Icon: AiOutlineDislike },
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

                    {/* Contador */}
                    <div style={{ padding: '0 10px 6px', fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                        {filtered.length} ícono{filtered.length !== 1 ? 's' : ''}
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
