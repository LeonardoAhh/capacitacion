import { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose } from '@/components/ui/Dialog/Dialog';
import { Button } from '@/components/ui/Button/Button';
import pageStyles from '../page.module.css';

export default function PromoteModal({ isOpen, onClose, employee, newPosition, onConfirm }) {
    const [effectiveDate, setEffectiveDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Default to today
            setEffectiveDate(new Date().toISOString().split('T')[0]);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        if (!effectiveDate) return;
        setIsSubmitting(true);
        try {
            await onConfirm(employee, newPosition, effectiveDate);
            onClose();
        } catch (error) {
            // Error is handled by the parent
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!employee) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogHeader>
                <DialogTitle>Promover Empleado</DialogTitle>
                <DialogClose onClose={onClose} disabled={isSubmitting} />
            </DialogHeader>
            <DialogBody>
                <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Estás a punto de promover a <strong>{employee.name}</strong>.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600 }}>PUESTO ACTUAL</span>
                            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', fontWeight: 600 }}>NUEVO PUESTO</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{employee.position}</strong>
                            <span style={{ color: 'var(--color-primary)' }}>➔</span>
                            <strong style={{ color: '#22c55e', fontSize: '0.95rem' }}>{newPosition}</strong>
                        </div>
                    </div>
                </div>

                <div className={pageStyles.formGroup}>
                    <label>Fecha de inicio del nuevo puesto <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                    <small>Esta fecha reiniciará el contador de temporalidad para su próxima promoción.</small>
                </div>
            </DialogBody>
            <DialogFooter>
                <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleConfirm}
                    disabled={!effectiveDate || isSubmitting}
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none' }}
                >
                    {isSubmitting ? 'Promoviendo...' : 'Confirmar Promoción'}
                </Button>
            </DialogFooter>
        </Dialog>
    );
}
