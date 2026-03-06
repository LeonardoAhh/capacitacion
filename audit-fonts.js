#!/usr/bin/env node
/**
 * audit-fonts.js — ViñoPlastic / Vertx System
 * Detecta fuentes hardcodeadas en todo el proyecto.
 *
 * Uso:
 *   node audit-fonts.js
 *   node audit-fonts.js --fix   (muestra sugerencia de reemplazo)
 *
 * Coloca este archivo en la raíz del proyecto y corre:
 *   node audit-fonts.js
 */

const fs = require('fs');
const path = require('path');

/* ── Configuración ───────────────────────────────────────────────── */
const SEARCH_DIRS = ['src', 'app', 'components', 'styles', 'pages'];
const EXTENSIONS = ['.css', '.module.css', '.scss', '.jsx', '.tsx', '.js', '.ts'];
const SKIP_DIRS = ['node_modules', '.next', '.git', 'dist', 'build', 'out'];

/** Fuentes que NO deberían aparecer como strings literales en CSS/JSX */
const BAD_FONT_PATTERNS = [
    // Fuentes del sistema que deben venir via next/font
    /font-family\s*:\s*['"]?(Geist|Geist Mono|Instrument Serif|Playfair Display|Inter|Roboto|Arial|Helvetica)['"]?/gi,
    // @import de Google Fonts (debería estar solo en layout)
    /@import\s+url\(['"]https:\/\/fonts\.googleapis\.com/gi,
    // font() de next/font usada fuera de layout
    /from\s+['"]next\/font\/google['"]/gi,
];

/** Solo se permite en estos archivos */
const ALLOWED_FILES = [
    'layout.js',
    'layout.tsx',
    'layout.ts',
    'globals.css',
];

/* ── Colores ANSI ────────────────────────────────────────────────── */
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

/* ── Helpers ─────────────────────────────────────────────────────── */
function walkDir(dir, results = []) {
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.includes(entry.name)) walkDir(full, results);
        } else if (EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
            results.push(full);
        }
    }
    return results;
}

function isAllowedFile(filePath) {
    const base = path.basename(filePath);
    return ALLOWED_FILES.includes(base);
}

/* ── Main ────────────────────────────────────────────────────────── */
const cwd = process.cwd();
const files = SEARCH_DIRS.flatMap(d => walkDir(path.join(cwd, d)));

const violations = [];

for (const file of files) {
    if (isAllowedFile(file)) continue;

    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const relPath = path.relative(cwd, file);

    for (let i = 0; i < lines.length; i++) {
        for (const pattern of BAD_FONT_PATTERNS) {
            pattern.lastIndex = 0; // reset regex state
            if (pattern.test(lines[i])) {
                violations.push({
                    file: relPath,
                    line: i + 1,
                    content: lines[i].trim(),
                    pattern: pattern.source,
                });
            }
        }
    }
}

/* ── Output ─────────────────────────────────────────────────────── */
console.log('');
console.log(`${BOLD}${CYAN}╔══════════════════════════════════════════╗${RESET}`);
console.log(`${BOLD}${CYAN}║        FONT AUDIT — ViñoPlastic          ║${RESET}`);
console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════╝${RESET}`);
console.log('');
console.log(`${DIM}Archivos inspeccionados: ${files.length}${RESET}`);
console.log(`${DIM}Archivos permitidos (skip): ${ALLOWED_FILES.join(', ')}${RESET}`);
console.log('');

if (violations.length === 0) {
    console.log(`${GREEN}${BOLD}✓ Sin violaciones — tipografía correctamente centralizada.${RESET}`);
    console.log('');
    console.log(`${DIM}Todas las fuentes se cargan en layout.js y se consumen via tokens CSS.${RESET}`);
} else {
    console.log(`${RED}${BOLD}✗ ${violations.length} violación(es) encontrada(s):${RESET}`);
    console.log('');

    // Agrupar por archivo
    const byFile = violations.reduce((acc, v) => {
        if (!acc[v.file]) acc[v.file] = [];
        acc[v.file].push(v);
        return acc;
    }, {});

    for (const [file, issues] of Object.entries(byFile)) {
        console.log(`  ${YELLOW}${BOLD}${file}${RESET}`);
        for (const issue of issues) {
            console.log(`    ${DIM}línea ${issue.line}:${RESET} ${issue.content}`);
            console.log(`    ${DIM}→ Reemplaza font-family literal por var(--font-body), var(--font-serif) o var(--font-mono)${RESET}`);
            console.log(`    ${DIM}→ Elimina @import de Google Fonts — las fuentes van en layout.js${RESET}`);
            console.log('');
        }
    }

    console.log(`${YELLOW}${BOLD}Cómo corregir:${RESET}`);
    console.log(`  1. Elimina ${BOLD}@import url('https://fonts.googleapis.com/...')${RESET} de módulos CSS`);
    console.log(`  2. Elimina definiciones de ${BOLD}--font-serif/body/mono${RESET} locales en módulos`);
    console.log(`  3. Usa solo ${BOLD}var(--font-body)${RESET}, ${BOLD}var(--font-serif)${RESET}, ${BOLD}var(--font-mono)${RESET}`);
    console.log(`  4. Las fuentes se deben cargar ÚNICAMENTE en ${BOLD}src/app/layout.js${RESET}`);
    console.log('');

    process.exit(1); // útil en CI/CD
}