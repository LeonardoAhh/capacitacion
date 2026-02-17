'use client';

import { memo } from 'react';
import Image from 'next/image';
import styles from '../../page.module.css';

const getInitials = (name) => {
    if (!name) return 'EM';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
};

function EmployeeCardComponent({
    employee,
    onSelect,
    onImageError,
}) {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(employee);
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            className={styles.employeeCard}
            onClick={() => onSelect(employee)}
            onKeyDown={handleKeyDown}
            aria-label={`Ver detalles de ${employee.name}, ${employee.position || 'sin puesto'}`}
        >
            <div className={styles.cardHeader}>
                <div className={styles.employeeAvatar}>
                    {employee.photoUrl ? (
                        <Image
                            src={employee.photoUrl}
                            alt={`Foto de ${employee.name}`}
                            width={56}
                            height={56}
                            unoptimized
                            onError={(e) => onImageError(e, employee.name)}
                        />
                    ) : (
                        <span aria-hidden="true">{getInitials(employee.name)}</span>
                    )}
                </div>
                <div className={styles.employeeInfo}>
                    <h3 className={styles.employeeName}>{employee.name}</h3>
                    <p className={styles.employeePosition}>{employee.position || 'Sin puesto'}</p>
                </div>
            </div>
            <div className={styles.cardFooter}>
                <span className={styles.employeeId}>ID: {employee.employeeId || employee.id}</span>
                <span className={`${styles.statusBadge} ${employee.status === 'Inactivo' ? styles.statusInactive : styles.statusActive}`}>
                    {employee.status || 'Activo'}
                </span>
            </div>
        </div>
    );
}

export const EmployeeCard = memo(EmployeeCardComponent);
