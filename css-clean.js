const fs = require('fs');
const basePath = 'src/app/capacitacion/promociones/';
const sourceFile = basePath + 'page.module.css';

let content = fs.readFileSync(sourceFile, 'utf8');

function removeSection(startHeader, endHeader) {
    const startIndex = content.indexOf(startHeader);
    let endIndex = endHeader ? content.indexOf(endHeader, startIndex) : content.length;
    if (startIndex !== -1) {
        content = content.substring(0, startIndex) + content.substring(endIndex);
    }
}

removeSection('/* ==================== EMPLOYEE LIST ==================== */', '/* ==================== EMPTY STATE ==================== */');
removeSection('/* ==================== FILTERS ==================== */', '/* ==================== EMPLOYEE LIST ==================== */');
removeSection('/* ==================== VIEW TOGGLE ==================== */', '/* ==================== TABLE VIEW ==================== */');
removeSection('/* ==================== RULES MODAL ==================== */', '/* ==================== VIEW TOGGLE ==================== */');

fs.writeFileSync(sourceFile, content);
console.log('Cleaned page.module.css');
