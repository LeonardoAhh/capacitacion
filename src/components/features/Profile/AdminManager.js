'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, Shield, Edit2, Search, X, Save, CheckSquare, Square, FolderCog, BookOpen, User, LineChart, Home } from 'lucide-react';
import styles from './AdminManager.module.css';

const MODULES = [
    { id: 'candidatos', label: 'Candidatos', icon: Users },
    { id: 'capacitacion', label: 'Capacitación', icon: BookOpen },
    { id: 'employees', label: 'Empleados', icon: User },
    { id: 'reports', label: 'Reportes', icon: LineChart },
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'config', label: 'Configuración', icon: FolderCog },
];

const PERMISSION_TYPES = [
    { id: 'read', label: 'Ver' },
    { id: 'create', label: 'Crear' },
    { id: 'update', label: 'Editar' },
    { id: 'delete', label: 'Eliminar' }
];

export default function AdminManager() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initial load
    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, 'users'));
            const usersData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersData);
        } catch (error) {
            console.error('Error loading users:', error);
            // Optionally handle error UI
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user) => {
        // Prepare editable user state, ensuring permissions object structure exists
        const safeUser = {
            ...user,
            permissions: user.permissions || {}
        };
        setSelectedUser(safeUser);
        setIsModalOpen(true);
    };

    const togglePermission = (moduleId, type) => {
        if (!selectedUser) return;

        setSelectedUser(prev => {
            const currentModulePerms = prev.permissions[moduleId] || {};
            const newValue = !currentModulePerms[type];

            return {
                ...prev,
                permissions: {
                    ...prev.permissions,
                    [moduleId]: {
                        ...currentModulePerms,
                        [type]: newValue
                    }
                }
            };
        });
    };

    const handleRoleChange = (e) => {
        const newRole = e.target.checked ? 'admin' : 'user';
        setSelectedUser(prev => ({ ...prev, rol: newRole }));
    };

    const handleSave = async () => {
        if (!selectedUser) return;

        try {
            setSaving(true);
            const userRef = doc(db, 'users', selectedUser.id);

            // Only update role and permissions
            await updateDoc(userRef, {
                rol: selectedUser.rol,
                permissions: selectedUser.permissions
            });

            // Update local state
            setUsers(prev => prev.map(u => u.id === selectedUser.id ? selectedUser : u));
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error al guardar cambios');
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>
                    <Shield className={styles.icon} size={24} />
                    Gestión de Usuarios Admin
                </h2>
                <p style={{ color: '#8e8e93', fontSize: '14px', marginTop: '4px' }}>
                    Administra roles y permisos granulares por módulo.
                </p>
            </div>

            <div className={styles.searchSection}>
                <input
                    type="text"
                    placeholder="Buscar usuario por correo o nombre..."
                    className={styles.searchInput}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className={styles.usersList}>
                {loading ? (
                    <p>Cargando usuarios...</p>
                ) : filteredUsers.length === 0 ? (
                    <p>No se encontraron usuarios.</p>
                ) : (
                    filteredUsers.map(user => (
                        <div key={user.id} className={styles.userCard}>
                            <div className={styles.userInfo}>
                                <div className={styles.userAvatar}>
                                    {user.name ? user.name.charAt(0).toUpperCase() : <User size={20} />}
                                </div>
                                <div className={styles.userDetails}>
                                    <div className={styles.userEmail}>{user.email}</div>
                                    <div className={styles.userRole}>
                                        <span className={`${styles.roleTag} ${user.rol === 'super_admin' ? styles.roleTagSuper :
                                                user.rol === 'admin' ? styles.roleTagAdmin : styles.roleTagUser
                                            }`}>
                                            {user.rol || 'USER'}
                                        </span>
                                        {user.name && <span>• {user.name}</span>}
                                    </div>
                                </div>
                            </div>
                            <button
                                className={styles.editButton}
                                onClick={() => handleEditUser(user)}
                            >
                                <Edit2 size={14} style={{ marginRight: '6px' }} />
                                Permisos
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Modal */}
            {isModalOpen && selectedUser && (
                <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Editar Permisos: {selectedUser.email}</h3>
                            <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Role Switch */}
                            <div className={styles.roleSwitch}>
                                <div className={styles.switchLabel}>
                                    <span className={styles.switchTitle}>Acceso de Administrador</span>
                                    <span className={styles.switchDesc}>Habilitar capacidades de administración</span>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedUser.rol === 'admin' || selectedUser.rol === 'super_admin'}
                                        onChange={handleRoleChange}
                                        disabled={selectedUser.rol === 'super_admin'} // Prevent downgrading super_admin accidentally
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                    <span style={{ fontWeight: 500 }}>
                                        {selectedUser.rol === 'super_admin' ? 'Super Admin' : (selectedUser.rol === 'admin' ? 'Activado' : 'Desactivado')}
                                    </span>
                                </label>
                            </div>

                            {/* Permissions Matrix - Only show if Admin or Super Admin */}
                            {(selectedUser.rol === 'admin' || selectedUser.rol === 'super_admin') && (
                                <div className={styles.permissionsGrid}>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>Permisos por Módulo</h4>

                                    {MODULES.map(module => {
                                        const ModuleIcon = module.icon;
                                        return (
                                            <div key={module.id} className={styles.moduleCard}>
                                                <div className={styles.moduleHeader}>
                                                    <ModuleIcon size={18} />
                                                    {module.label}
                                                </div>
                                                <div className={styles.checkboxGroup}>
                                                    {PERMISSION_TYPES.map(type => {
                                                        const isChecked = selectedUser.permissions?.[module.id]?.[type.id] || false;
                                                        // Super admin always has full permissions visually (controlled by backend rules ideally, but here for UI consistency)
                                                        const displayChecked = selectedUser.rol === 'super_admin' ? true : isChecked;

                                                        return (
                                                            <label key={type.id} className={styles.checkboxLabel}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={displayChecked}
                                                                    onChange={() => togglePermission(module.id, type.id)}
                                                                    disabled={selectedUser.rol === 'super_admin'}
                                                                />
                                                                {type.label}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={`${styles.button} ${styles.cancelButton}`}
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className={`${styles.button} ${styles.saveButton}`}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
