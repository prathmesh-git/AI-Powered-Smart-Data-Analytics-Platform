@echo off
echo ======================================================
echo  Lighthouse AI - MERN Stack Startup
echo ======================================================
echo.
echo Starting Backend (Express + MongoDB) on port 5000...
start "Backend" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 3 /nobreak > nul
echo Starting Frontend (React + Vite) on port 5173...
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
echo.
echo ✅ Both servers starting...
echo    Backend:  http://localhost:5000
echo    Frontend: http://localhost:5173
echo.
echo Login credentials:
echo    prem / p123
echo    admin / admin123
echo.
timeout /t 3 /nobreak > nul
start "" "http://localhost:5173"
