import { useState } from 'react';
import { X, Download, CheckCircle, FileText, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';

export default function CourseViewer({ course, assignmentId, onClose, onUpdateStatus }) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        // En un caso real, aquí se abriría el link del PDF o se iniciaría la descarga.
        // Simularemos la descarga y actualizaremos el estado a 'viewed' si estaba en 'pending'.

        if (course.status === 'pending') {
            try {
                const assignRef = doc(db, 'programacion', assignmentId);
                await updateDoc(assignRef, {
                    status: 'viewed',
                    viewedAt: Timestamp.now()
                });
                onUpdateStatus(assignmentId, 'viewed');
            } catch (error) {
                console.error("Error updating status:", error);
            }
        }

        // Simular descarga
        alert(`Descargando material para: ${course.title}`);
        // window.open(course.materialUrl, '_blank'); 
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            const assignRef = doc(db, 'programacion', assignmentId);
            await updateDoc(assignRef, {
                status: 'completed',
                completedAt: Timestamp.now()
            });
            onUpdateStatus(assignmentId, 'completed');
            onClose(); // Cerrar al completar, o mostrar feedback
        } catch (error) {
            console.error("Error completing course:", error);
            alert("Error al completar el curso");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
                    padding: '1rem'
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    style={{
                        background: 'var(--bg-secondary)', width: '100%', maxWidth: '800px',
                        borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header con imagen o color */}
                    <div style={{
                        height: '200px', background: 'linear-gradient(135deg, #4f46e5, #ec4899)',
                        position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '2rem'
                    }}>
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: '1rem', right: '1rem',
                                background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '50%',
                                width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)'
                            }}
                        >
                            <X size={20} />
                        </button>
                        <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 700, margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                            {course.title}
                        </h1>
                    </div>

                    <div style={{ padding: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Descripción del Curso</h3>
                                <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                    {course.description || "Este curso cubre los aspectos fundamentales requeridos para tu puesto. Por favor revisa el material cuidadosamente."}
                                </p>

                                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Contenido</h3>
                                <div style={{
                                    padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '8px',
                                            background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Material de Lectura (PDF)</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lectura obligatoria • 15 min</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleDownload}
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)',
                                            background: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500
                                        }}
                                    >
                                        <Download size={16} /> Descargar
                                    </button>
                                </div>
                            </div>

                            <div style={{
                                background: 'var(--bg-tertiary)', padding: '1.5rem', borderRadius: '16px',
                                display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content'
                            }}>
                                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Tu Progreso</h4>
                                <div style={{
                                    padding: '0.5rem 1rem', borderRadius: '99px', width: 'fit-content',
                                    background: course.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                                    color: course.status === 'completed' ? '#16a34a' : '#fbbf24',
                                    fontWeight: 600, fontSize: '0.875rem'
                                }}>
                                    {course.status === 'completed' ? 'Completado' : course.status === 'viewed' ? 'En Progreso' : 'Pendiente'}
                                </div>

                                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />

                                <button
                                    onClick={handleComplete}
                                    disabled={course.status === 'completed' || loading}
                                    style={{
                                        width: '100%', padding: '1rem', borderRadius: '12px', border: 'none',
                                        background: course.status === 'completed' ? '#22c55e' : '#6366f1',
                                        color: 'white', fontWeight: 600, fontSize: '1rem', cursor: course.status === 'completed' ? 'default' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        opacity: loading ? 0.7 : 1
                                    }}
                                >
                                    {course.status === 'completed' ? (
                                        <>
                                            <CheckCircle size={20} /> ¡Completado!
                                        </>
                                    ) : (
                                        'Marcar como Completado'
                                    )}
                                </button>
                                {course.status !== 'completed' && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                                        Asegúrate de haber leído todo el material antes de marcarlo.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
