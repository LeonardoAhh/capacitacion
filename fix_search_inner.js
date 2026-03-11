const fs = require('fs');
const file = './src/app/employees/page.module.css';
let css = fs.readFileSync(file, 'utf8');

// Eliminar el texto corrupto insertado por powershell al final del archivo
css = css.replace(/\.\s?s\s?e\s?a\s?r\s?c\s?h\s?I\s?n\s?n\s?e\s?r[\s\S]*$/gi, '');

// Insertar de manera limpia en utf8
css += '\n.searchInner { flex: 1; width: 100%; }\n';

fs.writeFileSync(file, css);
console.log('Fixed searchInner encoding');
