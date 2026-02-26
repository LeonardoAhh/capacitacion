'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    BookOpen, Play, Edit3, Settings2, Trash2,
    Zap, Link2, ExternalLink,
} from 'lucide-react';
import styles from './CourseCard.module.css';

/** Genera un gradiente determinista a partir del título del curso */
function getCourseGradient(title = '') {
    const colors = [
        ['#e8742a', '#f59e0b'],  // naranja-amber
        ['#6366f1', '#8b5cf6'],  // indigo-violeta
        ['#0ea5e9', '#38bdf8'],  // azul claro
        ['#10b981', '#34d399'],  // verde esmeralda
        ['#ec4899', '#f472b6'],  // rosa
        ['#f43f5e', '#fb923c'],  // rojo-naranja
        ['#14b8a6', '#2dd4bf'],  // teal
    ];
    const index = title.charCodeAt(0) % colors.length;
    const [from, to] = colors[index];
    return `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
}

/**
 * CourseCard — Tarjeta premium para cursos interactivos y de candidatos.
 *
 * Props para cursos interactivos (nativeCourses):
 *   course: { id, title, published, category, slideCount, duration }
 *   type: 'native'
 *   onPlay, onTogglePublish, onRename, onDelete, onEdit (link a editor)
 *
 * Props para cursos de candidatos (cursos_induccion):
 *   course: { id, nombre, descripcion, activo, duracionEstimada, tipo, puestosAplicables }
 *   type: 'candidate'
 *   onPlay, onToggleActive, onEdit, onDelete
 */
export default function CourseCard({
    course,
    type = 'native',
    canEdit = false,
    renamingId,
    renameValue,
    onRenameChange,
    onRenameBlur,
    onRenameKeyDown,
    onPlay,
    onTogglePublish,
    onToggleActive,
    onStartRename,
    onEdit,
    onDelete,
}) {
    const isNative = type === 'native';
    const title = isNative ? course.title : course.nombre;
    const gradient = getCourseGradient(title);
    const isRenaming = renamingId === course.id;

    return (
        <div className={styles.card}>
            {/* Avatar generado */}
            <div className={styles.avatar} style={{ background: gradient }}>
                {isNative
                    ? <BookOpen size={28} style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.9)' }} />
                    : (course.tipo === 'native'
                        ? <Zap size={28} style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.9)' }} />
                        : <Link2 size={28} style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.9)' }} />
                    )
                }
            </div>

            {/* Cuerpo */}
            <div className={styles.body}>
                <div className={styles.titleRow}>
                    {isRenaming ? (
                        <input
                            className={styles.renameInput}
                            value={renameValue}
                            autoFocus
                            onChange={e => onRenameChange?.(e.target.value)}
                            onBlur={() => onRenameBlur?.(course.id)}
                            onKeyDown={e => onRenameKeyDown?.(e, course.id)}
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <span className={styles.title} title={title}>{title}</span>
                    )}

                    {/* Badge de estado */}
                    {isNative ? (
                        canEdit ? (
                            <span
                                className={`${styles.badge} ${course.published ? styles.badgePublished : styles.badgeDraft}`}
                                onClick={e => { e.stopPropagation(); onTogglePublish?.(course.id, course.published); }}
                                title="Click para cambiar estado"
                            >
                                {course.published ? 'Publicado' : 'Borrador'}
                            </span>
                        ) : null
                    ) : (
                        canEdit ? (
                            <span
                                className={`${styles.badge} ${course.activo ? styles.badgeActive : styles.badgeInactive}`}
                                onClick={e => { e.stopPropagation(); onToggleActive?.(course.id, course.activo); }}
                                title="Click para activar/desactivar"
                            >
                                {course.activo !== false ? 'Activo' : 'Inactivo'}
                            </span>
                        ) : null
                    )}
                </div>

                {/* Chips de metadata */}
                <div className={styles.meta}>
                    {isNative ? (
                        <>
                            {course.category && <span className={styles.chip}>{course.category}</span>}
                            {course.slideCount ? <span className={styles.chip}>{course.slideCount} slides</span> : null}
                            {course.duration && <span className={styles.chip}>{course.duration}</span>}
                        </>
                    ) : (
                        <>
                            {course.duracionEstimada ? <span className={styles.chip}>{course.duracionEstimada} min</span> : null}
                            {course.puestosAplicables?.slice(0, 2).map(p => (
                                <span key={p} className={styles.chip}>{p}</span>
                            ))}
                            {(course.puestosAplicables?.length ?? 0) > 2 && (
                                <span className={styles.chip}>+{course.puestosAplicables.length - 2}</span>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Acciones (solo admin/instructor) */}
            {canEdit && (
                <div className={styles.actions}>
                    {isNative && (
                        <>
                            <button
                                className={styles.actionBtn}
                                onClick={e => { e.stopPropagation(); onStartRename?.(e, course); }}
                                title="Renombrar"
                            >
                                <Edit3 size={13} />
                            </button>
                            <Link
                                href={`/induccion/cursos/${course.id}/editar`}
                                className={styles.actionBtn}
                                title="Editar slides"
                                onClick={e => e.stopPropagation()}
                            >
                                <Settings2 size={13} />
                            </Link>
                        </>
                    )}
                    {!isNative && (
                        <button
                            className={styles.actionBtn}
                            onClick={e => { e.stopPropagation(); onEdit?.(e, course); }}
                            title="Editar"
                        >
                            <Edit3 size={13} />
                        </button>
                    )}
                    <button
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={e => { e.stopPropagation(); onDelete?.(e, course.id); }}
                        title="Eliminar"
                    >
                        <Trash2 size={13} />
                    </button>
                    <button
                        className={`${styles.actionBtn} ${styles.actionBtnPlay}`}
                        onClick={e => { e.stopPropagation(); onPlay?.(course); }}
                        title="Reproducir / Abrir"
                    >
                        {!isNative && (course.tipo === 'link' || !course.tipo) && <ExternalLink size={13} />}
                        {(isNative || course.tipo === 'native') && <Play size={13} />}
                    </button>
                </div>
            )}

            {/* Sin acciones de admin: click en card abre el curso */}
            {!canEdit && (
                <div className={styles.actions}>
                    <button
                        className={`${styles.actionBtn} ${styles.actionBtnPlay}`}
                        onClick={e => { e.stopPropagation(); onPlay?.(course); }}
                        title="Abrir"
                        style={{ marginLeft: 'auto' }}
                    >
                        <Play size={13} /> Abrir
                    </button>
                </div>
            )}
        </div>
    );
}
