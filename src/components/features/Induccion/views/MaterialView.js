'use client';

import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import {
    IconChevronRight as ChevronRight,
    IconPlus as Plus,
    IconFileText as FileText,
    IconTrash2 as Trash2,
    IconLink as Link2,
    IconExternalLink as ExternalLink,
    IconCheck as Check,
    IconMoreHorizontal as MoreHorizontal,
} from '@/lib/icons';
import styles from '../../../../app/induccion/page.module.css';

export default function MaterialView({
    canEdit,
    activeTab,
    materialExpanded,
    setMaterialExpanded,
    courses,
    showCreateForm,
    setShowCreateForm,
    handleCreateCourse,
    newCourseName,
    setNewCourseName,
    file,
    setFile,
    presentationLink,
    setPresentationLink,
    uploading,
    filteredMaterial,
    searchQuery,
    handleDeleteCourse
}) {
    const [activeDropdownId, setActiveDropdownId] = React.useState(null);

    React.useEffect(() => {
        const closeMenu = () => setActiveDropdownId(null);
        window.addEventListener('click', closeMenu);
        return () => window.removeEventListener('click', closeMenu);
    }, []);

    const toggleDropdown = (e, id) => {
        e.stopPropagation();
        setActiveDropdownId(prev => (prev === id ? null : id));
    };

    if (!canEdit && activeTab !== 'material' && activeTab !== 'all') return null;
    if (activeTab !== 'material' && activeTab !== 'all') return null;

    return (
        <section className={styles.columnSection}>
            <div className={styles.coursesHeader}>
                <h2 className={styles.sectionTitle} onClick={() => setMaterialExpanded(!materialExpanded)}>
                    <ChevronRight size={16} className={`${styles.chevronIcon} ${materialExpanded ? styles.expanded : ''}`} />
                    Material
                    <span className={styles.sectionCount}>{courses.length}</span>
                </h2>
                {canEdit && (
                    <button className={styles.toggleBtn} onClick={() => setShowCreateForm(!showCreateForm)}>
                        <Plus size={14} />
                        {showCreateForm ? 'Cerrar' : 'Nuevo'}
                    </button>
                )}
            </div>

            {materialExpanded && (
                <>
                    {showCreateForm && canEdit && (
                        <div className={styles.createCourseContainer}>
                            <h3>Nuevo material</h3>
                            <form onSubmit={handleCreateCourse} className={styles.createCourseForm}>
                                <div className={styles.inputGroup}>
                                    <label>Nombre</label>
                                    <input className={styles.input} value={newCourseName} onChange={e => setNewCourseName(e.target.value)} placeholder="Ej. Manual de Bienvenida" />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Archivo o enlace</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input type="file" onChange={e => setFile(e.target.files[0])} style={{ display: 'none' }} id="fileUpload" />
                                        <label htmlFor="fileUpload" className={`${styles.fileBtn} ${file ? styles.fileBtnActive : ''}`}>
                                            {file ? <Check size={14} /> : <FileText size={14} />}
                                            {file ? 'Listo' : 'PDF'}
                                        </label>
                                        <span style={{ color: 'var(--c-muted)', fontSize: '0.75rem' }}>o</span>
                                        <input className={styles.input} placeholder="Pegar enlace..." value={presentationLink} onChange={e => setPresentationLink(e.target.value)} style={{ flex: 1 }} />
                                    </div>
                                </div>
                                <div className={styles.formActions}>
                                    <Button type="submit" disabled={uploading}>{uploading ? 'Subiendo...' : 'Publicar'}</Button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className={styles.coursesGrid}>
                        {filteredMaterial.length === 0 ? (
                            <div className={styles.emptyState}>
                                <FileText size={48} opacity={0.15} style={{ marginBottom: '10px' }} />
                                <p>{searchQuery ? 'No hay material que coincida.' : 'No hay material de inducción'}</p>
                            </div>
                        ) : (
                            filteredMaterial.map(course => (
                                <div key={course.id} className={styles.courseCard} onClick={() => window.open(course.material?.url, '_blank')}>
                                    <div className={styles.cardTopColor} style={{ background: '#3b82f6' }} />

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
                                                <div className={styles.actionMenuDropdown} onClick={(e) => e.stopPropagation()}>
                                                    <button className={styles.actionMenuItem} onClick={() => { setActiveDropdownId(null); window.open(course.material?.url, '_blank'); }}>
                                                        <ExternalLink size={14} className={styles.actionMenuIcon} />
                                                        Abrir recurso
                                                    </button>
                                                    {canEdit && (
                                                        <>
                                                            <div className={styles.actionMenuDivider} />
                                                            <button className={`${styles.actionMenuItem} ${styles.actionMenuItemDanger}`} onClick={(e) => { setActiveDropdownId(null); handleDeleteCourse(e, course.id); }}>
                                                                <Trash2 size={14} className={styles.actionMenuIcon} />
                                                                Eliminar material
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.cardContent}>
                                        <h3 className={styles.courseTitle}>{course.title}</h3>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
