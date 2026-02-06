import { useState, useEffect } from 'react';
import { Search, Filter, Download, CheckCircle, Clock, Eye, RefreshCw } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export default function MonitoringTable() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, viewed, completed
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchData(true); // Silent refresh
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true);
        setRefreshing(true);
        try {
            // 1. Fetch all assignments
            const progSnap = await getDocs(collection(db, 'programacion'));
            const progList = progSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 2. Fetch all employees & courses to map names
            // Optimization: In a real large app we would paginate or index.
            // Here we fetch all for simplicity as requested.
            const empSnap = await getDocs(collection(db, 'employees_programacion'));
            const employeesMap = {};
            empSnap.docs.forEach(d => { employeesMap[d.id] = d.data(); });

            const courseSnap = await getDocs(collection(db, 'cursos_induccion'));
            const coursesMap = {};
            courseSnap.docs.forEach(d => { coursesMap[d.id] = d.data(); });

            // 3. Merge data
            const fullData = progList.map(item => {
                const emp = employeesMap[item.employeeId] || { name: 'Desconocido', area: '-' };
                const course = coursesMap[item.courseId] || { nombre: 'Curso eliminado' };

                return {
                    ...item,
                    employeeName: emp.name,
                    employeeArea: emp.area,
                    courseTitle: course.nombre || course.title || 'Sin título'
                };
            });

            setAssignments(fullData);
        } catch (error) {
            console.error("Error fetching monitoring data:", error);
        } finally {
            if (!silent) setLoading(false);
            setRefreshing(false);
        }
    };

    const filteredData = assignments.filter(item => {
        const matchesSearch =
            item.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' || item.status === filter;

        return matchesSearch && matchesFilter;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return <span style={{ color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', fontWeight: 600 }}><CheckCircle size={12} /> Completado</span>;
            case 'viewed':
                return <span style={{ color: '#f97316', background: 'rgba(249, 115, 22, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', fontWeight: 600 }}><Eye size={12} /> En Progreso</span>;
            case 'assigned':
            case 'pending':
            default:
                return <span style={{ color: '#64748b', background: 'rgba(100, 116, 139, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', fontWeight: 600 }}><Clock size={12} /> Pendiente</span>;
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
            {/* Header / Controls */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Avance de Capacitación</h2>

                <div style={{ display: 'flex', gap: '1rem', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div style={{ position: 'relative', maxWidth: '300px', width: '100%' }}>
                        <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            placeholder="Buscar por empleado o curso..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px',
                                border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)'
                            }}
                        />
                    </div>

                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{
                            padding: '0.6rem 2rem 0.6rem 1rem', borderRadius: '8px',
                            border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="pending">Pendientes</option>
                        <option value="assigned">Asignados</option>
                        <option value="viewed">En Progreso</option>
                        <option value="completed">Completados</option>
                    </select>

                    <button
                        onClick={() => fetchData()}
                        disabled={refreshing}
                        style={{
                            padding: '0.6rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            cursor: refreshing ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                        title="Actualizar datos"
                    >
                        <RefreshCw
                            size={16}
                            style={{
                                animation: refreshing ? 'spin 1s linear infinite' : 'none'
                            }}
                        />
                        Actualizar
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Empleado</th>
                            <th style={{ padding: '1rem' }}>Área</th>
                            <th style={{ padding: '1rem' }}>Curso</th>
                            <th style={{ padding: '1rem' }}>Estado</th>
                            <th style={{ padding: '1rem' }}>Fecha Asignación</th>
                            <th style={{ padding: '1rem' }}>Fecha Completado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Cargando datos...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No se encontraron registros.</td></tr>
                        ) : (
                            filteredData.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 500 }}>{item.employeeName}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.employeeArea}</td>
                                    <td style={{ padding: '1rem' }}>{item.courseTitle}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {getStatusBadge(item.status)}
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{formatDate(item.assignedAt)}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                        {item.status === 'completed' ? formatDate(item.completedAt) : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
