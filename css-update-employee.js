const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'app', 'capacitacion', 'promociones', 'components', 'EmployeeCard.module.css');
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(
    /(\.employeeCard \{)([\s\S]*?)(\})/,
    `.employeeCard {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
}`
);

css = css.replace(
    /(\[data-theme="dark"\] \.employeeCard \{)([\s\S]*?)(\})/,
    `[data-theme="dark"] .employeeCard {
    background: rgba(30, 30, 35, 0.45);
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
}`
);

css = css.replace(
    /(\.employeeCard:hover \{)([\s\S]*?)(\})/,
    `.employeeCard:hover {
    border-color: rgba(139, 92, 246, 0.4);
    transform: translateY(-4px);
    box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
}`
);

// Agregar hover oscuro si no existe
if (!css.includes('[data-theme="dark"] .employeeCard:hover')) {
    css = css.replace(
        '.employeeCard.expanded {',
        `[data-theme="dark"] .employeeCard:hover {\n    box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);\n}\n\n.employeeCard.expanded {`
    );
}

// Estilizar .cardHeader hover
css = css.replace(
    /(\.cardHeader:hover \{)([\s\S]*?)(\})/,
    `.cardHeader:hover {\n    background: rgba(255, 255, 255, 0.4);\n}`
);

css = css.replace(
    /(\[data-theme="dark"\] \.cardHeader:hover \{)([\s\S]*?)(\})/,
    `[data-theme="dark"] .cardHeader:hover {\n    background: rgba(255, 255, 255, 0.06);\n}`
);

// Destacar empName y arrancar margins
css = css.replace(
    /(\.empName \{)([\s\S]*?)(\})/,
    `.empName {\n    font-weight: 800;\n    color: var(--text-primary);\n    font-size: 1.1rem;\n    letter-spacing: -0.3px;\n}`
);

// En status pills, usar box-shadow
css = css.replace(
    /(\.criteriaCount \{)([\s\S]*?)(\})/,
    `.criteriaCount {\n    font-size: 0.85rem;\n    color: var(--text-secondary);\n    font-weight: 700;\n    padding: 8px 14px;\n    background: rgba(255,255,255,0.4);\n    border-radius: 12px;\n    border: 1px solid rgba(255,255,255,0.3);\n}`
);
css = css.replace(
    /(\[data-theme="dark"\] \.criteriaCount \{)([\s\S]*?)(\})/,
    `[data-theme="dark"] .criteriaCount {\n    background: rgba(40,40,45, 0.6);\n    border-color: rgba(255,255,255,0.06);\n}`
);

// Hacer las cardBody expandirse mas elegante
css = css.replace(
    /(\.cardBody \{)([\s\S]*?)(\})/,
    `.cardBody {\n    border-top: 1px solid var(--border-color);\n    padding: var(--spacing-lg);\n    background: var(--bg-secondary);\n    animation: slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1);\n}`
);

// detailBox "tarjeta flotante"
css = css.replace(
    /(\.detailBox \{)([\s\S]*?)(\})/,
    `.detailBox {\n    background: rgba(255, 255, 255, 0.2);\n    border: 1px solid rgba(255, 255, 255, 0.4);\n    border-radius: 16px;\n    padding: var(--spacing-lg);\n    box-shadow: inset 0 2px 4px rgba(255,255,255,0.3);\n}`
);
css = css.replace(
    /(\[data-theme="dark"\] \.detailBox \{)([\s\S]*?)(\})/,
    `[data-theme="dark"] .detailBox {\n    background: rgba(20, 20, 25, 0.4);\n    border-color: rgba(255, 255, 255, 0.05);\n    box-shadow: inset 0 1px 1px rgba(255,255,255,0.02);\n}`
);


fs.writeFileSync(cssPath, css, 'utf8');
console.log('CSS actualizado exitosamente a traves de script Regex.');
