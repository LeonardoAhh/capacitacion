const fs = require('fs');
const file = 'c:/Users/Capacitacion - QRO/Downloads/capacitacion/src/app/reports/page.js';
let content = fs.readFileSync(file, 'utf8');

// The problematic byte is \u0081 inside the property previously named "ÁREA" which became "Ã REA" + \x81
// We also have "Ã³", "Ã“", etc. Let's fix them in reports/page.js

content = content.replace(/\u0081/g, ''); // Remove the invalid control character \x81
content = content.replace(/Ã REA/g, 'AREA');
content = content.replace(/Ã REA/g, 'AREA');
content = content.replace(/Ã³/g, 'o');
content = content.replace(/Ã“/g, 'O');
content = content.replace(/Ã­/g, 'i');
content = content.replace(/Ã¡/g, 'a');
content = content.replace(/Ã±/g, 'n');
content = content.replace(/Ãº/g, 'u');
content = content.replace(/Ã©/g, 'e');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed reports/page.js');
