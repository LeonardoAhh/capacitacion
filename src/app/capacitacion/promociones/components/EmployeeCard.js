import { Button } from '@/components/ui/Button/Button';
import { getExamEligibility, formatDate } from '@/lib/promotionUtils';
import styles from './EmployeeCard.module.css';

export default function EmployeeCard({
    emp,
    rule,
    criteria,
    isExpanded,
    onToggleExpand,
    canWrite,
    onEditEmployee,
    onOpenExamModal,
    onToggleScheduledExam,
    onOpenPromoteModal
}) {
    const examEligibility = getExamEligibility(
        emp.promotionData?.examAttempts,
        rule.temporalityMonths,
        emp.promotionData?.positionStartDate
    );
    const progressPercent = (criteria.overall.metCount / 4) * 100;

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

    return (
        <div className={`${styles.employeeCard} ${isExpanded ? styles.expanded : ''} ${emp.promotionData?.scheduledExam ? styles.cardScheduled : ''}`}>
            {/* Collapsed View */}
            <div className={styles.cardHeader} onClick={() => onToggleExpand(emp.id)}>
                <div className={styles.expandIcon}>
                    {isExpanded ? '▼' : '▶'}
                </div>
                <div className={styles.empInfo}>
                    <div className={styles.empName}>ID {emp.employeeId} {emp.name}</div>
                    <div className={styles.empPosition}>
                        {emp.position} <span style={{ color: '#f59e0b', margin: '0 4px', fontWeight: 'bold' }}>➔</span> {rule.promotionTo}
                        {emp.shift && <span style={{ marginLeft: '0.5rem', fontSize: '0.8em', color: 'var(--text-secondary)' }}>• T{emp.shift}</span>}
                        {emp.promotionData?.scheduledExam && (
                            <span className={styles.scheduledBadge}> Examen</span>
                        )}
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

                {!criteria.overall.eligible && (
                    <>
                        <div className={styles.criteriaCount}>
                            {criteria.overall.metCount}/4
                        </div>
                        {getStatusBadge(criteria)}
                    </>
                )}

                {criteria.overall.eligible && canWrite && (
                    <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onOpenPromoteModal(emp, rule.promotionTo); }}
                        style={{ background: '#10b981', color: 'white', border: 'none', marginLeft: '0.5rem', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.85rem' }}
                    >
                        Promover
                    </Button>
                )}
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
                                <span> EVAL. DESEMPEÑO</span>
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
                            {canWrite && (
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEditEmployee(emp); }}>
                                    Editar
                                </Button>
                            )}
                        </div>

                        {/* 2. Temporality */}
                        <div className={styles.detailBox}>
                            <div className={styles.detailHeader}>
                                <span className={styles.orderBadge}>2</span>
                                {getCriteriaIcon(criteria.temporality.met)}
                                <span> TEMPORALIDAD</span>
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
                            {canWrite && (
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEditEmployee(emp); }}>
                                    Editar
                                </Button>
                            )}
                        </div>

                        {/* 3. Matrix */}
                        <div className={styles.detailBox}>
                            <div className={styles.detailHeader}>
                                <span className={styles.orderBadge}>3</span>
                                {getCriteriaIcon(criteria.matrix.met)}
                                <span> COBERTURA MATRIZ</span>
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
                                <span> EXAMEN TEÓRICO</span>
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
                                        {examEligibility.reason}
                                    </div>
                                )}
                            </div>
                            {canWrite && (
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); onOpenExamModal(emp); }}
                                        disabled={!examEligibility.canTakeExam}
                                    >
                                        + Registrar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleScheduledExam(emp);
                                        }}
                                        style={emp.promotionData?.scheduledExam ? { borderColor: '#ef4444', color: '#ef4444' } : { borderColor: '#3b82f6', color: '#3b82f6' }}
                                    >
                                        {emp.promotionData?.scheduledExam ? 'Cancelar Cita' : ' Citar'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Exam History */}
                    {emp.promotionData?.examAttempts?.length > 0 && (
                        <div className={styles.examHistory}>
                            <h4> Historial de Exámenes</h4>
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
        </div>
    );
}
