# Script para reemplazar Navbar con ProfileDropdown
Write-Host "Iniciando actualizacion..." -ForegroundColor Cyan

$pages = @(
    "capacitacion\puestos",
    "capacitacion\registro",
    "capacitacion\empleados",
    "capacitacion\perfil",
    "capacitacion\analisis",
    "capacitacion\matriz",
    "capacitacion\habilidades",
    "capacitacion\cursos",
    "capacitacion\alertas",
    "capacitacion\calendario",
    "capacitacion\promociones",
    "capacitacion\cumplimiento"
)

$baseDir = "src\app"
$totalPages = $pages.Count
$processedPages = 0

foreach ($page in $pages) {
    $processedPages++
    Write-Host "[$processedPages/$totalPages] Procesando: $page" -ForegroundColor Yellow
    
    $jsFile = Join-Path $baseDir "$page\page.js"
    $cssFile = Join-Path $baseDir "$page\page.module.css"
    
    # Actualizar JS
    if (Test-Path $jsFile) {
        $jsContent = Get-Content $jsFile -Raw -Encoding UTF8
        $jsContent = $jsContent -replace "import Navbar from '@/components/Navbar/Navbar';", "import ProfileDropdown from '@/components/ProfileDropdown/ProfileDropdown';"
        $jsContent = $jsContent -replace '<Navbar />', "<div className={styles.profileContainer}>`r`n                <ProfileDropdown />`r`n            </div>"
        Set-Content $jsFile -Value $jsContent -Encoding UTF8 -NoNewline
        Write-Host "  -> JS actualizado" -ForegroundColor Green
    }
    
    # Actualizar CSS
    if (Test-Path $cssFile) {
        $cssContent = Get-Content $cssFile -Raw -Encoding UTF8
        if ($cssContent -notmatch '\.profileContainer') {
            $cssInsert = "`r`n`r`n.profileContainer {`r`n    position: fixed;`r`n    top: 20px;`r`n    right: 20px;`r`n    z-index: 9999;`r`n}"
            $cssContent = $cssContent -replace '(\.main\s*\{[^}]+\})', "`$1$cssInsert"
            Set-Content $cssFile -Value $cssContent -Encoding UTF8 -NoNewline
            Write-Host "  -> CSS actualizado" -ForegroundColor Green
        } else {
            Write-Host "  -> CSS ya tiene profileContainer" -ForegroundColor Cyan
        }
    }
}

Write-Host "`nCompletado! $totalPages paginas procesadas." -ForegroundColor Green
Write-Host "Reinicia el servidor de desarrollo." -ForegroundColor Yellow
