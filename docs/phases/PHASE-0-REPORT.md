# Phase 0 Completion Report — Repo Audit & Honest Baseline

---

## Summary

Repo is in solid shape overall: 156 tests pass, architecture is coherent,
and the DB schema is clean. The 9 failing tests are all in `test_phase2.py`
— they expose work that was planned but not yet done (missing `DEFAULT_SETTINGS`
keys, `OLD_JSON_DB` not removed, app.py header still hardcoded). The setup
wizard exists and is complete but is **not wired into `main.py`**, so it
never runs. The `COMPANY` dict in `config.py` contains real tenant contact
info (Egyptian phone number, city name, social handle) that must move to the
settings table. No actual git conflict markers found.

---

## Test Suite Result

```
============================= test session starts ==============================
platform linux -- Python 3.13.13, pytest-9.1.0, pluggy-1.6.0
rootdir: /home/madboly/projects/products/Abaad-3D-ERP
configfile: pyproject.toml
testpaths: tests
plugins: anyio-4.12.1
collected 166 items

tests/test_dashboard_tab.py ...............                              [  9%]
tests/test_database.py ..............s.                                  [ 18%]
tests/test_finance_service.py ............                               [ 25%]
tests/test_inventory_service.py .........                                [ 31%]
tests/test_models.py ...........................                         [ 47%]
tests/test_order_service.py ..................                           [ 58%]
tests/test_pdf_service.py ....                                           [ 60%]
tests/test_phase2.py .....FFFFF....................F...........FFF..     [ 89%]
tests/test_printer_service.py ..................                         [100%]

=================================== FAILURES ===================================
_______________ TestDefaultSettings.test_currency_symbol_present _______________

self = <test_phase2.TestDefaultSettings object at 0x73aa172e1590>

    def test_currency_symbol_present(self):
        from src.core.config import DEFAULT_SETTINGS
>       assert "currency_symbol" in DEFAULT_SETTINGS
E       AssertionError: assert 'currency_symbol' in {'company_name': 'Abaad', ...}

tests/test_phase2.py:99: AssertionError
_______________ TestDefaultSettings.test_setup_complete_present ________________

    def test_setup_complete_present(self):
        from src.core.config import DEFAULT_SETTINGS
>       assert "setup_complete" in DEFAULT_SETTINGS
E       AssertionError: assert 'setup_complete' in {'company_name': 'Abaad', ...}

tests/test_phase2.py:104: AssertionError
_______________ TestDefaultSettings.test_app_subtitle_is_generic _______________

    def test_app_subtitle_is_generic(self):
        from src.core.config import DEFAULT_SETTINGS
>       assert "app_subtitle" in DEFAULT_SETTINGS
E       AssertionError: assert 'app_subtitle' in {'company_name': 'Abaad', ...}

tests/test_phase2.py:109: AssertionError
____________ TestDefaultSettings.test_company_logo_path_key_exists _____________

    def test_company_logo_path_key_exists(self):
        from src.core.config import DEFAULT_SETTINGS
>       assert "company_logo_path" in DEFAULT_SETTINGS
E       AssertionError: assert 'company_logo_path' in {'company_name': 'Abaad', ...}

tests/test_phase2.py:114: AssertionError
_________________ TestDefaultSettings.test_no_old_json_db_attr _________________

    def test_no_old_json_db_attr(self):
        import src.core.config as cfg
>       assert not hasattr(cfg, "OLD_JSON_DB"), \
            "OLD_JSON_DB must be removed in Phase 2"
E       AssertionError: OLD_JSON_DB must be removed in Phase 2

tests/test_phase2.py:118: AssertionError
_______________ TestLegacyRemoval.test_config_has_no_old_json_db _______________

    def test_config_has_no_old_json_db(self):
        import src.core.config as cfg
>       assert not hasattr(cfg, "OLD_JSON_DB")
E       AssertionError: assert not True

tests/test_phase2.py:283: AssertionError
______ TestBrandingSourceChecks.test_app_py_no_hardcoded_abaad_erp_label _______

    def test_app_py_no_hardcoded_abaad_erp_label(self):
        text = (Path(__file__).parent.parent / "src" / "ui" / "app.py").read_text()
>       assert 'text="Abaad ERP"' not in text, \
            'app.py still has hardcoded text="Abaad ERP" label'
E       AssertionError: app.py still has hardcoded text="Abaad ERP" label

tests/test_phase2.py:387: AssertionError
_____ TestBrandingSourceChecks.test_app_py_reads_company_name_dynamically ______

    def test_app_py_reads_company_name_dynamically(self):
        text = (Path(__file__).parent.parent / "src" / "ui" / "app.py").read_text()
>       assert "_get_company_name" in text or "company_name" in text
E       assert (False or False)

tests/test_phase2.py:393: AssertionError
______ TestBrandingSourceChecks.test_app_py_no_hardcoded_logo_path_direct ______

    def test_app_py_no_hardcoded_logo_path_direct(self):
        """app.py must use _resolve_logo() not bare LOGO_PATH for the header."""
        text = (Path(__file__).parent.parent / "src" / "ui" / "app.py").read_text()
>       assert "_resolve_logo" in text
E       assert '_resolve_logo' in ...

tests/test_phase2.py:399: AssertionError
=========================== short test summary info ============================
FAILED tests/test_phase2.py::TestDefaultSettings::test_currency_symbol_present
FAILED tests/test_phase2.py::TestDefaultSettings::test_setup_complete_present
FAILED tests/test_phase2.py::TestDefaultSettings::test_app_subtitle_is_generic
FAILED tests/test_phase2.py::TestDefaultSettings::test_company_logo_path_key_exists
FAILED tests/test_phase2.py::TestDefaultSettings::test_no_old_json_db_attr
FAILED tests/test_phase2.py::TestLegacyRemoval::test_config_has_no_old_json_db
FAILED tests/test_phase2.py::TestBrandingSourceChecks::test_app_py_no_hardcoded_abaad_erp_label
FAILED tests/test_phase2.py::TestBrandingSourceChecks::test_app_py_reads_company_name_dynamically
FAILED tests/test_phase2.py::TestBrandingSourceChecks::test_app_py_no_hardcoded_logo_path_direct
=================== 9 failed, 156 passed, 1 skipped in 7.15s ===================
```

