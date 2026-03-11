const fs = require('fs');
const file = './src/app/employees/TABS_STYLES.css';
let css = fs.readFileSync(file, 'utf8');

// Eliminar bloques dark theme
css = css.replace(/\[data-theme="dark"\].*?\{[^}]*\}/gs, '');

// Reemplazar colores por variables del proyecto
const replacements = [
  ['#007AFF', 'var(--blue-500)'],
  ['0, 122, 255', '0, 122, 255'],    // rgba de blue-500
  ['#FF3B30', 'var(--color-danger)'],
  ['255, 59, 48', '255, 59, 48']     // rgba de danger
];

replacements.forEach(([from, to]) => {
  css = css.split(from).join(to);
});

fs.writeFileSync(file, css);
console.log('TABS_STYLES.css fixed');
