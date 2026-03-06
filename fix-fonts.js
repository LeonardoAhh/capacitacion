#!/usr/bin/env node
/**
 * fix-fonts.js — ViñoPlastic / Vertx System
 * ─────────────────────────────────────────────────────────────────
 * Qué hace EXACTAMENTE:
 *   1. Elimina @import url('https://fonts.googleapis.com/...') de
 *      módulos CSS (excepto globals.css)
 *   2. Elimina las 3 líneas de redefinición local de tokens de fuente:
 *        --font-serif: '...'
 *        --font-body:  '...'
 *        --font-mono:  '...'
 *      en módulos CSS (excepto globals.css)
 *   3. Reemplaza font-family strings literales por tokens:
 *        'Geist', ...           → var(--font-body)
 *        'Geist Mono', ...      → var(--font-mono)
 *        'Instrument Serif', ...→ var(--font-serif)
 *        'Playfair Display', ...→ var(--font-serif)
 *        'Inter', ...           → var(--font-body)
 *
 * Qué NO toca:
 *   - globals.css  (fuente de verdad de los tokens)
 *   - layout.js / layout.tsx  (donde viven los next/font imports)
 *   - Colores, espaciados, bordes, sombras, z-index, etc.
 *   - Nada fuera de propiedades font-family y @import de fonts
 *
 * Uso:
 *   node fix-fonts.js          → dry run (solo muestra qué cambiaría)
 *   node fix-fonts.js --apply  → aplica los cambios
 *   node fix-fonts.js --apply --verbose → aplica + muestra cada línea
 * ─────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');

/* ── CLI flags ──────────────────────────────────────────────────── */
const APPLY = process.argv.includes('--apply');
const VERBOSE = process.argv.includes('--verbose');

/* ── Configuración ───────────────────────────────────────────────── */
const SEARCH_DIRS = ['src', 'app', 'components', 'styles', 'pages'];
const EXTENSIONS = ['.css', '.module.css', '.scss'];
const SKIP_DIRS = ['node_modules', '.next', '.git', 'dist', 'build', 'out'];

/** Archivos que NO se tocan nunca */
const PROTECTED = [
    'globals.css',
    'layout.js',
    'layout.tsx',
    'layout.ts',
];

/* ── Reglas de transformación ────────────────────────────────────
   Cada regla: { match: RegExp, replace: string|fn, description }
   Se aplican línea por línea.
   ──────────────────────────────────────────────────────────────── */
