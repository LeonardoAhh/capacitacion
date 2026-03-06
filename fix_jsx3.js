const fs = require('fs');

// 1. Fix calendario/page.js
const calendarioFile = 'c:/Users/Capacitacion - QRO/Downloads/capacitacion/src/app/capacitacion/calendario/page.js';
let calContent = fs.readFileSync(calendarioFile, 'utf8');
calContent = calContent.replace(/^```javascript\r?\n/, '');
calContent = calContent.replace(/\r?\n```\r?\n?$/, '');
fs.writeFileSync(calendarioFile, calContent, 'utf8');

// 2. Fix analisis/page.js
const analisisFile = 'c:/Users/Capacitacion - QRO/Downloads/capacitacion/src/app/capacitacion/analisis/page.js';
let analContent = fs.readFileSync(analisisFile, 'utf8');
analContent = analContent.replace(/<div className="spinner"><\/div>\r?\n\s*<\/div>\r?\n\s*<\/div>\r?\n\s*\);\r?\n\s*}/, '<div className="spinner"></div>\n                </div>\n            </AdminLayout>\n        );\n    }');
fs.writeFileSync(analisisFile, analContent, 'utf8');

// 3. Fix reports/page.js
const reportsFile = 'c:/Users/Capacitacion - QRO/Downloads/capacitacion/src/app/reports/page.js';
let repContent = fs.readFileSync(reportsFile, 'utf8');
repContent = repContent.replace(/<\/div>\r?\n\s*<\/div>\r?\n\s*<\/AdminLayout>\r?\n\s*\)}\r?\n\s*<\/AdminLayout>/, '</div>\n                    </div>\n                </div>\n            )}\n        </AdminLayout>');
fs.writeFileSync(reportsFile, repContent, 'utf8');

console.log('Fixed ALL JSX errors');
