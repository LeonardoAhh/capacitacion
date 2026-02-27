import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { Button } from '@/components/ui/Button/Button';
import styles from '../page.module.css';

export default function ExamModal({ employee, onClose, onSave }) {
    const [examData, setExamData] = useState({ date: '', score: '' });

    useEffect(() => {
        if (employee) {
            setExamData({ date: new Date().toISOString().split('T')[0], score: '' });
        }
    }, [employee]);

    if (!employee) return null;

    const handleSave = () => {
        if (!examData.score) return;
        onSave(examData);
    };

    return (
        <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
            <DialogHeader>
                <DialogTitle>Registrar Examen Teórico</DialogTitle>
                <DialogClose onClose={onClose} />
            </DialogHeader>
            <DialogBody>
                <p className={styles.modalSubtitle}>{employee.name}</p>
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
                <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Registrar</Button>
            </DialogFooter>
        </Dialog>
    );
}
