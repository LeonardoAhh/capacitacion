/**
 * Genera un documento PDF DC-3 (Constancia de Competencias o Habilidades Laborales)
 * Formato oficial STPS - México
 * 
 * @param {Object} employee - Datos del trabajador
 * @param {Object} course - Datos del curso
 * @param {Object} record - Registro del curso (fechas)
 * @param {Object} company - Datos de la empresa (opcional, usa valores fijos si no se proporciona)
 * @returns {Promise<boolean>} - true si se generó correctamente
 */
export async function generateDC3(employee, course, record, company = null) {

    // ═══════════════════════════════════════════════════════════════════════
    // DATOS FIJOS DE LA EMPRESA - MODIFICA ESTOS VALORES SEGÚN TU EMPRESA
    // ═══════════════════════════════════════════════════════════════════════
    const companyData = company || {
        name: "VIÑOPLASTIC INYECCIÓN S.A DE C.V",
        rfc: "VIN060718N90",
        representative: "ING. TERRAZAS MARTÍNEZ JAIME",           // ← Nombre del Representante del Patrón
        workerRepresentative: "LIC. HERNÁNDEZ HERRERA LEONARDO A"     // ← Nombre del Representante de Trabajadores
    };

    // Validar datos requeridos
    if (!employee?.name || !course?.name) {
        console.error("generateDC3: Faltan datos requeridos (employee.name o course.name)");
        return false;
    }

    // Cargar jsPDF si no está disponible
    if (!window.jspdf) {
        try {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
                script.onload = () => resolve();
                script.onerror = () => reject(new Error("Failed to load jsPDF"));
                document.head.appendChild(script);
            });
        } catch (error) {
            console.error("generateDC3: Error al cargar jsPDF", error);
            return false;
        }
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.width;
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);

    // ==================== FUNCIONES AUXILIARES ====================

    /**
     * Dibuja un encabezado de sección con fondo negro
     */
    const drawSectionHeader = (text, y) => {
        doc.setFillColor(0, 0, 0);
        doc.rect(margin, y, contentWidth, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(text, pageWidth / 2, y + 4.8, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
    };

    /**
     * Dibuja un campo con etiqueta y valor
     */
    const drawField = (label, value, x, y, w, h, fontSize = 9) => {
        doc.setLineWidth(0.3);
        doc.rect(x, y, w, h);

        // Etiqueta (label)
        doc.setFontSize(5.5);
        doc.setFont("helvetica", "normal");
        doc.text(label, x + 1.5, y + 3);

        // Valor
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", "bold");
        if (value) {
            const maxWidth = w - 4;
            let displayValue = String(value).toUpperCase();

            // Truncar si excede el ancho
            while (doc.getTextWidth(displayValue) > maxWidth && displayValue.length > 0) {
                displayValue = displayValue.slice(0, -1);
            }

            doc.text(displayValue, x + 2, y + h - 2.5);
        }

        doc.setFont("helvetica", "normal");
    };

    /**
     * Parsea una fecha en formato DD/MM/YYYY o YYYY-MM-DD
     */
    const parseDate = (dateStr) => {
        let day = "", month = "", year = "";

        if (dateStr) {
            if (dateStr.includes('/')) {
                [day, month, year] = dateStr.split('/');
            } else if (dateStr.includes('-')) {
                [year, month, day] = dateStr.split('-');
            }
        }

        return {
            day: day ? day.padStart(2, '0') : "",
            month: month ? month.padStart(2, '0') : "",
            year: year || ""
        };
    };

    /**
     * Dibuja las cajas de fecha (Año, Mes, Día)
     */
    const drawDateBoxes = (x, yLabel, yBox, dateObj, boxW = 10, boxH = 6) => {
        const { day, month, year } = dateObj;

        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");

        // Etiquetas
        doc.text("Año", x + 2, yLabel);
        doc.text("Mes", x + boxW + 4, yLabel);
        doc.text("Día", x + (boxW * 2) + 6, yLabel);

        // Cajas
        doc.setLineWidth(0.3);
        doc.rect(x, yBox, boxW, boxH);
        doc.rect(x + boxW + 2, yBox, boxW, boxH);
        doc.rect(x + (boxW * 2) + 4, yBox, boxW, boxH);

        // Valores centrados
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        if (year) doc.text(year, x + boxW / 2, yBox + 4.5, { align: 'center' });
        if (month) doc.text(month, x + boxW + 2 + boxW / 2, yBox + 4.5, { align: 'center' });
        if (day) doc.text(day, x + (boxW * 2) + 4 + boxW / 2, yBox + 4.5, { align: 'center' });

        doc.setFont("helvetica", "normal");
    };

    /**
     * Sanitiza el nombre del archivo
     */
    const sanitizeFilename = (str) => {
        return str.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
    };

    // ==================== DIBUJO DEL DOCUMENTO ====================

    let cursorY = 12;

    // --- ENCABEZADO PRINCIPAL ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("FORMATO DC-3", pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 6;

    doc.setFontSize(10);
    doc.text("CONSTANCIA DE COMPETENCIAS O DE HABILIDADES LABORALES", pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 8;

    // ==================== SECCIÓN 1: DATOS DEL TRABAJADOR ====================
    drawSectionHeader("DATOS DEL TRABAJADOR", cursorY);
    cursorY += 7;

    // Nombre completo
    drawField(
        "Nombre (Anotar apellido paterno, apellido materno y nombre(s))",
        employee.name,
        margin, cursorY, contentWidth, 12, 10
    );
    cursorY += 12;

    // CURP y Ocupación
    const wCurp = contentWidth * 0.45;
    const wOcup = contentWidth - wCurp;
    drawField(
        "Clave Única de Registro de Población (CURP)",
        employee.curp || "",
        margin, cursorY, wCurp, 12, 9
    );
    drawField(
        "Ocupación específica (Catálogo Nacional de Ocupaciones) 1/",
        employee.occupation || employee.position || "",
        margin + wCurp, cursorY, wOcup, 12, 8
    );
    cursorY += 12;

    // Puesto
    drawField("Puesto*", employee.position || "", margin, cursorY, contentWidth, 12, 10);
    cursorY += 16;

    // ==================== SECCIÓN 2: DATOS DE LA EMPRESA ====================
    drawSectionHeader("DATOS DE LA EMPRESA", cursorY);
    cursorY += 7;

    // Razón Social
    drawField(
        "Nombre o razón social (En caso de persona física, anotar apellido paterno, apellido materno y nombre(s))",
        companyData.name,
        margin, cursorY, contentWidth, 12, 9
    );
    cursorY += 12;

    // RFC
    drawField(
        "Registro Federal de Contribuyentes con homoclave (SHCP)",
        companyData.rfc,
        margin, cursorY, contentWidth, 12, 10
    );
    cursorY += 16;

    // ==================== SECCIÓN 3: DATOS DEL PROGRAMA ====================
    drawSectionHeader("DATOS DEL PROGRAMA DE CAPACITACIÓN, ADIESTRAMIENTO Y PRODUCTIVIDAD", cursorY);
    cursorY += 7;

    // Nombre del curso
    drawField("Nombre del curso", course.name, margin, cursorY, contentWidth, 11, 9);
    cursorY += 11;

    // Duración y Período de ejecución
    const rowHeight = 16;
    const wDur = 45;

    // Campo Duración
    drawField("Duración en horas", course.duration || "8", margin, cursorY, wDur, rowHeight, 10);

    // Contenedor del período
    const xPeriod = margin + wDur;
    const wPeriod = contentWidth - wDur;
    doc.setLineWidth(0.3);
    doc.rect(xPeriod, cursorY, wPeriod, rowHeight);

    // Etiqueta "Periodo de ejecución"
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text("Periodo de", xPeriod + 3, cursorY + 5);
    doc.text("ejecución:", xPeriod + 3, cursorY + 9);

    // Parsear fechas
    const startDate = parseDate(record?.startDate || record?.date);
    const endDate = parseDate(record?.endDate || record?.date);

    // Sección "De"
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("De", xPeriod + 28, cursorY + 9);

    const xDeBoxes = xPeriod + 35;
    const yLabels = cursorY + 4;
    const yBoxes = cursorY + 6;
    drawDateBoxes(xDeBoxes, yLabels, yBoxes, startDate, 9, 6);

    // Sección "a"
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("a", xPeriod + 72, cursorY + 9);

    const xABoxes = xPeriod + 77;
    drawDateBoxes(xABoxes, yLabels, yBoxes, endDate, 9, 6);

    cursorY += rowHeight;

    // Área temática
    drawField(
        "Área temática del curso 2/",
        course.category || "6000 - Seguridad, higiene y medio ambiente laboral",
        margin, cursorY, contentWidth, 11, 8
    );
    cursorY += 11;

    // Agente capacitador
    drawField(
        "Nombre del agente capacitador o STPS 3/",
        course.instructor || "Instructor Interno",
        margin, cursorY, contentWidth, 11, 9
    );
    cursorY += 16;

    // ==================== TEXTO LEGAL ====================
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(
        "Los datos se asientan en esta constancia bajo protesta de decir verdad, apercibidos de la responsabilidad en que incurre todo",
        pageWidth / 2, cursorY, { align: 'center' }
    );
    cursorY += 4;
    doc.text(
        "aquel que no se conduce con verdad.",
        pageWidth / 2, cursorY, { align: 'center' }
    );
    cursorY += 10;

    // ==================== SECCIÓN DE FIRMAS ====================
    const colW = contentWidth / 3;
    const sigLineW = colW - 14;
    const sigY = cursorY + 22;

    doc.setLineWidth(0.3);

    // Función auxiliar para dibujar columna de firma
    const drawSignatureColumn = (x, title, name, footnote = "") => {
        // Título
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.text(title + footnote, x + colW / 2, cursorY, { align: 'center' });

        // Nombre del firmante (si existe)
        if (name) {
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text(name.toUpperCase(), x + colW / 2, sigY - 3, { align: 'center' });
        }

        // Línea de firma
        doc.line(x + 7, sigY, x + 7 + sigLineW, sigY);

        // "Nombre y firma"
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text("Nombre y firma", x + colW / 2, sigY + 4, { align: 'center' });
    };

    // 1. Instructor o Tutor
    drawSignatureColumn(margin, "Instructor o tutor", course.instructor);

    // 2. Patrón o Representante Legal (NOMBRE FIJO)
    drawSignatureColumn(
        margin + colW,
        "Patrón o representante legal",
        companyData.representative,      // ← USA EL NOMBRE FIJO
        " 4/"
    );

    // 3. Representante de los Trabajadores (NOMBRE FIJO)
    drawSignatureColumn(
        margin + (colW * 2),
        "Representante de los trabajadores",
        companyData.workerRepresentative, // ← USA EL NOMBRE FIJO
        " 5/"
    );

    cursorY = sigY + 12;

    // ==================== INSTRUCCIONES (PIE DE PÁGINA) ====================
    doc.setFontSize(4.5);
    doc.setFont("helvetica", "normal");

    const instructions = [
        "INSTRUCCIONES",
        "- Llenar a máquina o con letra de molde.",
        "- Deberá entregarse al trabajador dentro de los veinte días hábiles siguientes al término del curso de capacitación aprobado.",
        "",
        "1/ Las áreas y subáreas ocupacionales del Catálogo Nacional de Ocupaciones se encuentran disponibles en el reverso de este formato y en la página www.stps.gob.mx",
        "2/ Las áreas temáticas de los cursos se encuentran disponibles en el reverso de este formato y en la página www.stps.gob.mx",
        "3/ Cursos impartidos por el área competente de la Secretaría del Trabajo y Previsión Social.",
        "4/ Para empresas con menos de 51 trabajadores. Para empresas con más de 50 trabajadores firmaría el representante del patrón ante la Comisión mixta de capacitación,",
        "     adiestramiento y productividad.",
        "5/ Solo para empresas con más de 50 trabajadores.",
        "",
        "* Dato no obligatorio."
    ];

    instructions.forEach(line => {
        doc.text(line, margin, cursorY);
        cursorY += 2.8;
    });

    // ==================== ETIQUETA DC-3 / ANVERSO ====================
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("DC-3", pageWidth - margin, cursorY + 2, { align: 'right' });
    doc.setFontSize(7);
    doc.text("ANVERSO", pageWidth - margin, cursorY + 6, { align: 'right' });

    // ==================== GUARDAR PDF ====================
    const fileName = `DC3_${sanitizeFilename(employee.name)}_${sanitizeFilename(course.name)}.pdf`;
    doc.save(fileName);

    console.log(`DC-3 generado exitosamente: ${fileName}`);
    return true;
}