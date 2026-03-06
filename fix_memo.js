const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Capacitacion - QRO/Downloads/capacitacion/src/components/features/Courses/slides';

fs.readdirSync(dir).filter(f => f.endsWith('Slide.js')).forEach(f => {
    const p = path.join(dir, f);
    let content = fs.readFileSync(p, 'utf8');

    // Agregar import React si no existe
    if (!content.includes('import React')) {
        content = "import React from 'react';\n" + content;
    }

    // Reemplazar export default function
    content = content.replace(/export default function (\w+)/g, 'const $1 = React.memo(function $1');

    // Reemplazar ultima llave
    const match = content.match(/const (\w+) = React\.memo/);
    if (match) {
        const name = match[1];
        // Remplazar el final del archivo
        content = content.replace(/\}([\s\n]*)$/, '});\n\nexport default ' + name + ';\n');
        fs.writeFileSync(p, content);
        console.log(`Optimized ${f}`);
    }
});
