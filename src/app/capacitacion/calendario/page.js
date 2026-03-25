'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { Button } from '@/components/ui/Button/Button';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { Pencil, Download, X, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast/Toast';
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

// ─── Paleta ejecutiva del PDF (centralizada — cero valores hardcodeados fuera de aquí) ─
const PDF_COLORS = {
    black: [15, 23, 42],   // Texto principal
    dark: [51, 65, 85],   // Texto secundario / etiquetas
    mid: [100, 116, 139],  // Texto terciario / subtítulos
    border: [203, 213, 225],  // Líneas y bordes
    rowAlt: [248, 250, 252],  // Fila alternada (muy sutil)
    white: [255, 255, 255],  // Fondo blanco
    accent: [30, 64, 175],  // Acento institucional (solo header y línea)
};

// ─── Genera invitación PDF de estilo ejecutivo ─────────────────────────────
function generateInvitacionPDF(event, personal) {
    const { jsPDF } = require('jspdf');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentW = W - margin * 2;

    // ── Helper: hora 24h → 12h ────────────────────────────────────────────
    const fmt12h = (t) => {
        if (!t) return '—';
        const [hRaw, mRaw = '00'] = t.split(':');
        const h = parseInt(hRaw, 10);
        const per = h >= 12 ? 'p.m.' : 'a.m.';
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${h12}:${mRaw} ${per} `;
    };

    // ── Helper: dibuja campo etiqueta + valor ─────────────────────────────
    const drawField = (label, value, cx, cy) => {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...PDF_COLORS.mid);
        pdf.text(label.toUpperCase(), cx, cy);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...PDF_COLORS.black);
        pdf.text(value || '—', cx, cy + 5);
    };

    // ── Header minimalista ────────────────────────────────────────────────
    // Banda superior delgada (acento)
    pdf.setFillColor(...PDF_COLORS.accent);
    pdf.rect(0, 0, W, 1.5, 'F');

    // Fondo blanco del header
    pdf.setFillColor(...PDF_COLORS.white);
    pdf.rect(0, 1.5, W, 34, 'F');

    // Título y subtítulo
    pdf.setTextColor(...PDF_COLORS.black);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('INVITACIÓN A CURSO DE CAPACITACIÓN', W / 2, 16, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...PDF_COLORS.mid);
    pdf.text('Departamento de Recursos Humanos · Capacitación y Desarrollo', W / 2, 24, { align: 'center' });

    // Línea separadora bajo el header
    pdf.setDrawColor(...PDF_COLORS.border);
    pdf.setLineWidth(0.4);
    pdf.line(0, 35.5, W, 35.5);

    // ── Nombre del curso ──────────────────────────────────────────────────
    let y = 48;
    pdf.setTextColor(...PDF_COLORS.black);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(event.title.toUpperCase(), margin, y);
    y += 2;

    // Línea fina bajo el nombre (acento)
    pdf.setDrawColor(...PDF_COLORS.accent);
    pdf.setLineWidth(0.6);
    pdf.line(margin, y + 3, margin + contentW, y + 3);
    y += 12;

    // ── Bloque de detalles: Instructor / Lugar / Duración ─────────────────
    // borde sutil alrededor del bloque
    pdf.setDrawColor(...PDF_COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.setFillColor(...PDF_COLORS.white);
    pdf.roundedRect(margin - 2, y - 4, contentW + 4, 32, 2, 2, 'FD');

    const colA = margin + 2;
    const colB = W / 2 + 4;

    drawField('Instructor', event.instructor || '—', colA, y + 4);
    drawField('Lugar / Sede', event.location || '—', colB, y + 4);
    drawField('Duración', event.duration ? `${event.duration} h` : '—', colA, y + 18);
    y += 38;

    // ── Objetivo ──────────────────────────────────────────────────────────
    if (event.objective) {
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...PDF_COLORS.mid);
        pdf.text('OBJETIVO DEL CURSO', margin, y);
        y += 5;
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...PDF_COLORS.black);
        pdf.setFontSize(9);
        const objLines = pdf.splitTextToSize(event.objective, contentW);
        pdf.text(objLines, margin, y);
        y += objLines.length * 5 + 6;
    }

    // ── Propuestas de horario ─────────────────────────────────────────────
    const proposals = event.proposals ?? [];
    const validProposals = proposals.filter(p => p.sessions?.some(s => s.date));

    validProposals.forEach((prop, pi) => {
        if (y > H - 60) { pdf.addPage(); y = 20; }

        // Separador entre propuestas
        if (pi > 0) { y += 4; }

        // Etiqueta de propuesta — solo texto con línea lateral
        pdf.setDrawColor(...PDF_COLORS.accent);
        pdf.setLineWidth(1.5);
        pdf.line(margin, y + 3, margin, y + 10);
        pdf.setLineWidth(0.3);

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...PDF_COLORS.black);
        const propLabel = prop.label ? prop.label.toUpperCase() : `PROPUESTA ${pi + 1} `;
        pdf.text(propLabel, margin + 4, y + 8);
        y += 14;

        // Encabezado de columnas
        pdf.setFillColor(...PDF_COLORS.rowAlt);
        pdf.rect(margin, y, contentW, 7, 'F');
        pdf.setDrawColor(...PDF_COLORS.border);
        pdf.setLineWidth(0.3);
        pdf.rect(margin, y, contentW, 7, 'S');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(...PDF_COLORS.mid);
        pdf.text('#', margin + 3, y + 4.8);
        pdf.text('FECHA', margin + 14, y + 4.8);
        pdf.text('INICIO', margin + 110, y + 4.8);
        pdf.text('FIN', margin + 140, y + 4.8);
        y += 7;

        const sessionsWithDate = prop.sessions.filter(s => s.date);
        sessionsWithDate.forEach((sess, si) => {
            const isAlt = si % 2 !== 0;
            if (isAlt) {
                pdf.setFillColor(...PDF_COLORS.rowAlt);
                pdf.rect(margin, y, contentW, 8, 'F');
            }

            const dateStr = new Date(sess.date + 'T12:00:00').toLocaleDateString('es-MX',
                { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8.5);
            pdf.setTextColor(...PDF_COLORS.black);
            pdf.text(String(si + 1), margin + 3, y + 5.5);
            pdf.text(dateStr, margin + 14, y + 5.5);
            pdf.text(fmt12h(sess.startTime), margin + 110, y + 5.5);
            pdf.text(fmt12h(sess.endTime), margin + 140, y + 5.5);

            // Línea inferior de fila
            pdf.setDrawColor(...PDF_COLORS.border);
            pdf.setLineWidth(0.15);
            pdf.line(margin, y + 8, margin + contentW, y + 8);

            y += 8;
        });

        // Borde exterior de la tabla
        const tblTop = y - sessionsWithDate.length * 8 - 7;
        pdf.setDrawColor(...PDF_COLORS.border);
        pdf.setLineWidth(0.3);
        pdf.rect(margin, tblTop, contentW, y - tblTop, 'S');
        y += 6;
    });

    // ── Personal requerido ────────────────────────────────────────────────
    if (y > H - 60) { pdf.addPage(); y = 20; }
    y += 2;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(...PDF_COLORS.mid);
    pdf.text('PERSONAL REQUERIDO', margin, y);
    y += 4;

    // Encabezado de tabla
    pdf.setFillColor(...PDF_COLORS.rowAlt);
    pdf.rect(margin, y, contentW, 8, 'F');
    pdf.setDrawColor(...PDF_COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.rect(margin, y, contentW, 8, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(...PDF_COLORS.mid);
    pdf.text('#', margin + 3, y + 5.5);
    pdf.text('ID', margin + 12, y + 5.5);
    pdf.text('NOMBRE', margin + 32, y + 5.5);
    pdf.text('PUESTO', margin + 100, y + 5.5);
    y += 8;

    if (personal.length === 0) {
        pdf.setFillColor(...PDF_COLORS.white);
        pdf.rect(margin, y, contentW, 10, 'F');
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8.5);
        pdf.setTextColor(...PDF_COLORS.mid);
        pdf.text('Sin personal especificado', W / 2, y + 6.5, { align: 'center' });
        y += 10;
    } else {
        personal.forEach((emp, i) => {
            if (i % 2 !== 0) {
                pdf.setFillColor(...PDF_COLORS.rowAlt);
                pdf.rect(margin, y, contentW, 10, 'F');
            }
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.setTextColor(...PDF_COLORS.black);
            pdf.text(String(i + 1), margin + 3, y + 6.5);
            pdf.text(emp.employeeId ?? '—', margin + 12, y + 6.5);
            pdf.text(emp.name ?? '—', margin + 32, y + 6.5);
            const pos = pdf.splitTextToSize(emp.position ?? '—', 52);
            pdf.text(pos, margin + 100, y + 6.5);

            // Divisor de fila
            pdf.setLineWidth(0.15);
            pdf.line(margin, y + 10, margin + contentW, y + 10);
            y += 10;
        });
    }

    // Borde exterior
    const tblTop = y - Math.max(personal.length, 1) * 10 - 8;
    pdf.setDrawColor(...PDF_COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.rect(margin, tblTop, contentW, y - tblTop, 'S');

    // ── Descarga ──────────────────────────────────────────────────────────
    const safeName = event.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
    pdf.save(`Invitacion_${safeName}.pdf`);
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
    const [editingEventId, setEditingEventId] = useState(null);

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
        } else if (!authLoading && user && (user.rol === 'demo' || user.email?.includes('demo'))) {
            router.push('/induccion');
        }
    }, [user, authLoading, router]);


    const generateCalendar = () => {
        const year = date.getFullYear();
        const month = date.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];
        // Si el mes empieza en Domingo (0), no hay celdas del mes anterior de Lunes a Sábado, así que el padding es 0.
        let startPadding = firstDay.getDay() === 0 ? 0 : firstDay.getDay() - 1;
        const totalDays = lastDay.getDate();

        for (let i = 0; i < startPadding; i++) {
            days.push(null);
        }

        for (let i = 1; i <= totalDays; i++) {
            const d = new Date(year, month, i);
            if (d.getDay() !== 0) { // Omitir domingo
                days.push(d);
            }
        }

        // Padding final para completar la fila de 6 días (Lunes - Sábado)
        const remainder = days.length % 6;
        if (remainder !== 0) {
            const endPadding = 6 - remainder;
            for (let i = 0; i < endPadding; i++) {
                days.push(null);
            }
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
                // Guardamos el documento completo para poder editar
                const firstSession = d.proposals?.[0]?.sessions?.[0];
                tempEvents.push({
                    id: docSnap.id,
                    type: 'PLANNED',
                    title: d.title,
                    date: firstSession?.date ?? d.date ?? '',
                    courseName: d.title,
                    employeeName: null,
                    // datos completos para edición
                    _raw: d,
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
                toast.warning('No encontrado', `No existe empleado con ID ${id} `);
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

    // Abre el modal de edición precargado con datos del evento existente
    const openEditModal = useCallback((ev) => {
        const raw = ev._raw ?? {};
        setNewEvent({
            title: raw.title ?? '',
            instructor: raw.instructor ?? '',
            location: raw.location ?? '',
            duration: raw.duration ?? '',
            objective: raw.objective ?? '',
            proposals: (raw.proposals ?? []).length > 0
                ? raw.proposals.map(p => ({
                    label: p.label ?? 'Propuesta',
                    sessions: (p.sessions ?? []).length > 0 ? p.sessions : [{ ...EMPTY_SESSION }],
                }))
                : EMPTY_EVENT.proposals.map(p => ({ ...p, sessions: [{ ...EMPTY_SESSION }] })),
        });
        setPersonalList(
            (raw.personal ?? []).map(p => ({
                id: p.employeeId,
                employeeId: p.employeeId,
                name: p.name,
                position: p.position,
            }))
        );
        setEditingEventId(ev.id);
        setActiveProposal(0);
        setCreateModalOpen(true);
        setDetailModal(null); // cierra el detail modal
    }, []);

    // Cierra y limpia el modal (tanto nuevo como edición)
    const closeModal = useCallback(() => {
        setCreateModalOpen(false);
        setNewEvent(EMPTY_EVENT);
        setPersonalList([]);
        setEditingEventId(null);
        setActiveProposal(0);
    }, []);

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
        const payload = {
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
        };
        try {
            if (editingEventId) {
                await updateDoc(doc(db, 'calendar_events', editingEventId), payload);
                toast.success('Curso Actualizado', newEvent.title);
            } else {
                await addDoc(collection(db, 'calendar_events'), { ...payload, createdAt: new Date() });
                toast.success('Evento Creado', newEvent.title);
            }
            closeModal();
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

    // Genera PDF directamente desde un evento guardado en el detail modal
    const handleGeneratePDFForEvent = useCallback((ev) => {
        const raw = ev._raw ?? {};
        const eventData = {
            title: raw.title ?? ev.title ?? '',
            instructor: raw.instructor ?? '',
            location: raw.location ?? '',
            duration: raw.duration ?? '',
            objective: raw.objective ?? '',
            proposals: raw.proposals ?? [],
        };
        const personal = (raw.personal ?? []);
        generateInvitacionPDF(eventData, personal);
    }, []);

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
            <AdminLayout title="Calendario">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Calendario de Capacitación">
            <div className={styles.container}>
                {/* Header Unificado */}
                <div className={styles.headerSection}>
                    <div className={styles.header}>
                        <div className={styles.legendRow}>
                            <div className={styles.legendItem}>
                                <span className={styles.dotDone}></span>
                                <span style={{ fontWeight: 600 }}>Realizado</span>
                            </div>
                            <div className={styles.doneBadge}>
                                <span className={styles.doneCount}>{uniqueDoneThisMonth}</span>
                                <span>curso{uniqueDoneThisMonth !== 1 ? 's' : ''} este mes</span>
                            </div>
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

                {/* Calendar Grid */}
                <div className={styles.grid}>
                    {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'].map(d => (
                        <div key={d} className={styles.dayHeader}>{d}</div>
                    ))}

                    {calendarDays.map((day, idx) => {
                        if (!day) return <div key={`empty - ${idx} `} className={styles.emptyCell}></div>;

                        const dateStr = day.toISOString().split('T')[0];
                        const isToday = dateStr === todayStr;
                        const stats = getDayStats(day);

                        return (
                            <div
                                key={idx}
                                className={`${styles.dayCell} ${isToday ? styles.today : ''} ${stats.total > 0 ? styles.hasEvents : ''} `}
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
                                        className={`${styles.proposalTab} ${activeProposal === pi ? styles.proposalTabActive : ''} `}
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
                                    className={`${styles.sessionPanel} ${activeProposal !== pi ? styles.sessionPanelHidden : ''} `}
                                >
                                    {prop.sessions.map((sess, si) => (
                                        <div key={si} className={styles.sessionRow}>
                                            <span className={styles.sessionNum}>{si + 1}</span>
                                            <input
                                                type="date"
                                                className={styles.input}
                                                value={sess.date}
                                                onChange={e => updateSession(pi, si, 'date', e.target.value)}
                                                aria-label={`Fecha sesión ${si + 1} `}
                                            />
                                            <input
                                                type="time"
                                                className={styles.input}
                                                value={sess.startTime}
                                                onChange={e => updateSession(pi, si, 'startTime', e.target.value)}
                                                aria-label={`Hora inicio sesión ${si + 1} `}
                                            />
                                            <input
                                                type="time"
                                                className={styles.input}
                                                value={sess.endTime}
                                                onChange={e => updateSession(pi, si, 'endTime', e.target.value)}
                                                aria-label={`Hora fin sesión ${si + 1} `}
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
                            <textarea id="ev-objective" className={`${styles.input} ${styles.textarea} `}
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
                                                    aria-label={`Quitar a ${emp.name} `}
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
                    <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
                    <Button variant="secondary" onClick={handleGeneratePDF} disabled={generatingPDF}>
                        <Download size={15} />
                        {generatingPDF ? 'Generando…' : 'Vista previa PDF'}
                    </Button>
                    <Button variant="primary" onClick={handleCreateEvent}>
                        {editingEventId ? 'Actualizar' : 'Guardar'}
                    </Button>
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
                                                                {ev.score && ` • ${ev.score}% `}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {type === 'PLANNED' && canWrite() && (
                                                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                                                            <button
                                                                className={styles.editBtn}
                                                                onClick={() => openEditModal(ev)}
                                                                aria-label={`Editar ${ev.title} `}
                                                                title="Editar curso"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                className={styles.editBtn}
                                                                onClick={() => handleGeneratePDFForEvent(ev)}
                                                                aria-label={`PDF ${ev.title} `}
                                                                title="Descargar PDF"
                                                            >
                                                                <Download size={14} />
                                                            </button>
                                                            <button
                                                                className={styles.deleteBtn}
                                                                onClick={() => handleDeleteEvent(ev.id)}
                                                                aria-label={`Eliminar ${ev.title} `}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        </div>
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
        </AdminLayout>

    );
}
