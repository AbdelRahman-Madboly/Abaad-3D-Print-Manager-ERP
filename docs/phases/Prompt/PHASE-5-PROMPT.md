# Phase 5 — Launchers (Ubuntu + Windows)
> **Type:** tooling. Minimal app code changes (font/icon fixes only).
> **Session start:** `cat docs/CLAUDE.md` then this file.
> **Prerequisite:** Phase 4 complete — `pytest -q` baseline is **194 passed / 1 skipped / 0 failed**. CI wired (verify Actions tab green on next push). Also fix `data/abaad_v5.db` gitignore at the start of this phase (carried from Phase 4).
> **Branch:** `feature/phase-5-launchers` off `develop`

---

## Goal

A non-technical user can go from zero to running Abaad ERP in one action:
- **Ubuntu:** run one shell script → app appears in GNOME application menu
- **Windows:** run one `.bat` file → app is ready, double-click to launch

No Docker. No system Python assumptions beyond Python 3.10+ being installed.
The install script creates a self-contained venv and installs all deps.

---

## Ubuntu tasks

### Task 1 — `scripts/install_linux.sh`

Create this file (make executable: `chmod +x scripts/install_linux.sh`):

```bash
#!/usr/bin/env bash
# Abaad ERP — Linux installer
# Usage: bash scripts/install_linux.sh
# Tested on Ubuntu 24.04 LTS

set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENV_DIR="$REPO_DIR/.venv"
DESKTOP_TEMPLATE="$REPO_DIR/abaad-erp.desktop"
DESKTOP_DEST="$HOME/.local/share/applications/abaad-erp.desktop"
ICON_PATH="$REPO_DIR/assets/Abaad.png"

echo ""
echo "╔══════════════════════════════════╗"
echo "║   Abaad ERP — Linux Installer   ║"
echo "╚══════════════════════════════════╝"
echo ""

# ── Python check ──────────────────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
    echo "❌  ERROR: python3 not found."
    echo "    Install it with: sudo apt install python3"
    exit 1
fi

PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)

if [ "$PYTHON_MAJOR" -lt 3 ] || { [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 10 ]; }; then
    echo "❌  ERROR: Python 3.10+ required. Found: $PYTHON_VERSION"
    exit 1
fi

echo "✔  Python $PYTHON_VERSION found"

# ── Tkinter check ─────────────────────────────────────────────────────────
if ! python3 -c "import tkinter" &>/dev/null; then
    echo "❌  ERROR: Tkinter not found."
    echo "    Install it with: sudo apt install python3-tk"
    exit 1
fi
echo "✔  Tkinter found"

# ── Virtual environment ────────────────────────────────────────────────────
if [ ! -d "$VENV_DIR" ]; then
    echo "→  Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
    echo "✔  Virtual environment created at .venv/"
else
    echo "✔  Virtual environment already exists"
fi

# ── Dependencies ──────────────────────────────────────────────────────────
echo "→  Installing dependencies (this may take a minute)..."
"$VENV_DIR/bin/pip" install -q --upgrade pip
"$VENV_DIR/bin/pip" install -q -e "$REPO_DIR"
echo "✔  Dependencies installed"

# ── Desktop launcher ──────────────────────────────────────────────────────
echo "→  Installing desktop launcher..."
mkdir -p "$HOME/.local/share/applications"
sed "s|__REPO_DIR__|$REPO_DIR|g" "$DESKTOP_TEMPLATE" > "$DESKTOP_DEST"
chmod +x "$DESKTOP_DEST"
update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
echo "✔  Desktop launcher installed"

# ── Done ──────────────────────────────────────────────────────────────────
echo ""
echo "✅  Abaad ERP is ready!"
echo ""
echo "   Launch options:"
echo "   • Open your application menu and search for 'Abaad ERP'"
echo "   • Or run: bash launch.sh"
echo ""
```

### Task 2 — `abaad-erp.desktop` template

Create at repo root (this is a template — `__REPO_DIR__` is replaced by
the installer):

```ini
[Desktop Entry]
Version=1.0
Type=Application
Name=Abaad ERP
GenericName=3D Print Shop Manager
Comment=Manage orders, inventory, customers and finances for your 3D printing business
Exec=bash -c "cd __REPO_DIR__ && __REPO_DIR__/.venv/bin/python main.py"
Icon=__REPO_DIR__/assets/Abaad.png
Terminal=false
Categories=Office;Finance;
Keywords=ERP;3D print;orders;inventory;
StartupNotify=true
StartupWMClass=abaad-erp
```

### Task 3 — `launch.sh` — update to use venv

Replace or update the existing `launch.sh`:

```bash
#!/usr/bin/env bash
# Abaad ERP launcher
# Run this directly: bash launch.sh
# Or double-click if your file manager supports .sh execution

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_PYTHON="$SCRIPT_DIR/.venv/bin/python"

if [ -f "$VENV_PYTHON" ]; then
    exec "$VENV_PYTHON" "$SCRIPT_DIR/main.py" "$@"
else
    echo "⚠  No virtual environment found. Run: bash scripts/install_linux.sh"
    echo "   Falling back to system python3..."
    exec python3 "$SCRIPT_DIR/main.py" "$@"
fi
```

