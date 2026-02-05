const fs = require('fs');
const path = require('path');

// --- Configuration ---
const DATA_DIR = path.join(__dirname, '../src/data');
const MATRIZ_FILE = path.join(DATA_DIR, 'matriz.json');
const HISTORIAL_FILE = path.join(DATA_DIR, 'historial.json');

// The specific 10 Induction Courses from user request
const INDUCTION_COURSES = [
    "ALERTAS DE CALIDAD Y CATÁLOGO DE FALLAS",
    "FAMILIAS DEL PRODUCTO",
    "INDUCCIÓN A LA EMPRESA",
    "INSTRUCCIONES DE TRABAJO",
    "METODOLOGÍA 5S",
    "NOM-036-1-STPS-2018",
    "REPORTE DE PRODUCCIÓN",
    "SEGURIDAD Y PREVENCIÓN DE ACCIDENTES",
    "SEPARACIÓN DE RESIDUOS",
    "SISTEMA DE GESTIÓN INTEGRAL"
];

function loadJSON(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error loading ${filePath}:`, err.message);
        process.exit(1);
    }
}

function normalizeString(str) {
    return str ? str.trim().toUpperCase() : '';
}

function main() {
    console.log("Loading data...");
    const matrizData = loadJSON(MATRIZ_FILE);
    const historialData = loadJSON(HISTORIAL_FILE);

    // 1. Build Requirements Map: Position -> Set of Required Course Names
    console.log("Building requirements matrix...");
    const positionRequirements = {};
    matrizData.forEach(item => {
        const pos = normalizeString(item.position);
        const course = normalizeString(item.requiredCourses);
        if (!positionRequirements[pos]) {
            positionRequirements[pos] = new Set();
        }
        positionRequirements[pos].add(course);
    });

    // 2. Process Employee Data from History
    console.log("Processing employee history...");
    const employees = {};

    historialData.forEach(record => {
        const empId = record.employeeId;
        if (!empId) return;

        if (!employees[empId]) {
            employees[empId] = {
                id: empId,
                name: record.name,
                position: normalizeString(record.position),
                department: record.deparment,
                coursesTaken: new Set()
            };
        }

        // We assume the position in the records is relatively consistent or we take the one encountered.
        // If an employee changes positions, the history file might have mixed positions.
        // Ideally we'd sort by date, but given the structure, we'll assume the 'position' field 
        // in most recent records is the current one. 
        // For simplicity contributing, we'll update position if it changes (last write wins strategy roughly)
        if (record.position) {
            employees[empId].position = normalizeString(record.position);
        }

        const courseName = normalizeString(record['course taken']);
        const qualification = parseFloat(record.qualification);

        // Assume passed if qualification > 0 or field exists. 
        // Some records have "100", some "90". Let's assume >= 60 is pass or just presence implies attendance.
        // User example showed "approved" status, but file has scores.
        if (!isNaN(qualification) && qualification >= 60) {
            employees[empId].coursesTaken.add(courseName);
        } else if (courseName) {
            // Fallback if no score but record exists (attendance)
            employees[empId].coursesTaken.add(courseName);
        }
    });

    // 3. Analyze Compliance
    console.log("Analyzing compliance...");

    let totalEmployeesScanned = 0;
    let employeesWithInductionNeeds = 0;

    const globalStats = {
        required: 0,
        completed: 0,
        missing: 0
    };

    const employeeResults = [];

    Object.values(employees).forEach(emp => {
        totalEmployeesScanned++;
        const pos = emp.position;
        const requirements = positionRequirements[pos] || new Set();

        // Filter requirements to ONLY Induction Courses
        const inductionRequirements = [...requirements].filter(course =>
            INDUCTION_COURSES.includes(course)
        );

        if (inductionRequirements.length === 0) {
            return; // Employee's position doesn't require any of the 10 induction courses
        }

        employeesWithInductionNeeds++;

        const taken = [];
        const missing = [];

        inductionRequirements.forEach(reqCourse => {
            if (emp.coursesTaken.has(reqCourse)) {
                taken.push(reqCourse);
                globalStats.completed++;
            } else {
                missing.push(reqCourse);
                globalStats.missing++;
            }
            globalStats.required++;
        });

        const compliance = (taken.length / inductionRequirements.length) * 100;

        employeeResults.push({
            id: emp.id,
            name: emp.name,
            position: emp.position,
            department: emp.department,
            requiredCount: inductionRequirements.length,
            completedCount: taken.length,
            complianceInternal: compliance, // for sorting
            complianceStr: compliance.toFixed(1) + '%',
            missingCourses: missing
        });
    });

    // 4. Output Results
    // Sort by compliance (ascending - those with most needs first)
    employeeResults.sort((a, b) => a.complianceInternal - b.complianceInternal);

    const overallCompliance = (globalStats.completed / globalStats.required) * 100 || 0;

    console.log("\n--- ANALYSIS REPORT ---");
    console.log(`Total Employees Scanned: ${totalEmployeesScanned}`);
    console.log(`Employees with Induction Requirements: ${employeesWithInductionNeeds}`);
    console.log(`\nGlobal Induction Stats:`);
    console.log(`  Total Assignments required: ${globalStats.required}`);
    console.log(`  Total Completed:            ${globalStats.completed}`);
    console.log(`  Global Compliance:          ${overallCompliance.toFixed(2)}%`);

    console.log(`\n--- TOP GAPS (Employees with lowest compliance) ---`);
    // Show top 20 with lowest compliance
    employeeResults.slice(0, 20).forEach(emp => {
        if (emp.complianceInternal < 100) {
            console.log(`\n[${emp.id}] ${emp.name} (${emp.position})`);
            console.log(`  Compliance: ${emp.complianceStr} (${emp.completedCount}/${emp.requiredCount})`);
            console.log(`  Missing: ${emp.missingCourses.join(', ')}`);
        }
    });

    // Generate JSON output for potential artifact usage
    const output = {
        meta: {
            date: new Date().toISOString(),
            courseList: INDUCTION_COURSES
        },
        stats: {
            employeesAnalyzed: totalEmployeesScanned,
            employeesWithRequirements: employeesWithInductionNeeds,
            globalCompliance: overallCompliance.toFixed(2)
        },
        details: employeeResults
    };

    fs.writeFileSync(path.join(__dirname, 'induction_analysis_result.json'), JSON.stringify(output, null, 2));
    console.log(`\nFull JSON report saved to: scripts/induction_analysis_result.json`);
}

main();
