const fs = require('fs');
const basePath = 'src/app/capacitacion/promociones/';
const sourceFile = basePath + 'page.module.css';

const content = fs.readFileSync(sourceFile, 'utf8');

// Use regex to extract sections
// We will look for section headers like /* ==================== EMPLOYEE LIST ==================== */

function extractSection(startHeader, endHeader) {
    const startIndex = content.indexOf(startHeader);
    let endIndex = endHeader ? content.indexOf(endHeader, startIndex) : content.length;
    if (startIndex === -1) return '';
    return content.substring(startIndex, endIndex).trim();
}

const employeeListCSS = extractSection('/* ==================== EMPLOYEE LIST ==================== */', '/* ==================== EMPTY STATE ==================== */');
const filtersCSS = extractSection('/* ==================== FILTERS ==================== */', '/* ==================== EMPLOYEE LIST ==================== */');
const viewToggleCSS = extractSection('/* ==================== VIEW TOGGLE ==================== */', '/* ==================== TABLE VIEW ==================== */');
const rulesModalCSS = extractSection('/* ==================== RULES MODAL ==================== */', '/* ==================== VIEW TOGGLE ==================== */');

// Create the unified CSS for components
fs.writeFileSync(basePath + 'components/EmployeeCard.module.css', employeeListCSS + '\n');
fs.writeFileSync(basePath + 'components/FiltersBar.module.css', filtersCSS + '\n\n' + viewToggleCSS + '\n');
fs.writeFileSync(basePath + 'components/RulesModal.module.css', rulesModalCSS + '\n');

console.log('CSS Extracted Successfully!');