Make executable: `chmod +x launch.sh`

---

## Windows tasks

### Task 4 — `scripts/install_windows.bat`

Create (or rewrite `SETUP.bat`) as `scripts/install_windows.bat`:

```bat
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
```

### Task 5 — `Launch_App.bat` — update to use venv

Replace or update `Launch_App.bat`:

```bat
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
```

---

## Cross-platform app fixes

### Task 6 — Font fallback chain in `theme.py`

Tkinter uses system fonts. `"Segoe UI"` only exists on Windows.
On Ubuntu, `"Ubuntu"` is the correct system font.

Find all `Fonts.*` definitions in `src/ui/theme.py`. Replace hardcoded
font families with a platform-aware function:

```python
import platform
import sys

def _system_font() -> str:
    """Return the best available UI font for the current OS."""
    system = platform.system()
    if system == "Windows":
        return "Segoe UI"
    elif system == "Darwin":
        return "SF Pro Text"
    else:  # Linux / Ubuntu
        return "Ubuntu"

_FONT_FAMILY = _system_font()
```

Then define font tuples using `_FONT_FAMILY`:
```python
class Fonts:
    SMALL       = (_FONT_FAMILY, 9)
    BODY        = (_FONT_FAMILY, 10)
    HEADER      = (_FONT_FAMILY, 11, "bold")
    TITLE       = (_FONT_FAMILY, 14, "bold")
    BUTTON_BOLD = (_FONT_FAMILY, 10, "bold")
    # etc. — match whatever exists
```

After the change, run the app (`python main.py`) and confirm the UI renders
cleanly — no font errors in the console, text is readable.

### Task 7 — Window icon cross-platform in `app.py`

Find `_setup_window()` (or wherever the window icon is set) in `src/ui/app.py`.
Replace with a cross-platform approach:

```python
def _set_window_icon(self) -> None:
    """Set window/taskbar icon — works on both Linux and Windows."""
    try:
        if platform.system() == "Windows":
            self._root.iconbitmap(str(config.ICON_PATH))
        else:
            from PIL import Image, ImageTk
            img = Image.open(str(config.ASSETS_DIR / "Abaad.png"))
            photo = ImageTk.PhotoImage(img)
            self._root.iconphoto(True, photo)
            self._root._icon = photo  # keep reference to prevent GC
    except Exception:
        pass  # icon is cosmetic — never crash on this
```

Add `import platform` to `app.py` if not already there.

---

## `.gitignore` — ensure venv is ignored

```bash
grep "\.venv" .gitignore || echo ".venv/" >> .gitignore
grep "\.venv" .gitignore
```

Also ensure `data/abaad_v5.db` is gitignored (it contains business data):
```bash
grep "abaad_v5.db\|data/\*.db" .gitignore || echo "data/*.db" >> .gitignore
```

---

## Acceptance criteria

- [ ] `bash scripts/install_linux.sh` runs on a fresh clone on Ubuntu 24.04:
      creates `.venv/`, installs deps, installs `.desktop` entry.
      Verify: `ls ~/.local/share/applications/abaad-erp.desktop` exists.
- [ ] After install, `bash launch.sh` starts the app using `.venv` python.
- [ ] After install, app appears in GNOME application menu (search "Abaad").
- [ ] `scripts/install_windows.bat` and `Launch_App.bat` exist and are
      syntactically correct `.bat` files.
- [ ] Font fallback: `python main.py` on Ubuntu shows no font-related
      console errors; UI text is clean.
- [ ] Window icon shows in the Ubuntu GNOME taskbar and title bar.
- [ ] `.venv/` is in `.gitignore`.
- [ ] `pytest -q` → zero failures (report count).

---

## Git commits

```
feat(launcher): add install_linux.sh and abaad-erp.desktop template
feat(launcher): update launch.sh to prefer venv python
feat(launcher): add install_windows.bat
feat(launcher): update Launch_App.bat to use venv
fix(theme): cross-platform font fallback (Segoe UI / Ubuntu / SF Pro Text)
fix(app): cross-platform window icon (.ico Windows / .png Linux via PIL)
chore(gitignore): ensure .venv/ and data/*.db are ignored
```

---

## Completion Report

```markdown
# Phase 5 Completion Report — Launchers

## Summary

## Ubuntu install test
Did install_linux.sh complete without errors?
Does app appear in GNOME menu?
Does bash launch.sh start the app?

## Font/icon result
Any console errors? UI looks clean?

## Files Added / Changed

## Git Commits

## Tests
pytest result: N passed / N skipped / N failed

## Acceptance Criteria Status
- [x] / [ ] each

## Open Questions / Notes for Master Chat
```
