@echo off
cd /d "%~dp0"

echo 🌾 AgriStack Backend Launcher
echo ==========================================

if exist "venv\Scripts\activate.bat" (
    echo ✅ Virtual environment found. Activating...
    call venv\Scripts\activate.bat
    
    echo 🚀 Starting server...
    python app.py
) else (
    echo ❌ Virtual environment not found!
    echo Please run 'run_server.py' first or ensure 'venv' is created.
    echo You may need to install Python 3.10-3.12 compatible with libraries.
    pause
)
