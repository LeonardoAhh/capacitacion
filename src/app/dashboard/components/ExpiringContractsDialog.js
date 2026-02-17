'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge/Badge';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogClose } from '@/components/ui/Dialog/Dialog';
import { formatDate } from '@/utils/formatters';

/**
 * Modal que muestra la lista de contratos próximos a vencer.
 * @param {{ open: boolean, onOpenChange: (v: boolean) => void, employees: Array }} props
 */
export default function ExpiringContractsDialog({ open, onOpenChange, employees }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogHeader>
                <DialogClose onClose={() => onOpenChange(false)} />
                <DialogTitle>Vencimientos Próximos</DialogTitle>
            </DialogHeader>
            <DialogBody>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {employees.map((emp, idx) => (
                        <Link
                            key={emp.id || idx}
                            href={`/employees?search=${emp.employeeId}`}
                            onClick={() => onOpenChange(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px',
                                background: 'var(--bg-secondary)',
                                borderRadius: '12px',
                                textDecoration: 'none',
                                color: 'var(--text-primary)'
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 600 }}>{emp.name}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {formatDate(emp.contractEndDate)}
                                </div>
                            </div>
                            <Badge variant={emp.daysUntilExpiry <= 7 ? 'danger' : 'warning'}>
                                {emp.daysUntilExpiry} días
                            </Badge>
                        </Link>
                    ))}
                </div>
            </DialogBody>
        </Dialog>
    );
}