const RULES = [
    // ① Eliminar @import de Google Fonts
    {
        match: /^.*@import\s+url\(['"]https:\/\/fonts\.googleapis\.com[^)]+\)['"]\s*;.*$/,
        replace: '/* [fix-fonts] @import eliminado — fuentes cargadas en layout.js */',
        description: 'Elimina @import Google Fonts',
    },

    // ② Eliminar redefinición local de token --font-serif
    {
        match: /^(\s*)--font-serif\s*:\s*['"][^'"]+['"][^;]*;/,
        replace: (_, indent) =>
            `${indent}/* [fix-fonts] --font-serif viene de globals.css */`,
        description: 'Elimina --font-serif local',
    },

    // ③ Eliminar redefinición local de token --font-body
    {
        match: /^(\s*)--font-body\s*:\s*['"][^'"]+['"][^;]*;/,
        replace: (_, indent) =>
            `${indent}/* [fix-fonts] --font-body viene de globals.css */`,
        description: 'Elimina --font-body local',
    },

    // ④ Eliminar redefinición local de token --font-mono
    {
        match: /^(\s*)--font-mono\s*:\s*['"][^'"]+['"][^;]*;/,
        replace: (_, indent) =>
            `${indent}/* [fix-fonts] --font-mono viene de globals.css */`,
        description: 'Elimina --font-mono local',
    },

    // ⑤ font-family: 'Geist', ... → var(--font-body)
    {
        match: /font-family\s*:\s*['"]Geist['"][^;]*;/,
        replace: 'font-family: var(--font-body);',
        description: "Reemplaza 'Geist' por var(--font-body)",
    },

    // ⑥ font-family: 'Geist Mono', ... → var(--font-mono)
    {
        match: /font-family\s*:\s*['"]Geist Mono['"][^;]*;/,
        replace: 'font-family: var(--font-mono);',
        description: "Reemplaza 'Geist Mono' por var(--font-mono)",
    },

    // ⑦ font-family: 'Instrument Serif', ... → var(--font-serif)
    {
        match: /font-family\s*:\s*['"]Instrument Serif['"][^;]*;/,
        replace: 'font-family: var(--font-serif);',
        description: "Reemplaza 'Instrument Serif' por var(--font-serif)",
    },

    // ⑧ font-family: 'Playfair Display', ... → var(--font-serif)
    {
        match: /font-family\s*:\s*['"]Playfair Display['"][^;]*;/,
        replace: 'font-family: var(--font-serif);',
        description: "Reemplaza 'Playfair Display' por var(--font-serif)",
    },

    // ⑨ font-family: 'Inter', ... → var(--font-body)
    {
        match: /font-family\s*:\s*['"]Inter['"][^;]*;/,
        replace: 'font-family: var(--font-body);',
        description: "Reemplaza 'Inter' por var(--font-body)",
    },

    // ⑩ font-family: Inter, ... (sin comillas) → var(--font-body)
    {
        match: /font-family\s*:\s*Inter[^;]*;/,
        replace: 'font-family: var(--font-body);',
        description: 'Reemplaza Inter (sin comillas) por var(--font-body)',
    },
];

/* ── Colores ANSI ────────────────────────────────────────────────── */
const R = '\x1b[31m';
const Y = '\x1b[33m';
const G = '\x1b[32m';
const C = '\x1b[36m';
const B = '\x1b[1m';
const D = '\x1b[2m';
const X = '\x1b[0m';

/* ── Helpers ─────────────────────────────────────────────────────── */
function walkDir(dir, results = []) {
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.includes(entry.name)) walkDir(full, results);
        } else if (EXTENSIONS.some(e => entry.name.endsWith(e))) {
            results.push(full);
        }
    }
    return results;
}

function applyRules(content) {
    const lines = content.split('\n');
    const changes = [];

    const newLines = lines.map((line, idx) => {
        let newLine = line;
        for (const rule of RULES) {
            if (rule.match.test(newLine)) {
                const before = newLine;
                if (typeof rule.replace === 'function') {
                    newLine = newLine.replace(rule.match, rule.replace);
                } else {
                    // Preservar indentación original
                    const indent = newLine.match(/^(\s*)/)[1];
                    newLine = indent + rule.replace;
                }
                changes.push({
                    line: idx + 1,
                    before: before.trim(),
                    after: newLine.trim(),
                    rule: rule.description,
                });
                break; // una regla por línea
            }
        }
        return newLine;
    });

    return { newContent: newLines.join('\n'), changes };
}

/* ── Main ────────────────────────────────────────────────────────── */
const cwd = process.cwd();
const files = SEARCH_DIRS.flatMap(d => walkDir(path.join(cwd, d)));

let totalFiles = 0;
let totalChanges = 0;

console.log('');
console.log(`${B}${C}╔══════════════════════════════════════════╗${X}`);
console.log(`${B}${C}║         FIX-FONTS — ViñoPlastic          ║${X}`);
console.log(`${B}${C}╚══════════════════════════════════════════╝${X}`);
console.log('');
console.log(`${D}Modo: ${APPLY ? `${G}${B}APLICAR CAMBIOS` : `${Y}${B}DRY RUN (solo lectura)`}${X}`);
console.log(`${D}Archivos encontrados: ${files.length}${X}`);
console.log('');

for (const file of files) {
    const base = path.basename(file);
    if (PROTECTED.includes(base)) {
        if (VERBOSE) console.log(`${D}  skip (protegido): ${path.relative(cwd, file)}${X}`);
        continue;
    }

    const original = fs.readFileSync(file, 'utf8');
    const { newContent, changes } = applyRules(original);

    if (changes.length === 0) {
        if (VERBOSE) console.log(`${D}  sin cambios:      ${path.relative(cwd, file)}${X}`);
        continue;
    }

    totalFiles++;
    totalChanges += changes.length;

    const relPath = path.relative(cwd, file);
    console.log(`  ${Y}${B}${relPath}${X}  ${D}(${changes.length} cambio${changes.length > 1 ? 's' : ''})${X}`);

    if (VERBOSE || !APPLY) {
        for (const c of changes) {
            console.log(`    ${D}línea ${c.line} — ${c.rule}${X}`);
            console.log(`    ${R}- ${c.before}${X}`);
            console.log(`    ${G}+ ${c.after}${X}`);
            console.log('');
        }
    }

    if (APPLY) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`    ${G}✓ guardado${X}`);
    }
}

console.log('');
if (totalChanges === 0) {
    console.log(`${G}${B}✓ Sin cambios necesarios — tipografía ya correcta.${X}`);
} else if (APPLY) {
    console.log(`${G}${B}✓ ${totalChanges} cambio(s) aplicado(s) en ${totalFiles} archivo(s).${X}`);
    console.log(`${D}  Reinicia el servidor de desarrollo para ver los cambios.${X}`);
} else {
    console.log(`${Y}${B}⚠ ${totalChanges} cambio(s) pendiente(s) en ${totalFiles} archivo(s).${X}`);
    console.log(`${D}  Corre con --apply para aplicarlos:${X}`);
    console.log(`${B}  node fix-fonts.js --apply${X}`);
}
console.log('');