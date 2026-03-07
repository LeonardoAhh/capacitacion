'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, SlidersHorizontal } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout/AdminLayout';
import { Button } from '@/components/ui/Button/Button';
import { useToast } from '@/components/ui/Toast/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
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
import { useConfirm } from '@/hooks/useConfirm';
import EditEmployeeModal from './components/EditEmployeeModal';
import ExamModal from './components/ExamModal';
import RulesModal from './components/RulesModal';
import EmployeeCard from './components/EmployeeCard';
import FiltersBar from './components/FiltersBar';
import PromoteModal from './components/PromoteModal';
import PromotionsDashboard from './components/PromotionsDashboard';
import { usePromotionsData } from './hooks/usePromotionsData';

export default function PromocionesPage() {
    const { user, loading: authLoading, canWrite } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { showConfirm, confirmDialog } = useConfirm();

    const {
        loading,
        employees,
        setEmployees,
        promotionRules,
        setPromotionRules,
        departments,
        reprocessing,
        loadData,
        reloadRulesFromJSON,
        handleReprocessCompliance,
        importPromotionData,
        importExamData,
        importShiftData,
        handlePromoteEmployee
    } = usePromotionsData(user, showConfirm, toast);

    const [filteredEmployees, setFilteredEmployees] = useState([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, eligible, blocked, nearEligible
    const [deptFilter, setDeptFilter] = useState('Todos');
    const [shiftFilter, setShiftFilter] = useState('Todos');

    // View mode and sorting
    const [viewMode, setViewMode] = useState('cards'); // cards, table
    const [sortBy, setSortBy] = useState('name'); // name, department, criteria, startDate
    const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Expanded rows
    const [expandedId, setExpandedId] = useState(null);

    // Modals
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [examModal, setExamModal] = useState(null);
    const [rulesModal, setRulesModal] = useState(false);
    const [promoteModal, setPromoteModal] = useState(null); // { employee, newPosition }


    const filterEmployees = useCallback(() => {
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

        // Shift filter
        if (shiftFilter !== 'Todos') {
            result = result.filter(e => e.shift === shiftFilter);
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
                if (statusFilter === 'scheduledExam') return emp.promotionData?.scheduledExam;
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
    }, [searchTerm, statusFilter, deptFilter, shiftFilter, employees, promotionRules, sortBy, sortOrder]);

    useEffect(() => {
        filterEmployees();
    }, [filterEmployees]);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handleEditEmployee = (emp) => {
        setEditingEmployee(emp);
    };

    const handleSaveEmployee = async (updatedFormData) => {
        if (!editingEmployee) return;

        try {
            const ref = doc(db, 'training_records', editingEmployee.id);
            const promotionData = {
                ...editingEmployee.promotionData,
                positionStartDate: updatedFormData.positionStartDate,
                performanceScore: parseFloat(updatedFormData.performanceScore) || 0,
                performancePeriod: updatedFormData.performancePeriod
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
        setExamModal(emp);
    };

    const handleSaveExam = async (examDataFromModal) => {
        if (!examModal || !examDataFromModal.score) return;

        try {
            const ref = doc(db, 'training_records', examModal.id);
            const currentPromoData = examModal.promotionData || {};
            const examAttempts = currentPromoData.examAttempts || [];

            const score = parseFloat(examDataFromModal.score);
            const rule = promotionRules.find(r =>
                r.currentPosition === examModal.position?.toUpperCase()?.trim()
            );
            const passed = rule ? score >= rule.examMinScore : score >= 70;

            const newAttempt = {
                date: examDataFromModal.date,
                score,
                passed
            };

            const updatedPromoData = {
                ...currentPromoData,
                examAttempts: [...examAttempts, newAttempt],
                lastExamDate: examDataFromModal.date,
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

    const handleToggleScheduledExam = async (emp) => {
        try {
            const ref = doc(db, 'training_records', emp.id);
            const currentStatus = emp.promotionData?.scheduledExam || false;
            const newStatus = !currentStatus;

            const updatedPromoData = {
                ...emp.promotionData,
                scheduledExam: newStatus
            };

            await updateDoc(ref, {
                promotionData: updatedPromoData
            });

            // Update local state
            setEmployees(prev => prev.map(e =>
                e.id === emp.id
                    ? { ...e, promotionData: updatedPromoData }
                    : e
            ));

            toast.success(
                newStatus ? 'Marcado para Examen' : 'Desmarcado',
                newStatus ? `Examen programado para ${emp.name}` : 'Examen cancelado'
            );
        } catch (error) {
            console.error('Error toggling exam status:', error);
            toast.error('Error', 'No se pudo actualizar el estado');
        }
    };

    const getStatusBadge = (criteria) => {
        if (criteria.overall.eligible) {
            return <span className={`${styles.statusBadge} ${styles.eligible}`}> APTO</span>;
        }
        return <span className={`${styles.statusBadge} ${styles.blocked}`}> NO APTO</span>;
    };

    const getCriteriaIcon = (met) => (
        <span className={met ? styles.criteriaPass : styles.criteriaFail}>
            {met ? '✓' : '✗'}
        </span>
    );

    // Export to Excel
    const handleExportExcel = async () => {
        try {
            const XLSX = await import('xlsx');

            // Prepare all employees with promotion rules (unfiltered)
            const allEmployeesWithRules = employees.filter(emp => {
                const rule = promotionRules.find(r =>
                    r.currentPosition === emp.position?.toUpperCase()?.trim()
                );
                return rule !== undefined;
            });

            // Build rows
            const headers = [
                'ID Empleado',
                'Nombre',
                'Puesto Actual',
                'Promoción a',
                'Departamento',
                'Turno',
                'Desempeño (%)',
                'Temporalidad (meses)',
                'Matriz (%)',
                'Examen (%)',
                'Criterios Cumplidos',
                'Estado',
                'Citado para Examen'
            ];

            const rows = allEmployeesWithRules.map(emp => {
                const rule = promotionRules.find(r =>
                    r.currentPosition === emp.position?.toUpperCase()?.trim()
                );
                const criteria = checkPromotionCriteria(emp, rule);

                return [
                    emp.employeeId || '',
                    emp.name || '',
                    emp.position || '',
                    rule?.promotionTo || '',
                    emp.department || '',
                    emp.shift || '',
                    criteria.performance.current,
                    criteria.temporality.current,
                    criteria.matrix.current,
                    criteria.exam.current !== null ? criteria.exam.current : '',
                    `${criteria.overall.metCount}/4`,
                    criteria.overall.eligible ? 'APTO' : 'NO APTO',
                    emp.promotionData?.scheduledExam ? 'Sí' : 'No'
                ];
            });

            const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

            // Set column widths for better readability
            ws['!cols'] = [
                { wch: 15 }, // ID Empleado
                { wch: 35 }, // Nombre
                { wch: 25 }, // Puesto Actual
                { wch: 25 }, // Promoción a
                { wch: 25 }, // Departamento
                { wch: 10 }, // Turno
                { wch: 15 }, // Desempeño
                { wch: 20 }, // Temporalidad
                { wch: 15 }, // Matriz
                { wch: 15 }, // Examen
                { wch: 20 }, // Criterios
                { wch: 15 }, // Estado
                { wch: 15 }  // Citado
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Promociones');

            const timestamp = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `reporte_promociones_${timestamp}.xlsx`);

            toast.success('Exportado', `Se exportaron ${rows.length} empleados`);
        } catch (err) {
            console.error('Error exporting:', err);
            toast.error('Error', 'No se pudo exportar el reporte');
        }
    };

    if (authLoading || !user) {
        return (
            <AdminLayout title="Módulo">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)' }}>
                    <div className="spinner"></div>
                </div>
            </AdminLayout>
        );
    }

    if (user.rol === 'demo' || user.email?.includes('demo')) {
        router.push('/induccion');
        return null;
    }

    return (
        <>
            <AdminLayout title="Promociones">
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div>
                            <h1 className={styles.pageTitle}>Control de Promociones</h1>
                            <p className={styles.pageSubtitle}>Monitoreo de elegibilidad para cambio de categoría</p>
                        </div>
                    </div>

                    {/* Promotions KPIs Dashboard */}
                    <PromotionsDashboard
                        employees={employees}
                        promotionRules={promotionRules}
                    >
                        <button className={styles.headerActionBtn} onClick={handleExportExcel}>
                            <Download size={18} /> Exportar Excel
                        </button>
                        <button className={styles.headerActionBtn} onClick={() => setRulesModal(true)}>
                            <SlidersHorizontal size={18} /> Reglas ({promotionRules.length})
                        </button>
                    </PromotionsDashboard>

                    {/* Filters */}
                    <FiltersBar
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        deptFilter={deptFilter}
                        setDeptFilter={setDeptFilter}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        shiftFilter={shiftFilter}
                        setShiftFilter={setShiftFilter}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        sortOrder={sortOrder}
                        setSortOrder={setSortOrder}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        departments={departments}
                        filteredCount={filteredEmployees.length}
                    />

                    {/* Employee List */}
                    {loading ? (
                        <div className="spinner"></div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No hay empleados con rutas de promoción definidas.</p>
                            <p className={styles.subText}>Configure las reglas de promoción para ver empleados elegibles.</p>
                        </div>
                    ) : (
                        <>
                            {/* Table View */}
                            {viewMode === 'table' ? (
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
                                                        <tr key={emp.id} onClick={() => toggleExpand(emp.id)} className={`${styles.tableRow} ${emp.promotionData?.scheduledExam ? styles.rowScheduled : ''}`}>
                                                            <td>
                                                                <div className={styles.empNameCell}>
                                                                    <strong>
                                                                        ID {emp.employeeId} {emp.name}
                                                                        {emp.promotionData?.scheduledExam && <span style={{ fontSize: '0.8em', marginLeft: '5px' }}>📝</span>}
                                                                    </strong>
                                                                </div>
                                                            </td>
                                                            <td>{emp.position}</td>

                                                            <td>
                                                                {emp.department}
                                                                {emp.shift && <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Turno: {emp.shift}</div>}
                                                            </td>
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
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    {criteria.overall.eligible && canWrite() ? (
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={(e) => { e.stopPropagation(); setPromoteModal({ employee: emp, newPosition: rule.promotionTo }); }}
                                                                            style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.4rem 0.8rem', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
                                                                        >
                                                                            Promover
                                                                        </Button>
                                                                    ) : (
                                                                        getStatusBadge(criteria)
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
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
                                            const isExpanded = expandedId === emp.id;

                                            return (
                                                <EmployeeCard
                                                    key={emp.id}
                                                    emp={emp}
                                                    rule={rule}
                                                    criteria={criteria}
                                                    isExpanded={isExpanded}
                                                    onToggleExpand={toggleExpand}
                                                    canWrite={canWrite()}
                                                    onEditEmployee={handleEditEmployee}
                                                    onOpenExamModal={handleOpenExamModal}
                                                    onToggleScheduledExam={handleToggleScheduledExam}
                                                    onOpenPromoteModal={(emp, newPos) => setPromoteModal({ employee: emp, newPosition: newPos })}
                                                />
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
                </div>
            </AdminLayout>

            {/* Edit Employee Modal */}
            <EditEmployeeModal
                employee={editingEmployee}
                onClose={() => setEditingEmployee(null)}
                onSave={handleSaveEmployee}
            />

            {/* Exam Registration Modal */}
            <ExamModal
                employee={examModal}
                onClose={() => setExamModal(null)}
                onSave={handleSaveExam}
            />

            {/* Rules Management Modal */}
            <RulesModal
                isOpen={rulesModal}
                onClose={() => setRulesModal(false)}
                rules={promotionRules}
                onRulesUpdated={setPromotionRules}
            />

            {
                promoteModal && (
                    <PromoteModal
                        isOpen={!!promoteModal}
                        onClose={() => setPromoteModal(null)}
                        employee={promoteModal.employee}
                        newPosition={promoteModal.newPosition}
                        onConfirm={handlePromoteEmployee}
                    />
                )
            }

            {confirmDialog}
        </>
    );
}
