'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast/Toast';
import styles from './page.module.css';

import { useRouter } from 'next/navigation';

export default function IluoManagerPage() {
    const { user } = useAuth();
    const router = useRouter(); // Hook de navegación
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
    // Agregamos 'group' al estado inicial
    const [newSkill, setNewSkill] = useState({ name: '', category: 'Técnica', description: '', group: 'General' });

    // 1. Cargar Puestos (Scanner)
    useEffect(() => {
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
                    department: doc.data().department || 'General'
                }));

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
    }, [user, toast]);

    // 2. Manejar Selección de Puesto
    const handleSelectPosition = (pos) => {
        setSelectedPosition(pos);
        setSkills(pos.iluoSkills || []);
    };

    // 3. Guardar Nueva Habilidad
    const handleAddSkill = async () => {
        if (!newSkill.name.trim()) return toast.warning("Nombre requerido");

        const skillToAdd = {
            id: Date.now().toString(),
            name: newSkill.name,
            category: newSkill.category,
            description: newSkill.description,
            group: newSkill.group.trim() || 'General', // Default a General
            createdAt: new Date().toISOString()
        };

        const updatedSkills = [...skills, skillToAdd];
        setSkills(updatedSkills); // Optimistic update

        try {
            const posRef = doc(db, 'positions', selectedPosition.id);
            await updateDoc(posRef, {
                iluoSkills: arrayUnion(skillToAdd)
            });

            setPositionsList(prev => prev.map(p =>
                p.id === selectedPosition.id ? { ...p, iluoSkills: updatedSkills } : p
            ));

            toast.success("Habilidad Agregada");
            // Reset form pero mantenemos el último grupo usado por comodidad
            setNewSkill({ ...newSkill, name: '', description: '' });
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

    // Helper para agrupar skills por 'group'
    const groupedSkills = skills.reduce((acc, skill) => {
        const group = skill.group || 'General';
        if (!acc[group]) acc[group] = [];
        acc[group].push(skill);
        return acc;
    }, {});

    // Validación de Acceso
    if (user?.rol === 'demo' || user?.email?.includes('demo')) {
        router.push('/induccion');
        return null; // Evitar renderizado mientras redirige
    }

    if (user?.rol !== 'super_admin') {
        if (!user) return null;
        return <AccessDenied />;
    }

    // Filtrado Sidebar
    const filteredPositions = positionsList.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className={styles.container}>
            <div className={styles.bgDecoration}>
                <div className={`${styles.blob} ${styles.blob1}`}></div>
                <div className={`${styles.blob} ${styles.blob2}`}></div>
                <div className={`${styles.blob} ${styles.blob3}`}></div>
            </div>

            {/* SIDEBAR */}
            <aside className={styles.sidebar}>
                <header className={styles.sidebarHeader}>
                    <h2 className={styles.sidebarTitle}>ILUO</h2>
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

            {/* MAIN CONTENT */}
            <main className={styles.main} id="main-content">
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
                                <p style={{ margin: 0, fontSize: '0.9rem' }}>Competencias Totales</p>
                                <strong style={{ fontSize: '1.5rem' }}>{skills.length}</strong>
                            </div>
                        </header>

                        {/* LISTA DE SKILLS AGRUPADAS */}
                        {Object.keys(groupedSkills).length === 0 ? (
                            <div className={styles.emptyState} style={{ minHeight: '200px' }}>
                                <p>Este puesto aún no tiene habilidades configuradas.</p>
                            </div>
                        ) : (
                            Object.entries(groupedSkills).map(([groupName, groupSkills]) => (
                                <div key={groupName} style={{ marginBottom: '40px' }}>
                                    <h3 style={{
                                        fontSize: '1.1rem',
                                        fontWeight: '700',
                                        color: 'var(--text-primary)',
                                        marginBottom: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <span style={{ width: '6px', height: '22px', background: 'var(--color-primary)', borderRadius: '3px', display: 'block' }}></span>
                                        {groupName}
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>({groupSkills.length})</span>
                                    </h3>

                                    <div className={styles.grid}>
                                        {groupSkills.map((skill, index) => (
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
                                </div>
                            ))
                        )}

                        {/* FORMULARIO AGREGAR */}
                        <div className={styles.formCard}>
                            <div className={styles.formTitle}>
                                <div style={{ background: 'var(--color-primary)', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '1.2rem' }}>+</div>
                                <span>Nueva Competencia</span>
                            </div>

                            {/* Campo de Grupo (Nuevo) - Con Lista Maestra de Clientes */}
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Cliente</label>
                                <input
                                    className={styles.input}
                                    placeholder="Selecciona de la lista o escribe uno nuevo..."
                                    value={newSkill.group}
                                    onChange={e => setNewSkill({ ...newSkill, group: e.target.value })}
                                    list="groups-list"
                                    autoComplete="off"
                                />
                                <datalist id="groups-list">
                                    <option value="General" />
                                    {/* Clientes Principales */}
                                    <option value="INALFA" />
                                    <option value="ABC INOAC" />
                                    <option value="KAWASAKI" />
                                    <option value="VALEO" />
                                    <option value="BOS" />
                                    <option value="GRAMMER" />
                                    <option value="MAIER" />
                                    <option value="HELLA" />
                                    <option value="BCS" />
                                    <option value="BHTC" />
                                    <option value="STANT" />
                                    <option value="CONDUMEX" />
                                    <option value="STARLITE" />
                                    {/* Grupos Dinámicos (evitando duplicados) */}
                                    {Object.keys(groupedSkills).filter(g =>
                                        !['General', 'INALFA', 'ABC INOAC', 'KAWASAKI', 'VALEO', 'BOS', 'GRAMMER', 'MAIER', 'HELLA', 'BCS', 'BHTC', 'STANT', 'CONDUMEX', 'STARLITE'].includes(g)
                                    ).map(g => (
                                        <option key={g} value={g} />
                                    ))}
                                </datalist>
                                <small style={{ color: 'var(--text-tertiary)', marginTop: '5px', display: 'block', fontSize: '0.75rem' }}>
                                    Asigna esta competencia a un Cliente específico o déjala en General. Si el cliente no está en la lista, escríbelo para crearlo.
                                </small>
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
                                        <option>TÉCNICA</option>
                                        <option>SEGURIDAD</option>
                                        <option>CALIDAD</option>
                                        <option>LIDERAZGO</option>
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
        <div style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: 'var(--text-primary)',
            background: 'var(--bg-primary)',
            textAlign: 'center',
            padding: '20px'
        }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🚫</div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '1.5rem' }}>Acceso Denegado</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>No tienes permisos para configurar el catálogo.</p>
            <Link href="/modulos">
                <button style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                }}>
                    Volver a Módulos
                </button>
            </Link>
        </div>
    );
}
