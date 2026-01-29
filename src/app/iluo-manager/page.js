'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast/Toast';
import styles from './page.module.css';

export default function IluoManagerPage() {
    const { user } = useAuth();
    const { toast } = useToast();

    // Data States
    const [positionsList, setPositionsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [skills, setSkills] = useState([]); // Skills de la posición seleccionada

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('Todos');

    // UI States
    const [newSkill, setNewSkill] = useState({ name: '', category: 'Técnica', description: '' });

    // 1. Cargar Puestos (Scanner) - HOOK INCONDICIONAL (Correcto)
    useEffect(() => {
        // Validación interna para no ejecutar lógica si no es admin, 
        // pero el hook SIEMPRE se llama.
        if (user?.rol !== 'super_admin') {
            setLoading(false);
            return;
        }

        const fetchPositions = async () => {
            try {
                // Leemos la colección maestra de 'positions'
                const q = query(collection(db, 'positions'));
                const snapshot = await getDocs(q);

                const loadedPositions = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Si no tiene departamento, poner 'General'
                    department: doc.data().department || 'General'
                }));

                // Ordenar alfabéticamente
                loadedPositions.sort((a, b) => a.name.localeCompare(b.name));
                setPositionsList(loadedPositions);
            } catch (error) {
                console.error("Error fetching positions:", error);
                toast.error("Error", "No se pudieron cargar los puestos.");
            } finally {
                setLoading(false);
            }
        };
        fetchPositions();
    }, [user, toast]); // Modificado para incluir dependencias correctas

    // 2. Manejar Selección de Puesto
    const handleSelectPosition = (pos) => {
        setSelectedPosition(pos);
        // Si el puesto ya tiene 'iluoSkills' guardados, cargarlos. Si no, array vacío.
        setSkills(pos.iluoSkills || []);
    };

    // 3. Guardar Nueva Habilidad
    const handleAddSkill = async () => {
        if (!newSkill.name.trim()) return toast.warning("Nombre requerido");

        const skillToAdd = {
            id: Date.now().toString(), // ID simple temporal
            name: newSkill.name,
            category: newSkill.category,
            description: newSkill.description,
            createdAt: new Date().toISOString()
        };

        const updatedSkills = [...skills, skillToAdd];
        setSkills(updatedSkills); // Optimistic update

        try {
            const posRef = doc(db, 'positions', selectedPosition.id);
            await updateDoc(posRef, {
                iluoSkills: arrayUnion(skillToAdd)
            });

            // Actualizar también la lista local principal para reflejar cambios sin recargar
            setPositionsList(prev => prev.map(p =>
                p.id === selectedPosition.id ? { ...p, iluoSkills: updatedSkills } : p
            ));

            toast.success("Habilidad Agregada");
            setNewSkill({ name: '', category: 'Técnica', description: '' });
        } catch (error) {
            console.error(error);
            toast.error("Error al guardar");
        }
    };

    // 4. Borrar Habilidad
    const handleDeleteSkill = async (skillToDelete) => {
        if (!confirm("¿Eliminar esta habilidad?")) return;

        const updatedSkills = skills.filter(s => s.id !== skillToDelete.id);
        setSkills(updatedSkills);

        try {
            const posRef = doc(db, 'positions', selectedPosition.id);
            await updateDoc(posRef, {
                iluoSkills: updatedSkills
            });
            setPositionsList(prev => prev.map(p =>
                p.id === selectedPosition.id ? { ...p, iluoSkills: updatedSkills } : p
            ));
            toast.success("Eliminada");
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    // Validación de Acceso (Ahora sí podemos hacer return)
    if (user?.rol !== 'super_admin') {
        if (!user) return null; // Cargando auth...
        return <AccessDenied />;
    }

    // Filtrado
    const filteredPositions = positionsList.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = filterDept === 'Todos' || p.department === filterDept;
        return matchesSearch && matchesDept;
    });

    return (
        <div className={styles.container}>
            {/* Background Decorations */}
            <div className={styles.bgDecoration}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
                <div className={`${styles.blob} ${styles.blob3}`}></div>
            </div>

            {/* SIDEBAR: Lista de Puestos */}
            <aside className={styles.sidebar}>
                <header className={styles.sidebarHeader}>
                    <h2 className={styles.sidebarTitle}>Configuración ILUO</h2>
                    <p className={styles.sidebarSubtitle}>Catálogo Maestro de Habilidades</p>
                </header>

                <div className={styles.searchContainer}>
                    <input
                        className={styles.searchInput}
                        type="text"
                        placeholder="Buscar puesto..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className={styles.positionsList}>
                    {loading ? <p style={{ textAlign: 'center', padding: '20px', opacity: 0.5 }}>Cargando...</p> : (
                        <div>
                            {filteredPositions.map(pos => (
                                <div
                                    key={pos.id}
                                    onClick={() => handleSelectPosition(pos)}
                                    className={`${styles.positionItem} ${selectedPosition?.id === pos.id ? styles.active : ''}`}
                                >
                                    <div>
                                        <span className={styles.positionName}>{pos.name}</span>
                                        <span className={styles.positionDept}>{pos.department}</span>
                                    </div>
                                    {pos.iluoSkills && pos.iluoSkills.length > 0 && (
                                        <span className={styles.skillCount}>
                                            {pos.iluoSkills.length}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.sidebarFooter}>
                    <Link href="/modulos">
                        <button className={styles.backButton}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            Volver al Menu
                        </button>
                    </Link>
                </div>
            </aside>

            {/* MAIN CONTENT: Editor de Skills */}
            <main className={styles.main}>
                {!selectedPosition ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>👈</div>
                        <h2>Selecciona un puesto</h2>
                        <p>Elige un cargo del menú lateral para comenzar a definir sus competencias.</p>
                    </div>
                ) : (
                    <div className={styles.fadeIn}>
                        <header className={styles.header}>
                            <div className={styles.headerTitle}>
                                <h1>{selectedPosition.name}</h1>
                                <span className={styles.badge}>
                                    {selectedPosition.department}
                                </span>
                            </div>
                            <div style={{ textAlign: 'right', opacity: 0.7 }}>
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Total Habilidades</p>
                                <strong style={{ fontSize: '1.5rem' }}>{skills.length}</strong>
                            </div>
                        </header>

                        {/* LISTA DE SKILLS */}
                        <div className={styles.grid}>
                            {skills.map((skill, index) => (
                                <div key={index} className={styles.card}>
                                    <button
                                        onClick={() => handleDeleteSkill(skill)}
                                        className={styles.deleteBtn}
                                        title="Eliminar habilidad"
                                    >
                                        ✕
                                    </button>
                                    <span className={styles.cardCategory}>{skill.category}</span>
                                    <h4 className={styles.cardTitle}>{skill.name}</h4>
                                    {skill.description && <p className={styles.cardDesc}>{skill.description}</p>}
                                </div>
                            ))}
                        </div>

                        {/* FORMULARIO AGREGAR */}
                        <div className={styles.formCard}>
                            <div className={styles.formTitle}>
                                <div style={{ background: '#007AFF', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginRight: '10px' }}>+</div>
                                <span>Nueva Competencia</span>
                            </div>

                            <div className={styles.formGrid}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Nombre de la Habilidad</label>
                                    <input
                                        className={styles.input}
                                        placeholder="Ej. Operación de Grúa Viajera"
                                        value={newSkill.name}
                                        onChange={e => setNewSkill({ ...newSkill, name: e.target.value })}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Categoría</label>
                                    <select
                                        className={styles.select}
                                        value={newSkill.category}
                                        onChange={e => setNewSkill({ ...newSkill, category: e.target.value })}
                                    >
                                        <option>Técnica</option>
                                        <option>Seguridad</option>
                                        <option>Calidad</option>
                                        <option>Soft Skill</option>
                                        <option>Liderazgo</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Criterio de Evaluación (Opcional)</label>
                                <input
                                    className={styles.input}
                                    placeholder="¿Qué se necesita para aprobar?"
                                    value={newSkill.description}
                                    onChange={e => setNewSkill({ ...newSkill, description: e.target.value })}
                                />
                            </div>

                            <button className={styles.addButton} onClick={handleAddSkill}>
                                Guardar Habilidad en Matriz
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function AccessDenied() {
    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#fff', background: '#000' }}>
            <h1>🚫 Acceso Denegado</h1>
            <p style={{ color: '#999', marginBottom: '20px' }}>No tienes permisos para configurar el catálogo.</p>
            <Link href="/modulos"><button style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #333', cursor: 'pointer', background: 'transparent', color: '#fff' }}>Volver</button></Link>
        </div>
    );
}
