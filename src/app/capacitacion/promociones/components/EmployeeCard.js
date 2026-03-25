import { Button } from '@/components/ui/Button/Button';
import { getExamEligibility, formatDate } from '@/lib/promotionUtils';
import styles from './EmployeeCard.module.css';

export default function EmployeeCard({
    emp,
    rule,
    criteria,
    onViewDetails,
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
        <div className={`${styles.employeeCard} ${emp.promotionData?.scheduledExam ? styles.cardScheduled : ''}`}>
            <div className={styles.cardHeader} onClick={() => onViewDetails(emp)} style={{ cursor: 'pointer' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {getStatusBadge(criteria)}
                    </div>
                )}

                {criteria.overall.eligible && canWrite && (
                    <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onOpenPromoteModal(emp, rule.promotionTo); }}
                        style={{ background: '#10b981', color: 'white', border: 'none', marginLeft: '0.5rem', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.85rem', flexShrink: 0 }}
                    >
                        Promover
                    </Button>
                )}
            </div>
        </div>
    );
}
