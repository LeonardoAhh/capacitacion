/**
 * Export Utilities for Training Reports
 * Exports employee training data to Excel and PDF
 */

/**
 * Export data to Excel file
 * @param {Array} data - Array of employee records
 * @param {string} filename - Name of the file without extension
 * @param {Object} options - Optional filters/settings
 */
export const exportToExcel = async (data, filename = 'reporte_capacitacion', options = {}) => {
    // Dynamic import of xlsx
    const XLSX = await import('xlsx');

    // Prepare rows
    const rows = [];

    // Add header
    rows.push([
        'ID Empleado',
        'Nombre',
        'Departamento',
        'Puesto',
        'Cumplimiento %',
        'Cursos Requeridos',
        'Cursos Completados',
        'Cursos Pendientes'
    ]);

    // Add data rows
    data.forEach(emp => {
        const matrix = emp.matrix || {};
        const completedCount = matrix.completedCount || 0;
        const requiredCount = matrix.requiredCount || 0;
        const pendingCount = requiredCount - completedCount;

        rows.push([
            emp.employeeId || emp.id || '',
            emp.name || '',
            emp.department || 'N/A',
            emp.position || '',
            matrix.compliancePercentage || 0,
            requiredCount,
            completedCount,
            pendingCount > 0 ? pendingCount : 0
        ]);
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Empleados');

    // Add history sheet if requested
    if (options.includeHistory) {
        const historyRows = [['Empleado', 'Curso', 'Fecha', 'Calificación', 'Estado']];

        data.forEach(emp => {
            (emp.history || []).forEach(h => {
                historyRows.push([
                    emp.name,
                    h.courseName,
                    h.date,
                    h.score,
                    h.status === 'approved' ? 'Aprobado' : 'Reprobado'
                ]);
            });
        });

        const historyWs = XLSX.utils.aoa_to_sheet(historyRows);
        XLSX.utils.book_append_sheet(wb, historyWs, 'Historial');
    }

    // Generate and download
    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
};

/**
 * Export compliance report to PDF
 * @param {Array} data - Array of employee records
 * @param {Object} options - Report options (department, title, etc)
 */
export const exportPDFCompliance = async (data, options = {}) => {
    // Dynamic imports - jspdf-autotable needs to be imported after jspdf
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;

    // Import autotable as a function
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();
    const { department = 'Todos', title = 'Reporte de Cumplimiento' } = options;

    // Filter by department if specified
    const filteredData = department === 'Todos'
        ? data
        : data.filter(d => d.department === department);

    // Header
    doc.setFontSize(18);
    doc.setTextColor(31, 41, 55);
    doc.text(title, 14, 22);

    // Subtitle
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    doc.text(`Departamento: ${department}`, 14, 30);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 14, 36);
    doc.text(`Total Empleados: ${filteredData.length}`, 14, 42);

    // Calculate KPIs
    const totalCompliance = filteredData.reduce((acc, emp) =>
        acc + (emp.matrix?.compliancePercentage || 0), 0);
    const avgCompliance = filteredData.length > 0
        ? (totalCompliance / filteredData.length).toFixed(1)
        : 0;

    const critical = filteredData.filter(e => (e.matrix?.compliancePercentage || 0) < 70).length;
    const excellent = filteredData.filter(e => (e.matrix?.compliancePercentage || 0) >= 90).length;

    // KPI Summary Box
    doc.setFillColor(249, 250, 251);
    doc.rect(14, 48, 182, 20, 'F');

    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.text(`Cumplimiento Promedio: ${avgCompliance}%`, 20, 58);
    doc.text(`Críticos (<70%): ${critical}`, 80, 58);
    doc.text(`Excelentes (≥90%): ${excellent}`, 140, 58);

    // Table
    const tableData = filteredData
        .sort((a, b) => (a.matrix?.compliancePercentage || 0) - (b.matrix?.compliancePercentage || 0))
        .map(emp => [
            emp.employeeId || emp.id?.substring(0, 8) || '',
            emp.name || '',
            emp.position || '',
            `${emp.matrix?.completedCount || 0}/${emp.matrix?.requiredCount || 0}`,
            `${emp.matrix?.compliancePercentage || 0}%`
        ]);

    // Use autoTable as a function instead of method on doc
    autoTable(doc, {
        startY: 75,
        head: [['ID', 'Nombre', 'Puesto', 'Cursos', 'Cumplimiento']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [59, 130, 246],
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 9,
            cellPadding: 3
        },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 55 },
            2: { cellWidth: 50 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 }
        },
        didDrawCell: (data) => {
            // Color code compliance column
            if (data.column.index === 4 && data.cell.section === 'body') {
                const pct = parseFloat(data.cell.text[0]) || 0;
                if (pct < 70) {
                    doc.setTextColor(239, 68, 68);
                } else if (pct >= 90) {
                    doc.setTextColor(16, 185, 129);
                } else {
                    doc.setTextColor(245, 158, 11);
                }
            }
        }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
            `Página ${i} de ${pageCount} - Generado automáticamente`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save
    const timestamp = new Date().toISOString().split('T')[0];
    const deptSlug = department.replace(/\s+/g, '_').toLowerCase();
    doc.save(`reporte_cumplimiento_${deptSlug}_${timestamp}.pdf`);
};

/**
 * Export DC-3 certificates in batch
 * @param {Array} employees - Array of employee records
 * @param {Object} coursesMap - Map of course names to course data
 */
export const exportBatchDC3 = async (employees, coursesMap) => {
    // This would generate multiple DC-3 PDFs
    // For now, we'll just show a message
    console.log('Batch DC-3 export not yet implemented');
    return { success: false, message: 'Funcionalidad en desarrollo' };
};
