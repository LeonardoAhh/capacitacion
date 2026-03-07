function safeFormatDate(dateStr) {
    if (!dateStr) return '—';
    
    // Try standard parsing
    let d = new Date(dateStr);
    
    // If invalid, try DD/MM/YYYY
    if (isNaN(d.getTime()) && typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`);
        }
    }
    
    if (isNaN(d.getTime())) {
        return dateStr; // Return raw string if nothing works
    }
    
    return d.toLocaleDateString('es-MX', { timeZone: 'UTC' });
}

export function generateTrainingReportHTML(employee, trainingStats, complianceValue) {
    const now = new Date().toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const rowsApproved = trainingStats.approved.map(c => `
        <tr>
            <td>${c.name || '—'}</td>
            <td class="score approved">${c.score}%</td>
            <td>${safeFormatDate(c.date)}</td>
            <td><span class="badge badge-green">Aprobado</span></td>
        </tr>`).join('');

    const rowsFailed = trainingStats.failed.map(c => `
        <tr>
            <td>${c.name || '—'}</td>
            <td class="score failed">${c.score}%</td>
            <td>${safeFormatDate(c.date)}</td>
            <td><span class="badge badge-red">Reprobado</span></td>
        </tr>`).join('');

    const rowsPending = trainingStats.pending.map(c => `
        <tr>
            <td>${typeof c === 'string' ? c : c.name || '—'}</td>
            <td class="score pending">—</td>
            <td>—</td>
            <td><span class="badge badge-yellow">Pendiente</span></td>
        </tr>`).join('');

    return `
<div class="report-page">
<header>
  <div class="emp-info">
    <div class="logo">ViñaPlastic — Capacitación</div>
    <h1 style="margin-top:8px">${employee?.name || 'N/A'}</h1>
    <p>ID: ${employee?.employeeId || employee?.id || '—'} &nbsp;|&nbsp; Puesto: ${employee?.position || '—'}</p>
    <p>Área: ${employee?.area || '—'} &nbsp;|&nbsp; Turno: ${employee?.shift || '—'}</p>
  </div>
  <div class="meta">
    <div>Reporte de Capacitación</div>
    <div style="margin-top:4px">${now}</div>
  </div>
</header>

<div class="stats">
  <div class="stat green"><div class="num">${trainingStats.approved.length}</div><div class="lbl">Aprobados</div></div>
  <div class="stat red">  <div class="num">${trainingStats.failed.length}</div><div class="lbl">Reprobados</div></div>
  <div class="stat yellow"><div class="num">${trainingStats.pending.length}</div><div class="lbl">Pendientes</div></div>
  <div class="stat purple"><div class="num">${complianceValue}%</div><div class="lbl">Cumplimiento</div></div>
</div>

${rowsApproved ? `<h3>✅ Cursos Aprobados</h3>
<table><thead><tr><th>Curso</th><th>Calificación</th><th>Fecha</th><th>Estado</th></tr></thead>
<tbody>${rowsApproved}</tbody></table>` : ''}

${rowsFailed ? `<h3>❌ Cursos Reprobados</h3>
<table><thead><tr><th>Curso</th><th>Calificación</th><th>Fecha</th><th>Estado</th></tr></thead>
<tbody>${rowsFailed}</tbody></table>` : ''}

${rowsPending ? `<h3>⏳ Cursos Pendientes</h3>
<table><thead><tr><th>Curso</th><th>Calificación</th><th>Fecha</th><th>Estado</th></tr></thead>
<tbody>${rowsPending}</tbody></table>` : ''}

<footer>Documento Interno Capacitación — ${now}</footer>
</div>`;
}

export function generateFullReportHTML(reportPagesHTML) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Reporte Grupal de Capacitación</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; }
  .report-page { padding: 32px; page-break-after: always; }
  .report-page:last-child { page-break-after: auto; }
  header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
  .logo { font-size: 1.4rem; font-weight: 800; color: #3b82f6; letter-spacing: -0.5px; }
  .emp-info h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 4px; }
  .emp-info p { font-size: 0.9rem; color: #64748b; }
  .meta { text-align: right; font-size: 0.85rem; color: #64748b; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .stat { padding: 16px; border-radius: 10px; text-align: center; }
  .stat .num { font-size: 2rem; font-weight: 800; }
  .stat .lbl { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
  .green { background: #f0fdf4; } .green .num { color: #16a34a; } .green .lbl { color: #16a34a; }
  .red   { background: #fef2f2; } .red .num { color: #dc2626; }   .red .lbl { color: #dc2626; }
  .yellow{ background: #fffbeb; } .yellow .num { color: #d97706; } .yellow .lbl { color: #d97706; }
  .purple{ background: #f5f3ff; } .purple .num { color: #7c3aed; } .purple .lbl { color: #7c3aed; }
  h3 { font-size: 1rem; font-weight: 700; margin: 20px 0 10px; display: flex; align-items: center; gap: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 0.875rem; }
  th { background: #f8fafc; padding: 10px 14px; text-align: left; font-weight: 600; color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
  tr:last-child td { border-bottom: none; }
  .score { font-weight: 700; }
  .approved { color: #16a34a; } .failed { color: #dc2626; } .pending { color: #d97706; }
  .badge { padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-red   { background: #fee2e2; color: #dc2626; }
  .badge-yellow{ background: #fef9c3; color: #d97706; }
  footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 0.8rem; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; } .report-page { padding: 16px; page-break-after: always; } .report-page:last-child { page-break-after: auto; } }
</style>
</head>
<body>
${reportPagesHTML}
</body></html>`;
}
