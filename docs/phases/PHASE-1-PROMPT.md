# Phase 1 — Core Stabilization
> **Type:** bug fixes + test cleanup. No new features.
> **Session start:** `cat docs/CLAUDE.md` then this file.
> **Prerequisite:** Phase 0 report in hand. Use its findings as your hit-list.
> **Branch:** `fix/phase-1-stabilization` off `develop`

---

## Goal

Get the project into a fully verified, clean, working state. Every test passes.
Every known crash risk is fixed. The app launches without errors on a fresh DB.
This is the foundation everything else builds on.

---

## Context from Phase 0

The Phase 0 report will list exact issues. This prompt pre-lists the ones the
architect already knows about — cross-check against the Phase 0 report and fix
everything on both lists.

**Known issues to fix:**

### Issue A — `config.py`: missing `DEFAULT_SETTINGS` keys

`setup_wizard.py` reads these keys from `DEFAULT_SETTINGS` at runtime and will
crash (KeyError) if they're absent:
- `app_subtitle`
- `currency_symbol`
- `company_logo_path`
- `setup_complete`
- `company_tagline`
- `company_social`

Add them. Confirm values by reading what `setup_wizard.py` actually uses
as defaults. Use neutral/generic values, not Abaad-specific business data.

Also remove `OLD_JSON_DB` and `OLD_USERS_JSON` if they still exist —
confirm no other file imports them first:
```bash
grep -rn "OLD_JSON_DB\|OLD_USERS_JSON" src/ tests/ main.py
```

### Issue B — `main.py`: setup wizard not wired

`run_setup_wizard_if_needed` is never called. The boot sequence must call
it before the login loop. The wizard needs a Tk root window — structure it
so a hidden root is created before the loop, the wizard runs on it, then
the login loop takes over:

```python
# main.py boot sequence
# 1. Directories
# 2. Database
# 3. Auth
# 3b. Setup wizard (first run only)
root = tk.Tk()
root.withdraw()
from src.ui.dialogs.setup_wizard import run_setup_wizard_if_needed
run_setup_wizard_if_needed(db, root)
root.destroy()
# 4. Login loop (creates its own root each iteration)
```

Document your exact approach in the report.

### Issue C — `app.py`: hardcoded tenant strings

Two literal strings in `app.py` that should not be hardcoded:

1. Header label: `tk.Label(hdr, text="Abaad ERP", ...)` — this should read
   the tenant company name from `db.get_setting("company_name")` with
   fallback to `config.COMPANY["name"]`.

2. Status bar: `text=f"Abaad ERP v{APP_VERSION}"` — replace with
   `text=APP_TITLE` (this is the product identity, which is correct to keep,
   but use the constant not a literal string).

Add a private helper:
```python
def _get_tenant_name(self) -> str:
    try:
        return self._db.get_setting("company_name") or config.COMPANY["name"]
    except Exception:
        return config.COMPANY["name"]
```

### Issue D — Fix any test failures found in Phase 0

Work through every failure from the Phase 0 pytest output. For each:
- Understand the root cause (wrong fixture data? wrong key name? real bug in app code?)
- Fix the root cause — never skip a test to make CI green
- Add a comment explaining what was wrong if it was non-obvious

---

## Tasks

### Task 1 — Fix config.py

Apply Issue A fixes. After editing:
```bash
python3 -c "from src.core.config import DEFAULT_SETTINGS; print(list(DEFAULT_SETTINGS.keys()))"
```
Confirm all expected keys are present.

### Task 2 — Fix main.py

Apply Issue B fix. After editing, confirm the file is still under 80 lines
and has no business logic. The boot sequence comment block must be updated
to reflect the new step 3b.

### Task 3 — Fix app.py

Apply Issue C fixes. After editing:
```bash
grep -n "Abaad ERP\|abaad erp" src/ui/app.py -i
```
The only remaining hits should be in the status bar using `APP_TITLE`
(product identity — correct) and nowhere as a raw string literal.

### Task 4 — Fix all test failures

Work through Phase 0's pytest output. Fix everything. Add tests for any
new code you wrote in Tasks 1-3. After all fixes:
```bash
pytest -q
```
Target: **all tests pass, zero failures**.

The one pre-existing skip (`TestBackup::test_backup_database_creates_file`)
is acceptable if it's the same skip as before — confirm it's the same and
note it.

### Task 5 — Verify the app launches on a fresh DB

Delete any existing DB and launch the app to confirm the wizard fires:
```bash
mv data/abaad_v5.db data/abaad_v5.db.bak 2>/dev/null; true
python main.py
```

Confirm:
- Setup wizard appears before the login screen
- Completing the wizard saves settings and proceeds to login
- Login screen works
- Main window opens with all tabs loading without errors

Restore the backup after testing:
```bash
mv data/abaad_v5.db.bak data/abaad_v5.db 2>/dev/null; true
```

### Task 6 — pyproject.toml cleanup

Ensure `pyproject.toml` is correct:

```toml
[project]
name = "abaad-erp"
version = "5.0.0"
description = "Desktop ERP for 3D-printing service businesses"
requires-python = ">=3.10"
dependencies = [
    "reportlab>=4.0",
    "Pillow>=10.0",
    "matplotlib>=3.7",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "ruff>=0.4",
]

[tool.pytest.ini_options]
testpaths = ["tests"]

[tool.ruff]
line-length = 100
target-version = "py310"
select = ["E", "F", "W", "I"]
ignore = ["E501"]
```

Cross-check against `requirements.txt` — reconcile any differences.
If `requirements.txt` exists and `pyproject.toml` now covers everything,
you may remove `requirements.txt` (note the decision in the report).

---

## Acceptance criteria

- [ ] `python3 -c "from src.core.config import DEFAULT_SETTINGS; print(DEFAULT_SETTINGS)"` shows all
      required keys including `app_subtitle`, `currency_symbol`, `company_logo_path`,
      `setup_complete`, `company_tagline`, `company_social`.
- [ ] `grep "OLD_JSON_DB\|OLD_USERS_JSON" src/ tests/ main.py -r` → zero results.
- [ ] `python main.py` on a fresh DB shows the setup wizard before the login screen.
- [ ] `grep -n "\"Abaad ERP\"" src/ui/app.py` → zero literal string hits
      (only `APP_TITLE` constant usage remaining).
- [ ] `pytest -q` → **zero failures**. Report exact pass/skip counts.
- [ ] `pip install -e ".[dev]"` works from a clean environment (venv test).

---

## Git commits (one per file changed)

```
fix(config): add missing DEFAULT_SETTINGS keys; remove OLD_JSON_DB refs
fix(main): wire setup wizard into boot sequence before login loop
fix(app): read tenant company name from settings; use APP_TITLE in status bar
test(stabilization): fix all test failures found in Phase 0 audit
chore(pyproject): add dev extras, ruff config, reconcile with requirements.txt
```

---

## Completion Report

```markdown
# Phase 1 Completion Report — Core Stabilization

## Summary

## Files Changed
- path/to/file.py — what changed

## Files Added / Removed
- path — reason

## Git Commits
- `type(scope): message`

## Tests
- Fixed: [list each test that was broken and what the root cause was]
- Added: [any new tests]
- pytest result: N passed / N skipped / N failed
- Skip explanation: [what is still skipped and why it's acceptable]

## Acceptance Criteria Status
- [x] / [ ] each with one-line verification note

## App launch verification
Did the wizard fire on fresh DB? Login work? All tabs load?

## Open Questions / Notes for Master Chat
```
