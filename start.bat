@echo off
echo Starting Micollab Backend...
start "Micollab Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 3
echo Starting Micollab Frontend...
start "Micollab Frontend" cmd /k "cd /d %~dp0client && npm run dev"
echo.
echo Both servers started!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause
