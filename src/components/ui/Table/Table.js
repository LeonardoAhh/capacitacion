'use client';

import { useState, useMemo } from 'react';
import styles from './Table.module.css';
import { cn } from '@/lib/utils';

/**
 * Data Table component with sorting, filtering, and pagination
 */
export function DataTable({
    data = [],
    columns = [],
    searchable = false,
    searchPlaceholder = 'Buscar...',
    pagination = false,
    pageSize = 10,
    emptyMessage = 'No hay datos disponibles',
    onRowClick,
    className,
    ...props
}) {
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);

    // Filter data based on search
    const filteredData = useMemo(() => {
        if (!search) return data;

        return data.filter(row =>
            columns.some(col => {
                const value = row[col.accessorKey];
                return value?.toString().toLowerCase().includes(search.toLowerCase());
            })
        );
    }, [data, search, columns]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // Paginate data
    const paginatedData = useMemo(() => {
        if (!pagination) return sortedData;

        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, pagination, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedData.length / pageSize);

    // Handle sorting
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    return (
        <div className={cn(styles.tableWrapper, className)} {...props}>
            {searchable && (
                <div className={styles.searchWrapper}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className={styles.searchInput}
                    />
                    {search && (
                        <button
                            className={styles.clearSearch}
                            onClick={() => setSearch('')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.accessorKey}
                                    className={cn(
                                        styles.th,
                                        col.sortable && styles.sortable
                                    )}
                                    onClick={() => col.sortable && handleSort(col.accessorKey)}
                                    style={col.width ? { width: col.width } : undefined}
                                >
                                    <span>{col.header}</span>
                                    {col.sortable && (
                                        <span className={styles.sortIcon}>
                                            {sortConfig.key === col.accessorKey ? (
                                                sortConfig.direction === 'asc' ? (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="18 15 12 9 6 15" />
                                                    </svg>
                                                ) : (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <polyline points="6 9 12 15 18 9" />
                                                    </svg>
                                                )
                                            ) : (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3">
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            )}
                                        </span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className={styles.emptyRow}>
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIndex) => (
                                <tr
                                    key={row.id || rowIndex}
                                    className={cn(
                                        styles.tr,
                                        onRowClick && styles.clickableRow
                                    )}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((col) => (
                                        <td key={col.accessorKey} className={styles.td}>
                                            {col.cell
                                                ? col.cell({ row, value: row[col.accessorKey] })
                                                : row[col.accessorKey]
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && totalPages > 1 && (
                <div className={styles.pagination}>
                    <span className={styles.pageInfo}>
                        Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length}
                    </span>
                    <div className={styles.pageButtons}>
                        <button
                            className={styles.pageBtn}
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="11 17 6 12 11 7" />
                                <polyline points="18 17 13 12 18 7" />
                            </svg>
                        </button>
                        <button
                            className={styles.pageBtn}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <span className={styles.currentPage}>
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            className={styles.pageBtn}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                        <button
                            className={styles.pageBtn}
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="13 17 18 12 13 7" />
                                <polyline points="6 17 11 12 6 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Simple table components for custom layouts
 */
export function Table({ children, className, ...props }) {
    return (
        <div className={cn(styles.tableContainer, className)}>
            <table className={styles.table} {...props}>
                {children}
            </table>
        </div>
    );
}

export function TableHeader({ children, ...props }) {
    return <thead {...props}>{children}</thead>;
}

export function TableBody({ children, ...props }) {
    return <tbody {...props}>{children}</tbody>;
}

export function TableRow({ children, className, ...props }) {
    return <tr className={cn(styles.tr, className)} {...props}>{children}</tr>;
}

export function TableHead({ children, className, ...props }) {
    return <th className={cn(styles.th, className)} {...props}>{children}</th>;
}

export function TableCell({ children, className, ...props }) {
    return <td className={cn(styles.td, className)} {...props}>{children}</td>;
}

export default DataTable;
