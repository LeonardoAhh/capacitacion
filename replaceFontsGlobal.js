const fs = require('fs');
const files = [
    'src/app/induccion/page.module.css',
    'src/components/features/Induccion/Sidebar/InduccionSidebar.module.css'
];

files.forEach(file => {
    let c = fs.readFileSync(file, 'utf8');
    c = c.replace(/^[ \t]*font-family:[ \t]*.*$/gm, '');
    c = c.replace(/^[ \t]*font-style:[ \t]*italic;[ \t]*\r?\n/gm, '');
    fs.writeFileSync(file, c);
    console.log(`Fonts cleaned in ${file}`);
});