**Note:** `pytest` is not installed in the project venv (no venv exists) nor in the
system PATH. Tests were run with `python3 -m pytest` after installing pytest into
the active conda base: `/home/madboly/miniconda3/bin/python3`. This is a Phase 1
concern — the dev environment is not documented anywhere in the repo.

---

## File Tree

```
./docs/CLAUDE.md
./docs/MASTER-PLAN.md
./docs/phases/PHASE-0-PROMPT.md
./docs/phases/PHASE-1-PROMPT.md
./docs/phases/PHASE-2-PROMPT.md
./docs/phases/PHASE-3-PROMPT.md
./docs/phases/PHASE-4-PROMPT.md
./docs/phases/PHASE-4.5-PROMPT.md
./docs/phases/PHASE-5-PROMPT.md
./docs/phases/PHASE-6-PROMPT.md
./docs/phases/PHASE-7-PROMPT.md
./docs/phases/PHASE-8-PROMPT.md
./docs/README.md
./docs/skills/ABAAD-SKILL.md
./FileTree.md
./Launch_App.bat
./launch.sh
./main.py
./pyproject.toml
./README.md
./requirements.txt
./scripts/install.py
./SETUP.bat
./setup.sh
./src/auth/__init__.py
./src/auth/auth_manager.py
./src/auth/permissions.py
./src/core/__init__.py
./src/core/config.py
./src/core/database.py
./src/core/models.py
./src/services/__init__.py
./src/services/cura_service.py
./src/services/customer_service.py
./src/services/finance_service.py
./src/services/inventory_service.py
./src/services/order_service.py
./src/services/pdf_service.py
./src/services/printer_service.py
./src/ui/__init__.py
./src/ui/app.py
./src/ui/context_menu.py
./src/ui/dialogs/__init__.py
./src/ui/dialogs/item_dialog.py
./src/ui/dialogs/login_dialog.py
./src/ui/dialogs/setup_wizard.py
./src/ui/tabs/__init__.py
./src/ui/tabs/analytics_tab.py
./src/ui/tabs/customers_tab.py
./src/ui/tabs/dashboard_tab.py
./src/ui/tabs/expenses_tab.py
./src/ui/tabs/failures_tab.py
./src/ui/tabs/filament_tab.py
./src/ui/tabs/orders_tab.py
./src/ui/tabs/printers_tab.py
./src/ui/tabs/settings_tab.py
./src/ui/tabs/stats_tab.py
./src/ui/theme.py
./src/ui/widgets.py
./src/utils/__init__.py
./src/utils/helpers.py
./tests/test_dashboard_tab.py
./tests/test_database.py
./tests/test_finance_service.py
./tests/test_inventory_service.py
./tests/test_models.py
./tests/test_order_service.py
./tests/test_pdf_service.py
./tests/test_phase2.py
./tests/test_printer_service.py
./tests/test_printer_service.py
```

