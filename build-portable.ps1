# BNotes Portable Build Script
# Usage: powershell -ExecutionPolicy Bypass -File build-portable.ps1

$ErrorActionPreference = "Stop"

# ========== Config ==========
$ProjectRoot   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ElectronDir   = Join-Path $ProjectRoot "node_modules\electron\dist"
$OutputDir     = Join-Path $ProjectRoot "release\BNotes"
$AppDir        = Join-Path $OutputDir "resources\app"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BNotes Portable Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ========== Step 1: Check Electron binary ==========
Write-Host "[1/7] Checking Electron binary..." -ForegroundColor Yellow

if (-not (Test-Path $ElectronDir)) {
    Write-Host "ERROR: Electron not found: $ElectronDir" -ForegroundColor Red
    Write-Host "Run 'npm install' first" -ForegroundColor Red
    exit 1
}

$electronExe = Join-Path $ElectronDir "electron.exe"
if (-not (Test-Path $electronExe)) {
    Write-Host "ERROR: electron.exe not found: $electronExe" -ForegroundColor Red
    exit 1
}

Write-Host "  Found Electron: $ElectronDir" -ForegroundColor Green

# ========== Step 2: Check frontend build ==========
Write-Host "[2/7] Checking frontend build..." -ForegroundColor Yellow

$distDir = Join-Path $ProjectRoot "dist"
if (-not (Test-Path $distDir)) {
    Write-Host "Building frontend..." -ForegroundColor Yellow
    Push-Location $ProjectRoot
    npm run build
    Pop-Location
    if (-not (Test-Path $distDir)) {
        Write-Host "ERROR: Frontend build failed" -ForegroundColor Red
        exit 1
    }
}

Write-Host "  Frontend build: $distDir" -ForegroundColor Green

# ========== Step 3: Clean old output (preserve user data) ==========
Write-Host "[3/7] Cleaning old output (preserving data/)..." -ForegroundColor Yellow

if (Test-Path $OutputDir) {
    $dataDir = Join-Path $OutputDir "data"
    $exportsDir = Join-Path $OutputDir "exports"
    $userdataDir = Join-Path $OutputDir "userdata"
    $dataBackup = $null
    $exportsBackup = $null
    $userdataBackup = $null

    if (Test-Path $dataDir) {
        $dataBackup = Join-Path $ProjectRoot "release\_data_backup_tmp"
        Write-Host "  Backing up user data: data/" -ForegroundColor Gray
        if (Test-Path $dataBackup) { Remove-Item $dataBackup -Recurse -Force }
        Move-Item -Path $dataDir -Destination $dataBackup -Force
    }
    if (Test-Path $exportsDir) {
        $exportsBackup = Join-Path $ProjectRoot "release\_exports_backup_tmp"
        Write-Host "  Backing up exports: exports/" -ForegroundColor Gray
        if (Test-Path $exportsBackup) { Remove-Item $exportsBackup -Recurse -Force }
        Move-Item -Path $exportsDir -Destination $exportsBackup -Force
    }
    if (Test-Path $userdataDir) {
        $userdataBackup = Join-Path $ProjectRoot "release\_userdata_backup_tmp"
        Write-Host "  Backing up userdata: userdata/" -ForegroundColor Gray
        if (Test-Path $userdataBackup) { Remove-Item $userdataBackup -Recurse -Force -ErrorAction SilentlyContinue }
        Move-Item -Path $userdataDir -Destination $userdataBackup -Force
    }

    Write-Host "  Removing old program: $OutputDir" -ForegroundColor Gray
    Get-ChildItem $OutputDir -Recurse -Force | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $OutputDir -Recurse -Force -ErrorAction SilentlyContinue

    if ($dataBackup -and (Test-Path $dataBackup)) {
        Write-Host "  Restoring user data" -ForegroundColor Gray
        New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null
        Move-Item -Path $dataBackup -Destination (Join-Path $OutputDir "data") -Force
    }
    if ($exportsBackup -and (Test-Path $exportsBackup)) {
        if (-not (Test-Path $OutputDir)) { New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null }
        Move-Item -Path $exportsBackup -Destination (Join-Path $OutputDir "exports") -Force
    }
    if ($userdataBackup -and (Test-Path $userdataBackup)) {
        if (-not (Test-Path $OutputDir)) { New-Item -Path $OutputDir -ItemType Directory -Force | Out-Null }
        Move-Item -Path $userdataBackup -Destination (Join-Path $OutputDir "userdata") -Force
    }

    $tmp1 = Join-Path $ProjectRoot "release\_data_backup_tmp"
    $tmp2 = Join-Path $ProjectRoot "release\_exports_backup_tmp"
    $tmp3 = Join-Path $ProjectRoot "release\_userdata_backup_tmp"
    if (Test-Path $tmp1) { Remove-Item $tmp1 -Recurse -Force -ErrorAction SilentlyContinue }
    if (Test-Path $tmp2) { Remove-Item $tmp2 -Recurse -Force -ErrorAction SilentlyContinue }
    if (Test-Path $tmp3) { Remove-Item $tmp3 -Recurse -Force -ErrorAction SilentlyContinue }

    Write-Host "  Old version removed, user data preserved" -ForegroundColor Green
}

# ========== Step 4: Copy Electron runtime ==========
Write-Host "[4/7] Copying Electron runtime..." -ForegroundColor Yellow

