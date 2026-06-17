# Phase 1 — Core Stabilization
> **Type:** bug fixes + test cleanup. No new features.
> **Session start:** `cat docs/DEVELOPER.md` then this file.
> **Prerequisite:** Phase 0 report complete. All findings are known.
> **Branch:** `fix/phase-1-stabilization` off `develop`

---

## Goal

Get the project into a fully verified, clean, working state. Every test passes.
Every known crash risk is fixed. The app launches without errors on a fresh DB.
This is the foundation everything else builds on.

---

## Known issues to fix (from Phase 0 report)

### Issue A — `config.py`: missing `DEFAULT_SETTINGS` keys

`setup_wizard.py` reads these keys from `DEFAULT_SETTINGS` at runtime and will
crash (KeyError) if they're absent. Phase 0 confirmed both crash risks:
- line 118: `DEFAULT_SETTINGS["app_subtitle"]` → KeyError
- line 151: `DEFAULT_SETTINGS["currency_symbol"]` → KeyError

Add ALL of these to `DEFAULT_SETTINGS` with generic defaults:

```python
DEFAULT_SETTINGS: dict = {
    # existing keys — keep as-is
    "company_name":          COMPANY["name"],
    "company_phone":         COMPANY["phone"],
    "company_address":       COMPANY["address"],
    "default_rate_per_gram": str(DEFAULT_RATE_PER_GRAM),
    "next_order_number":     "1",
    "deposit_percent":       "50",
    "quote_validity_days":   "7",
    # ADD these (Phase 1):
    "app_subtitle":          "3D Print Shop Management",
    "currency_symbol":       "EGP",
    "company_logo_path":     "",
    "setup_complete":        "0",
    "company_tagline":       COMPANY["tagline"],
    "company_social":        COMPANY["social"],
}
```

Also remove `OLD_JSON_DB` and `OLD_USERS_JSON` — Phase 0 confirmed nothing
imports them. Two tests explicitly require them to be gone:
- `TestDefaultSettings::test_no_old_json_db_attr`
- `TestLegacyRemoval::test_config_has_no_old_json_db`

Verify first:
```bash
grep -rn "OLD_JSON_DB\|OLD_USERS_JSON" src/ tests/ main.py
```
Then delete both constants from `config.py`.

### Issue B — `main.py`: setup wizard not wired

`run_setup_wizard_if_needed` exists in `setup_wizard.py` but is never called.

**Design decision (architect):** the wizard runs BEFORE the login screen.
A fresh install has no users yet — the owner must set up their company first.

Boot sequence must be:
1. Directories
2. Database
3. Auth init
4. **Setup wizard (if `setup_complete != "1"`)**
5. Login loop

Structure it with a temporary hidden root for the wizard, then the login
loop creates its own root each iteration:

```python
def main() -> None:
    # 1. Directories
    from src.core.config import ensure_directories
    ensure_directories()

    # 2. Database
    from src.core.database import get_database
    db = get_database()

    # 3. Auth
    from src.auth.auth_manager import get_auth_manager
    auth = get_auth_manager()
    auth.initialise(db)

    # 4. First-run setup wizard (before login — fresh install has no users yet)
    wizard_root = tk.Tk()
    wizard_root.withdraw()
    from src.ui.dialogs.setup_wizard import run_setup_wizard_if_needed
    run_setup_wizard_if_needed(db, wizard_root)
    wizard_root.destroy()

    # 5. Login loop
    while True:
        root = tk.Tk()
        root.withdraw()
        # ... rest of login loop unchanged ...
```

### Issue C — `app.py`: hardcoded tenant strings

Phase 0 confirmed two failing tests:
- `test_app_py_no_hardcoded_abaad_erp_label` — `text="Abaad ERP"` literal exists
- `test_app_py_reads_company_name_dynamically` — neither `_get_company_name` nor `company_name` in file
- `test_app_py_no_hardcoded_logo_path_direct` — `_resolve_logo` not in file

Fix all three:

1. Add `_get_tenant_name()` helper to the `App` class:
```python
def _get_tenant_name(self) -> str:
    try:
        return self._db.get_setting("company_name") or config.COMPANY["name"]
    except Exception:
        return config.COMPANY["name"]
```

2. Add `_resolve_logo()` helper:
```python
def _resolve_logo(self) -> Path:
    try:
        path_str = self._db.get_setting("company_logo_path")
        if path_str:
            p = config.PROJECT_ROOT / path_str
            if p.exists():
                return p
    except Exception:
        pass
    return config.LOGO_PATH
```

3. Replace `text="Abaad ERP"` header label with:
```python
text=self._get_tenant_name()
```

4. Find the status bar version string `f"Abaad ERP v{APP_VERSION}"` and
   replace with `APP_TITLE` (the constant, not a literal).

After fixing, verify:
```bash
grep -n '"Abaad ERP"' src/ui/app.py
```
Expected: zero results.

### Issue D — `stats_tab.py` dead code

Phase 0 found `src/ui/tabs/stats_tab.py` exists on disk but was supposed
to be replaced by the dashboard. Check if anything imports it:

```bash
grep -rn "stats_tab\|StatsTab" src/ main.py tests/
```

If nothing imports it → delete it. It is dead code.
If something does import it → report it and do NOT delete.

---

## Additional fixes from Phase 0

### Fix E — `docs/skills/ABAAD-SKILL.md`: wrong SQL column name

The skill file has a SQL example using `deleted = 0` but the actual schema
uses `is_deleted`. Find the line and fix:

```python
# Wrong (in skill file):
"SELECT * FROM orders WHERE status = ? AND deleted = 0"
# Correct:
"SELECT * FROM orders WHERE status = ? AND is_deleted = 0"
```

### Fix F — `pyproject.toml`: tenant data in description + missing deps

