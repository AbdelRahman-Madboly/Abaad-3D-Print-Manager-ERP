# abaad-erp.spec
# PyInstaller spec for Abaad ERP v5.0 — Ubuntu bundle
#
# Build:  pyinstaller abaad-erp.spec --clean
# Output: dist/abaad-erp/  (directory bundle)
#
# Run on Ubuntu; for Windows packaging see Phase 8b notes.

from pathlib import Path

ROOT = Path(SPECPATH)  # noqa: F821 — PyInstaller injects SPECPATH

a = Analysis(
    [str(ROOT / "main.py")],
    pathex=[str(ROOT)],
    binaries=[],
    datas=[
        # Bundled assets (logo + icon)
        (str(ROOT / "assets"), "assets"),
        # Empty data directory so the app can write its DB on first run
        (str(ROOT / "data" / ".gitkeep"), "data"),
    ],
    hiddenimports=[
        # Tkinter — usually auto-detected, listed explicitly for safety
        "tkinter",
        "tkinter.ttk",
        "tkinter.filedialog",
        "tkinter.messagebox",
        "tkinter.simpledialog",
        "tkinter.colorchooser",
        # ReportLab internals that PyInstaller sometimes misses
        "reportlab.graphics.barcode",
        "reportlab.pdfbase.pdfmetrics",
        "reportlab.pdfbase.ttfonts",
        "reportlab.pdfbase._fontdata",
        "reportlab.lib.rl_accel",
        # Pillow Tkinter bridge
        "PIL._tkinter_finder",
        # Matplotlib Tkinter backend
        "matplotlib.backends.backend_tkagg",
        "matplotlib.backends.backend_agg",
        # sqlite3 — usually bundled; list to be safe
        "sqlite3",
        # pypdf (used by tests; include so future in-app PDF reading works)
        "pypdf",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        # Dev / test tooling — never needed at runtime
        "pytest",
        "pytest_cov",
        "ruff",
        "pyinstaller",
    ],
    noarchive=False,
)

pyz = PYZ(a.pure)  # noqa: F821 — PyInstaller 6.x: no cipher, no zlib_data arg

exe = EXE(  # noqa: F821
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="abaad-erp",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,   # no terminal window
    icon=str(ROOT / "assets" / "Abaad.png"),
)

coll = COLLECT(  # noqa: F821
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="abaad-erp",
)
