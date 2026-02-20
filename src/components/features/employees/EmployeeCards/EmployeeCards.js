'use client';

import { useState } from 'react';
import styles from './EmployeeCards.module.css';
import { Badge } from '@/components/ui/Badge/Badge';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { useEmployeeDates } from '@/hooks/useEmployeeDates';

export default function EmployeeCards({ employees, onEdit, onDelete }) {
    const { formatDate } = useEmployeeDates();
    const [expandedId, setExpandedId] = useState(null);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // Determine contract status color
    const getContractStatus = (endDate) => {
        if (!endDate) return { status: 'unknown', label: 'Sin fecha', color: 'gray' };

        const end = new Date(endDate);
        const now = new Date();
        const daysUntilEnd = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

        if (daysUntilEnd < 0) {
            return { status: 'expired', label: 'Vencido', color: 'red' };
        } else if (daysUntilEnd <= 30) {
            return { status: 'warning', label: `${daysUntilEnd} días`, color: 'orange' };
        } else if (daysUntilEnd <= 90) {
            return { status: 'soon', label: `${daysUntilEnd} días`, color: 'yellow' };
        } else {
            return { status: 'ok', label: 'Vigente', color: 'green' };
        }
    };

    if (employees.length === 0) {
        return null;
    }

    return (
        <div className={styles.grid}>
            {employees.map((employee) => {
                const isExpanded = expandedId === employee.id;
                const contractStatus = getContractStatus(employee.contractEndDate);

                return (
                    <article
                        key={employee.id}
                        className={`${styles.card} ${isExpanded ? styles.expanded : ''}`}
                        onClick={() => toggleExpand(employee.id)}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isExpanded}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleExpand(employee.id);
                            }
                        }}
                    >
                        {/* Contract Status Indicator */}
                        <div className={`${styles.statusIndicator} ${styles[contractStatus.color]}`} />

                        {/* Card Header - Always Visible */}
                        <div className={styles.cardHeader}>
                            <Avatar
                                name={employee.name}
                                src={employee.photoUrl}
                                size="lg"
                            />
                            <div className={styles.headerInfo}>
                                <h3 className={styles.name}>{employee.name}</h3>
                                <div className={styles.badges}>
                                    <Badge variant="blue" size="sm">
                                        {employee.employeeId}
                                    </Badge>
                                    <Badge
                                        variant={contractStatus.color === 'green' ? 'green' :
                                            contractStatus.color === 'orange' ? 'orange' :
                                                contractStatus.color === 'red' ? 'red' : 'gray'}
                                        size="sm"
                                    >
                                        {contractStatus.label}
                                    </Badge>
                                </div>
                            </div>
                            <div className={styles.expandIcon}>
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className={isExpanded ? styles.rotated : ''}
                                    aria-hidden="true"
                                >
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </div>
                        </div>

                        {/* Expanded Content */}
                        <div className={`${styles.expandedContent} ${isExpanded ? styles.show : ''}`}>
                            <div className={styles.divider} />

                            <div className={styles.detailsGrid}>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Puesto</span>
                                    <span className={styles.detailValue}>{employee.position || '-'}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Departamento</span>
                                    <span className={styles.detailValue}>{employee.department || '-'}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Área</span>
                                    <span className={styles.detailValue}>{employee.area || '-'}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Turno</span>
                                    <span className={styles.detailValue}>
                                        <Badge variant="white" size="sm">Turno {employee.shift}</Badge>
                                    </span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Fecha de Ingreso</span>
                                    <span className={styles.detailValue}>{formatDate(employee.startDate)}</span>
                                </div>
                                <div className={styles.detailItem}>
                                    <span className={styles.detailLabel}>Fin de Contrato</span>
                                    <span className={styles.detailValue}>{formatDate(employee.contractEndDate)}</span>
                                </div>
                                {employee.documents && employee.documents.length > 0 && (
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Documentos</span>
                                        <span className={styles.detailValue}>
                                            <div className={styles.docsCount}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                                {employee.documents.length} archivo(s)
                                            </div>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            {(onEdit || onDelete) && (
                                <div className={styles.actions}>
                                    {onEdit && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(employee);
                                            }}
                                            className={styles.editBtn}
                                            aria-label={`Editar ${employee.name}`}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                            Editar
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(employee);
                                            }}
                                            className={styles.deleteBtn}
                                            aria-label={`Eliminar ${employee.name}`}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </article>
                );
            })}
        </div>
    );
}
