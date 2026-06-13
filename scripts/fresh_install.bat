@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0.."

echo ===================================================
echo     Arcane12 Fresh Install Script
echo ===================================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please download and install Python from https://www.python.org/downloads/
    pause
    exit /b 1
)

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Enforce User Rule: if downloading any models download into a .model dir in project root
echo Checking for .model directory...
if not exist ".model" (
    mkdir ".model"
    echo Created .model directory for model downloads.
) else (
    echo .model directory already exists.
)

echo.
echo [1/4] Installing Frontend Dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Node.js dependencies.
    pause
    exit /b 1
)

echo.
echo [2/4] Setting up Python Virtual Environment...
cd backend
if not exist "venv" (
    python -m venv venv
    echo Virtual environment created in backend\venv.
) else (
    echo Virtual environment already exists.
)

echo.
echo [3/4] Installing Backend Dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b 1
)
cd ..

echo.
echo [4/4] Setting up Environment Variables...
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env
        echo Copied .env.example to .env
    ) else (
        echo Creating empty .env file
        type nul > .env
    )
) else (
    echo Frontend .env already exists.
)

if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy backend\.env.example backend\.env
        echo Copied backend\.env.example to backend\.env
    ) else (
        echo Creating empty backend\.env file
        type nul > backend\.env
    )
) else (
    echo Backend .env already exists.
)

echo.
echo ===================================================
echo   Installation Complete!
echo   You can now run the system using run.bat
echo   Note: Any downloaded models should go to the .model dir.
echo ===================================================
pause
