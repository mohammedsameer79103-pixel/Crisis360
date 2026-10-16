@echo off
setlocal
 title Crisis360 - Backend Engine
cd /d "%~dp0"
echo ============================================================
echo   CRISIS360 - FASTAPI BACKEND
echo ============================================================
where python >nul 2>nul
if errorlevel 1 (
  where py >nul 2>nul
  if errorlevel 1 (
    echo ERROR: Python was not found. Install Python 3.11+ and enable Add Python to PATH.
    pause
    exit /b 1
  ) else (
    set "PYTHON_CMD=py -3"
  )
) else (
  set "PYTHON_CMD=python"
)
if not exist "backend\main.py" (
  echo ERROR: backend\main.py was not found in %CD%.
  pause
  exit /b 1
)
%PYTHON_CMD% -c "import fastapi, uvicorn, networkx, numpy" >nul 2>nul
if errorlevel 1 (
  echo Backend dependencies are missing. Installing requirements.txt...
  %PYTHON_CMD% -m pip install -r requirements.txt
  if errorlevel 1 (
    echo ERROR: Could not install backend dependencies. Read the error above.
    pause
    exit /b 1
  )
)
echo Starting API service at http://127.0.0.1:8000
echo Keep this window open while using Crisis360.
%PYTHON_CMD% -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
if errorlevel 1 echo ERROR: Backend stopped. Read the error above.
pause
endlocal
