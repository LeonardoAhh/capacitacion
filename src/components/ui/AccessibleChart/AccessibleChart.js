'use client';

import { useId } from 'react';
import styles from './AccessibleChart.module.css';

/**
 * Wrapper component for making charts accessible
 * Provides visually hidden description for screen readers
 */
export function AccessibleChart({
    children,
    title,
    description,
    data = [],
    className,
    ...props
}) {
    const descriptionId = useId();
    const titleId = useId();

    // Generate automatic description from data if not provided
    const autoDescription = description || generateDescription(data, title);

    return (
        <figure
            role="img"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className={className}
            {...props}
        >
            {/* Visually hidden title for screen readers */}
            <figcaption id={titleId} className={styles.srOnly}>
                {title}
            </figcaption>

            {/* Visually hidden description for screen readers */}
            <div id={descriptionId} className={styles.srOnly}>
                {autoDescription}
            </div>

            {/* The actual chart */}
            {children}
        </figure>
    );
}

/**
 * Helper to generate accessible description from chart data
 */
function generateDescription(data, title) {
    if (!data || data.length === 0) {
        return `Gráfica de ${title || 'datos'}. No hay datos disponibles.`;
    }

    // Try to identify the data type and format appropriately
    const totalItems = data.length;

    // Check if it's a simple value array
    if (typeof data[0] === 'number') {
        const max = Math.max(...data);
        const min = Math.min(...data);
        const sum = data.reduce((a, b) => a + b, 0);
        return `Gráfica de ${title || 'datos'} con ${totalItems} valores. Máximo: ${max}, Mínimo: ${min}, Total: ${sum}.`;
    }

    // Check if it's an object array (like chart data)
    if (typeof data[0] === 'object') {
        // Try to find common chart data properties
        const nameKey = data[0].name ? 'name' : (data[0].label ? 'label' : Object.keys(data[0])[0]);
        const valueKey = data[0].value !== undefined ? 'value' : (data[0].count !== undefined ? 'count' : Object.keys(data[0])[1]);

        if (nameKey && valueKey) {
            const summary = data
                .slice(0, 5) // First 5 items
                .map(item => `${item[nameKey]}: ${item[valueKey]}`)
                .join(', ');

            const moreItems = totalItems > 5 ? ` y ${totalItems - 5} más` : '';

            return `Gráfica de ${title || 'datos'} con ${totalItems} elementos. ${summary}${moreItems}.`;
        }
    }

    return `Gráfica de ${title || 'datos'} con ${totalItems} elementos.`;
}

/**
 * Data table alternative for charts
 * Shows the same data in a table format for screen readers
 */
export function ChartDataTable({
    data = [],
    columns = [],
    caption,
    className,
    visuallyHidden = true,
    ...props
}) {
    if (!data || data.length === 0) return null;

    // Auto-detect columns if not provided
    const autoColumns = columns.length > 0 ? columns : Object.keys(data[0] || {}).map(key => ({
        key,
        header: key.charAt(0).toUpperCase() + key.slice(1)
    }));

    return (
        <table
            className={`${styles.dataTable} ${visuallyHidden ? styles.srOnly : ''} ${className || ''}`}
            {...props}
        >
            <caption className={visuallyHidden ? styles.srOnly : ''}>
                {caption || 'Datos de la gráfica'}
            </caption>
            <thead>
                <tr>
                    {autoColumns.map((col, i) => (
                        <th key={i} scope="col">
                            {col.header || col.key}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                        {autoColumns.map((col, colIndex) => (
                            <td key={colIndex}>
                                {row[col.key] !== undefined ? String(row[col.key]) : '-'}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default AccessibleChart;
