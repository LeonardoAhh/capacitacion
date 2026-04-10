import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

function getAllJsFiles(dir, results = []) {
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) getAllJsFiles(full, results);
        else if (full.endsWith('.js') || full.endsWith('.jsx')) results.push(full);
    }
    return results;
}

const files = getAllJsFiles('./src');
const fixed = [], skipped = [];

for (const f of files) {
    const raw = readFileSync(f);
    // Test if file is valid UTF-8 as-is
    let isValidUtf8 = true;
    try { raw.toString('utf8'); } catch { isValidUtf8 = false; }

    if (!isValidUtf8) {
        // Invalid UTF-8 bytes — decode as latin-1, save as UTF-8
        writeFileSync(f, raw.toString('latin1'), 'utf8');
        fixed.push(f + ' (was invalid UTF-8)');
    } else {
        // Check for double-encoded sequences (mojibake)
        const str = raw.toString('utf8');
        if (/[\xc0-\xff]{2,}/.test(str)) {
            const refixed = Buffer.from(str, 'latin1').toString('utf8');
            writeFileSync(f, refixed, 'utf8');
            fixed.push(f + ' (double-encoded)');
        } else {
            skipped.push(f);
        }
    }
}

writeFileSync('./audit-out.txt',
    `Fixed ${fixed.length} files:\n${fixed.join('\n')}\n\nSkipped ${skipped.length} clean files.`,
    'utf8'
);



