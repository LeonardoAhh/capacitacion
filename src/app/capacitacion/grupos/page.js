'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, BookOpen, ChevronDown, ChevronUp,
    Search, Trash2, Edit2, X, Check, Shield
} from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import BackButton from '@/components/ui/BackButton/BackButton';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
    Dialog, DialogHeader, DialogTitle,
    DialogBody, DialogFooter, DialogClose
} from '@/components/ui/Dialog/Dialog';
import {
    collection, getDocs, doc, getDoc,
    addDoc, updateDoc, deleteDoc,
    query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import styles from './page.module.css';

// â”€â”€â”€ Constantes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const GROUP_COLORS = [
    { id: 'blue', label: 'Azul' },
    { id: 'green', label: 'Verde' },
    { id: 'purple', label: 'Morado' },
    { id: 'orange', label: 'Naranja' },
    { id: 'rose', label: 'Rosa' },
    { id: 'teal', label: 'Teal' },
];

const EMPTY_FORM = { name: '', description: '', color: 'blue', requiredCourses: [] };

// Normaliza strings para comparaciÃ³n (sin tildes, uppercase)
const normalize = (s) =>
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();

// â”€â”€â”€ Componente principal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function GruposPage() {
    const { user, loading: authLoading, canWrite } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    // â€” Datos
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [memberDetails, setMemberDetails] = useState({}); // { groupId: [record...] }
    const [expandedGroup, setExpandedGroup] = useState(null);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // â€” Modal: crear / editar grupo
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [groupForm, setGroupForm] = useState(EMPTY_FORM);
    const [courseInput, setCourseInput] = useState('');
    const [saving, setSaving] = useState(false);

    // â€” Modal: agregar miembro
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [memberGroupId, setMemberGroupId] = useState(null);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberSearchResult, setMemberSearchResult] = useState(null);
    const [memberSearching, setMemberSearching] = useState(false);

    // â€” Modal: confirmaciÃ³n de borrado
    const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'group'|'member', groupId, empId? }

    // â”€â”€ Auth guard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
        else if (user) loadGroups();
    }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    // â”€â”€ Carga de grupos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const loadGroups = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, 'groups'), orderBy('name')));
            setGroups(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error('[GruposPage] loadGroups:', err);
            toast.error('Error', 'No se pudieron cargar los grupos');
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // â”€â”€ Expandir grupo â†’ cargar detalle de miembros â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleExpand = useCallback(async (group) => {
        const isOpen = expandedGroup === group.id;
        setExpandedGroup(isOpen ? null : group.id);
        if (isOpen || memberDetails[group.id] !== undefined) return;

        setLoadingMembers(true);
        try {
            const members = group.members ?? [];
            if (!members.length) {
                setMemberDetails((prev) => ({ ...prev, [group.id]: [] }));
                return;
            }
            const records = await Promise.all(
                members.map(async (empId) => {
                    // Intento directo por docId
                    const directSnap = await getDoc(doc(db, 'training_records', empId));
                    if (directSnap.exists()) return { id: directSnap.id, ...directSnap.data() };

                    // Fallback: buscar por campo employeeId
                    const q = query(collection(db, 'training_records'), where('employeeId', '==', empId));
                    const snap = await getDocs(q);
                    if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() };

                    return { id: empId, notFound: true };
                })
            );
            setMemberDetails((prev) => ({ ...prev, [group.id]: records }));
        } catch (err) {
            console.error('[GruposPage] handleExpand:', err);
        } finally {
            setLoadingMembers(false);
        }
    }, [expandedGroup, memberDetails]);

    // â”€â”€ Cumplimiento por miembro â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const getMemberCompliance = useCallback((emp, requiredCourses) => {
        if (!emp || emp.notFound || !requiredCourses.length) {
            return { approved: 0, total: requiredCourses.length, pct: 0 };
        }
        const history = emp.history ?? [];
        const approvedCount = requiredCourses.filter((course) =>
            history.some((h) => {
                const score = parseFloat(h.score) || 0;
                return normalize(h.courseName) === normalize(course) &&
                    (h.status === 'approved' || score >= 80);
            })
        ).length;
        return {
            approved: approvedCount,
            total: requiredCourses.length,
            pct: Math.round((approvedCount / requiredCourses.length) * 100),
        };
    }, []);

    // â”€â”€ CRUD de grupos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const openCreateGroup = () => {
        setEditingGroup(null);
        setGroupForm(EMPTY_FORM);
        setCourseInput('');
        setShowGroupModal(true);
    };

    const openEditGroup = (group) => {
        setEditingGroup(group);
        setGroupForm({
            name: group.name,
            description: group.description ?? '',
            color: group.color ?? 'blue',
            requiredCourses: group.requiredCourses ?? [],
        });
        setCourseInput('');
        setShowGroupModal(true);
    };

    const handleAddCourse = () => {
        const trimmed = courseInput.trim();
        if (!trimmed) return;
        if (!groupForm.requiredCourses.includes(trimmed)) {
            setGroupForm((f) => ({
                ...f,
                requiredCourses: [...f.requiredCourses, trimmed].sort(),
            }));
        }
        setCourseInput('');
    };

    const handleRemoveCourse = (course) =>
        setGroupForm((f) => ({
            ...f,
            requiredCourses: f.requiredCourses.filter((c) => c !== course),
        }));

    const handleSaveGroup = async () => {
        if (!groupForm.name.trim()) {
            toast.error('Error', 'El nombre del grupo es requerido');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                name: groupForm.name.trim().toUpperCase(),
                description: groupForm.description.trim(),
                color: groupForm.color,
                requiredCourses: groupForm.requiredCourses,
                updatedAt: serverTimestamp(),
            };
            if (editingGroup) {
                await updateDoc(doc(db, 'groups', editingGroup.id), payload);
                toast.success('Guardado', 'Grupo actualizado correctamente');
            } else {
                await addDoc(collection(db, 'groups'), {
                    ...payload,
                    members: [],
                    createdAt: serverTimestamp(),
                });
                toast.success('Creado', 'Grupo creado correctamente');
            }
            setShowGroupModal(false);
            setMemberDetails({});
            loadGroups();
        } catch (err) {
            console.error('[GruposPage] handleSaveGroup:', err);
            toast.error('Error', 'No se pudo guardar el grupo');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteGroup = async () => {
        if (!confirmDelete || confirmDelete.type !== 'group') return;
        try {
            await deleteDoc(doc(db, 'groups', confirmDelete.groupId));
            toast.success('Eliminado', 'Grupo eliminado');
            setConfirmDelete(null);
            loadGroups();
        } catch (err) {
            toast.error('Error', 'No se pudo eliminar el grupo');
        }
    };

    // â”€â”€ GestiÃ³n de miembros â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const openAddMember = (groupId) => {
        setMemberGroupId(groupId);
        setMemberSearch('');
        setMemberSearchResult(null);
        setShowMemberModal(true);
    };

    const handleSearchMember = useCallback(async () => {
        const id = memberSearch.trim();
        if (!id) return;
        setMemberSearching(true);
        setMemberSearchResult(null);
        try {
            const directSnap = await getDoc(doc(db, 'training_records', id));
            if (directSnap.exists()) {
                setMemberSearchResult({ id: directSnap.id, ...directSnap.data() });
                return;
            }
            const q = query(collection(db, 'training_records'), where('employeeId', '==', id));
            const snap = await getDocs(q);
            if (!snap.empty) {
                setMemberSearchResult({ id: snap.docs[0].id, ...snap.docs[0].data() });
            } else {
                toast.warning('No encontrado', 'No existe empleado con ese ID');
            }
        } catch (err) {
            console.error('[GruposPage] handleSearchMember:', err);
            toast.error('Error', 'Error al buscar empleado');
        } finally {
            setMemberSearching(false);
        }
    }, [memberSearch, toast]);

    const handleAddMember = useCallback(async (emp) => {
        const group = groups.find((g) => g.id === memberGroupId);
        if (!group) return;
        const empId = emp.employeeId ?? emp.id;
        if ((group.members ?? []).includes(empId)) {
            toast.warning('Ya existe', 'Este empleado ya pertenece al grupo');
            return;
        }
        try {
            const newMembers = [...(group.members ?? []), empId];
            await updateDoc(doc(db, 'groups', memberGroupId), { members: newMembers });
            toast.success('Agregado', `${emp.name} agregado al grupo`);
            setShowMemberModal(false);
            // Invalidar cachÃ© del grupo afectado
            setMemberDetails((prev) => {
                const next = { ...prev };
                delete next[memberGroupId];
                return next;
            });
            loadGroups();
        } catch (err) {
            console.error('[GruposPage] handleAddMember:', err);
            toast.error('Error', 'No se pudo agregar el miembro');
        }
    }, [groups, memberGroupId, toast, loadGroups]);

    const handleRemoveMember = async () => {
        if (!confirmDelete || confirmDelete.type !== 'member') return;
        const { groupId, empId } = confirmDelete;
        try {
            const group = groups.find((g) => g.id === groupId);
            const newMembers = (group?.members ?? []).filter((m) => m !== empId);
            await updateDoc(doc(db, 'groups', groupId), { members: newMembers });
            toast.success('Removido', 'Miembro removido del grupo');
            setConfirmDelete(null);
            setMemberDetails((prev) => {
                const next = { ...prev };
                delete next[groupId];
                return next;
            });
            loadGroups();
        } catch (err) {
            console.error('[GruposPage] handleRemoveMember:', err);
            toast.error('Error', 'No se pudo remover el miembro');
        }
    };

    // â”€â”€ Loading / Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (authLoading || !user) {
        return (
            <AdminLayout title="Módulo">
                <div className={styles.centeredLoader}><div className="spinner" /></div>
            </AdminLayout>
        );
    }

    // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    return (
        <>
            <AdminLayout title="Grupos">
                <div className={styles.container}>

                    {/* Encabezado */}
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <BackButton href="/dashboard" />
                            <div>
                                <h1 className={styles.title}>Grupos y Certificaciones</h1>
                                <p className={styles.subtitle}>
                                    Gestiona roles transversales: Auditores, Brigadas, ComitÃ©s y mÃ¡s
                                </p>
                            </div>
                        </div>
                        {canWrite() && (
                            <Button variant="primary" onClick={openCreateGroup}>
                                <Plus size={18} /> Nuevo Grupo
                            </Button>
                        )}
                    </div>

                    {/* Contenido */}
                    {loading ? (
                        <div className={styles.centeredLoader}><div className="spinner" /></div>
                    ) : groups.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Shield size={52} strokeWidth={1.2} className={styles.emptyIcon} />
                            <h3>Sin grupos creados</h3>
                            <p>Crea tu primer grupo, por ejemplo: <strong>AUDITORES INTERNOS</strong></p>
                            {canWrite() && (
                                <Button variant="primary" onClick={openCreateGroup}>
                                    <Plus size={16} /> Crear Grupo
                                </Button>
                            )}
                        </div>
                    ) : (
                        <ul className={styles.groupsList} role="list">
                            {groups.map((group) => {
                                const isExpanded = expandedGroup === group.id;
                                const members = memberDetails[group.id] ?? [];
                                const totalMembers = (group.members ?? []).length;

                                return (
                                    <motion.li
                                        key={group.id}
                                        className={styles.groupCard}
                                        data-color={group.color ?? 'blue'}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        layout
                                    >
                                        {/* Cabecera del grupo */}
                                        <div
                                            className={styles.groupHeader}
                                            onClick={() => handleExpand(group)}
                                            role="button"
                                            tabIndex={0}
                                            aria-expanded={isExpanded}
                                            onKeyDown={(e) => e.key === 'Enter' && handleExpand(group)}
                                        >
                                            <div className={styles.groupIconWrap}>
                                                <Users size={22} />
                                            </div>

                                            <div className={styles.groupInfo}>
                                                <span className={styles.groupName}>{group.name}</span>
                                                {group.description && (
                                                    <span className={styles.groupDesc}>{group.description}</span>
                                                )}
                                                <div className={styles.groupMeta}>
                                                    <span className={styles.metaPill}>
                                                        <Users size={11} />
                                                        {totalMembers} miembro{totalMembers !== 1 ? 's' : ''}
                                                    </span>
                                                    <span className={styles.metaPillNeutral}>
                                                        <BookOpen size={11} />
                                                        {(group.requiredCourses ?? []).length} cursos requeridos
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Acciones */}
                                            <div
                                                className={styles.groupActions}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {canWrite() && (
                                                    <>
                                                        <button
                                                            className={styles.iconBtn}
                                                            onClick={() => openEditGroup(group)}
                                                            aria-label="Editar grupo"
                                                            title="Editar grupo"
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button
                                                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                                            onClick={() =>
                                                                setConfirmDelete({ type: 'group', groupId: group.id })
                                                            }
                                                            aria-label="Eliminar grupo"
                                                            title="Eliminar grupo"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </>
                                                )}
                                                <span className={styles.chevron} aria-hidden>
                                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Detalle expandible */}
                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    key="body"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.22 }}
                                                    className={styles.groupBody}
                                                >
                                                    {/* Cursos requeridos */}
                                                    {(group.requiredCourses ?? []).length > 0 && (
                                                        <div className={styles.section}>
                                                            <h4 className={styles.sectionTitle}>
                                                                <BookOpen size={14} />
                                                                Cursos requeridos
                                                            </h4>
                                                            <div className={styles.courseChips}>
                                                                {group.requiredCourses.map((c, i) => (
                                                                    <span key={i} className={styles.courseChip}>{c}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Miembros */}
                                                    <div className={styles.section}>
                                                        <div className={styles.sectionRow}>
                                                            <h4 className={styles.sectionTitle}>
                                                                <Users size={14} />
                                                                Miembros ({totalMembers})
                                                            </h4>
                                                            {canWrite() && (
                                                                <button
                                                                    className={styles.addMemberBtn}
                                                                    onClick={() => openAddMember(group.id)}
                                                                >
                                                                    <Plus size={13} /> Agregar
                                                                </button>
                                                            )}
                                                        </div>

                                                        {loadingMembers ? (
                                                            <div className={styles.centeredLoader} style={{ padding: '1rem' }}>
                                                                <div className="spinner" />
                                                            </div>
                                                        ) : members.length === 0 ? (
                                                            <p className={styles.emptyMembers}>
                                                                No hay miembros en este grupo aÃºn.
                                                            </p>
                                                        ) : (
                                                            <ul className={styles.membersList} role="list">
                                                                {members.map((emp) => {
                                                                    const empId = emp.employeeId ?? emp.id;
                                                                    const comp = getMemberCompliance(
                                                                        emp,
                                                                        group.requiredCourses ?? []
                                                                    );
                                                                    const pctClass =
                                                                        comp.pct >= 100
                                                                            ? styles.barSuccess
                                                                            : comp.pct >= 50
                                                                                ? styles.barPartial
                                                                                : styles.barLow;

                                                                    return (
                                                                        <li key={empId} className={styles.memberRow}>
                                                                            <div className={styles.memberAvatar} data-color={group.color ?? 'blue'}>
                                                                                {emp.notFound ? '?' : (emp.name ?? '?')[0].toUpperCase()}
                                                                            </div>

                                                                            <div className={styles.memberInfo}>
                                                                                <span className={styles.memberName}>
                                                                                    {emp.notFound
                                                                                        ? `ID ${empId} (no encontrado)`
                                                                                        : emp.name}
                                                                                </span>
                                                                                {!emp.notFound && (
                                                                                    <span className={styles.memberMeta}>
                                                                                        {emp.position ?? 'â€”'}
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {!emp.notFound && (group.requiredCourses ?? []).length > 0 && (
                                                                                <div className={styles.complianceWrap}>
                                                                                    <div className={styles.complianceBar}>
                                                                                        <div
                                                                                            className={`${styles.complianceFill} ${pctClass}`}
                                                                                            style={{ width: `${comp.pct}%` }}
                                                                                        />
                                                                                    </div>
                                                                                    <span className={`${styles.compliancePct} ${pctClass}`}>
                                                                                        {comp.approved}/{comp.total}
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                            {canWrite() && (
                                                                                <button
                                                                                    className={styles.removeMemberBtn}
                                                                                    onClick={() =>
                                                                                        setConfirmDelete({
                                                                                            type: 'member',
                                                                                            groupId: group.id,
                                                                                            empId,
                                                                                            empName: emp.name ?? empId,
                                                                                        })
                                                                                    }
                                                                                    aria-label={`Remover ${emp.name ?? empId} del grupo`}
                                                                                    title="Remover del grupo"
                                                                                >
                                                                                    <X size={13} />
                                                                                </button>
                                                                            )}
                                                                        </li>
                                                                    );
                                                                })}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {/* ——— Modal: crear / editar grupo —————————————————————————————————————— */}
                <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
                    <DialogHeader>
                        <DialogTitle>{editingGroup ? 'Editar Grupo' : 'Nuevo Grupo'}</DialogTitle>
                        <DialogClose onClose={() => setShowGroupModal(false)} />
                    </DialogHeader>
                    <DialogBody>
                        <div className={`${styles.formStack} ${styles.colorTheme}`} data-color={groupForm.color}>

                            {/* Nombre */}
                            <div className={styles.formGroup}>
                                <label htmlFor="gp-name" className={styles.label}>Nombre *</label>
                                <input
                                    id="gp-name"
                                    type="text"
                                    value={groupForm.name}
                                    onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                                    placeholder="Ej. AUDITORES INTERNOS"
                                    className={styles.input}
                                    autoFocus
                                />
                            </div>

                            {/* DescripciÃ³n */}
                            <div className={styles.formGroup}>
                                <label htmlFor="gp-desc" className={styles.label}>DescripciÃ³n (opcional)</label>
                                <input
                                    id="gp-desc"
                                    type="text"
                                    value={groupForm.description}
                                    onChange={(e) => setGroupForm((f) => ({ ...f, description: e.target.value }))}
                                    placeholder="Ej. Auditores del SGI certificados internamente"
                                    className={styles.input}
                                />
                            </div>

                            {/* Color */}
                            <div className={styles.formGroup}>
                                <span className={styles.label}>Color de identificaciÃ³n</span>
                                <div className={styles.colorPicker} role="radiogroup" aria-label="Color">
                                    {GROUP_COLORS.map((c) => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            role="radio"
                                            aria-checked={groupForm.color === c.id}
                                            aria-label={c.label}
                                            data-color={c.id}
                                            className={`${styles.colorSwatch} ${groupForm.color === c.id ? styles.colorSelected : ''}`}
                                            onClick={() => setGroupForm((f) => ({ ...f, color: c.id }))}
                                            title={c.label}
                                        >
                                            {groupForm.color === c.id && <Check size={13} strokeWidth={3} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cursos */}
                            <div className={styles.formGroup}>
                                <span className={styles.label}>
                                    Cursos requeridos ({groupForm.requiredCourses.length})
                                </span>
                                <div className={styles.courseInputRow}>
                                    <input
                                        type="text"
                                        value={courseInput}
                                        onChange={(e) => setCourseInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCourse(); } }}
                                        placeholder="Nombre del curso â€” Enter para agregar"
                                        className={styles.input}
                                    />
                                    <button
                                        type="button"
                                        className={`${styles.addCourseBtn} colorBtn-${groupForm.color}`}
                                        onClick={handleAddCourse}
                                        aria-label="Agregar curso"
                                        data-color={groupForm.color}
                                    >
                                        <Plus size={17} />
                                    </button>
                                </div>
                                {groupForm.requiredCourses.length > 0 && (
                                    <div className={styles.chipGrid}>
                                        {groupForm.requiredCourses.map((c, i) => (
                                            <span key={i} className={styles.chip} data-color={groupForm.color}>
                                                {c}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCourse(c)}
                                                    aria-label={`Remover ${c}`}
                                                >Ã—</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setShowGroupModal(false)}>Cancelar</Button>
                        <Button
                            variant="primary"
                            onClick={handleSaveGroup}
                            disabled={saving}
                            data-color={groupForm.color}
                        >
                            {saving ? 'Guardando…' : editingGroup ? 'Guardar Cambios' : 'Crear Grupo'}
                        </Button>
                    </DialogFooter>
                </Dialog>

                {/* Modal: agregar miembro */}
                <Dialog open={showMemberModal} onOpenChange={setShowMemberModal}>
                    <DialogHeader>
                        <DialogTitle>Agregar Miembro al Grupo</DialogTitle>
                        <DialogClose onClose={() => setShowMemberModal(false)} />
                    </DialogHeader>
                    <DialogBody>
                        <div className={styles.formStack}>
                            <p className={styles.hint}>Busca al empleado por su número de ID</p>
                            <div className={styles.memberSearchRow}>
                                <input
                                    type="text"
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearchMember(); }}
                                    placeholder="Número de empleado (ej. 4059)"
                                    className={styles.input}
                                    autoFocus
                                />
                                <Button
                                    variant="primary"
                                    onClick={handleSearchMember}
                                    disabled={memberSearching}
                                    aria-label="Buscar"
                                >
                                    {memberSearching ? '…' : <Search size={16} />}
                                </Button>
                            </div>

                            {memberSearchResult && (
                                <div className={styles.memberResultCard}>
                                    <div className={styles.memberAvatar} data-color="blue">
                                        {(memberSearchResult.name ?? '?')[0].toUpperCase()}
                                    </div>
                                    <div className={styles.memberInfo}>
                                        <strong className={styles.memberName}>{memberSearchResult.name}</strong>
                                        <span className={styles.memberMeta}>
                                            {memberSearchResult.position ?? '—'}
                                        </span>
                                        <span className={styles.memberMeta}>
                                            ID: {memberSearchResult.employeeId ?? memberSearchResult.id}
                                        </span>
                                    </div>
                                    <Button variant="primary" onClick={() => handleAddMember(memberSearchResult)}>
                                        <Plus size={15} /> Agregar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setShowMemberModal(false)}>Cerrar</Button>
                    </DialogFooter>
                </Dialog>

                {/* Modal: confirmación de borrado */}
                <Dialog open={!!confirmDelete} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmDelete?.type === 'group' ? '¿Eliminar grupo?' : '¿Remover miembro?'}
                        </DialogTitle>
                        <DialogClose onClose={() => setConfirmDelete(null)} />
                    </DialogHeader>
                    <DialogBody>
                        <p className={styles.hint}>
                            {confirmDelete?.type === 'group'
                                ? 'Esta acción eliminará el grupo y todos sus datos. No se puede deshacer.'
                                : `Se removerá a ${confirmDelete?.empName ?? 'este miembro'} del grupo. El empleado y su historial de capacitación no se verán afectados.`}
                        </p>
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
                        <Button
                            variant="danger"
                            onClick={confirmDelete?.type === 'group' ? handleDeleteGroup : handleRemoveMember}
                        >
                            {confirmDelete?.type === 'group' ? 'Eliminar grupo' : 'Remover miembro'}
                        </Button>
                    </DialogFooter>
                </Dialog>
            </AdminLayout >
        </>
    );
}
