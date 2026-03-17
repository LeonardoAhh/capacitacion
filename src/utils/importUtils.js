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
                // Determine if it's training records or employee import based on first item
                const firstItem = data[0] || {};
                const isEmployeeImport = firstItem.hasOwnProperty('department') || firstItem.hasOwnProperty('position');

                const normalized = data.map(isEmployeeImport ? normalizeEmployeeRecord : normalizeRecord);
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

                if (jsonData.length === 0) {
                    resolve([]);
                    return;
                }

                // Determine import type based on columns
                const firstRow = jsonData[0];
                // Check if it has employee-specific fields to distinguish from training records
                const isEmployeeImport = (firstRow['Departamento'] || firstRow['department'] || firstRow['Puesto'] || firstRow['position']);

                let normalized;
                if (isEmployeeImport) {
                    normalized = jsonData.map(row => normalizeEmployeeRecord({
                        name: row['Nombre'] || row['name'] || '',
                        employeeId: row['ID Empleado'] || row['employeeId'] || row['id'] || '',
                        department: row['Departamento'] || row['department'] || '',
                        position: row['Puesto'] || row['position'] || '',
                        curp: row['CURP'] || row['curp'] || '',
                        area: row['Área'] || row['Area'] || row['area'] || '',
                        shift: row['Turno'] || row['Shift'] || row['shift'] || '',
                        startDate: parseExcelDate(row['Fecha Ingreso'] || row['startDate'] || '')
                    }));
                } else {
                    normalized = jsonData.map(row => {
                        return normalizeRecord({
                            employeeId: row['ID Empleado'] || row['employeeId'] || row['id'] || '',
                            courseName: row['Nombre Curso'] || row['courseName'] || row['curso'] || '',
                            date: parseExcelDate(row['Fecha'] || row['date'] || ''),
                            score: parseFloat(row['Calificación'] || row['score'] || row['calificacion'] || 0)
                        });
                    });
                }

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
export const normalizeRecord = (record) => {
    // Normalize date - handle DD/MM/YYYY or YYYY-MM-DD
    let normalizedDate = null;

    if (record.date && typeof record.date === 'string') {
        const dateStr = record.date.trim();

        // Check if date is already in DD/MM/YYYY format
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            // Validate it has exactly 3 parts (DD/MM/YYYY)
            if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
                // Already in correct format, keep as is
                normalizedDate = dateStr;
            }
        }
        // Check if date is in YYYY-MM-DD format (from date input)
        else if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            // Must have exactly 3 parts: year, month, day
            if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
                const [year, month, day] = parts;
                // Convert to DD/MM/YYYY
                normalizedDate = `${day}/${month}/${year}`;
            }
        }
    }

    // If we couldn't parse the date, use today's date
    if (!normalizedDate) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        normalizedDate = `${day}/${month}/${year}`;
    }

    return {
        employeeId: String(record.employeeId || '').trim().toUpperCase(),
        courseName: String(record.courseName || '').trim().toUpperCase(),
        date: normalizedDate,
        score: Math.min(100, Math.max(0, parseFloat(record.score) || 0))
    };
};

/**
 * Normalize Employee Record
 */
