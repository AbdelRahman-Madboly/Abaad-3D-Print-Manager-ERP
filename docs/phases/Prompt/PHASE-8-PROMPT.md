# Phase 8 — Packaging (PyInstaller)
> **Type:** build tooling. No app code changes.
> **Session start:** `cat docs/CLAUDE.md` then this file.
> **Prerequisite:** Phase 7 complete. App fully working and documented.
> **Branch:** `chore/phase-8-packaging` off `develop`

---

## Goal

Produce a self-contained distributable for each OS that a non-technical
user can download and run without installing Python:
- **Ubuntu:** a folder bundle (`dist/abaad-erp/`) with a `run.sh` launcher
- **Windows:** a single `.exe` or folder bundle with a `Launch_App.bat`

> **Important:** PyInstaller must be run on the target OS.
> The Ubuntu build is done on your dev machine.
> The Windows build must be done on a Windows machine or VM.
> This phase covers Ubuntu only — Windows packaging is Phase 8b (future).

---

## Tasks

### Task 1 — Install PyInstaller into the project venv

```bash
# Activate venv first
source .venv/bin/activate

# Add to pyproject.toml dev deps
# Then install
pip install pyinstaller
```

Add `pyinstaller` to `pyproject.toml` dev extras:
```toml
[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "ruff>=0.4",
    "pyinstaller>=6.0",
]
```

### Task 2 — Create the PyInstaller spec file

Create `abaad-erp.spec` at the repo root. Do not use `pyinstaller main.py`
directly — a spec file gives full control:

```python
# abaad-erp.spec
# Run with: pyinstaller abaad-erp.spec

import sys
from pathlib import Path

ROOT = Path(spec_dir)  # PyInstaller sets spec_dir automatically

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=[str(ROOT)],
    binaries=[],
    datas=[
        # Include assets folder
        (str(ROOT / 'assets'), 'assets'),
        # Include an empty data/ folder template
        (str(ROOT / 'data' / '.gitkeep'), 'data'),
    ],
    hiddenimports=[
        # Tkinter backends needed on Linux
        'tkinter',
        'tkinter.ttk',
        'tkinter.filedialog',
        'tkinter.messagebox',
        # reportlab internals that PyInstaller misses
        'reportlab.graphics.barcode',
        'reportlab.pdfbase.pdfmetrics',
        'reportlab.pdfbase.ttfonts',
        # PIL
        'PIL._tkinter_finder',
        # matplotlib backend for Tkinter
        'matplotlib.backends.backend_tkagg',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['test', 'tests', 'pytest', 'ruff'],
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zlib_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='abaad-erp',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,  # no terminal window
    icon=str(ROOT / 'assets' / 'Abaad.png'),
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='abaad-erp',
)
```

### Task 3 — Build the Ubuntu bundle

```bash
source .venv/bin/activate
pyinstaller abaad-erp.spec --clean
```

This produces `dist/abaad-erp/` folder.

### Task 4 — Test the bundle

```bash
# Run the bundled app directly
./dist/abaad-erp/abaad-erp
```

Check:
- Does it launch without errors?
- Does the setup wizard appear on first run?
- Do all tabs load?
- Does PDF generation work?
- Are assets (logo, icon) present?

Fix any issues found. Common ones:
- Missing `hiddenimports` → add to spec and rebuild
- Missing data files → add to `datas` in spec
- Font errors → add font files to `datas`

Repeat until the bundled app works fully.

### Task 5 — Bundle launcher script

Create `scripts/run_bundle_linux.sh` for the dist folder:
```bash
#!/usr/bin/env bash
# Run Abaad ERP from the bundled distribution
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"$SCRIPT_DIR/dist/abaad-erp/abaad-erp" "$@"
```

### Task 6 — Bundle size report

```bash
du -sh dist/abaad-erp/
find dist/abaad-erp/ -name "*.so" | head -20  # largest shared libs
```

Report the total size. If over 200MB, identify the largest components
and note whether any could be excluded (e.g. matplotlib if charts are
optional, pytesseract if OCR isn't used in this version).

### Task 7 — `Makefile` for build automation

Create a simple `Makefile` so build commands are documented and repeatable:

```makefile
.PHONY: install test lint build clean

install:
	pip install -e ".[dev]"

test:
	pytest -q

lint:
	ruff check src/ tests/ main.py

build:
	pyinstaller abaad-erp.spec --clean

clean:
	rm -rf dist/ build/ *.spec.bak __pycache__

run:
	python main.py

run-bundle:
	./dist/abaad-erp/abaad-erp
```

---

## Acceptance criteria

- [ ] `pyinstaller abaad-erp.spec --clean` completes without errors.
- [ ] `./dist/abaad-erp/abaad-erp` launches the app on Ubuntu.
- [ ] Setup wizard fires on first run of the bundle (no existing `data/abaad_v5.db`).
- [ ] All tabs load in the bundle.
- [ ] PDF generation works in the bundle.
- [ ] `abaad-erp.spec` is committed to the repo.
- [ ] `Makefile` is committed to the repo.
- [ ] Bundle size reported.
- [ ] `dist/` and `build/` are in `.gitignore`.

---

## `.gitignore` additions

```bash
echo "dist/" >> .gitignore
echo "build/" >> .gitignore
echo "*.spec.bak" >> .gitignore
```

---

## Git commits

```
chore(pyproject): add pyinstaller to dev dependencies
chore(build): add abaad-erp.spec PyInstaller spec file
chore(build): add Makefile with install/test/lint/build/clean targets
chore(gitignore): add dist/ and build/ to .gitignore
docs(build): add bundle size report and build notes to CHANGELOG
```

---

## Completion Report

```markdown
# Phase 8 Completion Report — Packaging

## Summary

## Build result
Did `pyinstaller abaad-erp.spec` complete without errors?

## Bundle test results
- App launches: yes/no
- Wizard fires: yes/no
- All tabs load: yes/no
- PDF generation works: yes/no
- Any hidden import issues found and fixed: list

## Bundle size
Total size of dist/abaad-erp/

## Files Added / Changed

## Git Commits

## Acceptance Criteria Status
- [x] / [ ] each

## Notes on Windows packaging (Phase 8b)
What would need to happen differently on Windows.

## Open Questions / Notes for Master Chat
```
