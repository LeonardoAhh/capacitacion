'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Check, Plus, Trash2, CalendarCheck } from 'lucide-react';
import styles from './PendingTasks.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/components/ui/Toast/Toast';

export default function PendingTasks() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { permission, requestPermission, sendNotification } = useNotifications();
    
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Calendar state
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    // Form state
    const [isAdding, setIsAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskUrgency, setNewTaskUrgency] = useState('media');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get next 7 days for the calendar strip
    const days = useMemo(() => {
        const result = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            result.push(date);
        }
        return result;
    }, []);

    // Format date to YYYY-MM-DD for storage and comparison
    const formatDateStr = (date) => {
        return date.toISOString().split('T')[0];
    };

    const selectedDateStr = formatDateStr(selectedDate);

    // Fetch tasks
    const fetchTasks = React.useCallback(async () => {
        if (!user?.uid) return;
        
        try {
            setLoading(true);
            const q = query(
                collection(db, 'pending_tasks'),
                where('userId', '==', user.uid)
            );
            
            const snapshot = await getDocs(q);
            const tasksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setTasks(tasksData);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('No se pudieron cargar los pendientes.');
        } finally {
            setLoading(false);
        }
    }, [user?.uid, toast]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // Push notification for daily high priority tasks
    useEffect(() => {
        if (loading || tasks.length === 0 || permission !== 'granted') return;

        const today = new Date().toISOString().split('T')[0];
        const lastTaskNotif = localStorage.getItem('last_task_notification_date');

        if (lastTaskNotif !== today) {
            const highPriorityToday = tasks.filter(t => t.date === today && !t.completed && t.urgency === 'alta');
            
            if (highPriorityToday.length > 0) {
                sendNotification('Pendientes Urgentes', {
                    body: `Tienes ${highPriorityToday.length} pendiente(s) de alta urgencia hoy.`,
                    icon: '/web-app-manifest-192x192.png',
                    tag: 'high-priority-tasks',
                });
                localStorage.setItem('last_task_notification_date', today);
            }
        }
    }, [tasks, loading, permission, sendNotification]);

    // Derived state: tasks for selected date
    const dailyTasks = useMemo(() => {
        return tasks.filter(task => task.date === selectedDateStr)
            .sort((a, b) => {
                // Sort by completion first
                if (a.completed !== b.completed) return a.completed ? 1 : -1;
                // Then by urgency
                const urgencyWeight = { alta: 3, media: 2, baja: 1 };
                return (urgencyWeight[b.urgency] || 0) - (urgencyWeight[a.urgency] || 0);
            });
    }, [tasks, selectedDateStr]);

    // Check if a specific date has any non-completed tasks
    const hasActiveTasksForDate = (dateStr) => {
        return tasks.some(task => task.date === dateStr && !task.completed);
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim() || !user?.uid) return;

        setIsSubmitting(true);
        try {
            const newTask = {
                title: newTaskTitle.trim(),
                date: selectedDateStr,
                urgency: newTaskUrgency,
                completed: false,
                userId: user.uid,
                createdAt: new Date().toISOString()
            };

            const docRef = await addDoc(collection(db, 'pending_tasks'), newTask);
            setTasks(prev => [...prev, { id: docRef.id, ...newTask }]);
            
            setNewTaskTitle('');
            setNewTaskUrgency('media');
            setIsAdding(false);
            toast.success('Pendiente agregado');
        } catch (error) {
            console.error('Error adding task:', error);
            toast.error('Error al guardar el pendiente');
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTaskCompletion = async (taskId, currentStatus) => {
        try {
            // Optimistic update
            setTasks(prev => prev.map(t => 
                t.id === taskId ? { ...t, completed: !currentStatus } : t
            ));

            await updateDoc(doc(db, 'pending_tasks', taskId), {
                completed: !currentStatus
            });
        } catch (error) {
            console.error('Error updating task:', error);
            toast.error('Error al actualizar el estado');
            // Revert on error
            setTasks(prev => prev.map(t => 
                t.id === taskId ? { ...t, completed: currentStatus } : t
            ));
        }
    };

    const deleteTask = async (taskId) => {
        try {
            // Optimistic update
            setTasks(prev => prev.filter(t => t.id !== taskId));
            
            await deleteDoc(doc(db, 'pending_tasks', taskId));
            toast.success('Pendiente eliminado');
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Error al eliminar');
            fetchTasks(); // Reload to restore if failed
        }
    };

    // Format helpers
    const getDayName = (date) => {
        return date.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
    };
    
    const isToday = (date) => {
        return formatDateStr(date) === formatDateStr(new Date());
    };

    return (
        <div className={styles.widgetContainer}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.title}>
                        <CalendarCheck size={20} className={styles.titleIcon} color="var(--color-primary)" />
                        Mis Pendientes
                    </h2>
                    {dailyTasks.filter(t => !t.completed).length > 0 && (
                        <span className={styles.badge}>
                            {dailyTasks.filter(t => !t.completed).length} para hoy
                        </span>
                    )}
                </div>
                <button 
                    className={styles.addButton} 
                    onClick={() => {
                        setIsAdding(!isAdding);
                        if (!isAdding) {
                            setTimeout(() => document.getElementById('newTaskInput')?.focus(), 50);
                        }
                    }}
                    title="Agregar pendiente"
                    aria-label="Agregar pendiente a esta fecha"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Calendar Strip */}
            <div className={styles.calendarStrip}>
                {days.map((date, i) => {
                    const dateStr = formatDateStr(date);
                    const isSelected = dateStr === selectedDateStr;
                    const hasTasks = hasActiveTasksForDate(dateStr);
                    
                    return (
                        <div 
                            key={i} 
                            className={`${styles.dayCard} ${isSelected ? styles.active : ''}`}
                            onClick={() => setSelectedDate(date)}
                        >
                            <span className={styles.dayName}>
                                {isToday(date) ? 'Hoy' : getDayName(date)}
                            </span>
                            <span className={styles.dayNumber}>
                                {date.getDate()}
                            </span>
                            {hasTasks && <div className={styles.hasTasksDot} />}
                        </div>
                    );
                })}
            </div>

            {/* Add Task Form Inline */}
            {isAdding && (
                <form className={styles.addForm} onSubmit={handleAddTask}>
                    <input 
                        id="newTaskInput"
                        type="text" 
                        className={styles.formInput} 
                        placeholder="Escribe tu pendiente..." 
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        autoFocus
                        disabled={isSubmitting}
                    />
                    <div className={styles.formRow}>
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
                        <div className={styles.formActions}>
                            <button 
                                type="button" 
                                className={styles.btnCancel}
                                onClick={() => setIsAdding(false)}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button type="submit" className={styles.btnSave} disabled={isSubmitting || !newTaskTitle.trim()}>
                                Guardar
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* Task List */}
            <div className={styles.taskList}>
                {loading ? (
                    <div className={styles.emptyState}>
                        <p className={styles.emptyText}>Cargando pendientes...</p>
                    </div>
                ) : dailyTasks.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Check size={32} />
                        </div>
                        <p className={styles.emptyText}>
                            No tienes pendientes {isToday(selectedDate) ? 'para hoy' : 'en esta fecha'}.
                        </p>
                    </div>
                ) : (
                    dailyTasks.map(task => (
                        <div key={task.id} className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}>
                            <button 
                                className={styles.checkboxContainer}
                                onClick={() => toggleTaskCompletion(task.id, task.completed)}
                                aria-label={task.completed ? "Marcar como pendiente" : "Marcar como completado"}
                            >
                                {task.completed && <Check size={16} strokeWidth={3} />}
                            </button>
                            
                            <div className={styles.taskContent}>
                                <span className={styles.taskTitle}>{task.title}</span>
                                <div className={styles.taskMeta}>
                                    <div className={`${styles.urgencyDot} ${styles['urgency' + task.urgency]}`} />
                                    <span className={styles.taskLabel}>{task.urgency}</span>
                                </div>
                            </div>

                            <button 
                                className={styles.deleteBtn}
                                onClick={() => deleteTask(task.id)}
                                title="Eliminar tarea"
                                aria-label="Eliminar tarea"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