1. Change description:
```toml
# From:
description = "Desktop ERP for a 3D printing service business — Ismailia, Egypt"
# To:
description = "Desktop ERP for 3D printing service businesses"
```

2. Add `Pillow` and `matplotlib` to core dependencies (they are currently
   only in optional extras but are used by the app):
```toml
dependencies = [
    "reportlab>=4.1.0",
    "Pillow>=10.4.0",
    "matplotlib>=3.9.0",
]
```

3. Add `ruff` to dev extras:
```toml
[project.optional-dependencies]
dev = ["pytest>=8.0.0", "pytest-cov>=5.0.0", "ruff>=0.4.0"]
```

4. Add ruff config section:
```toml
[tool.ruff]
line-length = 100
target-version = "py310"

[tool.ruff.lint]
select = ["E", "F", "W", "I"]
ignore = ["E501"]
```

Keep `requirements.txt` as-is for now — it serves as the pinned-versions
reference. Note in the report that it does not include dev deps.

### Fix G — `scripts/install.py`: credentials in plain text

Find the line that prints `admin / admin123` or similar credentials to the
terminal. Replace with:
```
Default admin account configured — change your password on first login.
```
Never print credentials in plain text.

---

## Tasks (in order)

### Task 1 — Fix `config.py`
Apply Issue A. Verify:
```bash
python3 -c "from src.core.config import DEFAULT_SETTINGS; print(list(DEFAULT_SETTINGS.keys()))"
python3 -c "import src.core.config as c; print(hasattr(c, 'OLD_JSON_DB'))"
# Expected: False
```

### Task 2 — Fix `main.py`
Apply Issue B. File must stay under 80 lines. Update the boot sequence
comment block to show the new step 4.

### Task 3 — Fix `app.py`
Apply Issue C. Verify:
```bash
grep -n '"Abaad ERP"' src/ui/app.py
# Expected: zero results
grep -n "_resolve_logo\|_get_tenant_name\|company_name" src/ui/app.py
# Expected: hits in the new helper methods
```

### Task 4 — Handle `stats_tab.py`
Apply Issue D. Run the grep, then delete or report.

### Task 5 — Fix docs and tooling
Apply Fixes E, F, G in order.

### Task 6 — Run full test suite
```bash
python3 -m pytest -q
```
Target: **zero failures**. All 9 `test_phase2.py` failures must now pass
because their root causes (missing keys, OLD_JSON_DB, hardcoded app.py
string) are all fixed by Tasks 1-3.

Fix any new failures introduced by your changes. Do not skip tests.

### Task 7 — Verify fresh DB launch

```bash
mv data/abaad_v5.db data/abaad_v5.db.bak 2>/dev/null; true
python3 main.py
```

Confirm visually:
- Setup wizard appears (not the login screen) on first launch
- Wizard completes → login screen appears
- Login works with `admin` / `admin123`
- Main window opens, all tabs load, no Python exceptions in terminal

Then restore:
```bash
mv data/abaad_v5.db.bak data/abaad_v5.db 2>/dev/null; true
```

### Task 8 — Commit everything

Work on branch `fix/phase-1-stabilization`. One commit per file.
Then open a PR to `develop`:

```bash
git checkout develop && git pull
git checkout -b fix/phase-1-stabilization
# ... make all changes ...
git add -A
# commit per file (see commit messages below)
git push -u origin fix/phase-1-stabilization
gh pr create --base develop --fill
gh pr merge --merge --delete-branch
git checkout develop && git pull
```

---

## Acceptance criteria

- [ ] `DEFAULT_SETTINGS` has all 13 keys including `app_subtitle`,
      `currency_symbol`, `company_logo_path`, `setup_complete`,
      `company_tagline`, `company_social`.
- [ ] `grep -r "OLD_JSON_DB\|OLD_USERS_JSON" src/ tests/ main.py` → zero results.
- [ ] `python3 main.py` on fresh DB: wizard appears before login screen.
- [ ] `grep -n '"Abaad ERP"' src/ui/app.py` → zero results.
- [ ] `_resolve_logo` and `_get_tenant_name` (or `company_name`) present in `app.py`.
- [ ] `stats_tab.py` deleted (if confirmed dead) or explained (if still used).
- [ ] `pyproject.toml` description has no location/business data.
- [ ] `scripts/install.py` does not print credentials in plain text.
- [ ] `ABAAD-SKILL.md` SQL example uses `is_deleted` not `deleted`.
- [ ] `python3 -m pytest -q` → **zero failures**. Report exact count.

---

## Git commit messages

```
fix(config): add missing DEFAULT_SETTINGS keys; remove OLD_JSON_DB and OLD_USERS_JSON
fix(main): wire setup wizard into boot sequence before login loop
fix(app): add _get_tenant_name and _resolve_logo; remove hardcoded "Abaad ERP" label
remove(ui): delete dead stats_tab.py (replaced by dashboard_tab)
fix(pyproject): generic description; add Pillow+matplotlib to deps; add ruff config
fix(installer): remove plain-text credential output from install.py
fix(docs): correct is_deleted column name in ABAAD-SKILL.md SQL example
```

---

## Completion Report

```markdown
# Phase 1 Completion Report — Core Stabilization

## Summary

## Files Changed
- path/to/file — what changed (1-2 sentences)

## Files Removed
- path — reason

## Git Commits
- `type(scope): message`

## Tests
- Fixed tests: [list each with root cause]
- Added tests: [any new ones]
- pytest result: N passed / N skipped / N failed
- Skip explanation: [what is still skipped and why]

## Acceptance Criteria Status
- [x] / [ ] each with one-line verification note

## App launch verification
Wizard fired on fresh DB? Login worked? All tabs loaded without errors?

## Open Questions / Notes for Master Chat
```