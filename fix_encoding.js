const fs = require('fs');
const file = './src/app/employees/page.js';
let content = fs.readFileSync(file, 'utf8');

// The strange characters are usually due to double utf8 encoding or ISO-8859 misinterpretation.
content = content.replace(/dÃ­as/g, 'días');
content = content.replace(/d\u00C3\u00ADas/g, 'días');
content = content.replace(/d\xC3\xADas/g, 'días');

fs.writeFileSync(file, content, 'utf8');
console.log('Encoding issues fixed in page.js');