**Files in CLAUDE.md layout that do NOT exist on disk:**
- `abaad-erp.desktop` — listed in repo root layout, does not exist
- `scripts/install_linux.sh` — listed in ABAAD-SKILL.md file ownership table, does not exist
- `scripts/install_windows.bat` — listed in ABAAD-SKILL.md file ownership table, does not exist

**Files on disk NOT mentioned in planning docs:**
- `requirements.txt` — exists at root (pins exact versions for reportlab, Pillow, pytesseract, matplotlib)
- `scripts/install.py` — cross-platform Python installer (replaces install_linux.sh + install_windows.bat)
- `src/ui/context_menu.py` — right-click context menu widget, not mentioned in CLAUDE.md
- `src/ui/tabs/analytics_tab.py` — visual analytics tab (mentioned in CLAUDE.md phase list but not layout)
- `src/ui/tabs/stats_tab.py` — statistics dashboard tab, not in CLAUDE.md layout
- `FileTree.md` — snapshot of file tree at repo root, not mentioned anywhere
- `tests/test_dashboard_tab.py`, `tests/test_models.py`, `tests/test_pdf_service.py`, `tests/test_phase2.py` — test files not listed in CLAUDE.md

---

## Conflict Marker Sweep

**Result: Zero actual conflict markers.**

The grep pattern `<<<<<<|=======|>>>>>>>` matched `=======` on line 3 of almost
every Python file. These are all RST-style docstring section dividers — e.g.,
`main.py` line 3 is the underline for the `main.py` heading in its module
docstring. No actual `<<<<<<< HEAD` / `=======` / `>>>>>>> branch` merge
conflict markers exist anywhere.

---

## config.py Audit

### DEFAULT_SETTINGS keys present (7 keys)

```python
DEFAULT_SETTINGS = {
    "company_name":           COMPANY["name"],       # → "Abaad"
    "company_phone":          COMPANY["phone"],       # → "01070750477"
    "company_address":        COMPANY["address"],     # → "Ismailia, Egypt"
    "default_rate_per_gram":  str(DEFAULT_RATE_PER_GRAM),  # → "4.0"
    "next_order_number":      "1",
    "deposit_percent":        "50",
    "quote_validity_days":    "7",
}
```

### DEFAULT_SETTINGS keys MISSING (crash risks)

These keys are read by `setup_wizard.py` with direct dict indexing (`[]`), so
their absence throws `KeyError` at wizard startup:

| Key | Where used | Impact |
|-----|-----------|--------|
| `"app_subtitle"` | `setup_wizard.py:118` — `DEFAULT_SETTINGS["app_subtitle"]` | **KeyError crash** when wizard renders |
| `"currency_symbol"` | `setup_wizard.py:151` — `DEFAULT_SETTINGS["currency_symbol"]` | **KeyError crash** when wizard renders |
| `"company_logo_path"` | Written by wizard, read by `pdf_service._load_company()` | Not a crash (written on save, read with `.get()`) |
| `"setup_complete"` | Written/read by wizard and `db.get_setting()` with default | Not a direct crash (guarded by `get_setting(default="0")`) |

### COMPANY dict contents

