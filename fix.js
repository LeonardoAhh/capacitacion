const fs = require('fs');
const file = './src/app/employees/page.module.css';
let css = fs.readFileSync(file, 'utf8');

const regex = /([^}]*)100%\s*\{\s*transform:\s*translate\(30px,\s*30px\)\s*rotate\(5deg\);\s*\}\s*\}/gs;
css = css.replace(regex, '');

fs.writeFileSync(file, css);
console.log('Fixed');
