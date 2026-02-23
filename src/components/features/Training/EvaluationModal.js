import { useState } from 'react';
import { X, Calendar, Clock, User, FileText, CheckCircle } from 'lucide-react';
import styles from './EvaluationModal.module.css';

export default function EvaluationModal({ isOpen, onClose, evaluation, onSave }) {
    const [result, setResult] = useState('');
    const [saving, setSaving] = useState(false);

    if (!isOpen || !evaluation) return null;

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(evaluation, result);
            onClose();
        } catch (error) {
            console.error('Error saving evaluation:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>Detalles de Evaluación</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <div className={styles.infoIcon}><User size={18} /></div>
                            <div>
                                <span className={styles.infoLabel}>Empleado</span>
                                <span className={styles.infoValue}>{evaluation.employeeName}</span>
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                            <div className={styles.infoIcon}><FileText size={18} /></div>
                            <div>
                                <span className={styles.infoLabel}>ID Empleado</span>
                                <span className={styles.infoValue}>{evaluation.employeeId || 'N/A'}</span>
                            </div>
                        </div>
                        {evaluation.shift && (
                            <div className={styles.infoItem}>
                                <div className={styles.infoIcon}><Clock size={18} /></div>
                                <div>
                                    <span className={styles.infoLabel}>Turno</span>
                                    <span className={styles.infoValue}>{evaluation.shift}</span>
                                </div>
                            </div>
                        )}
                        <div className={styles.infoItem}>
                            <div className={styles.infoIcon}><CheckCircle size={18} /></div>
                            <div>
                                <span className={styles.infoLabel}>Evaluación Pendiente</span>
                                <span className={styles.infoValue}>{evaluation.evaluationType}</span>
                            </div>
                        </div>
                        <div className={styles.infoItem}>
                            <div className={styles.infoIcon}><Calendar size={18} /></div>
                            <div>
                                <span className={styles.infoLabel}>Fecha Programada</span>
                                <span className={styles.infoValue}>{new Date(evaluation.dueDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSave} className={styles.formContainer}>
                        <div className={styles.formGroup}>
                            <label htmlFor="result" className={styles.formLabel}>Capturar Resultado Obtenido</label>
                            <textarea
                                id="result"
                                value={result}
                                onChange={(e) => setResult(e.target.value)}
                                className={styles.textarea}
                                placeholder="Ingresa los comentarios o puntaje de la evaluación..."
                                rows={4}
                                required
                            />
                        </div>

                        <div className={styles.formActions}>
                            <button type="button" className={styles.cancelBtn} onClick={onClose}>
                                Cancelar
                            </button>
                            <button type="submit" className={styles.saveBtn} disabled={saving || !result.trim()}>
                                {saving ? 'Guardando...' : 'Guardar Resultado'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
