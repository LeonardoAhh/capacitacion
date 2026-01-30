'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/components/ui/Toast/Toast';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import styles from './page.module.css';


export default function CalendarPage() {
    const { user, canWrite } = useAuth();
    const { toast } = useToast();
    const [date, setDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [detailModal, setDetailModal] = useState(null); // { date, events }
    const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'PLANNED' });

    // Calendar days
    const [calendarDays, setCalendarDays] = useState([]);

    useEffect(() => {
        generateCalendar();
        loadEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date]);

    const generateCalendar = () => {
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        const startPadding = firstDay.getDay();
        const totalDays = lastDay.getDate();

        for (let i = 0; i < startPadding; i++) {
            days.push(null);
        }

        for (let i = 1; i <= totalDays; i++) {
            days.push(new Date(year, month, i));
        }

        setCalendarDays(days);
    };

    const loadEvents = async () => {
        setLoading(true);
        try {
            const tempEvents = [];

            // 1. Fetch Planned Events
            const planRef = collection(db, 'calendar_events');
            const planSnap = await getDocs(planRef);
            planSnap.forEach(docSnap => {
                const d = docSnap.data();
                tempEvents.push({
                    id: docSnap.id,
                    type: 'PLANNED',
                    title: d.title,
                    date: d.date,
                    courseName: d.title,
                    employeeName: null
                });
            });

            // 2. Fetch Training History (Done courses)
            const recordsSnap = await getDocs(collection(db, 'training_records'));

            // 3. Fetch Courses for Validity
            const coursesSnap = await getDocs(collection(db, 'courses'));
            const courseValidityMap = {};
            coursesSnap.forEach(docSnap => {
                const data = docSnap.data();
                if (data.validityMonths) courseValidityMap[data.name] = data.validityMonths;
            });

            recordsSnap.forEach(docSnap => {
                const emp = docSnap.data();
                const history = emp.history || [];

                history.forEach(h => {
                    if (h.status === 'approved' && h.date) {
                        const [d, m, y] = h.date.split('/');
                        if (d && m && y) {
                            tempEvents.push({
                                id: `${docSnap.id}_${h.courseName}_done`,
                                type: 'DONE',
                                title: h.courseName,
                                courseName: h.courseName,
                                employeeName: emp.name,
                                employeeId: emp.employeeId,
                                date: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`,
                                score: h.score
                            });

                            // Expiration
                            const val = courseValidityMap[h.courseName];
                            if (val) {
                                const dateObj = new Date(y, m - 1, d);
                                dateObj.setMonth(dateObj.getMonth() + val);
                                const expY = dateObj.getFullYear();
                                const expM = String(dateObj.getMonth() + 1).padStart(2, '0');
                                const expD = String(dateObj.getDate()).padStart(2, '0');

                                tempEvents.push({
                                    id: `${docSnap.id}_${h.courseName}_exp`,
                                    type: 'EXPIRED',
                                    title: `Vence: ${h.courseName}`,
                                    courseName: h.courseName,
                                    employeeName: emp.name,
                                    employeeId: emp.employeeId,
                                    date: `${expY}-${expM}-${expD}`
                                });
                            }
                        }
                    }
                });
            });

            setEvents(tempEvents);
        } catch (error) {
            console.error(error);
            toast.error("Error", "No se cargaron eventos");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async () => {
        if (!canWrite()) {
            toast.error("Acceso Denegado", "Tu rol no permite crear eventos.");
            return;
        }

        if (!newEvent.title || !newEvent.date) return;
        try {
            await addDoc(collection(db, 'calendar_events'), {
                title: newEvent.title,
                date: newEvent.date,
                createdAt: new Date()
            });
            toast.success("Evento Creado");
            setCreateModalOpen(false);
            setNewEvent({ title: '', date: '', type: 'PLANNED' });
            loadEvents();
        } catch (e) {
            toast.error("Error al guardar");
        }
    };

    const handleDeleteEvent = async (eventId) => {
        if (!canWrite()) return;
        try {
            await deleteDoc(doc(db, 'calendar_events', eventId));
            toast.success("Evento eliminado");
            setDetailModal(prev => ({
                ...prev,
                events: prev.events.filter(e => e.id !== eventId)
            }));
            loadEvents();
        } catch (e) {
            toast.error("Error al eliminar");
        }
    };

    const nextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));
    const prevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));

    const getDayEvents = (dayDate) => {
        if (!dayDate) return [];
        const dateStr = dayDate.toISOString().split('T')[0];
        return events.filter(e => e.date === dateStr);
    };

    // Group events by day for stats
    const getDayStats = (dayDate) => {
        const dayEvents = getDayEvents(dayDate);
        const done = dayEvents.filter(e => e.type === 'DONE').length;
        const expired = dayEvents.filter(e => e.type === 'EXPIRED').length;
        const planned = dayEvents.filter(e => e.type === 'PLANNED').length;
        return { done, expired, planned, total: dayEvents.length };
    };

    const handleDayClick = (day) => {
        if (!day) return;
        const dayEvents = getDayEvents(day);
        if (dayEvents.length > 0) {
            setDetailModal({
                date: day,
                events: dayEvents
            });
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];

    // Format date for display
    const formatDisplayDate = (d) => {
        return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    return (
        <>
            <Navbar />
            <main className={styles.main} id="main-content">
                <div className={styles.container}>
                    {/* Header */}
                    <div className={styles.headerSection}>
                        <Link href="/capacitacion" className={styles.backBtn}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Volver
                        </Link>
                        <div className={styles.header}>
                            <div className={styles.titleGroup}>
                                <h1>Calendario de Capacitación</h1>
                                <p>Visualiza los cursos impartidos y programados</p>
                            </div>
                            <div className={styles.headerActions}>
                                <div className={styles.controls}>
                                    <button className={styles.navBtn} onClick={prevMonth}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                                    </button>
                                    <span className={styles.monthTitle}>
                                        {date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                                    </span>
                                    <button className={styles.navBtn} onClick={nextMonth}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                                    </button>
                                </div>
                                {canWrite() && (
                                    <Button onClick={() => setCreateModalOpen(true)}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                        </svg>
                                        Agendar Curso
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className={styles.legend}>
                        <div className={styles.legendItem}>
                            <span className={styles.dotDone}></span>
                            <span>Realizado</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.dotExpired}></span>
                            <span>Vencimiento</span>
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.dotPlanned}></span>
                            <span>Programado</span>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className={styles.grid}>
                        {['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'].map(d => (
                            <div key={d} className={styles.dayHeader}>{d}</div>
                        ))}

                        {calendarDays.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} className={styles.emptyCell}></div>;

                            const dateStr = day.toISOString().split('T')[0];
                            const isToday = dateStr === todayStr;
                            const stats = getDayStats(day);

                            return (
                                <div
                                    key={idx}
                                    className={`${styles.dayCell} ${isToday ? styles.today : ''} ${stats.total > 0 ? styles.hasEvents : ''}`}
                                    onClick={() => handleDayClick(day)}
                                >
                                    <div className={styles.dayNumber}>{day.getDate()}</div>

                                    {stats.total > 0 && (
                                        <div className={styles.dayStats}>
                                            {stats.done > 0 && (
                                                <div className={styles.statBadge + ' ' + styles.statDone}>
                                                    <span className={styles.dotDone}></span>
                                                    {stats.done}
                                                </div>
                                            )}
                                            {stats.expired > 0 && (
                                                <div className={styles.statBadge + ' ' + styles.statExpired}>
                                                    <span className={styles.dotExpired}></span>
                                                    {stats.expired}
                                                </div>
                                            )}
                                            {stats.planned > 0 && (
                                                <div className={styles.statBadge + ' ' + styles.statPlanned}>
                                                    <span className={styles.dotPlanned}></span>
                                                    {stats.planned}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Create Event Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogHeader>
                    <DialogTitle>Agendar Curso</DialogTitle>
                    <DialogClose onClose={() => setCreateModalOpen(false)} />
                </DialogHeader>
                <DialogBody>
                    <div className={styles.formGroup}>
                        <label>Nombre del Curso</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={newEvent.title}
                            onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                            placeholder="Ej. Curso de Alturas - Grupo A"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Fecha</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={newEvent.date}
                            onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                        />
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setCreateModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateEvent}>Guardar</Button>
                </DialogFooter>
            </Dialog>

            {/* Detail Modal */}
            <Dialog open={!!detailModal} onOpenChange={() => setDetailModal(null)}>
                <DialogHeader>
                    <DialogTitle>
                        {detailModal && formatDisplayDate(detailModal.date)}
                    </DialogTitle>
                    <DialogClose onClose={() => setDetailModal(null)} />
                </DialogHeader>
                <DialogBody>
                    {detailModal && (
                        <div className={styles.detailContent}>
                            {/* Group by type */}
                            {['DONE', 'PLANNED', 'EXPIRED'].map(type => {
                                const typeEvents = detailModal.events.filter(e => e.type === type);
                                if (typeEvents.length === 0) return null;

                                const typeLabel = type === 'DONE' ? 'Cursos Realizados' :
                                    type === 'PLANNED' ? 'Cursos Programados' :
                                        'Vencimientos';
                                const typeClass = type === 'DONE' ? styles.typeDone :
                                    type === 'PLANNED' ? styles.typePlanned :
                                        styles.typeExpired;

                                return (
                                    <div key={type} className={styles.detailSection}>
                                        <h3 className={typeClass}>
                                            {typeLabel} ({typeEvents.length})
                                        </h3>
                                        <div className={styles.eventList}>
                                            {typeEvents.map((ev, idx) => (
                                                <div key={idx} className={styles.eventItem}>
                                                    <div className={styles.eventInfo}>
                                                        <span className={styles.eventTitle}>{ev.courseName || ev.title}</span>
                                                        {ev.employeeName && (
                                                            <span className={styles.eventEmployee}>
                                                                {ev.employeeName}
                                                                {ev.score && ` • ${ev.score}%`}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {type === 'PLANNED' && canWrite() && (
                                                        <button
                                                            className={styles.deleteBtn}
                                                            onClick={() => handleDeleteEvent(ev.id)}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </DialogBody>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => setDetailModal(null)}>Cerrar</Button>
                </DialogFooter>
            </Dialog>
        </>
    );
}
