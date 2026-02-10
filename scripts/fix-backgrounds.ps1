$basePath = "c:\Users\Capacitacion - QRO\Downloads\capacitacion\src\app"

$files = @(
    "$basePath\dashboard\page.module.css",
    "$basePath\reports\page.module.css",
    "$basePath\employees\page.module.css",
    "$basePath\capacitacion\page.module.css",
    "$basePath\capacitacion\habilidades\page.module.css",
    "$basePath\capacitacion\puestos\page.module.css",
    "$basePath\capacitacion\registro\page.module.css",
    "$basePath\capacitacion\empleados\page.module.css",
    "$basePath\capacitacion\analisis\page.module.css",
    "$basePath\capacitacion\matriz\page.module.css",
    "$basePath\capacitacion\cursos\page.module.css",
    "$basePath\capacitacion\alertas\page.module.css",
    "$basePath\capacitacion\calendario\page.module.css",
    "$basePath\capacitacion\promociones\page.module.css",
    "$basePath\capacitacion\cumplimiento\page.module.css",
    "$basePath\capacitacion\perfil\page.module.css",
    "$basePath\capacitacion\catalogo\page.module.css"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $lines = $content -split "`r?`n"
        $newLines = @()
        $inMain = $false

        foreach ($line in $lines) {
            if ($line -match '^\s*\.main\s*\{') {
                $inMain = $true
            }
            if ($inMain -and $line -match '^\s*background:\s*var\(--bg-primary\)') {
                $line = $line -replace 'background:\s*var\(--bg-primary\)', 'background: transparent'
            }
            if ($inMain -and $line -match '^\s*\}') {
                $inMain = $false
            }
            $newLines += $line
        }

        $newLines -join "`r`n" | Set-Content $file -NoNewline
        Write-Host "Updated: $file"
    } else {
        Write-Host "Not found: $file"
    }
}

Write-Host "`nDone! All .main backgrounds changed to transparent."
