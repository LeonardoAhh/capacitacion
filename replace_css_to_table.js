const fs = require('fs');
const file = './src/app/employees/page.module.css';
let css = fs.readFileSync(file, 'utf8');

// Eliminar bloques antiguos del grid 
// (usamos un regex cuidadoso que asume que terminan antes de PAGINATION)
const cssLines = css.split('\n');
let newCssLines = [];
let skipMode = false;

for (let i = 0; i < cssLines.length; i++) {
    const line = cssLines[i];
    if (line.includes('/* === EMPLOYEE GRID === */')) {
        skipMode = true;
    }
    if (skipMode && line.includes('/* === PAGINATION === */')) {
        skipMode = false;
        
        // Insert table styles right before pagination
        newCssLines.push('/* === DATA TABLE === */');
        newCssLines.push('.tableContainer {');
        newCssLines.push('    background: rgba(255, 255, 255, 0.6);');
        newCssLines.push('    backdrop-filter: blur(20px);');
        newCssLines.push('    -webkit-backdrop-filter: blur(20px);');
        newCssLines.push('    border-radius: 20px;');
        newCssLines.push('    padding: 0;');
        newCssLines.push('    border: 1px solid rgba(255, 255, 255, 0.4);');
        newCssLines.push('    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);');
        newCssLines.push('    overflow: hidden;');
        newCssLines.push('    margin-bottom: 32px;');
        newCssLines.push('    overflow-x: auto;');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.dataTable {');
        newCssLines.push('    width: 100%;');
        newCssLines.push('    border-collapse: collapse;');
        newCssLines.push('    min-width: 800px;');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.dataTable thead {');
        newCssLines.push('    background: rgba(240, 244, 248, 0.5);');
        newCssLines.push('    border-bottom: 1px solid var(--border-color);');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.dataTable th {');
        newCssLines.push('    text-align: left;');
        newCssLines.push('    padding: 16px 24px;');
        newCssLines.push('    font-size: 12px;');
        newCssLines.push('    font-weight: 600;');
        newCssLines.push('    color: var(--text-secondary);');
        newCssLines.push('    text-transform: uppercase;');
        newCssLines.push('    letter-spacing: 0.5px;');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.tableRow {');
        newCssLines.push('    border-bottom: 1px solid rgba(0,0,0,0.04);');
        newCssLines.push('    transition: all 0.2s ease;');
        newCssLines.push('    cursor: pointer;');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.tableRow:hover {');
        newCssLines.push('    background: #fafaf8;');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.dataTable td {');
        newCssLines.push('    padding: 16px 24px;');
        newCssLines.push('    vertical-align: middle;');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.cellEmployee {');
        newCssLines.push('    display: flex;');
        newCssLines.push('    align-items: center;');
        newCssLines.push('    gap: 16px;');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.tableAvatar {');
        newCssLines.push('    width: 40px;');
        newCssLines.push('    height: 40px;');
        newCssLines.push('    border-radius: 10px;');
        newCssLines.push('    background: rgba(0, 122, 255, 0.1);');
        newCssLines.push('    color: var(--blue-500);');
        newCssLines.push('    display: flex;');
        newCssLines.push('    align-items: center;');
        newCssLines.push('    justify-content: center;');
        newCssLines.push('    font-weight: 700;');
        newCssLines.push('    font-size: 14px;');
        newCssLines.push('    overflow: hidden;');
        newCssLines.push('    flex-shrink: 0;');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.tableAvatar img {');
        newCssLines.push('    width: 100%;');
        newCssLines.push('    height: 100%;');
        newCssLines.push('    object-fit: cover;');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.employeeBasicInfo {');
        newCssLines.push('    display: flex;');
        newCssLines.push('    flex-direction: column;');
        newCssLines.push('    gap: 2px;');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.rowName {');
        newCssLines.push('    font-size: 15px;');
        newCssLines.push('    font-weight: 600;');
        newCssLines.push('    color: var(--text-primary);');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.candidateBadgeMini {');
        newCssLines.push('    font-size: 10px;');
        newCssLines.push('    font-weight: 700;');
        newCssLines.push('    color: var(--color-primary);');
        newCssLines.push('    text-transform: uppercase;');
        newCssLines.push('    letter-spacing: 0.5px;');
        newCssLines.push('    background: rgba(245, 158, 11, 0.15); /* amber */');
        newCssLines.push('    padding: 2px 6px;');
        newCssLines.push('    border-radius: 6px;');
        newCssLines.push('    width: max-content;');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.cellId {');
        newCssLines.push('    font-family: var(--font-mono);');
        newCssLines.push('    font-size: 13px;');
        newCssLines.push('    color: var(--text-tertiary);');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.cellPosition {');
        newCssLines.push('    display: flex;');
        newCssLines.push('    flex-direction: column;');
        newCssLines.push('    gap: 2px;');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.rowPosition {');
        newCssLines.push('    font-size: 14px;');
        newCssLines.push('    font-weight: 500;');
        newCssLines.push('    color: var(--text-primary);');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.rowDepartment {');
        newCssLines.push('    font-size: 12px;');
        newCssLines.push('    color: var(--text-secondary);');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.statusBadge {');
        newCssLines.push('    padding: 4px 12px;');
        newCssLines.push('    border-radius: 20px;');
        newCssLines.push('    font-size: 11px;');
        newCssLines.push('    font-weight: 600;');
        newCssLines.push('    text-transform: uppercase;');
        newCssLines.push('    letter-spacing: 0.5px;');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.statusActive {');
        newCssLines.push('    background: rgba(52, 199, 89, 0.15);');
        newCssLines.push('    color: var(--color-success);');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.statusInactive {');
        newCssLines.push('    background: rgba(255, 59, 48, 0.15);');
        newCssLines.push('    color: var(--color-danger);');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.cellActions {');
        newCssLines.push('    text-align: right;');
        newCssLines.push('    color: var(--text-tertiary);');
        newCssLines.push('}');
        newCssLines.push('');
        newCssLines.push('.tableRow:hover .cellActions {');
        newCssLines.push('    color: var(--blue-500);');
        newCssLines.push('}');
        newCssLines.push('');

    }
    
    // Status Badge classes have been redefined up above to prevent conflicts, 
    // so we also need to avoid letting them re-render if they existed alone before.
    if (!skipMode) {
        newCssLines.push(line);
    }
}

// Write the result back
fs.writeFileSync(file, newCssLines.join('\n'));
console.log('Grid styles replaced with Data Table styles.');
