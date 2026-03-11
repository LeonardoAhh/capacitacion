const fs = require('fs');
const path = './src/app/employees/page.module.css';
let css = fs.readFileSync(path, 'utf8');

// Remove dark theme blocks
css = css.replace(/\[data-theme="dark"\].*?\{[^}]*\}/gs, '');

// Replace specific colors
const replacements = [
  // Primary (Blues and Purples) -> var(--blue-500)
  ['#667eea', 'var(--blue-500)'],
  ['#764ba2', 'var(--blue-500)'],
  ['102, 126, 234', '0, 122, 255'],
  ['118, 75, 162', '0, 122, 255'],
  
  // Grays / Texts
  ['#1a202c', 'var(--text-primary)'],
  ['#2d3748', 'var(--text-primary)'],
  ['#4a5568', 'var(--text-secondary)'],
  ['#718096', 'var(--text-tertiary)'],
  ['#a0aec0', 'var(--text-tertiary)'],
  ['#cbd5e0', 'var(--border-color)'],
  ['#e2e8f0', 'var(--border-color)'],
  
  // Success
  ['#34C759', 'var(--color-success)'],
  ['#22543d', 'var(--color-success)'],
  ['#c6f6d5', 'rgba(52,199,89,0.2)'],
  
  // Danger
  ['#FF3B30', 'var(--color-danger)'],
  ['#e53e3e', 'var(--color-danger)'],
  ['#c53030', 'var(--color-danger)'],
  ['#f56565', 'var(--color-danger)'],
  ['#fc8181', 'var(--color-danger)'],
  ['255, 59, 48', '255, 59, 48'], // Danger rgb
  ['252, 129, 129', '255, 59, 48'],
  ['245, 101, 101', '255, 59, 48'],
  
  // Info/Candidates
  ['#2c5282', 'var(--color-info)'],
  ['#3182ce', 'var(--color-info)'],
  ['66, 153, 225', '0, 122, 255'], // blue rgb
];

replacements.forEach(([from, to]) => {
  css = css.split(from).join(to);
});

// Remove unused blob code and animations
css = css.replace(/\.bgDecoration\s*\{[^}]*\}/gs, '')
         .replace(/\.blob\d*\s*\{[^}]*\}/gs, '')
         .replace(/@keyframes\s+float\s*\{.*?\}/gs, '');

// Append new styles for mobile view + badge
css += `

/* === NUEVOS ESTILOS === */
.mobileFab {
    display: none;
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--blue-500);
    color: white;
    border: none;
    box-shadow: 0 4px 16px rgba(0, 122, 255, 0.4);
    align-items: center;
    justify-content: center;
    z-index: 100;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.mobileFab:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 122, 255, 0.5);
}

.candidateBadge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: rgba(0, 122, 255, 0.15);
    color: var(--blue-500);
}

@media (max-width: 768px) {
    .mobileFab {
        display: flex;
    }
}
`;

fs.writeFileSync(path, css);
console.log('CSS cleaned and updated successfully.');