```python
COMPANY = {
    "name":     "Abaad",                        # PRODUCT/TENANT ambiguous
    "subtitle": "3D Printing Services",          # TENANT — specific business type
    "phone":    "01070750477",                   # TENANT — real Egyptian mobile number
    "address":  "Ismailia, Egypt",               # TENANT — real city/country
    "tagline":  "Quality 3D Printing Solutions", # TENANT — marketing copy
    "social":   "@abaad3d",                      # TENANT — real social handle
}
```

**Flagged as real business contact info:** `phone` and `address` are specific to
the owner's real business and must be blank (or placeholder) defaults in
`DEFAULT_SETTINGS`, not hardcoded in the product source. `social` and `subtitle`
are also tenant-specific.

### Dead / wrong constants

| Constant | Issue |
|----------|-------|
| `OLD_JSON_DB: Path = DATA_DIR / "abaad_v4.db.json"` | Legacy v4 path. `test_phase2.py` explicitly requires this to be removed (fails twice). No code reads it. |
| `OLD_USERS_JSON: Path = DATA_DIR / "users.json"` | Legacy users JSON path. No code reads it. |

**Also flagged (not dead, but wrong scope):**
- `pyproject.toml` description field contains `"— Ismailia, Egypt"` — tenant city in package metadata.

---

## main.py Audit

| Check | Expected | Actual |
|-------|---------|--------|
| Calls `run_setup_wizard_if_needed` | No — missing | Confirmed missing. Wizard file exists and works, but is never invoked. |
| Passes `db=` to `LoginDialog` | No — missing | `LoginDialog(root)` — no `db` arg passed. |
| `_svc()` helper pattern | Clean | Yes — clean, correct, uses `importlib.import_module`. |

**Additional issues:**
- Comment on line 54 says `"Phase 4: PrinterService is built first…"` — stale
  phase reference. CLAUDE.md uses a different phase numbering now.
- `auth.initialise(db)` is called but no setup wizard is triggered before the
  login loop, so a fresh database (no users) will show the login screen with no
  way for a new user to configure the app.

---

## app.py Branding Audit

| File:line | Literal | PRODUCT/TENANT | Notes |
|-----------|---------|----------------|-------|
| `src/ui/app.py:4` | `"Main application window for Abaad ERP v5.0."` | PRODUCT | Docstring, fine |
| `src/ui/app.py:98` | `text="Abaad ERP"` | **TENANT** | Header label — must read `company_name` from settings |
| `src/ui/app.py:243` | `text=f"Abaad ERP v{APP_VERSION}"` | PRODUCT | About/tooltip text crediting the app name — keep |

```bash
grep -n "get_setting\|company_name\|company_logo" src/ui/app.py
# → (no output)
```

**Does the header read company name from settings? NO.** `company_name`,
`get_setting`, and `company_logo` are all absent from `app.py`. The header is
fully hardcoded.

---

## Full Hardcoded-Identity Inventory

Only entries with branding significance are classified; package marker comments
(`# Abaad ERP v5.0 — package marker`) in `__init__.py` files are PRODUCT and
omitted from the table.

| File:line | Literal | PRODUCT/TENANT | Notes |
|-----------|---------|----------------|-------|
| `src/core/config.py:5` | `Abaad 3D Print Manager — v5.0` | PRODUCT | Module docstring |
| `src/core/config.py:19` | `"abaad_v5.db"` | PRODUCT | DB filename — ok |
| `src/core/config.py:20` | `"abaad_v4.db.json"` (OLD_JSON_DB) | PRODUCT | Dead constant — remove |
| `src/core/config.py:26` | `LOGO_PATH = ASSETS_DIR / "Abaad.png"` | PRODUCT | Fallback logo path — ok |
| `src/core/config.py:33` | `APP_NAME = "Abaad ERP"` | PRODUCT | Correct — keep |
| `src/core/config.py:42` | `"name": "Abaad"` | **TENANT** | Must become `""` or generic placeholder |
| `src/core/config.py:44` | `"phone": "01070750477"` | **TENANT** | Real phone — must become `""` |
| `src/core/config.py:45` | `"address": "Ismailia, Egypt"` | **TENANT** | Real address — must become `""` |
| `src/core/config.py:46` | `"tagline": "Quality 3D Printing Solutions"` | **TENANT** | Marketing copy — must become `""` |
| `src/core/config.py:47` | `"social": "@abaad3d"` | **TENANT** | Real social handle — must become `""` |
| `src/core/database.py:975` | `"abaad_v5_{timestamp}.db"` | PRODUCT | Backup filename pattern — ok |
| `src/ui/app.py:98` | `text="Abaad ERP"` | **TENANT** | Header label — must read from settings |
| `src/ui/app.py:243` | `text=f"Abaad ERP v{APP_VERSION}"` | PRODUCT | About text — keep |
| `main.py:26` | `logging.getLogger("abaad")` | PRODUCT | Logger name — fine |
| All `*.py` docstrings | `"Abaad ERP v5.0"` / `"Abaad 3D Print Manager"` | PRODUCT | Module docstrings — leave as-is |

