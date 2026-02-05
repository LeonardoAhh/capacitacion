# PowerShell Script to Analyze Induction Compliance

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dataDir = Join-Path $scriptDir "..\src\data"
$matrizFile = Join-Path $dataDir "matriz.json"
$historialFile = Join-Path $dataDir "historial.json"
$outputFile = Join-Path $scriptDir "induction_analysis_result.json"

Write-Host "Loading data..."
if (-not (Test-Path $matrizFile)) { Write-Error "Matriz file not found: $matrizFile" }
if (-not (Test-Path $historialFile)) { Write-Error "Historial file not found: $historialFile" }

$matrizData = Get-Content -Raw -Path $matrizFile | ConvertFrom-Json
$historialData = Get-Content -Raw -Path $historialFile | ConvertFrom-Json

# The specific 10 Induction Courses
$inductionCoursesFile = Join-Path $scriptDir "induction_courses_list.json"
if (-not (Test-Path $inductionCoursesFile)) { Write-Error "Induction courses list not found: $inductionCoursesFile" }
$inductionCourses = Get-Content -Raw -Path $inductionCoursesFile | ConvertFrom-Json

Write-Host "Building requirements matrix..."

# Position -> Set of Required Courses
$positionRequirements = @{}

foreach ($item in $matrizData) {
    $pos = $item.position.Trim().ToUpper()
    $course = $item.requiredCourses.Trim().ToUpper()
    
    if (-not $positionRequirements.ContainsKey($pos)) {
        $positionRequirements[$pos] = @()
    }
    $positionRequirements[$pos] += $course
}

Write-Host "Processing employee history..."

$employees = @{}

foreach ($record in $historialData) {
    if (-not $record.employeeId) { continue }
    
    $empId = $record.employeeId
    
    if (-not $employees.ContainsKey($empId)) {
        $employees[$empId] = @{
            id = $empId
            name = $record.name
            position = ""
            department = $record.deparment
            coursesTaken = @{} # Hashset-like
        }
    }
    
    # Update position (simple last-wins for consistency with previous logic)
    if ($record.position) {
        $employees[$empId].position = $record.position.Trim().ToUpper()
    }
    
    $courseName = if ($record.'course taken') { $record.'course taken'.Trim().ToUpper() } else { "" }
    $qual = 0
    if ($record.qualification) {
        $qual = [double]$record.qualification
    }
    
    # Logic: >= 60 or just present
    if ($courseName -ne "") {
       # Assumes if it's in history, it counts, unless qualification is explicitly low
       if ($qual -ge 60) {
           $employees[$empId].coursesTaken[$courseName] = $true
       }
    }
}

Write-Host "Analyzing compliance..."

$totalEmployeesScanned = 0
$employeesWithInductionNeeds = 0
$globalRequired = 0
$globalCompleted = 0
$globalMissing = 0

$employeeResults = @()

foreach ($empKey in $employees.Keys) {
    $emp = $employees[$empKey]
    $totalEmployeesScanned++
    
    $pos = $emp.position
    
    if (-not $positionRequirements.ContainsKey($pos)) {
        continue
    }
    
    $requirements = $positionRequirements[$pos]
    
    # Filter for Induction Courses only
    $inductionRequirements = $requirements | Where-Object { $inductionCourses -contains $_ }
    
    if ($inductionRequirements.Count -eq 0) {
        continue
    }
    
    $employeesWithInductionNeeds++
    
    $taken = @()
    $missing = @()
    
    foreach ($reqCourse in $inductionRequirements) {
        if ($emp.coursesTaken.ContainsKey($reqCourse)) {
            $taken += $reqCourse
            $globalCompleted++
        } else {
            $missing += $reqCourse
            $globalMissing++
        }
        $globalRequired++
    }
    
    $compliance = 0
    if ($inductionRequirements.Count -gt 0) {
        $compliance = ($taken.Count / $inductionRequirements.Count) * 100
    }
    
    $resultObj = @{
        id = $emp.id
        name = $emp.name
        position = $emp.position
        department = $emp.department
        requiredCount = $inductionRequirements.Count
        completedCount = $taken.Count
        complianceInternal = $compliance
        complianceStr = "$($compliance.ToString("F1"))%"
        missingCourses = $missing
    }
    $employeeResults += $resultObj
}

# Sort by compliance ascending
$employeeResults = $employeeResults | Sort-Object complianceInternal

Write-Host "`n--- ANALYSIS REPORT ---"
Write-Host "Total Employees Scanned: $totalEmployeesScanned"
Write-Host "Employees with Induction Requirements: $employeesWithInductionNeeds"
Write-Host "`nGlobal Induction Stats:"
Write-Host "  Total Assignments required: $globalRequired"
Write-Host "  Total Completed:            $globalCompleted"

$globalCompliance = 0
if ($globalRequired -gt 0) {
    $globalCompliance = ($globalCompleted / $globalRequired) * 100
}
Write-Host "  Global Compliance:          $($globalCompliance.ToString("F2"))%"

Write-Host "`n--- TOP GAPS (Employees with lowest compliance) ---"
$employeeResults | Select-Object -First 20 | ForEach-Object {
    if ($_.complianceInternal -lt 100) {
        Write-Host "`n[$($_.id)] $($_.name) ($($_.position))"
        Write-Host "  Compliance: $($_.complianceStr) ($($_.completedCount)/$($_.requiredCount))"
        $missingStr = $_.missingCourses -join ", "
        Write-Host "  Missing: $missingStr"
    }
}

# Output JSON
$output = @{
    meta = @{
        date = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        courseList = $inductionCourses
    }
    stats = @{
        employeesAnalyzed = $totalEmployeesScanned
        employeesWithRequirements = $employeesWithInductionNeeds
        globalCompliance = $globalCompliance.ToString("F2")
    }
    details = $employeeResults
}

$output | ConvertTo-Json -Depth 5 | Set-Content -Path $outputFile
Write-Host "`nFull JSON report saved to: $outputFile"
