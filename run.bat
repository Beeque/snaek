@echo off
setlocal

set "PORT=3000"
if not "%~1"=="" set "PORT=%~1"

where python >nul 2>nul
if errorlevel 1 (
  echo Python not found in PATH.
  echo Install Python 3 and try again.
  exit /b 1
)

echo Starting Snaek server on port %PORT%...
echo Open: https://%CODESPACE_NAME%-%PORT%.app.github.dev
echo (If not in Codespaces, use http://localhost:%PORT%)
echo.

python -m http.server %PORT%
