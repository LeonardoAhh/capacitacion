'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, deleteDoc, doc } from 'firebase/firestore';
import { useToast } from '@/components/ui/Toast/Toast';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import styles from './page.module.css';


export default function CalendarPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [date, setDate] = useState(new Date()); // Viewed Month
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Create Event Modal
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', date: '', type: 'PLANNED' }); // PLANNED

    // Days in current month view
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
        const startPadding = firstDay.getDay(); // 0 = Sunday
        const totalDays = lastDay.getDate();

        // Previous month padding
        for (let i = 0; i < startPadding; i++) {
            days.push(null);
        }

        // Current month days
        for (let i = 1; i <= totalDays; i++) {
            days.push(new Date(year, month, i));
        }

        setCalendarDays(days);
    };

    const loadEvents = async () => {
        setLoading(true);
        try {
            const tempEvents = [];
            const year = date.getFullYear();
            const month = date.getMonth(); // 0-11

            // 1. Fetch Planned Events from Firestore (Custom Collection)
            // Ideally filter by date range, but fetching all for simplicity or client-side filter
            const planRef = collection(db, 'calendar_events');
            const planSnap = await getDocs(planRef);
            planSnap.forEach(doc => {
                const d = doc.data();
                tempEvents.push({
                    id: doc.id,
                    type: 'PLANNED',
                    title: d.title,
                    date: d.date // YYYY-MM-DD
                });
            });

            // 2. Fetch History (Done)
            // Optimization: Maybe only fetch if we want to see history?
            // "Plan Anual" implies FUTURE. But Seeing what happened is good.
            const recordsSnap = await getDocs(collection(db, 'training_records'));

            // 3. Fetch Courses for Validity (Expirations)
            const coursesSnap = await getDocs(collection(db, 'courses'));
            const courseValidityMap = {};
            coursesSnap.forEach(doc => {
                const data = doc.data();
                if (data.validityMonths) courseValidityMap[data.name] = data.validityMonths;
            });

            recordsSnap.forEach(doc => {
                const emp = doc.data();
                const history = emp.history || [];

                history.forEach(h => {
                    if (h.status === 'approved') {
                        // DONE Event
                        // Parse DD/MM/YYYY to YYYY-MM-DD for comparison
                        const [d, m, y] = h.date.split('/');
                        // Only add if relevant? Let's add all and filter render.
                        tempEvents.push({
                            id: `${doc.id}_${h.courseName}_done`,
                            type: 'DONE',
                            title: `${h.courseName} - ${emp.name}`,
                            date: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
                        });

                        // EXPIRED Event
                        const val = courseValidityMap[h.courseName];
                        if (val) {
                            const dateObj = new Date(y, m - 1, d);
                            dateObj.setMonth(dateObj.getMonth() + val);
                            const expY = dateObj.getFullYear();
                            const expM = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const expD = String(dateObj.getDate()).padStart(2, '0');

                            tempEvents.push({
                                id: `${doc.id}_${h.courseName}_exp`,
                                type: 'EXPIRED',
                                title: `Vence: ${h.courseName} (${emp.name})`,
                                date: `${expY}-${expM}-${expD}`
                            });
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
        if (user?.rol !== 'super_admin') {
            toast.error("Acceso Denegado", "Tu rol actual (Lectura) no permite agendar eventos.");
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

    const nextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));
    const prevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));

    const getDayEvents = (dayDate) => {
        if (!dayDate) return [];
        const dateStr = dayDate.toISOString().split('T')[0];
        return events.filter(e => e.date === dateStr);
    };

    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Link href="/capacitacion" className={styles.backBtn}>← Dashboard</Link>
                            <h1>Calendario</h1>
                        </div>
                        <div className={styles.controls}>
                            <button className={styles.navBtn} onClick={prevMonth}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                            </button>
                            <span className={styles.monthTitle}>
                                {date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase()}
                            </span>
                            <button className={styles.navBtn} onClick={nextMonth}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                            </button>
                        </div>
                        <Button onClick={() => setCreateModalOpen(true)}>+ Agendar</Button>
                    </div>

                    <div className={styles.legend}>
                        <div className={styles.legendItem}>
                            <span className={styles.dot} style={{ background: 'var(--color-success)' }}></span> Realizado
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.dot} style={{ background: 'var(--color-danger)' }}></span> Vencimientos
                        </div>
                        <div className={styles.legendItem}>
                            <span className={styles.dot} style={{ background: 'var(--color-primary)' }}></span> Programado
                        </div>
                    </div>

                    <div className={styles.grid}>
                        {['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'].map(d => (
                            <div key={d} className={styles.dayHeader}>{d}</div>
                        ))}

                        {calendarDays.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} className={styles.emptyCell}></div>;

                            const dateStr = day.toISOString().split('T')[0];
                            const isToday = dateStr === todayStr;

                            // Group Events Logic
                            const dayEventsRaw = getDayEvents(day);
                            const groupedEvents = {}; // Key: "Type|Title"

                            dayEventsRaw.forEach(ev => {
                                // Extract Base Title (Remove Employee Name if format is "Course - Employee")
                                let baseTitle = ev.title;
                                if (ev.type === 'DONE' && baseTitle.includes(' - ')) {
                                    baseTitle = baseTitle.split(' - ')[0];
                                }
                                if (ev.type === 'EXPIRED' && baseTitle.includes('Vence: ')) {
                                    // "Vence: Course (Name)" -> "Vence: Course"
                                    const parts = baseTitle.replace('Vence: ', '').split(' (');
                                    baseTitle = parts[0];
                                }

                                const key = `${ev.type}|${baseTitle}`;
                                if (!groupedEvents[key]) {
                                    groupedEvents[key] = { type: ev.type, title: baseTitle, count: 0 };
                                }
                                groupedEvents[key].count++;
                            });

                            return (
                                <div key={idx} className={`${styles.dayCell} ${isToday ? styles.today : ''}`}>
                                    <div className={styles.dayNumber}>{day.getDate()}</div>
                                    {Object.values(groupedEvents).map((group, gIdx) => (
                                        <div key={gIdx} className={styles.eventGroup} title={`${group.count} registros`}>
                                            <span className={`${group.type === 'DONE' ? styles.dotDone :
                                                group.type === 'EXPIRED' ? styles.dotExpired : styles.dotPlanned
                                                }`}></span>
                                            <span className={
                                                group.type === 'DONE' ? styles.typeDone :
                                                    group.type === 'EXPIRED' ? styles.typeExpired : styles.typePlanned
                                            }>
                                                {group.title}
                                            </span>
                                            {group.count > 1 && (
                                                <span className={styles.countBadge}>{group.count}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* Create Event Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogHeader>
                    <DialogTitle>Agendar Evento</DialogTitle>
                    <DialogClose onClose={() => setCreateModalOpen(false)} />
                </DialogHeader>
                <DialogBody>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nombre del Evento / Curso</label>
                            <input
                                type="text"
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                value={newEvent.title}
                                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                placeholder="Ej. Curso de Alturas - Grupo A"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Fecha</label>
                            <input
                                type="date"
                                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                                value={newEvent.date}
                                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                            />
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateEvent}>Guardar</Button>
                </DialogFooter>
            </Dialog>
        </>
    );
}
