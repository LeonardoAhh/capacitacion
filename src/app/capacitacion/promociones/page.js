'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import {
    checkPromotionCriteria,
    getExamEligibility,
    getSemesterPeriod,
    calculateMonthsInPosition,
    formatDate,
    normalizePromotionRule
} from '@/lib/promotionUtils';
import { seedHistoryData } from '@/lib/seedHistorial';
import styles from './page.module.css';

export default function PromocionesPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [promotionRules, setPromotionRules] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, eligible, blocked, nearEligible
    const [deptFilter, setDeptFilter] = useState('Todos');
    const [departments, setDepartments] = useState([]);

    // View mode and sorting
    const [viewMode, setViewMode] = useState('cards'); // cards, table
    const [sortBy, setSortBy] = useState('name'); // name, department, criteria, startDate
    const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Reprocessing state
    const [reprocessing, setReprocessing] = useState(false);

    // Expanded rows
    const [expandedId, setExpandedId] = useState(null);

    // Modals
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [examModal, setExamModal] = useState(null);
    const [rulesModal, setRulesModal] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        positionStartDate: '',
        performanceScore: '',
        performancePeriod: getSemesterPeriod()
    });
    const [examData, setExamData] = useState({ date: '', score: '' });

    // Rule CRUD
    const [editingRule, setEditingRule] = useState(null);
    const [ruleForm, setRuleForm] = useState({
        currentPosition: '',
        promotionTo: '',
        temporalityMonths: 6,
        examMinScore: 80,
        matrixMinCoverage: 90,
        performanceMinScore: 80
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        loadData();
    }, []);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        filterEmployees();
    }, [searchTerm, statusFilter, deptFilter, employees, promotionRules, sortBy, sortOrder]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load employees
            const empSnap = await getDocs(query(collection(db, 'training_records'), orderBy('name')));
            const empData = empSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            setEmployees(empData);

            // Extract departments
            const depts = new Set(empData.map(e => e.department).filter(Boolean));
            setDepartments(Array.from(depts).sort());

            // Load promotion rules
            const rulesSnap = await getDocs(collection(db, 'promotion_rules'));
            if (rulesSnap.empty) {
                // Seed from JSON if empty
                await seedPromotionRules();
            } else {
                setPromotionRules(rulesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Error', 'No se pudieron cargar los datos');
        } finally {
            setLoading(false);
        }
    };

    const seedPromotionRules = async (forceReload = false) => {
        try {
            // If force reload, delete all existing rules first
            if (forceReload) {
                const existingRules = await getDocs(collection(db, 'promotion_rules'));
                for (const ruleDoc of existingRules.docs) {
                    await deleteDoc(doc(db, 'promotion_rules', ruleDoc.id));
                }
            }

            const rawRules = await import('@/data/promociones.json');
            const rules = rawRules.default || rawRules;

            const normalized = rules.map((r, i) => ({
                ...normalizePromotionRule(r),
                id: `rule_${i}`
            }));

            // Save to Firebase
            for (const rule of normalized) {
                await setDoc(doc(db, 'promotion_rules', rule.id), rule);
            }

            setPromotionRules(normalized);
            toast.success('Reglas Cargadas', `Se cargaron ${normalized.length} reglas de promoción`);
        } catch (err) {
            console.error('Error seeding rules:', err);
            toast.error('Error', 'No se pudieron cargar las reglas');
        }
    };

    const reloadRulesFromJSON = async () => {
        if (!confirm('¿Eliminar todas las reglas existentes y recargar desde el archivo JSON?')) return;
        setLoading(true);
        await seedPromotionRules(true);
        setLoading(false);
    };

    // Reprocess matrix compliance for all employees
    const handleReprocessCompliance = async () => {
        if (!confirm('¿Recalcular el cumplimiento de matriz para todos los empleados? Esto puede tomar unos segundos.')) return;

        setReprocessing(true);
        try {
            const result = await seedHistoryData();
            if (result.success) {
                toast.success('Reprocesado', `Se actualizaron ${result.processed} empleados.`);
                await loadData(); // Reload data
            } else {
                toast.error('Error', result.error || 'No se pudo reprocesar');
            }
        } catch (err) {
            console.error('Error reprocessing:', err);
            toast.error('Error', 'Error al reprocesar cumplimiento');
        } finally {
            setReprocessing(false);
        }
    };

    // Import promotion data (performance score and position start date) from JSON
    const importPromotionData = async () => {
        if (!confirm('¿Importar datos de evaluación de desempeño y temporalidad desde ultimosc.json? Esto actualizará los empleados existentes.')) return;

        setLoading(true);
        try {
            const rawData = await import('@/data/ultimosc.json');
            const promotionDataArray = rawData.default || rawData;

            let updated = 0;
            let notFound = 0;

            for (const data of promotionDataArray) {
                // Find employee by employeeId
                const employee = employees.find(e => e.employeeId === data.employeeId);

                if (employee && employee.id) {
                    // Update employee's promotionData in Firebase
                    const empRef = doc(db, 'training_records', employee.id);
                    const existingPromoData = employee.promotionData || {};

                    await updateDoc(empRef, {
                        promotionData: {
                            ...existingPromoData,
                            performanceScore: parseInt(data['calificación evaluación de desempeño']) || 0,
                            positionStartDate: data['temporalidad en el puesto'] || '',
                            performancePeriod: existingPromoData.performancePeriod || getSemesterPeriod()
                        }
                    });
                    updated++;
                } else {
                    console.log(`Employee not found: ${data.employeeId}`);
                    notFound++;
                }
            }

            toast.success('Datos Importados', `Se actualizaron ${updated} empleados. ${notFound > 0 ? `${notFound} no encontrados.` : ''}`);

            // Reload data
            await loadData();
        } catch (err) {
            console.error('Error importing promotion data:', err);
            toast.error('Error', 'No se pudieron importar los datos');
        } finally {
            setLoading(false);
        }
    };

    // Import exam data from JSON (handles multiple attempts per employee)
    const importExamData = async () => {
        if (!confirm('¿Importar datos de exámenes desde examens.json? Esto sobrescribirá los intentos de examen existentes.')) return;

        setLoading(true);
        try {
            const rawData = await import('@/data/examens.json');
            const examDataArray = rawData.default || rawData;

            // Group exams by employeeId
            const examsByEmployee = {};
            for (const exam of examDataArray) {
                const empId = exam.employeeId;
                if (!examsByEmployee[empId]) {
                    examsByEmployee[empId] = [];
                }

                const score = parseInt(exam['calificación obtenida']) || 0;
                const minPassScore = 80; // Default minimum passing score

                examsByEmployee[empId].push({
                    date: exam['fecha ultimo exámen'] || '',
                    score: score,
                    passed: score >= minPassScore
                });
            }

            // Sort each employee's exams by date
            for (const empId in examsByEmployee) {
                examsByEmployee[empId].sort((a, b) => new Date(a.date) - new Date(b.date));
            }

            let updated = 0;
            let notFound = 0;

            for (const empId in examsByEmployee) {
                // Find employee by employeeId
                const employee = employees.find(e => e.employeeId === empId);

                if (employee && employee.id) {
                    // Update employee's promotionData.examAttempts in Firebase
                    const empRef = doc(db, 'training_records', employee.id);
                    const existingPromoData = employee.promotionData || {};

                    await updateDoc(empRef, {
                        promotionData: {
                            ...existingPromoData,
                            examAttempts: examsByEmployee[empId]
                        }
                    });
                    updated++;
                } else {
                    console.log(`Employee not found for exams: ${empId}`);
                    notFound++;
                }
            }

            const totalExams = examDataArray.length;
            toast.success('Exámenes Importados', `Se actualizaron ${updated} empleados con ${totalExams} exámenes. ${notFound > 0 ? `${notFound} no encontrados.` : ''}`);

            // Reload data
            await loadData();
        } catch (err) {
            console.error('Error importing exam data:', err);
            toast.error('Error', 'No se pudieron importar los exámenes');
        } finally {
            setLoading(false);
        }
    };

    const filterEmployees = () => {
        let result = employees.filter(emp => {
            // Only include employees that have a matching promotion rule
            const rule = promotionRules.find(r =>
                r.currentPosition === emp.position?.toUpperCase()?.trim()
            );
            return rule !== undefined;
        });

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(e =>
                e.name?.toLowerCase().includes(term) ||
                e.employeeId?.toLowerCase().includes(term) ||
                e.position?.toLowerCase().includes(term)
            );
        }

        // Department filter
        if (deptFilter !== 'Todos') {
            result = result.filter(e => e.department === deptFilter);
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(emp => {
                const rule = promotionRules.find(r =>
                    r.currentPosition === emp.position?.toUpperCase()?.trim()
                );
                if (!rule) return false;

                const criteria = checkPromotionCriteria(emp, rule);

                if (statusFilter === 'eligible') return criteria.overall.eligible;
                if (statusFilter === 'blocked') return !criteria.overall.eligible;
                if (statusFilter === 'nearEligible') {
                    // Near eligible: 3 out of 4 criteria met
                    return !criteria.overall.eligible && criteria.overall.metCount >= 3;
                }

                return true;
            });
        }

        // Sorting
        result = result.map(emp => {
            const rule = promotionRules.find(r =>
                r.currentPosition === emp.position?.toUpperCase()?.trim()
            );
            const criteria = rule ? checkPromotionCriteria(emp, rule) : null;
            return { ...emp, _criteria: criteria, _rule: rule };
        });

        result.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    comparison = (a.name || '').localeCompare(b.name || '');
                    break;
                case 'department':
                    comparison = (a.department || '').localeCompare(b.department || '');
                    break;
                case 'criteria':
                    const aCount = a._criteria?.overall?.metCount || 0;
                    const bCount = b._criteria?.overall?.metCount || 0;
                    comparison = bCount - aCount; // Higher first by default
                    break;
                case 'startDate':
                    const aDate = new Date(a.promotionData?.positionStartDate || '9999-12-31');
                    const bDate = new Date(b.promotionData?.positionStartDate || '9999-12-31');
                    comparison = aDate - bDate;
                    break;
                default:
                    comparison = 0;
            }

            return sortOrder === 'desc' ? -comparison : comparison;
        });

        setFilteredEmployees(result);
        setCurrentPage(1); // Reset to first page when filters change
    };

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleEditEmployee = (emp) => {
        const promoData = emp.promotionData || {};
        setFormData({
            positionStartDate: promoData.positionStartDate || '',
            performanceScore: promoData.performanceScore || '',
            performancePeriod: promoData.performancePeriod || getSemesterPeriod()
        });
        setEditingEmployee(emp);
    };

    const handleSaveEmployee = async () => {
        if (!editingEmployee) return;

        try {
            const ref = doc(db, 'training_records', editingEmployee.id);
            const promotionData = {
                ...editingEmployee.promotionData,
                positionStartDate: formData.positionStartDate,
                performanceScore: parseFloat(formData.performanceScore) || 0,
                performancePeriod: formData.performancePeriod
            };

            await updateDoc(ref, {
                promotionData,
                updatedAt: new Date().toISOString()
            });

            // Update local state
            setEmployees(prev => prev.map(e =>
                e.id === editingEmployee.id
                    ? { ...e, promotionData }
                    : e
            ));

            toast.success('Guardado', 'Datos de promoción actualizados');
            setEditingEmployee(null);
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error', 'No se pudo guardar');
        }
    };

    const handleOpenExamModal = (emp) => {
        setExamData({ date: new Date().toISOString().split('T')[0], score: '' });
        setExamModal(emp);
    };

    const handleSaveExam = async () => {
        if (!examModal || !examData.score) return;

        try {
            const ref = doc(db, 'training_records', examModal.id);
            const currentPromoData = examModal.promotionData || {};
            const examAttempts = currentPromoData.examAttempts || [];

            const score = parseFloat(examData.score);
            const rule = promotionRules.find(r =>
                r.currentPosition === examModal.position?.toUpperCase()?.trim()
            );
            const passed = rule ? score >= rule.examMinScore : score >= 70;

            const newAttempt = {
                date: examData.date,
                score,
                passed
            };

            const updatedPromoData = {
                ...currentPromoData,
                examAttempts: [...examAttempts, newAttempt],
                lastExamDate: examData.date,
                examAttemptCount: examAttempts.length + 1
            };

            await updateDoc(ref, {
                promotionData: updatedPromoData,
                updatedAt: new Date().toISOString()
            });

            // Update local state
            setEmployees(prev => prev.map(e =>
                e.id === examModal.id
                    ? { ...e, promotionData: updatedPromoData }
                    : e
            ));

            toast.success(
                passed ? 'Examen Aprobado' : 'Examen Registrado',
                `Calificación: ${score}%`
            );
            setExamModal(null);
        } catch (error) {
            console.error('Error saving exam:', error);
            toast.error('Error', 'No se pudo guardar el examen');
        }
    };

    // Rule CRUD handlers
    const handleEditRule = (rule) => {
        setRuleForm({
            currentPosition: rule.currentPosition || '',
            promotionTo: rule.promotionTo || '',
            temporalityMonths: rule.temporalityMonths || 6,
            examMinScore: rule.examMinScore || 80,
            matrixMinCoverage: rule.matrixMinCoverage || 90,
            performanceMinScore: rule.performanceMinScore || 80
        });
        setEditingRule(rule);
    };

    const handleSaveRule = async () => {
        if (!ruleForm.currentPosition || !ruleForm.promotionTo) {
            toast.error('Error', 'Complete todos los campos');
            return;
        }

        try {
            const ruleId = editingRule?.id || `rule_${Date.now()}`;
            const ruleData = {
                ...ruleForm,
                currentPosition: ruleForm.currentPosition.toUpperCase().trim(),
                promotionTo: ruleForm.promotionTo.toUpperCase().trim()
            };

            await setDoc(doc(db, 'promotion_rules', ruleId), ruleData);

            if (editingRule) {
                setPromotionRules(prev => prev.map(r =>
                    r.id === ruleId ? { ...ruleData, id: ruleId } : r
                ));
            } else {
                setPromotionRules(prev => [...prev, { ...ruleData, id: ruleId }]);
            }

            toast.success('Guardado', 'Regla de promoción guardada');
            setEditingRule(null);
            setRuleForm({
                currentPosition: '',
                promotionTo: '',
                temporalityMonths: 6,
                examMinScore: 80,
                matrixMinCoverage: 90,
                performanceMinScore: 80
            });
        } catch (error) {
            console.error('Error saving rule:', error);
            toast.error('Error', 'No se pudo guardar la regla');
        }
    };

    const handleDeleteRule = async (ruleId) => {
        if (!confirm('¿Eliminar esta regla de promoción?')) return;

        try {
            await deleteDoc(doc(db, 'promotion_rules', ruleId));
            setPromotionRules(prev => prev.filter(r => r.id !== ruleId));
            toast.success('Eliminado', 'Regla eliminada');
        } catch (error) {
            console.error('Error deleting rule:', error);
            toast.error('Error', 'No se pudo eliminar');
        }
    };

    const getStatusBadge = (criteria) => {
        if (criteria.overall.eligible) {
            return <span className={`${styles.statusBadge} ${styles.eligible}`}>✅ APTO</span>;
        }
        return <span className={`${styles.statusBadge} ${styles.blocked}`}>❌ NO APTO</span>;
    };

    const getCriteriaIcon = (met) => (
        <span className={met ? styles.criteriaPass : styles.criteriaFail}>
            {met ? '✓' : '✗'}
        </span>
    );

    return (
        <>
            <Navbar />
            <main className={styles.main}>
                <div className={styles.header}>
                    <div>
                        <Link href="/capacitacion" className={styles.backBtn}>← Volver</Link>
                        <h1>Control de Promociones</h1>
                        <p>Monitoreo de elegibilidad para cambio de categoría</p>
                    </div>
                    <Button variant="outline" onClick={() => setRulesModal(true)}>
                        ⚙️ Reglas ({promotionRules.length})
                    </Button>
                </div>

                {/* Filters */}
                <Card className={styles.filterCard}>
                    <CardContent className={styles.filterContent}>
                        <div className={styles.filterGroup}>
                            <label>Buscar</label>
                            <input
                                type="text"
                                placeholder="Nombre, ID o puesto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                        <div className={styles.filterGroup}>
                            <label>Departamento</label>
                            <select
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className={styles.select}
                            >
                                <option value="Todos">Todos</option>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <label>Estado</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className={styles.select}
                            >
                                <option value="all">Todos</option>
                                <option value="eligible">✅ Aptos</option>
                                <option value="nearEligible">🔶 Próximos (3/4)</option>
                                <option value="blocked">❌ No Aptos</option>
                            </select>
                        </div>
                        <div className={styles.filterGroup}>
                            <label>Ordenar por</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className={styles.select}
                            >
                                <option value="name">Nombre</option>
                                <option value="department">Departamento</option>
                                <option value="criteria">% Criterios</option>
                                <option value="startDate">Fecha Inicio</option>
                            </select>
                        </div>
                        <button
                            className={styles.sortToggle}
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                        <div className={styles.filterGroup}>
                            <label>Vista</label>
                            <div className={styles.viewToggle}>
                                <button
                                    className={`${styles.viewBtn} ${viewMode === 'cards' ? styles.active : ''}`}
                                    onClick={() => setViewMode('cards')}
                                    title="Vista tarjetas"
                                >
                                    ▦
                                </button>
                                <button
                                    className={`${styles.viewBtn} ${viewMode === 'table' ? styles.active : ''}`}
                                    onClick={() => setViewMode('table')}
                                    title="Vista tabla"
                                >
                                    ≡
                                </button>
                            </div>
                        </div>
                        <div className={styles.countBadge}>
                            {filteredEmployees.length} Empleados
                        </div>
                    </CardContent>
                </Card>

                {/* Employee List */}
                {loading ? (
                    <div className="spinner"></div>
                ) : filteredEmployees.length === 0 ? (
                    <Card>
                        <CardContent className={styles.emptyState}>
                            <p>No hay empleados con rutas de promoción definidas.</p>
                            <p className={styles.subText}>Configure las reglas de promoción para ver empleados elegibles.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Table View */}
                        {viewMode === 'table' ? (
                            <Card>
                                <div className={styles.tableContainer}>
                                    <table className={styles.dataTable}>
                                        <thead>
                                            <tr>
                                                <th>Empleado</th>
                                                <th>Puesto Actual</th>
                                                <th>Departamento</th>
                                                <th>Progreso</th>
                                                <th>Desempeño</th>
                                                <th>Temporalidad</th>
                                                <th>Matriz</th>
                                                <th>Examen</th>
                                                <th>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredEmployees
                                                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                                .map(emp => {
                                                    const rule = emp._rule || promotionRules.find(r =>
                                                        r.currentPosition === emp.position?.toUpperCase()?.trim()
                                                    );
                                                    if (!rule) return null;
                                                    const criteria = emp._criteria || checkPromotionCriteria(emp, rule);
                                                    const progressPercent = (criteria.overall.metCount / 4) * 100;

                                                    return (
                                                        <tr key={emp.id} onClick={() => toggleExpand(emp.id)} className={styles.tableRow}>
                                                            <td>
                                                                <div className={styles.empNameCell}>
                                                                    <strong>ID {emp.employeeId} {emp.name}</strong>
                                                                </div>
                                                            </td>
                                                            <td>{emp.position}</td>
                                                            <td>{emp.department}</td>
                                                            <td>
                                                                <div className={styles.progressMini}>
                                                                    <div
                                                                        className={`${styles.progressFillMini} ${criteria.overall.metCount >= 4 ? styles.progressGreen :
                                                                            criteria.overall.metCount >= 2 ? styles.progressYellow :
                                                                                styles.progressRed
                                                                            }`}
                                                                        style={{ width: `${progressPercent}%` }}
                                                                    />
                                                                </div>
                                                                <span className={styles.progressText}>{criteria.overall.metCount}/4</span>
                                                            </td>
                                                            <td className={criteria.performance.met ? styles.cellPass : styles.cellFail}>
                                                                {criteria.performance.current}%
                                                            </td>
                                                            <td className={criteria.temporality.met ? styles.cellPass : styles.cellFail}>
                                                                {criteria.temporality.current}m
                                                            </td>
                                                            <td className={criteria.matrix.met ? styles.cellPass : styles.cellFail}>
                                                                {criteria.matrix.current}%
                                                            </td>
                                                            <td className={criteria.exam.met ? styles.cellPass : styles.cellFail}>
                                                                {criteria.exam.current !== null ? `${criteria.exam.current}%` : '-'}
                                                            </td>
                                                            <td>{getStatusBadge(criteria)}</td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        ) : (
                            /* Cards View */
                            <div className={styles.employeeList}>
                                {filteredEmployees
                                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                    .map(emp => {
                                        const rule = emp._rule || promotionRules.find(r =>
                                            r.currentPosition === emp.position?.toUpperCase()?.trim()
                                        );
                                        if (!rule) return null;

                                        const criteria = emp._criteria || checkPromotionCriteria(emp, rule);
                                        const examEligibility = getExamEligibility(
                                            emp.promotionData?.examAttempts,
                                            rule.temporalityMonths,
                                            emp.promotionData?.positionStartDate
                                        );
                                        const isExpanded = expandedId === emp.id;
                                        const progressPercent = (criteria.overall.metCount / 4) * 100;

                                        return (
                                            <Card
                                                key={emp.id}
                                                className={`${styles.employeeCard} ${isExpanded ? styles.expanded : ''}`}
                                            >
                                                {/* Collapsed View */}
                                                <div
                                                    className={styles.cardHeader}
                                                    onClick={() => toggleExpand(emp.id)}
                                                >
                                                    <div className={styles.expandIcon}>
                                                        {isExpanded ? '▼' : '▶'}
                                                    </div>
                                                    <div className={styles.empInfo}>
                                                        <div className={styles.empName}>ID {emp.employeeId} {emp.name}</div>
                                                        <div className={styles.empPosition}>
                                                            {emp.position} → {rule.promotionTo}
                                                        </div>
                                                        {/* Progress Bar */}
                                                        <div className={styles.progressBarSmall}>
                                                            <div
                                                                className={`${styles.progressFillSmall} ${criteria.overall.metCount >= 4 ? styles.progressGreen :
                                                                    criteria.overall.metCount >= 2 ? styles.progressYellow :
                                                                        styles.progressRed
                                                                    }`}
                                                                style={{ width: `${progressPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className={styles.criteriaIcons}>
                                                        <div className={styles.criteriaIcon} title="1. Evaluación de Desempeño">
                                                            {getCriteriaIcon(criteria.performance.met)}
                                                            <span>Eval</span>
                                                        </div>
                                                        <div className={styles.criteriaIcon} title="2. Temporalidad en Puesto">
                                                            {getCriteriaIcon(criteria.temporality.met)}
                                                            <span>Temp</span>
                                                        </div>
                                                        <div className={styles.criteriaIcon} title="3. Cobertura de Matriz">
                                                            {getCriteriaIcon(criteria.matrix.met)}
                                                            <span>Matr</span>
                                                        </div>
                                                        <div className={styles.criteriaIcon} title="4. Examen Teórico">
                                                            {getCriteriaIcon(criteria.exam.met)}
                                                            <span>Exam</span>
                                                        </div>
                                                    </div>
                                                    <div className={styles.criteriaCount}>
                                                        {criteria.overall.metCount}/4
                                                    </div>
                                                    {getStatusBadge(criteria)}
                                                </div>

                                                {/* Expanded View */}
                                                {isExpanded && (
                                                    <div className={styles.cardBody}>
                                                        <div className={styles.detailGrid}>
                                                            {/* 1. Performance */}
                                                            <div className={styles.detailBox}>
                                                                <div className={styles.detailHeader}>
                                                                    <span className={styles.orderBadge}>1</span>
                                                                    {getCriteriaIcon(criteria.performance.met)}
                                                                    <span>⭐ EVAL. DESEMPEÑO</span>
                                                                </div>
                                                                <div className={styles.detailContent}>
                                                                    <div className={styles.detailRow}>
                                                                        <span>Calificación:</span>
                                                                        <strong className={criteria.performance.met ? styles.valuePass : styles.valueFail}>
                                                                            {criteria.performance.current}%
                                                                        </strong>
                                                                    </div>
                                                                    <div className={styles.detailRow}>
                                                                        <span>Requerido:</span>
                                                                        <strong>≥{criteria.performance.required}%</strong>
                                                                    </div>
                                                                </div>
                                                                <Button variant="ghost" size="sm" onClick={() => handleEditEmployee(emp)}>
                                                                    ✏️ Editar
                                                                </Button>
                                                            </div>

                                                            {/* 2. Temporality */}
                                                            <div className={styles.detailBox}>
                                                                <div className={styles.detailHeader}>
                                                                    <span className={styles.orderBadge}>2</span>
                                                                    {getCriteriaIcon(criteria.temporality.met)}
                                                                    <span>📅 TEMPORALIDAD</span>
                                                                </div>
                                                                <div className={styles.detailContent}>
                                                                    <div className={styles.detailRow}>
                                                                        <span>Tiempo actual:</span>
                                                                        <strong className={criteria.temporality.met ? styles.valuePass : styles.valueFail}>
                                                                            {criteria.temporality.current} meses
                                                                        </strong>
                                                                    </div>
                                                                    <div className={styles.detailRow}>
                                                                        <span>Requerido:</span>
                                                                        <strong>≥{criteria.temporality.required} meses</strong>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* 3. Matrix */}
                                                            <div className={styles.detailBox}>
                                                                <div className={styles.detailHeader}>
                                                                    <span className={styles.orderBadge}>3</span>
                                                                    {getCriteriaIcon(criteria.matrix.met)}
                                                                    <span>📊 COBERTURA MATRIZ</span>
                                                                </div>
                                                                <div className={styles.detailContent}>
                                                                    <div className={styles.detailRow}>
                                                                        <span>Cobertura:</span>
                                                                        <strong className={criteria.matrix.met ? styles.valuePass : styles.valueFail}>
                                                                            {criteria.matrix.current}%
                                                                        </strong>
                                                                    </div>
                                                                    <div className={styles.detailRow}>
                                                                        <span>Requerido:</span>
                                                                        <strong>≥{criteria.matrix.required}%</strong>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* 4. Exam */}
                                                            <div className={styles.detailBox}>
                                                                <div className={styles.detailHeader}>
                                                                    <span className={styles.orderBadge}>4</span>
                                                                    {getCriteriaIcon(criteria.exam.met)}
                                                                    <span>📝 EXAMEN TEÓRICO</span>
                                                                </div>
                                                                <div className={styles.detailContent}>
                                                                    <div className={styles.detailRow}>
                                                                        <span>Última calif:</span>
                                                                        <strong className={criteria.exam.met ? styles.valuePass : styles.valueFail}>
                                                                            {criteria.exam.current !== null ? `${criteria.exam.current}%` : 'Sin intentos'}
                                                                        </strong>
                                                                    </div>
                                                                    <div className={styles.detailRow}>
                                                                        <span>Intentos:</span>
                                                                        <strong>{criteria.exam.attempts}</strong>
                                                                    </div>
                                                                    {!examEligibility.canTakeExam && (
                                                                        <div className={styles.examWarning}>
                                                                            ⚠️ {examEligibility.reason}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOpenExamModal(emp)}
                                                                    disabled={!examEligibility.canTakeExam}
                                                                >
                                                                    + Registrar
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Exam History */}
                                                        {emp.promotionData?.examAttempts?.length > 0 && (
                                                            <div className={styles.examHistory}>
                                                                <h4>📜 Historial de Exámenes</h4>
                                                                <div className={styles.historyList}>
                                                                    {[...emp.promotionData.examAttempts].reverse().slice(0, 5).map((attempt, i) => (
                                                                        <div key={i} className={styles.historyItem}>
                                                                            <span>{formatDate(attempt.date)}</span>
                                                                            <span className={attempt.passed ? styles.passed : styles.failed}>
                                                                                {attempt.score}% {attempt.passed ? '✓' : '✗'}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Card>
                                        );
                                    })}
                            </div>
                        )}

                        {/* Pagination */}
                        {filteredEmployees.length > itemsPerPage && (
                            <div className={styles.pagination}>
                                <button
                                    className={styles.pageBtn}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    ← Anterior
                                </button>
                                <div className={styles.pageInfo}>
                                    Página {currentPage} de {Math.ceil(filteredEmployees.length / itemsPerPage)}
                                </div>
                                <button
                                    className={styles.pageBtn}
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredEmployees.length / itemsPerPage), p + 1))}
                                    disabled={currentPage >= Math.ceil(filteredEmployees.length / itemsPerPage)}
                                >
                                    Siguiente →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Edit Employee Modal */}
            <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
                <DialogHeader>
                    <DialogTitle>Editar Datos de Promoción</DialogTitle>
                    <DialogClose onClose={() => setEditingEmployee(null)} />
                </DialogHeader>
                <DialogBody>
                    <div className={styles.formGroup}>
                        <label>Fecha Inicio Puesto Actual</label>
                        <input
                            type="date"
                            value={formData.positionStartDate}
                            onChange={(e) => setFormData({ ...formData, positionStartDate: e.target.value })}
                        />
                        <small>Fecha en que tomó el puesto actual (cambio de categoría anterior)</small>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Período de Evaluación</label>
                        <select
                            value={formData.performancePeriod}
                            onChange={(e) => setFormData({ ...formData, performancePeriod: e.target.value })}
                        >
                            <option value="JUL-DIC 2025">JUL-DIC 2025</option>
                            <option value="ENE-JUN 2026">ENE-JUN 2026</option>
                            <option value="JUL-DIC 2026">JUL-DIC 2026</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label>Calificación Evaluación Desempeño (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.performanceScore}
                            onChange={(e) => setFormData({ ...formData, performanceScore: e.target.value })}
                            placeholder="0-100"
                        />
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setEditingEmployee(null)}>Cancelar</Button>
                    <Button onClick={handleSaveEmployee}>Guardar</Button>
                </DialogFooter>
            </Dialog>

            {/* Exam Registration Modal */}
            <Dialog open={!!examModal} onOpenChange={(open) => !open && setExamModal(null)}>
                <DialogHeader>
                    <DialogTitle>Registrar Examen Teórico</DialogTitle>
                    <DialogClose onClose={() => setExamModal(null)} />
                </DialogHeader>
                <DialogBody>
                    <p className={styles.modalSubtitle}>{examModal?.name}</p>
                    <div className={styles.formGroup}>
                        <label>Fecha del Examen</label>
                        <input
                            type="date"
                            value={examData.date}
                            onChange={(e) => setExamData({ ...examData, date: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>Calificación (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={examData.score}
                            onChange={(e) => setExamData({ ...examData, score: e.target.value })}
                            placeholder="0-100"
                        />
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setExamModal(null)}>Cancelar</Button>
                    <Button onClick={handleSaveExam}>Registrar</Button>
                </DialogFooter>
            </Dialog>

            {/* Rules Management Modal */}
            <Dialog open={rulesModal} onOpenChange={(open) => !open && setRulesModal(false)}>
                <DialogHeader>
                    <DialogTitle>Reglas de Promoción</DialogTitle>
                    <DialogClose onClose={() => setRulesModal(false)} />
                </DialogHeader>
                <DialogBody className={styles.rulesModalBody}>
                    {/* Add/Edit Rule Form */}
                    <div className={styles.ruleForm}>
                        <h4>{editingRule ? 'Editar Regla' : 'Nueva Regla'}</h4>
                        <div className={styles.ruleFormGrid}>
                            <div className={styles.formGroup}>
                                <label>Puesto Actual</label>
                                <input
                                    type="text"
                                    value={ruleForm.currentPosition}
                                    onChange={(e) => setRuleForm({ ...ruleForm, currentPosition: e.target.value })}
                                    placeholder="AUXILIAR DE ALMACÉN B"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Promoción A</label>
                                <input
                                    type="text"
                                    value={ruleForm.promotionTo}
                                    onChange={(e) => setRuleForm({ ...ruleForm, promotionTo: e.target.value })}
                                    placeholder="AUXILIAR DE ALMACÉN A"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Temporalidad (meses)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={ruleForm.temporalityMonths}
                                    onChange={(e) => setRuleForm({ ...ruleForm, temporalityMonths: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Examen Mín. (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={ruleForm.examMinScore}
                                    onChange={(e) => setRuleForm({ ...ruleForm, examMinScore: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Matriz Mín. (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={ruleForm.matrixMinCoverage}
                                    onChange={(e) => setRuleForm({ ...ruleForm, matrixMinCoverage: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Desempeño Mín. (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={ruleForm.performanceMinScore}
                                    onChange={(e) => setRuleForm({ ...ruleForm, performanceMinScore: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className={styles.ruleFormActions}>
                            {editingRule && (
                                <Button variant="ghost" onClick={() => {
                                    setEditingRule(null);
                                    setRuleForm({
                                        currentPosition: '',
                                        promotionTo: '',
                                        temporalityMonths: 6,
                                        examMinScore: 80,
                                        matrixMinCoverage: 90,
                                        performanceMinScore: 80
                                    });
                                }}>
                                    Cancelar
                                </Button>
                            )}
                            <Button onClick={handleSaveRule}>
                                {editingRule ? 'Actualizar' : 'Agregar'}
                            </Button>
                        </div>
                    </div>

                    {/* Rules List */}
                    <div className={styles.rulesList}>
                        <div className={styles.rulesListHeader}>
                            <h4>Reglas Existentes ({promotionRules.length})</h4>
                            <Button variant="ghost" size="sm" onClick={reloadRulesFromJSON}>
                                🔄 Recargar desde JSON
                            </Button>
                        </div>
                        <div className={styles.rulesTable}>
                            {promotionRules.slice(0, 20).map(rule => (
                                <div key={rule.id} className={styles.ruleRow}>
                                    <div className={styles.ruleInfo}>
                                        <strong>{rule.currentPosition}</strong>
                                        <span>→ {rule.promotionTo}</span>
                                        <small>
                                            {rule.temporalityMonths}m | Exam {rule.examMinScore}% |
                                            Matriz {rule.matrixMinCoverage}% | Eval {rule.performanceMinScore}%
                                        </small>
                                    </div>
                                    <div className={styles.ruleActions}>
                                        <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                                            ✏️
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                                            🗑️
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {promotionRules.length > 20 && (
                                <p className={styles.moreRules}>+{promotionRules.length - 20} reglas más...</p>
                            )}
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button onClick={() => setRulesModal(false)}>Cerrar</Button>
                </DialogFooter>
            </Dialog>
        </>
    );
}
