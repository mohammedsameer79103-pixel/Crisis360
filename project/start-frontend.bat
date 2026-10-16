@echo off
setlocal
 title Crisis360 - Frontend Digital Twin
cd /d "%~dp0\frontend"
if errorlevel 1 (
  echo ERROR: Could not enter the frontend folder.
  pause
  exit /b 1
)
echo ============================================================
echo   CRISIS360 - FRONTEND DIGITAL TWIN
echo ============================================================
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js was not found in PATH.
  echo Install the current LTS version from https://nodejs.org/ and reopen this window.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found in PATH. Reinstall Node.js with npm enabled.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  echo Frontend dependencies are missing. Installing from package-lock.json...
  call npm ci
  if errorlevel 1 (
    echo ERROR: npm ci failed. Check your internet connection and package-lock.json.
    pause
    exit /b 1
  )
)
echo Starting Vite server at http://localhost:3000
echo Keep this window open while using Crisis360.
call npm run dev
if errorlevel 1 echo ERROR: Frontend stopped. Read the error above.
pause
endlocal
