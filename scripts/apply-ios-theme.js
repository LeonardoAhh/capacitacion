const fs = require('fs');
const path = require('path');

// Directories to process
const appDir = path.join(__dirname, '..', 'src', 'app');

// Find all page.module.css files
function findCssFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            findCssFiles(fullPath, files);
        } else if (item === 'page.module.css') {
            files.push(fullPath);
        }
    }
    return files;
}

// Apply iOS theme transformations
function applyIOSTheme(content) {
    let modified = content;

    // 1. Replace main background gradient with solid + dark mode
    modified = modified.replace(
        /\.main\s*\{([^}]*?)background:\s*linear-gradient\(135deg,\s*var\(--bg-primary\)\s*0%,\s*var\(--bg-secondary\)\s*100%\);/gs,
        `.main {$1background: var(--bg-primary);`
    );

    // Add dark mode for .main if not present
    if (modified.includes('.main {') && !modified.includes('[data-theme="dark"] .main')) {
        modified = modified.replace(
            /(\.main\s*\{[^}]+\})/,
            `$1\n\n[data-theme="dark"] .main {\n    background: #000000;\n}`
        );
    }

    // 2. Add dark mode for cards (various card types)
    const cardTypes = [
        'Card', 'card', 'formCard', 'tableContainer', 'evalCard',
        'chartCard', 'summaryCard', 'monthCard', 'deptTable',
        'emptyState', 'modal', 'alertCard', 'actionCard', 'statCard',
        'evalAlertCard', 'moduleCard'
    ];

    for (const cardType of cardTypes) {
        const regex = new RegExp(`(\\.${cardType}\\s*\\{[^}]*background-color:\\s*var\\(--bg-secondary\\);[^}]*\\})`, 'g');
        if (modified.match(regex) && !modified.includes(`[data-theme="dark"] .${cardType}`)) {
            modified = modified.replace(
                regex,
                `$1\n\n[data-theme="dark"] .${cardType} {\n    background-color: #1C1C1E;\n    border-color: rgba(84, 84, 88, 0.4);\n}`
            );
        }
    }

    // 3. Replace transition-base with transition-fast
    modified = modified.replace(/transition:\s*all\s*var\(--transition-base\)/g, 'transition: all var(--transition-fast)');

    // 4. Make hovers softer
    modified = modified.replace(/transform:\s*translateY\(-4px\)/g, 'transform: translateY(-2px)');
    modified = modified.replace(/transform:\s*translateY\(-3px\)/g, 'transform: translateY(-2px)');
    modified = modified.replace(/box-shadow:\s*var\(--shadow-lg\)/g, 'box-shadow: var(--shadow-md)');
    modified = modified.replace(/transform:\s*scale\(1\.1\)/g, 'transform: scale(1.05)');

    // 5. Replace old red color with iOS red
    modified = modified.replace(/#ef4444/g, '#FF3B30');
    modified = modified.replace(/#dc2626/g, '#FF3B30');

    // 6. Replace old blue with iOS blue in rgba
    modified = modified.replace(/rgba\(59,\s*130,\s*246,/g, 'rgba(0, 122, 255,');

    return modified;
}

// Main execution
const cssFiles = findCssFiles(appDir);
console.log(`Found ${cssFiles.length} page.module.css files\n`);

let modifiedCount = 0;

for (const file of cssFiles) {
    const relativePath = path.relative(appDir, file);
    const originalContent = fs.readFileSync(file, 'utf8');
    const modifiedContent = applyIOSTheme(originalContent);

    if (originalContent !== modifiedContent) {
        fs.writeFileSync(file, modifiedContent, 'utf8');
        console.log(`✓ Modified: ${relativePath}`);
        modifiedCount++;
    } else {
        console.log(`- Skipped (no changes): ${relativePath}`);
    }
}

console.log(`\n✅ Done! Modified ${modifiedCount} files.`);
