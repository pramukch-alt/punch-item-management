@echo off
echo ==========================================
echo    Punch Item List - System Startup
echo ==========================================
echo.

echo Starting Backend Server...
start "Punch Item Backend" cmd /k "cd /d D:\Punch Item List\apps\backend && npm run dev"

echo Starting Frontend Server...
start "Punch Item Frontend" cmd /k "cd /d D:\Punch Item List\apps\frontend && npm run dev -- --host"

echo.
echo ==========================================
echo    System is starting up!
echo    - Backend will run on port 3001
echo    - Frontend will run on port 5173
echo    (You can access it via http://localhost:5173 or your IP)
echo ==========================================
pause