Write-Host "  Copying $ElectronDir -> $OutputDir" -ForegroundColor Gray
$ErrorActionPreference = "Continue"
robocopy $ElectronDir $OutputDir /E /NFL /NDL /NJH /NJS /NC /NS /NP
$roboExit = $LASTEXITCODE
$ErrorActionPreference = "Stop"
if ($roboExit -ge 8) {
    Write-Host "ERROR: Failed to copy Electron runtime (robocopy exit: $roboExit)" -ForegroundColor Red
    exit 1
}

$defaultAsar = Join-Path $OutputDir "resources\default_app.asar"
$electronAsar = Join-Path $OutputDir "resources\electron.asar"
if (Test-Path $defaultAsar) { Remove-Item $defaultAsar -Force }
if (Test-Path $electronAsar) { Remove-Item $electronAsar -Force }

Write-Host "  Electron runtime copied" -ForegroundColor Green

# ========== Step 5: Rename electron.exe -> BNotes.exe ==========
Write-Host "[5/7] Renaming electron.exe -> BNotes.exe..." -ForegroundColor Yellow

$oldExe = Join-Path $OutputDir "electron.exe"
$newExe = Join-Path $OutputDir "BNotes.exe"

# Remove leftover BNotes.exe from previous build
if (Test-Path $newExe) {
    Remove-Item $newExe -Force -ErrorAction SilentlyContinue
}

if (Test-Path $oldExe) {
    # Use Move-Item instead of Rename-Item to avoid "file already exists" error
    Move-Item -Path $oldExe -Destination $newExe -Force
    Write-Host "  Renamed to BNotes.exe" -ForegroundColor Green
} else {
    Write-Host "WARNING: electron.exe not found, skipping rename" -ForegroundColor Yellow
}

# ========== Step 6: Copy app files to resources\app ==========
Write-Host "[6/7] Copying app files to resources\app..." -ForegroundColor Yellow

New-Item -Path $AppDir -ItemType Directory -Force | Out-Null

Write-Host "  Copying package.json" -ForegroundColor Gray
Copy-Item -Path (Join-Path $ProjectRoot "package.json") -Destination $AppDir -Force

Write-Host "  Copying dist/" -ForegroundColor Gray
Copy-Item -Path $distDir -Destination $AppDir -Recurse -Force

Write-Host "  Copying electron/" -ForegroundColor Gray
Copy-Item -Path (Join-Path $ProjectRoot "electron") -Destination $AppDir -Recurse -Force

Write-Host "  Copying backend-node/" -ForegroundColor Gray
Copy-Item -Path (Join-Path $ProjectRoot "backend-node") -Destination $AppDir -Recurse -Force

Write-Host "  Copying node_modules/ (this may take a while)..." -ForegroundColor Gray
$nmDest = Join-Path $AppDir "node_modules"
$nmSrc = Join-Path $ProjectRoot "node_modules"

# Exclude dev-only packages and large unnecessary files
$ErrorActionPreference = "Continue"
robocopy $nmSrc $nmDest /E `
    /XD "electron" "electron-builder" "app-builder-bin" `
        "vite" "@vitejs" "concurrently" "sharp" `
    /XF "*.pdb" "*.lib" "*.exp" "*.ts" "*.map" `
         ".eslintrc*" ".prettierrc*" "CHANGELOG*" "HISTORY*" `
         "README*" "readme*" "LICENSE*" "licence*" `
    /NFL /NDL /NJH /NJS /NC /NS /NP
$roboExit2 = $LASTEXITCODE
$ErrorActionPreference = "Stop"
if ($roboExit2 -ge 8) {
    Write-Host "WARNING: node_modules copy may have issues (robocopy exit: $roboExit2)" -ForegroundColor Yellow
}

Write-Host "  App files copied" -ForegroundColor Green

# ========== Step 7: Verify build ==========
Write-Host "[7/7] Verifying build..." -ForegroundColor Yellow

$errors = @()

if (-not (Test-Path $newExe)) {
    $errors += "BNotes.exe missing"
}

if (-not (Test-Path (Join-Path $AppDir "package.json"))) {
    $errors += "resources\app\package.json missing"
}

if (-not (Test-Path (Join-Path $AppDir "electron\main.js"))) {
    $errors += "resources\app\electron\main.js missing"
}

if (-not (Test-Path (Join-Path $AppDir "backend-node\server.js"))) {
    $errors += "resources\app\backend-node\server.js missing"
}

if (-not (Test-Path (Join-Path $AppDir "dist\index.html"))) {
    $errors += "resources\app\dist\index.html missing"
}

if (-not (Test-Path (Join-Path $AppDir "node_modules"))) {
    $errors += "resources\app\node_modules missing"
}

$dataInApp = Join-Path $AppDir "data"
if (Test-Path $dataInApp) {
    $errors += "resources\app\data should not exist (user data must not be packaged)"
}

if ($errors.Count -gt 0) {
    Write-Host "Verification FAILED:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

$outputSize = (Get-ChildItem -Path $OutputDir -Recurse | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($outputSize / 1MB, 1)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Output: $OutputDir" -ForegroundColor White
Write-Host "  Executable: BNotes.exe" -ForegroundColor White
Write-Host "  Size: ${sizeMB} MB" -ForegroundColor White
Write-Host ""
Write-Host "  User data is stored in data/ next to BNotes.exe" -ForegroundColor Cyan
Write-Host "  Updating: just replace the folder, data/ is preserved" -ForegroundColor Cyan
Write-Host ""
