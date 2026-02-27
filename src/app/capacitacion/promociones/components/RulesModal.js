import { useState } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { Button } from '@/components/ui/Button/Button';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/components/ui/Toast/Toast';
import { useConfirm } from '@/hooks/useConfirm';
import { useAuth } from '@/contexts/AuthContext';
import pageStyles from '../page.module.css';
import rulesStyles from './RulesModal.module.css';

const styles = Object.assign({}, pageStyles, rulesStyles);

export default function RulesModal({ isOpen, onClose, rules, onRulesUpdated }) {
    const { toast } = useToast();
    const { showConfirm, confirmDialog } = useConfirm();
    const { canWrite } = useAuth();

    // Rule CRUD local state
    const [editingRule, setEditingRule] = useState(null);
    const [ruleForm, setRuleForm] = useState({
        currentPosition: '',
        promotionTo: '',
        temporalityMonths: 6,
        examMinScore: 80,
        matrixMinCoverage: 90,
        performanceMinScore: 80
    });

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

            let newRules;
            if (editingRule) {
                newRules = rules.map(r => r.id === ruleId ? { ...ruleData, id: ruleId } : r);
            } else {
                newRules = [...rules, { ...ruleData, id: ruleId }];
            }

            onRulesUpdated(newRules);

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
        if (!await showConfirm('¿Eliminar esta regla de promoción?', { title: 'Eliminar Regla', confirmLabel: 'Eliminar' })) return;

        try {
            await deleteDoc(doc(db, 'promotion_rules', ruleId));
            const newRules = rules.filter(r => r.id !== ruleId);
            onRulesUpdated(newRules);
            toast.success('Eliminado', 'Regla eliminada');
        } catch (error) {
            console.error('Error deleting rule:', error);
            toast.error('Error', 'No se pudo eliminar');
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogHeader>
                    <DialogTitle>Reglas de Promoción</DialogTitle>
                    <DialogClose onClose={onClose} />
                </DialogHeader>
                <DialogBody className={styles.rulesModalBody}>
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

                    <div className={styles.rulesList}>
                        <div className={styles.rulesListHeader}>
                            <h4>Reglas Existentes ({rules.length})</h4>
                        </div>
                        <div className={styles.rulesTable}>
                            {rules.slice(0, 20).map(rule => (
                                <div key={rule.id} className={styles.ruleRow}>
                                    <div className={styles.ruleInfo}>
                                        <strong>{rule.currentPosition}</strong>
                                        <span>→ {rule.promotionTo}</span>
                                        <small>
                                            {rule.temporalityMonths}m | Exam {rule.examMinScore}% |
                                            Matriz {rule.matrixMinCoverage}% | Eval {rule.performanceMinScore}%
                                        </small>
                                    </div>
                                    {canWrite() && (
                                        <div className={styles.ruleActions}>
                                            <Button variant="ghost" size="sm" onClick={() => handleEditRule(rule)}>
                                                ✏️
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                                                🗑️
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {rules.length > 20 && (
                                <p className={styles.moreRules}>+{rules.length - 20} reglas más...</p>
                            )}
                        </div>
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button onClick={onClose}>Cerrar</Button>
                </DialogFooter>
            </Dialog>
            {confirmDialog}
        </>
    );
}
