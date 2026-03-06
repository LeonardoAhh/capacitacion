'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, GitCompareArrows, CheckCircle2, XCircle, Target } from 'lucide-react';
import { useToast } from '@/components/ui/Toast/Toast';
import { BackgroundLines } from '@/components/ui/BackgroundLines/BackgroundLines';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import styles from './page.module.css';

export default function ComparacionPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    // States
    const [searchId, setSearchId] = useState('');
    const [loading, setLoading] = useState(false);
    const [employee, setEmployee] = useState(null);
    const [positions, setPositions] = useState([]);
    const [targetPosition, setTargetPosition] = useState('');
    const [targetCourses, setTargetCourses] = useState([]);
    const [comparison, setComparison] = useState(null);

    // Load all positions on mount
    // Auth Protection
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (!authLoading && user && (user.rol === 'demo' || user.email?.includes('demo'))) {
            router.push('/induccion');
        }
    }, [user, authLoading, router]);

    // Load all positions on mount
    useEffect(() => {
        if (!user) return;
        const loadPositions = async () => {
            try {
                const snap = await getDocs(collection(db, 'positions'));
                const posData = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(p => p.requiredCourses && p.requiredCourses.length > 0)
                    .sort((a, b) => a.name.localeCompare(b.name));
                setPositions(posData);
            } catch (err) {
                console.error('Error loading positions:', err);
            }
        };
        loadPositions();
    }, [user]);



    // Search employee
    const handleSearch = useCallback(async () => {
        if (!searchId.trim()) return;
        setLoading(true);
        setEmployee(null);
        setComparison(null);

        try {
            // Try direct doc first
            const directRef = doc(db, 'training_records', searchId.trim());
            let empDoc = await getDoc(directRef);
            let empData = null;

            if (empDoc.exists()) {
                empData = { id: empDoc.id, ...empDoc.data() };
            } else {
                const q = query(
                    collection(db, 'training_records'),
                    where('employeeId', '==', searchId.trim())
                );
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const docData = snapshot.docs[0];
                    empData = { id: docData.id, ...docData.data() };
                }
            }

            if (empData) {
                setEmployee(empData);
                toast.success('✓', empData.name);
            } else {
                toast.error('No encontrado', 'No existe empleado con ese ID');
            }
        } catch (error) {
            console.error('Error searching:', error);
            toast.error('Error', 'Error al buscar el empleado');
        } finally {
            setLoading(false);
        }
    }, [searchId, toast]);

    // When target position changes, compute comparison
    useEffect(() => {
        if (!employee || !targetPosition) {
            setComparison(null);
            return;
        }

        const pos = positions.find(p => p.name === targetPosition);
        if (!pos) return;

        const required = pos.requiredCourses || [];
        setTargetCourses(required);

        const history = employee.history || [];

        // Normalize for matching
        const normalize = (str) => (str || '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toUpperCase().trim();

        // Get approved courses
        const approvedCourses = history
            .filter(h => {
                const score = parseFloat(h.score) || parseFloat(h.qualification) || 0;
                return h.status === 'approved' || (h.status === undefined && score >= 80);
            })
            .map(h => normalize(h.courseName || h.course));

        const approvedSet = new Set(approvedCourses);

        const completed = required.filter(c => approvedSet.has(normalize(c)));
        const missing = required.filter(c => !approvedSet.has(normalize(c)));

        const percentage = required.length > 0
            ? Math.round((completed.length / required.length) * 100)
            : 100;

        setComparison({ completed, missing, percentage, totalRequired: required.length });
    }, [employee, targetPosition, positions]);

    if (authLoading || !user) {
        return (
            <AdminLayout title="Comparación">
                <div className={styles.pageWrapper} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Comparación VS Puesto Objetivo">
            <div className={styles.pageWrapper}>
                {/* Background */}
                <div className={styles.bgDecoration}>
                    <BackgroundLines svgOptions={{ duration: 15 }} />
                </div>

                <div className={styles.container}>
                    <div className={styles.pageHeader}>
                        <h1 className={styles.pageTitle}>Comparación de Perfiles</h1>
                    </div>

                    {/* Search Section */}
                    <motion.div
                        className={styles.searchSection}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Employee Search */}
                        <div className={styles.searchCard}>
                            <div className={styles.searchLabel}>
                                <Search size={14} />
                                Empleado
                            </div>
                            <div className={styles.searchInputRow}>
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="ID del empleado..."
                                    value={searchId}
                                    onChange={(e) => setSearchId(e.target.value)}
                                    maxLength={5}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <button
                                    className={styles.searchBtn}
                                    onClick={handleSearch}
                                    disabled={loading || !searchId.trim()}
                                >
                                    {loading ? <span className={styles.spinner} /> : 'Buscar'}
                                </button>
                            </div>

                            {employee && (
                                <motion.div
                                    className={styles.employeeBadge}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div className={styles.employeeAvatar}>
                                        {(employee.name || '?')[0]}
                                    </div>
                                    <div className={styles.employeeInfo}>
                                        <div className={styles.employeeName}>{employee.name}</div>
                                        <div className={styles.employeePosition}>{employee.position}</div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Position Selector */}
                        <div className={styles.searchCard}>
                            <div className={styles.searchLabel}>
                                <Target size={14} />
                                Puesto Objetivo
                            </div>
                            <select
                                className={styles.positionSelect}
                                value={targetPosition}
                                onChange={(e) => setTargetPosition(e.target.value)}
                                disabled={!employee}
                            >
                                <option value="">Seleccionar puesto...</option>
                                {positions.map(p => (
                                    <option key={p.id} value={p.name}>
                                        {p.name} ({p.requiredCourses?.length || 0} cursos)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </motion.div>

                    {/* Results */}
                    <AnimatePresence mode="wait">
                        {comparison ? (
                            <motion.div
                                key="results"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                {/* Summary Cards */}
                                <div className={styles.summaryRow}>
                                    <div className={`${styles.summaryCard} ${styles.summaryGreen}`}>
                                        <div className={styles.summaryNumber}>{comparison.completed.length}</div>
                                        <div className={styles.summaryLabel}>Completados</div>
                                    </div>
                                    <div className={`${styles.summaryCard} ${styles.summaryRed}`}>
                                        <div className={styles.summaryNumber}>{comparison.missing.length}</div>
                                        <div className={styles.summaryLabel}>Faltantes</div>
                                    </div>
                                    <div className={`${styles.summaryCard} ${styles.summaryBlue}`}>
                                        <div className={styles.summaryNumber}>{comparison.percentage}%</div>
                                        <div className={styles.summaryLabel}>Cumplimiento</div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className={styles.progressSection}>
                                    <div className={styles.progressBar}>
                                        <motion.div
                                            className={styles.progressFill}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${comparison.percentage}%` }}
                                            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                                        />
                                    </div>
                                    <div className={styles.progressLabel}>
                                        <span>{comparison.completed.length} de {comparison.totalRequired} cursos</span>
                                        <span>{comparison.percentage}%</span>
                                    </div>
                                </div>

                                {/* Columns */}
                                <div className={styles.columnsGrid}>
                                    {/* Completed */}
                                    <motion.div
                                        className={styles.column}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 0.2 }}
                                    >
                                        <div className={styles.columnHeader}>
                                            <div className={`${styles.columnIcon} ${styles.columnIconGreen}`}>
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <span className={styles.columnTitle}>Cursos Completados</span>
                                            <span className={`${styles.columnCount} ${styles.columnCountGreen}`}>
                                                {comparison.completed.length}
                                            </span>
                                        </div>
                                        <div className={styles.columnBody}>
                                            {comparison.completed.length > 0 ? (
                                                comparison.completed.map((course, i) => (
                                                    <motion.div
                                                        key={course}
                                                        className={styles.courseItem}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.3 + i * 0.03 }}
                                                    >
                                                        <div className={`${styles.courseCheck} ${styles.courseCheckGreen}`}>✓</div>
                                                        <span className={styles.courseName}>{course}</span>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className={styles.emptyList}>Sin cursos completados para este puesto</div>
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Missing */}
                                    <motion.div
                                        className={styles.column}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 0.3 }}
                                    >
                                        <div className={styles.columnHeader}>
                                            <div className={`${styles.columnIcon} ${styles.columnIconRed}`}>
                                                <XCircle size={20} />
                                            </div>
                                            <span className={styles.columnTitle}>Cursos Faltantes</span>
                                            <span className={`${styles.columnCount} ${styles.columnCountRed}`}>
                                                {comparison.missing.length}
                                            </span>
                                        </div>
                                        <div className={styles.columnBody}>
                                            {comparison.missing.length > 0 ? (
                                                comparison.missing.map((course, i) => (
                                                    <motion.div
                                                        key={course}
                                                        className={styles.courseItem}
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.4 + i * 0.03 }}
                                                    >
                                                        <div className={`${styles.courseCheck} ${styles.courseCheckRed}`}>✗</div>
                                                        <span className={styles.courseName}>{course}</span>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className={styles.emptyList}>¡Todos los cursos completados! 🎉</div>
                                            )}
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="idle"
                                className={styles.idleState}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className={styles.idleIcon}>
                                    <GitCompareArrows size={36} />
                                </div>
                                <div className={styles.idleTitle}>Comparar Empleado vs Puesto</div>
                                <div className={styles.idleDescription}>
                                    Busca un empleado por su ID y selecciona el puesto objetivo para ver qué cursos le faltan y cuáles ya tiene completados.
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div >
        </AdminLayout>
    );
}
