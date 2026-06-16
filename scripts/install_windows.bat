@echo off
setlocal
cd /d "%~dp0.."
echo.
echo  ====================================
echo   Abaad ERP -- Windows Installer
echo  ====================================
echo.

:: Python check
python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python not found.
    echo  Download and install from https://www.python.org/downloads/
    echo  Make sure to check "Add Python to PATH" during install.
    echo.
    pause
    exit /b 1
)

:: Tkinter check (bundled with Python on Windows, but verify)
python -c "import tkinter" >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Tkinter not available.
    echo  Reinstall Python from python.org and ensure the full install is selected.
    pause
    exit /b 1
)

:: Create venv
if not exist ".venv" (
    echo  Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo  ERROR: Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo  Virtual environment created.
) else (
    echo  Virtual environment already exists.
)

:: Install deps
echo  Installing dependencies (this may take a minute)...
.venv\Scripts\pip install -q --upgrade pip
.venv\Scripts\pip install -q -e .
if errorlevel 1 (
    echo  ERROR: Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo  Abaad ERP is ready!
echo  Double-click Launch_App.bat to start the application.
echo.
pause
