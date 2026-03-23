'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IconPlus as Plus,
    IconFileText as FileText,
    IconTrash2 as Trash2,
    IconEdit as Edit3,
    IconUpload as Upload,
    IconPlay as Play,
    IconLink as Link2,
    IconSettings as Settings2,
    IconExternalLink as ExternalLink,
    IconMoreHorizontal as MoreHorizontal,
    IconRefreshCw as RefreshCw,
    IconSearch as Search,
    IconX as X,
    IconChevronDown as ChevronDown,
    IconGlobe as Globe,
    IconLock as Lock,
} from '@/lib/icons';
import puestosData from '../../../../../puestos.json';
import styles from './KanbanCoursesView.module.css';

// ── Paleta de colores para el acento de cada tarjeta ──────────────────────────
const ACCENT_PALETTE = [
    '#4f8ef7', // azul
    '#7c6af7', // índigo
    '#e06fbe', // rosa
    '#f77c4f', // naranja
    '#4fc9a4', // verde agua
    '#4fb8f7', // celeste
    '#a3e635', // lima
    '#fb923c', // melocotón
];
const getAccent = (idx) => ACCENT_PALETTE[idx % ACCENT_PALETTE.length];

const NATIVE_EDIT_FORM_EMPTY = {
    contenidoUrl: '',
    candidateView: 'native',
    puestosAplicables: [],
};

// ── Variantes de animación ─────────────────────────────────────────────────────
const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.16 } },
};

const dropdownVariants = {
    hidden: { opacity: 0, scale: 0.92, y: -6 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, scale: 0.94, y: -4, transition: { duration: 0.12 } },
};

// ── Skeleton ───────────────────────────────────────────────────────────────────
function SkeletonCard() {
    return <div className={styles.skeletonCard} aria-hidden="true" />;
}

// ── Chip de estado ─────────────────────────────────────────────────────────────
function StatusChip({ published, onClick }) {
    return (
        <button
            type="button"
            className={`${styles.statusChip} ${published ? styles.chipPublished : styles.chipDraft}`}
            onClick={onClick}
            title={published ? 'Clic para pasar a Borrador' : 'Clic para Publicar'}
        >
            {published ? <Globe size={11} strokeWidth={2.2} /> : <Lock size={11} strokeWidth={2.2} />}
            {published ? 'Publicado' : 'Borrador'}
        </button>
    );
}

