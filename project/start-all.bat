@echo off
setlocal
 title Launch Crisis360 Platform
cd /d "%~dp0"
cls
echo ============================================================
echo   CRISIS360: INTELLIGENT DISASTER SIMULATION ^& RESPONSE
echo ============================================================
echo.
if not exist "backend\main.py" (
  echo ERROR: backend\main.py was not found. Run this file from the extracted project folder.
  pause
  exit /b 1
)
if not exist "frontend\package.json" (
  echo ERROR: frontend\package.json was not found. The ZIP may not be fully extracted.
  pause
  exit /b 1
)
echo 1. Starting FastAPI + NetworkX Simulation Backend on port 8000...
start "Crisis360 Backend" /D "%~dp0" cmd /k "call start-backend.bat"
echo 2. Starting React + Three.js Frontend on port 3000...
start "Crisis360 Frontend" /D "%~dp0" cmd /k "call start-frontend.bat"
echo.
echo Services are starting in separate terminal windows.
echo   - Digital Twin UI: http://localhost:3000
echo   - Simulation API:  http://127.0.0.1:8000/docs
echo.
echo Wait until the frontend terminal says VITE ready before opening the UI.
timeout /t 8 >nul
start "" "http://localhost:3000"
endlocal
