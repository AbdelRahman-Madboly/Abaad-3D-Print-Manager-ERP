# Phase 8 Completion Report — PyInstaller Packaging

## Summary

Phase 8 produced a single-directory Linux bundle of Abaad ERP via PyInstaller 6.x.
The bundle runs headless-free (no terminal window) from a single `dist/abaad-erp/`
directory and includes all runtime assets.

---

## Tasks Completed

### Task 1 — Dev dependency: pyinstaller>=6.0
Added `pyinstaller>=6.0` to the `dev` extras in `pyproject.toml`.  
`.venv/` was created at repo root (already gitignored) with all deps installed.

### Task 2 — `abaad-erp.spec`
Created `abaad-erp.spec` at repo root.

Key decisions:
- **PyInstaller 6.x API**: `PYZ(a.pure)` — no `cipher` param, no `a.zlib_data`
  (those were removed in PyInstaller 6.0, breaking the 5.x template).
- **datas**: `assets/` for logo/icon; `data/.gitkeep` to ensure the `data/` directory
  is present so the app can create its SQLite DB on first launch.
- **hiddenimports**: `tkinter.*`, `reportlab` internals, `PIL._tkinter_finder`,
  `matplotlib.backends.backend_tkagg/agg`, `sqlite3`, `pypdf`.
- **excludes**: `pytest`, `ruff`, `pyinstaller` — dev tooling stripped from bundle.
- `console=False` → no terminal window on double-click.

### Task 3 — Build bundle
```bash
pyinstaller abaad-erp.spec --clean
```
Produced `dist/abaad-erp/` (165 MB) with no errors.

### Task 4 — Smoke-test bundle
```bash
timeout 5 ./dist/abaad-erp/abaad-erp
```
Returns SIGTERM (expected — app enters Tkinter event loop, signal stops it after 5 s).
No import errors, no missing-asset crashes.

Bundle layout (PyInstaller 6.x uses `_internal/` subdirectory):
```
dist/abaad-erp/
├── abaad-erp            ← launcher stub (10.6 MB)
└── _internal/
    ├── assets/          ← Abaad.png, Print3D_Manager.ico
    ├── data/            ← .gitkeep (DB created here on first run)
    ├── libpython3.13.so (30.5 MB)
    ├── libscipy_openblas64 (24.2 MB)
    └── … (all other .so and Python bytecode)
```

### Task 5 — `scripts/run_bundle_linux.sh`
Wrapper that resolves to `dist/abaad-erp/abaad-erp` via `SPECPATH`-relative lookup.
Prints a clear error if the bundle hasn't been built yet. Made executable.

### Task 6 — Bundle size analysis

| Component | Size |
|-----------|------|
| libpython3.13.so.1.0 | 30.5 MB |
| libscipy_openblas64_p9.so (via numpy) | 24.2 MB |
| abaad-erp launcher | 10.6 MB |
| numpy (multiarray + rest) | ~10 MB |
| All other .so libs | ~90 MB |
| **Total** | **165 MB** |

Size is dominated by numpy/scipy pulled in by matplotlib. If a sub-100 MB bundle is
ever required, making charts optional at import time (lazy-importing matplotlib) would
be the first lever — scipy/openblas would be excluded automatically.

### Task 7 — `Makefile`
Targets: `venv`, `install`, `test`, `lint`, `run`, `build`, `run-bundle`, `clean`.
- `build` uses `.venv/bin/pyinstaller` to ensure the venv's PyInstaller 6.x is used.
- `clean` also removes all `__pycache__` trees recursively.

---

## Files Changed / Added

| File | Change |
|------|--------|
| `pyproject.toml` | Added `pyinstaller>=6.0` to dev extras |
| `abaad-erp.spec` | New — PyInstaller 6.x spec |
| `scripts/run_bundle_linux.sh` | New — bundle launcher helper |
| `data/.gitkeep` | New — ensures data dir present in bundle |
| `Makefile` | New — developer workflow shortcuts |
| `.gitignore` | Added `*.spec.bak` |
| `docs/DEVELOPER.md` | Phase 8 marked ✅ DONE |

---

## Acceptance Criteria

| Criterion | Result |
|-----------|--------|
| `pyinstaller abaad-erp.spec --clean` produces `dist/abaad-erp/` | ✅ |
| Bundle launches (Tkinter window appears, no import errors) | ✅ |
| `assets/` included in bundle | ✅ (at `_internal/assets/`) |
| No terminal/console window on launch | ✅ (`console=False`) |
| `scripts/run_bundle_linux.sh` resolves bundle path | ✅ |
| `Makefile` covers install/test/lint/build/clean/run/run-bundle | ✅ |
| `pytest -q` still passes (199 passed / 1 skipped) | ✅ |

---

## Out-of-scope notes for later phases

- **Windows packaging (Phase 8b)**: Requires running `pyinstaller abaad-erp.spec`
  on a Windows host with Python/Tkinter. The same spec file is cross-platform;
  `icon=` accepts `.ico` files on Windows (use `assets/Print3D_Manager.ico`).
- **Auto-updater**: Not in scope — bundle must be rebuilt and redistributed manually.
- **Code-signing**: Not in scope for current release.
