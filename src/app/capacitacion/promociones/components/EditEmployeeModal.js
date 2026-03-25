import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { Button } from '@/components/ui/Button/Button';
import { getSemesterPeriod } from '@/lib/promotionUtils';
import { Select } from '@/components/ui/Select/Select';
import styles from '../page.module.css';

export default function EditEmployeeModal({ employee, onClose, onSave }) {
    const [formData, setFormData] = useState({
        positionStartDate: '',
        performanceScore: '',
        performancePeriod: getSemesterPeriod()
    });

    useEffect(() => {
        if (employee) {
            const promoData = employee.promotionData || {};
            setFormData({
                positionStartDate: promoData.positionStartDate || '',
                performanceScore: promoData.performanceScore || '',
                performancePeriod: promoData.performancePeriod || getSemesterPeriod()
            });
        }
    }, [employee]);

    if (!employee) return null;

    const handleSave = () => {
        onSave(formData);
    };

    return (
        <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
            <DialogHeader>
                <DialogTitle>Editar Datos de Promoción</DialogTitle>
                <DialogClose onClose={onClose} />
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
                    <Select
                        value={formData.performancePeriod}
                        onChange={(value) => setFormData({ ...formData, performancePeriod: value })}
                        options={[
                            { value: 'JUL-DIC 2025', label: 'JUL-DIC 2025' },
                            { value: 'ENE-JUN 2026', label: 'ENE-JUN 2026' },
                            { value: 'JUL-DIC 2026', label: 'JUL-DIC 2026' },
                        ]}
                    />
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
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Guardar</Button>
            </DialogFooter>
        </Dialog>
    );
}
