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
