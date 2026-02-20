@echo off
echo ==========================================
echo  AGROW Lens - Full Stack Startup
echo ==========================================
echo.

echo [1/3] Starting Python AI Server (Flask - Port 5000)...
start "AGROW - AI Engine" cmd /k "cd /d "%~dp0agrow-platform\py-backend" && python app.py"

timeout /t 3 /nobreak > nul

echo [2/3] Starting Node.js Backend (Port 3001)...
start "AGROW - Node Backend" cmd /k "cd /d "%~dp0" && npm run dev:backend"

timeout /t 3 /nobreak > nul

echo [3/3] Starting Next.js Frontend (Port 3000)...
start "AGROW - Frontend" cmd /k "cd /d "%~dp0" && npm run dev:frontend"

echo.
echo ==========================================
echo  All servers starting! Open your browser:
echo  http://localhost:3000
echo ==========================================
pause
