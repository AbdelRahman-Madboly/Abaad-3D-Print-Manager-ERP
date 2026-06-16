#!/usr/bin/env bash
# Run Abaad ERP from the bundled distribution (dist/abaad-erp/)
# Usage: bash scripts/run_bundle_linux.sh
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
BUNDLE="$REPO_ROOT/dist/abaad-erp/abaad-erp"

if [ ! -f "$BUNDLE" ]; then
    echo "Bundle not found. Run: pyinstaller abaad-erp.spec --clean" >&2
    exit 1
fi

exec "$BUNDLE" "$@"
