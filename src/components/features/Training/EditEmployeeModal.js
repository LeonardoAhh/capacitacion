import { useState } from 'react';
import { X, Save, Trash2, UserCog } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import styles from './EditEmployeeModal.module.css';

export default function EditEmployeeModal({ employee, onClose, onUpdate, onDelete }) {
    const [formData, setFormData] = useState({ ...employee });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const docRef = doc(db, 'employees_programacion', employee.id);
            await updateDoc(docRef, {
                name: formData.name,
                employeeId: formData.employeeId,
                position: formData.position || formData.puesto || '',
                area: formData.area,
                shift: formData.shift || ''
            });
            onUpdate({ ...employee, ...formData });
            onClose();
        } catch (error) {
            console.error('Error updating employee:', error);
            alert('Error al actualizar empleado');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`¿Eliminar a ${formData.name} y todas sus asignaciones? Esta acción es irreversible.`)) return;
        setLoading(true);
        try {
            const programacionRef = collection(db, 'programacion');
            const q = query(programacionRef, where('employeeId', '==', employee.id));
            const snapshot = await getDocs(q);

            const batch = writeBatch(db);
            snapshot.docs.forEach((d) => batch.delete(d.ref));
            await batch.commit();

            await deleteDoc(doc(db, 'employees_programacion', employee.id));
            onDelete(employee.id);
            onClose();
        } catch (error) {
            console.error('Error deleting employee:', error);
            alert('Error al eliminar empleado: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <UserCog size={18} />
                        </div>
                        <div>
                            <h2 className={styles.headerTitle}>Editar Empleado</h2>
                            <p className={styles.headerSubtitle}>Programación de capacitación</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSave}>
                    <div className={styles.body}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="em-name">Nombre Completo</label>
                            <input
                                id="em-name"
                                className={styles.input}
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="em-id">ID de Empleado</label>
                            <input
                                id="em-id"
                                className={styles.input}
                                name="employeeId"
                                value={formData.employeeId || ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className={styles.row}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label} htmlFor="em-area">Área</label>
                                <input
                                    id="em-area"
                                    className={styles.input}
                                    name="area"
                                    value={formData.area || ''}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label} htmlFor="em-position">Puesto</label>
                                <input
                                    id="em-position"
                                    className={styles.input}
                                    name="position"
                                    value={formData.position || formData.puesto || ''}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="em-shift">Turno</label>
                            <select
                                id="em-shift"
                                className={styles.select}
                                name="shift"
                                value={formData.shift || ''}
                                onChange={handleChange}
                            >
                                <option value="">Seleccionar turno</option>
                                <option value="1">Turno 1</option>
                                <option value="2">Turno 2</option>
                                <option value="3">Turno 3</option>
                                <option value="4">Turno 4</option>
                                <option value="Mixto">Mixto</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={styles.footer}>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            className={styles.deleteBtn}
                        >
                            <Trash2 size={16} />
                            Eliminar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={styles.saveBtn}
                        >
                            <Save size={16} />
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
