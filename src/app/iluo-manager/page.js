'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, Plus, Trash2, Search, ChevronRight, ChevronDown,
    Settings2, Users, Filter, Check, Sparkles, Download, ArrowLeft
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast/Toast';
import ProfileDropdown from '@/components/layout/ProfileDropdown/ProfileDropdown';
import styles from './page.module.css';

const CATEGORIES = ['TÉCNICA', 'SEGURIDAD', 'CALIDAD', 'LIDERAZGO'];
const CLIENTS = [
    'General', 'INALFA', 'ABC INOAC', 'KAWASAKI', 'VALEO', 'BOS',
    'GRAMMER', 'MAIER', 'HELLA', 'BCS', 'BHTC', 'STANT', 'CONDUMEX', 'STARLITE'
];

const CATEGORY_COLORS = {
    'TÉCNICA': '#007AFF',
    'SEGURIDAD': '#FF3B30',
    'CALIDAD': '#34C759',
    'LIDERAZGO': '#AF52DE'
};

export default function IluoManagerPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const mainRef = useRef(null);

    const [positionsList, setPositionsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPosition, setSelectedPosition] = useState(null);
    const [skills, setSkills] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [expandedDepts, setExpandedDepts] = useState(new Set());
    const [newSkill, setNewSkill] = useState({
        name: '',
        category: 'TÉCNICA',
        description: '',
        group: 'General'
    });

    useEffect(() => {
        if (authLoading || !user) return;
        if (user.rol !== 'super_admin') {
            setLoading(false);
            return;
        }

        const fetchPositions = async () => {
            try {
                const snapshot = await getDocs(query(collection(db, 'positions')));
                const loadedPositions = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data(),
                    department: d.data().department || 'General'
                })).sort((a, b) => a.name.localeCompare(b.name));
                setPositionsList(loadedPositions);
            } catch (error) {
                console.error('Error fetching positions:', error);
                toast.error('Error', 'No se pudieron cargar los puestos.');
            } finally {
                setLoading(false);
            }
        };
        fetchPositions();
    }, [user, authLoading, toast]);

    const handleSelectPosition = useCallback((pos) => {
        setSelectedPosition(pos);
        setSkills(pos.iluoSkills || []);
        if (window.innerWidth < 768) setIsDrawerOpen(false);
    }, []);

    const handleAddSkill = useCallback(async () => {
        if (!newSkill.name.trim()) {
            toast.warning('Nombre requerido');
            return;
        }

        const skillToAdd = {
            id: Date.now().toString(),
            name: newSkill.name.trim(),
            category: newSkill.category,
            description: newSkill.description.trim(),
            group: newSkill.group.trim() || 'General',
            createdAt: new Date().toISOString()
        };

        const updatedSkills = [...skills, skillToAdd];
        setSkills(updatedSkills);

        try {
            await updateDoc(doc(db, 'positions', selectedPosition.id), {
                iluoSkills: arrayUnion(skillToAdd)
            });
            setPositionsList(prev => prev.map(p =>
                p.id === selectedPosition.id ? { ...p, iluoSkills: updatedSkills } : p
            ));
            toast.success('Habilidad Agregada');
            setNewSkill({ name: '', category: 'TÉCNICA', description: '', group: newSkill.group });
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar');
            setSkills(skills.filter(s => s.id !== skillToAdd.id));
        }
    }, [newSkill, selectedPosition, skills, toast]);

    const handleDeleteSkill = useCallback(async (skillId) => {
        const skillToDelete = skills.find(s => s.id === skillId);
        const updatedSkills = skills.filter(s => s.id !== skillId);
        setSkills(updatedSkills);

        try {
            await updateDoc(doc(db, 'positions', selectedPosition.id), {
                iluoSkills: updatedSkills
            });
            setPositionsList(prev => prev.map(p =>
                p.id === selectedPosition.id ? { ...p, iluoSkills: updatedSkills } : p
            ));
            toast.success('Eliminada');
        } catch (error) {
            toast.error('Error al eliminar');
            setSkills(prev => [...prev, skillToDelete]);
        }
    }, [selectedPosition, skills, toast]);

    const groupedSkills = useMemo(() => {
        const groups = {};
        const filtered = activeFilter === 'Todos'
            ? skills
            : skills.filter(s => s.category === activeFilter);

        filtered.forEach(skill => {
            const group = skill.group || 'General';
            if (!groups[group]) groups[group] = [];
            groups[group].push(skill);
        });
        return groups;
    }, [skills, activeFilter]);

    const filteredPositions = useMemo(() =>
        positionsList.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [positionsList, searchTerm]);

    // Agrupar por departamento
    const groupedPositions = useMemo(() => {
        const groups = {};
        filteredPositions.forEach(pos => {
            const dept = pos.department || 'General';
            if (!groups[dept]) groups[dept] = [];
            groups[dept].push(pos);
        });
        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    }, [filteredPositions]);

    // Al buscar, auto-expandir todos los grupos con resultados
    useEffect(() => {
        if (searchTerm.trim()) {
            setExpandedDepts(new Set(groupedPositions.map(([dept]) => dept)));
        }
    }, [searchTerm, groupedPositions]);

    const toggleDept = useCallback((dept) => {
        setExpandedDepts(prev => {
            const next = new Set(prev);
            if (next.has(dept)) next.delete(dept);
            else next.add(dept);
            return next;
        });
    }, []);

    /** Exporta solo los nombres de puestos visibles a CSV */
    const handleExportExcel = useCallback(() => {
        const rows = [['Puesto'], ...filteredPositions.map(pos => [pos.name])];

        const csvContent = rows
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        a.download = `Puestos_${fecha}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Descargado', `${filteredPositions.length} puestos exportados`);
    }, [filteredPositions, toast]);

    const totalSkills = skills.length;

    if (user?.rol === 'demo' || user?.email?.includes('demo')) {
        return <AccessDenied />;
    }

    if (authLoading) return <LoadingState />;
    if (user?.rol !== 'super_admin') return <AccessDenied />;

    return (
        <>
            <div className={styles.container}>
                <header className={styles.topBar}>
                    <button
                        className={styles.menuBtn}
                        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                        aria-label={isDrawerOpen ? 'Cerrar menú' : 'Abrir menú'}
                    >
                        {isDrawerOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>

                    <div className={styles.topBarTitle}>
                        <Settings2 size={20} />
                        <span>ILUO Manager</span>
                    </div>

                    <Link href="/modulos" className={styles.topBarBack} aria-label="Volver a Módulos">
                        <ArrowLeft size={18} />
                    </Link>
                </header>

                <div className={styles.layout}>
                    <AnimatePresence>
                        {isDrawerOpen && (
                            <motion.aside
                                className={styles.drawer}
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 320, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            >
                                <div className={styles.drawerContent}>
                                    <div className={styles.drawerHeader}>
                                        <h2>Puestos</h2>
                                        <div className={styles.drawerHeaderActions}>
                                            <span className={styles.count}>{filteredPositions.length}</span>
                                            <button
                                                className={styles.exportBtn}
                                                onClick={handleExportExcel}
                                                title="Descargar como Excel"
                                                aria-label="Exportar puestos a Excel"
                                            >
                                                <Download size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.searchBox}>
                                        <Search size={18} />
                                        <input
                                            type="text"
                                            placeholder="Buscar puesto..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.positionsList}>
                                        {loading ? (
                                            <div className={styles.loadingDots}>Cargando...</div>
                                        ) : groupedPositions.length === 0 ? (
                                            <div className={styles.noResults}>Sin resultados</div>
                                        ) : (
                                            groupedPositions.map(([dept, positions]) => {
                                                const isOpen = expandedDepts.has(dept);
                                                const hasSelected = positions.some(p => p.id === selectedPosition?.id);
                                                return (
                                                    <div key={dept} className={styles.deptGroup}>
                                                        <button
                                                            className={`${styles.deptHeader} ${hasSelected ? styles.deptActive : ''}`}
                                                            onClick={() => toggleDept(dept)}
                                                        >
                                                            <span className={styles.deptName}>{dept}</span>
                                                            <div className={styles.deptMeta}>
                                                                <span className={styles.deptCount}>{positions.length}</span>
                                                                <ChevronDown
                                                                    size={14}
                                                                    className={`${styles.deptChevron} ${isOpen ? styles.deptChevronOpen : ''}`}
                                                                />
                                                            </div>
                                                        </button>

                                                        <AnimatePresence initial={false}>
                                                            {isOpen && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                                                    style={{ overflow: 'hidden' }}
                                                                >
                                                                    <div className={styles.deptPositions}>
                                                                        {positions.map(pos => (
                                                                            <button
                                                                                key={pos.id}
                                                                                className={`${styles.positionBtn} ${selectedPosition?.id === pos.id ? styles.active : ''}`}
                                                                                onClick={() => handleSelectPosition(pos)}
                                                                            >
                                                                                <span className={styles.positionName}>{pos.name}</span>
                                                                                <div className={styles.positionMeta}>
                                                                                    {pos.iluoSkills?.length > 0 && (
                                                                                        <span className={styles.skillBadge}>{pos.iluoSkills.length}</span>
                                                                                    )}
                                                                                    <ChevronRight size={14} />
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>

                                <div className={styles.drawerFooter}>
                                    <Link href="/modulos" className={styles.backLink}>
                                        <ArrowLeft size={16} />
                                        Volver a Módulos
                                    </Link>
                                </div>
                            </motion.aside>
                        )}
                    </AnimatePresence>

                    <main ref={mainRef} className={styles.main}>
                        {!selectedPosition ? (
                            <EmptyState />
                        ) : (
                            <div className={styles.content}>
                                <header className={styles.contentHeader}>
                                    <div>
                                        <h1>{selectedPosition.name}</h1>
                                        <span className={styles.deptBadge}>{selectedPosition.department}</span>
                                    </div>
                                    <div className={styles.statsCard}>
                                        <span className={styles.statsNumber}>{totalSkills}</span>
                                        <span className={styles.statsLabel}>Competencias</span>
                                    </div>
                                </header>

                                <div className={styles.filterBar}>
                                    <button
                                        className={`${styles.filterToggle} ${isFilterOpen ? styles.active : ''}`}
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    >
                                        <Filter size={16} />
                                        <span>Filtrar</span>
                                        {activeFilter !== 'Todos' && (
                                            <span className={styles.filterBadge}>1</span>
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {isFilterOpen && (
                                            <motion.div
                                                className={styles.filterChips}
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                            >
                                                <button
                                                    className={`${styles.filterChip} ${activeFilter === 'Todos' ? styles.chipActive : ''}`}
                                                    onClick={() => setActiveFilter('Todos')}
                                                >
                                                    Todos
                                                </button>
                                                {CATEGORIES.map(cat => (
                                                    <button
                                                        key={cat}
                                                        className={`${styles.filterChip} ${activeFilter === cat ? styles.chipActive : ''}`}
                                                        onClick={() => setActiveFilter(cat)}
                                                        style={{ '--cat-color': CATEGORY_COLORS[cat] }}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {Object.keys(groupedSkills).length === 0 ? (
                                    <div className={styles.emptySkills}>
                                        <Sparkles size={32} />
                                        <p>Sin competencias configuradas</p>
                                        <span>Toca el botón + para agregar</span>
                                    </div>
                                ) : (
                                    Object.entries(groupedSkills).map(([groupName, groupSkills]) => (
                                        <section key={groupName} className={styles.skillGroup}>
                                            <div className={styles.groupHeader}>
                                                <h3>{groupName}</h3>
                                                <span>{groupSkills.length}</span>
                                            </div>
                                            <div className={styles.chipsGrid}>
                                                {groupSkills.map(skill => (
                                                    <motion.div
                                                        key={skill.id}
                                                        className={styles.skillChip}
                                                        style={{ '--chip-color': CATEGORY_COLORS[skill.category] }}
                                                        initial={{ scale: 0.9, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        layout
                                                    >
                                                        <div className={styles.chipContent}>
                                                            <span className={styles.chipCategory}>{skill.category}</span>
                                                            <span className={styles.chipName}>{skill.name}</span>
                                                        </div>
                                                        <button
                                                            className={styles.chipDelete}
                                                            onClick={() => handleDeleteSkill(skill.id)}
                                                            aria-label="Eliminar"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </section>
                                    ))
                                )}
                            </div>
                        )}
                    </main>
                </div>

                <AnimatePresence>
                    {isModalOpen && (
                        <Modal onClose={() => setIsModalOpen(false)}>
                            <div className={styles.modalContent}>
                                <h2>Nueva Competencia</h2>

                                <div className={styles.formGroup}>
                                    <label>Cliente</label>
                                    <div className={styles.selectWrapper}>
                                        <select
                                            value={newSkill.group}
                                            onChange={(e) => setNewSkill(prev => ({ ...prev, group: e.target.value }))}
                                        >
                                            {CLIENTS.map(client => (
                                                <option key={client} value={client}>{client}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Nombre de la Habilidad</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Operación de Grúa Viajera"
                                        value={newSkill.name}
                                        onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Categoría</label>
                                    <div className={styles.categoryGrid}>
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                className={`${styles.categoryBtn} ${newSkill.category === cat ? styles.catActive : ''}`}
                                                onClick={() => setNewSkill(prev => ({ ...prev, category: cat }))}
                                                style={{ '--cat-color': CATEGORY_COLORS[cat] }}
                                            >
                                                <span className={styles.checkIcon}>
                                                    {newSkill.category === cat && <Check size={14} />}
                                                </span>
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label>Criterio de Evaluación</label>
                                    <input
                                        type="text"
                                        placeholder="¿Qué se necesita para aprobar?"
                                        value={newSkill.description}
                                        onChange={(e) => setNewSkill(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>

                                <button className={styles.submitBtn} onClick={handleAddSkill}>
                                    <Plus size={18} />
                                    Guardar Competencia
                                </button>
                            </div>
                        </Modal>
                    )}
                </AnimatePresence>
            </div>

            {/* ProfileDropdown fijo al viewport — fuera de cualquier contexto de composición */}
            <ProfileDropdown
                quickAction={selectedPosition ? {
                    icon: <Plus size={17} />,
                    label: 'Nueva Competencia',
                    onClick: () => setIsModalOpen(true),
                } : null}
            />
        </>
    );
}

function Modal({ children, onClose }) {
    return (
        <motion.div
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.modalSheet}
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </motion.div>
        </motion.div>
    );
}

function LoadingState() {
    return (
        <div className={styles.loadingScreen}>
            <div className={styles.spinner} />
        </div>
    );
}

function EmptyState() {
    return (
        <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
                <Users size={48} />
            </div>
            <h2>Selecciona un puesto</h2>
            <p>Elige un cargo del panel lateral para gestionar sus competencias ILUO</p>
        </div>
    );
}

function AccessDenied() {
    return (
        <div className={styles.accessDenied}>
            <div className={styles.deniedIcon}>⨂</div>
            <h1>Acceso Denegado</h1>
            <p>No tienes permisos para acceder a esta sección</p>
            <Link href="/modulos" className={styles.deniedLink}>
                Volver a Módulos
            </Link>
        </div>
    );
}
