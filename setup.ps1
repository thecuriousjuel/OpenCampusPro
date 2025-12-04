Write-Host "Starting Student Management System Setup..." -ForegroundColor Cyan

# Check for Python
if (Get-Command python -ErrorAction SilentlyContinue) {
    $PYTHON_CMD = "python"
} else {
    Write-Host "Error: Python is not installed." -ForegroundColor Red
    exit 1
}

# Check for Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Node.js is not installed." -ForegroundColor Red
    exit 1
}

# Check for npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npm is not installed." -ForegroundColor Red
    exit 1
}

Write-Host "Prerequisites check passed." -ForegroundColor Green

# Backend Setup
Write-Host "Setting up Backend..." -ForegroundColor Cyan
Set-Location backend

if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    & $PYTHON_CMD -m venv venv
}

# Activate venv
if (Test-Path "venv\Scripts\Activate.ps1") {
    . .\venv\Scripts\Activate.ps1
} else {
    Write-Host "Error: Could not activate virtual environment." -ForegroundColor Red
    exit 1
}

Write-Host "Installing backend dependencies..."
pip install -r requirements.txt

# Start Backend in background
Write-Host "Starting Backend Server..."
$BackendProcess = Start-Process -FilePath "python" -ArgumentList "app.py" -PassThru -WindowStyle Hidden
Write-Host "Backend started (ID: $($BackendProcess.Id))" -ForegroundColor Green

Set-Location ..

# Frontend Setup
Write-Host "Setting up Frontend..." -ForegroundColor Cyan
Set-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..."
    npm install
}

# Start Frontend
Write-Host "Starting Frontend Server..."
# Using Start-Process for npm run dev might be tricky to kill later cleanly in PS without a separate window, 
# but for simplicity we'll launch it. 
# Note: 'npm run dev' usually runs a script. We might need 'cmd /c npm run dev' or similar.
$FrontendProcess = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -PassThru -WindowStyle Hidden
Write-Host "Frontend started (ID: $($FrontendProcess.Id))" -ForegroundColor Green

# Open Browser
Write-Host "Opening Application..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"

Write-Host "Application is running!" -ForegroundColor Green
Write-Host "Press Enter to stop the servers..."

Read-Host

# Cleanup
Write-Host "Stopping servers..." -ForegroundColor Cyan
Stop-Process -Id $BackendProcess.Id -ErrorAction SilentlyContinue
Stop-Process -Id $FrontendProcess.Id -ErrorAction SilentlyContinue
Write-Host "Servers stopped." -ForegroundColor Green
