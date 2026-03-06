const fs = require('fs');
const files = [
    'src/app/page.module.css',
    'src/app/globals.css',
    'src/app/recursos/page.module.css',
    'src/app/profile/page.module.css',
    'src/components/auth/LoginBase/LoginBase.module.css',
    'src/components/features/Courses/CompletionScreen.module.css',
    'src/components/features/Courses/TableOfContents.module.css',
    'src/components/features/DynamicCredits/DynamicCredits.module.css',
    'src/components/features/Training/EvaluationModal.module.css',
    'src/components/guards/MaintenanceScreen.module.css',
    'src/components/ui/Charts/Charts.module.css',
    'src/components/ui/ModuleCard/ModuleCard.module.css',
    'src/components/ui/ShapeHero/ShapeHero.module.css'
];

files.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');

        // Remover imports de Google Fonts
        content = content.replace(/@import\s+url\([^)]+\);\r?\n?/g, '');

        // Reemplazar 'Playfair Display' y variaciones con var(--font-serif)
        content = content.replace(/font-family:\s*['"]?Playfair Display['"]?[^;]*;/g, 'font-family: var(--font-serif);');

        // Reemplazar 'Geist' y var(--font-sans) con var(--font-body)
        content = content.replace(/font-family:\s*['"]?Geist['"]?[^;]*;/g, 'font-family: var(--font-body);');
        content = content.replace(/font-family:\s*var\(--font-sans[^;]*;/g, 'font-family: var(--font-body);');

        // Reemplazar 'Inter' u otras hardcodeadas en Chart u otros con var(--font-mono)
        content = content.replace(/font-family:\s*['"]?Inter['"]?[^;]*;/g, 'font-family: var(--font-mono);');

        fs.writeFileSync(file, content);
        console.log(`Cleaned fonts in ${file}`);
    } else {
        console.log(`File not found: ${file}`);
    }
});
