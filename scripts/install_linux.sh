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
