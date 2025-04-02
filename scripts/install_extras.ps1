# Install yt-dlp and display a warning for lune-org/lune on Windows

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

# Display warning for lune-org/lune
Write-Host "WARNING: lune-org/lune cannot be easily installed on a Windows OS using this script. Please manually install it from the instructions provided at https://lune-org.github.io/docs/getting-started/1-installation" -ForegroundColor Red

Write-Host "Installation process completed!" -ForegroundColor Cyan
