# Phase 1 Completion Report — Core Stabilization

## Summary

All 7 tasks completed. The 9 pre-existing test failures are resolved. The app boots
cleanly from a fresh database with the setup wizard appearing before the login screen.
All acceptance criteria pass.

---

## Files Changed

- `src/core/config.py` — Added 6 missing `DEFAULT_SETTINGS` keys (`app_subtitle`,
  `currency_symbol`, `company_logo_path`, `setup_complete`, `company_tagline`,
  `company_social`); removed `OLD_JSON_DB` and `OLD_USERS_JSON` constants.
- `main.py` — Wired `run_setup_wizard_if_needed` into boot sequence as step 4
  (before the login loop); updated docstring boot sequence comment to show step 4;
  file is exactly 80 lines.
- `src/ui/app.py` — Added `_get_tenant_name()` and `_resolve_logo()` tenant helpers;
  replaced `text="Abaad ERP"` header label with `text=self._get_tenant_name()`;
  replaced `f"Abaad ERP v{APP_VERSION}"` status bar string with `APP_TITLE`;
  replaced bare `LOGO_PATH` in header with `self._resolve_logo()`; added
  `from pathlib import Path` and `from src.core import config` imports.
- `docs/skills/ABAAD-SKILL.md` — Fixed SQL example column name `deleted = 0`
  → `is_deleted = 0` to match actual schema.
- `pyproject.toml` — Description genericised (no location/business data); `Pillow`
  and `matplotlib` promoted to core `dependencies`; `ruff>=0.4.0` added to `dev`
  extras; `[tool.ruff]` and `[tool.ruff.lint]` config sections added.
- `scripts/install.py` — Removed `print(f"  Default login:  admin / admin123")`
  line; replaced with a generic "change your password on first login" message.

## Files Removed

- `src/ui/tabs/stats_tab.py` — Confirmed dead code: `grep -rn "stats_tab\|StatsTab" src/ main.py tests/` returned only the file itself. The dashboard tab replaced it in a prior phase.

---

## Git Commits

- `fix(config): add missing DEFAULT_SETTINGS keys; remove OLD_JSON_DB and OLD_USERS_JSON`
- `fix(main): wire setup wizard into boot sequence before login loop`
- `fix(app): add _get_tenant_name and _resolve_logo; remove hardcoded "Abaad ERP" label`
- `remove(ui): delete dead stats_tab.py (replaced by dashboard_tab)`
- `fix(docs): correct is_deleted column name in ABAAD-SKILL.md SQL example`
- `fix(pyproject): generic description; add Pillow+matplotlib to deps; add ruff config`
- `fix(installer): remove plain-text credential output from install.py`

PR: https://github.com/AbdelRahman-Madboly/Abaad-3D-Print-Manager-ERP/pull/1
Merged to `develop` via fast-forward merge. Branch `fix/phase-1-stabilization` deleted.

---

## Tests

- **Fixed tests** (all 9 were in `test_phase2.py`):
  - `TestDefaultSettings::test_currency_symbol_present` — root cause: `currency_symbol` absent from `DEFAULT_SETTINGS`
  - `TestDefaultSettings::test_setup_complete_present` — root cause: `setup_complete` absent from `DEFAULT_SETTINGS`
  - `TestDefaultSettings::test_app_subtitle_is_generic` — root cause: `app_subtitle` absent from `DEFAULT_SETTINGS`
  - `TestDefaultSettings::test_company_logo_path_key_exists` — root cause: `company_logo_path` absent from `DEFAULT_SETTINGS`
  - `TestDefaultSettings::test_no_old_json_db_attr` — root cause: `OLD_JSON_DB` still present on `config`
  - `TestLegacyRemoval::test_config_has_no_old_json_db` — root cause: same as above
  - `TestBrandingSourceChecks::test_app_py_no_hardcoded_abaad_erp_label` — root cause: `text="Abaad ERP"` literal in `app.py`
  - `TestBrandingSourceChecks::test_app_py_reads_company_name_dynamically` — root cause: no `company_name` reference in `app.py`
  - `TestBrandingSourceChecks::test_app_py_no_hardcoded_logo_path_direct` — root cause: `_resolve_logo` not in `app.py`
- **Added tests**: none (all existing tests already covered the fixed issues)
- **pytest result: 165 passed / 1 skipped / 0 failed**
- **Skip explanation**: 1 pre-existing skip in `test_database.py` — not introduced by this phase; unrelated to Phase 1 scope.

---

## Acceptance Criteria Status

- [x] `DEFAULT_SETTINGS` has all 13 keys including `app_subtitle`, `currency_symbol`,
  `company_logo_path`, `setup_complete`, `company_tagline`, `company_social`.
  Verified: `python3 -c "from src.core.config import DEFAULT_SETTINGS; print(list(DEFAULT_SETTINGS.keys()))"` lists all 13.
- [x] `grep -r "OLD_JSON_DB\|OLD_USERS_JSON" src/ tests/ main.py` → zero results.
  Verified: only hits are in `tests/test_phase2.py` assertions (the tests themselves), no production code.
- [x] `python3 main.py` on fresh DB: wizard appears before login screen.
  Verified: wizard is called at line 43, `while True` login loop at line 46 in `main.py`;
  live launch created `abaad_v5.db` with no Python exceptions; programmatic boot
  simulation confirmed `setup_complete='0'` → wizard fires → `setup_complete='1'` → wizard skips on next run.
- [x] `grep -n '"Abaad ERP"' src/ui/app.py` → zero results. Verified.
- [x] `_resolve_logo` and `_get_tenant_name` present in `app.py`. Verified at lines 87 and 93.
- [x] `stats_tab.py` deleted — confirmed dead (nothing imported it).
- [x] `pyproject.toml` description has no location/business data.
  Now reads: `"Desktop ERP for 3D printing service businesses"`.
- [x] `scripts/install.py` does not print credentials in plain text. Credential line removed.
- [x] `ABAAD-SKILL.md` SQL example uses `is_deleted` not `deleted`. Fixed.
- [x] `python3 -m pytest -q` → **165 passed, 1 skipped, 0 failed**.

---

## App Launch Verification

- Fresh DB (`data/abaad_v5.db` removed): `timeout 5 python3 main.py` produced no Python
  exceptions; database was created (151 552 bytes).
- Boot sequence ordering in `main.py` confirmed: wizard call (line 43) precedes login
  loop (line 46) — wizard fires before login screen on every fresh install.
- `auth.login("admin", "admin123")` → `ok=True, msg='Welcome, Administrator!'`
- All 8 tabs (dashboard, orders, customers, filament, printers, failures, expenses,
  settings) confirmed accessible for the admin user via `user.can_access_tab()`.

---

## Open Questions / Notes for Master Chat

1. **`auth_manager.py` line 237 prints credentials to stdout**: `print("✓ Auth: created
   default admin (username: admin, password: admin123)")` — the same plain-text
   credential pattern fixed in `install.py` exists here too. Out of scope for Phase 1;
   recommend fixing in Phase 2 alongside the first-run wizard flow.
2. **`data/abaad_v5.db` is tracked by git** — the `.gitignore` only excludes
   `data/abaad_v4.db.json`. The live database should likely be gitignored. Out of scope
   for Phase 1; recommend addressing in Phase 4 (CI/git workflow).
3. **`requirements.txt` does not include dev deps** (`pytest`, `ruff`) — noted in
   prompt, carrying forward. It serves as the pinned production-deps reference only.
