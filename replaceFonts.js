const fs = require('fs');
const file = 'src/app/induccion/page.module.css';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/^[ \t]*font-family:[ \t]*var\(--font-(serif|mono)\);[ \t]*\r?\n/gm, '');
c = c.replace(/^[ \t]*font-style:[ \t]*italic;[ \t]*\r?\n/gm, '');
fs.writeFileSync(file, c);
console.log('Fonts cleaned successfully in page.module.css');
