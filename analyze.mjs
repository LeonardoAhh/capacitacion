import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query } from "firebase/firestore";
import fs from "fs";

// Cargar variables de entorno desde .env.local para no exponer claves en el repositorio
try {
    const envLines = fs.readFileSync('.env.local', 'utf8').split('\n');
    envLines.forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            process.env[match[1]] = match[2].replace(/(^['"]|['"]$)/g, '').trim();
        }
    });
} catch (e) {
    console.warn("No se pudo cargar .env.local automáticamente. Asegúrate de configurarlas.");
}

// Configuración leída de forma segura
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const userCourses = [
    "ALERTAS DE CALIDAD Y CATÁLOGO DE FALLAS", "ASPECTOS E IMPACTOS AMBIENTALES", "AUDITORÍAS DE PROCESO EN CAPAS",
    "COLADA CALIENTE", "CONOCIMIENTO SOBRE LA LEY FEDERAL DEL TRABAJO", "MANEJO DE MATERIAL NO CONFORME",
    "CONTROL DE CONTRATISTAS", "ESTRUCTURA DEL SGI Y DOCUMENTOS", "FAMILIAS DEL PRODUCTO", "INDUCCIÓN A LA EMPRESA",
    "INSTRUCCIONES DE TRABAJO", "ISO 14001:2015", "DIAGRAMA DE TORTUGA", "MATRIZ DE RIESGOS", "METODOLOGÍA 5S",
    "NOM-004-STPS-1999", "NOM-005-STPS-1998", "NOM-009-STPS-2011", "NOM-035-STPS-2018",
    "OBJETIVOS DEL SGI, ASPECTOS E IMPACTOS AMBIENTALES", "PARA OPERADORES DE MÁQUINA", "PREVENCIÓN DE LA VIOLENCIA LABORAL",
    "REPORTE DE PRODUCCIÓN", "SEGURIDAD Y PREVENCIÓN DE ACCIDENTES", "SEPARACIÓN DE RESIDUOS", "SISTEMA DE GESTIÓN INTEGRAL",
    "TRAZABILIDAD DEL PRODUCTO", "VDA 6.5 AUDITORÍAS DE PRODUCTO", "LIDERAZGO", "COMUNICACIÓN ASERTIVA", "ESCUCHA EFECTIVA", "REUNIONES EFECTIVAS",
    "GESTIÓN DE EQUIPOS MULTICULTURALES", "INSPECCIÓN VISUAL", "NOM-026-STPS-2008", "IT-PRO-009", "IDENTIFICACIÓN HOUSING"
];

