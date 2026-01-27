import styles from './EmployeeTable.module.css';
import { Badge } from '@/components/ui/Badge/Badge';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { useEmployeeDates } from '@/hooks/useEmployeeDates';

export default function EmployeeTable({ employees, onEdit, onDelete }) {
    const { formatDate } = useEmployeeDates();

    if (employees.length === 0) {
        return (
            <div className={styles.emptyState}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <h3>No hay empleados registrados</h3>
                <p>Comienza agregando un nuevo empleado</p>
            </div>
        );
    }

    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Puesto</th>
                        <th>Área</th>
                        <th>Departamento</th>
                        <th>Turno</th>
                        <th>Inicio</th>
                        <th>Fin Contrato</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((employee) => (
                        <tr key={employee.id}>
                            <td>{employee.employeeId}</td>
                            <td className={styles.nameCell}>
                                <Avatar name={employee.name} size="sm" />
                                {employee.name}
                            </td>
                            <td>{employee.position || '-'}</td>
                            <td>{employee.area}</td>
                            <td>{employee.department}</td>
                            <td>
                                <Badge variant="white" size="sm">Turno {employee.shift}</Badge>
                            </td>
                            <td>{formatDate(employee.startDate)}</td>
                            <td>{formatDate(employee.contractEndDate)}</td>
                            <td>
                                <div className={styles.actions}>
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(employee)}
                                            className={styles.editBtn}
                                            title="Editar"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(employee)}
                                            className={styles.deleteBtn}
                                            title="Eliminar"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
