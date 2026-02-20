import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

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
                position: formData.position || formData.puesto || '', // Handle legacy field name if needed
                area: formData.area,
                shift: formData.shift || ''
            });
            onUpdate({ ...employee, ...formData });
            onClose();
        } catch (error) {
            console.error("Error updating employee:", error);
            alert("Error al actualizar empleado");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar este empleado y todas sus asignaciones? Esta acción es irreversible.')) return;

        setLoading(true);
        try {
            // 1. Delete assignments (Cascading Delete)
            const programacionRef = collection(db, 'programacion');
            const q = query(programacionRef, where('employeeId', '==', employee.id));
            const snapshot = await getDocs(q);

            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            // 2. Delete employee
            await deleteDoc(doc(db, 'employees_programacion', employee.id));

            onDelete(employee.id);
            onClose();
        } catch (error) {
            console.error("Error deleting employee:", error);
            alert("Error al eliminar empleado: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px',
                width: '100%', maxWidth: '500px', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Editar Empleado</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSave} style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Nombre</label>
                        <input
                            name="name"
                            value={formData.name || ''}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>ID</label>
                        <input
                            name="employeeId"
                            value={formData.employeeId || ''}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Área</label>
                            <input
                                name="area"
                                value={formData.area || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Puesto</label>
                            <input
                                name="position"
                                value={formData.position || formData.puesto || ''}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                        <button
                            type="button"
                            onClick={handleDelete}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #ef4444',
                                background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer'
                            }}
                        >
                            <Trash2 size={18} /> Eliminar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.75rem 2rem', borderRadius: '8px', border: 'none',
                                background: '#6366f1', color: 'white', cursor: 'pointer'
                            }}
                        >
                            <Save size={18} /> Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