const normalizeEmployeeRecord = (record) => {
    return {
        name: String(record.name || '').trim().toUpperCase(),
        employeeId: String(record.employeeId || '').trim().toUpperCase(),
        department: String(record.department || 'GENERAL').trim().toUpperCase(),
        position: String(record.position || 'OPERARIO').trim().toUpperCase(),
        curp: String(record.curp || '').trim().toUpperCase(),
        area: String(record.area || '').trim().toUpperCase(),
        shift: String(record.shift || '').trim().toUpperCase(),
        startDate: record.startDate
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
 * Validate a single record against the employee list.
 * Used for re-validation after inline editing in the import preview.
 * @param {Object} record - Normalized record { employeeId, courseName, date, score }
 * @param {Array}  employees - Available employees [{ id, employeeId, name }]
 * @returns {{ valid: boolean, issues: string[], docId?: string, employeeName?: string }}
 */
export const validateSingleRecord = (record, employees) => {
    const empLookup = {};
    employees.forEach(emp => {
        if (emp.employeeId) {
            empLookup[emp.employeeId.toUpperCase().trim()] = emp;
        }
    });

    const issues = [];
    const empId = (record.employeeId || '').toUpperCase().trim();

    if (!empId) issues.push('Falta ID de empleado');
    if (!record.courseName) issues.push('Falta nombre del curso');
    if (record.score < 0 || record.score > 100) issues.push('Calificación debe estar entre 0 y 100');

    const matchedEmp = empLookup[empId];
    if (!matchedEmp && empId) issues.push(`Empleado "${empId}" no encontrado`);

    return {
        valid: issues.length === 0,
        issues,
        docId: matchedEmp?.id,
        employeeName: matchedEmp?.name,
    };
};

/**
 * Validate Employee Import Records
 */
export const validateEmployeeImportRecords = (records, existingEmployees) => {
    const valid = [];
    const invalid = [];
    const warnings = [];

    const existingIds = new Set(existingEmployees.map(e => e.id));
    const existingEmpIds = new Set(existingEmployees.map(e => e.employeeId));

    records.forEach((record, index) => {
        const issues = [];

        if (!record.name) issues.push('Falta Nombre');
        if (!record.department) issues.push('Falta Departamento');
        if (!record.position) issues.push('Falta Puesto');

        // Check duplicates if ID provided
        if (record.employeeId) {
            if (existingIds.has(record.employeeId) || existingEmpIds.has(record.employeeId)) {
                issues.push(`ID "${record.employeeId}" ya existe`);
            }
        }

        if (issues.length > 0) {
            invalid.push({ ...record, row: index + 1, issues });
        } else {
            valid.push({ ...record, row: index + 1 });
        }
    });

    return { valid, invalid, warnings };
};

/**
 * Validate a single employee record against the existing list.
 * Used for re-validation after inline editing in the employee import preview.
 * @param {Object} record - Normalized employee record
 * @param {Array} existingEmployees - Current employee list
 * @returns {{ valid: boolean, issues: string[] }}
 */
export const validateSingleEmployeeRecord = (record, existingEmployees) => {
    const issues = [];
    const existingIds = new Set(existingEmployees.map(e => String(e.id).toUpperCase()));
    const existingEmpIds = new Set(existingEmployees.map(e => String(e.employeeId).toUpperCase()));

    if (!record.name) issues.push('Falta Nombre');
    if (!record.department) issues.push('Falta Departamento');
    if (!record.position) issues.push('Falta Puesto');

    if (record.employeeId) {
        const upperId = String(record.employeeId).toUpperCase();
        if (existingIds.has(upperId) || existingEmpIds.has(upperId)) {
            issues.push(`ID "${record.employeeId}" ya existe`);
        }
    }

    return {
        valid: issues.length === 0,
        issues
    };
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

/**
 * Generate Employee Excel Template
 */
export const generateEmployeeTemplate = async () => {
    const XLSX = await import('xlsx');

    const templateData = [
        ['Nombre', 'ID Empleado', 'Departamento', 'Puesto', 'CURP', 'Área', 'Turno', 'Fecha Ingreso'],
        ['JUAN PEREZ', 'EMP100', 'PRODUCCIÓN', 'OPERADOR', 'CURP123456...', 'PRODUCCIÓN 1ER TURNO', '1', '2024-01-01'],
        ['MARIA LOPEZ', 'EMP101', 'CALIDAD', 'INSPECTOR', 'CURP654321...', 'A. CALIDAD', '2', '2024-01-15']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);

    ws['!cols'] = [
        { wch: 30 }, // Nombre
        { wch: 15 }, // ID
        { wch: 20 }, // Depto
        { wch: 20 }, // Puesto
        { wch: 20 }, // CURP
        { wch: 20 }, // Area
        { wch: 10 }, // Turno
        { wch: 15 }  // Fecha
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Empleados');
    XLSX.writeFile(wb, 'plantilla_empleados.xlsx');
};
