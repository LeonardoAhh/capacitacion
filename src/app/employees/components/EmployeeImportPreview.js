'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { 
    X, AlertCircle, CheckCircle, Users, 
    Save, Trash2, Check, ChevronRight, Info 
} from 'lucide-react';
import { validateSingleEmployeeRecord } from '@/utils/importUtils';
import styles from './EmployeeImportPreview.module.css';

const EmployeeImportPreview = ({ 
    preview, 
    existingEmployees, 
    onCancel, 
    onConfirm, 
    isImporting 
}) => {
    // Editable state for invalid rows
    const [invalidRecords, setInvalidRecords] = useState(preview.invalid || []);
    const [validRecords, setValidRecords] = useState(preview.valid || []);
    
    // Selection state for valid rows
    const [selectedRows, setSelectedRows] = useState(
        new Set(preview.valid.map(r => r.row))
    );

    // Track unsaved edits in invalid records
    const [edits, setEdits] = useState({}); // row -> { field: value }

    // Stats
    const stats = useMemo(() => ({
        total: (invalidRecords.length + validRecords.length),
        valid: validRecords.length,
        invalid: invalidRecords.length,
        selected: selectedRows.size
    }), [invalidRecords, validRecords, selectedRows]);

    const handleEditChange = (row, field, value) => {
        setEdits(prev => ({
            ...prev,
            [row]: { ...(prev[row] || {}), [field]: value }
        }));
    };

    const getRowValue = (record, field) => {
        return edits[record.row]?.[field] ?? record[field] ?? '';
    };

    const applyCorrection = (record) => {
        const editedValues = { ...record, ...edits[record.row] };
        
        // Re-validate
        const validation = validateSingleEmployeeRecord(editedValues, existingEmployees);
        
        if (validation.valid) {
            // Move to valid
            setValidRecords(prev => [...prev, { ...editedValues, issues: [] }].sort((a, b) => a.row - b.row));
            setInvalidRecords(prev => prev.filter(r => r.row !== record.row));
            
            // Auto-select the newly valid row
            setSelectedRows(prev => {
                const next = new Set(prev);
                next.add(record.row);
                return next;
            });

            // Clear edits for this row
            setEdits(prev => {
                const next = { ...prev };
                delete next[record.row];
                return next;
            });
        } else {
            // Update issues in invalid list
            setInvalidRecords(prev => prev.map(r => 
                r.row === record.row ? { ...editedValues, issues: validation.issues } : r
            ));
        }
    };

    const toggleRowSelection = (row) => {
        setSelectedRows(prev => {
            const next = new Set(prev);
            if (next.has(row)) next.delete(row);
            else next.add(row);
            return next;
        });
    };

    const toggleAllSelection = () => {
        if (selectedRows.size === validRecords.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(validRecords.map(r => r.row)));
        }
    };

    const handleConfirm = () => {
        const rowsToImport = validRecords.filter(r => selectedRows.has(r.row));
        onConfirm(rowsToImport);
    };

    return (
        <div className={styles.previewOverlay}>
            <div className={styles.previewContainer}>
                <header className={styles.header}>
                    <h2 className={styles.title}>Vista Previa de Importación</h2>
                    <p className={styles.subtitle}>
                        Revisa y corrige los datos antes de agregarlos al sistema.
                    </p>
                </header>

                {/* Resumen Estadístico */}
                <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{stats.total}</span>
                        <span className={styles.statLabel}>Total Registros</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{stats.valid}</span>
                        <span className={styles.statLabel}>Válidos</span>
                    </div>
                    <div className={`${styles.statCard} ${styles.statError}`}>
                        <span className={styles.statValue}>{stats.invalid}</span>
                        <span className={styles.statLabel}>Con Errores</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{stats.selected}</span>
                        <span className={styles.statLabel}>Seleccionados</span>
                    </div>
                </div>

                {/* Sección de Errores */}
                {invalidRecords.length > 0 && (
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <AlertCircle className={styles.errorIcon} size={20} />
                            Registros con Errores
                        </h3>
                        <div className={styles.tableWrapper}>
                            <table className={styles.previewTable}>
                                <thead>
                                    <tr>
                                        <th>Fila</th>
                                        <th>Nombre</th>
                                        <th>ID</th>
                                        <th>Departamento</th>
                                        <th>Puesto</th>
                                        <th>Errores</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invalidRecords.map(rec => (
                                        <tr key={rec.row} className={styles.rowError}>
                                            <td>{rec.row}</td>
                                            <td>
                                                <input 
                                                    className={styles.editInput}
                                                    value={getRowValue(rec, 'name')}
                                                    onChange={e => handleEditChange(rec.row, 'name', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input 
                                                    className={styles.editInput}
                                                    value={getRowValue(rec, 'employeeId')}
                                                    onChange={e => handleEditChange(rec.row, 'employeeId', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input 
                                                    className={styles.editInput}
                                                    value={getRowValue(rec, 'department')}
                                                    onChange={e => handleEditChange(rec.row, 'department', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <input 
                                                    className={styles.editInput}
                                                    value={getRowValue(rec, 'position')}
                                                    onChange={e => handleEditChange(rec.row, 'position', e.target.value)}
                                                />
                                            </td>
                                            <td>
                                                <ul className={styles.issueList}>
                                                    {rec.issues.map((issue, idx) => (
                                                        <li key={idx}>• {issue}</li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td>
                                                <button 
                                                    className={styles.applyBtn}
                                                    onClick={() => applyCorrection(rec)}
                                                >
                                                    Corregir
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Sección de Válidos */}
                {validRecords.length > 0 && (
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <CheckCircle className={styles.sectionIcon} size={20} />
                            Registros Válidos
                        </h3>
                        <div className={styles.tableWrapper}>
                            <table className={styles.previewTable}>
                                <thead>
                                    <tr>
                                        <th className={styles.checkCell}>
                                            <input 
                                                type="checkbox" 
                                                className={styles.checkbox}
                                                checked={selectedRows.size === validRecords.length && validRecords.length > 0}
                                                onChange={toggleAllSelection}
                                            />
                                        </th>
                                        <th>Fila</th>
                                        <th>Nombre</th>
                                        <th>ID</th>
                                        <th>Departamento</th>
                                        <th>Puesto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {validRecords.map(rec => (
                                        <tr key={rec.row}>
                                            <td className={styles.checkCell}>
                                                <input 
                                                    type="checkbox" 
                                                    className={styles.checkbox}
                                                    checked={selectedRows.has(rec.row)}
                                                    onChange={() => toggleRowSelection(rec.row)}
                                                />
                                            </td>
                                            <td>{rec.row}</td>
                                            <td>{rec.name}</td>
                                            <td>{rec.employeeId}</td>
                                            <td>{rec.department}</td>
                                            <td>{rec.position}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Botones de Acción */}
                <div className={styles.actions}>
                    <button 
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={onCancel}
                        disabled={isImporting}
                    >
                        <Trash2 size={18} />
                        Cancelar
                    </button>
                    <button 
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={handleConfirm}
                        disabled={isImporting || stats.selected === 0}
                    >
                        {isImporting ? (
                            <>Cargando...</>
                        ) : (
                            <>
                                <Check size={18} />
                                Importar {stats.selected} Empleados
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeImportPreview;