---

## DB Schema

Database exists at `data/abaad_v5.db`.

```
colors:
  name TEXT

customers:
  id TEXT
  name TEXT NOT NULL
  phone TEXT DEFAULT ''
  email TEXT DEFAULT ''
  address TEXT DEFAULT ''
  notes TEXT DEFAULT ''
  discount_percent REAL DEFAULT 0
  total_orders INTEGER DEFAULT 0
  total_spent REAL DEFAULT 0
  created_date TEXT DEFAULT datetime('now','localtime')
  updated_date TEXT DEFAULT datetime('now','localtime')

expenses:
  id TEXT
  date TEXT DEFAULT datetime('now','localtime')
  category TEXT DEFAULT 'Other'
  name TEXT DEFAULT ''
  description TEXT DEFAULT ''
  amount REAL DEFAULT 0
  quantity INTEGER DEFAULT 1
  total_cost REAL DEFAULT 0
  supplier TEXT DEFAULT ''
  receipt_number TEXT DEFAULT ''
  is_recurring INTEGER DEFAULT 0
  recurring_period TEXT DEFAULT ''

filament_history:
  id TEXT
  spool_id TEXT DEFAULT ''
  spool_name TEXT DEFAULT ''
  color TEXT DEFAULT ''
  initial_weight REAL DEFAULT 0
  used_weight REAL DEFAULT 0
  remaining_weight REAL DEFAULT 0
  waste_weight REAL DEFAULT 0
  archived_date TEXT DEFAULT datetime('now','localtime')
  reason TEXT DEFAULT ''

filament_spools:
  id TEXT
  name TEXT DEFAULT ''
  filament_type TEXT DEFAULT 'PLA+'
  brand TEXT DEFAULT 'eSUN'
  color TEXT DEFAULT 'Black'
  category TEXT DEFAULT 'standard'
  status TEXT DEFAULT 'active'
  initial_weight_grams REAL DEFAULT 1000
  current_weight_grams REAL DEFAULT 1000
  pending_weight_grams REAL DEFAULT 0
  purchase_price_egp REAL DEFAULT 840
  purchase_date TEXT DEFAULT datetime('now','localtime')
  archived_date TEXT DEFAULT ''
  notes TEXT DEFAULT ''
  is_active INTEGER DEFAULT 1

orders:
  id TEXT
  order_number INTEGER
  customer_id TEXT
  customer_name TEXT DEFAULT ''
  customer_phone TEXT DEFAULT ''
  status TEXT DEFAULT 'Draft'
  is_rd_project INTEGER DEFAULT 0
  subtotal REAL DEFAULT 0
  actual_total REAL DEFAULT 0
  discount_percent REAL DEFAULT 0
  discount_amount REAL DEFAULT 0
  order_discount_percent REAL DEFAULT 0
  order_discount_amount REAL DEFAULT 0
  tolerance_discount_total REAL DEFAULT 0
  shipping_cost REAL DEFAULT 0
  total REAL DEFAULT 0
  amount_received REAL DEFAULT 0
  rounding_loss REAL DEFAULT 0
  payment_method TEXT DEFAULT 'Cash'
  payment_fee REAL DEFAULT 0
  material_cost REAL DEFAULT 0
  electricity_cost REAL DEFAULT 0
  depreciation_cost REAL DEFAULT 0
  profit REAL DEFAULT 0
  notes TEXT DEFAULT ''
  is_deleted INTEGER DEFAULT 0
  quote_sent INTEGER DEFAULT 0
  quote_sent_date TEXT DEFAULT ''
  deposit_amount REAL DEFAULT 0
  deposit_received INTEGER DEFAULT 0
  created_date TEXT DEFAULT datetime('now','localtime')
  updated_date TEXT DEFAULT datetime('now','localtime')
  confirmed_date TEXT DEFAULT ''
  delivered_date TEXT DEFAULT ''
  deleted_date TEXT DEFAULT ''

print_failures:
  id TEXT
  date TEXT DEFAULT datetime('now','localtime')
  source TEXT DEFAULT 'Other'
  order_id TEXT DEFAULT ''
  order_number INTEGER DEFAULT 0
  customer_name TEXT DEFAULT ''
  item_name TEXT DEFAULT ''
  reason TEXT DEFAULT 'Other'
  description TEXT DEFAULT ''
  filament_wasted_grams REAL DEFAULT 0
  time_wasted_minutes INTEGER DEFAULT 0
  spool_id TEXT DEFAULT ''
  color TEXT DEFAULT ''
  filament_cost REAL DEFAULT 0
  electricity_cost REAL DEFAULT 0
  total_loss REAL DEFAULT 0
  printer_id TEXT DEFAULT ''
  printer_name TEXT DEFAULT ''
  resolved INTEGER DEFAULT 0
  resolution_notes TEXT DEFAULT ''

print_items:
  id TEXT
  order_id TEXT NOT NULL
  name TEXT DEFAULT ''
  estimated_weight_grams REAL DEFAULT 0
  actual_weight_grams REAL DEFAULT 0
  estimated_time_minutes INTEGER DEFAULT 0
  actual_time_minutes INTEGER DEFAULT 0
  filament_type TEXT DEFAULT 'PLA+'
  color TEXT DEFAULT 'Black'
  spool_id TEXT DEFAULT ''
  nozzle_size REAL DEFAULT 0.4
  layer_height REAL DEFAULT 0.2
  infill_density INTEGER DEFAULT 20
  support_type TEXT DEFAULT 'None'
  scale_ratio REAL DEFAULT 1.0
  quantity INTEGER DEFAULT 1
  rate_per_gram REAL DEFAULT 4.0
  notes TEXT DEFAULT ''
  is_printed INTEGER DEFAULT 0
  filament_pending INTEGER DEFAULT 0
  filament_deducted INTEGER DEFAULT 0
  printer_id TEXT DEFAULT ''
  tolerance_discount_applied INTEGER DEFAULT 0
  tolerance_discount_amount REAL DEFAULT 0

printers:
  id TEXT
  name TEXT DEFAULT 'HIVE 0.1'
  model TEXT DEFAULT 'Creality Ender-3 Max'
  purchase_price REAL DEFAULT 25000
  lifetime_kg REAL DEFAULT 500
  total_printed_grams REAL DEFAULT 0
  total_print_time_minutes INTEGER DEFAULT 0
  nozzle_changes INTEGER DEFAULT 0
  nozzle_cost REAL DEFAULT 100
  nozzle_lifetime_grams REAL DEFAULT 1500
  current_nozzle_grams REAL DEFAULT 0
  electricity_rate_per_hour REAL DEFAULT 0.31
  is_active INTEGER DEFAULT 1
  notes TEXT DEFAULT ''
  created_date TEXT DEFAULT datetime('now','localtime')

settings:
  key TEXT
  value TEXT

users:
  id TEXT
  username TEXT NOT NULL
  password_hash TEXT DEFAULT ''
  password_salt TEXT DEFAULT ''
  role TEXT DEFAULT 'User'
  display_name TEXT DEFAULT ''
  email TEXT DEFAULT ''
  is_active INTEGER DEFAULT 1
  created_date TEXT DEFAULT datetime('now','localtime')
  last_login TEXT DEFAULT ''
  login_count INTEGER DEFAULT 0
  notes TEXT DEFAULT ''
```

