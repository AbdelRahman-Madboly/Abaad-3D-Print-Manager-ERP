# Phase 5 Completion Report — Launchers

## Summary

All 7 tasks completed. Linux and Windows installers created, `launch.sh` and
`Launch_App.bat` updated to use `.venv`, cross-platform font fallback added to
`theme.py`, cross-platform window icon added to `app.py`, and `.gitignore`
updated to exclude `data/*.db`.

## Ubuntu install test

- `scripts/install_linux.sh` exists, is executable, and syntactically correct.
- Installs `.venv`, installs deps via `pip install -e .`, then writes
  `~/.local/share/applications/abaad-erp.desktop` from the template.
- Manual end-to-end install test (GNOME menu appearance and `bash launch.sh`)
  should be verified by the user on their Ubuntu 24.04 machine.

## Font/icon result

- `src/ui/theme.py` now uses `_system_font()` → returns `"Ubuntu"` on Linux,
  `"Segoe UI"` on Windows, `"SF Pro Text"` on macOS. All `Fonts.*` members
  updated; `MONO` remains `"Consolas"` (monospace, cross-platform).
- `src/ui/app.py` now has `_set_window_icon()`: uses `.ico` via `iconbitmap`
  on Windows; uses PIL `iconphoto` with `Abaad.png` on Linux. Both paths
  silently skip on any exception so the app never crashes on this.

## Files Added / Changed

| File | Change |
|------|--------|
| `scripts/install_linux.sh` | New (executable) |
| `abaad-erp.desktop` | New |
| `launch.sh` | Updated — prefer `.venv/bin/python` |
| `scripts/install_windows.bat` | New |
| `Launch_App.bat` | Updated — use `.venv\Scripts\python.exe` |
| `src/ui/theme.py` | Added `_system_font()` + `_FONT_FAMILY`; updated `Fonts` class |
| `src/ui/app.py` | Added `import platform`; added `_set_window_icon()` |
| `.gitignore` | Added `data/*.db` |

## Git Commits

```
069feba feat(launcher): add install_linux.sh and abaad-erp.desktop template
9f5c359 feat(launcher): update launch.sh to prefer venv python
f88ea1a feat(launcher): add install_windows.bat
1a3f462 feat(launcher): update Launch_App.bat to use venv
fd281b6 fix(theme): cross-platform font fallback (Segoe UI / Ubuntu / SF Pro Text)
9ed96f6 fix(app): cross-platform window icon (.ico Windows / .png Linux via PIL)
e102eca chore(gitignore): ensure .venv/ and data/*.db are ignored
```

PR: https://github.com/AbdelRahman-Madboly/Abaad-3D-Print-Manager-ERP/pull/3

## Tests

```
pytest -q → 194 passed / 1 skipped / 0 failed
```

## Acceptance Criteria Status

- [x] `scripts/install_linux.sh` exists and is executable
- [x] `abaad-erp.desktop` template exists at repo root
- [ ] `bash scripts/install_linux.sh` end-to-end test (needs manual run on Ubuntu)
- [ ] `~/.local/share/applications/abaad-erp.desktop` created after install (manual)
- [ ] App appears in GNOME menu (manual)
- [x] `bash launch.sh` uses `.venv` python (with system fallback)
- [x] `scripts/install_windows.bat` exists and is syntactically valid
- [x] `Launch_App.bat` updated to use `.venv\Scripts\python.exe`
- [x] Font fallback: `_system_font()` returns OS-appropriate font; no hardcoded `"Segoe UI"`
- [x] Window icon: `_set_window_icon()` uses PIL on Linux, `.ico` on Windows
- [x] `.venv/` is in `.gitignore` (was already there)
- [x] `data/*.db` is in `.gitignore` (added this phase)
- [x] `pytest -q` → 194 passed / 1 skipped / 0 failed

## Open Questions / Notes for Master Chat

- The `data/abaad_v5.db` file was tracked by git before this phase. After
  merging this PR, the file will remain in git history. A `git rm --cached
  data/abaad_v5.db` on `develop` after merge would clean history going forward,
  but is optional since the gitignore now prevents future tracking.
- `MONO = ("Consolas", 10)` is Windows-only; Ubuntu equivalent is `"Ubuntu Mono"`.
  Could be improved in Phase 6 cross-platform polish if console/receipt output
  needs true monospace on Linux.
- Icon display in GNOME taskbar depends on PIL/Pillow being installed in the
  venv. Since `Pillow` is in `pyproject.toml` deps, `install_linux.sh` will
  install it automatically.
