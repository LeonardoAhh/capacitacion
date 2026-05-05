'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import {
    MoreHorizontal, Shield, Presentation, Save, RefreshCcw,
    Pencil, Check, X as CancelIcon, Phone, Plus, Trash2, FileEdit,
    AlertTriangle, KeyRound, ChevronDown
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast/Toast';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { doc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit, where, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { db } from '@/lib/firebase';

const ADMIN_ROLES   = ['admin', 'superadmin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'];
const AUDITOR_ROLES = ['super_admin', 'SUPER_ADMIN'];

const ANIMATION_OPTIONS = [
    { value: 'lightning', label: 'Rayos y estrellas' },
    { value: 'hearts',    label: 'Corazones' },
    { value: 'books',     label: 'Libros' },
    { value: 'clouds',    label: 'Nubes' },
    { value: 'default',   label: 'Destellos' },
];

const PERMISSION_PAGES = [
    { key: 'dashboard',    label: 'Dashboard' },
    { key: 'employees',    label: 'Empleados' },
    { key: 'capacitacion', label: 'Capacitación' },
    { key: 'profile',      label: 'Perfil' },
    { key: 'induccion',    label: 'Inducción' },
    { key: 'mural',        label: 'Mural' },
];

const DEFAULT_PERMISSIONS = () =>
    PERMISSION_PAGES.reduce((acc, page) => {
        acc[page.key] = { view: false, create: false, edit: false, delete: false };
        return acc;
    }, {});

async function createAuthUserSecondary(email, password) {
    const appName = `secondary-${Date.now()}`;
    const config = {
        apiKey:     process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId:  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    };
    const secondaryApp = initializeApp(config, appName);
    try {
        const secondaryAuth = getAuth(secondaryApp);
        const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        return cred.user.uid;
    } finally {
        await deleteApp(secondaryApp);
    }
}

function StatusPill({ status }) {
    const map = {
        aprobado:  { cls: styles.pillSuccess, label: 'Aprobado' },
        reprobado: { cls: styles.pillDanger,  label: 'Reprobado' },
        pendiente: { cls: styles.pillWarning, label: 'Pendiente' },
    };
    const key = status ? 'aprobado' : 'reprobado';
    const { cls, label } = map[key] || map.pendiente;
    return (
        <span className={`${styles.pill} ${cls}`}>
            <span className={styles.pillDot} />
            {label}
        </span>
    );
}

function RowMenu({ onEdit, onDelete, editLabel = 'Editar', deleteLabel = 'Eliminar' }) {
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const popoverRef = useRef(null);

    const openMenu = () => {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({ top: rect.bottom + 4, left: rect.right });
        setOpen(true);
    };

    useEffect(() => {
        if (!open) return;
        const close = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target) &&
                triggerRef.current && !triggerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', esc);
        return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
    }, [open]);

    const popover = open && createPortal(
        <div
            ref={popoverRef}
            role="menu"
            className={styles.rowMenuPopover}
            style={{ top: coords.top, left: coords.left - 144 }}
        >
            <button type="button" role="menuitem" className={styles.rowMenuItem}
                onClick={() => { onEdit(); setOpen(false); }}>
                <Pencil size={13} />{editLabel}
            </button>
            <button type="button" role="menuitem"
                className={`${styles.rowMenuItem} ${styles.rowMenuItemDanger}`}
                onClick={() => { onDelete(); setOpen(false); }}>
                <Trash2 size={13} />{deleteLabel}
            </button>
        </div>,
        document.body
    );

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                className={styles.rowMenuTrigger}
                onClick={openMenu}
                aria-label="Más opciones"
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <MoreHorizontal size={15} />
            </button>
            {popover}
        </>
    );
}

// ── Main page ──
export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!user) return;
        const rol = user.rol?.toLowerCase();
        if (rol === 'instructor') { router.push('/induccion'); }
    }, [user, router]);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <AdminLayout title="Perfil de Usuario">
                <div className={styles.container}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className={styles.skeletonBlock} style={{ height: 120, borderRadius: 'var(--border-radius-lg)' }} />
                        <div className={styles.skeletonBlock} style={{ height: 200, borderRadius: 'var(--border-radius-lg)' }} />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const isAdmin = ADMIN_ROLES.includes(user?.rol);
    const initial = (user.name || user.displayName || 'U').charAt(0).toUpperCase();

    return (
        <AdminLayout title="Perfil de Usuario">
            <main className={styles.container} id="main-content">
                <div className={isAdmin ? styles.pageLayout : styles.pageLayoutSingle}>
                    {/* ── Sidebar: Profile card ── */}
                    <aside className={styles.profileCol} aria-label="Perfil de usuario">
                        <div className={styles.profileCard}>
                            <div className={styles.profileHeader}>
                                <div className={styles.profileAvatar} role="img" aria-label={`Avatar de ${user.name || 'Usuario'}`}>
                                    {initial}
                                </div>
                                <div>
                                    <h1 className={styles.profileName}>{user.name || user.displayName || 'Usuario'}</h1>
                                    <div className={styles.profilePosition}>{user.puesto || ''}</div>
                                </div>
                            </div>
                            <hr className={styles.profileDivider} />
                            <div className={styles.profileRows}>
                                <div className={styles.profileRow}>
                                    <span className={styles.profileRowLabel}>Departamento</span>
                                    <span className={styles.profileRowValue}>{user.departamento || '—'}</span>
                                </div>
                                <div className={styles.profileRow}>
                                    <span className={styles.profileRowLabel}>Rol</span>
                                    <span className={`${styles.pill} ${styles.pillInfo}`}>
                                        <span className={styles.pillDot} />
                                        {user.rol || 'Empleado'}
                                    </span>
                                </div>
                                <div className={styles.profileRow}>
                                    <span className={styles.profileRowLabel}>Género</span>
                                    <span className={styles.profileRowValue}>{user.genero || '—'}</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* ── Main content ── */}
                    {isAdmin && (
                        <div className={styles.adminCol}>
                            <AdminMuralSection />
                            <AdminSection />
                        </div>
                    )}
                </div>
            </main>
        </AdminLayout>
    );
}

