"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
    ChevronDown,
    ChevronUp,
    Search,
    MoreVertical,
    Users,
    Building2,
    Sparkles,
    Zap
} from 'lucide-react';
import BackButton from '@/components/ui/BackButton/BackButton';
import styles from './organigrama.module.css';

import rawData from '@/data/organigrama.json';

// Transformación de datos: De Niveles Planos a Árbol Jerárquico
const buildOrgTree = (data) => {
    const positions = [];
    const levels = data.organizational_structure;

    // 1. Aplanar todos los niveles en una sola lista de posiciones
    Object.keys(levels).forEach(levelKey => {
        if (levels[levelKey].positions) {
            levels[levelKey].positions.forEach(pos => {
                positions.push({
                    ...pos,
                    levelName: levels[levelKey].level
                });
            });
        }
    });

    // 2. Crear un mapa de nodos para acceso rápido y una lista de referencia con IDs únicos
    const nodeMap = {};
    const nodesRef = [];

    positions.forEach((pos, index) => {
        const uniqueId = `${pos.title.trim()}_${index}`;

        const node = {
            id: uniqueId,
            name: pos.title,
            role: pos.department || pos.levelName || 'N/A',
            department: pos.department || (pos.location ? `Sede: ${pos.location}` : 'Corporativo'),
            rawDepartment: pos.department,
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(pos.title + index)}`,
            children: [],
            originalData: pos,
            reportsToTitle: pos.reports_to ? pos.reports_to.trim() : null
        };

        nodeMap[uniqueId] = node;
        nodesRef.push(node);
    });

    // 3. Construir el árbol enlazando padres e hijos
    const nodesByTitle = {};
    nodesRef.forEach(node => {
        const title = node.name.trim();
        if (!nodesByTitle[title]) {
            nodesByTitle[title] = [];
        }
        nodesByTitle[title].push(node);
    });

    let root = null;
    nodesRef.forEach(node => {
        const parentTitle = node.reportsToTitle;

        if (parentTitle) {
            const potentialParents = nodesByTitle[parentTitle];

            if (potentialParents && potentialParents.length > 0) {
                potentialParents[0].children.push(node);
            } else {
                if (!root) root = node;
            }
        } else {
            if (!root) root = node;
        }
    });

    return { root: root || (positions.length > 0 ? nodesRef[0] : null), nodesRef };
};

const { root: initialRoot, nodesRef: allNodes } = buildOrgTree(rawData);

// Extraer departamentos únicos para el filtro
const departments = ['General', ...new Set(allNodes
    .map(n => n.rawDepartment)
    .filter(d => d)
    .sort()
)];

// Componente de Tarjeta de Empleado (Premium Design)
const EmployeeCard = ({ data, onClick, isExpanded }) => {
    const shouldReduceMotion = useReducedMotion();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                }
            }}
            whileHover={{
                scale: shouldReduceMotion ? 1 : 1.02,
                transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            className={`${styles.cardWrapper} ${isExpanded ? styles.cardExpanded : ''} ${isHovered ? styles.cardHovered : ''}`}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Glow effect on hover */}
            <div className={styles.cardGlow} />

            {/* Sparkle decoration for expanded cards */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className={styles.sparkleIcon}
                        initial={{ opacity: 0, rotate: -45, scale: 0 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <Sparkles size={14} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={styles.avatarContainer}>
                <motion.div
                    className={styles.avatar}
                    animate={{
                        boxShadow: isHovered
                            ? '0 8px 24px rgba(var(--color-primary-rgb), 0.3)'
                            : '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <img src={data.image} alt={data.name} className={styles.avatarImg} />
                </motion.div>

                {/* Animated status indicator */}
                <motion.div
                    className={styles.statusIndicator}
                    animate={{
                        scale: isExpanded ? [1, 1.2, 1] : 1,
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: isExpanded ? Infinity : 0,
                        repeatType: "reverse"
                    }}
                >
                    <div className={`${styles.point} ${isExpanded ? styles.pointActive : ''}`} />
                </motion.div>
            </div>

            <motion.h3
                className={styles.name}
                layout="position"
            >
                {data.name}
            </motion.h3>

            <motion.p
                className={styles.role}
                layout="position"
            >
                {data.role}
            </motion.p>

            {/* Decorative Chip with icon */}
            <motion.div
                className={styles.chip}
                whileHover={{ scale: 1.05 }}
            >
                <Building2 size={10} className={styles.chipIcon} />
                <span>{data.department}</span>
            </motion.div>

            {/* Connection line indicator */}
            {data.children && data.children.length > 0 && (
                <div className={styles.connectionIndicator}>
                    <div className={styles.connectionDot} />
                </div>
            )}

            {/* Expand indicator with animation */}
            {data.children && data.children.length > 0 && (
                <motion.div
                    className={styles.expandIndicator}
                    animate={{
                        y: isHovered ? 2 : 0
                    }}
                >
                    <motion.div
                        className={styles.expandIconWrapper}
                        animate={{
                            rotate: isExpanded ? 180 : 0
                        }}
                        transition={{ duration: 0.3 }}
                    >
                        <ChevronDown size={14} />
                    </motion.div>

                    {/* Child count badge */}
                    <motion.div
                        className={styles.childCountBadge}
                        initial={{ scale: 0 }}
                        animate={{ scale: isHovered ? 1 : 0 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <Users size={10} />
                        <span>{data.children.length}</span>
                    </motion.div>
                </motion.div>
            )}
        </motion.div>
    );
};

// Componente Recursivo para el Árbol con animaciones mejoradas
const OrgNode = ({ node, level = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const shouldReduceMotion = useReducedMotion();

    if (!node) return null;

    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className={styles.nodeWrapper}>
            <EmployeeCard
                data={node}
                isExpanded={isExpanded}
                onClick={() => setIsExpanded(!isExpanded)}
            />

            <AnimatePresence mode="wait">
                {hasChildren && isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{
                            opacity: 1,
                            height: "auto",
                            transition: {
                                height: { duration: 0.3 },
                                opacity: { duration: 0.2, delay: 0.1 }
                            }
                        }}
                        exit={{
                            opacity: 0,
                            height: 0,
                            transition: {
                                height: { duration: 0.2 },
                                opacity: { duration: 0.1 }
                            }
                        }}
                        className={styles.childrenContainer}
                    >
                        {/* Línea vertical conectora animada */}
                        <motion.div
                            className={styles.verticalLine}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        />

                        <div className={styles.branchContainer}>
                            {/* Línea horizontal superior */}
                            {node.children.length > 1 && (
                                <motion.div
                                    className={styles.horizontalLine}
                                    style={{ width: `calc(100% - ${node.children.length === 2 ? '50%' : '140px'})` }}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                />
                            )}

                            {/* Mapeo de hijos con stagger animation */}
                            {node.children.map((child, index) => (
                                <motion.div
                                    key={child.id}
                                    className={styles.childNode}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: shouldReduceMotion ? 0 : 0.1 + (index * 0.05)
                                    }}
                                >
                                    {/* Conector vertical para cada hijo */}
                                    <motion.div
                                        className={styles.childVerticalLine}
                                        initial={{ scaleY: 0 }}
                                        animate={{ scaleY: 1 }}
                                        transition={{ duration: 0.2, delay: 0.2 + (index * 0.05) }}
                                    />
                                    <OrgNode node={child} level={level + 1} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function OrganigramaPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDept, setSelectedDept] = useState('General');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const shouldReduceMotion = useReducedMotion();

    // Lógica para obtener el/los nodos raíces según el departamento seleccionado
    const getDisplayRoots = () => {
        if (selectedDept === 'General') {
            return initialRoot ? [initialRoot] : [];
        }

        const deptNodes = allNodes.filter(n => n.rawDepartment === selectedDept);

        const roots = deptNodes.filter(node => {
            const parentTitle = node.reportsToTitle;
            if (!parentTitle) return true;

            const parentInDept = deptNodes.some(n => n.name.trim() === parentTitle);
            return !parentInDept;
        });

        return roots;
    };

    const displayRoots = getDisplayRoots();

    return (
        <div className={styles.pageContainer}>
            {/* Animated background elements */}
            <div className={styles.background}>
                <motion.div
                    className={`${styles.blob} ${styles.blobBlue}`}
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, 50, 0],
                        y: [0, 30, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className={`${styles.blob} ${styles.blobPurple}`}
                    animate={{
                        scale: [1, 1.15, 1],
                        x: [0, -30, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className={`${styles.blob} ${styles.blobAccent}`}
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 20, 0],
                        y: [0, 40, 0],
                    }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                />
            </div>

            {/* Header Premium */}
            <motion.header
                className={styles.header}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
            >
                <div className={styles.headerContent}>
                    <div className={styles.headerTitleGroup}>
                        <BackButton href="/" className="!mb-0" />
                        <div className={styles.titleWrapper}>
                            <motion.span
                                className={styles.subTitle}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                Empresa
                            </motion.span>
                            <motion.h1
                                className={styles.title}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                Organigrama
                                <Zap className={styles.titleIcon} size={24} />
                            </motion.h1>
                        </div>
                    </div>

                    {/* Barra de Búsqueda Premium */}
                    <motion.div
                        className={`${styles.searchContainer} ${isSearchFocused ? styles.searchFocused : ''}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <motion.div
                            className={styles.searchIcon}
                            animate={{
                                scale: isSearchFocused ? 1.1 : 1,
                                color: isSearchFocused ? 'var(--color-primary)' : 'var(--text-tertiary)'
                            }}
                        >
                            <Search size={20} />
                        </motion.div>
                        <input
                            type="text"
                            placeholder="Buscar puesto, nombre..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                        />
                        <AnimatePresence>
                            {searchTerm && (
                                <motion.button
                                    className={styles.clearSearch}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0 }}
                                    onClick={() => setSearchTerm('')}
                                >
                                    ×
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </motion.header>

            {/* Selector de Departamentos Premium */}
            <motion.div
                className={styles.chipContainer}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                {departments.map((dept, index) => (
                    <motion.button
                        key={dept}
                        onClick={() => setSelectedDept(dept)}
                        className={`${styles.deptChip} ${selectedDept === dept ? styles.chipActive : ''}`}
                        whileHover={{
                            scale: shouldReduceMotion ? 1 : 1.05,
                            y: -2
                        }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + (index * 0.05) }}
                    >
                        {dept}
                        {selectedDept === dept && (
                            <motion.div
                                className={styles.chipActiveIndicator}
                                layoutId="activeChip"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                    </motion.button>
                ))}
            </motion.div>

            {/* Contenido Principal */}
            <main className={styles.main}>
                <motion.div
                    className={styles.treeContainer}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                >
                    {displayRoots.length > 0 ? (
                        <div className={styles.rootsGrid}>
                            {displayRoots.map((rootNode, index) => (
                                <motion.div
                                    key={rootNode.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + (index * 0.1) }}
                                >
                                    <OrgNode node={rootNode} />
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            className={styles.emptyState}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Users size={48} className={styles.emptyIcon} />
                            <p>No se encontraron puestos para este departamento.</p>
                        </motion.div>
                    )}
                </motion.div>
            </main>

            {/* Floating Action Button Premium */}
            <motion.div
                className={styles.fabWrapper}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 400 }}
            >
                <motion.button
                    whileHover={{
                        scale: 1.1,
                        rotate: 90
                    }}
                    whileTap={{ scale: 0.9 }}
                    className={styles.fab}
                >
                    <MoreVertical size={24} />
                </motion.button>
            </motion.div>
        </div>
    );
}