const fs = require('fs');
const file = './src/app/employees/new/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');

fs.writeFileSync(file, content, 'utf8');
console.log("Template literals fixed in new/page.js");
