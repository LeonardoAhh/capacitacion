$ErrorActionPreference='Stop'
$pairs = @(
    @{ file='src\components\features\Induccion\views\KanbanCoursesView.module.css'; marker='Vercel / Geist' },
    @{ file='src\components\features\Profile\AdminManager.module.css'; marker='[data-theme="dark"]' },
    @{ file='src\components\features\Courses\CoursePlayer.module.css'; marker='shadcn/ui' }
)
foreach($p in $pairs){
    $f = $p.file
    if(-not (Test-Path -LiteralPath $f)){ Write-Host "MISSING $f"; continue }
    $c = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $f).Path)
    $i = $c.IndexOf($p.marker)
    if($i -lt 0){ Write-Host "CLEAN  $f (no marker)"; continue }
    # back up to nearest /* before marker
    $j = $c.LastIndexOf('/*', $i)
    if($j -lt 0){ $j = $i }
    $clean = $c.Substring(0,$j).TrimEnd() + "`n"
    [System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $f).Path, $clean, [System.Text.UTF8Encoding]::new($false))
    Write-Host "TRUNC  $f from $j (was $($c.Length) -> $($clean.Length))"
}
