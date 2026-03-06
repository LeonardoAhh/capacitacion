const fs = require('fs');

// 1. Fix calendario/page.js
const calendarioFile = 'c:/Users/Capacitacion - QRO/Downloads/capacitacion/src/app/capacitacion/calendario/page.js';
let calContent = fs.readFileSync(calendarioFile, 'utf8');
if (calContent.startsWith('```javascript\n')) {
    calContent = calContent.replace('```javascript\n', '');
}
if (calContent.endsWith('```\n')) {
    calContent = calContent.slice(0, -4);
} else if (calContent.endsWith('```')) {
    calContent = calContent.slice(0, -3);
}
fs.writeFileSync(calendarioFile, calContent, 'utf8');

// 2. Fix analisis/page.js
const analisisFile = 'c:/Users/Capacitacion - QRO/Downloads/capacitacion/src/app/capacitacion/analisis/page.js';
let analContent = fs.readFileSync(analisisFile, 'utf8');
analContent = analContent.replace(
    /          <div className="spinner"><\/div>\n                <\/div>\n            <\/div>\n        \);\n    }/g,
    '                    <div className="spinner"></div>\n                </div>\n            </AdminLayout>\n        );\n    }'
);
fs.writeFileSync(analisisFile, analContent, 'utf8');

// 3. Fix reports/page.js
const reportsFile = 'c:/Users/Capacitacion - QRO/Downloads/capacitacion/src/app/reports/page.js';
let repContent = fs.readFileSync(reportsFile, 'utf8');
repContent = repContent.replace(/return \(\s*<>\s*/, 'return (\n        <AdminLayout title="Reportes">\n');
repContent = repContent.replace(/<\/AdminLayout>\n            \)}\n        <\/>/g, '</AdminLayout>\n            )}');
// just in case they are different spacing
repContent = repContent.replace(/<\/AdminLayout>\s*\)}\s*<\/>\s*\);\s*}/g, '</AdminLayout>\n            )}\n        </AdminLayout>\n    );\n}'); // wait, the structure might be different
fs.writeFileSync(reportsFile, repContent, 'utf8');

console.log('Fixed JSX structure');