**Notable:** `settings` table has only `key TEXT` and `value TEXT` — no primary
key constraint or `NOT NULL`. `orders` uses `is_deleted` (not `deleted`) — note
this conflicts with the ABAAD-SKILL.md SQL example which uses `deleted = 0`.

---

## setup_wizard.py Crash Risks

The wizard is not called from `main.py` at all (see main.py audit), so these
crashes would only manifest once it is wired in.

| Line | Expression | Missing Key | Impact |
|------|-----------|-------------|--------|
| 118 | `DEFAULT_SETTINGS["app_subtitle"]` | `"app_subtitle"` | **KeyError** — crashes wizard render |
| 151 | `DEFAULT_SETTINGS["currency_symbol"]` | `"currency_symbol"` | **KeyError** — crashes wizard render |

**Also noted:**
- The wizard writes `"company_logo_path"` and `"setup_complete"` to settings but
  these are not in `DEFAULT_SETTINGS` — not a crash (they're written, not read
  from the dict). But `DatabaseManager._create_tables()` seeds from
  `DEFAULT_SETTINGS`, so these keys won't pre-exist in the settings table.
- `pdf_service._load_company()` line 234 does
  `DEFAULT_SETTINGS.get("currency_symbol", "EGP")` — since the key is missing,
  this always returns the hardcoded `"EGP"` fallback, silently. Not a crash
  but a hidden bug.

