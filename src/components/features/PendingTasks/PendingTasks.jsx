'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    collection, query, where, getDocs,
    addDoc, updateDoc, doc, deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Check, Plus, Trash2, CalendarCheck, GripVertical, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext, closestCenter,
    PointerSensor, TouchSensor,
    useSensor, useSensors,
} from '@dnd-kit/core';
import {
    SortableContext, useSortable,
    verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './PendingTasks.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/components/ui/Toast/Toast';

// ─── Módule-level constants ────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 80;

const URGENCY_WEIGHT = { alta: 3, media: 2, baja: 1 };

const URGENCY_CONFIG = {
    alta:  { label: 'Alta',  chipClass: styles.chipAlta  },
    media: { label: 'Media', chipClass: styles.chipMedia },
    baja:  { label: 'Baja',  chipClass: styles.chipBaja  },
};

/** Fecha local en formato YYYY-MM-DD. Evita el bug UTC en zonas UTC-N. */
const toDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// ─── TaskItem ──────────────────────────────────────────────────────────────────

function TaskItem({ task, onToggle, onDelete, onEdit, dragHandleProps }) {
    const [isEditing, setIsEditing]   = useState(false);
    const [editValue, setEditValue]   = useState(task.title);
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isTouching, setIsTouching] = useState(false);
    const touchStartX = useRef(null);
    const inputRef    = useRef(null);

    // Sync edit value if title changes externally
    useEffect(() => { setEditValue(task.title); }, [task.title]);

    // Auto-focus inline input
    useEffect(() => {
        if (isEditing) inputRef.current?.focus();
    }, [isEditing]);

    // ── Swipe handlers ────────────────────────────────────────────────────────
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        setIsTouching(true);
    };

    const handleTouchMove = (e) => {
        if (touchStartX.current === null) return;
        const diff = e.touches[0].clientX - touchStartX.current;
        setSwipeOffset(Math.max(-120, Math.min(120, diff)));
    };

    const handleTouchEnd = () => {
        setIsTouching(false);
        if      (swipeOffset >  SWIPE_THRESHOLD) onToggle(task.id, task.completed);
        else if (swipeOffset < -SWIPE_THRESHOLD) onDelete(task.id);
        setSwipeOffset(0);
        touchStartX.current = null;
    };

    // ── Inline edit handlers ──────────────────────────────────────────────────
    const commitEdit = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== task.title) onEdit(task.id, trimmed);
        else setEditValue(task.title);
        setIsEditing(false);
    };

    const cancelEdit = () => {
        setEditValue(task.title);
        setIsEditing(false);
    };

    const urgency       = URGENCY_CONFIG[task.urgency] ?? URGENCY_CONFIG.media;
    const swipeProgress = Math.min(Math.abs(swipeOffset) / SWIPE_THRESHOLD, 1);
    const isSwipingRight = swipeOffset >  20;
    const isSwipingLeft  = swipeOffset < -20;

    return (
        <div
            className={[
                styles.taskOuter,
                isSwipingRight ? styles.swipingRight : '',
                isSwipingLeft  ? styles.swipingLeft  : '',
            ].join(' ')}
            style={{ '--swipe-progress': swipeProgress }}
        >
            {/* Swipe reveal hints */}
            <div className={styles.swipeHintRight} aria-hidden="true">
                <Check size={15} />
                <span>Completar</span>
            </div>
            <div className={styles.swipeHintLeft} aria-hidden="true">
                <Trash2 size={15} />
                <span>Eliminar</span>
            </div>

            {/* Main task row */}
            <div
                className={[
                    styles.taskItem,
                    task.completed ? styles.completed : '',
                    isTouching ? styles.touching : '',
                ].join(' ')}
                style={{ transform: `translateX(${swipeOffset}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Drag handle */}
                <button
                    className={styles.dragHandle}
                    aria-label="Reordenar tarea"
                    tabIndex={-1}
                    {...dragHandleProps}
                >
                    <GripVertical size={14} />
                </button>

                {/* Checkbox */}
                <button
                    className={styles.checkboxContainer}
                    onClick={() => onToggle(task.id, task.completed)}
                    aria-label={task.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                >
                    {task.completed && <Check size={13} strokeWidth={3} />}
                </button>

                {/* Content */}
                <div className={styles.taskContent}>
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            className={styles.inlineInput}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter')  commitEdit();
                                if (e.key === 'Escape') cancelEdit();
                            }}
                        />
                    ) : (
                        <span
                            className={styles.taskTitle}
                            onDoubleClick={() => setIsEditing(true)}
                            title="Doble clic para editar"
                        >
                            {task.title}
                        </span>
                    )}
                    <span className={`${styles.urgencyChip} ${urgency.chipClass}`}>
                        {urgency.label}
                    </span>
                </div>

                {/* Action buttons */}
                <div className={styles.taskActions}>
                    {!isEditing && (
                        <button
                            className={styles.editBtn}
                            onClick={() => setIsEditing(true)}
                            aria-label="Editar tarea"
                        >
                            <Pencil size={13} />
                        </button>
                    )}
                    <button
                        className={styles.deleteBtn}
                        onClick={() => onDelete(task.id)}
                        aria-label="Eliminar tarea"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── SortableTaskItem ──────────────────────────────────────────────────────────

function SortableTaskItem({ task, onToggle, onDelete, onEdit }) {
    const {
        attributes, listeners, setNodeRef,
        transform, transition, isDragging,
    } = useSortable({ id: task.id });

    return (
        <motion.div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition: isDragging ? 'none' : transition,
                zIndex: isDragging ? 50 : 'auto',
            }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: isDragging ? 0.45 : 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
        >
            <TaskItem
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                dragHandleProps={{ ...attributes, ...listeners }}
            />
        </motion.div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PendingTasks() {
    const { user }    = useAuth();
    const { toast }   = useToast();
    const { permission, sendNotification } = useNotifications();

    const [tasks, setTasks]               = useState([]);
    const [loading, setLoading]           = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAdding, setIsAdding]         = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskUrgency, setNewTaskUrgency] = useState('media');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localOrder, setLocalOrder]     = useState([]);

    const formInputRef = useRef(null);

    // DnD sensors — pointer (desktop, 8px activation) + touch (mobile, 250ms hold)
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor,   { activationConstraint: { delay: 250, tolerance: 5 } }),
    );

    // Stable 7-day window — only recalculates on mount
    const days = useMemo(() => {
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            return d;
        });
    }, []);

    const selectedDateStr = toDateStr(selectedDate);

    // ── Data fetching ──────────────────────────────────────────────────────────
    const fetchTasks = useCallback(async () => {
        if (!user?.uid) return;
        try {
            setLoading(true);
            const q = query(
                collection(db, 'pending_tasks'),
                where('userId', '==', user.uid),
            );
            const snap = await getDocs(q);
            setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch {
            toast.error('No se pudieron cargar los pendientes.');
        } finally {
            setLoading(false);
        }
    }, [user?.uid, toast]);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    // ── Push notification (once per day, high-priority tasks) ─────────────────
    useEffect(() => {
        if (loading || tasks.length === 0 || permission !== 'granted') return;
        const today = toDateStr(new Date());
        if (localStorage.getItem('last_task_notification_date') === today) return;

        const urgent = tasks.filter(t => t.date === today && !t.completed && t.urgency === 'alta');
        if (urgent.length > 0) {
            sendNotification('Pendientes Urgentes', {
                body: `Tienes ${urgent.length} pendiente(s) de alta urgencia hoy.`,
                icon: '/web-app-manifest-192x192.png',
                tag: 'high-priority-tasks',
            });
            localStorage.setItem('last_task_notification_date', today);
        }
    }, [tasks, loading, permission, sendNotification]);

    // ── Derived state ──────────────────────────────────────────────────────────

    /** Tareas del día seleccionado, respetando el orden local del drag */
    const dailyTasks = useMemo(() => {
        const base = tasks
            .filter(t => t.date === selectedDateStr)
            .sort((a, b) => {
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                return (URGENCY_WEIGHT[b.urgency] ?? 0) - (URGENCY_WEIGHT[a.urgency] ?? 0);
            });

        if (localOrder.length === 0) return base;

        const orderMap = new Map(localOrder.map((id, i) => [id, i]));
        return [...base].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            return (orderMap.get(a.id) ?? Infinity) - (orderMap.get(b.id) ?? Infinity);
        });
    }, [tasks, selectedDateStr, localOrder]);

    /** Set de fechas con tareas activas — O(1) lookup para los puntos del calendario */
    const activeDates = useMemo(
        () => new Set(tasks.filter(t => !t.completed).map(t => t.date)),
        [tasks],
    );

    /** Contador de pendientes para el badge */
    const pendingCount = useMemo(
        () => dailyTasks.filter(t => !t.completed).length,
        [dailyTasks],
    );

    // ── Helpers ────────────────────────────────────────────────────────────────
    const isToday     = (date) => toDateStr(date) === toDateStr(new Date());
    const getDayName  = (date) => date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');

    const getDaysLabel = (date) => {
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        const diff = Math.round((date - todayMidnight) / 86_400_000);
        if (diff === 0) return 'Hoy';
        if (diff === 1) return 'Mañana';
        return `En ${diff} días`;
    };

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !user?.uid) return;
        setIsSubmitting(true);
        try {
            const payload = {
                title: newTaskTitle.trim(),
                date: selectedDateStr,
                urgency: newTaskUrgency,
                completed: false,
                userId: user.uid,
                createdAt: new Date().toISOString(),
            };
            const ref = await addDoc(collection(db, 'pending_tasks'), payload);
            setTasks(prev => [...prev, { id: ref.id, ...payload }]);
            setNewTaskTitle('');
            setNewTaskUrgency('media');
            setIsAdding(false);
            toast.success('Pendiente agregado');
        } catch {
            toast.error('Error al guardar el pendiente');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTask = async (taskId, currentStatus) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, completed: !currentStatus } : t,
        ));
        try {
            await updateDoc(doc(db, 'pending_tasks', taskId), { completed: !currentStatus });
        } catch {
            toast.error('Error al actualizar');
            setTasks(prev => prev.map(t =>
                t.id === taskId ? { ...t, completed: currentStatus } : t,
            ));
        }
    };

    const deleteTask = async (taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        try {
            await deleteDoc(doc(db, 'pending_tasks', taskId));
            toast.success('Pendiente eliminado');
        } catch {
            toast.error('Error al eliminar');
            fetchTasks();
        }
    };

    const editTask = async (taskId, newTitle) => {
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, title: newTitle } : t,
        ));
        try {
            await updateDoc(doc(db, 'pending_tasks', taskId), { title: newTitle });
        } catch {
            toast.error('Error al editar');
            fetchTasks();
        }
    };

    const handleDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const ids  = dailyTasks.map(t => t.id);
        const from = ids.indexOf(active.id);
        const to   = ids.indexOf(over.id);
        setLocalOrder(arrayMove(ids, from, to));
    };

    const openAddForm = () => {
        const next = !isAdding;
        setIsAdding(next);
        if (next) requestAnimationFrame(() => formInputRef.current?.focus());
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className={styles.widgetContainer}>

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.title}>
                        <CalendarCheck size={20} className={styles.titleIcon} />
                        Mis Pendientes
                    </h2>
                    <AnimatePresence>
                        {pendingCount > 0 && (
                            <motion.span
                                key="badge"
                                className={styles.badge}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                            >
                                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    className={`${styles.addButton} ${isAdding ? styles.addButtonOpen : ''}`}
                    onClick={openAddForm}
                    aria-label={isAdding ? 'Cancelar' : 'Agregar pendiente'}
                >
                    <motion.span
                        animate={{ rotate: isAdding ? 45 : 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        style={{ display: 'flex' }}
                    >
                        <Plus size={18} />
                    </motion.span>
                </button>
            </div>

            {/* ── Calendar strip ──────────────────────────────────────── */}
            <div className={styles.calendarStrip} role="tablist" aria-label="Seleccionar fecha">
                {days.map((date) => {
                    const dateStr    = toDateStr(date);
                    const isSelected = dateStr === selectedDateStr;
                    return (
                        <button
                            key={dateStr}
                            role="tab"
                            aria-selected={isSelected}
                            className={`${styles.dayCard} ${isSelected ? styles.active : ''}`}
                            onClick={() => { setSelectedDate(date); setLocalOrder([]); }}
                        >
                            <span className={styles.dayName}>
                                {isToday(date) ? 'Hoy' : getDayName(date)}
                            </span>
                            <span className={styles.dayNumber}>{date.getDate()}</span>
                            {activeDates.has(dateStr) && <div className={styles.hasTasksDot} />}
                        </button>
                    );
                })}
            </div>

            {/* Etiqueta de días para fechas futuras */}
            {!isToday(selectedDate) && (
                <p className={styles.daysLabel}>{getDaysLabel(selectedDate)}</p>
            )}

            {/* ── Formulario de nueva tarea ────────────────────────────── */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        key="addForm"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden' }}
                    >
                        <form className={styles.addForm} onSubmit={handleAddTask}>
                            <input
                                ref={formInputRef}
                                type="text"
                                className={styles.formInput}
                                placeholder="Escribe tu pendiente..."
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setIsAdding(false);
                                        setNewTaskTitle('');
                                    }
                                }}
                                disabled={isSubmitting}
                                autoComplete="off"
                            />
                            <div className={styles.formRow}>
                                <div className={styles.selectWrapper}>
                                    <select
                                        className={styles.urgencySelect}
                                        value={newTaskUrgency}
                                        onChange={(e) => setNewTaskUrgency(e.target.value)}
                                        disabled={isSubmitting}
                                    >
                                        <option value="alta">Alta</option>
                                        <option value="media">Media</option>
                                        <option value="baja">Baja</option>
                                    </select>
                                </div>
                                <div className={styles.formActions}>
                                    <button
                                        type="button"
                                        className={styles.btnCancel}
                                        onClick={() => { setIsAdding(false); setNewTaskTitle(''); }}
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.btnSave}
                                        disabled={isSubmitting || !newTaskTitle.trim()}
                                    >
                                        {isSubmitting ? 'Guardando…' : 'Guardar'}
                                    </button>
                                </div>
                            </div>
                            <p className={styles.formHint}>Esc para cancelar</p>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Lista de tareas ──────────────────────────────────────── */}
            <div className={styles.taskList}>
                {loading ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyText}>Cargando pendientes…</p>
                    </div>
                ) : dailyTasks.length === 0 ? (
                    <motion.div
                        className={styles.emptyState}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className={styles.emptyIcon}><Check size={32} /></div>
                        <p className={styles.emptyText}>
                            {isToday(selectedDate)
                                ? 'Todo al día por hoy.'
                                : 'Sin pendientes en esta fecha.'}
                        </p>
                    </motion.div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={dailyTasks.map(t => t.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <AnimatePresence initial={false}>
                                {dailyTasks.map(task => (
                                    <SortableTaskItem
                                        key={task.id}
                                        task={task}
                                        onToggle={toggleTask}
                                        onDelete={deleteTask}
                                        onEdit={editTask}
                                    />
                                ))}
                            </AnimatePresence>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
}
