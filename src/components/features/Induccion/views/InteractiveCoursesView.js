'use client';

import React from 'react';
import Link from 'next/link';
import {
    IconChevronRight as ChevronRight,
    IconPlus as Plus,
    IconFileText as FileText,
    IconTrash2 as Trash2,
    IconEdit as Edit3,
    IconUpload as Upload,
    IconPlay as Play,
    IconZap as Zap,
    IconSettings as Settings2,
    IconFolderOpen as FolderOpen,
    IconMoreHorizontal as MoreHorizontal
} from '@/lib/icons';
import styles from '../../../../app/induccion/page.module.css'; // Usamos los mismos estilos core por ahora

export default function InteractiveCoursesView({
    canEdit,
    activeTab,
    showNativeSection,
    setShowNativeSection,
    nativeCourses,
    nativeLoading,
    filteredNative,
    searchQuery,
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
    fileInputRef
}) {
    const [activeDropdownId, setActiveDropdownId] = React.useState(null);

    // Cerrar el dropdown al hacer clic fuera o scrollear (simplificado)
    React.useEffect(() => {
        const closeMenu = () => setActiveDropdownId(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const toggleDropdown = (e, id) => {
        e.stopPropagation();
        setActiveDropdownId(prev => (prev === id ? null : id));
    };


    if (!canEdit && activeTab !== 'interactivos' && activeTab !== 'all') return null;
    if (activeTab !== 'interactivos' && activeTab !== 'all') return null;

    return (
        <section className={styles.nativeSection}>
            <div className={styles.coursesHeader}>
                <h2
                    className={styles.sectionTitle}
                    onClick={() => setShowNativeSection(!showNativeSection)}
                >
                    <ChevronRight size={16} className={`${styles.chevronIcon} ${showNativeSection ? styles.expanded : ''}`} />
                    <Zap size={14} style={{ color: 'var(--c-orange)', flexShrink: 0 }} />
                    Cursos Interactivos
                    <span className={styles.sectionCount}>{nativeCourses.length}</span>
                </h2>

                <div className={styles.actionMenuContainer}>
                    <button
                        type="button"
                        className={`${styles.actionMenuToggle} ${activeDropdownId === 'nativeActions' ? styles.activeToggle : ''}`}
                        onClick={(e) => toggleDropdown(e, 'nativeActions')}
                        style={{ background: 'var(--c-surface)', border: '1px solid var(--c-line-strong)', padding: '6px 12px', width: 'auto', borderRadius: 'var(--r-md)', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)' }}
                    >
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, marginRight: '4px' }}>Opciones</span>
                        <MoreHorizontal size={16} />
                    </button>

                    {activeDropdownId === 'nativeActions' && (
                        <div className={styles.actionMenuDropdown} onClick={(e) => e.stopPropagation()} style={{ width: '240px', right: 0, left: 'auto', top: 'calc(100% + 8px)' }}>
                            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label title="Incluir dinámicas grupales" className={styles.dropdownCheckboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--c-ink)' }}>
                                    <input type="checkbox" checked={includeDynamics} onChange={(e) => setIncludeDynamics(e.target.checked)} style={{ accentColor: 'var(--c-orange)', width: '14px', height: '14px', margin: 0 }} />
                                    <span>Dinámicas Grupales</span>
                                </label>
                                <label title="Incluir quizzes grupales" className={styles.dropdownCheckboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--c-ink)' }}>
                                    <input type="checkbox" checked={includeQuizzes} onChange={(e) => setIncludeQuizzes(e.target.checked)} style={{ accentColor: 'var(--c-orange)', width: '14px', height: '14px', margin: 0 }} />
                                    <span>Quizzes Evaluativos</span>
                                </label>
                            </div>
                            <div className={styles.actionMenuDivider} />
                            <label className={styles.actionMenuItem}>
                                <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={() => { }} />
                                <FileText size={14} className={styles.actionMenuIcon} />
                                Cargar JSON
                            </label>
                            <button className={styles.actionMenuItem} onClick={() => { setActiveDropdownId(null); handleImport(); }} disabled={importing}>
                                <Upload size={14} className={styles.actionMenuIcon} />
                                {importing ? 'Importando…' : 'Importar Archivo JSON'}
                            </button>
                            <div className={styles.actionMenuDivider} />
                            <button className={styles.actionMenuItem} onClick={() => { setActiveDropdownId(null); handleCreateNewCourse(); }} disabled={creatingCourse} style={{ color: 'var(--c-green)' }}>
                                <Plus size={14} className={styles.actionMenuIcon} />
                                {creatingCourse ? 'Creando...' : 'Crear Nuevo Curso'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showNativeSection && (
                <div className={styles.coursesGrid}>
                    {nativeLoading ? (
                        Array(6).fill(0).map((_, i) => <div key={i} className={`${styles.courseCard} ${styles.skeleton}`} />)
                    ) : filteredNative.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Zap size={48} opacity={0.15} style={{ marginBottom: '10px' }} />
                            <p>{searchQuery ? 'No hay resultados que coincidan con la búsqueda.' : 'No hay cursos interactivos. Importa un JSON para comenzar.'}</p>
                        </div>
                    ) : (
                        filteredNative.map(course => (
                            <div key={course.id} className={styles.courseCard} onClick={() => {
                                if (renamingId !== course.id) {
                                    // Comportamiento por defecto al dar clic en la tarjeta (opcional)
                                    // window.open(`/induccion/cursos/${course.id}/editar`, '_self');
                                }
                            }}>
                                <div className={styles.cardTopColor} style={{ background: '#3b82f6' }} />

                                <div className={styles.cardActionsRow}>
                                    <div className={styles.actionMenuContainer}>
                                        <button
                                            type="button"
                                            className={`${styles.actionMenuToggle} ${activeDropdownId === course.id ? styles.activeToggle : ''}`}
                                            onClick={(e) => toggleDropdown(e, course.id)}
                                            aria-label="Opciones del curso"
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>

                                        {activeDropdownId === course.id && (
                                            <div className={styles.actionMenuDropdown} onClick={(e) => e.stopPropagation()}>
                                                <button className={styles.actionMenuItem} onClick={() => { setActiveDropdownId(null); handlePlayNative(course.id); }}>
                                                    <Play size={14} className={styles.actionMenuIcon} />
                                                    Reproducir
                                                </button>
                                                <button className={styles.actionMenuItem} onClick={() => { setActiveDropdownId(null); handleTogglePublish(course.id, course.published); }}>
                                                    <span className={styles.actionMenuIcon}>{course.published ? '🔒' : '📗'}</span>
                                                    {course.published ? 'Borrador' : 'Publicar'}
                                                </button>
                                                <button className={styles.actionMenuItem} onClick={(e) => { setActiveDropdownId(null); handleStartRename(e, course); }}>
                                                    <Edit3 size={14} className={styles.actionMenuIcon} />
                                                    Renombrar
                                                </button>
                                                <Link href={`/induccion/cursos/${course.id}/editar`} className={styles.actionMenuItem} onClick={() => setActiveDropdownId(null)}>
                                                    <Settings2 size={14} className={styles.actionMenuIcon} />
                                                    Configurar slides
                                                </Link>
                                                <div className={styles.actionMenuDivider} />
                                                <button className={`${styles.actionMenuItem} ${styles.danger}`} onClick={(e) => { setActiveDropdownId(null); handleDeleteNative(e, course.id); }}>
                                                    <Trash2 size={14} className={styles.actionMenuIcon} />
                                                    Eliminar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.cardContent}>
                                    {renamingId === course.id ? (
                                        <input
                                            className={styles.renameInput}
                                            value={renameValue}
                                            autoFocus
                                            onChange={e => setRenameValue(e.target.value)}
                                            onBlur={() => handleConfirmRename(course.id)}
                                            onKeyDown={e => handleRenameKeyDown(e, course.id)}
                                            onClick={e => e.stopPropagation()}
                                        />
                                    ) : (
                                        <h3 className={styles.courseTitle}>{course.title}</h3>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </section>
    );
}
