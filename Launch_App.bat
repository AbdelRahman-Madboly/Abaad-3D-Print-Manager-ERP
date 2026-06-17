@echo off
cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe main.py
) else (
    echo  No virtual environment found.
    echo  Please run scripts\install_windows.bat first.
    echo.
    python main.py
)
