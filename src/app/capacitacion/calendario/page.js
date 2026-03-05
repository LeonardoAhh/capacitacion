'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import ProfileDropdown from '@/components/layout/ProfileDropdown/ProfileDropdown';
import BackButton from '@/components/ui/BackButton/BackButton';
import { Button } from '@/components/ui/Button/Button';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, getDoc, query, where } from 'firebase/firestore';
import { useToast } from '@/components/ui/Toast/Toast';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { UserPlus, X, Download } from 'lucide-react';
import styles from './page.module.css';

// ─── Constantes ────────────────────────────────────────────────────────────
const EMPTY_SESSION = { date: '', startTime: '', endTime: '' };

const EMPTY_EVENT = {
    title: '',
    instructor: '',
    location: '',
    duration: '',
    objective: '',
    proposals: [
        { label: 'Propuesta 1', sessions: [{ ...EMPTY_SESSION }] },
        { label: 'Propuesta 2', sessions: [{ ...EMPTY_SESSION }] },
    ],
};

// ─── Paleta del PDF (centralizada, sin hardcodear en la función) ────────────
const PDF_COLORS = {
    primary: [30, 64, 175],  // Azul institucional
    secondary: [71, 85, 105],  // Gris oscuro
    accent: [249, 115, 22],  // Naranja (color del botón de la app)
    light: [248, 250, 252],  // Fondo claro
    border: [226, 232, 240],  // Borde sutil
    white: [255, 255, 255],
    text: [15, 23, 42],
    textLight: [100, 116, 139],
};

