const fs = require('fs');
const path = 'src/app/capacitacion/promociones/page.js';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
lines.splice(67, 322);
fs.writeFileSync(path, lines.join('\n'));
console.log('Removed 322 lines from page.js');
