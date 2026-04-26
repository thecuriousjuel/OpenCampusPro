Write-Host "Starting OpenCampusPro Setup..." -ForegroundColor Cyan

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

# Start Backend in new window
Write-Host "Starting Backend Server in a new window..."
$BackendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "`"`$host.ui.RawUI.WindowTitle = 'Backend'; .\venv\Scripts\Activate.ps1; python app.py`"" -PassThru
Write-Host "Backend started in new window (ID: $($BackendProcess.Id))" -ForegroundColor Green

Set-Location ..

# Frontend Setup
Write-Host "Setting up Frontend..." -ForegroundColor Cyan
Set-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing frontend dependencies..."
    npm install
}

# Start Frontend in new window
Write-Host "Starting Frontend Server in a new window..."
$FrontendProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "`"`$host.ui.RawUI.WindowTitle = 'Frontend'; npm run dev`"" -PassThru
Write-Host "Frontend started in new window (ID: $($FrontendProcess.Id))" -ForegroundColor Green

# Open Browser
Write-Host "Opening Application..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
Start-Process "http://localhost:5173"

Write-Host "Application is running! You can open it here: http://localhost:5173" -ForegroundColor Green
Write-Host "Press Enter to stop the servers..."

Read-Host

# Cleanup
Write-Host "Stopping servers..." -ForegroundColor Cyan
taskkill /PID $($BackendProcess.Id) /T /F 2>$null
taskkill /PID $($FrontendProcess.Id) /T /F 2>$null
Write-Host "Servers stopped." -ForegroundColor Green