---

## pdf_service.py Findings

**Company identity sourcing:**
`_load_company()` reads from the settings table via `self._db.get_all_settings()`
with full fallback to `COMPANY` dict from `config.py`. Keys it reads from
settings: `company_name`, `company_subtitle`, `company_phone`, `company_address`,
`company_tagline`, `company_social`, `currency_symbol`, `quote_deposit_pct`,
`quote_validity_days`, `invoice_footer`, `company_logo_path`. This is the most
complete settings reader in the codebase — Phase 2 work for `app.py` should
follow this same pattern.

**Footer status:**
A `"Generated by Abaad ERP"` credit **already exists** in `_sec_footer()`:
```python
Paragraph(
    f"<font size='7'>Generated by {APP_NAME} v{APP_VERSION} — "
    f"{datetime.now().strftime('%Y-%m-%d %H:%M')}</font>",
    s["Footer"])
```
This correctly uses the PRODUCT constant `APP_NAME`. Phase 7 requires no new
footer — only verify it's present and correctly placed.

**Other issues found:**
- `generate_text_receipt()` hardcodes `"EGP"` twice (lines 145, 165) instead of
  reading `currency_symbol` from settings. Out of scope for Phase 0 but notable.

---

## pyproject.toml State

```toml
[project]
name = "abaad-erp"
version = "5.0.0"
description = "Desktop ERP for a 3D printing service business — Ismailia, Egypt"
requires-python = ">=3.10"
dependencies = ["reportlab>=4.1.0"]

[project.optional-dependencies]
ocr     = ["Pillow>=10.4.0", "pytesseract>=0.3.13"]
charts  = ["matplotlib>=3.9.0"]
all     = ["Pillow>=10.4.0", "pytesseract>=0.3.13", "matplotlib>=3.9.0"]
dev     = ["pytest>=8.0.0", "pytest-cov>=5.0.0"]
```

- `[project.optional-dependencies]` dev section **exists** — `pip install -e ".[dev]"` would work.
- `requirements.txt` exists and pins exact versions: `reportlab==4.4.1`,
  `Pillow==11.2.1`, `pytesseract==0.3.13`, `matplotlib==3.10.3`.
- **Mismatch:** `requirements.txt` has no dev/test dependencies (no pytest).
  `pyproject.toml` puts them in `[dev]` extras. A developer who only runs
  `pip install -r requirements.txt` will not get pytest.
- **Tenant data in metadata:** `description` contains `"— Ismailia, Egypt"`.
  Should be a generic product description.

---

## Launchers State

