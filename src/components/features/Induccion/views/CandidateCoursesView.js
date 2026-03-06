'use client';

import React from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Combobox } from '@/components/ui/Combobox/Combobox';
import {
    IconChevronRight as ChevronRight,
    IconPlus as Plus,
    IconTrash2 as Trash2,
    IconEdit as Edit3,
    IconLink as Link2,
    IconZap as Zap,
    IconBookOpen as BookOpen,
    IconUsers as Users,
    IconMoreHorizontal as MoreHorizontal,
} from '@/lib/icons';
import puestosData from '../../../../../puestos.json';
import styles from '../../../../app/induccion/page.module.css';

export default function CandidateCoursesView({
    canEdit,
    activeTab,
    candidatosExpanded,
    setCandidatosExpanded,
    candidateCourses,
    showCandidateForm,
    setShowCandidateForm,
    setEditingCandidateCourse,
    editingCandidateCourse,
    candidateFormData,
    setCandidateFormData,
    handleCandidateFormChange,
    handlePuestoToggle,
    handleCreateCandidateCourse,
    uploading,
    availableCourseTitles,
    nativeCourses,
    filteredCandidates,
    searchQuery,
    handleEditCandidateCourse,
    handleDeleteCandidateCourse,
    handleToggleCourseActive,
    handleCandidateCardClick
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


    if (!canEdit && activeTab !== 'candidatos' && activeTab !== 'all') return null;
    if (activeTab !== 'candidatos' && activeTab !== 'all') return null;

    return (
        <section className={styles.columnSection}>
            <div className={styles.coursesHeader}>
                <h2 className={styles.sectionTitle} onClick={() => setCandidatosExpanded(!candidatosExpanded)}>
                    <ChevronRight size={16} className={`${styles.chevronIcon} ${candidatosExpanded ? styles.expanded : ''}`} />
                    Candidatos
                    <span className={styles.sectionCount}>{candidateCourses.length}</span>
                </h2>
                <button
                    className={styles.toggleBtn}
                    onClick={() => {
                        setShowCandidateForm(!showCandidateForm);
                        setEditingCandidateCourse(null);
                        setCandidateFormData({
                            nombre: '', descripcion: '', contenidoUrl: '', examenUrl: '',
                            puestosAplicables: [], duracionEstimada: 30, obligatorio: true, orden: 1,
                            nativeCourseId: '', tipo: 'link'
                        });
                    }}
                >
                    <Plus size={14} />
                    {showCandidateForm ? 'Cerrar' : 'Nuevo'}
                </button>
            </div>

            {candidatosExpanded && (
                <>
                    {showCandidateForm && (
                        <div className={styles.createCourseContainer}>
                            <h3>{editingCandidateCourse ? 'Editar curso' : 'Nuevo curso'}</h3>
                            <form onSubmit={handleCreateCandidateCourse} className={styles.createCourseForm}>
                                <div className={styles.inputGroup}>
                                    <label>Nombre del curso</label>
                                    <Combobox
                                        value={candidateFormData.nombre}
                                        onChange={(value) => handleCandidateFormChange('nombre', value)}
                                        options={availableCourseTitles}
                                        placeholder="Seleccionar o escribir..."
                                        searchPlaceholder="Buscar..."
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Descripción</label>
                                    <textarea className={styles.input} value={candidateFormData.descripcion} onChange={e => handleCandidateFormChange('descripcion', e.target.value)} placeholder="Breve descripción del curso..." rows={2} />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Tipo de contenido</label>
                                    <div className={styles.tipoSelector}>
                                        {['link', 'native'].map(tipo => (
                                            <button key={tipo} type="button" className={`${styles.tipoBtn} ${candidateFormData.tipo === tipo ? styles.tipoBtnActive : ''}`} onClick={() => handleCandidateFormChange('tipo', tipo)}>
                                                {tipo === 'link' && <><Link2 size={12} /> Enlace</>}
                                                {tipo === 'native' && <><Zap size={12} /> Interactivo</>}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {candidateFormData.tipo === 'native' ? (
                                    <div className={styles.inputGroup}>
                                        <label>Curso interactivo</label>
                                        <select className={styles.input} value={candidateFormData.nativeCourseId} onChange={e => handleCandidateFormChange('nativeCourseId', e.target.value)}>
                                            <option value="">— Seleccionar curso —</option>
                                            {nativeCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div className={styles.inputGroup}>
                                        <label>URL de presentación</label>
                                        <input className={styles.input} value={candidateFormData.contenidoUrl} onChange={e => handleCandidateFormChange('contenidoUrl', e.target.value)} placeholder="https://drive.google.com/..." />
                                    </div>
                                )}
                                <div className={styles.inputGroup}>
                                    <label>URL de examen (opcional)</label>
                                    <input className={styles.input} value={candidateFormData.examenUrl} onChange={e => handleCandidateFormChange('examenUrl', e.target.value)} placeholder="https://..." />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div className={styles.inputGroup}>
                                        <label>Duración (min)</label>
                                        <input type="number" className={styles.input} value={candidateFormData.duracionEstimada} onChange={e => handleCandidateFormChange('duracionEstimada', parseInt(e.target.value) || 0)} min="1" />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Orden</label>
                                        <input type="number" className={styles.input} value={candidateFormData.orden} onChange={e => handleCandidateFormChange('orden', parseInt(e.target.value) || 1)} min="1" />
                                    </div>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Puestos aplicables ({candidateFormData.puestosAplicables.length})</label>
                                    <div className={styles.puestosCheckboxContainer}>
                                        {puestosData.map((p, idx) => (
                                            <label key={idx}>
                                                <input type="checkbox" checked={candidateFormData.puestosAplicables.includes(p.positions)} onChange={() => handlePuestoToggle(p.positions)} />
                                                {p.positions}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.formActions}>
                                    <Button type="submit" disabled={uploading}>
                                        {uploading ? 'Guardando...' : (editingCandidateCourse ? 'Actualizar' : 'Crear')}
                                    </Button>
                                    {editingCandidateCourse && (
                                        <button type="button" className={styles.toggleBtn} onClick={() => { setEditingCandidateCourse(null); setShowCandidateForm(false); }}>
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    <div className={styles.coursesGrid}>
                        {filteredCandidates.length === 0 ? (
                            <div className={styles.emptyState}>
                                <Users size={48} opacity={0.15} style={{ marginBottom: '10px' }} />
                                <p>{searchQuery ? 'No hay candidatos o cursos que coincidan.' : 'No hay cursos de candidatos creados aún.'}</p>
                            </div>
                        ) : (
                            filteredCandidates.map(course => {
                                const isNative = course.tipo === 'native' || !!course.nativeCourseId;
                                return (
                                    <div key={course.id} className={styles.courseCard} onClick={() => handleCandidateCardClick(course)}>
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
                                                        <button className={styles.actionMenuItem} onClick={(e) => { setActiveDropdownId(null); handleEditCandidateCourse(e, course); }}>
                                                            <Edit3 size={14} className={styles.actionMenuIcon} />
                                                            Editar curso
                                                        </button>
                                                        <button className={styles.actionMenuItem} onClick={(e) => { setActiveDropdownId(null); handleToggleCourseActive(course.id, course.activo); }}>
                                                            <span className={styles.actionMenuIcon}>{course.activo ? '🔴' : '🟢'}</span>
                                                            {course.activo ? 'Desactivar' : 'Activar'}
                                                        </button>
                                                        <div className={styles.actionMenuDivider} />
                                                        <button className={`${styles.actionMenuItem} ${styles.danger}`} onClick={(e) => { setActiveDropdownId(null); handleDeleteCandidateCourse(e, course.id); }}>
                                                            <Trash2 size={14} className={styles.actionMenuIcon} />
                                                            Eliminar curso
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.cardContent}>
                                            <h3 className={styles.courseTitle}>{course.nombre}</h3>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
