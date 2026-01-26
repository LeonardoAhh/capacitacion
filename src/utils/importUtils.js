/**
 * File Import Utilities for Training Records
 * Handles JSON and Excel file imports
 */

/**
 * Parse uploaded file (JSON or Excel)
 * @param {File} file - The uploaded file
 * @returns {Promise<Array>} Parsed records array
 */
export const parseImportFile = async (file) => {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.json')) {
        return parseJSONFile(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        return parseExcelFile(file);
    } else {
        throw new Error('Formato no soportado. Use .json o .xlsx');
    }
};

/**
 * Parse JSON file
 */
const parseJSONFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                // Validate structure
                if (!Array.isArray(data)) {
                    throw new Error('El archivo JSON debe contener un array de registros');
                }
                // Normalize records
                const normalized = data.map(normalizeRecord);
                resolve(normalized);
            } catch (err) {
                reject(new Error(`Error al parsear JSON: ${err.message}`));
            }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsText(file);
    });
};

/**
 * Parse Excel file
 */
const parseExcelFile = async (file) => {
    const XLSX = await import('xlsx');

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                // Map Excel columns to expected format
                const normalized = jsonData.map(row => {
                    return normalizeRecord({
                        employeeId: row['ID Empleado'] || row['employeeId'] || row['id'] || '',
                        courseName: row['Nombre Curso'] || row['courseName'] || row['curso'] || '',
                        date: parseExcelDate(row['Fecha'] || row['date'] || ''),
                        score: parseFloat(row['Calificación'] || row['score'] || row['calificacion'] || 0)
                    });
                });

                resolve(normalized);
            } catch (err) {
                reject(new Error(`Error al parsear Excel: ${err.message}`));
            }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Parse Excel date (could be serial number or string)
 */
const parseExcelDate = (dateValue) => {
    if (!dateValue) return new Date().toISOString().split('T')[0];

    // If it's already a string date
    if (typeof dateValue === 'string') {
        // Try to parse DD/MM/YYYY or YYYY-MM-DD
        if (dateValue.includes('/')) {
            const [d, m, y] = dateValue.split('/');
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        return dateValue;
    }

    // If it's an Excel serial date number
    if (typeof dateValue === 'number') {
        const date = new Date((dateValue - 25569) * 86400 * 1000);
        return date.toISOString().split('T')[0];
    }

    return new Date().toISOString().split('T')[0];
};

/**
 * Normalize record to standard format
 */
const normalizeRecord = (record) => {
    return {
        employeeId: String(record.employeeId || '').trim().toUpperCase(),
        courseName: String(record.courseName || '').trim().toUpperCase(),
        date: record.date || new Date().toISOString().split('T')[0],
        score: Math.min(100, Math.max(0, parseFloat(record.score) || 0))
    };
};

/**
 * Validate imported records
 * @param {Array} records - Normalized records
 * @param {Array} employees - Available employees [{id, employeeId, name}]
 * @returns {Object} { valid: [], invalid: [], warnings: [] }
 */
export const validateImportRecords = (records, employees) => {
    const valid = [];
    const invalid = [];
    const warnings = [];

    // Create employee lookup by employeeId
    const empLookup = {};
    employees.forEach(emp => {
        if (emp.employeeId) {
            empLookup[emp.employeeId.toUpperCase()] = emp;
        }
    });

    records.forEach((record, index) => {
        const issues = [];

        // Check required fields
        if (!record.employeeId) {
            issues.push('Falta ID de empleado');
        }
        if (!record.courseName) {
            issues.push('Falta nombre del curso');
        }
        if (record.score < 0 || record.score > 100) {
            issues.push('Calificación debe estar entre 0 y 100');
        }

        // Check if employee exists
        const matchedEmp = empLookup[record.employeeId];
        if (!matchedEmp && record.employeeId) {
            issues.push(`Empleado "${record.employeeId}" no encontrado`);
        }

        if (issues.length > 0) {
            invalid.push({ ...record, row: index + 1, issues });
        } else {
            valid.push({
                ...record,
                row: index + 1,
                docId: matchedEmp.id,
                employeeName: matchedEmp.name
            });
        }
    });

    return { valid, invalid, warnings };
};

/**
 * Generate Excel template for download
 */
export const generateExcelTemplate = async () => {
    const XLSX = await import('xlsx');

    const templateData = [
        ['ID Empleado', 'Nombre Curso', 'Fecha', 'Calificación'],
        ['EMP001', 'INDUCCIÓN A LA EMPRESA', '15/01/2024', 100],
        ['EMP002', 'SEGURIDAD Y PREVENCIÓN DE ACCIDENTES', '20/01/2024', 85],
        ['EMP003', 'USO DE EQUIPO DE PROTECCIÓN PERSONAL', '10/02/2024', 92]
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    ws['!cols'] = [
        { wch: 15 },  // ID Empleado
        { wch: 45 },  // Nombre Curso
        { wch: 12 },  // Fecha
        { wch: 12 }   // Calificación
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Capacitaciones');

    XLSX.writeFile(wb, 'plantilla_capacitaciones.xlsx');
};
