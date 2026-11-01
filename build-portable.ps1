# BNotes Portable Build Script
# Usage: powershell -ExecutionPolicy Bypass -File build-portable.ps1
# Output: self-use portable in 自用版\BNotes + share zip in 分享包
# NOTE: this file must be saved as UTF-8 WITH BOM (PowerShell 5 reads non-BOM as ANSI)

$ErrorActionPreference = "Stop"

# ========== Config ==========
$ProjectRoot   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ElectronDir   = Join-Path $ProjectRoot "node_modules\electron\dist"
$SelfUseName   = -join [char[]](0x81EA, 0x7528, 0x7248)   # "自用版" (-join: no OFS spaces)
$ShareName     = -join [char[]](0x5206, 0x4EAB, 0x5305)   # "分享包"
$BrandName     = -join [char[]](0x4E66, 0x8BB0)           # "书记"
$OutputDir     = Join-Path (Join-Path $ProjectRoot $SelfUseName) "BNotes"
$ShareDir      = Join-Path $ProjectRoot $ShareName
$DocsSourceDir = Join-Path (Join-Path $ProjectRoot $SelfUseName) "docs"
$AppDir        = Join-Path $OutputDir "resources\app"
$BuildDir      = Join-Path $ProjectRoot "build"
$IconIco       = Join-Path $BuildDir "icon.ico"
$IconPng       = Join-Path $ProjectRoot "pic\图标1.png"

$version = (Get-Content (Join-Path $ProjectRoot "package.json") -Raw | ConvertFrom-Json).version

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BNotes Portable Build v$version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ========== Step 1: Check Electron binary ==========
Write-Host "[1/10] Checking Electron binary..." -ForegroundColor Yellow

if (-not (Test-Path $ElectronDir)) {
    Write-Host "ERROR: Electron not found: $ElectronDir" -ForegroundColor Red
    Write-Host "Run 'npm install' first" -ForegroundColor Red
    exit 1
}

$electronExe = Join-Path $ElectronDir "electron.exe"
if (-not (Test-Path $electronExe)) {
    Write-Host "ERROR: electron.exe not found in $ElectronDir" -ForegroundColor Red
    exit 1
}

Write-Host "  Found Electron: $ElectronDir" -ForegroundColor Green

# ========== Step 2: Check frontend build ==========
Write-Host "[2/10] Checking frontend build..." -ForegroundColor Yellow

