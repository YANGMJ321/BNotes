# BNotes 构建脚本
# 用法: .\build.ps1 [-Release] [-Patch] [-Minor] [-Major] [-WebOnly] [-DesktopOnly]

param(
    [switch]$Release,          # 正式发布模式
    [switch]$Patch,            # 递增修订版本
    [switch]$Minor,            # 递增次版本
    [switch]$Major,            # 递增主版本
    [switch]$WebOnly,          # 仅构建网页版
    [switch]$DesktopOnly       # 仅构建桌面版
)

$ErrorActionPreference = "Stop"

# 颜色定义
function Write-Step { param($msg) Write-Host "🔄 $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Yellow }

# 获取当前版本
$configPath = Join-Path $PSScriptRoot "version.config.json"
$config = Get-Content $configPath -Raw | ConvertFrom-Json
$currentVersion = $config.release.current

Write-Info "当前版本: $currentVersion"

# 版本号处理
if ($Patch -or $Minor -or $Major) {
    $versionParts = $currentVersion -split '\.'
    $major = [int]$versionParts[0]
    $minor = [int]$versionParts[1]
    $patch = [int]$versionParts[2]

    if ($Major) { $major++; $minor = 0; $patch = 0 }
    elseif ($Minor) { $minor++; $patch = 0 }
    elseif ($Patch) { $patch++ }

    $newVersion = "$major.$minor.$patch"
    Write-Info "新版本: $newVersion"

    # 更新配置文件
    $config.release.current = $newVersion
    $config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8

    # 更新 package.json
    $packagePath = Join-Path $PSScriptRoot "package.json"
    $package = Get-Content $packagePath -Raw | ConvertFrom-Json
    $package.version = $newVersion
    $package | ConvertTo-Json -Depth 10 | Set-Content $packagePath -Encoding UTF8

    # 更新 README
    $readmePath = Join-Path $PSScriptRoot "README.md"
    $readme = Get-Content $readmePath -Raw
    $readme = $readme -replace '\*\*(版本|Version)\*\*:?\s*\d+\.\d+\.\d+', "**版本**: $newVersion"
    Set-Content $readmePath $readme -Encoding UTF8

    Write-Success "版本号已更新"
}

# 激活 Node.js
Write-Step "激活 Node.js 24.15.0..."
$env:Path = "F:\SOFT\C\nvm\v24.15.0;$env:Path"
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
$env:npmmirror = "https://npmmirror.com/mirrors/"
$nvmPath = "F:\SOFT\C\nvm\v24.15.0\npm.cmd"
$nodePath = "F:\SOFT\C\nvm\v24.15.0\node.exe"

# 清理旧构建
Write-Step "清理旧构建文件..."
$distPath = Join-Path $PSScriptRoot "dist"
if (Test-Path $distPath) {
    Remove-Item -Path $distPath -Recurse -Force
}
$releasePath = Join-Path $PSScriptRoot "release"
if (Test-Path $releasePath) {
    Remove-Item -Path $releasePath -Recurse -Force
}

# 创建目录
New-Item -Path $distPath -ItemType Directory -Force | Out-Null
New-Item -Path $releasePath -ItemType Directory -Force | Out-Null

# 构建网页版
if (-not $DesktopOnly) {
    Write-Step "构建网页版..."
    & $nvmPath run build
    if ($LASTEXITCODE -ne 0) { throw "网页构建失败" }
    Write-Success "网页版构建完成"
}

# 构建桌面版
if (-not $WebOnly) {
    Write-Step "构建桌面版..."
    & $nvmPath run dist
    if ($LASTEXITCODE -ne 0) { throw "桌面版构建失败" }
    Write-Success "桌面版构建完成"
}

# 生成版本信息
Write-Step "生成版本信息..."
$versionInfo = @{
    version = $config.release.current
    buildTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    buildNumber = Get-Date -Format "yyyyMMddHHmmss"
    channel = if ($Release) { "stable" } else { "dev" }
} | ConvertTo-Json

$versionInfo | Set-Content (Join-Path $distPath "version.json") -Encoding UTF8

Write-Success "版本信息已生成"
Write-Success "构建完成！"
Write-Host ""
Write-Host "输出目录: $releasePath" -ForegroundColor Green
Write-Host "版本号: $($config.release.current)" -ForegroundColor Green
