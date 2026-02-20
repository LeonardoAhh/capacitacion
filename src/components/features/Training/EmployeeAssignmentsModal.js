import { useState, useEffect } from 'react';
import { X, Trash2, Clock, CheckCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function EmployeeAssignmentsModal({ employee, onClose }) {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const q = query(collection(db, 'programacion'), where('employeeId', '==', employee.id));
                const snapshot = await getDocs(q);
                const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setAssignments(list);
            } catch (error) {
                console.error("Error fetching assignments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssignments();
    }, [employee]);

    const handleDeleteAssignment = async (assignmentId) => {
        if (!confirm('¿Eliminar esta asignación?')) return;
        try {
            await deleteDoc(doc(db, 'programacion', assignmentId));
            setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        } catch (error) {
            console.error("Error deleting assignment:", error);
            alert("Error al eliminar asignación");
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px',
                width: '100%', maxWidth: '600px', border: '1px solid var(--border-color)',
                color: 'var(--text-primary)', maxHeight: '80vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Asignaciones: {employee.name}</h2>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Historial de cursos asignados</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <p>Cargando asignaciones...</p>
                ) : assignments.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No hay cursos asignados.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {assignments.map(assign => (
                            <div key={assign.id} style={{
                                padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '12px',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: 'var(--bg-tertiary)'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                        {/* Ideally mapped name */}
                                        Curso: {assign.courseId}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <Clock size={12} />
                                        {assign.assignedAt?.seconds ? new Date(assign.assignedAt.seconds * 1000).toLocaleDateString() : 'Sin fecha'}
                                        <span style={{
                                            padding: '0.1rem 0.5rem', borderRadius: '4px',
                                            background: assign.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                            color: assign.status === 'completed' ? '#16a34a' : '#fbbf24'
                                        }}>
                                            {assign.status}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteAssignment(assign.id)}
                                    title="Eliminar asignación"
                                    style={{
                                        padding: '0.5rem', borderRadius: '8px', border: 'none',
                                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
