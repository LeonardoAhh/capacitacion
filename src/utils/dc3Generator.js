export async function generateDC3(employee, course, record) {
    if (!window.jspdf) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load jsPDF"));
            document.head.appendChild(script);
        });
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'letter'
    });

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    // Helpers
    const drawSectionHeader = (text, y) => {
        doc.setFillColor(0, 0, 0); // Black
        doc.rect(margin, y, contentWidth, 6, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(text, pageWidth / 2, y + 4.2, { align: 'center' });
        doc.setTextColor(0, 0, 0); // Reset
    };

    const drawField = (label, value, x, y, w, h, fontSize = 8) => {
        doc.setLineWidth(0.2);
        doc.rect(x, y, w, h);

        // Label
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text(label, x + 1, y + 3);

        // Value
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", "bold");
        if (value) {
            doc.text(String(value), x + 2, y + h - 2);
        }
    };

    const drawDateBox = (label, dateStr, x, y) => {
        // dateStr format DD/MM/YYYY or YYYY-MM-DD
        // We need Year Month Day separated
        let d = "", m = "", yyyy = "";
        if (dateStr) {
            // Try parse manual
            if (dateStr.includes('/')) {
                [d, m, yyyy] = dateStr.split('/');
            } else if (dateStr.includes('-')) {
                [yyyy, m, d] = dateStr.split('-');
            }
        }

        const boxH = 10;
        const boxW = contentWidth * 0.4;

        doc.setFontSize(7);
        doc.text("Año", x + 15, y - 1);
        doc.text("Mes", x + 28, y - 1);
        doc.text("Día", x + 41, y - 1);

        // Draw boxes for Y M D
        // Year
        doc.rect(x + 12, y, 10, 6); // Year box
        if (yyyy) doc.text(yyyy, x + 13, y + 4);

        // Month
        doc.rect(x + 25, y, 10, 6);
        if (m) doc.text(m, x + 26, y + 4);

        // Day
        doc.rect(x + 38, y, 10, 6);
        if (d) doc.text(d, x + 39, y + 4);
    };

    // --- DRAWING START ---
    let cursorY = 15;

    // Header Titles
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("FORMATO DC-3", pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 5;
    doc.setFontSize(12);
    doc.text("CONSTANCIA DE COMPETENCIAS O DE HABILIDADES LABORALES", pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 8;

    // SECTION 1: DATOS DEL TRABAJADOR
    drawSectionHeader("DATOS DEL TRABAJADOR", cursorY);
    cursorY += 6;

    // Row 1: Nombre (Apellido Paterno, Materno, Nombres)
    // We only have full name "employee.name". We'll put it there.
    drawField("Nombre (Anotar apellido paterno, apellido materno y nombre (s))", employee.name, margin, cursorY, contentWidth, 12, 10);
    cursorY += 12;

    // Row 2: CURP & Ocupación
    const wCurp = contentWidth * 0.4;
    const wOcup = contentWidth - wCurp;
    drawField("Clave Única de Registro de Población", employee.curp, margin, cursorY, wCurp, 12, 10);
    drawField("Ocupación específica (Catálogo Nacional de Ocupaciones) 1/", employee.occupation || employee.position, margin + wCurp, cursorY, wOcup, 12, 9);
    cursorY += 12;

    // Row 3: Puesto
    drawField("Puesto*", employee.position, margin, cursorY, contentWidth, 12, 10);
    cursorY += 12 + 4; // Space

    // SECTION 2: DATOS DE LA EMPRESA
    drawSectionHeader("DATOS DE LA EMPRESA", cursorY);
    cursorY += 6;

    // Row 1: Razón Social
    drawField("Nombre o razón social (En caso de persona física, anotar apellido paterno, apellido materno y nombre(s))", "SISTEMA VERTEX S.A. DE C.V.", margin, cursorY, contentWidth, 12, 10);
    cursorY += 12;

    // Row 2: RFC
    // Assuming RFC is fixed or config.
    const rfcWidth = contentWidth * 0.6; // Visual guess
    drawField("Registro Federal de Contribuyentes con homoclave (SHCP)", "VER901010ABC", margin, cursorY, contentWidth, 12, 10);
    cursorY += 12 + 4;

    // SECTION 3: PROGRAMA
    drawSectionHeader("DATOS DEL PROGRAMA DE CAPACITACIÓN, ADIESTRAMIENTO Y PRODUCTIVIDAD", cursorY);
    cursorY += 6;

    // Row 1: Nombre Curso
    drawField("Nombre del curso", course.name, margin, cursorY, contentWidth, 10, 9);
    cursorY += 10;

    // Row 2: Duración, Periodo header
    // Complex row: [Duración] [Periodo ejec (Label) [De Y M D] [a Y M D]]
    const hRow2 = 14;

    // Duration
    const wDur = 40;
    drawField("Duración en horas", (course.durationHours || 8) + " Horas", margin, cursorY, wDur, hRow2);

    // Period container
    const xPeriod = margin + wDur;
    const wPeriod = contentWidth - wDur;
    doc.rect(xPeriod, cursorY, wPeriod, hRow2);

    doc.setFontSize(7);
    doc.text("Periodo de", xPeriod + 2, cursorY + 4);
    doc.text("ejecución:", xPeriod + 2, cursorY + 8);

    // Dates
    // De
    doc.text("De", xPeriod + 25, cursorY + 8);
    // Draw Boxes (Year, Month, Day)
    // We need logic to parse record.date
    let year = "", month = "", day = "";
    if (record.date) {
        if (record.date.includes('/')) [day, month, year] = record.date.split('/'); // DD/MM/YYYY
        // Simple logic: Start and End same day for single record
    }

    // Helper text for boxes
    const yBoxLabels = cursorY + 4;
    const yBox = cursorY + 6;

    // "De" Section
    const xDe = xPeriod + 32;
    doc.text("Año", xDe, yBoxLabels); doc.rect(xDe - 2, yBox, 10, 5); if (year) doc.text(year, xDe - 1, yBox + 4);
    doc.text("Mes", xDe + 12, yBoxLabels); doc.rect(xDe + 10, yBox, 10, 5); if (month) doc.text(month, xDe + 11, yBox + 4);
    doc.text("Día", xDe + 24, yBoxLabels); doc.rect(xDe + 22, yBox, 10, 5); if (day) doc.text(day, xDe + 23, yBox + 4);

    // "a" Section
    doc.text("a", xDe + 36, cursorY + 8);
    const xA = xDe + 42;
    doc.text("Año", xA, yBoxLabels); doc.rect(xA - 2, yBox, 10, 5); if (year) doc.text(year, xA - 1, yBox + 4);
    doc.text("Mes", xA + 12, yBoxLabels); doc.rect(xA + 10, yBox, 10, 5); if (month) doc.text(month, xA + 11, yBox + 4);
    doc.text("Día", xA + 24, yBoxLabels); doc.rect(xA + 22, yBox, 10, 5); if (day) doc.text(day, xA + 23, yBox + 4);

    cursorY += hRow2;

    // Row 3: Área Temática (Clave/Nombre)
    drawField("Área temática del curso 2/", course.category || "6000 - Seguridad", margin, cursorY, contentWidth, 10);
    cursorY += 10;

    // Row 4: Agente Capacitador
    drawField("Nombre del agente capacitador o STPS 3/", course.defaultInstructor || "Instructor Interno", margin, cursorY, contentWidth, 10);
    cursorY += 10 + 6;

    // LEGAL TEXT
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Los datos se asientan en esta constancia bajo protesta de decir verdad, apercibidos de la responsabilidad en que incurre todo", pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 4;
    doc.text("aquel que no se conduce con verdad.", pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 8;

    // SIGNATURES
    // 3 columns
    // Instructor | Patron | Rep Trabajadores
    const colW = contentWidth / 3;
    const sigLineW = colW - 10;
    const sigY = cursorY + 25; // Space for signature

    doc.setFontSize(7);
    doc.setLineWidth(0.2);

    // 1. Instructor
    doc.line(margin + 5, sigY, margin + 5 + sigLineW, sigY);
    doc.text("Instructor o tutor", margin + (colW / 2), sigY - 20, { align: 'center' });
    doc.text("Nombre y firma", margin + (colW / 2), sigY + 4, { align: 'center' });
    // Put Name below
    if (course.defaultInstructor) {
        doc.setFontSize(8);
        doc.text(course.defaultInstructor, margin + (colW / 2), sigY - 2, { align: 'center' });
    }

    // 2. Patron
    const x2 = margin + colW;
    doc.line(x2 + 5, sigY, x2 + 5 + sigLineW, sigY);
    doc.text("Patrón o representante legal 4/", x2 + (colW / 2), sigY - 20, { align: 'center' });
    doc.text("Nombre y firma", x2 + (colW / 2), sigY + 4, { align: 'center' });

    // 3. Rep Trabajadores
    const x3 = margin + (colW * 2);
    doc.line(x3 + 5, sigY, x3 + 5 + sigLineW, sigY);
    doc.text("Representante de los trabajadores 5/", x3 + (colW / 2), sigY - 20, { align: 'center' });
    doc.text("Nombre y firma", x3 + (colW / 2), sigY + 4, { align: 'center' });

    cursorY = sigY + 15;

    // FOOTER / INSTRUCTIONS (Small text)
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    const instructions = [
        "INSTRUCCIONES",
        "- Llenar a máquina o con letra de molde.",
        "- Deberá entregarse al trabajador dentro de los veinte días hábiles siguientes al término del curso de capacitación aprobado.",
        "1/ Las áreas y subáreas ocupacionales del Catálogo Nacional de Ocupaciones se encuentran disponibles en el reverso de este formato y en la página www.stps.gob.mx",
        "2/ Las áreas temáticas de los cursos se encuentran disponibles en el reverso de este formato y en la página www.stps.gob.mx",
        "3/ Cursos impartidos por el área competente de la Secretaría del Trabajo y Previsión Social.",
        "4/ Para empresas con menos de 51 trabajadores. Para empresas con más de 50 trabajadores firmaría el representante del patrón ante la Comisión mixta de capacitación, adiestramiento y productividad.",
        "5/ Solo para empresas con más de 50 trabajadores.",
        "* Dato no obligatorio."
    ];

    instructions.forEach(line => {
        doc.text(line, margin, cursorY);
        cursorY += 2.5;
    });

    // DC-3 Label Bottom Right
    doc.setFontSize(8);
    doc.text("DC-3", pageWidth - margin, cursorY + 5, { align: 'right' });
    doc.text("ANVERSO", pageWidth - margin, cursorY + 9, { align: 'right' });

    doc.save(`DC3_${employee.name}_${course.name}.pdf`);
}