$distDir = Join-Path $ProjectRoot "dist"
if (-not (Test-Path $distDir)) {
    Write-Host "  Building frontend..." -ForegroundColor Yellow
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
Write-Host "[3/10] Cleaning old output (preserving user data)..." -ForegroundColor Yellow

New-Item -ItemType Directory -Force -Path (Join-Path $ProjectRoot "release") | Out-Null

if (Test-Path $OutputDir) {
    $dataDir     = Join-Path $OutputDir "data"
    $exportsDir  = Join-Path $OutputDir "exports"
    $userdataDir = Join-Path $OutputDir "userdata"
    $dataBackup = $null; $exportsBackup = $null; $userdataBackup = $null

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

    foreach ($tmp in @("_data_backup_tmp", "_exports_backup_tmp", "_userdata_backup_tmp")) {
        $p = Join-Path $ProjectRoot "release\$tmp"
        if (Test-Path $p) { Remove-Item $p -Recurse -Force -ErrorAction SilentlyContinue }
    }

    Write-Host "  Old version removed, user data preserved" -ForegroundColor Green
}

# ========== Step 4: Copy Electron runtime ==========
Write-Host "[4/10] Copying Electron runtime..." -ForegroundColor Yellow

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
Write-Host "[5/10] Renaming electron.exe -> BNotes.exe..." -ForegroundColor Yellow

$oldExe = Join-Path $OutputDir "electron.exe"
$newExe = Join-Path $OutputDir "BNotes.exe"

if (Test-Path $newExe) {
    Remove-Item $newExe -Force -ErrorAction SilentlyContinue
}

if (Test-Path $oldExe) {
    Move-Item -Path $oldExe -Destination $newExe -Force
    Write-Host "  Renamed to BNotes.exe" -ForegroundColor Green
} else {
    Write-Host "WARNING: electron.exe not found, skipping rename" -ForegroundColor Yellow
}

# ========== Step 6: Apply brand icon + version info ==========
Write-Host "[6/10] Applying brand icon + version info..." -ForegroundColor Yellow

$rceditApplied = $false

if (-not (Test-Path $IconIco)) {
    Write-Host "  Generating icon.ico from pic source..." -ForegroundColor Gray
    powershell -ExecutionPolicy Bypass -File (Join-Path $BuildDir "make-ico.ps1") -SourcePng $IconPng -OutIco $IconIco
}

$rcedit = Join-Path $BuildDir "tools\rcedit-x64.exe"
if (-not (Test-Path $rcedit)) {
    $cacheRcedit = Join-Path $env:LOCALAPPDATA "electron-builder\Cache\winCodeSign\winCodeSign-2.6.0\rcedit-x64.exe"
    if (Test-Path $cacheRcedit) { $rcedit = $cacheRcedit }
}

if (Test-Path $newExe) {
    if (Test-Path $rcedit) {
        & $rcedit $newExe `
            --set-icon $IconIco `
            --set-version-string "ProductName" "BNotes" `
            --set-version-string "FileDescription" "BNotes - Reading Notes" `
            --set-version-string "CompanyName" "BNotes" `
            --set-version-string "OriginalFilename" "BNotes.exe" `
            --set-file-version $version `
            --set-product-version $version
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: rcedit failed (exit $LASTEXITCODE)" -ForegroundColor Red
            exit 1
        }
        Write-Host "  Icon + version info applied (v$version)" -ForegroundColor Green
        $rceditApplied = $true
    } else {
        Write-Host "WARNING: rcedit not found, exe keeps default Electron icon!" -ForegroundColor Red
    }
}

# ========== Step 7: Copy app files to resources\app ==========
Write-Host "[7/10] Copying app files to resources\app..." -ForegroundColor Yellow

New-Item -Path $AppDir -ItemType Directory -Force | Out-Null

Copy-Item -Path (Join-Path $ProjectRoot "package.json") -Destination $AppDir -Force
Copy-Item -Path $distDir -Destination $AppDir -Recurse -Force
Copy-Item -Path (Join-Path $ProjectRoot "electron") -Destination $AppDir -Recurse -Force
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

# ========== Step 8: Copy usage docs into output ==========
Write-Host "[8/10] Copying usage docs into output..." -ForegroundColor Yellow

if (Test-Path $DocsSourceDir) {
    $docs = Get-ChildItem -Path $DocsSourceDir -File
    foreach ($doc in $docs) {
        Copy-Item -LiteralPath $doc.FullName -Destination $OutputDir -Force
        Write-Host "  + $($doc.Name)" -ForegroundColor Gray
    }
    if ($docs.Count -eq 0) {
        Write-Host "WARNING: no docs found in $DocsSourceDir" -ForegroundColor Yellow
    }
} else {
    Write-Host "WARNING: docs source dir not found: $DocsSourceDir" -ForegroundColor Yellow
}

# ========== Step 9: Verify build ==========
Write-Host "[9/10] Verifying build..." -ForegroundColor Yellow

$errors = @()

if (-not (Test-Path $newExe)) { $errors += "BNotes.exe missing" }
if (-not (Test-Path (Join-Path $AppDir "package.json"))) { $errors += "resources\app\package.json missing" }
if (-not (Test-Path (Join-Path $AppDir "electron\main.js"))) { $errors += "resources\app\electron\main.js missing" }
if (-not (Test-Path (Join-Path $AppDir "backend-node\server.js"))) { $errors += "resources\app\backend-node\server.js missing" }
if (-not (Test-Path (Join-Path $AppDir "dist\index.html"))) { $errors += "resources\app\dist\index.html missing" }
if (-not (Test-Path (Join-Path $AppDir "node_modules"))) { $errors += "resources\app\node_modules missing" }

$dataInApp = Join-Path $AppDir "data"
if (Test-Path $dataInApp) {
    $errors += "resources\app\data should not exist (user data must not be packaged)"
}

if ($rceditApplied -eq $false) { $errors += "brand icon not applied" }

if ($errors.Count -gt 0) {
    Write-Host "Verification FAILED:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

$outputSize = (Get-ChildItem -Path $OutputDir -Recurse | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($outputSize / 1MB, 1)
Write-Host "  Build verified ($sizeMB MB)" -ForegroundColor Green

# ========== Step 10: Build share zip (no user data) ==========
Write-Host "[10/10] Building share zip (excluding user data)..." -ForegroundColor Yellow

$stage = Join-Path $ProjectRoot "release\_share_stage"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null

$ErrorActionPreference = "Continue"
robocopy $OutputDir (Join-Path $stage "BNotes") /E /NFL /NDL /NJH /NJS /NC /NS /NP
$ErrorActionPreference = "Stop"

# Strip user data from the share copy (top-level dirs only, node_modules untouched)
foreach ($userDataDir in @("data", "exports", "userdata")) {
    $p = Join-Path $stage "BNotes\$userDataDir"
    if (Test-Path $p) { Remove-Item $p -Recurse -Force }
}

if (-not (Get-ChildItem -Path $ShareDir -ErrorAction SilentlyContinue)) {
    New-Item -ItemType Directory -Force -Path $ShareDir | Out-Null
}
$zipPath = Join-Path $ShareDir "BNotes${BrandName}V$version-win.zip"
Compress-Archive -Path (Join-Path $stage "BNotes") -DestinationPath $zipPath -Force
Remove-Item $stage -Recurse -Force

$zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host "  Share zip: $zipPath ($zipSize MB)" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Self-use copy : $OutputDir" -ForegroundColor White
Write-Host "  Share zip     : $zipPath ($zipSize MB)" -ForegroundColor White
Write-Host "  Executable    : BNotes.exe (brand icon v$version)" -ForegroundColor White
Write-Host ""
Write-Host "  User data lives in data/ next to BNotes.exe" -ForegroundColor Cyan
Write-Host "  Updating: re-run this script, user data is preserved" -ForegroundColor Cyan
Write-Host ""
