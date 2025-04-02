# Install yt-dlp and lune-org/lune using PowerShell

# Ensure script runs with administrative privileges
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script must be run as Administrator!" -ForegroundColor Red
    exit 1
}

# Install yt-dlp
Write-Host "Installing yt-dlp..." -ForegroundColor Green
$ytDlpUrl = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
$ytDlpPath = "$env:ProgramFiles\yt-dlp\yt-dlp.exe"

if (-Not (Test-Path -Path $ytDlpPath)) {
    New-Item -ItemType Directory -Force -Path (Split-Path -Path $ytDlpPath)
    Invoke-WebRequest -Uri $ytDlpUrl -OutFile $ytDlpPath
    Write-Host "yt-dlp installed successfully at $ytDlpPath" -ForegroundColor Green
} else {
    Write-Host "yt-dlp is already installed at $ytDlpPath" -ForegroundColor Yellow
}

# Install lune-org/lune
Write-Host "Installing lune-org/lune..." -ForegroundColor Green
$luneRepo = "https://github.com/lune-org/lune.git"
$luneInstallPath = "$env:ProgramFiles\lune"

if (-Not (Test-Path -Path $luneInstallPath)) {
    git clone $luneRepo $luneInstallPath
    Write-Host "lune-org/lune cloned successfully to $luneInstallPath" -ForegroundColor Green
} else {
    Write-Host "lune-org/lune is already installed at $luneInstallPath" -ForegroundColor Yellow
}

Write-Host "Installation process completed!" -ForegroundColor Cyan