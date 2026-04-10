/**
 * fix-encoding.mjs
 * Limpia caracteres corruptos en todos los archivos de código del proyecto.
 *
 * Uso:
 *   node fix-encoding.mjs              → escanea desde la carpeta actual
 *   node fix-encoding.mjs ./src        → escanea solo ./src
 *   node fix-encoding.mjs --dry-run    → solo muestra qué cambiaría, sin modificar
 */

import fs from 'fs';
import path from 'path';

// ─── Configuración ───────────────────────────────────────────────────────────

const ROOT        = process.argv.find(a => a.startsWith('./') || a.startsWith('/')) ?? '.';
const DRY_RUN     = process.argv.includes('--dry-run');
const EXTENSIONS  = new Set(['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.json', '.md', '.html', '.mjs', '.cjs']);
const IGNORE_DIRS = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo', 'coverage', 'out']);

// ─── Tabla de reemplazos ─────────────────────────────────────────────────────

const REPLACEMENTS = [
  // 1. Caracter de reemplazo Unicode (rombo con "?") — el más común al corromper UTF-8
  { pattern: /\uFFFD/g,         replacement: '',   description: 'Caracter de reemplazo Unicode (?)' },

  // 2. Secuencias de escape mal formadas que quedaron literales en el archivo
  { pattern: /\{1,4}[0-9a-fA-F]{0,3}\b/g, replacement: '', description: 'Secuencia \... corrupta' },

  // 3. BOM de UTF-8 al inicio de archivo
  { pattern: /^\uFEFF/,         replacement: '',   description: 'BOM UTF-8' },

  // 4. Comillas tipográficas → comillas rectas
  { pattern: /\u201C|\u201D/g,  replacement: '"',  description: 'Comillas tipográficas dobles (" ")' },
  { pattern: /\u2018|\u2019/g,  replacement: "'",  description: "Comillas tipográficas simples (' ')" },

  // 5. Espacios especiales → espacio normal
  { pattern: //g,         replacement: ' ',  description: 'Espacio de no separación (NBSP)' },
  { pattern: /\u200B/g,         replacement: '',   description: 'Zero-width space' },
  { pattern: /\u200C/g,         replacement: '',   description: 'Zero-width non-joiner' },
  { pattern: /\u200D/g,         replacement: '',   description: 'Zero-width joiner' },
  { pattern: /\uFEFF(?!$)/g,    replacement: '',   description: 'BOM en medio del archivo' },

  // 6. Guión largo / guión medio → guión normal (en contexto de código)
  // Descomenta si los quieres reemplazar también en strings:
  // { pattern: /\u2013/g, replacement: '-', description: 'En dash (–)' },
  // { pattern: /\u2014/g, replacement: '--', description: 'Em dash (—)' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const DIM    = '\x1b[2m';

const log = {
  info:    (msg) => console.log(`${CYAN}ℹ${RESET}  ${msg}`),
  fixed:   (msg) => console.log(`${GREEN}✔${RESET}  ${msg}`),
  skipped: (msg) => console.log(`${DIM}−  ${msg}${RESET}`),
  warn:    (msg) => console.log(`${YELLOW}⚠${RESET}  ${msg}`),
  error:   (msg) => console.log(`${RED}✖${RESET}  ${msg}`),
};

// ─── Procesamiento de un solo archivo ────────────────────────────────────────

function processFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    log.error(`No se pudo leer: ${filePath} — ${err.message}`);
    return { changed: false, error: true };
  }

  let fixed    = content;
  const applied = [];

  for (const { pattern, replacement, description } of REPLACEMENTS) {
    const before = fixed;
    fixed = fixed.replace(pattern, replacement);
    if (fixed !== before) applied.push(description);
  }

  if (applied.length === 0) return { changed: false, error: false };

  if (!DRY_RUN) {
    try {
      fs.writeFileSync(filePath, fixed, 'utf8');
    } catch (err) {
      log.error(`No se pudo escribir: ${filePath} — ${err.message}`);
      return { changed: false, error: true };
    }
  }

  return { changed: true, error: false, applied };
}

// ─── Recorrido recursivo ──────────────────────────────────────────────────────

function walk(dir, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.env') continue; // skip hidden (excepto .env)
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) walk(fullPath, results);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (EXTENSIONS.has(ext)) results.push(fullPath);
    }
  }
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const absRoot = path.resolve(ROOT);
log.info(`Escaneando: ${absRoot}`);
if (DRY_RUN) log.warn('Modo DRY-RUN: no se modificará ningún archivo.\n');

const files = walk(absRoot);
log.info(`Archivos encontrados: ${files.length}\n`);

let changedCount = 0;
let errorCount   = 0;

for (const file of files) {
  const rel = path.relative(absRoot, file);
  const { changed, error, applied } = processFile(file);

  if (error)        { errorCount++;   log.error(`Error en: ${rel}`); }
  else if (changed) {
    changedCount++;
    const label = DRY_RUN ? '(dry-run)' : 'corregido';
    log.fixed(`${label}: ${rel}`);
    for (const a of applied) console.log(`       ${DIM}→ ${a}${RESET}`);
  } else {
    log.skipped(`sin cambios: ${rel}`);
  }
}

// ─── Resumen ──────────────────────────────────────────────────────────────────

console.log('\n─────────────────────────────────────────');
console.log(`${GREEN}Corregidos:${RESET}  ${changedCount}`);
console.log(`${DIM}Sin cambios: ${files.length - changedCount - errorCount}${RESET}`);
if (errorCount) console.log(`${RED}Errores:     ${errorCount}${RESET}`);
console.log('─────────────────────────────────────────\n');

if (DRY_RUN && changedCount > 0) {
  log.warn(`Ejecuta sin --dry-run para aplicar los ${changedCount} cambios.`);
}
