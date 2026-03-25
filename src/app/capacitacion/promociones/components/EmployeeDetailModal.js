import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogClose } from '@/components/ui/Dialog/Dialog';
import { Button } from '@/components/ui/Button/Button';
import { getExamEligibility, formatDate } from '@/lib/promotionUtils';
import styles from './EmployeeCard.module.css';

export default function EmployeeDetailModal({
    emp,
    rule,
    criteria,
    onClose,
    canWrite,
    onEditEmployee,
    onOpenExamModal,
    onToggleScheduledExam
}) {
    if (!emp || !rule || !criteria) return null;

    const examEligibility = getExamEligibility(
        emp.promotionData?.examAttempts,
        rule.temporalityMonths,
        emp.promotionData?.positionStartDate
    );

    const getCriteriaIcon = (met) => (
        <span className={met ? styles.criteriaPass : styles.criteriaFail}>
            {met ? '✓' : '✗'}
        </span>
    );

    return (
        <Dialog open={!!emp} onOpenChange={(open) => !open && onClose()} className={styles.detailModal}>
            <DialogHeader>
                <DialogTitle>Detalles de Elegibilidad</DialogTitle>
                <DialogClose onClose={onClose} />
            </DialogHeader>
            <DialogBody className={styles.cardBody} style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '85vh' }}>
                <div style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}>
                        {emp.name} (ID {emp.employeeId})
                    </h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Promoción esperada: <strong style={{color: 'var(--color-primary)'}}>{rule.promotionTo}</strong>
                    </p>
                </div>

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
                            <Button variant="ghost" size="sm" onClick={() => onEditEmployee(emp)}>
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
                            <Button variant="ghost" size="sm" onClick={() => onEditEmployee(emp)}>
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
                                    onClick={() => onOpenExamModal(emp)}
                                    disabled={!examEligibility.canTakeExam}
                                >
                                    + Registrar
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onToggleScheduledExam(emp)}
                                    style={emp.promotionData?.scheduledExam ? { borderColor: '#ef4444', color: '#ef4444' } : { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                                >
                                    {emp.promotionData?.scheduledExam ? 'Cancelar Cita' : ' Citar'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Exam History */}
                {emp.promotionData?.examAttempts?.length > 0 && (
                    <div className={styles.examHistory} style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem' }}>
                        <h4 style={{ margin: '0 0 0.8rem 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}> Historial de Exámenes</h4>
                        <div className={styles.historyList}>
                            {[...emp.promotionData.examAttempts].reverse().slice(0, 5).map((attempt, i) => (
                                <div key={i} className={styles.historyItem} style={{ borderBottom: 'none', padding: '6px 12px' }}>
                                    <span style={{ fontSize: '0.85rem' }}>{formatDate(attempt.date)}</span>
                                    <span className={attempt.passed ? styles.passed : styles.failed} style={{ fontWeight: 'bold' }}>
                                        {attempt.score}% {attempt.passed ? '✓' : '✗'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </DialogBody>
        </Dialog>
    );
}