// ── Tarjeta de curso ───────────────────────────────────────────────────────────
// openDropdown(id, rect) y closeDropdown() se pasan desde el padre
function CourseCard({
    course,
    index,
    canEdit,
    renamingId,
    renameValue,
    setRenameValue,
    handleStartRename,
    handleConfirmRename,
    handleRenameKeyDown,
    handleTogglePublish,
    handlePlayNative,
    handleDeleteNative,
    onOpenEditNative,
    activeDropdown,   // { id, x, y } | null
    openDropdown,
    closeDropdown,
}) {
    const accent = getAccent(index);
    const isRenaming = renamingId === course.id;
    const isOpen = activeDropdown?.id === course.id;
    const btnRef = useRef(null);

    const handleMenuClick = (e) => {
        e.stopPropagation();
        if (isOpen) { closeDropdown(); return; }
        const rect = btnRef.current?.getBoundingClientRect();
        if (rect) openDropdown(course.id, rect);
    };

    return (
        <motion.div
            className={styles.kCard}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            transition={{ delay: index * 0.035 }}
        >
            {/* Barra de color superior */}
            <div className={styles.kCardAccent} style={{ background: accent }} />

            {/* Cuerpo */}
            <div className={styles.kCardBody}>
                {/* Fila: título + menú */}
                <div className={styles.kCardTop}>
                    <div className={styles.kCardTitleArea}>
                        {isRenaming ? (
                            <input
                                className={styles.renameInput}
                                value={renameValue}
                                autoFocus
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={() => handleConfirmRename(course.id)}
                                onKeyDown={(e) => handleRenameKeyDown(e, course.id)}
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Renombrar curso"
                            />
                        ) : (
                            <h3 className={styles.kCardTitle}>{course.title}</h3>
                        )}
                    </div>

                    {/* Botón ⋯ — el menú se renderiza en el padre con position:fixed */}
                    <button
                        ref={btnRef}
                        type="button"
                        className={`${styles.menuToggle} ${isOpen ? styles.menuToggleActive : ''}`}
                        onClick={handleMenuClick}
                        aria-label="Opciones del curso"
                        aria-haspopup="true"
                        aria-expanded={isOpen}
                    >
                        <MoreHorizontal size={16} />
                    </button>
                </div>

                {/* Puestos */}
                <p className={`${styles.kCardPuestos} ${!course.puestosAplicables?.length ? styles.kCardPuestosWarn : ''}`}>
                    {course.puestosAplicables?.length
                        ? course.puestosAplicables.join(', ')
                        : '⚠ Sin puestos asignados'}
                </p>

                {/* Badge vista URL */}
                {course.candidateView === 'url' && course.contenidoUrl && (
                    <span className={styles.kCardViewBadge}>
                        <ExternalLink size={10} /> URL / PDF
                    </span>
                )}

                {/* Acciones inferiores */}
                <div className={styles.kCardFooter}>
                    <StatusChip
                        published={course.published}
                        onClick={() => handleTogglePublish(course.id, course.published)}
                    />
                    <button
                        type="button"
                        className={styles.playBtn}
                        onClick={() => handlePlayNative(course.id)}
                        title="Reproducir curso"
                    >
                        <Play size={13} strokeWidth={2.2} />
                        Vista previa
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ── Columna Kanban ─────────────────────────────────────────────────────────────
function KanbanColumn({ title, icon, count, loading, searchQuery, accentColor, children }) {
    return (
        <section className={styles.kanbanColumn}>
            <header className={styles.columnHeader} style={{ '--col-accent': accentColor }}>
                <div className={styles.columnHeaderLeft}>
                    {icon}
                    <span className={styles.columnTitle}>{title}</span>
                    <span className={styles.columnBadge}>{count}</span>
                </div>
            </header>

            <div className={styles.columnBody}>
                {loading ? (
                    Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
                ) : count === 0 ? (
                    <div className={styles.emptyState}>
                        <p>{searchQuery ? 'Sin resultados.' : `No hay cursos ${title.toLowerCase()}.`}</p>
                    </div>
                ) : (
                    <>{children}</>
                )}
            </div>
        </section>
    );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function KanbanCoursesView({
    canEdit,
    nativeCourses,
    nativeLoading,
    publishedCourses,
    draftCourses,
    searchQuery,
    setSearchQuery,
    includeDynamics,
    setIncludeDynamics,
    includeQuizzes,
    setIncludeQuizzes,
    importing,
    handleImport,
    creatingCourse,
    handleCreateNewCourse,
    renamingId,
    renameValue,
    setRenameValue,
    handleStartRename,
    handleConfirmRename,
    handleRenameKeyDown,
    handleTogglePublish,
    handlePlayNative,
    handleDeleteNative,
    fileInputRef,
    onUpdateNative,
    updatingNative,
    onSyncAllPuestos,
    syncing,
}) {
    // Dropdown de tarjeta: { id, x, y, course } | null
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('published');

    // Formulario edición
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingNative, setEditingNative] = useState(null);
    const [nativeEditForm, setNativeEditForm] = useState(NATIVE_EDIT_FORM_EMPTY);

    // Cerrar dropdowns al hacer click fuera o scroll
    React.useEffect(() => {
        const close = () => { setActiveDropdown(null); setOptionsOpen(false); };
        window.addEventListener('click', close);
        window.addEventListener('scroll', close, true);
        return () => {
            window.removeEventListener('click', close);
            window.removeEventListener('scroll', close, true);
        };
    }, []);

    // Abrir dropdown con posición fixed
    const openDropdown = (id, rect) => {
        // El menú tiene ~210px de ancho; si se sale de la pantalla por la izquierda, ajustar
        const menuWidth = 210;
        let x = rect.right - menuWidth;
        if (x < 8) x = rect.left;
        const y = rect.bottom + 6;
        setActiveDropdown({ id, x, y });
    };

    const closeDropdown = () => setActiveDropdown(null);

    // ── Buscar course activo para el menú ─────────────────────────────────────
    const activeCourse = activeDropdown
        ? [...publishedCourses, ...draftCourses].find(c => c.id === activeDropdown.id)
        : null;

    // ── Edición de curso nativo ───────────────────────────────────────────────
    const openEditNative = (e, course) => {
        e.stopPropagation();
        closeDropdown();
        setEditingNative(course);
        setNativeEditForm({
            contenidoUrl: course.contenidoUrl || '',
            candidateView: course.candidateView || 'native',
            puestosAplicables: course.puestosAplicables || [],
        });
        setShowEditForm(true);
    };

    const handleEditCancel = () => {
        setShowEditForm(false);
        setEditingNative(null);
        setNativeEditForm(NATIVE_EDIT_FORM_EMPTY);
    };

    const handlePuestoToggle = (puesto) =>
        setNativeEditForm((prev) => ({
            ...prev,
            puestosAplicables: prev.puestosAplicables.includes(puesto)
                ? prev.puestosAplicables.filter((p) => p !== puesto)
                : [...prev.puestosAplicables, puesto],
        }));

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingNative) return;
        const ok = await onUpdateNative(editingNative.id, nativeEditForm);
        if (ok) handleEditCancel();
    };

    // ── Props compartidos para CourseCard ─────────────────────────────────────
    const cardSharedProps = {
        canEdit,
        renamingId,
        renameValue,
        setRenameValue,
        handleStartRename,
        handleConfirmRename,
        handleRenameKeyDown,
        handleTogglePublish,
        handlePlayNative,
        handleDeleteNative,
        onOpenEditNative: openEditNative,
        activeDropdown,
        openDropdown,
        closeDropdown,
    };

    return (
        <div className={styles.wrapper}>

            {/* ── Toolbar ───────────────────────────────────────────────────── */}
            <div className={styles.toolbar}>
                {/* Búsqueda */}
                <div className={styles.searchWrapper}>
                    <Search size={15} className={styles.searchIcon} aria-hidden="true" />
                    <input
                        type="search"
                        placeholder="Buscar cursos…"
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        aria-label="Buscar cursos"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            className={styles.searchClear}
                            onClick={() => setSearchQuery('')}
                            aria-label="Limpiar búsqueda"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Opciones (import, sync) */}
                <div className={styles.menuContainer} style={{ flexShrink: 0 }}>
                    <button
                        type="button"
                        className={`${styles.optionsBtn} ${optionsOpen ? styles.optionsBtnActive : ''}`}
                        onClick={(e) => { e.stopPropagation(); setOptionsOpen((v) => !v); }}
                        aria-haspopup="true"
                        aria-expanded={optionsOpen}
                    >
                        Opciones <ChevronDown size={14} className={optionsOpen ? styles.chevronUp : ''} />
                    </button>

                    <AnimatePresence>
                        {optionsOpen && (
                            <motion.div
                                className={`${styles.menuDropdown} ${styles.menuDropdownLeft}`}
                                variants={dropdownVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                onClick={(e) => e.stopPropagation()}
                                role="menu"
                            >
                                <div className={styles.menuSection}>
                                    <span className={styles.menuSectionLabel}>Al importar JSON incluir:</span>
                                    <label className={styles.menuCheckLabel}>
                                        <input type="checkbox" checked={includeDynamics} onChange={(e) => setIncludeDynamics(e.target.checked)} className={styles.menuCheckbox} />
                                        Dinámicas Grupales
                                    </label>
                                    <label className={styles.menuCheckLabel}>
                                        <input type="checkbox" checked={includeQuizzes} onChange={(e) => setIncludeQuizzes(e.target.checked)} className={styles.menuCheckbox} />
                                        Quizzes Evaluativos
                                    </label>
                                </div>
                                <div className={styles.menuDivider} />
                                <label className={styles.menuItem} role="menuitem">
                                    <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={() => {}} />
                                    <FileText size={13} className={styles.menuItemIcon} /> Cargar JSON
                                </label>
                                <button className={styles.menuItem} role="menuitem" onClick={() => { setOptionsOpen(false); handleImport(); }} disabled={importing}>
                                    <Upload size={13} className={styles.menuItemIcon} />
                                    {importing ? 'Importando…' : 'Importar Archivo JSON'}
                                </button>
                                <div className={styles.menuDivider} />
                                <button className={styles.menuItem} role="menuitem" onClick={() => { setOptionsOpen(false); onSyncAllPuestos(); }} disabled={syncing} style={{ color: 'var(--c-orange)' }}>
                                    <RefreshCw size={13} className={styles.menuItemIcon} />
                                    {syncing ? 'Sincronizando…' : 'Sincronizar Puestos'}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* FAB — Nuevo Curso */}
                <button
                    type="button"
                    className={styles.fab}
                    onClick={handleCreateNewCourse}
                    disabled={creatingCourse}
                    aria-label="Crear nuevo curso"
                >
                    <Plus size={16} strokeWidth={2.5} />
                    <span className={styles.fabLabel}>{creatingCourse ? 'Creando…' : 'Nuevo'}</span>
                </button>
            </div>

            {/* ── Formulario de edición inline ──────────────────────────────── */}
            <AnimatePresence>
                {showEditForm && canEdit && (
                    <motion.div
                        className={styles.editPanel}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.22 }}
                    >
                        <h3 className={styles.editPanelTitle}>
                            Editando: <em>{editingNative?.title}</em>
                        </h3>
                        <form onSubmit={handleEditSubmit} className={styles.editForm}>
                            <div className={styles.editField}>
                                <label className={styles.editLabel}>URL alternativa (PDF / enlace externo)</label>
                                <input
                                    className={styles.editInput}
                                    value={nativeEditForm.contenidoUrl}
                                    onChange={(e) => setNativeEditForm((p) => ({ ...p, contenidoUrl: e.target.value }))}
                                    placeholder="https://drive.google.com/… (opcional)"
                                />
                            </div>
                            <div className={styles.editField}>
                                <label className={styles.editLabel}>¿Qué ve el candidato?</label>
                                <div className={styles.radioGroup}>
                                    <label className={styles.radioLabel}>
                                        <input type="radio" name="candidateView" value="native" checked={nativeEditForm.candidateView === 'native'} onChange={() => setNativeEditForm((p) => ({ ...p, candidateView: 'native' }))} />
                                        Curso interactivo (slides)
                                    </label>
                                    <label className={styles.radioLabel}>
                                        <input type="radio" name="candidateView" value="url" checked={nativeEditForm.candidateView === 'url'} onChange={() => setNativeEditForm((p) => ({ ...p, candidateView: 'url' }))} disabled={!nativeEditForm.contenidoUrl} />
                                        URL / PDF
                                    </label>
                                </div>
                            </div>
                            <div className={styles.editField}>
                                <label className={styles.editLabel}>
                                    Puestos aplicables ({nativeEditForm.puestosAplicables.length})
                                </label>
                                <div className={styles.puestosGrid}>
                                    {puestosData.map((p, idx) => (
                                        <label key={idx} className={styles.puestoLabel}>
                                            <input
                                                type="checkbox"
                                                checked={nativeEditForm.puestosAplicables.includes(p.positions)}
                                                onChange={() => handlePuestoToggle(p.positions)}
                                                className={styles.menuCheckbox}
                                            />
                                            {p.positions}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.editActions}>
                                <button type="submit" className={styles.editSaveBtn} disabled={updatingNative}>
                                    {updatingNative ? 'Guardando…' : 'Guardar cambios'}
                                </button>
                                <button type="button" className={styles.editCancelBtn} onClick={handleEditCancel}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── TabBar — solo móvil ───────────────────────────────────────── */}
            <div className={styles.tabBar} role="tablist" aria-label="Estado de cursos">
                <button
                    role="tab"
                    aria-selected={activeTab === 'published'}
                    className={`${styles.tabItem} ${activeTab === 'published' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('published')}
                >
                    <Globe size={14} /> Publicados
                    <span className={styles.tabBadge}>{publishedCourses.length}</span>
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'draft'}
                    className={`${styles.tabItem} ${activeTab === 'draft' ? styles.tabItemActive : ''}`}
                    onClick={() => setActiveTab('draft')}
                >
                    <Lock size={14} /> Borradores
                    <span className={styles.tabBadge}>{draftCourses.length}</span>
                </button>
            </div>

            {/* ── Tablero Kanban ────────────────────────────────────────────── */}
            <div className={styles.kanbanBoard}>
                <div className={`${styles.kanbanColumnWrapper} ${activeTab === 'draft' ? styles.hiddenOnMobile : ''}`}>
                    <KanbanColumn
                        title="Publicados"
                        icon={<Globe size={15} strokeWidth={2} />}
                        count={publishedCourses.length}
                        loading={nativeLoading}
                        searchQuery={searchQuery}
                        accentColor="#22c55e"
                    >
                        {publishedCourses.map((course, i) => (
                            <CourseCard key={course.id} course={course} index={i} {...cardSharedProps} />
                        ))}
                    </KanbanColumn>
                </div>

                <div className={`${styles.kanbanColumnWrapper} ${activeTab === 'published' ? styles.hiddenOnMobile : ''}`}>
                    <KanbanColumn
                        title="Borradores"
                        icon={<Lock size={15} strokeWidth={2} />}
                        count={draftCourses.length}
                        loading={nativeLoading}
                        searchQuery={searchQuery}
                        accentColor="#94a3b8"
                    >
                        {draftCourses.map((course, i) => (
                            <CourseCard key={course.id} course={course} index={i} {...cardSharedProps} />
                        ))}
                    </KanbanColumn>
                </div>
            </div>

            {/* ── Dropdown de tarjeta con position:fixed ─────────────────────
                Se renderiza aquí (fuera de columnas/tarjetas) para escapar
                de cualquier overflow/clip del layout padre.
            ───────────────────────────────────────────────────────────────── */}
            <AnimatePresence>
                {activeDropdown && activeCourse && (
                    <motion.div
                        className={styles.fixedDropdown}
                        style={{ top: activeDropdown.y, left: activeDropdown.x }}
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                        role="menu"
                        aria-label="Opciones del curso"
                    >
                        <button className={styles.menuItem} role="menuitem" onClick={() => { closeDropdown(); handlePlayNative(activeCourse.id); }}>
                            <Play size={13} className={styles.menuItemIcon} /> Reproducir
                        </button>
                        <button className={styles.menuItem} role="menuitem" onClick={(e) => { closeDropdown(); handleStartRename(e, activeCourse); }}>
                            <Edit3 size={13} className={styles.menuItemIcon} /> Renombrar
                        </button>
                        {canEdit && (
                            <button className={styles.menuItem} role="menuitem" onClick={(e) => openEditNative(e, activeCourse)}>
                                <Link2 size={13} className={styles.menuItemIcon} /> Asignar Puestos / URL
                            </button>
                        )}
                        <Link
                            href={`/induccion/cursos/${activeCourse.id}/editar`}
                            className={styles.menuItem}
                            role="menuitem"
                            onClick={closeDropdown}
                        >
                            <Settings2 size={13} className={styles.menuItemIcon} /> Configurar slides
                        </Link>
                        <div className={styles.menuDivider} />
                        <button className={`${styles.menuItem} ${styles.menuItemDanger}`} role="menuitem" onClick={(e) => { closeDropdown(); handleDeleteNative(e, activeCourse.id); }}>
                            <Trash2 size={13} className={styles.menuItemIcon} /> Eliminar
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