| File | Exists | What it does | Issues |
|------|--------|-------------|--------|
| `setup.sh` | Yes | Checks `python3`, delegates to `scripts/install.py` | None |
| `SETUP.bat` | Yes | Checks `python`, delegates to `scripts\install.py` | None |
| `scripts/install.py` | Yes | Cross-platform: checks Python 3.10+, creates `venv/`, installs `requirements.txt`, prints success summary | Prints `admin / admin123` default credentials in plain text |
| `launch.sh` | Yes | Activates `venv/`, runs `python main.py` | No venv exists until setup.sh is run; no error if python version is wrong inside venv |
| `Launch_App.bat` | Yes | Activates venv (CPython or MSYS2 layout), runs `python main.py` | Same — no venv until SETUP.bat is run |
| `abaad-erp.desktop` | **No** | Ubuntu .desktop entry | File does not exist — referenced in CLAUDE.md layout as present in repo root |
| `scripts/install_linux.sh` | **No** | — | Referenced in ABAAD-SKILL.md file ownership table; replaced by `scripts/install.py` |
| `scripts/install_windows.bat` | **No** | — | Referenced in ABAAD-SKILL.md file ownership table; replaced by `scripts/install.py` |

---

## Acceptance Criteria

- [x] Full pytest output reported verbatim (9 failed, 156 passed, 1 skipped).
- [x] Complete file tree reported. Missing vs. planned files flagged.
- [x] Zero conflict markers (all `=======` hits confirmed as RST docstring dividers).
- [x] `DEFAULT_SETTINGS` keys fully listed. 4 missing keys flagged.
- [x] `COMPANY` dict contents reported. Phone, address, tagline, social flagged as real tenant data.
- [x] `main.py` issues listed (wizard not wired, no `db=` to LoginDialog).
- [x] `app.py` branding hits classified PRODUCT vs TENANT.
- [x] Full hardcoded-identity inventory table produced.
- [x] DB schema reported (DB exists — full schema above).
- [x] `setup_wizard.py` crash risks identified (2 KeyError crashes on missing keys).
- [x] `pdf_service.py` company-source and footer status reported.
- [x] `pyproject.toml` state reported.
- [x] Launcher files state reported.

---

## Open Questions / Notes for Master Chat

1. **Wizard not wired:** The boot sequence in `main.py` has no call to
   `run_setup_wizard_if_needed`. This must be added in Phase 1. The question is
   whether the wizard should run before the login screen (for fresh installs with
   no users) or after a successful admin login. Currently `LoginDialog` has no
   `db=` argument so it cannot check the settings table.

2. **`DEFAULT_SETTINGS` design decision:** Should `setup_complete`, `currency_symbol`,
   `app_subtitle`, and `company_logo_path` be added to `DEFAULT_SETTINGS` in
   `config.py` (Phase 1 fix), or should the wizard be updated to use `.get()` as
   a guard? Adding to `DEFAULT_SETTINGS` is cleaner and also makes
   `DatabaseManager._seed_settings()` pre-populate them.

3. **`COMPANY` dict neutralisation:** Phase 2 requires clearing the real contact
   info. Recommended: change `phone`, `address`, `tagline`, and `social` to empty
   strings. `name` can become `"My Business"` or `""`. `subtitle` can become
   `"3D Printing Services"` (generic) or `""`.

4. **`OLD_JSON_DB` / `OLD_USERS_JSON`:** Two tests explicitly require `OLD_JSON_DB`
   to be removed. Both constants are unread in any current code. Safe to delete
   in Phase 1.

5. **`abaad-erp.desktop` missing:** The `.desktop` file is in CLAUDE.md's repo
   layout but does not exist. It's a Phase 5 deliverable — just needs to be
   created (not a Phase 1 blocker).

6. **ABAAD-SKILL.md file-ownership table is stale:** References
   `scripts/install_linux.sh` and `scripts/install_windows.bat` which were
   replaced by the unified `scripts/install.py`. Update the skill doc in Phase 1.

7. **`settings` table has no PRIMARY KEY / NOT NULL on `key`:** Technically valid
   but could allow duplicate keys. Worth confirming `DatabaseManager` guards
   against this with `INSERT OR REPLACE`.

8. **`src/ui/tabs/stats_tab.py`:** This file exists on disk but is not in
   CLAUDE.md's repo layout and not mentioned in any phase prompt. Needs review
   to determine if it's active, dead, or a duplicate of `analytics_tab.py`.

9. **Dev environment not self-contained:** No venv in the repo, `pytest` not in
   `requirements.txt`, and the default Python (`/home/madboly/miniconda3/bin/python3`)
   does not have pytest. Phase 1 should document how to set up the dev environment
   (e.g., `pip install -e ".[dev]"`).
