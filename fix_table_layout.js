const fs = require('fs');
const pageFile = './src/app/employees/page.js';
let content = fs.readFileSync(pageFile, 'utf8');

// 1. Reemplazamos encabezados de tabla
const regexHeaders = /<thead>[\s\S]*?<\/thead>/;
const newHeaders = `<thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Foto</th>
                                                    <th>Empleado</th>
                                                    <th>Puesto</th>
                                                    <th>Departamento</th>
                                                    <th>Estatus</th>
                                                    <th></th>
                                                </tr>
                                            </thead>`;
content = content.replace(regexHeaders, newHeaders);

// 2. Reemplazamos las columnas correspondientes en cada fila <tr> dentro de map
const regexBodyPattern = /<td className=\{styles\.cellEmployee\}>[\s\S]*?<td className=\{styles\.cellActions\}>/;

// Solo hay un map que renderiza la fila, podemos usar replace general (como solo hay 1 list view activo en la pagina)
content = content.replace(regexBodyPattern, `<td className={styles.cellId}>
                                                            <span className={styles.rowId}>{emp.employeeId || emp.id}</span>
                                                        </td>
                                                        <td className={styles.cellAvatar}>
                                                            <div className={styles.tableAvatar}>
                                                                {emp.photoUrl ? (
                                                                    <Image
                                                                        src={emp.photoUrl}
                                                                        alt={\`Foto de \${emp.name}\`}
                                                                        width={40}
                                                                        height={40}
                                                                        unoptimized
                                                                        onError={(e) => handleImageError(e, emp.name)}
                                                                    />
                                                                ) : (
                                                                    <span aria-hidden="true">{getInitials(emp.name)}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className={styles.cellName}>
                                                            <div className={styles.employeeBasicInfo}>
                                                                <span className={styles.rowName}>{emp.name}</span>
                                                                {emp.isCandidato && (
                                                                    <span className={styles.candidateBadgeMini}>Candidato</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className={styles.cellPosition}>
                                                            <span className={styles.rowPosition}>{emp.position || 'Sin puesto'}</span>
                                                        </td>
                                                        <td className={styles.cellDepartment}>
                                                            {emp.department && <span className={styles.rowDepartment}>{emp.department}</span>}
                                                        </td>
                                                        <td className={styles.cellStatus}>
                                                            <span className={\`\${styles.statusBadge} \${emp.status === 'Inactivo' ? styles.statusInactive : styles.statusActive}\`}>
                                                                {emp.status || 'Activo'}
                                                            </span>
                                                        </td>
                                                        <td className={styles.cellActions}>`);

fs.writeFileSync(pageFile, content, 'utf8');

// Ahora actualizamos page.module.css para añadir las nuevas clases necesarias si no existieran (cellName, cellAvatar, etc)
const cssFile = './src/app/employees/page.module.css';
let cssContent = fs.readFileSync(cssFile, 'utf8');
cssContent += `
.cellAvatar { width: 60px; text-align: center; }
.cellName { font-weight: 500; }
.cellDepartment { color: var(--text-secondary); font-size: 13px; font-weight: 500; }
`;
fs.writeFileSync(cssFile, cssContent, 'utf8');
console.log('Done');
