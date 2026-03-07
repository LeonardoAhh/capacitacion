'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import {
    IconChevronRight as ChevronRight,
    IconPlus as Plus,
    IconFileText as FileText,
    IconTrash2 as Trash2,
    IconEdit as Edit3,
    IconUpload as Upload,
    IconPlay as Play,
    IconLink as Link2,
    IconZap as Zap,
    IconSettings as Settings2,
    IconExternalLink as ExternalLink,
    IconMoreHorizontal as MoreHorizontal,
    IconRefreshCw as RefreshCw,
} from '@/lib/icons';
import puestosData from '../../../../../puestos.json';
import styles from '../../../../app/induccion/page.module.css';

const LINK_FORM_EMPTY = {
    title: '',
    contenidoUrl: '',
    puestosAplicables: [],
    duracionEstimada: 30,
    orden: 1,
};

const NATIVE_EDIT_FORM_EMPTY = {
    contenidoUrl: '',
    candidateView: 'native', // 'native' | 'url'
    puestosAplicables: [],
};

export default function InteractiveCoursesView({
    canEdit,
    // Cursos interactivos (nativos)
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
    fileInputRef,
    // Cursos URL / PDF
    linkCourses,
    filteredLink,
    uploadingLink,
    onCreateLink,
    onUpdateLink,
    onDeleteLink,
    onToggleLinkActive,
    // Edición de curso nativo
    onUpdateNative,
    updatingNative,
    // Sincronización masiva
    onSyncAllPuestos,
    syncing,
}) {
    const [activeDropdownId, setActiveDropdownId] = useState(null);
    const [showNativeSection, setShowNativeSection] = useState(true);
    const [showLinkSection, setShowLinkSection] = useState(true);
    const [showLinkForm, setShowLinkForm] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [linkForm, setLinkForm] = useState(LINK_FORM_EMPTY);
    const [showNativeEditForm, setShowNativeEditForm] = useState(false);
    const [editingNative, setEditingNative] = useState(null);
    const [nativeEditForm, setNativeEditForm] = useState(NATIVE_EDIT_FORM_EMPTY);

    React.useEffect(() => {
        const close = () => setActiveDropdownId(null);
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, []);

    const toggleDropdown = (e, id) => {
        e.stopPropagation();
        setActiveDropdownId(prev => (prev === id ? null : id));
    };

    // ── Native edit helpers ──
    const openEditNative = (e, course) => {
        e.stopPropagation();
        setEditingNative(course);
        setNativeEditForm({
            contenidoUrl: course.contenidoUrl || '',
            candidateView: course.candidateView || 'native',
            puestosAplicables: course.puestosAplicables || [],
        });
        setShowNativeEditForm(true);
    };

    const handleNativeEditCancel = () => {
        setShowNativeEditForm(false);
        setEditingNative(null);
        setNativeEditForm(NATIVE_EDIT_FORM_EMPTY);
    };

    const handleNativePuestoToggle = (puesto) =>
        setNativeEditForm(prev => ({
            ...prev,
            puestosAplicables: prev.puestosAplicables.includes(puesto)
                ? prev.puestosAplicables.filter(p => p !== puesto)
                : [...prev.puestosAplicables, puesto],
        }));

    const handleNativeEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingNative) return;
        const ok = await onUpdateNative(editingNative.id, nativeEditForm);
        if (ok) handleNativeEditCancel();
    };

    // ── Link form helpers ──
    const handleLinkFormChange = (field, value) =>
        setLinkForm(prev => ({ ...prev, [field]: value }));

    const handlePuestoToggle = (puesto) =>
        setLinkForm(prev => ({
            ...prev,
            puestosAplicables: prev.puestosAplicables.includes(puesto)
                ? prev.puestosAplicables.filter(p => p !== puesto)
                : [...prev.puestosAplicables, puesto],
        }));

    const openCreateLink = () => {
        setEditingLink(null);
        setLinkForm({ ...LINK_FORM_EMPTY, orden: linkCourses.length + 1 });
        setShowLinkForm(true);
    };

    const openEditLink = (e, course) => {
        e.stopPropagation();
        setEditingLink(course);
        setLinkForm({
            title: course.title || '',
            contenidoUrl: course.contenidoUrl || '',
            puestosAplicables: course.puestosAplicables || [],
            duracionEstimada: course.duracionEstimada || 30,
            orden: course.orden || 1,
        });
        setShowLinkForm(true);
    };

    const handleLinkCancel = () => {
        setShowLinkForm(false);
        setEditingLink(null);
        setLinkForm(LINK_FORM_EMPTY);
    };

    const handleLinkSubmit = async (e) => {
        e.preventDefault();
        const ok = editingLink
            ? await onUpdateLink(editingLink.id, linkForm)
            : await onCreateLink(linkForm);
        if (ok) handleLinkCancel();
    };

    return (
        <>
            {/* ══════════════════════════════════════════
                SECCIÓN 1 — CURSOS INTERACTIVOS (nativos)
                ══════════════════════════════════════════ */}
            <section className={styles.nativeSection}>
                <div className={styles.coursesHeader}>
                    <h2
                        className={styles.sectionTitle}
                        onClick={() => setShowNativeSection(v => !v)}
                    >
                        <ChevronRight
                            size={16}
                            className={`${styles.chevronIcon} ${showNativeSection ? styles.expanded : ''}`}
                        />
                        <Zap size={14} style={{ color: 'var(--c-orange)', flexShrink: 0 }} />
                        Cursos Interactivos
                        <span className={styles.sectionCount}>{nativeCourses.length}</span>
                    </h2>

                    <div className={styles.actionMenuContainer}>
                        <button
                            type="button"
                            className={`${styles.actionMenuToggle} ${activeDropdownId === 'nativeActions' ? styles.activeToggle : ''}`}
                            onClick={(e) => toggleDropdown(e, 'nativeActions')}
                            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-line-strong)', padding: '6px 12px', width: 'auto', borderRadius: 'var(--r-md)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
                        >
                            <span style={{ fontSize: '0.8rem', fontWeight: 500, marginRight: '4px' }}>Opciones</span>
                            <MoreHorizontal size={16} />
                        </button>

                        {activeDropdownId === 'nativeActions' && (
                            <div className={styles.actionMenuDropdown} onClick={e => e.stopPropagation()} style={{ width: '240px', right: 0, left: 'auto', top: 'calc(100% + 8px)' }}>
                                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label className={styles.dropdownCheckboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--c-ink)' }}>
                                        <input type="checkbox" checked={includeDynamics} onChange={e => setIncludeDynamics(e.target.checked)} style={{ accentColor: 'var(--c-orange)', width: '14px', height: '14px', margin: 0 }} />
                                        <span>Dinámicas Grupales</span>
                                    </label>
                                    <label className={styles.dropdownCheckboxLabel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--c-ink)' }}>
                                        <input type="checkbox" checked={includeQuizzes} onChange={e => setIncludeQuizzes(e.target.checked)} style={{ accentColor: 'var(--c-orange)', width: '14px', height: '14px', margin: 0 }} />
                                        <span>Quizzes Evaluativos</span>
                                    </label>
                                </div>
                                <div className={styles.actionMenuDivider} />
                                <label className={styles.actionMenuItem}>
                                    <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={() => {}} />
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
                                <div className={styles.actionMenuDivider} />
                                <button className={styles.actionMenuItem} onClick={() => { setActiveDropdownId(null); onSyncAllPuestos(); }} disabled={syncing} style={{ color: 'var(--color-primary)' }}>
                                    <RefreshCw size={14} className={styles.actionMenuIcon} />
                                    {syncing ? 'Sincronizando...' : 'Sincronizar Puestos'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {showNativeEditForm && canEdit && (
                    <div className={styles.createCourseContainer}>
                        <h3>Editar curso: <em>{editingNative?.title}</em></h3>
                        <form onSubmit={handleNativeEditSubmit} className={styles.createCourseForm}>

                            <div className={styles.inputGroup}>
                                <label>URL alternativo (PDF / enlace externo)</label>
                                <input
                                    className={styles.input}
                                    value={nativeEditForm.contenidoUrl}
                                    onChange={e => setNativeEditForm(prev => ({ ...prev, contenidoUrl: e.target.value }))}
                                    placeholder="https://drive.google.com/... (opcional)"
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label>¿Qué ve el candidato?</label>
                                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="candidateView"
                                            value="native"
                                            checked={nativeEditForm.candidateView === 'native'}
                                            onChange={() => setNativeEditForm(prev => ({ ...prev, candidateView: 'native' }))}
                                        />
                                        Curso interactivo (slides)
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="candidateView"
                                            value="url"
                                            checked={nativeEditForm.candidateView === 'url'}
                                            onChange={() => setNativeEditForm(prev => ({ ...prev, candidateView: 'url' }))}
                                            disabled={!nativeEditForm.contenidoUrl}
                                        />
                                        URL / PDF
                                    </label>
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label>Puestos aplicables ({nativeEditForm.puestosAplicables.length})</label>
                                <div className={styles.puestosCheckboxContainer}>
                                    {puestosData.map((p, idx) => (
                                        <label key={idx}>
                                            <input
                                                type="checkbox"
                                                checked={nativeEditForm.puestosAplicables.includes(p.positions)}
                                                onChange={() => handleNativePuestoToggle(p.positions)}
                                            />
                                            {p.positions}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formActions}>
                                <Button type="submit" disabled={updatingNative}>
                                    {updatingNative ? 'Guardando...' : 'Guardar cambios'}
                                </Button>
                                <button type="button" className={styles.toggleBtn} onClick={handleNativeEditCancel}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {showNativeSection && (
                    <div className={styles.coursesGrid}>
                        {nativeLoading ? (
                            Array(6).fill(0).map((_, i) => (
                                <div key={i} className={`${styles.courseCard} ${styles.skeleton}`} />
                            ))
                        ) : filteredNative.length === 0 ? (
                            <div className={styles.emptyState}>
                                <Zap size={48} opacity={0.15} style={{ marginBottom: '10px' }} />
                                <p>{searchQuery ? 'No hay resultados que coincidan.' : 'No hay cursos interactivos. Importa un JSON o crea uno nuevo.'}</p>
                            </div>
                        ) : (
                            filteredNative.map(course => (
                                <div key={course.id} className={styles.courseCard}>
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
                                                <div className={styles.actionMenuDropdown} onClick={e => e.stopPropagation()}>
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
                                                    {canEdit && (
                                                        <button className={styles.actionMenuItem} onClick={(e) => { setActiveDropdownId(null); openEditNative(e, course); }}>
                                                            <Link2 size={14} className={styles.actionMenuIcon} />
                                                            Asignar Puestos / URL
                                                        </button>
                                                    )}
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
                                        {course.puestosAplicables?.length > 0 ? (
                                            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {course.puestosAplicables.join(', ')}
                                            </p>
                                        ) : (
                                            <p style={{ fontSize: '0.7rem', color: 'var(--color-danger)', marginTop: '4px' }}>
                                                Sin puestos asignados
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>

            {/* ══════════════════════════════════════════
                SECCIÓN 2 — URL / PDF
                ══════════════════════════════════════════ */}
            <section className={styles.columnSection}>
                <div className={styles.coursesHeader}>
                    <h2
                        className={styles.sectionTitle}
                        onClick={() => setShowLinkSection(v => !v)}
                    >
                        <ChevronRight
                            size={16}
                            className={`${styles.chevronIcon} ${showLinkSection ? styles.expanded : ''}`}
                        />
                        <Link2 size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                        URL / PDF
                        <span className={styles.sectionCount}>{linkCourses.length}</span>
                    </h2>

                    {canEdit && (
                        <button className={styles.toggleBtn} onClick={openCreateLink}>
                            <Plus size={14} />
                            Nuevo
                        </button>
                    )}
                </div>

                {showLinkSection && (
                    <>
                        {showLinkForm && canEdit && (
                            <div className={styles.createCourseContainer}>
                                <h3>{editingLink ? 'Editar recurso' : 'Nuevo recurso URL / PDF'}</h3>
                                <form onSubmit={handleLinkSubmit} className={styles.createCourseForm}>

                                    <div className={styles.inputGroup}>
                                        <label>Nombre</label>
                                        <input
                                            className={styles.input}
                                            value={linkForm.title}
                                            onChange={e => handleLinkFormChange('title', e.target.value)}
                                            placeholder="Ej. Manual de bienvenida"
                                            required
                                        />
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>URL del recurso</label>
                                        <input
                                            className={styles.input}
                                            value={linkForm.contenidoUrl}
                                            onChange={e => handleLinkFormChange('contenidoUrl', e.target.value)}
                                            placeholder="https://drive.google.com/..."
                                            required
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div className={styles.inputGroup}>
                                            <label>Duración (min)</label>
                                            <input
                                                type="number"
                                                className={styles.input}
                                                value={linkForm.duracionEstimada}
                                                onChange={e => handleLinkFormChange('duracionEstimada', parseInt(e.target.value) || 0)}
                                                min="1"
                                            />
                                        </div>
                                        <div className={styles.inputGroup}>
                                            <label>Orden</label>
                                            <input
                                                type="number"
                                                className={styles.input}
                                                value={linkForm.orden}
                                                onChange={e => handleLinkFormChange('orden', parseInt(e.target.value) || 1)}
                                                min="1"
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label>Puestos aplicables ({linkForm.puestosAplicables.length})</label>
                                        <div className={styles.puestosCheckboxContainer}>
                                            {puestosData.map((p, idx) => (
                                                <label key={idx}>
                                                    <input
                                                        type="checkbox"
                                                        checked={linkForm.puestosAplicables.includes(p.positions)}
                                                        onChange={() => handlePuestoToggle(p.positions)}
                                                    />
                                                    {p.positions}
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles.formActions}>
                                        <Button type="submit" disabled={uploadingLink}>
                                            {uploadingLink ? 'Guardando...' : (editingLink ? 'Actualizar' : 'Crear')}
                                        </Button>
                                        <button type="button" className={styles.toggleBtn} onClick={handleLinkCancel}>
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className={styles.coursesGrid}>
                            {filteredLink.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <FileText size={48} opacity={0.15} style={{ marginBottom: '10px' }} />
                                    <p>{searchQuery ? 'No hay resultados que coincidan.' : 'No hay recursos URL / PDF creados aún.'}</p>
                                </div>
                            ) : (
                                filteredLink.map(course => (
                                    <div
                                        key={course.id}
                                        className={styles.courseCard}
                                        onClick={() => course.contenidoUrl && window.open(course.contenidoUrl, '_blank')}
                                        style={{ opacity: course.activo === false ? 0.5 : 1 }}
                                    >
                                        <div className={styles.cardTopColor} style={{ background: 'var(--color-primary)' }} />

                                        <div className={styles.cardActionsRow}>
                                            <div className={styles.actionMenuContainer}>
                                                <button
                                                    type="button"
                                                    className={`${styles.actionMenuToggle} ${activeDropdownId === course.id ? styles.activeToggle : ''}`}
                                                    onClick={(e) => toggleDropdown(e, course.id)}
                                                    aria-label="Opciones"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>

                                                {activeDropdownId === course.id && (
                                                    <div className={styles.actionMenuDropdown} onClick={e => e.stopPropagation()}>
                                                        <button className={styles.actionMenuItem} onClick={() => { setActiveDropdownId(null); window.open(course.contenidoUrl, '_blank'); }}>
                                                            <ExternalLink size={14} className={styles.actionMenuIcon} />
                                                            Abrir
                                                        </button>
                                                        {canEdit && (
                                                            <>
                                                                <button className={styles.actionMenuItem} onClick={(e) => { setActiveDropdownId(null); openEditLink(e, course); }}>
                                                                    <Edit3 size={14} className={styles.actionMenuIcon} />
                                                                    Editar
                                                                </button>
                                                                <button className={styles.actionMenuItem} onClick={(e) => { e.stopPropagation(); setActiveDropdownId(null); onToggleLinkActive(course.id, course.activo); }}>
                                                                    <span className={styles.actionMenuIcon}>{course.activo !== false ? '🔴' : '🟢'}</span>
                                                                    {course.activo !== false ? 'Desactivar' : 'Activar'}
                                                                </button>
                                                                <div className={styles.actionMenuDivider} />
                                                                <button className={`${styles.actionMenuItem} ${styles.danger}`} onClick={(e) => { setActiveDropdownId(null); onDeleteLink(e, course.id); }}>
                                                                    <Trash2 size={14} className={styles.actionMenuIcon} />
                                                                    Eliminar
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className={styles.cardContent}>
                                            <h3 className={styles.courseTitle}>{course.title}</h3>
                                            {course.puestosAplicables?.length > 0 && (
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {course.puestosAplicables.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                )}
            </section>
        </>
    );
}
