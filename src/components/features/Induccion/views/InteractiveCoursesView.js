'use client';

import React, { useState } from 'react';
import { getCourseWithSlides } from '@/lib/courseService';
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
    // Edición de curso nativo
    onUpdateNative,
    updatingNative,
    // Sincronización masiva
    onSyncAllPuestos,
    syncing,
}) {
    const [activeDropdownId, setActiveDropdownId] = useState(null);
    const [showNativeSection, setShowNativeSection] = useState(true);
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

    const handleDownloadJson = async (course) => {
        try {
            const result = await getCourseWithSlides(course.id);
            if (!result.success) {
                alert('No se pudo obtener el curso.');
                return;
            }
            const { course: courseData, slides } = result.data;
            const exportData = { course: courseData, slides: slides || [] };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const cleanTitle = (courseData.title || 'curso').toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');
            a.href = url;
            a.download = `${cleanTitle}.json`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (err) {
            console.error('Error al exportar el curso:', err);
            alert('Error al exportar el curso.');
        }
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
                                                    <button className={styles.actionMenuItem} onClick={async () => {
                                                        setActiveDropdownId(null);
                                                        await handleDownloadJson(course);
                                                    }}>
                                                        <FileText size={14} className={styles.actionMenuIcon} />
                                                        Descargar JSON
                                                    </button>
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
        </>
    );
}
