@echo off
cd /d "%~dp0.."
title ARCANE - Integrated Launcher
color 0B

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║                                                  ║
echo  ║   🚀 ARCANE : MULTI-AGENT ARCHITECTURE           ║
echo  ║   Status: 0.1.0-ALPHA                            ║
echo  ║                                                  ║
echo  ╚══════════════════════════════════════════════════╝
echo.

REM ── 1. Check Dependencies ────────────────────────────────────
echo [1/4] Checking Ollama Service...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Ollama is running
) else (
    echo ✗ Ollama is not detected!
    echo   Please start Ollama serve before continuing.
    pause
    exit /b 1
)

REM ── 2. Start Backend ─────────────────────────────────────────
echo [2/4] Initialising ARCANE Backend...
start "ARCANE Backend" cmd /k "cd /d backend && title ARCANE Backend && venv\Scripts\activate && python main.py"

REM Wait for backend to warm up
echo     Waiting for internal cores to sync...
timeout /t 5 /nobreak >nul

REM ── 3. Start Frontend ────────────────────────────────────────
echo [3/4] Launching ARCANE Interface...
start "ARCANE UI" cmd /k "cd /d . && title ARCANE UI && npm run dev"

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║   ✓ SYSTEM ONLINE AND OPERATIONAL                ║
echo  ╚══════════════════════════════════════════════════╝
echo.
echo  Access Points:
echo  → Interface: http://localhost:5173
echo  → Backend:   http://localhost:8000
echo  → API Docs:  http://localhost:8000/docs
echo.
echo  [4/4] Monitoring processes... 
echo  Close the individual windows to stop services.
echo.
pause
