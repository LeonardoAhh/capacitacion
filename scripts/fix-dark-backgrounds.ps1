$basePath = "c:\Users\Capacitacion - QRO\Downloads\capacitacion\src\app"

$files = @(
    "$basePath\capacitacion\analisis\page.module.css",
    "$basePath\capacitacion\catalogo\page.module.css",
    "$basePath\capacitacion\matriz\page.module.css",
    "$basePath\capacitacion\registro\page.module.css",
    "$basePath\capacitacion\promociones\page.module.css",
    "$basePath\capacitacion\perfil\page.module.css",
    "$basePath\capacitacion\cursos\page.module.css",
    "$basePath\capacitacion\habilidades\page.module.css",
    "$basePath\capacitacion\cumplimiento\page.module.css",
    "$basePath\capacitacion\alertas\page.module.css",
    "$basePath\capacitacion\calendario\page.module.css"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        # Look for [data-theme="dark"] .main { ... background: #000000; ... } logic
        # Since it's CSS, we can match the block. 
        # But a regex replacement on the exact lines is safer if checking line by line is hard with multi-line blocks.
        
        # Let's use regex replace for the specific pattern observed
        # Pattern: [data-theme="dark"] .main {\s*background: #000000;
        
        $newContent = $content -replace '(\[data-theme="dark"\] \.main\s*\{\s*background:\s*)#000000', '$1transparent'
        
        if ($newContent -ne $content) {
            $newContent | Set-Content $file -NoNewline
            Write-Host "Updated: $file"
        } else {
            Write-Host "No change needed or pattern not found: $file"
        }
    } else {
        Write-Host "Not found: $file"
    }
}

Write-Host "`nDone! Dark mode backgrounds updated."