// ─── Genera invitación PDF de estilo ejecutivo ─────────────────────────────
function generateInvitacionPDF(event, personal) {
    // Importación dinámica evita error SSR
    const { jsPDF } = require('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentW = W - margin * 2;

    // ── Header band ──────────────────────────────────────────────────────────
    pdf.setFillColor(...PDF_COLORS.primary);
    pdf.rect(0, 0, W, 38, 'F');

    // Franja de acento inferior del header
    pdf.setFillColor(...PDF_COLORS.accent);
    pdf.rect(0, 38, W, 3, 'F');

    // Título en el header
    pdf.setTextColor(...PDF_COLORS.white);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('INVITACIÓN A CURSO DE CAPACITACIÓN', W / 2, 22, { align: 'center' });
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Departamento de Recursos Humanos · Capacitación y Desarrollo', W / 2, 32, { align: 'center' });

    // ── Nombre del curso ─────────────────────────────────────────────────────
    let y = 55;
    pdf.setTextColor(...PDF_COLORS.text);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text(event.title.toUpperCase(), margin, y);
    y += 2;

    // Línea decorativa bajo el nombre
    pdf.setDrawColor(...PDF_COLORS.accent);
    pdf.setLineWidth(0.8);
    pdf.line(margin, y + 3, margin + contentW, y + 3);
    y += 12;

    // ── Bloque de detalles (2 columnas) ───────────────────────────────────────
    const colA = margin;
    const colB = W / 2 + 4;
    const colW = contentW / 2 - 4;

    const drawDetail = (label, value, cx, cy) => {
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...PDF_COLORS.textLight);
        pdf.text(label.toUpperCase(), cx, cy);
        pdf.setFontSize(9.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...PDF_COLORS.text);
        pdf.text(value || '—', cx, cy + 5);
    };

    // Fondo de bloque
    pdf.setFillColor(...PDF_COLORS.light);
    pdf.roundedRect(margin - 2, y - 4, contentW + 4, 52, 3, 3, 'F');
    pdf.setDrawColor(...PDF_COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(margin - 2, y - 4, contentW + 4, 52, 3, 3, 'S');

    // Formatea la fecha
    const dateFormatted = event.date
        ? new Date(event.date + 'T12:00:00').toLocaleDateString('es-MX',
            { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : '—';

    const timeRange = event.startTime && event.endTime
        ? `${event.startTime} – ${event.endTime}`
        : event.startTime || '—';

    drawDetail('Fecha', dateFormatted, colA, y + 4);
    drawDetail('Horario', timeRange, colB, y + 4);
    drawDetail('Duración', event.duration ? `${event.duration} horas` : '—', colA, y + 18);
    drawDetail('Lugar / Sede', event.location, colB, y + 18);
    drawDetail('Instructor', event.instructor, colA, y + 32);
    y += 58;

    // ── Objetivo (si existe) ──────────────────────────────────────────────────
    if (event.objective) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bolditalic');
        pdf.setTextColor(...PDF_COLORS.textLight);
        pdf.text('OBJETIVO DEL CURSO', margin, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...PDF_COLORS.text);
        pdf.setFontSize(9);
        const lines = pdf.splitTextToSize(event.objective, contentW);
        pdf.text(lines, margin, y);
        y += lines.length * 5 + 6;
    }

    // ── Tabla de personal requerido ───────────────────────────────────────────
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...PDF_COLORS.textLight);
    pdf.text('PERSONAL REQUERIDO', margin, y);
    y += 2;

    // Encabezado de tabla
    pdf.setFillColor(...PDF_COLORS.primary);
    pdf.rect(margin, y, contentW, 8, 'F');
    pdf.setTextColor(...PDF_COLORS.white);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('#', margin + 3, y + 5.5);
    pdf.text('ID', margin + 10, y + 5.5);
    pdf.text('Nombre', margin + 28, y + 5.5);
    pdf.text('Puesto', margin + 95, y + 5.5);
    pdf.text('Firma', margin + 152, y + 5.5);
    y += 8;

    if (personal.length === 0) {
        pdf.setFillColor(...PDF_COLORS.light);
        pdf.rect(margin, y, contentW, 10, 'F');
        pdf.setTextColor(...PDF_COLORS.textLight);
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'italic');
        pdf.text('No se especificó personal requerido', W / 2, y + 6.5, { align: 'center' });
        y += 10;
    } else {
        personal.forEach((emp, i) => {
            const rowH = 10;
            const bg = i % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.light;
            pdf.setFillColor(...bg);
            pdf.rect(margin, y, contentW, rowH, 'F');

            pdf.setTextColor(...PDF_COLORS.text);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text(String(i + 1), margin + 3, y + 6.5);
            pdf.text(emp.employeeId ?? '—', margin + 10, y + 6.5);
            pdf.text(emp.name ?? '—', margin + 28, y + 6.5);
            const position = pdf.splitTextToSize(emp.position ?? '—', 50);
            pdf.text(position, margin + 95, y + 6.5);

            // Línea de firma
            pdf.setDrawColor(...PDF_COLORS.border);
            pdf.setLineWidth(0.3);
            pdf.line(margin + 152, y + 8.5, margin + contentW - 2, y + 8.5);

            y += rowH;
        });
    }

    // Borde exterior tabla
    pdf.setDrawColor(...PDF_COLORS.border);
    pdf.setLineWidth(0.3);
    const tableTop = y - (Math.max(personal.length, 1) * 10) - 8;
    pdf.rect(margin, tableTop, contentW, y - tableTop, 'S');

    // ── Sección de autorización ───────────────────────────────────────────────
    y += 12;
    if (y > H - 55) { pdf.addPage(); y = 20; }

    pdf.setFillColor(...PDF_COLORS.light);
    pdf.roundedRect(margin - 2, y - 4, contentW + 4, 40, 3, 3, 'F');

    const signCols = [margin + 10, W / 2 + 4];
    const signLabels = [
        ['Firma del Responsable / Instructor', 'Nombre y Puesto'],
        ['Autorización RRHH / Capacitación', 'Nombre y Puesto']
    ];
    signLabels.forEach(([title, subtitle], ci) => {
        const sx = signCols[ci];
        pdf.setDrawColor(...PDF_COLORS.secondary);
        pdf.setLineWidth(0.4);
        pdf.line(sx, y + 25, sx + 75, y + 25);
        pdf.setFontSize(7.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...PDF_COLORS.text);
        pdf.text(title, sx, y + 30);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...PDF_COLORS.textLight);
        pdf.text(subtitle, sx, y + 35);
    });
    y += 44;

    // ── Footer ────────────────────────────────────────────────────────────────
    pdf.setFillColor(...PDF_COLORS.primary);
    pdf.rect(0, H - 14, W, 14, 'F');
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...PDF_COLORS.white);
    const folio = `Folio: CAP-${Date.now().toString().slice(-6)}`;
    const generated = `Generado: ${new Date().toLocaleString('es-MX')}`;
    pdf.text(folio, margin, H - 5);
    pdf.text(generated, W - margin, H - 5, { align: 'right' });

    // ── Descarga ──────────────────────────────────────────────────────────────
    const safeName = event.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    pdf.save(`Invitacion_${safeName}_${event.date}.pdf`);
}


