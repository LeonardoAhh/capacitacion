const fs = require('fs');
const file = './src/app/employees/page.module.css';

// Leer como buffer para lidiar con el string malformado
const buffer = fs.readFileSync(file);
let css = buffer.toString('utf8');

// Eliminar todos los caracteres nulos (\x00) que introduce powershell en archivos utf-16 convertidos mal
css = css.replace(/\0/g, '');

// Volver a hacer la RegExp
css = css.replace(/\.searchInner[\s\S]*$/gi, '');
css += '\n.searchInner { flex: 1; width: 100%; }\n';

fs.writeFileSync(file, css, 'utf8');
console.log('UTF-16 Null bytes cleaned from CSS end');