// ── Admin Section ──
function AdminSection() {
    const { toast } = useToast();
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [duration, setDuration]           = useState(2);
    const [loading, setLoading]             = useState(true);

    const [usersList, setUsersList] = useState([]);
    const [rolesList, setRolesList] = useState([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [userForm, setUserForm] = useState({ email: '', name: '', rol: 'admin', avatarSeed: '', sidebarAnimation: 'default', password: '' });
    const [roleForm, setRoleForm] = useState({ name: '', permissions: {} });

    useEffect(() => {
        const configRef = doc(db, 'app_config', 'general');
        const unsubscribeConfig = onSnapshot(configRef, (docSnap) => {
            if (docSnap.exists()) {
                setIsMaintenance(docSnap.data().maintenanceMode || false);
            }
            setLoading(false);
        });

        const usersRef = collection(db, 'users');
        const unsubscribeUsers = onSnapshot(usersRef, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            setUsersList(data);
            setUsersLoading(false);
        });

        const rolesRef = collection(db, 'roles');
        const unsubscribeRoles = onSnapshot(rolesRef, (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setRolesList(data);
            setRolesLoading(false);
        });

        return () => {
            unsubscribeConfig();
            unsubscribeUsers();
            unsubscribeRoles();
        };
    }, []);

    const resetUserForm = () => {
        setEditingUserId(null);
        setUserForm({ email: '', name: '', rol: 'admin', avatarSeed: '', sidebarAnimation: 'default', password: '' });
    };

    const resetRoleForm = () => {
        setEditingRoleId(null);
        setRoleForm({ name: '', permissions: DEFAULT_PERMISSIONS() });
    };

    const handleUserFormChange = (field, value) => {
        setUserForm(prev => ({ ...prev, [field]: value }));
    };

    const handleRoleFormChange = (pageKey, action) => {
        setRoleForm(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [pageKey]: {
                    ...prev.permissions[pageKey],
                    [action]: !prev.permissions[pageKey][action],
                },
            },
        }));
    };

    const handleSaveUser = async () => {
        if (!userForm.email || !userForm.name) {
            toast.warning('Nombre y correo son obligatorios.');
            return;
        }
        if (!editingUserId && !userForm.password) {
            toast.warning('La contraseña es obligatoria al crear un usuario.');
            return;
        }
        if (!editingUserId && userForm.password.length < 6) {
            toast.warning('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        let targetId = editingUserId;

        try {
            if (!editingUserId) {
                targetId = await createAuthUserSecondary(
                    userForm.email.trim().toLowerCase(),
                    userForm.password
                );
            }

            const payload = {
                email: userForm.email.trim().toLowerCase(),
                name: userForm.name.trim(),
                rol: userForm.rol,
                avatarSeed: userForm.avatarSeed || userForm.email || 'user',
                sidebarAnimation: userForm.sidebarAnimation || 'default',
                updatedAt: new Date().toISOString(),
            };

            await setDoc(doc(db, 'users', targetId), payload, { merge: true });
            toast.success(`Usuario ${editingUserId ? 'actualizado' : 'creado'} correctamente.`);
            resetUserForm();
        } catch (error) {
            console.error('Error saving user:', error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Ya existe una cuenta con ese correo.');
            } else {
                toast.error('No se pudo guardar el usuario.');
            }
        }
    };

    const handleDeleteUser = async (id) => {
        if (id === null) return;
        if (!confirm('¿Seguro que quieres eliminar este registro de usuario?')) return;
        try {
            await deleteDoc(doc(db, 'users', id));
            toast.success('Usuario eliminado correctamente.');
            if (editingUserId === id) resetUserForm();
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('No se pudo eliminar el usuario.');
        }
    };

    const handleEditUser = (userData) => {
        setEditingUserId(userData.id);
        setUserForm({
            email: userData.email || '',
            name: userData.name || '',
            rol: userData.rol || 'admin',
            avatarSeed: userData.avatarSeed || '',
            sidebarAnimation: userData.sidebarAnimation || 'default',
            password: '',
        });
    };

    const handleSaveRole = async () => {
        if (!roleForm.name.trim()) {
            toast.warning('Nombre de rol es obligatorio.');
            return;
        }

        const targetId = editingRoleId || doc(collection(db, 'roles')).id;
        const payload = {
            name: roleForm.name.trim(),
            permissions: roleForm.permissions,
            updatedAt: new Date().toISOString(),
        };

        try {
            await setDoc(doc(db, 'roles', targetId), payload, { merge: true });
            toast.success(`Rol ${editingRoleId ? 'actualizado' : 'creado'} correctamente.`);
            resetRoleForm();
        } catch (error) {
            console.error('Error saving role:', error);
            toast.error('No se pudo guardar el rol.');
        }
    };

    const handleEditRole = (roleData) => {
        setEditingRoleId(roleData.id);
        setRoleForm({
            name: roleData.name || '',
            permissions: roleData.permissions || DEFAULT_PERMISSIONS(),
        });
    };

    const handleDeleteRole = async (id) => {
        if (!confirm('¿Seguro que quieres eliminar este rol?')) return;
        try {
            await deleteDoc(doc(db, 'roles', id));
            toast.success('Rol eliminado correctamente.');
            if (editingRoleId === id) resetRoleForm();
        } catch (error) {
            console.error('Error deleting role:', error);
            toast.error('No se pudo eliminar el rol.');
        }
    };

    const toggleMaintenance = async () => {
        const newState = !isMaintenance;
        setIsMaintenance(newState);
        try {
            const updateData = {
                maintenanceMode: newState,
                maintenanceMessage: 'Estamos realizando mejoras en la plataforma. Volveremos pronto.',
            };
            if (newState) {
                const endDate = new Date();
                endDate.setHours(endDate.getHours() + parseInt(duration));
                updateData.maintenanceUntil = endDate.toISOString();
            } else {
                updateData.maintenanceUntil = null;
            }
            await setDoc(doc(db, 'app_config', 'general'), updateData, { merge: true });
        } catch (error) {
            console.error('Error updating maintenance mode:', error);
            setIsMaintenance(!newState);
            toast.error('Error al actualizar el modo mantenimiento');
        }
    };

    useEffect(() => {
        if (!roleForm.permissions || Object.keys(roleForm.permissions).length === 0) {
            setRoleForm(prev => ({ ...prev, permissions: DEFAULT_PERMISSIONS() }));
        }
    }, [roleForm.permissions]);

    const canSaveUser = userForm.email.trim() !== '' && userForm.name.trim() !== '';
    const canSaveRole = roleForm.name.trim() !== '';
    const userRolesOptions = ['instructor', 'admin', 'super_admin', ...rolesList.map(r => r.name)].filter((value, index, self) => self.indexOf(value) === index);

    if (loading) return null;

    return (
        <section className={styles.card} aria-label="Administración del Sistema">
            <div className={styles.sectionLabel}>Administración del Sistema</div>

            {/* Maintenance banner */}
            <div className={styles.maintenanceBanner}>
                <div className={styles.maintenanceInfo}>
                    <p className={styles.maintenanceTitle}>Modo mantenimiento</p>
                    <p className={styles.maintenanceDesc}>
                        {isMaintenance
                            ? 'La plataforma está bloqueada para usuarios.'
                            : 'La plataforma está accesible para todos.'}
                    </p>
                </div>
                <label className={styles.toggleWrap} aria-label="Toggle modo mantenimiento">
                    <input
                        type="checkbox"
                        className={styles.toggleInput}
                        checked={isMaintenance}
                        onChange={toggleMaintenance}
                        aria-label="Modo mantenimiento"
                    />
                    <span className={`${styles.toggleTrack} ${isMaintenance ? styles.toggleTrackOn : styles.toggleTrackOff}`}>
                        <span className={styles.toggleThumb} style={{ left: isMaintenance ? '24px' : '3px' }} />
                    </span>
                </label>
            </div>

            {!isMaintenance && (
                <div className={styles.durationRow}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.durationLabel} htmlFor="duration-select">Duración estimada</label>
                        <select
                            className={styles.fieldSelect}
                            id="duration-select"
                            value={String(duration)}
                            onChange={(e) => setDuration(e.target.value)}
                            style={{ maxWidth: 200 }}
                        >
                            {[1, 2, 4, 8, 12, 24, 48, 72].map(h => (
                                <option key={h} value={String(h)}>{h} {h === 1 ? 'hora' : 'horas'}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {isMaintenance && (
                <div className={styles.maintenanceWarning}>
                    <AlertTriangle size={14} />
                    <span>Tú sigues teniendo acceso total por ser Administrador.</span>
                </div>
            )}

            {/* Forms grid */}
            <div className={styles.formsGrid}>
                {/* Create / edit user */}
                <div className={styles.formCard}>
                    <div className={styles.formCardTitle}>Crear / editar usuario</div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Correo electrónico</label>
                        <input
                            className={styles.fieldInput}
                            type="email"
                            value={userForm.email}
                            onChange={(e) => handleUserFormChange('email', e.target.value)}
                            placeholder="usuario@correo.com"
                            aria-label="Correo electrónico"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Nombre completo</label>
                        <input
                            className={styles.fieldInput}
                            value={userForm.name}
                            onChange={(e) => handleUserFormChange('name', e.target.value)}
                            placeholder="Nombre del usuario"
                            aria-label="Nombre completo"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Rol asignado</label>
                        <select
                            className={styles.fieldSelect}
                            value={userForm.rol}
                            onChange={(e) => handleUserFormChange('rol', e.target.value)}
                            aria-label="Rol asignado"
                        >
                            {userRolesOptions.map(roleOption => (
                                <option key={roleOption} value={roleOption}>{roleOption}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Semilla de avatar</label>
                        <input
                            className={styles.fieldInput}
                            value={userForm.avatarSeed}
                            onChange={(e) => handleUserFormChange('avatarSeed', e.target.value)}
                            placeholder="Opcional"
                            aria-label="Semilla de avatar"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Animación sidebar</label>
                        <select
                            className={styles.fieldSelect}
                            value={userForm.sidebarAnimation}
                            onChange={(e) => handleUserFormChange('sidebarAnimation', e.target.value)}
                            aria-label="Animación sidebar"
                        >
                            {ANIMATION_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    {!editingUserId && (
                        <div className={styles.fieldGroup}>
                            <label className={styles.fieldLabel}>Contraseña temporal</label>
                            <input
                                className={styles.fieldInput}
                                type="password"
                                value={userForm.password}
                                onChange={(e) => handleUserFormChange('password', e.target.value)}
                                placeholder="Mín. 6 caracteres"
                                autoComplete="new-password"
                                aria-label="Contraseña temporal"
                            />
                        </div>
                    )}
                    <div className={styles.formActions}>
                        <button type="button" className={styles.btn} onClick={handleSaveUser} disabled={!canSaveUser}>
                            {editingUserId ? 'Actualizar usuario' : 'Crear usuario'}
                        </button>
                        <button type="button" className={styles.btn} onClick={resetUserForm}>Limpiar</button>
                    </div>
                </div>

                {/* Create / edit role */}
                <div className={styles.formCard}>
                    <div className={styles.formCardTitle}>Crear / editar rol</div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Nombre del rol</label>
                        <input
                            className={styles.fieldInput}
                            value={roleForm.name}
                            onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="ej. manager, auditor"
                            aria-label="Nombre del rol"
                        />
                    </div>
                    <div className={styles.permissionsTableWrapper}>
                        <table className={styles.permTable} aria-label="Tabla de permisos">
                            <thead>
                                <tr>
                                    <th>Página</th>
                                    <th>Ver</th>
                                    <th>Crear</th>
                                    <th>Editar</th>
                                    <th>Borrar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {PERMISSION_PAGES.map(page => {
                                    const permissions = roleForm.permissions[page.key] || { view: false, create: false, edit: false, delete: false };
                                    return (
                                        <tr key={page.key}>
                                            <td>{page.label}</td>
                                            {['view', 'create', 'edit', 'delete'].map(action => (
                                                <td key={action} className={styles.permissionCell}>
                                                    <label className={styles.checkboxLabel}>
                                                        <input
                                                            type="checkbox"
                                                            checked={permissions[action]}
                                                            onChange={() => handleRoleFormChange(page.key, action)}
                                                            aria-label={`${page.label} ${action}`}
                                                        />
                                                    </label>
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className={styles.formActions}>
                        <button type="button" className={styles.btn} onClick={handleSaveRole} disabled={!canSaveRole}>
                            {editingRoleId ? 'Actualizar rol' : 'Crear rol'}
                        </button>
                        <button type="button" className={styles.btn} onClick={resetRoleForm}>Limpiar</button>
                    </div>
                </div>
            </div>

            {/* Existing users & roles */}
            <div className={styles.listsGrid}>
                <div className={styles.listCard}>
                    <div className={styles.listCardTitle}>Usuarios existentes</div>
                    <div className={styles.tableScroll}>
                        <table className={styles.dataTable} aria-label="Lista de usuarios">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Correo</th>
                                    <th>Rol</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersLoading ? (
                                    <tr><td colSpan="4">Cargando usuarios...</td></tr>
                                ) : usersList.length === 0 ? (
                                    <tr><td colSpan="4">No hay usuarios registrados.</td></tr>
                                ) : usersList.map(userItem => (
                                    <tr key={userItem.id}>
                                        <td className={styles.cellName}>{userItem.name || 'Sin nombre'}</td>
                                        <td className={styles.cellSecondary}>{userItem.email || 'Sin correo'}</td>
                                        <td className={styles.cellSecondary}>{userItem.rol || 'Sin rol'}</td>
                                        <td className={styles.rowMenuCell}>
                                            <RowMenu
                                                onEdit={() => handleEditUser(userItem)}
                                                onDelete={() => handleDeleteUser(userItem.id)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.listCard}>
                    <div className={styles.listCardTitle}>Roles existentes</div>
                    {rolesLoading ? (
                        <p className={styles.sectionDesc}>Cargando roles...</p>
                    ) : rolesList.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyStateIcon}>
                                <KeyRound size={18} />
                            </div>
                            <p className={styles.emptyStateText}>No hay roles personalizados.</p>
                        </div>
                    ) : (
                        <div className={styles.roleCardsWrap}>
                            {rolesList.map(roleItem => (
                                <article key={roleItem.id} className={styles.roleCard}>
                                    <div>
                                        <p className={styles.roleName}>{roleItem.name}</p>
                                        <p className={styles.roleMeta}>Permisos configurados</p>
                                    </div>
                                    <RowMenu
                                        onEdit={() => handleEditRole(roleItem)}
                                        onDelete={() => handleDeleteRole(roleItem.id)}
                                    />
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

// ── Admin Mural Section ──
const extractFirstName = (fullName) => {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 3) return parts.slice(2).join(' ');
    if (parts.length === 2) return parts[1];
    return parts[0];
};

function AdminMuralSection() {
    const { toast } = useToast();
    const [loadingConfig,   setLoadingConfig]   = useState(true);
    const [muralList,       setMuralList]       = useState([]);
    const [editingMuralId,  setEditingMuralId]  = useState(null);
    const [editData,        setEditData]        = useState({});
    const [searchingM,      setSearchingM]      = useState(false);
    const [muralSearch,     setMuralSearch]     = useState('');
    const [availableThemes, setAvailableThemes] = useState([]);

    const [manualData, setManualData] = useState({
        employeeId: '', firstName: '', currentPosition: '',
        promotionTo: '', score: '', requiredScore: '', recommendations: [],
    });

    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);

    const filteredMuralList = useMemo(() => {
        const q = muralSearch.trim().toLowerCase();
        if (!q) return muralList;
        return muralList.filter(item => {
            const idText = String(item.employeeId || '');
            return idText.includes(q)
                || String(item.firstName || '').toLowerCase().includes(q)
                || String(item.currentPosition || '').toLowerCase().includes(q)
                || String(item.promotionTo || '').toLowerCase().includes(q);
        });
    }, [muralList, muralSearch]);

    const [messages, setMessages] = useState({
        successMessage: '', motivationalMessage: '',
    });

    const [complianceConfig, setComplianceConfig] = useState({
        complianceWhatsapp: '',
        complianceExamDates: [],
    });

    useEffect(() => {
        const fetchMuralConfig = async () => {
            const docSnap = await getDoc(doc(db, 'app_config', 'mural'));
            if (docSnap.exists()) {
                const data = docSnap.data();
                setMessages(prev => ({ ...prev, ...data }));
                setComplianceConfig({
                    complianceWhatsapp: data.complianceWhatsapp || '',
                    complianceExamDates: Array.isArray(data.complianceExamDates) ? data.complianceExamDates : [],
                });
            } else {
                setMessages({
                    successMessage: '¡Felicidades! Has aprobado tu examen teórico. Estás un paso más cerca de tu promoción.',
                    motivationalMessage: 'El aprendizaje es un proceso constante. Te invitamos a repasar y prepararte para tu siguiente intento. ¡Confiamos en ti!',
                });
            }
            setLoadingConfig(false);
        };
        fetchMuralConfig();

        const unsubMural = onSnapshot(collection(db, 'mural_exams'), (snap) => {
            const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            arr.sort((a, b) => {
                const aId = Number(a.employeeId);
                const bId = Number(b.employeeId);
                if (!Number.isNaN(aId) && !Number.isNaN(bId)) return aId - bId;
                if (!Number.isNaN(aId)) return -1;
                if (!Number.isNaN(bId)) return 1;
                return String(a.employeeId || '').localeCompare(String(b.employeeId || ''));
            });
            setMuralList(arr);
        });

        const fetchThemes = async () => {
            try {
                const qSnap = await getDocs(collection(db, 'exam_questions'));
                const themes = new Set();
                qSnap.forEach(d => { const t = d.data().theme; if (t) themes.add(t.trim().toUpperCase()); });
                setAvailableThemes(Array.from(themes).sort());
            } catch (err) { console.error('Error fetching themes', err); }
        };
        fetchThemes();

        return () => unsubMural();
    }, []);

    const fetchEmployeeData = useCallback(async () => {
        const eid = manualData.employeeId?.trim();
        if (!eid) return;
        setSearchingM(true);
        try {
            const trainingQuery = query(collection(db, 'training_records'), where('employeeId', '==', eid), limit(1));
            const trainingSnap  = await getDocs(trainingQuery);
            let foundName = '', foundPosition = '';

            if (!trainingSnap.empty) {
                const data = trainingSnap.docs[0].data();
                foundName = data.name || '';
                foundPosition = data.position || '';
            } else {
                const empSnap = await getDocs(query(collection(db, 'employees'), where('employeeId', '==', eid), limit(1)));
                if (!empSnap.empty) {
                    const eData = empSnap.docs[0].data();
                    foundName = eData.name || '';
                    foundPosition = eData.puesto || '';
                }
            }

            if (!foundName && !foundPosition) {
                toast.warning('No se encontró al empleado con ese ID en los registros.');
                return;
            }

            let promoDest = '', reqScore = '';
            if (foundPosition) {
                const rulesSnap = await getDocs(query(collection(db, 'promotion_rules'), where('currentPosition', '==', foundPosition), limit(1)));
                if (!rulesSnap.empty) {
                    const rule = rulesSnap.docs[0].data();
                    promoDest = rule.promotionTo || '';
                    reqScore  = rule.examMinScore || 80;
                }
            }
            setManualData(prev => ({
                ...prev,
                firstName:       extractFirstName(foundName),
                currentPosition: foundPosition,
                promotionTo:     promoDest,
                requiredScore:   reqScore,
            }));
        } catch (error) {
            console.error('Error buscando datos del empleado:', error);
            toast.error('Hubo un problema consultando la base de datos.');
        } finally {
            setSearchingM(false);
        }
    }, [manualData.employeeId, toast]);

    useEffect(() => {
        const id = manualData.employeeId?.trim();
        if (!id || id.length < 2) return;
        const timer = setTimeout(() => { fetchEmployeeData(); }, 600);
        return () => clearTimeout(timer);
    }, [fetchEmployeeData, manualData.employeeId]);

    const saveMessages = async () => {
        try {
            await setDoc(doc(db, 'app_config', 'mural'), messages, { merge: true });
            toast.success('Mensajes actualizados correctamente');
        } catch {
            toast.error('No se pudieron guardar los mensajes');
        }
    };

    const saveCompliance = async () => {
        try {
            await setDoc(doc(db, 'app_config', 'mural'), {
                complianceWhatsapp: complianceConfig.complianceWhatsapp,
                complianceExamDates: complianceConfig.complianceExamDates,
            }, { merge: true });
            toast.success('Información de cumplimiento guardada');
        } catch {
            toast.error('No se pudo guardar la información de cumplimiento');
        }
    };

    const addExamDate = () => {
        setComplianceConfig(prev => ({
            ...prev,
            complianceExamDates: [...prev.complianceExamDates, { label: '', date: '' }],
        }));
    };

    const removeExamDate = (idx) => {
        setComplianceConfig(prev => ({
            ...prev,
            complianceExamDates: prev.complianceExamDates.filter((_, i) => i !== idx),
        }));
    };

    const updateExamDate = (idx, field, value) => {
        setComplianceConfig(prev => {
            const dates = [...prev.complianceExamDates];
            dates[idx] = { ...dates[idx], [field]: value };
            return { ...prev, complianceExamDates: dates };
        });
    };

    const handleManualSubmit = async () => {
        try {
            const scoreNum    = Number(manualData.score);
            const reqScoreNum = Number(manualData.requiredScore);
            await setDoc(doc(db, 'mural_exams', manualData.employeeId.toString()), {
                employeeId:      manualData.employeeId,
                firstName:       manualData.firstName,
                currentPosition: manualData.currentPosition,
                promotionTo:     manualData.promotionTo,
                passed:          scoreNum >= reqScoreNum,
                score:           scoreNum,
                requiredScore:   reqScoreNum,
                recommendations: Array.isArray(manualData.recommendations) ? manualData.recommendations : [],
                date:            new Date().toISOString().split('T')[0],
                active:          true,
                timestamp:       new Date(),
            });
            toast.success('¡Examen guardado exitosamente en el Mural!');
            setManualData({ employeeId: '', firstName: '', currentPosition: '', promotionTo: '', score: '', requiredScore: '', recommendations: [] });
            setWizardOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar examen manual.');
        }
    };

    const handleEditClick   = (mural) => {
        setEditingMuralId(mural.id);
        const recs = Array.isArray(mural.recommendations)
            ? mural.recommendations
            : (typeof mural.recommendations === 'string' && mural.recommendations ? [mural.recommendations] : []);
        setEditData({ ...mural, recommendations: recs });
    };
    const handleCancelEdit  = () => { setEditingMuralId(null); setEditData({}); };
    const handleSaveEdit    = async () => {
        try {
            const scoreNum = Number(editData.score);
            const reqNum   = Number(editData.requiredScore);
            const safeData = { ...editData, score: scoreNum, requiredScore: reqNum, passed: scoreNum >= reqNum };
            delete safeData.id;
            await setDoc(doc(db, 'mural_exams', editingMuralId), safeData, { merge: true });
            toast.success('Registro actualizado correctamente.');
            setEditingMuralId(null);
        } catch {
            toast.error('No se pudo actualizar el registro.');
        }
    };
    const handleDeleteMural = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este registro público del Mural?')) return;
        try {
            await deleteDoc(doc(db, 'mural_exams', id));
            toast.success('Registro eliminado.');
        } catch {
            toast.error('No se pudo eliminar.');
        }
    };

    const toggleRec = (list, setFn, theme) =>
        setFn(prev => ({
            ...prev,
            recommendations: list.includes(theme)
                ? list.filter(t => t !== theme)
                : [...list, theme],
        }));

    if (loadingConfig) return null;

    const WIZARD_STEPS = ['Buscar', 'Datos', 'Evaluación'];
    const wizardStep1Valid = manualData.employeeId.trim() !== '';
    const wizardStep2Valid = !!(manualData.firstName.trim() && manualData.currentPosition.trim() && manualData.promotionTo.trim());
    const wizardStep3Valid = manualData.score !== '' && manualData.requiredScore !== '';
    const wizardScoreNum   = Number(manualData.score);
    const wizardReqNum     = Number(manualData.requiredScore);
    const wizardPassed     = wizardStep3Valid && !isNaN(wizardScoreNum) && !isNaN(wizardReqNum) && wizardScoreNum >= wizardReqNum;

    return (
        <section className={styles.card} aria-label="Gestión del Mural de Reconocimiento">
            <div className={styles.sectionHeader}>
                <div className={styles.sectionLabel} style={{ marginBottom: 0 }}>Gestión del Mural de Reconocimiento</div>
                <div className={styles.sectionHeaderActions}>
                    <button className={styles.muralSaveBtn} onClick={saveMessages} title="Guardar mensajes" aria-label="Guardar mensajes">
                        <Save size={14} />
                    </button>
                    <button
                        className={styles.muralSaveBtn}
                        onClick={() => {
                            setManualData({ employeeId: '', firstName: '', currentPosition: '', promotionTo: '', score: '', requiredScore: '', recommendations: [] });
                            setWizardStep(1);
                            setWizardOpen(true);
                        }}
                        title="Captura manual"
                        aria-label="Captura manual"
                    >
                        <FileEdit size={14} />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className={styles.messagesGrid}>
                <div className={`${styles.msgBlock} ${styles.msgBlockSuccess}`}>
                    <label className={`${styles.msgLabel} ${styles.msgLabelSuccess}`}>Mensaje para aprobados</label>
                    <textarea
                        className={styles.fieldTextarea}
                        style={{ minHeight: 80 }}
                        value={messages.successMessage}
                        onChange={(e) => setMessages(m => ({ ...m, successMessage: e.target.value }))}
                        placeholder="Usa [Nombre] para personalizar el saludo..."
                        aria-label="Mensaje para empleados aprobados"
                    />
                </div>
                <div className={`${styles.msgBlock} ${styles.msgBlockFail}`}>
                    <label className={`${styles.msgLabel} ${styles.msgLabelFail}`}>Mensaje para reprobados</label>
                    <textarea
                        className={styles.fieldTextarea}
                        style={{ minHeight: 80 }}
                        value={messages.motivationalMessage}
                        onChange={(e) => setMessages(m => ({ ...m, motivationalMessage: e.target.value }))}
                        placeholder="Usa [Nombre] para personalizar el saludo..."
                        aria-label="Mensaje para empleados reprobados"
                    />
                </div>
            </div>

            {/* Compliance */}
            <hr className={styles.subDivider} />
            <div className={styles.complianceAdminPanel}>
                <div className={styles.complianceAdminHeader}>
                    <div>
                        <p className={styles.complianceAdminTitle}>Cumplimiento de Capacitación</p>
                        <p className={styles.complianceAdminDesc}>WhatsApp de contacto y fechas de exámenes teóricos visibles en el mural público.</p>
                    </div>
                    <button type="button" className={styles.muralSaveBtn} onClick={saveCompliance} title="Guardar cumplimiento" aria-label="Guardar información de cumplimiento">
                        <Save size={14} />
                    </button>
                </div>
                <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}><Phone size={13} /> WhatsApp de contacto</label>
                    <input
                        type="tel"
                        className={styles.fieldInput}
                        value={complianceConfig.complianceWhatsapp}
                        onChange={(e) => setComplianceConfig(prev => ({
                            ...prev,
                            complianceWhatsapp: e.target.value.replace(/\D/g, '').slice(0, 10),
                        }))}
                        placeholder="Ej. 4421234567"
                        maxLength={10}
                        aria-label="WhatsApp de contacto"
                    />
                </div>
                <div className={styles.fieldGroup}>
                    <div className={styles.complianceDatesHeader}>
                        <label className={styles.fieldLabel}>Fechas de Exámenes Teóricos</label>
                        <button type="button" className={styles.complianceAddDateBtn} onClick={addExamDate} aria-label="Agregar fecha">
                            <Plus size={13} /> Agregar
                        </button>
                    </div>
                    {complianceConfig.complianceExamDates.length === 0 && (
                        <p className={styles.complianceDatesEmpty}>Sin fechas configuradas.</p>
                    )}
                    {complianceConfig.complianceExamDates.map((item, idx) => (
                        <div key={idx} className={styles.complianceDateRow}>
                            <input
                                type="text"
                                className={styles.fieldInput}
                                value={item.label}
                                onChange={(e) => updateExamDate(idx, 'label', e.target.value)}
                                placeholder="Descripción (ej. 2o. Período 2026)"
                            />
                            <div className={styles.complianceDateRange}>
                                <input type="text" className={styles.fieldInput} value={item.dateFrom || ''} onChange={(e) => updateExamDate(idx, 'dateFrom', e.target.value)} placeholder="Desde" />
                                <span className={styles.complianceDateRangeSep}>—</span>
                                <input type="text" className={styles.fieldInput} value={item.dateTo || ''} onChange={(e) => updateExamDate(idx, 'dateTo', e.target.value)} placeholder="Hasta" />
                            </div>
                            <button type="button" className={`${styles.tableIconBtn} ${styles.tableIconBtnRed}`} onClick={() => removeExamDate(idx)} aria-label="Eliminar fecha">
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Records table */}
            <hr className={styles.subDivider} />
            <div>
                <div className={styles.tableHeader}>
                    <h4 className={styles.tableTitle}>
                        <Presentation size={16} />
                        Registros Públicos ({filteredMuralList.length})
                    </h4>
                    <div className={styles.tableSearchRow}>
                        <input
                            type="search"
                            className={`${styles.fieldInput} ${styles.tableSearchInput}`}
                            value={muralSearch}
                            onChange={e => setMuralSearch(e.target.value)}
                            placeholder="Buscar por ID, nombre o puesto…"
                            aria-label="Buscar registros del mural"
                        />
                        {muralSearch.trim() && (
                            <span className={styles.searchBadge}>
                                {filteredMuralList.length} de {muralList.length}
                            </span>
                        )}
                    </div>
                </div>
                <div className={styles.tableScroll}>
                    <table className={styles.dataTable} aria-label="Registros del mural">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Puesto actual</th>
                                <th>Destino</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMuralList.map(item => {
                                const isEditing = editingMuralId === item.id;
                                if (isEditing) return (
                                    <tr key={item.id}>
                                        <td className={styles.cellId}>{item.employeeId}</td>
                                        <td><input type="text" className={styles.tableEditInput} value={editData.firstName} onChange={e => setEditData({ ...editData, firstName: e.target.value })} /></td>
                                        <td><input type="text" className={styles.tableEditInput} value={editData.currentPosition} onChange={e => setEditData({ ...editData, currentPosition: e.target.value })} /></td>
                                        <td><input type="text" className={styles.tableEditInput} value={editData.promotionTo} onChange={e => setEditData({ ...editData, promotionTo: e.target.value })} /></td>
                                        <td></td>
                                        <td>
                                            <div className={styles.tableActions}>
                                                <button onClick={handleSaveEdit} className={`${styles.tableIconBtn} ${styles.tableIconBtnGreen}`} title="Guardar"><Check size={13} /></button>
                                                <button onClick={handleCancelEdit} className={`${styles.tableIconBtn} ${styles.tableIconBtnRed}`} title="Cancelar"><CancelIcon size={13} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );

                                return (
                                    <tr key={item.id}>
                                        <td className={styles.cellId}>{item.employeeId}</td>
                                        <td className={styles.cellName}>{item.firstName}</td>
                                        <td className={styles.cellSecondary}>{item.currentPosition}</td>
                                        <td className={styles.cellSecondary}>{item.promotionTo}</td>
                                        <td><StatusPill status={item.passed} /></td>
                                        <td className={styles.rowMenuCell}>
                                            <RowMenu
                                                onEdit={() => handleEditClick(item)}
                                                onDelete={() => handleDeleteMural(item.id)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredMuralList.length === 0 && (
                                <tr className={styles.tableEmptyRow}>
                                    <td colSpan="6">No hay resultados en el mural.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Wizard modal */}
            {wizardOpen && createPortal(
                <div
                    className={styles.wizardOverlay}
                    onMouseDown={(e) => { if (e.target === e.currentTarget) setWizardOpen(false); }}
                >
                    <div className={styles.wizardModal} role="dialog" aria-modal="true" aria-label="Captura Manual">
                        <div className={styles.wizardHeader}>
                            <div>
                                <p className={styles.wizardSub}>Mural de Reconocimiento</p>
                                <h2 className={styles.wizardTitle}>Captura Manual</h2>
                            </div>
                            <button className={styles.wizardClose} onClick={() => setWizardOpen(false)} aria-label="Cerrar">
                                <CancelIcon size={16} />
                            </button>
                        </div>

                        <div className={styles.wizardStepsBar}>
                            {WIZARD_STEPS.map((label, i) => (
                                <div key={label} className={styles.wizardStepEntry}>
                                    <div className={`${styles.wizardStepItem} ${wizardStep > i + 1 ? styles.wizardStepDone : wizardStep === i + 1 ? styles.wizardStepActive : styles.wizardStepPending}`}>
                                        <div className={styles.wizardStepBubble}>
                                            {wizardStep > i + 1 ? <Check size={11} /> : i + 1}
                                        </div>
                                        <span className={styles.wizardStepLabel}>{label}</span>
                                    </div>
                                    {i < WIZARD_STEPS.length - 1 && (
                                        <div className={`${styles.wizardStepLine} ${wizardStep > i + 1 ? styles.wizardStepLineDone : ''}`} />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className={styles.wizardBody}>
                            {wizardStep === 1 && (
                                <div className={styles.wizardStepContent}>
                                    <p className={styles.wizardStepDesc}>Ingresa el número de empleado para auto-rellenar datos.</p>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>No. Empleado *</label>
                                        <div className={styles.idSearchRow}>
                                            <input type="text" className={styles.fieldInput} value={manualData.employeeId} onChange={e => setManualData({ ...manualData, employeeId: e.target.value })} placeholder="Ej. 2950" autoFocus />
                                            {searchingM && (
                                                <span className={styles.idSearchSpinner} aria-label="Buscando">
                                                    <RefreshCcw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {(manualData.firstName || manualData.currentPosition) && (
                                        <div className={styles.wizardFoundCard}>
                                            {[{ label: 'Nombre', value: manualData.firstName }, { label: 'Puesto', value: manualData.currentPosition }, { label: 'Destino', value: manualData.promotionTo }].filter(r => r.value).map(r => (
                                                <div key={r.label} className={styles.wizardFoundRow}>
                                                    <span className={styles.wizardFoundLabel}>{r.label}</span>
                                                    <span className={styles.wizardFoundValue}>{r.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {wizardStep === 2 && (
                                <div className={styles.wizardStepContent}>
                                    <p className={styles.wizardStepDesc}>Verifica y ajusta los datos del empleado.</p>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Primer Nombre (Público) *</label>
                                        <input type="text" className={styles.fieldInput} value={manualData.firstName} onChange={e => setManualData({ ...manualData, firstName: e.target.value })} placeholder="Nombre visible en el Mural" />
                                    </div>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Puesto Actual</label>
                                        <input type="text" className={`${styles.fieldInput} ${styles.fieldInputReadonly}`} value={manualData.currentPosition} readOnly tabIndex={-1} />
                                    </div>
                                    <div className={styles.fieldGroup}>
                                        <label className={styles.fieldLabel}>Puesto Objetivo</label>
                                        <input type="text" className={styles.fieldInput} value={manualData.promotionTo} onChange={e => setManualData({ ...manualData, promotionTo: e.target.value })} placeholder="Puesto de destino" />
                                    </div>
                                </div>
                            )}

                            {wizardStep === 3 && (
                                <div className={styles.wizardStepContent}>
                                    <p className={styles.wizardStepDesc}>Registra la calificación. El resultado se calcula automáticamente.</p>
                                    <div className={styles.wizardScoreRow}>
                                        <div className={styles.fieldGroup}>
                                            <label className={styles.fieldLabel}>Calificación obtenida (%) *</label>
                                            <input type="number" min="0" max="100" className={styles.fieldInput} value={manualData.score} onChange={e => setManualData({ ...manualData, score: e.target.value })} placeholder="0 – 100" />
                                        </div>
                                        <div className={styles.fieldGroup}>
                                            <label className={styles.fieldLabel}>Calificación requerida (%)</label>
                                            <input type="number" min="0" max="100" className={styles.fieldInput} value={manualData.requiredScore} onChange={e => setManualData({ ...manualData, requiredScore: e.target.value })} placeholder="0 – 100" />
                                        </div>
                                    </div>
                                    {wizardStep3Valid && (
                                        <div className={`${styles.wizardResultPreview} ${wizardPassed ? styles.wizardResultPassed : styles.wizardResultFailed}`}>
                                            <span className={styles.wizardResultBadge}>{wizardPassed ? 'APROBADO' : 'REPROBADO'}</span>
                                            <span className={styles.wizardResultScore}>{manualData.firstName} — {manualData.score}% obtenido, {manualData.requiredScore}% requerido</span>
                                        </div>
                                    )}
                                    <div className={styles.fieldGroup} style={{ marginTop: 16 }}>
                                        <label className={styles.fieldLabel}>Recomendaciones de refuerzo</label>
                                        <div className={styles.tagsGrid}>
                                            {availableThemes.map(theme => {
                                                const isSel = (manualData.recommendations || []).includes(theme);
                                                return (
                                                    <span key={theme} className={`${styles.tagChip} ${isSel ? styles.tagChipActive : ''}`}
                                                        onClick={() => toggleRec(manualData.recommendations || [], setManualData, theme)}>
                                                        {theme}
                                                    </span>
                                                );
                                            })}
                                            {availableThemes.length === 0 && (
                                                <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>No hay temas disponibles.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.wizardFooter}>
                            <button type="button" className={styles.btn} onClick={() => wizardStep === 1 ? setWizardOpen(false) : setWizardStep(s => s - 1)}>
                                {wizardStep === 1 ? 'Cancelar' : '← Anterior'}
                            </button>
                            <div className={styles.wizardFooterRight}>
                                <span className={styles.wizardStepCounter}>Paso {wizardStep} de {WIZARD_STEPS.length}</span>
                                {wizardStep < WIZARD_STEPS.length ? (
                                    <button type="button" className={styles.btn}
                                        disabled={(wizardStep === 1 && !wizardStep1Valid) || (wizardStep === 2 && !wizardStep2Valid)}
                                        onClick={() => setWizardStep(s => s + 1)}>
                                        Siguiente →
                                    </button>
                                ) : (
                                    <button type="button" className={styles.btn} disabled={!wizardStep3Valid} onClick={handleManualSubmit}>
                                        <Save size={14} /> Guardar y Publicar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </section>
    );
}