export default function CalendarPage() {
    const { user, loading: authLoading, canWrite } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [date, setDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [detailModal, setDetailModal] = useState(null);
    const [newEvent, setNewEvent] = useState(EMPTY_EVENT);

    // Personal requerido
    const [personalList, setPersonalList] = useState([]);
    const [personalIdInput, setPersonalIdInput] = useState('');
    const [searchingPersonal, setSearchingPersonal] = useState(false);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const [activeProposal, setActiveProposal] = useState(0);

    // Calendar days
    const [calendarDays, setCalendarDays] = useState([]);

    useEffect(() => {
        generateCalendar();
        loadEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date]);

    // Cursos únicos realizados en el mes visualizado (hook antes del early return)
    const uniqueDoneThisMonth = useMemo(() => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const names = new Set(
            events
                .filter(e => {
                    if (e.type !== 'DONE') return false;
                    const d = new Date(e.date);
                    return d.getFullYear() === year && d.getMonth() === month;
                })
                .map(e => (e.courseName || e.title || '').trim().toUpperCase())
        );
        return names.size;
    }, [events, date]);

    // Auth Protection
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);


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

    // Buscar empleado por ID para personal requerido
    const handleSearchPersonal = useCallback(async () => {
        const id = personalIdInput.trim();
        if (!id) return;
        if (personalList.some(p => (p.employeeId ?? p.id) === id)) {
            toast.warning('Duplicado', 'Este empleado ya está en la lista');
            return;
        }
        setSearchingPersonal(true);
        try {
            const directSnap = await getDoc(doc(db, 'training_records', id));
            if (directSnap.exists()) {
                setPersonalList(prev => [...prev, { id: directSnap.id, ...directSnap.data() }]);
                setPersonalIdInput('');
                return;
            }
            const q = query(collection(db, 'training_records'), where('employeeId', '==', id));
            const snap = await getDocs(q);
            if (!snap.empty) {
                setPersonalList(prev => [...prev, { id: snap.docs[0].id, ...snap.docs[0].data() }]);
                setPersonalIdInput('');
            } else {
                toast.warning('No encontrado', `No existe empleado con ID ${id}`);
            }
        } catch (err) {
            console.error('[CalendarPage] handleSearchPersonal:', err);
            toast.error('Error', 'No se pudo buscar el empleado');
        } finally {
            setSearchingPersonal(false);
        }
    }, [personalIdInput, personalList, toast]);

    const removePersonal = (empId) =>
        setPersonalList(prev => prev.filter(p => (p.employeeId ?? p.id) !== empId));

    // ── Handlers de sesiones ──────────────────────────────────────────────────
    const addSession = useCallback((proposalIdx) => {
        setNewEvent(prev => {
            const proposals = prev.proposals.map((p, i) =>
                i === proposalIdx
                    ? { ...p, sessions: [...p.sessions, { ...EMPTY_SESSION }] }
                    : p
            );
            return { ...prev, proposals };
        });
    }, []);

    const removeSession = useCallback((proposalIdx, sessionIdx) => {
        setNewEvent(prev => {
            const proposals = prev.proposals.map((p, i) =>
                i === proposalIdx
                    ? { ...p, sessions: p.sessions.filter((_, si) => si !== sessionIdx) }
                    : p
            );
            return { ...prev, proposals };
        });
    }, []);

    const updateSession = useCallback((proposalIdx, sessionIdx, field, value) => {
        setNewEvent(prev => {
            const proposals = prev.proposals.map((p, i) =>
                i === proposalIdx
                    ? {
                        ...p,
                        sessions: p.sessions.map((s, si) =>
                            si === sessionIdx ? { ...s, [field]: value } : s
                        ),
                    }
                    : p
            );
            return { ...prev, proposals };
        });
    }, []);

    const handleCreateEvent = async () => {
        if (!canWrite()) {
            toast.error('Acceso Denegado', 'Tu rol no permite crear eventos.');
            return;
        }
        if (!newEvent.title) {
            toast.warning('Campos requeridos', 'El nombre del curso es obligatorio');
            return;
        }
        try {
            await addDoc(collection(db, 'calendar_events'), {
                title: newEvent.title,
                instructor: newEvent.instructor,
                location: newEvent.location,
                duration: newEvent.duration,
                objective: newEvent.objective,
                proposals: newEvent.proposals.map(p => ({
                    label: p.label,
                    sessions: p.sessions.filter(s => s.date),
                })),
                personal: personalList.map(p => ({
                    employeeId: p.employeeId ?? p.id,
                    name: p.name,
                    position: p.position,
                })),
                createdAt: new Date(),
            });
            toast.success('Evento Creado', newEvent.title);
            setCreateModalOpen(false);
            setNewEvent(EMPTY_EVENT);
            setPersonalList([]);
            setActiveProposal(0);
            loadEvents();
        } catch (e) {
            console.error('[CalendarPage] handleCreateEvent:', e);
            toast.error('Error al guardar', 'Intenta de nuevo');
        }
    };

    const handleGeneratePDF = useCallback(() => {
        if (!newEvent.title) {
            toast.warning('Campos requeridos', 'Completa el nombre del curso antes de generar el PDF');
            return;
        }
        setGeneratingPDF(true);
        try {
            generateInvitacionPDF(newEvent, personalList);
        } finally {
            setGeneratingPDF(false);
        }
    }, [newEvent, personalList, toast]);

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

    // Early return de auth — DEBE ir después de todos los hooks
    if (authLoading || !user) {
        return (
            <div className={styles.main}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={styles.profileContainer}>
                <ProfileDropdown />
            </div>
            <main className={styles.main} id="main-content">
                <div className={styles.container}>
                    {/* Header */}
                    <div className={styles.headerSection}>
                        <BackButton href="/capacitacion" />
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

                    {/* Legend + Contador */}
                    <div className={styles.legend} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div className={styles.legendItem}>
                            <span className={styles.dotDone}></span>
                            <span>Realizado</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '999px', padding: '4px 14px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-success, #22c55e)' }}>{uniqueDoneThisMonth}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>curso{uniqueDoneThisMonth !== 1 ? 's' : ''} impartido{uniqueDoneThisMonth !== 1 ? 's' : ''} este mes</span>
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

                                    {stats.done > 0 && (
                                        <div className={styles.dayStats}>
                                            <div className={styles.statBadge + ' ' + styles.statDone}>
                                                <span className={styles.dotDone}></span>
                                                {stats.done}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            {/* ── Modal: Agendar Curso ──────────────────────────────────── */}
            <Dialog
                open={createModalOpen}
                onOpenChange={(open) => { if (!open) { setCreateModalOpen(false); setNewEvent(EMPTY_EVENT); setPersonalList([]); } }}
            >
                <DialogHeader>
                    <DialogTitle>Agendar Curso</DialogTitle>
                    <DialogClose onClose={() => { setCreateModalOpen(false); setNewEvent(EMPTY_EVENT); setPersonalList([]); }} />
                </DialogHeader>
                <DialogBody>
                    <div className={styles.formStack}>

                        {/* Nombre */}
                        <div className={styles.formGroup}>
                            <label htmlFor="ev-title" className={styles.label}>Nombre del Curso *</label>
                            <input
                                id="ev-title"
                                type="text"
                                className={styles.input}
                                value={newEvent.title}
                                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                placeholder="Ej. Curso de Alturas – Grupo A"
                                autoFocus
                            />
                        </div>

                        {/* ── Tabs Propuesta 1 / Propuesta 2 ── */}
                        <div className={styles.formGroup}>
                            <span className={styles.label}>Sesiones por propuesta</span>

                            {/* Tab bar */}
                            <div className={styles.proposalTabs} role="tablist">
                                {newEvent.proposals.map((prop, pi) => (
                                    <button
                                        key={pi}
                                        role="tab"
                                        type="button"
                                        aria-selected={activeProposal === pi}
                                        className={`${styles.proposalTab} ${activeProposal === pi ? styles.proposalTabActive : ''}`}
                                        onClick={() => setActiveProposal(pi)}
                                    >
                                        {prop.label}
                                        <span className={styles.sessionCount}>
                                            {prop.sessions.filter(s => s.date).length} ses.
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Sesiones de la propuesta activa */}
                            {newEvent.proposals.map((prop, pi) => (
                                <div
                                    key={pi}
                                    role="tabpanel"
                                    hidden={activeProposal !== pi}
                                    className={styles.sessionPanel}
                                >
                                    {prop.sessions.map((sess, si) => (
                                        <div key={si} className={styles.sessionRow}>
                                            <span className={styles.sessionNum}>{si + 1}</span>
                                            <input
                                                type="date"
                                                className={styles.input}
                                                value={sess.date}
                                                onChange={e => updateSession(pi, si, 'date', e.target.value)}
                                                aria-label={`Fecha sesión ${si + 1}`}
                                            />
                                            <input
                                                type="time"
                                                className={styles.input}
                                                value={sess.startTime}
                                                onChange={e => updateSession(pi, si, 'startTime', e.target.value)}
                                                aria-label={`Hora inicio sesión ${si + 1}`}
                                            />
                                            <input
                                                type="time"
                                                className={styles.input}
                                                value={sess.endTime}
                                                onChange={e => updateSession(pi, si, 'endTime', e.target.value)}
                                                aria-label={`Hora fin sesión ${si + 1}`}
                                            />
                                            <button
                                                type="button"
                                                className={styles.removeSessionBtn}
                                                onClick={() => removeSession(pi, si)}
                                                disabled={prop.sessions.length === 1}
                                                aria-label="Eliminar sesión"
                                            >
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className={styles.addSessionBtn}
                                        onClick={() => addSession(pi)}
                                    >
                                        + Agregar sesión
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Instructor + Lugar */}
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label htmlFor="ev-instructor" className={styles.label}>Instructor</label>
                                <input id="ev-instructor" type="text" className={styles.input}
                                    value={newEvent.instructor}
                                    onChange={e => setNewEvent({ ...newEvent, instructor: e.target.value })}
                                    placeholder="Nombre del instructor" />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="ev-location" className={styles.label}>Lugar / Sede</label>
                                <input id="ev-location" type="text" className={styles.input}
                                    value={newEvent.location}
                                    onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                                    placeholder="Sala de juntas, Planta baja…" />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="ev-duration" className={styles.label}>Duración (h)</label>
                                <input id="ev-duration" type="number" min="0.5" step="0.5" className={styles.input}
                                    value={newEvent.duration}
                                    onChange={e => setNewEvent({ ...newEvent, duration: e.target.value })}
                                    placeholder="8" />
                            </div>
                        </div>

                        {/* Objetivo */}
                        <div className={styles.formGroup}>
                            <label htmlFor="ev-objective" className={styles.label}>Objetivo (opcional)</label>
                            <textarea id="ev-objective" className={`${styles.input} ${styles.textarea}`}
                                rows={2}
                                value={newEvent.objective}
                                onChange={e => setNewEvent({ ...newEvent, objective: e.target.value })}
                                placeholder="Capacitar al personal en…" />
                        </div>

                        {/* Personal requerido */}
                        <div className={styles.formGroup}>
                            <span className={styles.label}>Personal requerido ({personalList.length})</span>
                            <div className={styles.personalSearchRow}>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={personalIdInput}
                                    onChange={e => setPersonalIdInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearchPersonal(); } }}
                                    placeholder="ID de empleado — Enter para agregar"
                                />
                                <button
                                    type="button"
                                    className={styles.addPersonalBtn}
                                    onClick={handleSearchPersonal}
                                    disabled={searchingPersonal}
                                    aria-label="Agregar empleado"
                                >
                                    {searchingPersonal ? '…' : <UserPlus size={16} />}
                                </button>
                            </div>

                            {personalList.length > 0 && (
                                <ul className={styles.personalList} role="list">
                                    {personalList.map(emp => {
                                        const empId = emp.employeeId ?? emp.id;
                                        return (
                                            <li key={empId} className={styles.personalItem}>
                                                <div className={styles.personalAvatar}>
                                                    {(emp.name ?? '?')[0].toUpperCase()}
                                                </div>
                                                <div className={styles.personalInfo}>
                                                    <span className={styles.personalName}>{emp.name}</span>
                                                    <span className={styles.personalMeta}>{empId} · {emp.position ?? '—'}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={styles.removePersonalBtn}
                                                    onClick={() => removePersonal(empId)}
                                                    aria-label={`Quitar a ${emp.name}`}
                                                >
                                                    <X size={13} />
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => { setCreateModalOpen(false); setNewEvent(EMPTY_EVENT); setPersonalList([]); }}>Cancelar</Button>
                    <Button variant="secondary" onClick={handleGeneratePDF} disabled={generatingPDF}>
                        <Download size={15} />
                        {generatingPDF ? 'Generando…' : 'Vista previa PDF'}
                    </Button>
                    <Button variant="primary" onClick={handleCreateEvent}>Guardar</Button>
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