// Normalization function (same as in app)
const normalize = (str) => str?.trim().toUpperCase() || '';
const normalizeForMatch = (str) =>
    normalize(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ').trim();

const normalizedUserCourses = userCourses.map(c => normalizeForMatch(c));

async function main() {
    try {
        console.log("Cargando matriz.json...");
        const matrizRaw = JSON.parse(fs.readFileSync('./src/data/matriz.json', 'utf8'));

        // Puestos y sus cursos requeridos
        const matrixMap = new Map(); // position -> string[]
        const allRequiredCourses = new Set();

        matrizRaw.forEach(item => {
            const pos = item.position?.toUpperCase().trim();
            const course = item.requiredCourses?.trim();
            if (pos && course) {
                if (!matrixMap.has(pos)) matrixMap.set(pos, []);
                matrixMap.get(pos).push(course);
                allRequiredCourses.add(normalizeForMatch(course));
            }
        });

        console.log(`Leída la matriz: ${matrixMap.size} puestos diferentes.`);

        // Buscar cursos ingresados que no existen en la matriz ni están asignados a nadie
        const unassignedCourses = [];
        const maybeTypos = [];

        userCourses.forEach(course => {
            const norm = normalizeForMatch(course);
            if (!allRequiredCourses.has(norm)) {
                unassignedCourses.push(course);
            }
        });

        // Query Firestore training_records
        console.log("Consultando training_records desde Firestore...");
        const trainingSnapshot = await getDocs(collection(db, "training_records"));
        console.log(`Se encontraron ${trainingSnapshot.size} registros de entrenamiento.`);

        // agrupar por empleado, necesitamos obtener sus puestos también.
        // Consultaremos también 'employees' para obtener los puestos.
        const empSnapshot = await getDocs(collection(db, "employees"));
        const employeesMap = new Map(); // id -> { position, name }
        empSnapshot.forEach(doc => {
            const data = doc.data();
            employeesMap.set(data.employeeId || data.id || doc.id, {
                position: data.position?.toUpperCase().trim(),
                name: data.fullName || data.name || "Desconocido"
            });
        });

        const empHistory = new Map(); // id -> string[] of approved courses
        trainingSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'approved') {
                const empId = data.employeeId;
                if (!empHistory.has(empId)) empHistory.set(empId, new Set());
                empHistory.get(empId).add(normalizeForMatch(data.courseName));
            }
        });

        // 1. Qué puestos cumplirían al 100% su matriz SOLO con estos cursos
        const positionsFulfilling100 = [];
        for (const [pos, courses] of matrixMap.entries()) {
            let fulfills = true;
            for (const c of courses) {
                if (!normalizedUserCourses.includes(normalizeForMatch(c))) {
                    fulfills = false;
                    break;
                }
            }
            if (fulfills) positionsFulfilling100.push(pos);
        }

        // 2. Calcular incremento global leyendo también las propiedades precalculadas 'matrix' de cada empleado
        let currentTotalCompliance = 0;
        let futureTotalCompliance = 0;
        let validEmployeesCount = 0;

        // Vamos a usar los documentos directos de training_records que el dashboard usa
        const dashboardRecords = [];
        trainingSnapshot.forEach(doc => {
            dashboardRecords.push(doc.data());
        });

        // 2.1 Calculo de Avance Actual basado en el Dashboard (promedio de matrix.compliancePercentage)
        dashboardRecords.forEach(r => {
            currentTotalCompliance += (r.matrix?.compliancePercentage || 0);
        });
        const currentAvg = dashboardRecords.length > 0
            ? (currentTotalCompliance / dashboardRecords.length).toFixed(2)
            : 0;

        // 2.2 Proyectar Avance Futuro
        employeesMap.forEach((empInfo, empId) => {
            if (!empInfo || !empInfo.position) return;
            const reqCourses = matrixMap.get(empInfo.position);
            if (!reqCourses || reqCourses.length === 0) return;

            validEmployeesCount++;

            // Obtener el historial de aprobados del empleado
            const approvedSet = empHistory.get(empId) || new Set();

            let futureCompleted = 0;
            reqCourses.forEach(req => {
                const reqNorm = normalizeForMatch(req);
                const hasCurrent = approvedSet.has(reqNorm);
                // Lo cumple si ya lo tiene aprobado o si se le dará en esta nueva lista de cursos
                const hasFuture = hasCurrent || normalizedUserCourses.includes(reqNorm);

                if (hasFuture) futureCompleted++;
            });

            const futPerc = (futureCompleted / reqCourses.length) * 100;
            futureTotalCompliance += futPerc;
        });

        const futureAvg = validEmployeesCount ? (futureTotalCompliance / validEmployeesCount).toFixed(2) : 0;
        // El incremento es la diferencia entre la proyección futura real y el promedio dashboard actual
        const incrAvg = (futureAvg - currentAvg).toFixed(2);

        // 3. Nuevo ingreso (empleados que tienen 0% actual)
        let newHireCount = 0;
        let newHireFutureComplianceTotal = 0;
        const newHirePositions = new Set(); // Guardar los puestos únicos
        const newHiresDetails = []; // Para guardar el detalle exacto

        empHistory.forEach((approvedSet, empId) => {
            const empInfo = employeesMap.get(empId);
            if (!empInfo || !empInfo.position) return;
            const reqCourses = matrixMap.get(empInfo.position);
            if (!reqCourses || reqCourses.length === 0) return;

            let currentCompleted = 0;
            let futureCompleted = 0;
            reqCourses.forEach(req => {
                const reqNorm = normalizeForMatch(req);
                if (approvedSet.has(reqNorm)) currentCompleted++;
                if (approvedSet.has(reqNorm) || normalizedUserCourses.includes(reqNorm)) futureCompleted++;
            });

            if (currentCompleted === 0) {
                newHireCount++;
                newHirePositions.add(empInfo.position);
                newHiresDetails.push({ id: empId, name: empInfo.name, position: empInfo.position });
                newHireFutureComplianceTotal += (futureCompleted / reqCourses.length) * 100;
            }
        });

        // Also add employees in employeesMap that don't have *any* training_records (true new hires)
        employeesMap.forEach((info, empId) => {
            if (!empHistory.has(empId)) {
                const reqCourses = matrixMap.get(info.position);
                if (!reqCourses || reqCourses.length === 0) return;

                newHireCount++;
                newHirePositions.add(info.position);
                newHiresDetails.push({ id: empId, name: info.name, position: info.position });

                let futureCompleted = 0;
                reqCourses.forEach(req => {
                    const reqNorm = normalizeForMatch(req);
                    if (normalizedUserCourses.includes(reqNorm)) futureCompleted++;
                });
                newHireFutureComplianceTotal += (futureCompleted / reqCourses.length) * 100;
            }
        });

        const newHireAvg = newHireCount > 0 ? (newHireFutureComplianceTotal / newHireCount).toFixed(2) : 0;

        // Escribir el HTML
        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Análisis de Capacitación</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fafaf8; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 900px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        h1 { color: #111; border-bottom: 2px solid #f59e0b; padding-bottom: 10px; }
        h2 { color: #f59e0b; margin-top: 30px; }
        .card { background: #fff; border: 1px solid #eaeaea; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
        .number { font-size: 2em; font-weight: bold; color: #f59e0b; }
        .success { color: #10b981; font-weight: bold; }
        ul { line-height: 1.6; }
        .alert { background: #fee2e2; color: #991b1b; padding: 15px; border-radius: 6px; border-left: 4px solid #dc2626; }
        .badge { display: inline-block; padding: 3px 8px; background: #f3f4f6; border-radius: 12px; font-size: 0.85em; margin: 3px; border: 1px solid #e5e7eb; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.9em; }
        .data-table th, .data-table td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
        .data-table th { background-color: #f9fafb; color: #4b5563; }
        .data-table tr:nth-child(even) { background-color: #f9fafb; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Análisis Estratégico de Cursos de Capacitación</h1>
        <p>Este reporte proyecta el impacto de aplicar el paquete de <strong>${userCourses.length} cursos</strong> propuestos al personal de la empresa, validando contra la matriz de puestos y los registros reales de <code>training_records</code> en Firebase.</p>
        
        <div class="card">
            <h2>1. Incremento de Avance Global</h2>
            <p>Calculando el promedio de avance actual de todos los empleados y sumando el porcentaje si aprueban este paquete de cursos:</p>
            <ul>
                <li>Avance Actual Promedio: <span class="number" style="font-size:1.5em; color:#6b7280;">${currentAvg}%</span></li>
                <li>Avance Futuro Proyectado: <span class="number" style="font-size:1.5em; color:#10b981;">${futureAvg}%</span></li>
                <li><strong>Incremento Total: <span class="success">▲ ${incrAvg}%</span></strong></li>
            </ul>
        </div>

        <div class="card">
            <h2>2. Avance en Personal de Nuevo Ingreso</h2>
            <p>Empleados que actualmente tienen un avance de 0% (o sin registros en historial) frente a su matriz de puesto:</p>
            <ul>
                <li>Total de Personal de Nuevo Ingreso / Sin Avance: <strong>${newHireCount} empleados</strong></li>
                <li>Avance promedio si toman estos cursos: <span class="number">${newHireAvg}%</span></li>
            </ul>
            <p><strong>Detalle de Empleados (0% de Avance Actual):</strong></p>
            <table class="data-table">
                <thead>
                    <tr><th>ID</th><th>Nombre</th><th>Puesto</th></tr>
                </thead>
                <tbody>
                    ${newHiresDetails.map(emp => `<tr><td><code>${emp.id}</code></td><td>${emp.name}</td><td>${emp.position}</td></tr>`).join('')}
                </tbody>
            </table>
        </div>

        <div class="card">
            <h2>3. Puestos que Cumplen su Matriz al 100%</h2>
            <p>Si un empleado de estos puestos aprueba <strong>todos los cursos de la lista</strong>, cumpliría su matriz al 100% (es decir, no requieren más cursos de los que están aquí):</p>
            ${positionsFulfilling100.length > 0 ?
                `<ul>${positionsFulfilling100.map(p => `<li><strong>${p}</strong></li>`).join('')}</ul>`
                : `<p><em>Ningún puesto en la matriz se cumple al 100% solo con estos cursos (todos los puestos exigen al menos un curso adicional que no está en la lista).</em></p>`
            }
        </div>

        <div class="card">
            <h2>4. Listado de Cursos Considerados</h2>
            <p>Se está contemplando el impacto del siguiente paquete de <strong>${userCourses.length} cursos</strong> en toda la plantilla:</p>
            <div>
                ${userCourses.map(c => `<span class="badge" style="background: #eef2ff; color: #4f46e5; border-color: #c7d2fe;">${c}</span>`).join('')}
            </div>
        </div>
    </div>
</body>
</html>
        `;

        fs.writeFileSync('reporte_capacitacion.html', html);
        console.log("¡Reporte generado exitosamente en reporte_capacitacion.html!");
        process.exit(0);

    } catch (error) {
        console.error("Error ejecutando el script:", error);
        process.exit(1);
    }
}

main();
